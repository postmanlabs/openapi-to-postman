const schemaFaker = require('../assets/json-schema-faker'),
  _ = require('lodash'),
  xmlFaker = require('./xmlSchemaFaker.js'),
  URLENCODED = 'application/x-www-form-urlencoded',

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

    if (!rootObject) {
      return defValue;
    }

    if (_.isEmpty(pathArray)) {
      return rootObject;
    }

    return _getEscaped(rootObject[pathArray.shift()], pathArray, defValue);
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
  REF_STACK_LIMIT = 10,
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
    let matches = url.match(/(\/\{\{[^\/\{\}]+\}\})(?=\/|$)/g);

    if (matches) {
      matches.forEach((match) => {
        const replaceWith = match.replace(/{{/g, ':').replace(/}}/g, '');
        url = url.replace(match, replaceWith);
      });
    }

    return url;
  },

  /**
   * Resolve a given ref from the schema
   * @param {Object} context - Global context object
   * @param {Object} $ref - Ref that is to be resolved
   * @param {Number} stackDepth - Depth of the current stack for Ref resolution
   * @returns {Object} Returns the object that staisfies the schema
   */
  // TODO: Add caching of ref
  resolveRefFromSchema = (context, $ref, stackDepth = 0) => {
    const { specComponents } = context;

    stackDepth++;

    if (stackDepth >= REF_STACK_LIMIT) {
      return { value: ERR_TOO_MANY_LEVELS };
    }

    if (!_.isFunction($ref.split)) {
      return { value: 'reference ' + schema.$ref + ' not found in the OpenAPI spec' };
    }

    let splitRef = $ref.split('/'),
      resolvedSchema;

    // .split should return [#, components, schemas, schemaName]
    // So length should atleast be 4
    if (splitRef.length < 4) {
      // not throwing an error. We didn't find the reference - generate a dummy value
      return { value: 'reference ' + $ref + ' not found in the OpenAPI spec' };
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
      return resolveRefFromSchema(context, resolvedSchema.$ref, stackDepth);
    }

    return resolvedSchema;
  },

  /**
   * Resolve a given ref from the schema
   *
   * @param {Object} context - Global context
   * @param {Object} schema - Schema that is to be resolved
   * @param {String} resolveFor - For which action this resoltion is to be done
   * @returns {Object} Returns the object that staisfies the schema
   */
  resolveSchema = (context, schema, resolveFor = CONVERSION) => {
    if (!schema) {
      return new Error('Schema is empty');
    }

    const compositeSchema = schema.anyOf || schema.oneOf,
      { concreteUtils } = context;

    if (compositeSchema) {
      if (resolveFor === CONVERSION) {
        return resolveSchema(context, compositeSchema[0]);
      }

      // TODO: Handle for validation
    }

    // TODO: Handle allOf

    if (schema.$ref) {
      schema = resolveRefFromSchema(context, schema.$ref);
    }

    if (
      concreteUtils.compareTypes(schema.type, SCHEMA_TYPES.object) ||
      schema.hasOwnProperty('properties') ||
      (schema.hasOwnProperty('additionalProperties') && !schema.hasOwnProperty('type'))
    ) {
      // TODO: Handle case for objects
    }
    // If schema is of type array
    else if (concreteUtils.compareTypes(schema.type, SCHEMA_TYPES.array) && schema.items) {
      // TODO: Handle case for array
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
  getParamSerialisationInfo = (param) => {
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
    paramSchema = resolveSchema(param.schema);

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
      resolvedSchema = resolveSchema(context, param.schema);

    // TODO: Handle resolving to examples
    // if (options.resolveTo === 'example') {}

    schemaFaker.option({
      useExamplesValue: false
    });

    if (resolvedSchema.properties) {
      // If any property exists with format:binary (and type: string) schemaFaker crashes
      // we just delete based on format=binary
      for (const prop in resolvedSchema.properties) {
        if (resolvedSchema.properties.hasOwnProperty(prop)) {
          if (resolvedSchema.properties[prop].format === 'binary') {
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

    // TODO: Check whether we should return whole example if value is not found

    return example.value;
  },

  serialiseParamsBasedOnStyle = (param, paramValue) => {
    const { style, explode, startValue, propSeparator, keyValueSeparator, isExplodable } =
      getParamSerialisationInfo(param);

    let serialisedValue = '',
      description = getParameterDescription(param),
      paramName = _.get(param, 'name'),
      pmParams = [];

    // decide explodable params, starting value and separators between key-value and properties for serialisation
    // Ref: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.2.md#style-examples
    switch (style) {
      case 'form':
        if (explode && _.isObject(paramValue)) {
          const isArrayValue = _.isArray(paramValue);

          _.forEach(paramValue, (value, key) => {
            pmParams.push({
              key: isArrayValue ? paramName : key,
              value: (value === undefined ? '' : value),
              description
            });
          });

          return pmParams;
        }

        break;
      case 'deepObject':
        // TODO: Confirm whether we should ignore array types here
        if (_.isObject(paramValue) && !_.isArray(paramValue)) {
          let extractedParams = extractDeepObjectParams(paramValue, paramName);

          _.forEach(extractedParams, (extractedParam) => {
            pmParams.push({
              key: extractedParam.key,
              value: extractedParam.value || '',
              description
            });
          });

          return pmParams;
        }

        break;
      default:
        break;
    }

    if (_.isObject(paramValue)) {
      _.forEach(paramValue, (value, key) => {
        // add property separator for all index/keys except first
        !_.isEmpty(serialisedValue) && (serialisedValue += propSeparator);

        // append key for param that can be exploded
        isExplodable && (serialisedValue += (key + keyValueSeparator));
        serialisedValue += (value === undefined ? '' : value);
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
      value: serialisedValue,
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

  resolveUrlEncodedRequestBodyForPostmanRequest = (context, requestBodyContent) => {
    let { requestParametersResolution } = context.computedOptions,
      bodyData = '',
      urlEncodedParams = [],
      requestBodyData = {
        mode: 'urlencoded',
        urlEncoded: urlEncodedParams
      },
      requestBodySchema,
      shouldGenerateFromExample = requestParametersResolution === 'example';

    if (_.isEmpty(requestBodyContent)) {
      return requestBodyData;
    }

    requestBodySchema = requestBodyContent.schema;

    if (shouldGenerateFromExample) {
      /**
       * Here it could be example or examples (plural)
       * For examples, we'll pick the first example
       */
      const example = requestBodyContent.example || getExampleData(context, requestBodyContent.examples);

      bodyData = example;
    }
    else if (requestBodySchema) {
      if (requestBodySchema.$ref) {
        requestBodySchema = resolveRefFromSchema(context, requestBodySchema.$ref);
      }

      schemaFaker.option({
        useExamplesValue: shouldGenerateFromExample
      });

      bodyData = schemaFaker(requestBodySchema, null, context.schemaValidationCache || {});
    }

    const encoding = requestBodyContent.encoding;

    // Serialise the data
    _.forOwn(bodyData, (value, key) => {
      let description,
        required;

      if (requestBodyContent.schema) {
        description = _.get(requestBodyContent, ['schema', 'properties', key, 'description'], '');
        required = _.get(requestBodyContent, ['schema', 'required'], true);
      }

      const param = encoding[key] || {};

      param.name = key;
      param.schema = { type: getTypeOfContent(value) };
      // Since serialisation of urlencoded body is same as query param
      // Setting .in property as query param
      param.in = 'query';
      param.description = description;
      param.required = required;

      urlEncodedParams.push(...serialiseParamsBasedOnStyle(param, value));
    });

    return requestBodyData;
  },

  resolveRequestBodyForPostmanRequest = (context, operationItem) => {
    let requestBody = operationItem.requestBody,
      requestContent;

    if (requestBody.$ref) {
      requestBody = resolveRefFromSchema(context, requestBody.$ref);
    }

    requestContent = requestBody.content;

    if (requestContent[URLENCODED]) {
      return resolveUrlEncodedRequestBodyForPostmanRequest(context, requestContent[URLENCODED]);
    }

    // TODO: Add handling for json type and multipart/form-data
  },

  resolveQueryParamsForPostmanRequest = (context, operationItem) => {
    const params = operationItem.parameters,
      pmParams = [];

    _.forEach(params, (param) => {
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

      const deserialisedParams = serialiseParamsBasedOnStyle(param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  },

  resolvePathParamsForPostmanRequest = (context, operationItem) => {
    const params = operationItem.parameters,
      pmParams = [];

    _.forEach(params, (param) => {
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

      const deserialisedParams = serialiseParamsBasedOnStyle(param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  },

  resolveHeadersForPostmanRequest = (context, operationItem) => {
    const params = operationItem.parameters,
      pmParams = [];

    _.forEach(params, (param) => {
      if (param.in !== HEADER) {
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

      const deserialisedParams = serialiseParamsBasedOnStyle(param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  };
module.exports = {
  resolvePostmanRequest: function (context, operationItem, path, method) {
    const url = resolveUrlForPostmanRequest(path),
      queryParams = resolveQueryParamsForPostmanRequest(context, operationItem),
      headers = resolveHeadersForPostmanRequest(context, operationItem),
      pathParams = resolvePathParamsForPostmanRequest(context, operationItem),
      requestBody = resolveRequestBodyForPostmanRequest(context, operationItem);

    return;
  }
};
