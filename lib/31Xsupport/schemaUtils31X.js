const inputValidation31X = require('./inputValidation31X'),
  schemaUtilsCommon = require('../common/schemaUtilsCommon');


module.exports = {

  /**
   * Parses an OAS 3.1.X string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.1.x specification specified in either YAML or JSON
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
   * @no-unit-test
   */
  parseSpec: function (openApiSpec) {
    return schemaUtilsCommon.parseSpec(openApiSpec, inputValidation31X);
  },
  inputValidation31X
};
