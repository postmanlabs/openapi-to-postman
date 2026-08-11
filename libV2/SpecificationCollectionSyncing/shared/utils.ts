/**
 * General utility functions shared across SpecificationCollection modules
 */

import _ from 'lodash';
import { Item } from 'postman-collection';

/**
 * Get the request identifier (method + path) for an item.
 * @param {Item} item - The item to get the identifier for.
 * @returns {string} The request identifier (method + path)
 */
export function getRequestIdentifier(item: Item): string {
  // @ts-expect-error - Suppress type-checking for .getPath() as its type validations are defined incorrectly
  // and gives boolean assignment error
  // Correct usage can be found: https://www.postmanlabs.com/postman-collection/Url.html#getPath
  // Tracking the fix https://postmanlabs.atlassian.net/browse/AB-610
  return item.request.method + item.request.url.getPath(true);
}

/**
 * Recursively clones a fragment of the specification while removing any
 * vendor-extension keys (those starting with "x-") and the OpenAPI `default` key.
 * This is used solely for equality comparisons so that differences due to `default` and vendor extensions
 * do not cause `$ref` expansion or unnecessary diffs.
 *
 * @param {unknown} node - The fragment (object/array/primitive) from which keys should be stripped.
 * @returns {unknown} A deep clone of the fragment with all `x-*` and `default` keys removed.
 * Primitive values are returned unchanged.
 */
export function stripVendorExtensions(node: unknown): unknown {
  if (!node || typeof node !== 'object') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(stripVendorExtensions);
  }

  const result: Record<string, unknown> = {};

  Object.entries(node as Record<string, unknown>).forEach(([k, v]) => {
    if (!k.startsWith('x-') && k !== 'default') {
      result[k] = stripVendorExtensions(v);
    }
  });

  return result;
}

/**
 * Checks if an object contains a $ref property.
 * @param {unknown} obj The object to check.
 * @returns {boolean} True if the object contains a $ref property at the top level, otherwise false.
 */
export function isRef(obj: unknown): obj is { $ref: string } {
  return Boolean(obj) && typeof obj === 'object' && obj !== null && Object.hasOwn(obj as object, '$ref');
}

/**
 * Determines whether two fragments are deeply equal after removing all
 * vendor-extensions (`x-*` keys).
 *
 * @param {unknown} firstFragment - First fragment to compare.
 * @param {unknown} secondFragment - Second fragment to compare.
 * @returns {boolean} `true` if the fragments are equal once vendor extensions are ignored, otherwise `false`.
 */
export function isEqualAfterIgnoringVendorExtensions(firstFragment: unknown, secondFragment: unknown): boolean {
  return _.isEqual(stripVendorExtensions(firstFragment), stripVendorExtensions(secondFragment));
}

/**
 * Deep merge function that preserves vendor extensions at all levels
 * and ignores the `default` key from `latest` as per the rules:
 * - If `current` has a `default`, it is preserved.
 * - If `current` does not have `default`, it is removed from the merged result even if present in `latest`.
 * @param {unknown} latest - The latest object (source of truth for standard properties)
 * @param {unknown} current - The current object (source for vendor extensions)
 * @returns {unknown} Merged object with vendor extensions preserved at all levels
 */
export function deepMergeWithVendorExtensions(latest: unknown, current: unknown): unknown {
  if (!latest || typeof latest !== 'object') {
    return latest;
  }

  if (!current || typeof current !== 'object') {
    return latest;
  }

  if (Array.isArray(latest)) {
    if (!Array.isArray(current)) {
      return latest;
    }

    const result = [...latest];

    for (let i = 0; i < Math.max(latest.length, current.length); i++) {
      if (i < latest.length && i < current.length) {
        result[i] = deepMergeWithVendorExtensions(latest[i], current[i]);
      }
    }

    return result;
  }

  if (Array.isArray(current)) {
    return latest;
  }

  const latestObj = latest as Record<string, unknown>,
    currentObj = current as Record<string, unknown>,
    result = { ...latestObj };

  Object.keys(currentObj).forEach((key) => {
    if (key.startsWith('x-')) {
      result[key] = currentObj[key];
    }
    else if (latestObj[key] && currentObj[key]) {
      result[key] = deepMergeWithVendorExtensions(latestObj[key], currentObj[key]);
    }
  });

  // default handling rules:
  // - If both have `default`, take it from latest (even if unequal)
  // - If only latest has `default`, remove it (ignore introduction from latest)
  // - If only current has `default`, keep it (propagate from current)
  const hasCurrentDefault = Object.hasOwn(currentObj, 'default'),
    hasLatestDefault = Object.hasOwn(latestObj, 'default');

  if (hasCurrentDefault && hasLatestDefault) {
    result.default = latestObj.default;
  }
  else if (!hasCurrentDefault && hasLatestDefault) {
    delete result.default;
  }
  else if (hasCurrentDefault && !hasLatestDefault) {
    result.default = currentObj.default;
  }

  return result;
}

/**
 * Sentinel (Unicode Private Use Area character) used to temporarily quote bare Postman variables so a
 * body containing them parses as valid JSON, and to locate/unwrap them again after merging. U+E000 is
 * not escaped by `JSON.stringify` and is extremely unlikely to appear in a real request/response body.
 */
const PM_VARIABLE_SENTINEL = '\uE000';

/**
 * Matches a sentinel-wrapped Postman variable in serialized JSON, e.g. `"\uE000{{customer_id}}\uE000"`.
 * Non-greedy so adjacent wrapped variables are each restored independently.
 */
const PM_VARIABLE_SENTINEL_PATTERN = new RegExp(`"${PM_VARIABLE_SENTINEL}([\\s\\S]*?)${PM_VARIABLE_SENTINEL}"`, 'g');

/**
 * Wraps bare (unquoted) Postman variables — e.g. the `{{customer_id}}` in `{ "id": {{customer_id}} }`
 * — in a sentinel-marked string so the body becomes valid JSON and can be parsed and merged. Variables
 * that already sit inside a JSON string (e.g. `"Bearer {{token}}"`) are left untouched because they are
 * already valid JSON. A JSON-string scanner is used (instead of a regex) so that `{{...}}` occurrences
 * inside string literals are correctly ignored, including strings containing escaped quotes. For example,
 * in `{ "note": "value is \"{{x}}\"", "id": {{x}} }` only the second (bare) `{{x}}` is wrapped; the first
 * one is left untouched because it sits inside a string whose escaped quotes do not end the string early.
 * @param {string} raw - Raw body which may contain bare Postman variables
 * @returns {string} A JSON-parseable body with bare variables sentinel-wrapped
 */
export function protectBarePostmanVariables(raw: string): string {
  let result = '',
    inString = false;

  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];

    if (inString) {
      result += char;

      if (char === '\\') {
        // Copy the escaped character verbatim so an escaped quote (\") doesn't prematurely end the string.
        index += 1;

        if (index < raw.length) {
          result += raw[index];
        }
      }
      else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;

      continue;
    }

    // A bare Postman variable begins with `{{` while outside of any string literal.
    if (char === '{' && raw[index + 1] === '{') {
      const end = raw.indexOf('}}', index + 2);

      if (end !== -1) {
        const token = raw.slice(index, end + 2);

        result += `"${PM_VARIABLE_SENTINEL}${token}${PM_VARIABLE_SENTINEL}"`;
        index = end + 1;

        continue;
      }
    }

    result += char;
  }

  return result;
}

/**
 * Restores bare Postman variables that were sentinel-wrapped by {@link protectBarePostmanVariables},
 * turning `"\uE000{{customer_id}}\uE000"` in the serialized JSON back into a bare `{{customer_id}}`.
 * @param {string} raw - Serialized JSON possibly containing sentinel-wrapped variables
 * @returns {string} Body with bare variables restored to their original unquoted form
 */
export function restoreBarePostmanVariables(raw: string): string {
  return raw.replace(PM_VARIABLE_SENTINEL_PATTERN, '$1');
}

