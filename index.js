'use strict';

const SchemaPack = require('./lib/schemapack.js').SchemaPack;

module.exports = {
  // Old API wrapping the new API
  convert: function(input, options, cb) {
    var schema = new SchemaPack(input);

    if (schema.validated) {
      return schema.convert(options, cb);
    }

    return cb(null, schema.validationResult);
  },

  validate: function(input) {
    var schema = new SchemaPack(input);
    return schema.validationResult;
  },

  getOptions: function() {
    return SchemaPack.getOptions();
  },

  // new API
  SchemaPack
};
