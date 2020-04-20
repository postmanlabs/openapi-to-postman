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

  getMetaData: function (input) {
    var schema = new SchemaPack(input);
    return schema.metaData;
  },

  mergeAndValidate: function (input, cb) {
    var schema = new SchemaPack(input);
    schema.mergeAndValidate(cb);
  },

  getOptions: function() {
    return SchemaPack.getOptions();
  },

  // new API
  SchemaPack
};
