const inputValidation31X = require('./inputValidation31X'),
  schemaUtilsCommon = require('../common/schemaUtilsCommon'),
  _ = require('lodash'),
  fileUploadTypes = [
    'application/octet-stream'
  ];


module.exports = {

  version: '3.1.x',

  /**
   * Parses an OAS 3.1.X string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.1.x specification specified in either YAML or JSON
   * @param {Object} options computed process options
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
   * @no-unit-test
   */
  parseSpec: function (openApiSpec, options) {
    return schemaUtilsCommon.parseSpec(openApiSpec, inputValidation31X, options);
  },
  inputValidation: inputValidation31X,

  /**
   * Get the required elements for conversion from spec parsed data
   * @param {object} spec openapi parsed value
   * @returns {object} required elements to convert
   */
  getRequiredData(spec) {
    return {
      info: spec.info,
      paths: spec.paths ? spec.paths : {},
      components: spec.components ? spec.components : {},
      webhooks: spec.webhooks ? spec.webhooks : {}
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
   * Identifies the correct type from the list according to the example
   *
   * @param {*} examples provided example values
   * @param {Array} typesArray the types array of the schema
   * @returns {string} the most according type to the example
   */
  findTypeByExample(examples, typesArray) {
    const mapTypes = {
      'boolean': 'boolean',
      'null': 'null',
      'undefined': 'null',
      'number': 'number',
      'bigInt': 'number',
      'object': 'object',
      'string': 'string'
    };
    let foundType,
      foundExample;
    for (let index = 0; index < examples.length; index++) {
      const example = examples[index];
      let exampleType = typeof example,
        mappedType = mapTypes[exampleType];

      if (mappedType === 'number') {
        mappedType = Number.isInteger(example) ? 'integer' : mappedType;
      }

      foundType = typesArray.find((type) => {
        return type === mappedType;
      });
      if (foundType) {
        foundExample = example;
        break;
      }
    }
    return { foundType, foundExample };
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
  },

  getOuterPropsIfIsSupported(schema) {
    const schemaOuterProps = _.cloneDeep(schema);
    delete schemaOuterProps.$ref;
    return schemaOuterProps;
  },

  addOuterPropsToRefSchemaIfIsSupported(refSchema, outerProps) {
    const resolvedSchema = _.cloneDeep(refSchema),
      outerKeys = Object.keys(outerProps);

    if (_.isObject(resolvedSchema) && _.isObject(outerProps)) {
      outerKeys.forEach((key) => {
        resolvedSchema[key] = (resolvedSchema[key] && Array.isArray(resolvedSchema[key])) ?
          [...new Set([...resolvedSchema[key], ...outerProps[key]])] :
          outerProps[key];
      });
    }
    return resolvedSchema;
  }
};
