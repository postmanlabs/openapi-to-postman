import _ from 'lodash';
import { RequestBodyDefinition } from 'postman-collection';

import { SPACE_COUNT } from '../../shared';

/**
 * Deep merges two objects, preserving values from current when keys exist in both.
 * Adds keys from target that don't exist in source.
 * Removes keys from source that don't exist in target.
 * If source is an empty object {}, uses all keys from target.
 * @param {unknown} target - Target object (source of truth for structure)
 * @param {unknown} source - Source object (source of truth for values)
 * @returns {Record<string, unknown> | unknown} Merged object
 */
function deepMergeBodyObjects(target: unknown, source: unknown): Record<string, unknown> | unknown {
  if (!_.isPlainObject(target) || !_.isPlainObject(source)) {
    return target;
  }

  // Cast to Record<string, unknown> after type guard
  const targetObj = target as Record<string, unknown>,
    sourceObj = source as Record<string, unknown>;

  if (Object.keys(sourceObj).length === 0) {
    return targetObj;
  }

  const result: Record<string, unknown> = {};

  Object.keys(targetObj).forEach((key) => {
    if (Object.hasOwn(sourceObj, key)) {
      const targetValue = targetObj[key],
        sourceValue = sourceObj[key];

      // Recursively merge if both values are objects
      if (_.isPlainObject(targetValue) && _.isPlainObject(sourceValue)) {
        result[key] = deepMergeBodyObjects(targetValue, sourceValue);
      } else if (_.isPlainObject(targetValue) && !_.isEmpty(targetValue)) {
        result[key] = targetValue;
      } else {
        result[key] = sourceValue;
      }
    } else {
      result[key] = targetObj[key];
    }
  });

  return result;
}

/**
 * Merges body.raw from target request into source request.
 * Preserves current values for existing keys, adds new keys from target,
 * and removes keys that don't exist in target.
 * @param {string} targetBodyRaw - Body.raw from the target request (JSON string)
 * @param {string} sourceBodyRaw - Body.raw from the source request (JSON string)
 * @returns {string} The merged body.raw as a JSON string
 */
export function mergeRequestAndResponseBodyRaw(
  targetBodyRaw: string | undefined,
  sourceBodyRaw: string | undefined
): string | undefined {
  if (!targetBodyRaw) {
    return undefined;
  }

  if (!sourceBodyRaw) {
    return targetBodyRaw;
  }

  try {
    const targetBody = JSON.parse(targetBodyRaw),
      sourceBody = JSON.parse(sourceBodyRaw),
      merged = deepMergeBodyObjects(targetBody, sourceBody);

    return JSON.stringify(merged, null, SPACE_COUNT);
  } catch (error) {
    return targetBodyRaw;
  }
}

/**
 * Merges body.raw data in request JSON
 * @param {RequestBodyDefinition | undefined} targetBody - Target request body
 * @param {RequestBodyDefinition | undefined} sourceBody - Source request body
 * @returns {RequestBodyDefinition | undefined} Merged request body
 */
export function mergeRequestBodyData(
  targetBody: RequestBodyDefinition | undefined,
  sourceBody: RequestBodyDefinition | undefined
): RequestBodyDefinition | undefined {
  if (!targetBody) {
    return undefined;
  }

  if (!sourceBody) {
    return targetBody;
  }

  if (targetBody.mode === 'raw' && sourceBody.mode === 'raw') {
    return {
      ...targetBody,
      raw: mergeRequestAndResponseBodyRaw(targetBody.raw, sourceBody.raw)
    };
  } else if (targetBody.mode === 'raw') {
    return targetBody;
  }

  // Preserve current body when mode is not raw (formdata, urlencoded, file, graphql)
  return sourceBody;
}
