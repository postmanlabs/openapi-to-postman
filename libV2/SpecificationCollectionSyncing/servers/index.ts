/**
 * Sync OpenAPI-derived `baseUrl*` collection variables during spec → collection sync.
 * Generation of path/operation servers and multi-baseUrl variables lives in CollectionGeneration.
 */

import { Collection, Variable } from 'postman-collection';

export const BASE_URL_VARIABLE_PATTERN = /^baseUrl(\d+)?$/;

/**
 * Sync `baseUrl*` collection variables from the latest spec-derived collection onto the current
 * collection. Updates values, adds missing keys, and drops `baseUrl*` keys the spec no longer has.
 * Other collection variables are left untouched.
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
}
