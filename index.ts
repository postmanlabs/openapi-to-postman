'use strict';

import _ from 'lodash';

const { MODULE_VERSION } = require('../lib/schemapack.js');
const SchemaPack = require('../lib/schemapack.js').SchemaPack;
const UserError = require('../lib/common/UserError');

const DEFAULT_INVALID_ERROR = 'Provided definition is invalid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCallback = (err: any, result?: any) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyInput = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOptions = any;

module.exports = {
  // Old API wrapping the new API
  convert: function(input: AnyInput, options: AnyOptions, cb: AnyCallback) {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
    }
    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2: function(input: AnyInput, options: AnyOptions, cb: AnyCallback) {
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  convertV2WithTypes: function(input: AnyInput, options: AnyOptions, cb: AnyCallback) {
    const enableTypeFetching = true;
    var schema = new SchemaPack(input, options, MODULE_VERSION.V2, enableTypeFetching);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(new UserError(_.get(schema, 'validationResult.reason', DEFAULT_INVALID_ERROR)));
  },

  validate: function (input: AnyInput) {
    var schema = new SchemaPack(input);
    return schema.validationResult;
  },

  getMetaData: function (input: AnyInput, cb: AnyCallback) {
    var schema = new SchemaPack(input);
    schema.getMetaData(cb);
  },

  mergeAndValidate: function (input: AnyInput, cb: AnyCallback) {
    var schema = new SchemaPack(input);
    schema.mergeAndValidate(cb);
  },

  getOptions: function(mode: string, criteria: AnyOptions) {
    return SchemaPack.getOptions(mode, criteria);
  },

  detectRootFiles: async function(input: AnyInput) {
    var schema = new SchemaPack(input);
    return schema.detectRootFiles();
  },

  detectRelatedFiles: async function(input: AnyInput) {
    var schema = new SchemaPack(input);
    return schema.detectRelatedFiles();
  },

  bundle: async function(input: AnyInput) {
    var schema = new SchemaPack(input, _.has(input, 'options') ? input.options : {});
    return schema.bundle();
  },

  // new API
  SchemaPack
};
