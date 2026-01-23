'use strict';

import _ from 'lodash';
import type { Input, Options, Result, Callback, SyncOptions, OptionsCriteria } from './index.d';

const { MODULE_VERSION } = require('../lib/schemapack.js');
const SchemaPack = require('../lib/schemapack.js').SchemaPack;
const UserError = require('../lib/common/UserError');

const DEFAULT_INVALID_ERROR = 'Provided definition is invalid';

module.exports = {
  // Old API wrapping the new API

  convert: function (input: Input, options: Options, cb: Callback): void {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
    }
    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2: function (input: Input, options: Options, cb: Callback): void {
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2WithTypes: function (input: Input, options: Options, cb: Callback): void {
    const enableTypeFetching = true;
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2, enableTypeFetching);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  validate: function (input: Input): Result {
    var schema = new SchemaPack(input);
    return schema.validationResult;
  },

  getMetaData: function (input: Input, cb: Callback): void {
    var schema = new SchemaPack(input);
    schema.getMetaData(cb);
  },

  mergeAndValidate: function (input: Input, cb: Callback): void {
    var schema = new SchemaPack(input);
    schema.mergeAndValidate(cb);
  },

  getOptions: function (mode?: string, criteria?: OptionsCriteria) {
    return SchemaPack.getOptions(mode, criteria);
  },

  getSyncOptions: function (mode?: string) {
    return SchemaPack.getSyncOptions(mode);
  },

  detectRootFiles: async function (input: Input): Promise<Result> {
    var schema = new SchemaPack(input);
    return schema.detectRootFiles();
  },

  detectRelatedFiles: async function (input: Input): Promise<Result> {
    var schema = new SchemaPack(input);
    return schema.detectRelatedFiles();
  },

  bundle: async function (input: Input & { options?: Options }): Promise<Result> {
    var schema = new SchemaPack(input, input.options ?? {});
    return schema.bundle();
  },

  syncCollection: function (
    input: Input,
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
  },

  // new API
  SchemaPack
};
