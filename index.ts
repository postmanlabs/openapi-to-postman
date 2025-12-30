'use strict';

import _ from 'lodash';
import type {
  SpecInput,
  FolderInput,
  MultiFileSpecInput,
  Options,
  ValidationResult,
  ConversionResult,
  ConversionCallback,
  MetadataCallback,
  MergeAndValidateCallback,
  SyncOptions,
  OptionsCriteria,
  OptionDefinition,
  OptionsUseMode,
  RootFiles,
  RelatedFiles,
  BundledContent
} from './types';

const { MODULE_VERSION } = require('../lib/schemapack.js');
const SchemaPack = require('../lib/schemapack.js').SchemaPack;
const UserError = require('../lib/common/UserError');
const { syncCollection: syncCollectionState } = require('../libV2/SpecificationCollectionSyncing');
const { Collection } = require('postman-collection');

const DEFAULT_INVALID_ERROR = 'Provided definition is invalid';

module.exports = {
  // Old API wrapping the new API

  convert: function (input: SpecInput, options: Options, cb: ConversionCallback): void {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
    }
    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2: function (input: SpecInput, options: Options, cb: ConversionCallback): void {
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2WithTypes: function (input: SpecInput, options: Options, cb: ConversionCallback): void {
    const enableTypeFetching = true;
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2, enableTypeFetching);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  validate: function (input: SpecInput): ValidationResult {
    var schema = new SchemaPack(input);
    return schema.validationResult;
  },

  getMetaData: function (input: SpecInput | FolderInput, cb: MetadataCallback): void {
    var schema = new SchemaPack(input);
    schema.getMetaData(cb);
  },

  mergeAndValidate: function (input: FolderInput, cb: MergeAndValidateCallback): void {
    var schema = new SchemaPack(input);
    schema.mergeAndValidate(cb);
  },

  getOptions: function (mode?: string, criteria?: OptionsCriteria): OptionDefinition[] | OptionsUseMode {
    return SchemaPack.getOptions(mode, criteria);
  },

  detectRootFiles: async function (input: MultiFileSpecInput): Promise<RootFiles> {
    var schema = new SchemaPack(input);
    return schema.detectRootFiles();
  },

  detectRelatedFiles: async function (input: MultiFileSpecInput): Promise<RelatedFiles> {
    var schema = new SchemaPack(input);
    return schema.detectRelatedFiles();
  },

  bundle: async function (input: MultiFileSpecInput & { options?: Options }): Promise<BundledContent> {
    var schema = new SchemaPack(input, input.options ?? {});
    return schema.bundle();
  },

  syncCollection: function (
    input: SpecInput,
    options: Options,
    currentCollectionJSON: object,
    syncOptions: SyncOptions | null,
    cb: ConversionCallback
  ): void {
    const enableTypeFetching = true;
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2, enableTypeFetching);

    if (!schema.validated) {
      return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
    }

    // Convert the spec to a collection with types
    return schema.convertV2((err: Error | null, result?: ConversionResult) => {
      if (err) {
        return cb(err);
      }

      if (!result || !result.output || !result.output[0]) {
        return cb(new UserError('Failed to generate collection from specification'));
      }

      try {
        const latestCollection = new Collection(result.output[0].data);
        const currentCollection = new Collection(currentCollectionJSON);

        const syncedCollection = syncCollectionState(latestCollection, currentCollection, syncOptions);

        const syncedCollectionJSON = syncedCollection.toJSON();

        return cb(null, {
          result: true,
          output: [{ type: 'collection', data: syncedCollectionJSON }],
          analytics: result.analytics,
          extractedTypes: result.extractedTypes
        });
      } catch (syncError) {
        return cb(syncError instanceof Error ? syncError : new Error(String(syncError)));
      }
    }
    );
  }
}
