
module.exports = {

  /**
   * Validate Spec to check if some of the required fields are present.
   * OpenAPI 3.1 only openapi and info are always required,
   * but the document must also contain at least one of paths or webhooks or components.
   * @param {Object} spec OpenAPI spec
   * @return {Object} Validation result
   */
  validateSpec: function (spec) {

    if (!spec.hasOwnProperty('openapi')) {
      return {
        result: false,
        reason: 'Specification must contain a semantic version number of the OAS specification'
      };
    }

    if (!spec.hasOwnProperty('info')) {
      return {
        result: false,
        reason: 'Specification must contain an Info Object for the meta-data of the API'
      };
    }

    if (!spec.hasOwnProperty('paths') && !spec.hasOwnProperty('webhooks') && !spec.hasOwnProperty('components')) {
      return {
        result: false,
        reason: 'Specification must contain either Paths, Webhooks or Components sections'
      };
    }

    return {
      result: true,
      openapi: spec
    };
  }
};
