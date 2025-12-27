import _ from 'lodash';
import { QueryParamDefinition } from 'postman-collection';

/**
 * Merges query parameters from target request into source request.
 * Preserves existing query parameter values and only adds new params or removes params not in latest.
 * @param {QueryParamDefinition[]} targetQuery - Query params from the target request
 * @param {QueryParamDefinition[]} sourceQuery - Query params from the current request
 * @returns {QueryParamDefinition[]} Merged query params array
 */
export function mergeRequestQueryParams(
  targetQuery: QueryParamDefinition[],
  sourceQuery: QueryParamDefinition[]
): QueryParamDefinition[] {
  if (!targetQuery || targetQuery.length === 0) {
    return [];
  }

  if (!sourceQuery || sourceQuery.length === 0) {
    return targetQuery;
  }

  const sourceQueryMap = new Map<string, QueryParamDefinition>();

  sourceQuery.forEach((param) => {
    if (param?.key) {
      sourceQueryMap.set(param.key, param);
    }
  });

  const mergedQuery: QueryParamDefinition[] = [];

  targetQuery.forEach((targetParam) => {
    if (!targetParam || _.isNil(targetParam.key)) {
      return;
    }

    const existingParam = sourceQueryMap.get(targetParam.key as string);

    if (existingParam) {
      mergedQuery.push({
        ...targetParam,
        value: existingParam.value,
        disabled: existingParam.disabled
      });
    } else {
      mergedQuery.push(targetParam);
    }
  });

  return mergedQuery;
}
