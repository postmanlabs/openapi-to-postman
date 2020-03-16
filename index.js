'use strict';

const SchemaPack = require('./lib/schemapack.js').SchemaPack;

module.exports = {
  // Old API wrapping the new API

  /**
   * @callback responseCallback
   * @param {object} error - For handling error object
   * @param {object} result - For handling conversion/validation object
   */

  /**
   * @param {object} input - Contains OpenAPI spec specified in YAML/JSON
   * @param {object} options - Holds user configurable properties like schemaFaker, requestNameSource, indentCharacter
   * @param {responseCallback} cb - For return
   * @returns {responseCallback} Callback with conversion results (success/failure)
   */
  convert: function(input, options, cb) {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
    }
    return cb(null, schema.validationResult);
  },

  /**
   * @param {object} input - Contains OpenAPI spec specified in YAML/JSON
   * @returns {object} Object with success/failure status of schema validation along with its reason
   */
  validate: function (input) {
    var schema = new SchemaPack(input);
    return schema.validationResult;
  },

  /**
   * @param {object} input - Contains OpenAPI spec specified in YAML/JSON
   * @param {responseCallback} cb - For return
   * @returns {responseCallback} Callback with success/failure status of schema validation along with its reason
   */
  mergeAndValidate: function (input, cb) {
    var schema = new SchemaPack(input);
    schema.mergeAndValidate(cb);
  },

  /**
   * @returns {object} Options object with configurable kv-pairs
   */
  getOptions: function() {
    return SchemaPack.getOptions();
  },

  // new API
  SchemaPack
};
