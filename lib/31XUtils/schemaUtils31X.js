const inputValidation31X = require('./inputValidation31X'),
  schemaUtilsCommon = require('../common/schemaUtilsCommon'),
  fileUploadTypes = [
    'application/octet-stream'
  ];


module.exports = {

  version: '3.1.x',

  /**
   * Parses an OAS 3.1.X string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.1.x specification specified in either YAML or JSON
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
   * @no-unit-test
   */
  parseSpec: function (openApiSpec) {
    return schemaUtilsCommon.parseSpec(openApiSpec, inputValidation31X);
  },
  inputValidation31X,

  /**
   * Get the required elements for conversion from spec parsed data
   * @param {object} spec openapi parsed value
   * @returns {object} required elements to convert
   */
  getRequiredData(spec) {
    return {
      info: spec.info,
      paths: spec.paths ? spec.paths : [],
      components: spec.components ? spec.components : [],
      webhooks: spec.webhooks ? spec.webhooks : []
    };
  },

  /**
   * Compares two types and return if they match or not.
   * In case that the provided type is an array it checks of the typeToCompare exists in.
   * @param {string | array} currentType the type in schema, it could be an array of types
   * @param {string} typeToValidate the type to compare
   * @returns {boolean} the result of the comparation
   */
  compareTypes(currentType, typeToValidate) {
    let isTypeMatching = currentType === typeToValidate;
    if (Array.isArray(currentType)) {
      isTypeMatching = currentType.includes(typeToValidate);
    }
    return isTypeMatching;
  },

  /**
   * Takes the first element from 'examples' property in a schema and adds a new 'example' property.
   * This method is used before faking the schema. (Schema faker uses the example property to fakle the schema)
   * @param {object} schema a provided schema
   * @returns {object} it returns the schema with a new example property
   */
  fixExamplesByVersion(schema) {
    if (schema.properties) {
      const schemaProperties = Object.keys(schema.properties);
      schemaProperties.forEach((property) => {
        if (schema.properties[property].examples) {
          schema.properties[property].example = schema.properties[property].examples[0];
        }
      });
    }
    return schema;
  },

  /**
   * Check if request body type is binary type.
   * Open api 3.1 does not need that a binary content has a schema within. It comes as an empty object
   * @param {string} bodyType the bodyType provided in a request body content
   * @param {object} contentObj The request body content provided in spec
   * @returns {boolean} Returns true if content is a binary type
   */
  isBinaryContentType (bodyType, contentObj) {
    return Object.keys(contentObj[bodyType]).length === 0 && fileUploadTypes.includes(bodyType);
  }
};
