var _ = require('lodash'),
  Ajv = require('ajv');

// Following keyword are supoorted for Ajv but not by OAS
const IGNORED_KEYWORDS = ['propertyNames', 'const', 'additionalItems', 'dependencies'];

/**
 * Checks if value is postman variable or not
 *
 * @param {*} value - Value to check for
 * @returns {Boolean} postman variable or not
 */
function isPmVariable (value) {
  // collection/environment variables are in format - {{var}}
  return _.isString(value) && _.startsWith(value, '{{') && _.endsWith(value, '}}');
}

/**
 * Used to validate schema against a value.
 * NOTE: Used in assets/json-schema-faker.js to validate schema example
 *
 * @param {*} schema - schema to validate
 * @param {*} valueToUse - value to validate schema against
 * @param {*} options - a standard list of options that's globally passed around. Check options.js for more.
 * @returns {*} - Found Validation Errors
 */
function validateSchema (schema, valueToUse, options = {}) {
  var ajv,
    validate,
    filteredValidationError;

  try {
    // add Ajv options to support validation of OpenAPI schema.
    // For more details see https://ajv.js.org/#options
    ajv = new Ajv({
      // the unknown formats are ones that are allowed in OAS, but not JSON schema.
      unknownFormats: ['int32', 'int64'],

      // check all rules collecting all errors. instead returning after the first error.
      allErrors: true,

      // supports keyword "nullable" from Open API 3 specification.
      nullable: true
    });
    validate = ajv.compile(schema);
    validate(valueToUse);
  }
  catch (e) {
    // something went wrong validating the schema
    // input was invalid. Don't throw mismatch
    return filteredValidationError;
  }

  // Filter validation errors for following cases
  filteredValidationError = _.filter(_.get(validate, 'errors', []), (validationError) => {
    let dataPath = _.get(validationError, 'dataPath', '');

    // discard the leading '.' if it exists
    if (dataPath[0] === '.') {
      dataPath = dataPath.slice(1);
    }

    // for invalid `propertyNames` two error are thrown by Ajv, which include error with `pattern` keyword
    if (validationError.keyword === 'pattern') {
      return !_.has(validationError, 'propertyName');
    }

    // As OAS only supports some of Json Schema keywords, and Ajv is supporting all keywords from Draft 7
    // Remove keyword currently not supported in OAS to make both compatible with each other
    else if (_.includes(IGNORED_KEYWORDS, validationError.keyword)) {
      return false;
    }

    // Ignore unresolved variables from mismatch if option is set
    else if (options.ignoreUnresolvedVariables &&
      isPmVariable(dataPath === '' ? valueToUse : _.get(valueToUse, dataPath))) {
      return false;
    }
    return true;
  });

  // sort errors based on dataPath, as this will ensure no overriding later
  filteredValidationError = _.sortBy(filteredValidationError, ['dataPath']);

  return filteredValidationError;
}

module.exports = {
  validateSchema
};
