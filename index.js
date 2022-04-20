'use strict';

const SchemaPack = require('./lib/schemapack.js').SchemaPack;

module.exports = {
  // Old API wrapping the new API
  convert: function(input, options, cb) {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
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

  // new API
  SchemaPack
};
