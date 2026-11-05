const _ = require('lodash'),
  { SPEC_VALIDATION_ERROR_CODES } = require('../common/specValidationErrors');

module.exports = {

  /**
   * Validate Spec to check if some of the required fields are present.
   * OpenAPI 3.1 only openapi and info are always required,
   * but the document must also contain at least one of paths or webhooks or components.
   * @param {Object} spec OpenAPI spec
   * @param {Object} options computed process options
   * @return {Object} Validation result
   */
  validateSpec: function (spec, options) {
    const includeWebhooksOption = options.includeWebhooks;
    if (_.isNil(spec)) {
      return {
        result: false,
        reason: 'The Specification is null or undefined'
      };
    }
    if (_.isNil(spec.openapi)) {
      // A numeric "swagger: 2.0" is not detected as Swagger, so such specs end up here
      if (!_.isNil(spec.swagger)) {
        return {
          result: false,
          reason: 'Specification must contain a semantic version number of the OAS specification',
          code: SPEC_VALIDATION_ERROR_CODES.SPEC_SWAGGER_VERSION_INVALID
        };
      }

      return {
        result: false,
        reason: 'Specification must contain a semantic version number of the OAS specification'
      };
    }

    if (_.isNil(spec.info)) {
      return {
        result: false,
        reason: 'Specification must contain an Info Object for the meta-data of the API',
        code: SPEC_VALIDATION_ERROR_CODES.SPEC_INFO_MISSING
      };
    }

    if (!_.has(spec.info, '$ref')) {
      if (_.isNil(_.get(spec, 'info.title'))) {
        return {
          result: false,
          reason: 'Specification must contain a title in order to generate a collection',
          code: SPEC_VALIDATION_ERROR_CODES.SPEC_INFO_TITLE_MISSING
        };
      }

      if (_.isNil(_.get(spec, 'info.version'))) {
        return {
          result: false,
          reason: 'Specification must contain a semantic version number of the API in the Info Object',
          code: SPEC_VALIDATION_ERROR_CODES.SPEC_INFO_VERSION_MISSING
        };
      }
    }

    if (_.isNil(spec.paths) && !includeWebhooksOption) {
      return {
        result: false,
        reason: 'Specification must contain Paths Object for the available operational paths',
        code: SPEC_VALIDATION_ERROR_CODES.SPEC_PATHS_MISSING
      };
    }

    if (includeWebhooksOption && _.isNil(spec.paths) &&
      _.isNil(spec.webhooks) && _.isNil(spec.components)) {
      return {
        result: false,
        reason: 'Specification must contain either Paths, Webhooks or Components sections',
        code: SPEC_VALIDATION_ERROR_CODES.SPEC_PATHS_MISSING
      };
    }

    return {
      result: true,
      openapi: spec
    };
  }
};
