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
  // @ts-expect-error - Suppress type-checking for .getPath() as its type validations are defined incorrectly and gives boolean assignment error
  // Correct usage can be found: https://www.postmanlabs.com/postman-collection/Url.html#getPath
  // Tracking the fix https://postmanlabs.atlassian.net/browse/AB-610
  return item.request.method + item.request.url.getPath(true);
}


// TODO: Move the below functions within collection-to-spec module

/**
 * Recursively clones a fragment of the specification while removing any
 * vendor-extension keys (those starting with "x-") and the OpenAPI `default` key.
 * This is used solely for equality comparisons so that differences due to `default` and vendor extensions
 * do not cause `$ref` expansion or unnecessary diffs.
 *
 * @param {unknown} node - The fragment (object/array/primitive) from which keys should be stripped.
 * @returns {unknown} A deep clone of the fragment with all `x-*` and `default` keys removed. Primitive values are returned unchanged.
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
    } else if (latestObj[key] && currentObj[key]) {
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
  } else if (!hasCurrentDefault && hasLatestDefault) {
    delete result.default;
  } else if (hasCurrentDefault && !hasLatestDefault) {
    result.default = currentObj.default;
  }

  return result;
}

