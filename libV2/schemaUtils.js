const QUERYPARAM = 'query',
  CONVERSION = 'conversion',
  HEADER = 'header';

module.exports = {
  /**
  * Changes the {} around scheme and path variables to :variable
  * @param {string} url - the url string
  * @returns {string} string after replacing /{pet}/ with /:pet/
  */
  sanitizeUrl: function (url) {
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
    let matches = this.findPathVariablesFromPath(url);

    if (matches) {
      matches.forEach((match) => {
        const replaceWith = match.replace(/{{/g, ':').replace(/}}/g, '');
        url = url.replace(match, replaceWith);
      });
    }

    return url;
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
  getParamSerialisationInfo: function (param) {
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
    paramSchema = this.resolveSchema(param.schema);

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
   * Resolve a given ref from the schema
   * @param {String} $ref - Ref that is to be resolved
   * @returns {Object} Returns the object that staisfies the schema
   */
  resolveRefFromSchema: function (context, $ref, resolveFor, resolveFor) {
    const {schema, schemaCache} = context;
  },

  /**
   * Resolve a given ref from the schema
   * @param {Object} schema - Schema that is to be resolved
   * @param {String} resolveFor - For which action this resoltion is to be done
   * @returns {Object} Returns the object that staisfies the schema
   */
  resolveSchema: function (schema, resolveFor = CONVERSION) {
    if (!schema) {
      return new Error('Schema is empty');
    }

    const compositeSchema = schema.anyOf || schema.oneOf;

    if (compositeSchema) {
      if (resolveFor === CONVERSION) {
        return this.resolveSchema(compositeSchema[0]);
      }

      // TODO: Handle for validation
    }

    if (schema.$ref) {
      return this.resolveRefFromSchema(schema.$ref);
    }

    return schema;
  },

  /**
   * Resolve value of a given parameter
   *
   * @param {Object} param - Parameter that is to be resolved from schema
   * @returns {*} Value of the parameter
   */
  resolveValueOfParameter: function (param) {
    if (!param || !param.hasOwnProperty('schema')) {
      return '';
    }

    if (param.schema.$ref) {
      param.schema = this.resolveRefFromSchema(param.schema.$ref);
    }

    // TODO: Use schema faker to generate the value
  },

  /**
   * Resolve the url of the Postman request from the operation item
   * @param {Object} operationItem - OperationItem from schema present at the path
   * @property {String} operationItem.path - Exact path of the operation defined in the schema
   * @returns {String} Url of the request
   */
  resolveUrlForPostmanRequest: function (operationItem) {
    return this.sanitizeUrl(operationItem.path);
  },

  /**
   * Recursively extracts key-value pair from deep objects.
   *
   * @param {Object} deepObject - Deep object
   * @param {String} objectKey - key associated with deep object
   * @returns {Array} array of param key-value pairs
   */
  extractDeepObjectParams: function (deepObject, objectKey) {
    let extractedParams = [];

    Object.keys(deepObject).forEach((key) => {
      let value = deepObject[key];
      if (typeof value === 'object') {
        extractedParams = _.concat(extractedParams, this.extractDeepObjectParams(value, objectKey + '[' + key + ']'));
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
  getParameterDescription: function(parameter) {
    if (!_.isObject(parameter)) {
      return '';
    }
    return (parameter.required ? '(Required) ' : '') + (parameter.description || '') +
      (parameter.enum ? ' (This can only be one of ' + parameter.enum + ')' : '');
  },

  serialiseParamsBasedOnStyle: function (param, paramValue) {
    const { style, explode, startValue, propSeparator, keyValueSeparator, isExplodable } =
    this.getParamSerialisationInfo(param);

    let serialisedValue,
      description = this.getParameterDescription(param),
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
        }

        break;
      case 'deepObject':
        // TODO: Confirm whether we should ignore array types here
        if (_.isObject(paramValue) && !_.isArray(paramValue)) {
          let extractedParams = this.extractDeepObjectParams(paramValue, paramName);

          _.forEach(extractedParams, (extractedParam) => {
            pmParams.push({
              key: extractedParam.key,
              value: extractedParam.value || '',
              description
            });
          });
        }

        break;
      default:
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

        break;
    }

    return pmParams;
  },

  resolveQueryParamsForPostmanRequest: function (operationItem) {
    const params = operationItem.properties.parameters,
      pmParams = [];

    _.forEach(params, (param) => {
      if (param.in !== QUERYPARAM) {
        return;
      }

      let paramValue = this.resolveValueOfParameter(param);

      if (typeof paramValue === 'number' || typeof paramValue === 'boolean') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        paramValue = paramValue.toString();
      }

      const deserialisedParams = this.serialiseParamsBasedOnStyle(param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  },

  resolveHeadersForPostmanRequest: function (operationItem) {
    const params = operationItem.properties.parameters,
      pmParams = [];

    _.forEach(params, (param) => {
      if (param.in !== HEADER) {
        return;
      }

      let paramValue = this.resolveValueOfParameter(param);

      if (typeof paramValue === 'number' || typeof paramValue === 'boolean') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        paramValue = paramValue.toString();
      }

      const deserialisedParams = this.serialiseParamsBasedOnStyle(param, paramValue);

      pmParams.push(...deserialisedParams);
    });

    return pmParams;
  }
};
