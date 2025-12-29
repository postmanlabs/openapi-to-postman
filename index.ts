'use strict';

import _ from 'lodash';
import type {
  SpecInput,
  FolderInput,
  MultiFileSpecInput,
  Options,
  ValidationResult,
  ConversionCallback,
  MetadataCallback,
  MergeAndValidateCallback,
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

const DEFAULT_INVALID_ERROR = 'Provided definition is invalid';

module.exports = {
  // Old API wrapping the new API

  convert: function(input: SpecInput, options: Options, cb: ConversionCallback): void {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
    }
    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2: function(input: SpecInput, options: Options, cb: ConversionCallback): void {
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2WithTypes: function(input: SpecInput, options: Options, cb: ConversionCallback): void {
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

  getOptions: function(mode?: string, criteria?: OptionsCriteria): OptionDefinition[] | OptionsUseMode {
    return SchemaPack.getOptions(mode, criteria);
  },

  detectRootFiles: async function(input: MultiFileSpecInput): Promise<RootFiles> {
    var schema = new SchemaPack(input);
    return schema.detectRootFiles();
  },

  detectRelatedFiles: async function(input: MultiFileSpecInput): Promise<RelatedFiles> {
    var schema = new SchemaPack(input);
    return schema.detectRelatedFiles();
  },

  bundle: async function(input: MultiFileSpecInput & { options?: Options }): Promise<BundledContent> {
    var schema = new SchemaPack(input, input.options ?? {});
    return schema.bundle();
  },

  // new API
  SchemaPack
};
