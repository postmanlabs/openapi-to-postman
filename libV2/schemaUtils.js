const generateAuthForCollectionFromOpenAPI = require('./helpers/collection/generateAuthForCollectionFromOpenAPI');
const utils = require('./utils');

const schemaFaker = require('../assets/json-schema-faker'),
  _ = require('lodash'),
  mergeAllOf = require('json-schema-merge-allof'),
  xmlFaker = require('./xmlSchemaFaker.js'),
  URLENCODED = 'application/x-www-form-urlencoded',
  APP_JSON = 'application/json',
  APP_JS = 'application/javascript',
  TEXT_XML = 'text/xml',
  APP_XML = 'application/xml',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  FORM_DATA = 'multipart/form-data',
  HEADER_TYPE = {
    JSON: 'json',
    XML: 'xml',
    INVALID: 'invalid'
  },
  HEADER_TYPE_PREVIEW_LANGUAGE_MAP = {
    [HEADER_TYPE.JSON]: 'json',
    [HEADER_TYPE.XML]: 'xml'
  },
  // These headers are to be validated explicitly
  // As these are not defined under usual parameters object and need special handling
  IMPLICIT_HEADERS = [
    'content-type', // 'content-type' is defined based on content/media-type of req/res body,
    'accept',
    'authorization'
  ],

  /**
   * @param {*} rootObject - the object from which you're trying to read a property
   * @param {*} pathArray - each element in this array a property of the previous object
   * @param {*} defValue - what to return if the required path is not found
   * @returns {*} - required property value
   * @description - this is similar to _.get(rootObject, pathArray.join('.')), but also works for cases where
   * there's a . in the property name
   */
  _getEscaped = (rootObject, pathArray, defValue) => {
    if (!(pathArray instanceof Array)) {
      return null;
    }

    if (rootObject === undefined) {
      return defValue;
    }

    if (_.isEmpty(pathArray)) {
      return rootObject;
    }

    return _getEscaped(rootObject[pathArray.shift()], pathArray, defValue);
  },
  getXmlVersionContent = (bodyContent) => {
    const regExp = new RegExp('([<\\?xml]+[\\s{1,}]+[version="\\d.\\d"]+[\\sencoding="]+.{1,15}"\\?>)');
    let xmlBody = bodyContent;

    if (!bodyContent.match(regExp)) {
      const versionContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xmlBody = versionContent + xmlBody;
    }
    return xmlBody;
  };

// See https://github.com/json-schema-faker/json-schema-faker/tree/master/docs#available-options
schemaFaker.option({
  requiredOnly: false,
  optionalsProbability: 1.0, // always add optional fields
  maxLength: 256,
  minItems: 1, // for arrays
  maxItems: 20, // limit on maximum number of items faked for (type: arrray)
  useDefaultValue: true,
  ignoreMissingRefs: true,
  avoidExampleItemsLength: true // option to avoid validating type array schema example's minItems and maxItems props.
});

let QUERYPARAM = 'query',
  CONVERSION = 'conversion',
  HEADER = 'header',
  PATHPARAM = 'path',
  SCHEMA_TYPES = {
    array: 'array',
    boolean: 'boolean',
    integer: 'integer',
    number: 'number',
    object: 'object',
    string: 'string'
  },
  SCHEMA_FORMATS = {
    DEFAULT: 'default', // used for non-request-body data and json
    XML: 'xml' // used for request-body XMLs
  },
  REF_STACK_LIMIT = 30,
  ERR_TOO_MANY_LEVELS = '<Error: Too many levels of nesting to fake this schema>',

  /**
  * Changes the {} around scheme and path variables to :variable
  * @param {string} url - the url string
  * @returns {string} string after replacing /{pet}/ with /:pet/
  */
  sanitizeUrl = (url) => {
    // URL should always be string so update value if non-string value is found
    if (typeof url !== 'string') {
      return '';
    }

    // This simply replaces all instances of {text} with {{text}}
    // text cannot have any of these 3 chars: /{}
    // {{text}} will not be converted
    const replacer = function (match, p1, offset, string) {
      if (string[offset - 1] === '{' && string[offset + match.length + 1] !== '}') {
        return match;
      }
      return '{' + p1 + '}';
    };

    url = _.isString(url) ? url.replace(/(\{[^\/\{\}]+\})/g, replacer) : '';

    // converts the following:
    // /{{path}}/{{file}}.{{format}}/{{hello}} => /:path/{{file}}.{{format}}/:hello
    let pathVariables = url.match(/(\/\{\{[^\/\{\}]+\}\})(?=\/|$)/g);

    if (pathVariables) {
      pathVariables.forEach((match) => {
        const replaceWith = match.replace(/{{/g, ':').replace(/}}/g, '');
        url = url.replace(match, replaceWith);
      });
    }

    return url;
  },

  filterCollectionAndPathVariables = (url, pathVariables) => {
    // URL should always be string so update value if non-string value is found
    if (typeof url !== 'string') {
      return '';
    }

    // /:path/{{file}}.{{format}}/:hello => only {{file}} and {{format}} will match
    let variables = url.match(/(\{\{[^\/\{\}]+\}\})/g),
      collectionVariables = [],
      collectionVariableMap = {},
      filteredPathVariables = [];

    _.forEach(variables, (variable) => {
      const collVar = variable.replace(/{{/g, '').replace(/}}/g, '');

      collectionVariableMap[collVar] = true;
    });

    // Filter out variables that are to be added as collection variables
    _.forEach(pathVariables, (pathVariable) => {
      if (collectionVariableMap[pathVariable.key]) {
        collectionVariables.push(_.pick(pathVariable, ['key', 'value']));
      }
      else {
        filteredPathVariables.push(pathVariable);
      }
    });

    return {
      collectionVariables,
      pathVariables: filteredPathVariables
    };
  },

  resolveBaseUrlForPostmanRequest = (operationItem) => {
    let serverObj = _.get(operationItem, 'servers.0'),
      baseUrl = '{{baseUrl}}',
      serverVariables = [],
      pathVariables = [],
      collectionVariables = [];

    if (!serverObj) {
      return { collectionVariables, pathVariables, baseUrl };
    }

    baseUrl = sanitizeUrl(serverObj.url);
    _.forOwn(serverObj.variables, (value, key) => {
      serverVariables.push({
        key,
        value: value.default || ''
      });
    });

    ({ collectionVariables, pathVariables } = filterCollectionAndPathVariables(baseUrl, serverVariables));

    return { collectionVariables, pathVariables, baseUrl };
  },

  /**
   * Resolve a given ref from the schema
   * @param {Object} context - Global context object
   * @param {Object} $ref - Ref that is to be resolved
   * @param {Number} stackDepth - Depth of the current stack for Ref resolution
   * @param {Object} seenRef - Seen Reference map
   *
   * @returns {Object} Returns the object that staisfies the schema
   */
  resolveRefFromSchema = (context, $ref, stackDepth = 0, seenRef = {}) => {
    const { specComponents } = context;

    stackDepth++;

    seenRef[$ref] = true;
    if (stackDepth >= REF_STACK_LIMIT) {
      return { value: ERR_TOO_MANY_LEVELS };
    }

    if (context.schemaCache[$ref]) {
      return context.schemaCache[$ref];
    }

    if (!_.isFunction($ref.split)) {
      return { value: `reference ${schema.$ref} not found in the OpenAPI spec` };
    }

    let splitRef = $ref.split('/'),
      resolvedSchema;

    // .split should return [#, components, schemas, schemaName]
    // So length should atleast be 4
    if (splitRef.length < 4) {
      // not throwing an error. We didn't find the reference - generate a dummy value
      return { value: `reference ${$ref} not found in the OpenAPI spec` };
    }

    // something like #/components/schemas/PaginationEnvelope/properties/page
    // will be resolved - we don't care about anything before the components part
    // splitRef.slice(1) will return ['components', 'schemas', 'PaginationEnvelope', 'properties', 'page']
    // not using _.get here because that fails if there's a . in the property name (Pagination.Envelope, for example)
    splitRef = splitRef.slice(1).map((elem) => {
      // https://swagger.io/docs/specification/using-ref#escape
      // since / is the default delimiter, slashes are escaped with ~1
      return decodeURIComponent(
        elem
          .replace(/~1/g, '/')
          .replace(/~0/g, '~')
      );
    });

    resolvedSchema = _getEscaped(specComponents, splitRef);

    if (!resolvedSchema) {
      return { value: 'reference ' + $ref + ' not found in the OpenAPI spec' };
    }

    if (resolvedSchema.$ref) {
      if (seenRef[resolvedSchema.$ref]) {
        return {
          value: `<Circular reference to ${resolvedSchema.$ref} detected>`
        };
      }
      return resolveRefFromSchema(context, resolvedSchema.$ref, stackDepth, _.cloneDeep(seenRef));
    }

    // eslint-disable-next-line no-use-before-define
    resolvedSchema = resolveSchema(context, resolvedSchema, stackDepth, CONVERSION, _.cloneDeep(seenRef));

    // Add the resolved schema to the global schema cache
    context.schemaCache[$ref] = resolvedSchema;

    return resolvedSchema;
  },

  /**
   * Resolve a given ref from an example
   * @param {Object} context - Global context object
   * @param {Object} $ref - Ref that is to be resolved
   * @param {Number} stackDepth - Depth of the current stack for Ref resolution
   * @param {Object} seenRef - Seen Reference map
   *
   * @returns {Object} Returns the object that staisfies the schema
   */
  resolveRefForExamples = (context, $ref, stackDepth = 0, seenRef = {}) => {
    const { specComponents } = context;

    stackDepth++;

    seenRef[$ref] = true;
    if (stackDepth >= REF_STACK_LIMIT) {
      return { value: ERR_TOO_MANY_LEVELS };
    }

    if (context.schemaCache[$ref]) {
      return context.schemaCache[$ref];
    }

    if (!_.isFunction($ref.split)) {
      return { value: `reference ${schema.$ref} not found in the OpenAPI spec` };
    }

    let splitRef = $ref.split('/'),
      resolvedExample;

    // .split should return [#, components, schemas, schemaName]
    // So length should atleast be 4
    if (splitRef.length < 4) {
      // not throwing an error. We didn't find the reference - generate a dummy value
      return { value: `reference ${$ref} not found in the OpenAPI spec` };
    }

    // something like #/components/schemas/PaginationEnvelope/properties/page
    // will be resolved - we don't care about anything before the components part
    // splitRef.slice(1) will return ['components', 'schemas', 'PaginationEnvelope', 'properties', 'page']
    // not using _.get here because that fails if there's a . in the property name (Pagination.Envelope, for example)
    splitRef = splitRef.slice(1).map((elem) => {
      // https://swagger.io/docs/specification/using-ref#escape
      // since / is the default delimiter, slashes are escaped with ~1
      return decodeURIComponent(
        elem
          .replace(/~1/g, '/')
          .replace(/~0/g, '~')
      );
    });

    resolvedExample = _getEscaped(specComponents, splitRef);

    if (resolvedExample === undefined) {
      return { value: 'reference ' + $ref + ' not found in the OpenAPI spec' };
    }

    if (_.has(resolvedExample, '$ref')) {
      if (seenRef[resolvedExample.$ref]) {
        return {
          value: `<Circular reference to ${resolvedExample.$ref} detected>`
        };
      }
      return resolveRefFromSchema(context, resolvedExample.$ref, stackDepth, _.cloneDeep(seenRef));
    }

    // Add the resolved schema to the global schema cache
    context.schemaCache[$ref] = resolvedExample;

    return resolvedExample;
  },

  resolveExampleData = (context, exampleData) => {
    if (_.has(exampleData, '$ref')) {
      const resolvedRef = resolveRefForExamples(context, exampleData.$ref);
      exampleData = resolveExampleData(context, resolvedRef);
    }
    else if (typeof exampleData === 'object') {
      _.forOwn(exampleData, (data, key) => {
        exampleData[key] = resolveExampleData(context, data);
      });
    }

    return exampleData;
  },

  /**
   * returns first example in the input map
   * @param {Object} context - Global context object
   * @param {Object} exampleObj - Object defined in the schema
   * @returns {*} first example in the input map type
   */
  getExampleData = (context, exampleObj) => {
    let example = {},
      exampleKey;

    if (typeof exampleObj !== 'object') {
      return '';
    }

    exampleKey = Object.keys(exampleObj)[0];
    example = exampleObj[exampleKey];

    if (example.$ref) {
      example = resolveRefFromSchema(context, example.$ref);
    }

    if (_.get(example, 'value')) {
      example = resolveExampleData(context, example.value);
    }

    return example;
  },

  /**
   * Handle resoltion of allOf property of schema
   *
   * @param {Object} context - Global context object
   * @param {Object} schema - Schema to be resolved
   * @param {Object} seenRef - Map of all the references that have been resolved
   *
   * @returns {Object} Resolved schema
   */
  resolveAllOfSchema = (context, schema, seenRef = {}) => {
    try {
      return mergeAllOf(_.assign(schema, {
        allOf: _.map(schema.allOf, (schema) => {
          // eslint-disable-next-line no-use-before-define
          return resolveSchema(context, schema, 0, CONVERSION, _.cloneDeep(seenRef));
        })
      }), {
        resolvers: {
          // for keywords in OpenAPI schema that are not standard defined JSON schema keywords, use default resolver
          defaultResolver: (compacted) => { return compacted[0]; }
        }
      });
    }
    catch (e) {
      console.warn('Error while resolving allOf schema: ', e);
      return { value: '<Error: Could not resolve allOf schema' };
    }
  },

  /**
   * Resolve a given ref from the schema
   *
   * @param {Object} context - Global context
   * @param {Object} schema - Schema that is to be resolved
   * @param {Number} [stack] - Current recursion depth
   * @param {String} resolveFor - For which action this resoltion is to be done
   * @param {Object} seenRef - Map of all the references that have been resolved
   *
   * @returns {Object} Returns the object that staisfies the schema
   */
  resolveSchema = (context, schema, stack = 0, resolveFor = CONVERSION, seenRef = {}) => {
    if (!schema) {
      return new Error('Schema is empty');
    }

    if (stack >= REF_STACK_LIMIT) {
      return { value: ERR_TOO_MANY_LEVELS };
    }

    stack++;

    const compositeSchema = schema.anyOf || schema.oneOf,
      { concreteUtils } = context;

    if (compositeSchema) {
      if (resolveFor === CONVERSION) {
        return resolveSchema(context, compositeSchema[0], stack, CONVERSION, _.cloneDeep(seenRef));
      }

      // TODO: Handle for validation
    }

    if (schema.allOf) {
      return resolveAllOfSchema(context, schema, _.cloneDeep(seenRef));
    }

    if (schema.$ref) {
      if (seenRef[schema.$ref]) {
        return {
          value: '<Circular reference to ' + schema.$ref + ' detected>'
        };
      }
      schema = resolveRefFromSchema(context, schema.$ref, stack, _.cloneDeep(seenRef));
    }

    if (
      concreteUtils.compareTypes(schema.type, SCHEMA_TYPES.object) ||
      schema.hasOwnProperty('properties')
    ) {
      let resolvedSchemaProps = {};

      _.forOwn(schema.properties, (property, propertyName) => {
        if (property.format === 'decimal') {
          delete property.format;
        }

        resolvedSchemaProps[propertyName] = resolveSchema(context, property, stack, CONVERSION, _.cloneDeep(seenRef));
      });

      schema.properties = resolvedSchemaProps;
      schema.type = schema.type || SCHEMA_TYPES.object;
    }
    // If schema is of type array
    else if (concreteUtils.compareTypes(schema.type, SCHEMA_TYPES.array) && schema.items) {
      // Add maxItem and minItem defintion since we want to enforce a limit on the number
      // of items being faked by schema faker

      if (!_.has(schema, 'minItems') && _.has(schema, 'maxItems') && schema.maxItems >= 2) {
        schema.minItems = 2;
      }

      // Override maxItems to minItems if minItems is available
      if (_.has(schema, 'minItems') && schema.minItems > 0) {
        schema.maxItems = schema.minItems;
      }

      // If no maxItems is defined than override with default (2)
      !_.has(schema, 'maxItems') && (schema.maxItems = 2);

      schema.items = resolveSchema(context, schema.items, stack, CONVERSION, _.cloneDeep(seenRef));
    }

    if (schema.hasOwnProperty('additionalProperties')) {
      schema.additionalProperties = _.isBoolean(schema.additionalProperties) ? schema.additionalProperties :
        resolveSchema(context, schema.additionalProperties, CONVERSION, _.cloneDeep(seenRef));
      schema.type = schema.type || SCHEMA_TYPES.object;
    }

    return schema;
  },

  /**
   * Provides information regarding serialisation of param
   *
   * @param {Object} param - OpenAPI Parameter object
   * @returns {Object} - Information regarding parameter serialisation. Contains following properties.
   * {
   *  style - style property defined/inferred from schema
   *  explode - explode property defined/inferred from schema
   *  startValue - starting value that is prepended to serialised value
   *  propSeparator - Character that separates two properties or values in serialised string of respective param
   *  keyValueSeparator - Character that separates key from values in serialised string of respective param
   *  isExplodable - whether params can be exploded (serialised value can contain key and value)
   * }
   */
  getParamSerialisationInfo = (context, param) => {
    let paramName = _.get(param, 'name'),
      paramSchema,
      style, // style property defined/inferred from schema
      explode, // explode property defined/inferred from schema
      propSeparator, // separates two properties or values
      keyValueSeparator, // separats key from value
      startValue = '', // starting value that is unique to each style
      // following prop represents whether param can be truly exploded, as for some style even when explode is true,
      // serialisation doesn't separate key-value
      isExplodable;

    // for invalid param object return null
    if (!_.isObject(param)) {
      return {};
    }

    // Resolve the ref and composite schemas
    paramSchema = resolveSchema(context, param.schema);

    isExplodable = paramSchema.type === 'object';

    // decide allowed / default style for respective param location
    switch (param.in) {
      case 'path':
        style = _.includes(['matrix', 'label', 'simple'], param.style) ? param.style : 'simple';
        break;
      case 'query':
        style = _.includes(['form', 'spaceDelimited', 'pipeDelimited', 'deepObject'], param.style) ?
          param.style : 'form';
        break;
      case 'header':
        style = 'simple';
        break;
      default:
        style = 'simple';
        break;
    }

    // decide allowed / default explode property for respective param location
    explode = (_.isBoolean(param.explode) ? param.explode : (_.includes(['form', 'deepObject'], style)));

    // decide explodable params, starting value and separators between key-value and properties for serialisation
    switch (style) {
      case 'matrix':
        isExplodable = paramSchema.type === 'object' || explode;
        startValue = ';' + ((paramSchema.type === 'object' && explode) ? '' : (paramName + '='));
        propSeparator = explode ? ';' : ',';
        keyValueSeparator = explode ? '=' : ',';
        break;
      case 'label':
        startValue = '.';
        propSeparator = '.';
        keyValueSeparator = explode ? '=' : '.';
        break;
      case 'form':
        // for 'form' when explode is true, query is devided into different key-value pairs
        propSeparator = keyValueSeparator = ',';
        break;
      case 'simple':
        propSeparator = ',';
        keyValueSeparator = explode ? '=' : ',';
        break;
      case 'spaceDelimited':
        explode = false;
        propSeparator = keyValueSeparator = '%20';
        break;
      case 'pipeDelimited':
        explode = false;
        propSeparator = keyValueSeparator = '|';
        break;
      case 'deepObject':
        // for 'deepObject' query is devided into different key-value pairs
        explode = true;
        break;
      default:
        break;
    }

    return { style, explode, startValue, propSeparator, keyValueSeparator, isExplodable };
  },

  /**
   * Resolve value of a given parameter
   *
   * @param {Object} param - Parameter that is to be resolved from schema
   * @returns {*} Value of the parameter
   */
  resolveValueOfParameter = (context, param, schemaFormat = SCHEMA_FORMATS.DEFAULT) => {
    if (!param || !param.hasOwnProperty('schema')) {
      return '';
    }

    const { indentCharacter } = context.computedOptions,
      resolvedSchema = resolveSchema(context, param.schema),
      { requestParametersResolution } = context.computedOptions,
      shouldGenerateFromExample = requestParametersResolution === 'example',
      hasExample = param.example !== undefined ||
        param.schema.example !== undefined ||
        param.examples !== undefined ||
        param.schema.examples !== undefined;

    if (shouldGenerateFromExample && hasExample) {
      /**
       * Here it could be example or examples (plural)
       * For examples, we'll pick the first example
       */
      let example;

      if (param.example !== undefined) {
        example = param.example;
      }
      else if (param.schema.example !== undefined) {
        example = _.has(param.schema.example, 'value') ? param.schema.example.value : param.schema.example;
      }
      else {
        example = getExampleData(context, param.examples || param.schema.examples);
      }

      return example;
    }

    schemaFaker.option({
      useExamplesValue: true
    });

    if (resolvedSchema.properties) {
      // If any property exists with format:binary (and type: string) schemaFaker crashes
      // we just delete based on format=binary
      for (const prop in resolvedSchema.properties) {
        if (resolvedSchema.properties.hasOwnProperty(prop)) {
          if (
            resolvedSchema.properties[prop].format === 'binary' ||
            resolvedSchema.properties[prop].format === 'byte' ||
            resolvedSchema.properties[prop].format === 'decimal'
          ) {
            delete resolvedSchema.properties[prop].format;
          }
        }
      }
    }

    try {
      if (schemaFormat === SCHEMA_FORMATS.XML) {
        return xmlFaker(null, resolvedSchema, indentCharacter);
      }

      // for JSON, the indentCharacter will be applied in the JSON.stringify step later on
      return schemaFaker(resolvedSchema, null, context.schemaValidationCache || {});
    }
    catch (e) {
      console.warn(
        'Error faking a schema. Not faking this schema. Schema:', resolvedSchema,
        'Error', e
      );

      return '';
    }
  },

  /**
   * Resolve the url of the Postman request from the operation item
   * @param {Object} operationPath - Exact path of the operation defined in the schema
   * @returns {String} Url of the request
   */
  resolveUrlForPostmanRequest = (operationPath) => {
    return sanitizeUrl(operationPath);
  },

  /**
   * Recursively extracts key-value pair from deep objects.
   *
   * @param {Object} deepObject - Deep object
   * @param {String} objectKey - key associated with deep object
   * @returns {Array} array of param key-value pairs
   */
  extractDeepObjectParams = (deepObject, objectKey) => {
    let extractedParams = [];

    Object.keys(deepObject).forEach((key) => {
      let value = deepObject[key];
      if (typeof value === 'object') {
        extractedParams = _.concat(extractedParams, extractDeepObjectParams(value, objectKey + '[' + key + ']'));
      }
      else {
        extractedParams.push({ key: objectKey + '[' + key + ']', value });
      }
    });
    return extractedParams;
  },

  /**
   * Gets the description of the parameter.
   * If the parameter is required, it prepends a `(Requried)` before the parameter description
   * If the parameter type is enum, it appends the possible enum values
   * @param {object} parameter - input param for which description needs to be returned
   * @returns {string} description of the parameters
   */
  getParameterDescription = (parameter) => {
    if (!_.isObject(parameter)) {
      return '';
    }

    return (parameter.required ? '(Required) ' : '') + (parameter.description || '') +
      (parameter.enum ? ' (This can only be one of ' + parameter.enum + ')' : '');
  },

  serialiseParamsBasedOnStyle = (context, param, paramValue) => {
    const { style, explode, startValue, propSeparator, keyValueSeparator, isExplodable } =
      getParamSerialisationInfo(context, param);

    let serialisedValue = '',
      description = getParameterDescription(param),
      paramName = _.get(param, 'name'),
      pmParams = [],
      isNotSerializable = false;

    // decide explodable params, starting value and separators between key-value and properties for serialisation
    // Ref: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.2.md#style-examples
    switch (style) {
      case 'form':
        if (explode && _.isObject(paramValue)) {
          const isArrayValue = _.isArray(paramValue);

          _.forEach(paramValue, (value, key) => {
            pmParams.push({
              key: isArrayValue ? paramName : key,
              value: (value === undefined ? '' : _.toString(value)),
              description
            });
          });

          return pmParams;
        }

        break;
      case 'deepObject':
        if (_.isObject(paramValue) && !_.isArray(paramValue)) {
          let extractedParams = extractDeepObjectParams(paramValue, paramName);

          _.forEach(extractedParams, (extractedParam) => {
            pmParams.push({
              key: extractedParam.key,
              value: _.toString(extractedParam.value) || '',
              description
            });
          });

          return pmParams;
        }
        else if (_.isArray(paramValue)) {
          isNotSerializable = true;
          pmParams.push({
            key: paramName,
            value: 'Not supported in OAS'
          });
        }

        break;
      default:
        break;
    }

    if (isNotSerializable) {
      return pmParams;
    }

    if (_.isObject(paramValue)) {
      _.forEach(paramValue, (value, key) => {
        // add property separator for all index/keys except first
        !_.isEmpty(serialisedValue) && (serialisedValue += propSeparator);

        // append key for param that can be exploded
        isExplodable && (serialisedValue += (key + keyValueSeparator));
        serialisedValue += (value === undefined ? '' : _.toString(value));
      });
    }
    // for non-object and non-empty value append value as is to string
    else if (!_.isNil(paramValue)) {
      serialisedValue += paramValue;
    }

    // prepend starting value to serialised value (valid for empty value also)
    serialisedValue = startValue + serialisedValue;
    pmParams.push({
      key: paramName,
      value: _.toString(serialisedValue),
      description
    });

    return pmParams;
  },

  getTypeOfContent = (content) => {
    if (_.isArray(content)) {
      return SCHEMA_TYPES.array;
    }

    return typeof content;
  },

  /**
   * Parses media type from given content-type header or media type
   * from content object into type and subtype
   *
   * @param {String} str - string to be parsed
   * @returns {Object} - Parsed media type into type and subtype
   */
  parseMediaType = (str) => {
    let simpleMediaTypeRegExp = /^\s*([^\s\/;]+)\/([^;\s]+)\s*(?:;(.*))?$/,
      match = simpleMediaTypeRegExp.exec(str),
      type = '',
      subtype = '';

    if (match) {
      // as mediatype name are case-insensitive keep it in lower case for uniformity
      type = _.toLower(match[1]);
      subtype = _.toLower(match[2]);
    }

    return { type, subtype };
  },

  /**
  * Get the format of content type header
  * @param {string} cTypeHeader - the content type header string
  * @returns {string} type of content type header
  */
  getHeaderFamily = (cTypeHeader) => {
    let mediaType = parseMediaType(cTypeHeader);

    if (mediaType.type === 'application' &&
      (mediaType.subtype === 'json' || _.endsWith(mediaType.subtype, '+json'))) {
      return HEADER_TYPE.JSON;
    }
    if ((mediaType.type === 'application' || mediaType.type === 'text') &&
      (mediaType.subtype === 'xml' || _.endsWith(mediaType.subtype, '+xml'))) {
      return HEADER_TYPE.XML;
    }
    return HEADER_TYPE.INVALID;
  },

  resolveRequestBodyData = (context, requestBodySchema, bodyType) => {
    let { requestParametersResolution, indentCharacter } = context.computedOptions,
      bodyData = '',
      shouldGenerateFromExample = requestParametersResolution === 'example',
      example,
      examples;

    if (_.isEmpty(requestBodySchema)) {
      return bodyData;
    }

    if (requestBodySchema.$ref) {
      requestBodySchema = resolveRefFromSchema(context, requestBodySchema.$ref);
    }

    /**
     * We'll be picking up example data from `value` only if
     * `value` is the only key present at the root level;
     * e.g: {
     *  example: {
     *    value: {
     *      a: 1,
     *      b: 1
     *    }
     *  }
     * }
     * In the above case example should be :{
     *      a: 1,
     *      b: 1
     *    }
     * example: {
     *    value: 1,
     *    a: 1,
     *    b: 2
     *  }
     * But for this example it should be {
     *    value: 1,
     *    a: 1,
     *    b: 2
     *  }
     */
    if (requestBodySchema.example !== undefined) {
      const shouldResolveValueKey = _.has(requestBodySchema.example, 'value') &&
        _.keys(requestBodySchema.example).length <= 1;

      example = shouldResolveValueKey ?
        requestBodySchema.example.value :
        requestBodySchema.example;
    }
    else if (_.get(requestBodySchema, 'schema.example') !== undefined) {
      const shouldResolveValueKey = _.has(requestBodySchema.schema.example, 'value') &&
        _.keys(requestBodySchema.schema.example).length <= 1;

      example = shouldResolveValueKey ?
        requestBodySchema.schema.example.value :
        requestBodySchema.schema.example;
    }

    examples = requestBodySchema.examples || _.get(requestBodySchema, 'schema.examples');

    requestBodySchema = requestBodySchema.schema || requestBodySchema;
    requestBodySchema = resolveSchema(context, requestBodySchema);

    if (shouldGenerateFromExample && (example !== undefined || examples)) {
      /**
       * Here it could be example or examples (plural)
       * For examples, we'll pick the first example
       */
      const exampleData = example || getExampleData(context, examples);

      bodyData = exampleData;
    }
    else if (requestBodySchema) {
      requestBodySchema = requestBodySchema.schema || requestBodySchema;

      if (requestBodySchema.$ref) {
        requestBodySchema = resolveRefFromSchema(context, requestBodySchema.$ref);
      }

      if (bodyType === APP_XML || bodyType === TEXT_XML) {
        return xmlFaker(null, requestBodySchema, indentCharacter);
      }

      schemaFaker.option({
        useExamplesValue: shouldGenerateFromExample
      });

      if (requestBodySchema.properties) {
        // If any property exists with format:binary or byte schemaFaker crashes
        // we just delete based on that format

        // TODO: This could have properties inside properties which needs to be handled
        // That's why for some properties we are not deleting the format
        _.forOwn(requestBodySchema.properties, (schema, prop) => {
          if (
            requestBodySchema.properties[prop].format === 'binary' ||
            requestBodySchema.properties[prop].format === 'byte' ||
            requestBodySchema.properties[prop].format === 'decimal'
          ) {
            delete requestBodySchema.properties[prop].format;
          }
        });
      }

      // This is to handle cases when the jsf throws errors on finding unsupported types/formats
      try {
        bodyData = schemaFaker(requestBodySchema, null, context.schemaValidationCache || {});
      }
      catch (e) {
        console.warn(
          'Error faking a schema. Not faking this schema. Schema:', requestBodySchema,
          'Error', e.message
        );

        return '';
      }
    }

    return bodyData;
  },

  resolveUrlEncodedRequestBodyForPostmanRequest = (context, requestBodyContent) => {
    let bodyData = '',
      urlEncodedParams = [],
      requestBodyData = {
        mode: 'urlencoded',
        urlencoded: urlEncodedParams
      };

    if (_.isEmpty(requestBodyContent)) {
      return requestBodyData;
    }

    if (_.has(requestBodyContent, 'schema.$ref')) {
      requestBodyContent.schema = resolveRefFromSchema(context, requestBodyContent.schema.$ref);
    }

    bodyData = resolveRequestBodyData(context, requestBodyContent.schema);

    const encoding = requestBodyContent.encoding || {};

    // Serialise the data
    _.forOwn(bodyData, (value, key) => {
      let description,
        required;

      if (requestBodyContent.schema) {
        description = _.get(requestBodyContent, ['schema', 'properties', key, 'description'], '');
        required = _.has(requestBodyContent.schema, 'required') ?
          _.indexOf(requestBodyContent.schema.required, key) !== -1 :
          _.get(requestBodyContent, ['schema.properties', key], false);
      }

      const param = encoding[key] || {};

      param.name = key;
      param.schema = { type: getTypeOfContent(value) };
      // Since serialisation of urlencoded body is same as query param
      // Setting .in property as query param
      param.in = 'query';
      param.description = description;
      param.required = required;

      urlEncodedParams.push(...serialiseParamsBasedOnStyle(context, param, value));
    });

    return {
      body: requestBodyData,
      headers: [{
        key: 'Content-Type',
        value: URLENCODED
      }]
    };
  },

  resolveFormDataRequestBodyForPostmanRequest = (context, requestBodyContent) => {
    let bodyData = '',
      formDataParams = [],
      requestBodyData = {
        mode: 'formdata',
        formdata: formDataParams
      };

    if (_.isEmpty(requestBodyContent)) {
      return requestBodyData;
    }

    bodyData = resolveRequestBodyData(context, requestBodyContent.schema);

    _.forOwn(bodyData, (value, key) => {
      let requestBodySchema,
        paramSchema,
        description,
        param;

      requestBodySchema = _.has(requestBodyContent, 'schema.$ref') ?
        resolveRefFromSchema(context, requestBodyContent.schema.$ref) :
        _.get(requestBodyContent, 'schema');

      paramSchema = _.get(requestBodySchema, ['properties', key], {});

      // Handle `required` array found the schema
      paramSchema.required = _.has(paramSchema, 'required') ?
        paramSchema.required :
        _.indexOf(requestBodySchema.required, key) !== -1;
      description = getParameterDescription(paramSchema);

      // TODO: Add handling for headers from encoding

      if (paramSchema && paramSchema.type === 'binary') {
        param = {
          key,
          value: '',
          type: 'file'
        };
      }
      else {
        param = {
          key,
          value: _.toString(value),
          type: 'text'
        };
      }

      param.description = description;

      formDataParams.push(param);
    });

    return {
      body: requestBodyData,
      headers: [{
        key: 'Content-Type',
        value: FORM_DATA
      }]
    };
  },

  getRawBodyType = (content) => {
    let bodyType;

    // checking for all possible raw types
    if (content.hasOwnProperty(APP_JS)) { bodyType = APP_JS; }
    else if (content.hasOwnProperty(APP_JSON)) { bodyType = APP_JSON; }
    else if (content.hasOwnProperty(TEXT_HTML)) { bodyType = TEXT_HTML; }
    else if (content.hasOwnProperty(TEXT_PLAIN)) { bodyType = TEXT_PLAIN; }
    else if (content.hasOwnProperty(APP_XML)) { bodyType = APP_XML; }
    else if (content.hasOwnProperty(TEXT_XML)) { bodyType = TEXT_XML; }
    else {
      // take the first property it has
      // types like image/png etc
      for (const cType in content) {
        if (content.hasOwnProperty(cType)) {
          bodyType = cType;
          break;
        }
      }
    }

    return bodyType;
  },

  resolveRawModeRequestBodyForPostmanRequest = (context, requestContent) => {
    let bodyType = getRawBodyType(requestContent),
      bodyData,
      headerFamily,
      dataToBeReturned = {},
      { concreteUtils } = context;

    headerFamily = getHeaderFamily(bodyType);

    if (concreteUtils.isBinaryContentType(bodyType, requestContent)) {
      dataToBeReturned = {
        mode: 'file'
      };
    }
    // Handling for Raw mode data
    else {
      bodyData = resolveRequestBodyData(context, requestContent[bodyType], bodyType);

      if ((bodyType === TEXT_XML || bodyType === APP_XML || headerFamily === HEADER_TYPE.XML)) {
        bodyData = getXmlVersionContent(bodyData);
      }

      const { indentCharacter } = context.computedOptions,
        rawModeData = !_.isObject(bodyData) && _.isFunction(_.get(bodyData, 'toString')) ?
          bodyData.toString() :
          JSON.stringify(bodyData, null, indentCharacter);

      dataToBeReturned = {
        mode: 'raw',
        raw: rawModeData
      };
    }

    if (headerFamily !== HEADER_TYPE.INVALID) {
      dataToBeReturned.options = {
        raw: {
          headerFamily,
          language: headerFamily
        }
      };
    }

    return {
      body: dataToBeReturned,
      headers: [{
        key: 'Content-Type',
        value: bodyType
      }]
    };
  },

  resolveRequestBodyForPostmanRequest = (context, operationItem) => {
    let requestBody = operationItem.requestBody,
      requestContent;

    if (!requestBody) {
      return requestBody;
    }

    if (requestBody.$ref) {
      requestBody = resolveRefFromSchema(context, requestBody.$ref);
    }

    requestContent = requestBody.content;

    if (requestContent[URLENCODED]) {
      return resolveUrlEncodedRequestBodyForPostmanRequest(context, requestContent[URLENCODED]);
    }

    if (requestContent[FORM_DATA]) {
      return resolveFormDataRequestBodyForPostmanRequest(context, requestContent[FORM_DATA]);
    }

    return resolveRawModeRequestBodyForPostmanRequest(context, requestContent);
  },

  resolveQueryParamsForPostmanRequest = (context, operationItem, method) => {
    const params = operationItem.parameters || operationItem[method].parameters,
      pmParams = [];

    _.forEach(params, (param) => {
      if (_.has(param, '$ref')) {
        param = resolveRefFromSchema(context, param.$ref);
      }

      if (param.in !== QUERYPARAM) {
        return;
      }

      let paramValue = resolveValueOfParameter(context, param);

      if (typeof paramValue === 'number' || typeof paramValue === 'boolean') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        paramValue = paramValue.toString();
      }

      const deserialisedParams = serialiseParamsBasedOnStyle(context, param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  },

  resolvePathParamsForPostmanRequest = (context, operationItem, method) => {
    const params = operationItem.parameters || operationItem[method].parameters,
      pmParams = [];

    _.forEach(params, (param) => {
      if (_.has(param, '$ref')) {
        param = resolveRefFromSchema(context, param.$ref);
      }

      if (param.in !== PATHPARAM) {
        return;
      }

      let paramValue = resolveValueOfParameter(context, param);

      if (typeof paramValue === 'number' || typeof paramValue === 'boolean') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        paramValue = paramValue.toString();
      }

      const deserialisedParams = serialiseParamsBasedOnStyle(context, param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  },

  resolveNameForPostmanReqeust = (context, operationItem, requestUrl) => {
    let reqName,
      { requestNameSource } = context.computedOptions;

    switch (requestNameSource) {
      case 'fallback' : {
        // operationId is usually camelcase or snake case
        reqName = operationItem.summary ||
            utils.insertSpacesInName(operationItem.operationId) ||
            operationItem.description || requestUrl;
        break;
      }
      case 'url' : {
        reqName = requestUrl;
        break;
      }
      default : {
        reqName = operationItem[requestNameSource] || '';
        break;
      }
    }

    return reqName;
  },

  resolveHeadersForPostmanRequest = (context, operationItem, method) => {
    const params = operationItem.parameters || operationItem[method].parameters,
      pmParams = [],
      { keepImplicitHeaders } = context.computedOptions;

    _.forEach(params, (param) => {
      if (_.has(param, '$ref')) {
        param = resolveRefFromSchema(context, param.$ref);
      }

      if (param.in !== HEADER) {
        return;
      }

      if (!keepImplicitHeaders && _.includes(IMPLICIT_HEADERS, _.toLower(_.get(param, 'name')))) {
        return;
      }

      let paramValue = resolveValueOfParameter(context, param);

      if (typeof paramValue === 'number' || typeof paramValue === 'boolean') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        paramValue = paramValue.toString();
      }

      const deserialisedParams = serialiseParamsBasedOnStyle(context, param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  },

  resolveResponseBody = (context, responseBody = {}) => {
    let responseContent, bodyType, bodyData, headerFamily;

    if (_.isEmpty(responseBody)) {
      return responseBody;
    }

    if (responseBody.$ref) {
      responseBody = resolveRefFromSchema(context, responseBody.$ref);
    }

    responseContent = responseBody.content;

    if (_.isEmpty(responseContent)) {
      return responseContent;
    }

    bodyType = getRawBodyType(responseContent);
    headerFamily = getHeaderFamily(bodyType);

    bodyData = resolveRequestBodyData(context, responseContent[bodyType], bodyType);

    if ((bodyType === TEXT_XML || bodyType === APP_XML || headerFamily === HEADER_TYPE.XML)) {
      bodyData = getXmlVersionContent(bodyData);
    }

    const { indentCharacter } = context.computedOptions,
      rawModeData = !_.isObject(bodyData) && _.isFunction(_.get(bodyData, 'toString')) ?
        bodyData.toString() :
        JSON.stringify(bodyData, null, indentCharacter);


    return {
      body: rawModeData,
      contentHeader: [{
        key: 'Content-Type',
        value: bodyType
      }],
      bodyType
    };
  },

  resolveResponseHeaders = (context, responseHeaders) => {
    const headers = [];

    if (_.has(responseHeaders, '$ref')) {
      responseHeaders = resolveRefFromSchema(context, responseHeaders.$ref);
    }

    _.forOwn(responseHeaders, (value, headerName) => {
      let headerValue = resolveValueOfParameter(context, value);

      if (typeof headerValue === 'number' || typeof headerValue === 'boolean') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        headerValue = headerValue.toString();
      }

      const headerData = Object.assign({}, value, { name: headerName }),
        serialisedHeader = serialiseParamsBasedOnStyle(context, headerData, headerValue);

      headers.push(...serialisedHeader);
    });

    return headers;
  },

  getPreviewLangugaForResponseBody = (bodyType) => {
    const headerFamily = getHeaderFamily(bodyType);

    return HEADER_TYPE_PREVIEW_LANGUAGE_MAP[headerFamily] || 'text';
  },

  resolveResponseForPostmanRequest = (context, operationItem, originalRequest) => {
    let responses = [];

    _.forOwn(operationItem.responses, (responseSchema, code) => {
      let response,
        { body, contentHeader = [], bodyType } = resolveResponseBody(context, responseSchema) || {},
        headers = resolveResponseHeaders(context, responseSchema.headers);

      response = {
        name: _.get(responseSchema, 'description'),
        body,
        headers: _.concat(contentHeader, headers),
        code,
        originalRequest,
        _postman_previewlanguage: getPreviewLangugaForResponseBody(bodyType)
      };

      responses.push(response);
    });

    return responses;
  };

module.exports = {
  resolvePostmanRequest: function (context, operationItem, path, method) {
    /**
     * schemaCache object will be used to cache the already resolved refs
     * in the schema.
     */
    context.schemaCache = {};

    let url = resolveUrlForPostmanRequest(path),
      baseUrlData = resolveBaseUrlForPostmanRequest(operationItem[method]),
      requestName = resolveNameForPostmanReqeust(context, operationItem[method], url),
      queryParams = resolveQueryParamsForPostmanRequest(context, operationItem, method),
      headers = resolveHeadersForPostmanRequest(context, operationItem, method),
      pathParams = resolvePathParamsForPostmanRequest(context, operationItem, method),
      { pathVariables, collectionVariables } = filterCollectionAndPathVariables(url, pathParams),
      requestBody = resolveRequestBodyForPostmanRequest(context, operationItem[method]),
      request,
      responses,
      securitySchema = _.get(operationItem, [method, 'properties.security']),
      authHelper = generateAuthForCollectionFromOpenAPI(context.openapi, securitySchema);

    headers.push(..._.get(requestBody, 'headers', []));
    pathVariables.push(...baseUrlData.pathVariables);
    collectionVariables.push(...baseUrlData.collectionVariables);

    url = _.get(baseUrlData, 'baseUrl', '') + url;

    request = {
      description: operationItem[method].description,
      url,
      name: requestName,
      method: method.toUpperCase(),
      params: {
        queryParams,
        pathParams: pathVariables
      },
      headers,
      body: _.get(requestBody, 'body'),
      auth: authHelper
    };

    responses = resolveResponseForPostmanRequest(context, operationItem[method], request);

    return {
      request: {
        name: requestName,
        request: Object.assign({}, request, {
          responses
        })
      },
      collectionVariables
    };
  }
};
