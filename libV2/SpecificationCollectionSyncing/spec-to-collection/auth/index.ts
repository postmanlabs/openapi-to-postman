import _ from 'lodash';
import { RequestAuthDefinition, Variable, VariableDefinition, VariableList } from 'postman-collection';

import { AUTH_TYPES, ALLOWED_AUTH_PARAM_KEYS_BY_TYPE } from '../../shared';

/**
 * Convert VariableDefinition array to a VariableList
 * @param {VariableDefinition[] | undefined} params - Variable definitions from auth
 * @returns {VariableList | undefined} VariableList instance or undefined
 */
export function convertAuthParamsToVariableList(params: VariableDefinition[] | undefined): VariableList | undefined {
  if (!params || params.length === 0) {
    return undefined;
  }

  const variables: Variable[] = [];

  for (const p of params) {
    if (p && typeof p.key === 'string') {
      variables.push(new Variable(p));
    }
  }

  if (variables.length === 0) {
    return undefined;
  }

  return new VariableList(null as any, variables);
}

/**
 * Merge only allowed auth parameter keys for the given auth type into result.
 *
 * @param {string|undefined} latestType Auth type key (e.g., apikey, oauth2)
 * @param {RequestAuthDefinition} latest Latest auth JSON
 * @param {RequestAuthDefinition} currentAuthObject Current/target auth JSON (mutated)
 */
export function mergeAllowedAuthParams(
  latestType: keyof RequestAuthDefinition | undefined,
  latest: RequestAuthDefinition,
  currentAuthObject: RequestAuthDefinition
) {
  const allowedKeys = ALLOWED_AUTH_PARAM_KEYS_BY_TYPE[latestType ?? ''];

  if (!latestType || !allowedKeys || allowedKeys.size === 0) {
    return currentAuthObject;
  }

  const latestParamsArray = latest[latestType];

  if (!Array.isArray(latestParamsArray)) {
    return currentAuthObject;
  }

  // Deep clone the current auth object to avoid mutating the original object
  const result: RequestAuthDefinition = _.cloneDeep(currentAuthObject),
    currentParamsArrayRaw = result[latestType],
    currentParamsArray = Array.isArray(currentParamsArrayRaw) ? currentParamsArrayRaw : [],
    currentByKey = new Map<string, VariableDefinition>();

  for (const p of currentParamsArray) {
    if (p && typeof p.key === 'string') {
      currentByKey.set(p.key, p);
    }
  }

  for (const param of latestParamsArray) {
    const key = typeof param?.key === 'string' ? param.key : undefined;

    if (!key || !allowedKeys.has(key)) {
      continue;
    }

    const existing = currentByKey.get(key);

    if (existing) {
      existing.value = param.value;

      if (param.type !== undefined) {
        existing.type = param.type;
      }
    } else {
      currentParamsArray.push({ key, value: param.value, type: param.type });
    }
  }

  if (latestType === AUTH_TYPES.API_KEY) {
    result.apikey = currentParamsArray;
  } else if (latestType === AUTH_TYPES.OAUTH2) {
    result.oauth2 = currentParamsArray;
  }

  return result;
}

/**
 * Build merged auth JSON without overwriting user secrets.
 *
 * @param {RequestAuthDefinition} latestAuth Auth from the latest collection (derived from spec)
 * @param {RequestAuthDefinition} currentAuth Auth from the current collection (may contain user values)
 */
export function mergeAuth(latestAuth: RequestAuthDefinition, currentAuth: RequestAuthDefinition) {
  if (!latestAuth || typeof latestAuth !== 'object') {
    return currentAuth;
  }

  const currentAuthObject = currentAuth && typeof currentAuth === 'object' ? currentAuth : {},
    latestType = latestAuth?.type;

  if (latestType) {
    currentAuthObject.type = latestType;
  }

  if (latestType === AUTH_TYPES.API_KEY || latestType === AUTH_TYPES.OAUTH2) {
    return mergeAllowedAuthParams(latestType, latestAuth, currentAuthObject);
  }

  // TODO: Remove other auth types from the result if they are present in the older collection.
  // It works in the present state as well since Postman itself does handle the "active auth" automatically
  //  based on the type field.

  return currentAuthObject;
}

/**
 * Merge authentication parameters for application.
 * Returns the auth type and parameters to be used, preserving user credentials where appropriate.
 *
 * @param {RequestAuthDefinition} mergedAuth - The merged authentication configuration
 * @param {RequestAuthDefinition} existingAuth - The existing authentication (may contain user secrets)
 *
 * @returns {{ type: string; params: VariableList | undefined } | null} Object with auth type and params, or null if no auth
 */
export function mergeAuthParams(
  mergedAuth: RequestAuthDefinition | undefined,
  existingAuth: RequestAuthDefinition | undefined
): { type: string; params: VariableList | undefined } | null {
  const latestType = mergedAuth?.type;

  if (!latestType) {
    return null;
  }

  if (latestType === AUTH_TYPES.BASIC || latestType === AUTH_TYPES.BEARER || latestType === AUTH_TYPES.DIGEST) {
    const preservedParams = existingAuth?.basic || existingAuth?.bearer || existingAuth?.digest;

    return { type: latestType, params: convertAuthParamsToVariableList(preservedParams) };
  }

  if (latestType === AUTH_TYPES.API_KEY || latestType === AUTH_TYPES.OAUTH2) {
    return { type: latestType, params: convertAuthParamsToVariableList(mergedAuth[latestType]) };
  }

  return null;
}
