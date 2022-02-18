const { formatDataPath } = require('../common/schemaUtilsCommon');

var _ = require('lodash');
const IGNORED_KEYWORDS = ['propertyNames', 'const', 'additionalItems', 'dependencies'],
  { validateSchemaAJV } = require('./ajvValidator'),
  { validateSchemaAJVDraft04 } = require('./ajvValidatorDraft04'),
  specialDraft = 'http://json-schema.org/draft-04/schema#',
  typesMap = {
    integer: {
      int32: '<integer>',
      int64: '<long>'
    },
    number: {
      float: '<float>',
      double: '<double>'
    },
    string: {
      byte: '<byte>',
      binary: '<binary>',
      date: '<date>',
      'date-time': '<dateTime>',
      password: '<password>'
    },
    boolean: '<boolean>'
  };

/**
 * Checks if value is postman variable or not
 *
 * @param {string} type - type to look for
 * @param {string} format - format from schema
 * @returns {Boolean} postman variable or not
 */
function getDefaultFromTypeAndFormat(type, format) {
  return typesMap[type][format];
}

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
 * Checks if value is the representation of its type like:
 * "<integer>"
 *
 * @param {string} value - Value to check for
 * @param {string} type - The type in the schemna
 * @returns {Boolean} the value is the representation of its type
 */
function compareType(value, type) {
  return value === '<' + type + '>';
}

/**
 * Checks if value is the representation of its type like:
 * "<integer>"
 * Works in array types
 * @param {string} value - Value to check for
 * @param {*} types - The types in the schemna
 * @returns {Boolean} the value is the representation of its type
 */
function isTypeValueArrayCheck(value, types) {
  return types.find((type) => {
    return compareType(value, type);
  }) !== undefined;
}

/**
 * Checks if value is the representation of its type like:
 * "<integer>"
 * Works in array types
 * @param {string} value - Value to check for
 * @param {*} types - The types in the schemna
 * @returns {Boolean} the value is the representation of its type
 */
function checkValueOnlyTypes(value, types) {
  return Array.isArray(types) ? isTypeValueArrayCheck(value, types) : compareType(value, types);
}

/**
 * Checks if value is the representation of its type like:
 * "<integer>"
 * Works in array types
 * @param {string} value - Value to check for
 * @param {*} types - The types in the schema
 * @param {*} format - format from the schema
 * @returns {Boolean} the value is the representation of its type
 */
function checkValueTypesAndFormat(value, types, format) {
  let typesNotInMapp = [],
    typesArray = Array.isArray(types) ? types : [types],
    found = typesArray.find((type) => {
      let defaultValue;
      if (typesMap.hasOwnProperty(type)) {
        defaultValue = getDefaultFromTypeAndFormat(type, format);

        // in case the format is a custom format (email, hostname etc.)
        // https://swagger.io/docs/specification/data-models/data-types/#string
        if (!defaultValue && format) {
          defaultValue = '<' + format + '>';
        }
      }
      else {
        typesNotInMapp.push(type);
      }
      return defaultValue === value;
    });
  if (found) {
    return true;
  }

  found = typesNotInMapp.find((type) => {
    let defaultValue;
    defaultValue = '<' + type + (format ? ('-' + format) : '') + '>';
    return defaultValue === value;
  });

  return found !== undefined;
}

/**
 * Checks if value is the representation of its type like:
 * "<integer>"
 * Works in array types
 * @param {string} value - Value to check for
 * @param {*} schema - The schema portion used in validation
 * @returns {Boolean} the value is the representation of its type
 */
function isTypeValue(value, schema) {
  if (schema.hasOwnProperty('type') && !schema.hasOwnProperty('format')) {
    return checkValueOnlyTypes(value, schema.type);
  }
  if (schema.hasOwnProperty('type') && schema.hasOwnProperty('format')) {
    return checkValueTypesAndFormat(value, schema.type, schema.format);
  }
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
 * @param {string} draftToUse - the draft to use in validation
 * @returns {string} the draft identifier
 */
function getAjvValidator(draftToUse) {
  return draftToUse === specialDraft ? validateSchemaAJVDraft04 : validateSchemaAJV;
}

/**
 * Defines the draft to use in validation
 *
 * @param {string} localDraft - the draft from the schema object
 * @param {string} jsonSchemaDialect - the draft from the OAS object
 * @returns {string} the draft to use
 */
function getDraftToUse(localDraft, jsonSchemaDialect) {
  return localDraft ? localDraft : jsonSchemaDialect;
}

/**
 * Used to validate schema against a value.
 * NOTE: Used in assets/json-schema-faker.js to validate schema example
 *
 * @param {*} schema - schema to validate
 * @param {*} valueToUse - value to validate schema against
 * @param {*} options - a standard list of options that's globally passed around. Check options.js for more.
 * @param {string} jsonSchemaDialect - the defined schema in the OAS object
 * @returns {*} - Found Validation Errors
 */
function validateSchema (schema, valueToUse, options = {}, jsonSchemaDialect) {
  let validate,
    compoundResult,
    filteredValidationError,
    localDraft = getLocalDraft(schema),
    draftToUse = getDraftToUse(localDraft, jsonSchemaDialect);
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

    if (validationError.keyword === 'type') {
      let schemaToUse = schema.hasOwnProperty('properties') ? _.get(schema, 'properties.' + dataPath) : schema;
      return !isTypeValue(_.get(valueToUse, dataPath),
        schemaToUse);
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
  getAjvValidator,
  getDraftToUse,
  isTypeValue
};
