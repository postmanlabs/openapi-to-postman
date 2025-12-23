import type {
  ConverterInput,
  ConversionOptions,
  ConversionCallback,
  ConversionResult,
  ValidationResult,
  OptionDefinition,
  SyncOptions,
  SyncCollectionInput,
  SyncResult
} from './types';

import { Collection } from 'postman-collection';
import { syncCollection as syncCollectionState } from '../libV2/SpecificationCollectionSyncing';

const { MODULE_VERSION, SchemaPack } = require('../../lib/schemapack.js');
const _ = require('lodash');
const UserError = require('../../lib/common/UserError');

const DEFAULT_INVALID_ERROR = 'Provided definition is invalid';

/**
 * Converts an OpenAPI specification to a Postman Collection using the V1 interface.
 *
 * @param input - The OpenAPI specification input
 * @param options - Conversion options
 * @param cb - Callback function
 */
export function convert(
  input: ConverterInput,
  options: ConversionOptions,
  cb: ConversionCallback
): void {
  const schema = new SchemaPack(input, options);

  if (schema.validated) {
    return schema.convert(cb);
  }
  return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
}

/**
 * Converts an OpenAPI specification to a Postman Collection using the V2 interface.
 *
 * @param input - The OpenAPI specification input
 * @param options - Conversion options
 * @param cb - Callback function
 */
export function convertV2(
  input: ConverterInput,
  options: ConversionOptions,
  cb: ConversionCallback
): void {
  const schema = new SchemaPack(input, options, MODULE_VERSION.V2);

  if (schema.validated) {
    return schema.convertV2(cb);
  }

  return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
}

/**
 * Converts an OpenAPI specification to a Postman Collection with type information.
 *
 * @param input - The OpenAPI specification input
 * @param options - Conversion options
 * @param cb - Callback function
 */
export function convertV2WithTypes(
  input: ConverterInput,
  options: ConversionOptions,
  cb: ConversionCallback
): void {
  const enableTypeFetching = true;
  const schema = new SchemaPack(input, options, MODULE_VERSION.V2, enableTypeFetching);

  if (schema.validated) {
    return schema.convertV2(cb);
  }

  return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
}

/**
 * Validates an OpenAPI specification.
 *
 * @param input - The OpenAPI specification input to validate
 * @returns Validation result
 */
export function validate(input: ConverterInput): ValidationResult {
  const schema = new SchemaPack(input);
  return schema.validationResult;
}

/**
 * Gets metadata from an OpenAPI specification.
 *
 * @param input - The OpenAPI specification input
 * @param cb - Callback function
 */
export function getMetaData(
  input: ConverterInput,
  cb: (error: Error | null, result?: { result: boolean; name?: string; output?: Array<{ type: string; name: string }> }) => void
): void {
  const schema = new SchemaPack(input);
  schema.getMetaData(cb);
}

/**
 * Merges multiple files and validates the result.
 *
 * @param input - The OpenAPI specification input
 * @param cb - Callback function
 */
export function mergeAndValidate(
  input: ConverterInput,
  cb: (error: Error | null, result?: ValidationResult) => void
): void {
  const schema = new SchemaPack(input);
  schema.mergeAndValidate(cb);
}

/**
 * Gets the available conversion options.
 *
 * @param mode - 'document' returns detailed option descriptions, 'use' returns default values
 * @param criteria - Filter criteria for options
 * @returns Array of option definitions or object with default values
 */
export function getOptions(
  mode?: 'document' | 'use',
  criteria?: {
    version?: '2.0' | '3.0' | '3.1';
    moduleVersion?: 'v1' | 'v2';
    usage?: Array<'CONVERSION' | 'VALIDATION' | 'BUNDLE'>;
    external?: boolean;
  }
): OptionDefinition[] | Record<string, unknown> {
  return SchemaPack.getOptions(mode, criteria);
}

/**
 * Detects root files in a multi-file API specification.
 *
 * @param input - The folder input containing multiple files
 * @returns Promise with root files information
 */
export async function detectRootFiles(
  input: ConverterInput
): Promise<{ result: boolean; output?: { data: Array<{ path: string }> } }> {
  const schema = new SchemaPack(input);
  return schema.detectRootFiles();
}

/**
 * Detects related files from a root file perspective.
 *
 * @param input - The folder input containing multiple files
 * @returns Promise with related files information
 */
export async function detectRelatedFiles(
  input: ConverterInput
): Promise<{ result: boolean; output?: unknown }> {
  const schema = new SchemaPack(input);
  return schema.detectRelatedFiles();
}

/**
 * Bundles a multi-file API specification into a single file.
 *
 * @param input - The folder input containing multiple files
 * @returns Promise with bundled specification
 */
export async function bundle(
  input: ConverterInput & { options?: ConversionOptions }
): Promise<{ result: boolean; output?: unknown }> {
  const schema = new SchemaPack(input, _.has(input, 'options') ? input.options : {});
  return schema.bundle();
}

/**
 * Syncs a Postman collection with the latest OpenAPI specification.
 *
 * This method converts the specification to a collection using convertV2,
 * then syncs the generated collection state with the existing collection,
 * preserving user modifications where appropriate.
 *
 * @param input - The sync input containing spec and collection
 * @param conversionOptions - Options for the OpenAPI to Collection conversion
 * @param syncOptions - Options controlling what should be synced
 * @param cb - Callback function with the synced collection result
 */
export function syncCollection(
  input: SyncCollectionInput,
  conversionOptions: ConversionOptions,
  syncOptions: SyncOptions,
  cb: (error: Error | null, result?: SyncResult) => void
): void {
  const { spec, collection } = input;

  let currentCollection: Collection;
  try {
    const collectionData = typeof collection === 'string' ? JSON.parse(collection) : collection;
    currentCollection = new Collection(collectionData);
  } catch (parseError) {
    return cb(null, {
      result: false,
      reason: `Failed to parse collection: ${parseError instanceof Error ? parseError.message : String(parseError)}`
    });
  }

  convertV2(spec, conversionOptions, (err: Error | null, result?: ConversionResult) => {
    if (err) {
      return cb(err);
    }

    if (!result || !result.result) {
      return cb(null, {
        result: false,
        reason: (result as { reason?: string })?.reason || 'Conversion failed'
      });
    }

    try {
      const latestCollectionData = result.output[0].data;
      const latestCollection = new Collection(latestCollectionData);

      const syncedCollection = syncCollectionState(
        latestCollection,
        currentCollection,
        { syncExamples: syncOptions.syncExamples ?? true }
      );

      return cb(null, {
        result: true,
        output: {
          type: 'collection',
          data: (syncedCollection as Collection).toJSON()
        }
      });
    } catch (syncError) {
      return cb(null, {
        result: false,
        reason: `Failed to sync collections: ${syncError instanceof Error ? syncError.message : String(syncError)}`
      });
    }
  });
}

/**
 * Syncs a Postman collection with the latest OpenAPI specification (Promise-based).
 *
 * @param input - The sync input containing spec and collection
 * @param conversionOptions - Options for the OpenAPI to Collection conversion
 * @param syncOptions - Options controlling what should be synced
 * @returns Promise with the synced collection result
 */
export function syncCollectionAsync(
  input: SyncCollectionInput,
  conversionOptions: ConversionOptions,
  syncOptions: SyncOptions
): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
    syncCollection(input, conversionOptions, syncOptions, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result!);
      }
    });
  });
}

export { SchemaPack };

export * from './types';
