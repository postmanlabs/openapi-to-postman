const { formatDataPath } = require('../common/schemaUtilsCommon');

var _ = require('lodash');
const IGNORED_KEYWORDS = ['propertyNames', 'const', 'additionalItems', 'dependencies'],
  { validateSchemaAJV } = require('./ajvValidator'),
  { validateSchemaAJVDraft04 } = require('./ajvValidatorDraft04'),
  specialDraft = 'http://json-schema.org/draft-04/schema#';

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
 * returns the local $schema value
 *
 * @param {*} schema - Schema to obtain the draft definition
 * @returns {string} the id
 */
function getLocalDraft(schema) {
  return schema.$schema;
}

/**
 * Gets the correct validator according to the draft
 *
 * @param {string} draft - the draft identifier
 * @returns {string} the id
 */
function getAjvValidator(draft) {
  return draft === specialDraft ? validateSchemaAJVDraft04 : validateSchemaAJV;
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
  let validate,
    compoundResult,
    filteredValidationError,
    draftToUse = getLocalDraft(schema);
  const validator = getAjvValidator(draftToUse);
  compoundResult = validator(schema, valueToUse, draftToUse);
  if (compoundResult.filteredValidationError) {
    return filteredValidationError;
  }
  validate = compoundResult.validate;

  // Filter validation errors for following cases
  filteredValidationError = _.filter(_.get(validate, 'errors', []), (validationError) => {
    let dataPath = _.get(validationError, 'instancePath', '');
    dataPath = formatDataPath(dataPath);

    // discard the leading '.' if it exists
    if (dataPath[0] === '.') {
      dataPath = dataPath.slice(1);
    }

    // for invalid `propertyNames` two error are thrown by Ajv, which include error with `pattern` keyword
    if (validationError.keyword === 'pattern' && _.has(validationError, 'propertyName')) {
      return false;
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
  validateSchema,
  getLocalDraft,
  getAjvValidator
};