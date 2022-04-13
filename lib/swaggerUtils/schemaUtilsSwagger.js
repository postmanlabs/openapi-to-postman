const inputValidationSwagger = require('./inputValidationSwagger'),
  schemaUtilsCommon = require('../common/schemaUtilsCommon');


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
  },

  /**
   * Get the required elements for conversion from spec parsed data
   * @param {object} spec openapi parsed value
   * @returns {object} required elements to convert
   */
  getRequiredData: function(spec) {
    return {
      info: spec.info,
      paths: spec.paths
    };
  }
};
