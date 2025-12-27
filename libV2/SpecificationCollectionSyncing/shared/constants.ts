/**
 * Common constants used across SpecificationCollection modules
 */

import { SyncOptions } from './types';

/**
 * Number of spaces for JSON formatting
 */
export const SPACE_COUNT = 2;

/**
 * Default response code used in OpenAPI specifications
 */
export const DEFAULT_RESPONSE_CODE_IN_OAS = 'default';

/**
 * Authentication types supported in the system
 */
export const AUTH_TYPES = {
  BASIC: 'basic',
  BEARER: 'bearer',
  DIGEST: 'digest',
  API_KEY: 'apikey',
  OAUTH2: 'oauth2'
} as const;

/**
 * Allowed authentication parameter keys by authentication type
 * TODO: Can be moved to spec-to-collection module
 */
export const ALLOWED_AUTH_PARAM_KEYS_BY_TYPE: Record<string, Set<string>> = {
  [AUTH_TYPES.API_KEY]: new Set(['in', 'key']),
  [AUTH_TYPES.OAUTH2]: new Set([
    'scope',
    'authUrl',
    'authorizationUrl',
    'accessTokenUrl',
    'tokenUrl',
    'grant_type',
    'refreshUrl',
    'refresh_token_url'
  ])
};

export const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  syncExamples: false
};
