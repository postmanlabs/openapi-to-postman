/**
 * Path matching utilities for Collection-related operations
 */

/**
 * Checks if a component is a parameter in either ":xyz" or "{{xyz}}" format.
 *
 * @param {string} component - The component to check
 * @returns {boolean} True if the component is a parameter, false otherwise
 */
function isParameterComponent(component: string): boolean {
  if (!component) {
    return false;
  }

  // Check for ":xyz" format
  if (component.startsWith(':') && component.length > 1) {
    return true;
  }

  // Check for "{{xyz}}" format
  return component.startsWith('{{') && component.endsWith('}}') && component.length > 4;
}

/**
 * Matches two identifiers by comparing their components.
 * - Exact string components must match exactly
 * - Parameter components in formats ":xyz" and "{{xyz}}" match each other at the same position
 * - Both identifiers must have the same number of components when split by "/"
 *
 * @param {string} identifier1 - First identifier to compare
 * @param {string} identifier2 - Second identifier to compare
 * @returns {boolean} True if identifiers match according to the rules, false otherwise
 */
export function matchIdentifiers(identifier1: string, identifier2: string): boolean {
  if (!identifier1 || !identifier2) {
    return false;
  }

  const components1 = identifier1.split('/'),
    components2 = identifier2.split('/');

  if (components1.length !== components2.length) {
    return false;
  }

  for (let i = 0; i < components1.length; i++) {
    const comp1 = components1[i],
      comp2 = components2[i],
      isParam1 = isParameterComponent(comp1),
      isParam2 = isParameterComponent(comp2);

    if (isParam1 && isParam2) {
      // Both are parameters, we ignore their names and treat them as matching
      continue;
    }

    if (isParam1 || isParam2) {
      // Only one is a parameter, they don't match
      return false;
    }

    // Both are regular strings, must match exactly
    if (comp1 !== comp2) {
      return false;
    }
  }

  return true;
}
