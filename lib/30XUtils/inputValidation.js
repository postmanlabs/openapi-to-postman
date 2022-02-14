module.exports = {

  /**
   * Validate Spec to check if some of the required fields are present.
   *
   * @param {Object} spec OpenAPI spec
   * @return {Object} Validation result
   */
  validateSpec: function (spec) {

    // Checking for the all the required properties in the specification
    if (!spec.hasOwnProperty('openapi')) {
      return {
        result: false,
        reason: 'Specification must contain a semantic version number of the OAS specification'
      };
    }

    if (!spec.hasOwnProperty('paths')) {
      return {
        result: false,
        reason: 'Specification must contain Paths Object for the available operational paths'
      };
    }

    if (!spec.hasOwnProperty('info')) {
      return {
        result: false,
        reason: 'Specification must contain an Info Object for the meta-data of the API'
      };
    }
    if (!spec.info.hasOwnProperty('$ref')) {
      if (!spec.info.hasOwnProperty('title')) {
        return {
          result: false,
          reason: 'Specification must contain a title in order to generate a collection'
        };
      }

      if (!spec.info.hasOwnProperty('version')) {
        return {
          result: false,
          reason: 'Specification must contain a semantic version number of the API in the Info Object'
        };
      }
    }

    // Valid specification
    return {
      result: true,
      openapi: spec
    };
  }
};
