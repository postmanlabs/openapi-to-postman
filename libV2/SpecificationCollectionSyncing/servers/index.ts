/**
 * Sync OpenAPI-derived `baseUrl*` collection variables during spec → collection sync.
 * Generation of path/operation servers and multi-baseUrl variables lives in CollectionGeneration.
 */

import { Collection, Variable } from 'postman-collection';

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
 * Sync `baseUrl*` collection variables from the latest spec-derived collection onto the current
 * collection. Updates values, adds missing keys, and drops `baseUrl*` keys the spec no longer has.
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
    staleKeys: string[] = [];

  currentCollectionState.variables.each((variable) => {
    if (
      variable.key &&
      BASE_URL_VARIABLE_PATTERN.test(variable.key) &&
      !latestKeys.has(variable.key)
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
