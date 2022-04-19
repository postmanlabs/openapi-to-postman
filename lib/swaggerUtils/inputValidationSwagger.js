
module.exports = {

  /**
   * Validate Spec to check if some of the required fields are present.
   * @param {Object} spec OpenAPI spec
   * @return {Object} Validation result
   */
  validateSpec: function (spec) {
    if (spec.swagger !== '2.0') {
      return {
        result: false,
        reason: 'The value of swagger field must be 2.0'
      };
    }
    if (!spec.info) {
      return {
        result: false,
        reason: 'The Swagger specification must have an "info" field'
      };
    }
    if (!(spec.info.title && spec.info.version)) {
      return {
        result: false,
        reason: 'Title, and version fields are required for the Info Object'
      };
    }
    if (!spec.paths) {
      return {
        result: false,
        reason: 'The Swagger specification must have a "paths" field'
      };
    }

    // Valid. No reason needed
    return {
      result: true,
      openapi: spec
    };
  }
};
