
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
        reason: 'The Swagger object must have the "swagger" property set to 2.0'
      };
    }
    if (!spec.info) {
      return {
        result: false,
        reason: 'The Swagger object must have an "info" property'
      };
    }
    if (!(spec.info.title && spec.info.version)) {
      return {
        result: false,
        reason: 'The info property must have title and version defined'
      };
    }
    if (!spec.paths) {
      return {
        result: false,
        reason: 'The Swagger object must have a "paths" property'
      };
    }

    // Valid. No reason needed
    return {
      result: true,
      openapi: spec
    };
  }
};
