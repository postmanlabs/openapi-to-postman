const Ajv = require('ajv-draft-04'),
  UserError = require('./UserError'),
  { ParseError } = require('./ParseError'),
  addFormats = require('ajv-formats'),
  openapi3Schema = require('../../assets/openapi3Schema.json'),
  swagger2Schema = require('../../assets/swagger2Schema.json'),
  openapi3Utils = require('../30XUtils/schemaUtils30X'),
  swagger2Utils = require('../swaggerUtils/schemaUtilsSwagger'),
  { jsonPointerDecodeAndReplace } = require('../jsonPointer'),
  { assignErrorCode, hasSpecValidationErrorCode } = require('./specValidationErrors');

/**
 * Constructs Error message from given AJV Validation Error object.
 *
 * @param {Object} ajvError - AJV Validation Error object (reference: https://ajv.js.org/#validation-errors)
 * @returns {String} - Error message constructed (To be displayed as error message for invalid specs)
 */
function constructErrorMessage (ajvError) {
  let message = 'Provided API Specification is invalid. ';

  message += ajvError.message;

  if (ajvError.params) {
    message += ' ' + JSON.stringify(ajvError.params);
  }

  if (typeof ajvError.instancePath === 'string') {
    message += ` at "${jsonPointerDecodeAndReplace(ajvError.instancePath)}"`;
  }

  return message;
}

/**
 * Validates given OpenAPI specification against JSON schema of OpenAPI spec using AJV and
 * generates UserError or Unhandled error depending upon type of error.
 *
 * @param {Object} definition - Parsed OAS definition
 * @param {string} definitionVersion - Corresponding Definition version
 * @param {*} error - Original Error object
 * @returns {*} - Generated Error object
 */
function generateError (definition, definitionVersion, error) {
  let ajv = new Ajv({
      schemaId: 'auto',
      strict: false
    }),
    validate,
    valid = true;

  // Log original error for better obseravibility in case of User errors
  console.error(error);

  // Errors for known specification authoring errors are already specific, so they skip the schema check. Other
  // classes (e.g. swagger2openapi's S2OError) become a UserError, so consumers can tell them from system errors.
  // Only the message, code and meta are kept, not the original error with the converter's internal options.
  if (hasSpecValidationErrorCode(error)) {
    return error instanceof UserError || error instanceof ParseError ?
      error :
      assignErrorCode(new UserError(error.message), error);
  }

  addFormats(ajv);

  if (definitionVersion === openapi3Utils.version) {
    validate = ajv.compile(openapi3Schema);
  }
  else if (definitionVersion === swagger2Utils.version) {
    validate = ajv.compile(swagger2Schema);
  }

  validate && (valid = validate(definition));

  if (valid) {
    if (error instanceof Error) {
      return error;
    }

    const errorMessage = typeof error === 'string' ? error : _.get(error, 'message', 'Failed to generate collection.');

    return new Error(errorMessage);
  }
  else {
    return new UserError(constructErrorMessage(validate.errors[0]), error);
  }
}

module.exports = {
  generateError
};
