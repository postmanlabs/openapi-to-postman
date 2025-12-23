/**
 * Path Parameter Extraction and Mapping Utilities
 * Functions for extracting Postman variables from paths and mapping specification path parameters
 */

import { Variable } from 'postman-collection';

/**
 * Extracts variables to add when {{xyz}} components in current path match :xyz parameters in latest path.
 * When a {{xyz}} component in current path matches a :xyz component in latest path,
 * the {{xyz}} variable is returned for addition to the URL variables.
 *
 * @param {string[]} latestPath - The latest path components to sync from (may contain :xyz parameters)
 * @param {string[]} currentPath - The current path components (may contain {{xyz}} variables)
 * @returns {Array<Variable>} Array of variables to add to the URL
 */
export function extractPostmanVariablesFromPathComponents(latestPath: string[], currentPath: string[]): Variable[] {
  if (!latestPath || !currentPath || latestPath.length !== currentPath.length) {
    return [];
  }

  const variablesToAdd: Variable[] = [];

  for (let i = 0; i < latestPath.length; i++) {
    const latestComponent = latestPath[i],
      currentComponent = currentPath[i],
      isCurrentVariable =
        currentComponent.startsWith('{{') && currentComponent.endsWith('}}') && currentComponent.length > 4,
      isLatestParameter = latestComponent.startsWith(':') && latestComponent.length > 1;

    if (isCurrentVariable && isLatestParameter) {
      // Extract parameter name from :xyz format
      const parameterName = latestComponent.slice(1);

      variablesToAdd.push(
        new Variable({
          key: parameterName,
          value: currentComponent
        })
      );
    }
  }

  return variablesToAdd;
}
