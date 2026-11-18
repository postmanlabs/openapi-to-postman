const Swagger2OpenAPI = require('swagger2openapi'),
  { isSwagger } = require('../common/versionUtils'),
  { SPEC_VALIDATION_ERROR_CODES } = require('../common/specValidationErrors'),
  DUPLICATE_SANITISED_NAME_REGEX = /^Duplicate sanitised (securityScheme|parameter|response) name (.*)$/;

/**
 * Attaches a code to swagger2openapi errors caused by two components sanitising to the same name
 * @param {Error} error Error returned by swagger2openapi
 * @returns {Error} The same error
 */
function assignDuplicateComponentNameCode(error) {
  const match = typeof error.message === 'string' && error.message.match(DUPLICATE_SANITISED_NAME_REGEX);

  if (match) {
    error.code = SPEC_VALIDATION_ERROR_CODES.SPEC_DUPLICATE_COMPONENT_NAME;
    error.meta = { kind: match[1], name: match[2] };
  }

  return error;
}

module.exports = {

  /**
   * Converts a Swagger 2.0 API definition into an OpenAPI 3.0 specification
   * @param {Object} concreteUtils Concrete schema utils according to the specification version
   * @param {object} parsedSwagger Parsed Swagger spec
   * @param {function} convertExecution Function to perform the OAS-PM convertion after the Spec convertion
   * @return {Object} {error, newOpenapi} The new open api spec or error if there was an error in the process
   */
  convertToOAS30IfSwagger: function(concreteUtils, parsedSwagger, convertExecution) {
    if (isSwagger(concreteUtils.version)) {
      Swagger2OpenAPI.convertObj(
        parsedSwagger,
        {
          fatal: false,
          patch: true,
          anchors: true,
          warnOnly: true
        },
        (error, newOpenapi) => {
          if (error) {
            return convertExecution(assignDuplicateComponentNameCode(error));
          }
          return convertExecution(null, newOpenapi.openapi);
        }
      );
    }
    else {
      return convertExecution(null, parsedSwagger);
    }
  }
};
