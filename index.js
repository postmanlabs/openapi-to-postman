'use strict';

const _ = require('lodash'),
  SchemaPack = require('./lib/schemapack.js').SchemaPack;

module.exports = {
  // Old API wrapping the new API
  convert: function(input, options, cb) {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
    }
    return cb(null, schema.validationResult);
  },

  convertV2: function(input, options, cb) {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convertV2(cb);
    }

    return cb(null, schema.validationResult);
  },

  validate: function (input) {
    var schema = new SchemaPack(input);
    return schema.validationResult;
  },

  getMetaData: function (input, cb) {
    var schema = new SchemaPack(input);
    schema.getMetaData(cb);
  },

  mergeAndValidate: function (input, cb) {
    var schema = new SchemaPack(input);
    schema.mergeAndValidate(cb);
  },

  getOptions: function(mode, criteria) {
    return SchemaPack.getOptions(mode, criteria);
  },

  detectRootFiles: async function(input) {
    var schema = new SchemaPack(input);
    return schema.detectRootFiles();
  },

  detectRelatedFiles: async function(input) {
    var schema = new SchemaPack(input);
    return schema.detectRelatedFiles();
  },

  bundle: async function(input) {
    var schema = new SchemaPack(input, _.has(input, 'options') ? input.options : {});
    return schema.bundle();
  },

  // new API
  SchemaPack
};
