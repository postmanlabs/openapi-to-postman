'use strict';
import _ from 'lodash';
import type {
  SpecificationInput,
  Options,
  Callback,
  SyncOptions,
  OptionsCriteria,
  OptionDefinition,
  OptionsRecord,
  BundleResult,
  ValidationResult
} from './types';

export type {
  Options,
  SyncOptions,
  Callback,
  CollectionResult,
  BundleResult,
  ValidationResult
} from './types';

const { MODULE_VERSION } = require('../lib/schemapack.js');
const SchemaPack = require('../lib/schemapack.js').SchemaPack;
const UserError = require('../lib/common/UserError');

const DEFAULT_INVALID_ERROR = 'Provided definition is invalid';

/**
 * Converts an OpenAPI specification to a Postman Collection (v1 API)
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @param {Options} options - Conversion options
 * @param {Callback} cb - Callback function with conversion result
 * @returns {void}
 */
export function convert(input: SpecificationInput, options: Options, cb: Callback): void {
  var schema = new SchemaPack(input, options);

  if (schema.validated) {
    return schema.convert(cb);
  }
  return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
}

/**
 * Converts an OpenAPI specification to a Postman Collection (v2 API)
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @param {Options} options - Conversion options
 * @param {Callback} cb - Callback function with conversion result
 * @returns {void}
 */
export function convertV2(input: SpecificationInput, options: Options, cb: Callback): void {
  var schema = new SchemaPack(input, options, MODULE_VERSION.V2);

  if (schema.validated) {
    return schema.convertV2(cb);
  }

  return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
}

/**
 * Converts an OpenAPI specification to a Postman Collection (v2 API) with type fetching enabled
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @param {Options} options - Conversion options
 * @param {Callback} cb - Callback function with conversion result
 * @returns {void}
 */
export function convertV2WithTypes(input: SpecificationInput, options: Options, cb: Callback): void {
  const enableTypeFetching = true;
  var schema = new SchemaPack(input, options, MODULE_VERSION.V2, enableTypeFetching);

  if (schema.validated) {
    return schema.convertV2(cb);
  }

  return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
}

/**
 * Validates an OpenAPI specification
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @returns {ValidationResult} Validation result
 */
export function validate(input: SpecificationInput): ValidationResult {
  var schema = new SchemaPack(input);
  return schema.validationResult;
}

/**
 * Retrieves metadata from an OpenAPI specification
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @param {Callback} cb - Callback function with metadata result
 * @returns {void}
 */
export function getMetaData(input: SpecificationInput, cb: Callback): void {
  var schema = new SchemaPack(input);
  schema.getMetaData(cb);
}

/**
 * Merges and validates an OpenAPI specification
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @param {Callback} cb - Callback function with merge and validation result
 * @returns {void}
 */
export function mergeAndValidate(input: SpecificationInput, cb: Callback): void {
  var schema = new SchemaPack(input);
  schema.mergeAndValidate(cb);
}

/**
 * Gets conversion options
 * @param {string} mode - Mode for options ('document' or 'use')
 * @param {OptionsCriteria} criteria - Criteria for filtering options
 * @returns {OptionDefinition[] | OptionsRecord} Option definitions or option values
 */
export function getOptions(mode?: string, criteria?: OptionsCriteria): OptionDefinition[] | OptionsRecord {
  return SchemaPack.getOptions(mode, criteria);
}

/**
 * Gets sync options
 * @param {string} mode - Mode for options ('document' or 'use')
 * @returns {OptionDefinition[] | OptionsRecord} Option definitions or option values
 */
export function getSyncOptions(mode?: string): OptionDefinition[] | OptionsRecord {
  return SchemaPack.getSyncOptions(mode);
}

/**
 * Detects root files in a multi-file OpenAPI specification
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @returns {Promise<BundleResult>} Promise with detection result
 */
export async function detectRootFiles(input: SpecificationInput): Promise<BundleResult> {
  var schema = new SchemaPack(input);
  return schema.detectRootFiles();
}

/**
 * Detects related files in a multi-file OpenAPI specification
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @returns {Promise<BundleResult>} Promise with detection result
 */
export async function detectRelatedFiles(input: SpecificationInput): Promise<BundleResult> {
  var schema = new SchemaPack(input);
  return schema.detectRelatedFiles();
}

/**
 * Bundles a multi-file OpenAPI specification into a single file
 * @param {SpecificationInput} input - The OpenAPI specification input with optional bundling options
 * @returns {Promise<BundleResult>} Promise with bundled specification
 */
export async function bundle(input: SpecificationInput & { options?: Options }): Promise<BundleResult> {
  var schema = new SchemaPack(input, input.options ?? {});
  return schema.bundle();
}

/**
 * Syncs a Postman Collection with changes from an OpenAPI specification
 * @param {SpecificationInput} input - The OpenAPI specification input
 * @param {Options} options - Conversion options
 * @param {object} currentCollection - The current Postman Collection to sync
 * @param {SyncOptions | null} syncOptions - Sync options
 * @param {Callback} cb - Callback function with sync result
 * @returns {void}
 */
export function syncCollection(
  input: SpecificationInput,
  options: Options,
  currentCollection: object,
  syncOptions: SyncOptions | null,
  cb: Callback
): void {
  const enableTypeFetching = true;
  var schema = new SchemaPack(input, options, MODULE_VERSION.V2, enableTypeFetching);

  if (schema.validated) {
    return schema.syncCollection(currentCollection, syncOptions, cb);
  }

  return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
}

export { SchemaPack };
