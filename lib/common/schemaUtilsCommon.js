/**
 * This file contains util functions that are common between versions
 */

const parse = require('../parse.js'),
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
 *  Remove the # character from the beginning of a schema path
 * @param {string} schemaPath - a defined schemaPath
 * @returns {string} - the schema path with # removed
 */
function removeSharpAndSlashFromFirstPosition(schemaPath) {
  return schemaPath[0] === '#' ? schemaPath.slice(2) : schemaPath;
}

/**
 *  Remove the type from the last position of a schema path
 * @param {string} schemaPath - a defined schemaPath
 * @returns {string} - the schema path with type removed
 */
function removeTypeFromLastPosition(schemaPath) {
  let splittedDataPath = schemaPath.split('/');
  if (splittedDataPath[splittedDataPath.length - 1] === 'type') {
    splittedDataPath.splice(-1);
  }
  return splittedDataPath.join('/');
}

module.exports = {

  /**
   * Parses an OAS string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.x specification specified in either YAML or JSON
   * @param {object} inputValidation - Concrete validator according to version
   * @param {Object} options computed process options
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
   * @no-unit-test
   */
  parseSpec: function (openApiSpec, inputValidation, options) {
    var openApiObj = openApiSpec,
      obj,
      rootValidation;

    // If the open api specification is a string could be YAML or JSON
    if (typeof openApiSpec === 'string') {
      obj = parse.getOasObject(openApiSpec);
      if (obj.result) {
        openApiObj = obj.oasObject;
      }
      else {
        return obj;
      }
    }

    // spec is a valid JSON object at this point

    // Validate the root level object for semantics
    rootValidation = inputValidation.validateSpec(openApiObj, options);
    if (!rootValidation.result) {
      return {
        result: false,
        reason: rootValidation.reason
      };
    }

    // Valid openapi root object
    return {
      result: true,
      openapi: rootValidation.openapi
    };
  },

  formatDataPath: function(dataPath) {
    let initialDotIfExist = dataPath[0] === '/' ? '.' : '',
      splittedDataPath = dataPath.split('/'),
      isANumber = (value) => {
        return !isNaN(value);
      },
      formattedElements = splittedDataPath.map((element, index) => {
        if (element !== '' && isANumber(element)) {
          return `[${element}]`;
        }
        if (element === '' || element[0] === '.') {
          return element;
        }
        if (index === 0 && !initialDotIfExist) {
          return `${element}`;
        }
        return `.${element}`;
      }),
      formattedDataPath = formattedElements.join('');

    return `${formattedDataPath}`;
  },

  handleExclusiveMaximum: function(schema, max) {
    max = schema.hasOwnProperty('maximum') ?
      schema.maximum :
      max;
    if (schema.hasOwnProperty('exclusiveMaximum')) {
      if (typeof schema.exclusiveMaximum === 'boolean') {
        return schema.multipleOf ?
          max - schema.multipleOf :
          max - 1;
      }
      else if (typeof schema.exclusiveMaximum === 'number') {
        return schema.multipleOf ?
          schema.exclusiveMaximum - schema.multipleOf :
          schema.exclusiveMaximum - 1;
      }
    }
    return max;
  },

  handleExclusiveMinimum: function(schema, min) {
    min = schema.hasOwnProperty('minimum') ?
      schema.minimum :
      min;
    if (schema.hasOwnProperty('exclusiveMinimum')) {
      if (typeof schema.exclusiveMinimum === 'boolean') {
        return schema.multipleOf ?
          min + schema.multipleOf :
          min + 1;
      }
      else if (typeof schema.exclusiveMinimum === 'number') {
        return schema.multipleOf ?
          schema.exclusiveMinimum + schema.multipleOf :
          schema.exclusiveMinimum + 1;
      }
    }
    return min;
  },

  /**
   * Removes initial "#/" from a schema path and the last "/type" segment
   * @param {string} schemaPath - The OAS 3.x specification specified in either YAML or JSON
   * @returns {string} - The schemaPath with initial #/ and last "/type" removed
   */
  formatSchemaPathFromAJVErrorToConvertToDataPath: function (schemaPath) {
    return removeTypeFromLastPosition(removeSharpAndSlashFromFirstPosition(schemaPath));
  },

  typesMap
};
