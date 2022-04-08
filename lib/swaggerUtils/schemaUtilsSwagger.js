const inputValidationSwagger = require('./inputValidationSwagger'),
  schemaUtilsCommon = require('../common/schemaUtilsCommon');
  // _ = require('lodash');


module.exports = {
  version: '2.0',

  /**
     * Parses an OAS string/object as a YAML or JSON
     * @param {YAML/JSON} openApiSpec - The swagger 2.0 specification specified in either YAML or JSON
     * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
     * @no-unit-test
     */
  parseSpec: function (openApiSpec) {
    return schemaUtilsCommon.parseSpec(openApiSpec, inputValidationSwagger);
  }
};
