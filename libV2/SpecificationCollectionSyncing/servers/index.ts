/**
 * Sync OpenAPI-derived `baseUrl*` collection variables during spec → collection sync.
 * Generation of path/operation servers and multi-baseUrl variables lives in CollectionGeneration.
 */

import { Collection, Url, Variable } from 'postman-collection';

export const BASE_URL_VARIABLE_PATTERN = /^baseUrl(\d+)?$/;

const VARIABLE_REFERENCE_PATTERN = /\{\{([^{}]+)\}\}/g;

/**
 * Names of the variables referenced (as `{{name}}`) in a value.
 * @param {unknown} value - Variable value
 * @returns {string[]} Referenced variable names
 */
function getReferencedVariableNames(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }

  return Array.from(value.matchAll(VARIABLE_REFERENCE_PATTERN), (match) => {
    return match[1];
  });
}

/**
 * `baseUrl*` collection variables as key -> value, in collection order.
 * @param {Collection} collection - Collection to read
 * @returns {Map<string, unknown>} Server variables
 */
function getBaseUrlVariables(collection: Collection): Map<string, unknown> {
  const variables = new Map<string, unknown>();

  collection.variables.each((variable) => {
    if (variable.key && BASE_URL_VARIABLE_PATTERN.test(variable.key) && !variables.has(variable.key)) {
      variables.set(variable.key, variable.value);
    }
  });

  return variables;
}

/**
 * Calls back with every request URL in the collection, including the original requests of saved responses.
 * @param {Collection} collection - Collection to walk
 * @param {Function} callback - Receives each URL
 */
function forEachRequestUrl(collection: Collection, callback: (url: Url) => void): void {
  collection.forEachItem((item) => {
    if (item.request?.url) {
      callback(item.request.url);
    }

    item.responses?.each((response) => {
      if (response.originalRequest?.url) {
        callback(response.originalRequest.url);
      }
    });
  });
}

/**
 * Variable keys follow server order, so a server added to or removed from the spec shifts the keys of
 * the servers after it (e.g. a path server moves from `baseUrl1` to `baseUrl2`). Before the requests are
 * merged, renames the current collection's `baseUrl*` variables (and their references in requests and
 * saved responses) to the latest key of the same server URL, so requests and responses that aren't
 * updated from the latest spec (orphans, preserved examples) keep pointing at their server.
 * A server no longer in the spec keeps its key unless a renamed server takes it, then it gets a free key.
 * @param {Collection} latestCollectionState - Collection generated from the latest spec
 * @param {Collection} currentCollectionState - Collection being synced (mutated)
 * @returns {void}
 */
export function alignServerVariableKeys(
  latestCollectionState: Collection,
  currentCollectionState: Collection
): void {
  const latestVariables = getBaseUrlVariables(latestCollectionState),
    currentVariables = getBaseUrlVariables(currentCollectionState),
    latestKeyByValue = new Map<unknown, string>(),
    renames = new Map<string, string>();

  latestVariables.forEach((value, key) => {
    if (!latestKeyByValue.has(value)) {
      latestKeyByValue.set(value, key);
    }
  });

  currentVariables.forEach((value, key) => {
    const latestKey = latestKeyByValue.get(value);

    if (latestKey && latestKey !== key) {
      renames.set(key, latestKey);
    }
  });

  if (renames.size === 0) {
    return;
  }

  const takenKeys = new Set([...latestVariables.keys(), ...currentVariables.keys()]),
    renamedTo = new Set(renames.values());

  currentVariables.forEach((_value, key) => {
    if (renames.has(key) || !renamedTo.has(key)) {
      return;
    }

    let index = 1;

    while (takenKeys.has(`baseUrl${index}`)) {
      index += 1;
    }

    takenKeys.add(`baseUrl${index}`);
    renames.set(key, `baseUrl${index}`);
  });

  const renameReferences = (value: string) => {
    return value.replace(VARIABLE_REFERENCE_PATTERN, (match, name) => {
      return renames.has(name) ? `{{${renames.get(name)}}}` : match;
    });
  };

  forEachRequestUrl(currentCollectionState, (url) => {
    if (Array.isArray(url.host)) {
      url.host = url.host.map(renameReferences);
    }
  });

  // Re-add the variables so the list is indexed by the new keys. Two current keys may hold the same URL,
  // so only the first variable per key is kept.
  const variables = currentCollectionState.variables.all().map((variable) => {
      return variable.toJSON();
    }),
    seenKeys = new Set<string>();

  currentCollectionState.variables.clear();
  variables.forEach((variable) => {
    const key = variable.key ?? '';

    if (BASE_URL_VARIABLE_PATTERN.test(key)) {
      variable.key = renames.get(key) ?? key;

      if (seenKeys.has(variable.key)) {
        return;
      }

      seenKeys.add(variable.key);
    }

    currentCollectionState.variables.add(new Variable(variable));
  });
}

/**
 * Sync `baseUrl*` collection variables from the latest spec-derived collection onto the current
 * collection. Updates values, adds missing keys, and drops `baseUrl*` keys the spec no longer has
 * unless a request or saved response in the current collection still uses them.
 * Server variables referenced by those values (e.g. `{{region}}`) are added when missing; existing
 * values are kept since users commonly change them. Other collection variables are left untouched.
 * @param {Collection} latestCollectionState - Collection generated from the latest spec
 * @param {Collection} currentCollectionState - Collection being synced
 * @returns {void}
 */
export function syncCollectionServerVariables(
  latestCollectionState: Collection,
  currentCollectionState: Collection
): void {
  const latestBaseUrlVars: Variable[] = [];

  latestCollectionState.variables.each((variable) => {
    if (variable.key && BASE_URL_VARIABLE_PATTERN.test(variable.key)) {
      latestBaseUrlVars.push(variable);
    }
  });

  // Nothing spec-derived to sync against; never strip the current collection's `baseUrl*` variables.
  if (latestBaseUrlVars.length === 0) {
    return;
  }

  const latestKeys = new Set(
      latestBaseUrlVars.map((variable) => {
        return variable.key as string;
      })
    ),
    referencedKeys = new Set<string>(),
    staleKeys: string[] = [];

  forEachRequestUrl(currentCollectionState, (url) => {
    getReferencedVariableNames(url.getRemote()).forEach((name) => {
      referencedKeys.add(name);
    });
  });

  currentCollectionState.variables.each((variable) => {
    if (
      variable.key &&
      BASE_URL_VARIABLE_PATTERN.test(variable.key) &&
      !latestKeys.has(variable.key) &&
      !referencedKeys.has(variable.key)
    ) {
      staleKeys.push(variable.key);
    }
  });

  staleKeys.forEach((key) => {
    currentCollectionState.variables.remove((candidate) => {
      return candidate.key === key;
    }, currentCollectionState.variables);
  });

  latestBaseUrlVars.forEach((latestVariable) => {
    const currentVariable = currentCollectionState.variables.one(
      latestVariable.key as string
    );

    if (currentVariable) {
      currentVariable.value = latestVariable.value;
    }
    else {
      currentCollectionState.variables.add(
        new Variable({
          key: latestVariable.key,
          value: latestVariable.value
        })
      );
    }
  });

  latestBaseUrlVars.forEach((latestVariable) => {
    getReferencedVariableNames(latestVariable.value).forEach((name) => {
      const latestServerVariable = latestCollectionState.variables.one(name);

      if (!latestServerVariable || currentCollectionState.variables.has(name)) {
        return;
      }

      currentCollectionState.variables.add(
        new Variable({
          key: name,
          value: latestServerVariable.value
        })
      );
    });
  });
}
