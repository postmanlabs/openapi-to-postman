/**
 * This file contains util functions that are common between versions
 */

const parse = require('../parse.js');

module.exports = {

  /**
   * Parses an OAS string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.x specification specified in either YAML or JSON
   * @param {object} inputValidation - Concrete validator according to version
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
   * @no-unit-test
   */
  parseSpec: function (openApiSpec, inputValidation) {
    var openApiObj = openApiSpec,
      obj,
      rootValidation;

    // If the open api specification is a string could be YAML or JSON
    if (typeof openApiSpec === 'string') {
      obj = parse.getOasObject(openApiSpec);
      if (obj.result) {
        openApiObj = obj.oasObject;
      }
      else {
        return obj;
      }
    }

    // spec is a valid JSON object at this point

    // Validate the root level object for semantics
    rootValidation = inputValidation.validateSpec(openApiObj);
    if (!rootValidation.result) {
      return {
        result: false,
        reason: rootValidation.reason
      };
    }

    // Valid openapi root object
    return {
      result: true,
      openapi: rootValidation.openapi
    };
  }
};
