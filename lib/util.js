const sdk = require('postman-collection'),
  schemaFaker = require('../assets/json-schema-faker.js'),
  parse = require('./parse.js'),
  deref = require('./deref.js'),
  _ = require('lodash'),
  xmlFaker = require('./xmlSchemaFaker.js'),
  openApiErr = require('./error.js'),
  { Node, Trie } = require('./trie.js'),
  SCHEMA_FORMATS = {
    DEFAULT: 'default', // used for non-request-body data and json
    XML: 'xml' // used for request-body XMLs
  },
  URLENCODED = 'application/x-www-form-urlencoded',
  APP_JSON = 'application/json',
  APP_VND_JSON = 'application/vnd.api+json',
  APP_JS = 'application/javascript',
  APP_XML = 'application/xml',
  TEXT_XML = 'text/xml',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  FORM_DATA = 'multipart/form-data',
  authMap = {
    basicAuth: 'basic',
    bearerAuth: 'bearer',
    digestAuth: 'digest',
    hawkAuth: 'hawk',
    oAuth1: 'oauth1',
    oAuth2: 'oauth2',
    ntlmAuth: 'ntlm',
    awsSigV4: 'awsv4',
    normal: null
  },

  // These are the methods supported in the PathItem schema
  // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
  METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

// See https://github.com/json-schema-faker/json-schema-faker/tree/master/docs#available-options
schemaFaker.option({
  requiredOnly: false,
  optionalsProbability: 1.0, // always add optional fields
  minLength: 4, // for faked strings
  maxLength: 4,
  minItems: 1, // for arrays
  maxItems: 2,
  useDefaultValue: true,
  ignoreMissingRefs: true
});

/**
* Safe wrapper for schemaFaker that resolves references and
* removes things that might make schemaFaker crash
* @param {*} oldSchema the schema to fake
* @param {*} components list of predefined components (with schemas)
* @param {string} schemaFormat default or xml
* @param {string} indentCharacter char for 1 unit of indentation
* @returns {object} fakedObject
*/
function safeSchemaFaker(oldSchema, components, schemaFormat, indentCharacter) {
  var prop,
    schema = deref.resolveRefs(oldSchema, components);

  if (schema.properties) {
    // If any property exists with format:binary (and type: string) schemaFaker crashes
    // we just delete based on format=binary
    for (prop in schema.properties) {
      if (schema.properties.hasOwnProperty(prop)) {
        if (schema.properties[prop].format === 'binary') {
          delete schema.properties[prop].format;
        }
      }
    }
  }

  try {
    if (schemaFormat === SCHEMA_FORMATS.XML) {
      return xmlFaker(null, schema, indentCharacter);
    }
    // for JSON, the indentCharacter will be applied in the JSON.stringify step later on
    return schemaFaker(schema);
  }
  catch (e) {
    console.warn(
      'Error faking a schema. Not faking this schema. Schema:', schema,
      'Error', e
    );
    return null;
  }
}

module.exports = {
  // list of predefined schemas in components
  components: {},
  options: {},
  safeSchemaFaker: safeSchemaFaker,

  /**
  * Changes the {} around scheme and path variables to :variable
  * @param {string} url - the url string
  * @returns {string} string after replacing /{pet}/ with /:pet/
  */
  fixPathVariablesInUrl: function (url) {
    // All complicated logic removed
    // This simply replaces all instances of {text} with {{text}}
    // text cannot have any of these 3 chars: /{}
    // and {text} cannot be followed by a }
    // {{text}} will not be converted
    // https://regex101.com/r/9N1520/1
    return url
      .replace(/(\{[^\/\{\}]+\})(?!\})/g, '{$1}');
  },

  /**
   * Converts the neccessary server variables to the
   * something that can be added to the collection
   * TODO: Figure out better description
   * @param {object} serverVariables - Object containing the server variables at the root/path-item level
   * @param {string} keyName - an additional key to add the serverUrl to the variable list
   * @param {string} serverUrl - URL from the server object
   * @returns {object} modified collection after the addition of the server variables
   */
  convertToPmCollectionVariables: function(serverVariables, keyName, serverUrl = '') {
    var variables = [];
    if (serverVariables) {
      _.forOwn(serverVariables, (value, key) => {
        variables.push(new sdk.Variable({
          id: key,
          value: value.default || '',
          description: value.description + (value.enum ? ' (is one of ' + value.enum + ')' : '')
        }));
      });
    }
    if (keyName) {
      variables.push(new sdk.Variable({
        id: keyName,
        value: serverUrl,
        type: 'string'
      }));
    }
    return variables;
  },

  /**
   * Parses an OAS string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.x specification specified in either YAML or JSON
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
   * @no-unit-test
   */
  parseSpec: function (openApiSpec) {
    var openApiObj = openApiSpec,
      detailedError,
      rootValidation;

    // If the open api specification is a string could be YAML or JSON
    if (typeof openApiSpec === 'string') {
      try {
        openApiObj = parse.asYaml(openApiSpec);
      }
      catch (yamlException) {
        // Not valid YAML, could be a JSON as well
        try {
          openApiObj = parse.asJson(openApiSpec);
        }
        catch (jsonException) {
          // It's neither JSON nor YAML
          // try and determine json-ness or yaml-ness
          if (openApiSpec && openApiSpec[0] === '{') {
            // probably JSON
            detailedError = ' ' + jsonException.message;
          }
          else if (openApiSpec && openApiSpec.indexOf('openapi:') === 0) {
            // probably YAML
            detailedError = ' ' + yamlException.message;
          }
          return {
            result: false,
            reason: 'Invalid format. Input must be in YAML or JSON format.' + detailedError
          };
        }
      }
    }

    // spec is a valid JSON object at this point

    // Validate the root level object for semantics
    rootValidation = parse.validateRoot(openApiObj);
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

  /**
   * Returns params applied to specific operation with resolved references. Params from parent
   * blocks (collection/folder) are merged, so that the request has a flattened list of params needed.
   * OperationParams take precedence over pathParams
   * @param {array} operationParam operation (Postman request)-level params.
   * @param {array} pathParam are path parent-level params.
   * @returns {*} combined requestParams from operation and path params.
   */
  getRequestParams: function(operationParam, pathParam) {
    if (!_.isEmpty(pathParam)) {
      // if pathParams exist, resolve refs
      pathParam.forEach((param, index, arr) => {
        if (param.hasOwnProperty('$ref')) {
          arr[index] = this.getRefObject(param.$ref);
        }
      });
    }
    if (!_.isEmpty(operationParam)) {
      // if operationParams exist, resolve references
      operationParam.forEach((param, index, arr) => {
        if (param.hasOwnProperty('$ref')) {
          arr[index] = this.getRefObject(param.$ref);
        }
      });
    }

    if (_.isEmpty(pathParam)) {
      return operationParam;
    }
    else if (_.isEmpty(operationParam)) {
      return pathParam;
    }

    // If both path and operation params exist,
    // we need to de-duplicate
    // A param with the same name and 'in' value from operationParam
    // will get precedence
    var reqParam = operationParam.slice();
    pathParam.forEach((param) => {
      var dupParam = operationParam.find(function(element) {
        return element.name === param.name && element.in === param.in;
      });
      if (!dupParam) {
        // if there's no duplicate param in operationParam,
        // use the one from the common pathParam list
        // this ensures that operationParam is given precedence
        reqParam.push(param);
      }
    });
    return reqParam;
  },

  /**
   * Generates a Trie-like folder structure from the root path object of the OpenAPI specification.
   * @param {Object} spec - specification in json format
   * @returns {Object} - The final object consists of the tree structure and collection variables
   */
  generateTrieFromPaths: function (spec) {
    var paths = spec.paths, // the first level of paths
      currentPath = '',
      currentPathObject = '',
      commonParams = '',
      collectionVariables = {},
      operationItem,
      pathLevelServers = '',
      pathLength,
      currentPathRequestCount,
      currentNode,
      i,
      summary,
      path,
      pathMethods = [],
      // creating a root node for the trie (serves as the root dir)
      trie = new Trie(new Node({
        name: '/'
      })),

      // returns a list of methods supported at each pathItem
      // some pathItem props are not methods
      // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
      getPathMethods = function(pathKeys) {
        var methods = [];
        // TODO: Show warning for incorrect schema if !pathKeys
        pathKeys && pathKeys.forEach(function(element) {
          if (METHODS.includes(element)) {
            methods.push(element);
          }
        });
        return methods;
      };

    for (path in paths) {
      if (paths.hasOwnProperty(path)) {
        currentPathObject = paths[path];

        // discard the leading slash, if it exists
        if (path[0] === '/') {
          path = path.substring(1);
        }

        // split the path into indiv. segments for trie generation
        // unless path it the root endpoint
        currentPath = path === '' ? ['(root)'] : path.split('/').filter((pathItem) => {
          // remove any empty pathItems that might have cropped in
          // due to trailing or double '/' characters
          return pathItem !== '';
        });

        pathLength = currentPath.length;

        // get method names available for this path
        pathMethods = getPathMethods(Object.keys(currentPathObject));

        // the number of requests under this node
        currentPathRequestCount = pathMethods.length;
        currentNode = trie.root;

        // adding children for the nodes in the trie
        // start at the top-level and do a DFS
        for (i = 0; i < pathLength; i++) {
          if (!currentNode.children[currentPath[i]]) {
            // if the currentPath doesn't already exist at this node,
            // add it as a folder
            currentNode.addChildren(currentPath[i], new Node({
              name: currentPath[i],
              requestCount: 0,
              requests: [],
              children: {},
              type: 'item-group',
              childCount: 0
            }));

            /* eslint-disable max-depth */
            if (!currentNode.childCount) {
              currentNode.childCount = 1;
            }
            else {
              currentNode.childCount += 1;
            }
            /* eslint-enable */
          }
          // requestCount increment for the node we just added
          currentNode.children[currentPath[i]].requestCount += currentPathRequestCount;
          currentNode = currentNode.children[currentPath[i]];
        }

        // extracting common parameters for all the methods in the current path item
        if (currentPathObject.hasOwnProperty('parameters')) {
          commonParams = currentPathObject.parameters;
        }

        // storing common path/collection vars from the server object at the path item level
        if (currentPathObject.hasOwnProperty('servers')) {
          pathLevelServers = currentPathObject.servers;
          collectionVariables[path + 'Url'] = pathLevelServers[0];
          delete currentPathObject.servers;
        }

        // add methods to node
        // eslint-disable-next-line no-loop-func
        _.each(pathMethods, (method) => {
          // base operationItem
          operationItem = currentPathObject[method];
          // params - these contain path/header/body params
          operationItem.parameters = this.getRequestParams(operationItem.parameters, commonParams);
          // auth info - local security object takes precedence over the parent object
          operationItem.security = operationItem.security || spec.security;
          summary = operationItem.summary || operationItem.description;
          currentNode.addMethod({
            name: summary,
            method: method,
            path: path,
            properties: operationItem,
            type: 'item',
            servers: pathLevelServers || undefined
          });
        });
        pathLevelServers = undefined;
        commonParams = [];
      }
    }

    return {
      tree: trie,
      variables: collectionVariables // server variables that are to be converted into collection variables.
    };
  },

  /**
   * Generates an array of SDK Variables from the common and provided path vars
   * @param {string} type - Level at the tree root/path level. Can be method/root/param.
   * method: request(operation)-level, root: spec-level,  param: url-level
   * @param {Array<object>} providedPathVars - Array of path variables
   * @param {object|array} commonPathVars - Object of path variables taken from the specification
   * @returns {Array<object>} returns an array of sdk.Variable
   */
  convertPathVariables: function(type, providedPathVars, commonPathVars) {
    var variables = providedPathVars;
    // converting the base uri path variables, if any
    // commonPathVars is an object for type = root/method
    // array otherwise
    if (type === 'root' || type === 'method') {
      _.forOwn(commonPathVars, (value, key) => {
        variables.push({
          key: key,
          value: type === 'root' ? '{{' + key + '}}' : value.default,
          description: (value.description || '') + (value.enum ?
            ' (This can only be one of ' + value.enum.toString() + ')' : '')
        });
      });
    }
    else {
      _.forEach(commonPathVars, (variable) => {
        variables.push({
          key: variable.name,
          // we only fake the schema for param-level pathVars
          value: this.options.schemaFaker ?
            safeSchemaFaker(variable.schema || {}, this.components, SCHEMA_FORMATS.DEFAULT) : '',
          description: variable.description || ''
        });
      });
    }

    return variables;
  },

  /**
   * Helper function to generate a query string from an object with kvPairs
   * that will be merged with the provided delimiter
   * See apporpriate unit test for example usage
   * @param {String} kvPairs - object containing the kvPairs which need to be merged
   * @param {String} delimiter - the delimiter which is to be used
   * @returns {String} returns the query string with the delimiter at appropriate points
   */
  getQueryStringWithStyle: function(kvPairs, delimiter) {
    var queryStringArray = [];
    _.forOwn(kvPairs, (value, key) => {
      queryStringArray.push(
        key +
        ((value !== undefined) ? (delimiter + value) : '')
      );
    });
    return queryStringArray.join(delimiter);
  },

  /**
   * Converts Title/Camel case to a space-separated string
   * @param {*} string - string in snake/camelCase
   * @returns {string} space-separated string
   */
  insertSpacesInName: function (string) {
    if (!string || (typeof string !== 'string')) {
      return '';
    }

    return string
      .replace(/([a-z])([A-Z])/g, '$1 $2') // convert createUser to create User
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // convert NASAMission to NASA Mission
      .replace(/(_+)([a-zA-Z0-9])/g, ' $2'); // convert create_user to create user
  },

  /**
   * convert childItem from OpenAPI to Postman itemGroup if requestCount(no of requests inside childitem)>1
   * otherwise return postman request
   * @param {*} openapi object with root-level data like pathVariables baseurl
   * @param {*} child object is of type itemGroup or request
   * @returns {*} Postman itemGroup or request
   * @no-unit-test
   */
  convertChildToItemGroup: function(openapi, child) {
    var resource = child,
      itemGroup,
      subChild,
      item,
      i,
      requestCount;

    // it's a folder
    if (resource.type === 'item-group') {
      // 3 options:

      // 1. folder with more than one request in its subtree
      // (immediate children or otherwise)
      if (resource.requestCount > 1) {
        // only return a Postman folder if this folder has>1 requests in its subtree
        // otherwise we can end up with 10 levels of folders with 1 request in the end
        itemGroup = new sdk.ItemGroup({
          name: this.insertSpacesInName(resource.name)
          // TODO: have to add auth here (but first, auth to be put into the openapi tree)
        });

        // If a folder has only one child which is a folder then we collapsed the child folder
        // with parent folder.
        /* eslint-disable max-depth */
        if (resource.childCount === 1) {
          for (let subChild in resource.children) {
            if (resource.children[subChild].requests.length > 0 && resource.childCount === 1) {
              itemGroup.name = itemGroup.name + '/' + resource.children[subChild].name;
              for (let i = 0; i < resource.children[subChild].requests.length; i++) {
                itemGroup.items.add(
                  this.convertChildToItemGroup(openapi, resource.children[subChild].requests[i])
                );
              }
            }
            else {
              resource.children[subChild].name = resource.name + '/' + resource.children[subChild].name;
              return this.convertChildToItemGroup(openapi, resource.children[subChild]);
            }
          }
        }
        /* eslint-enable */
        else {
          // recurse over child leaf nodes
        // and add as children to this folder
          for (i = 0, requestCount = resource.requests.length; i < requestCount; i++) {
            itemGroup.items.add(
              this.convertChildToItemGroup(openapi, resource.requests[i])
            );
          }

          // recurse over child folders
          // and add as child folders to this folder
          /* eslint-disable */
          for (subChild in resource.children) {
            if (resource.children.hasOwnProperty(subChild) && resource.children[subChild].requestCount > 0) {
              itemGroup.items.add(
                this.convertChildToItemGroup(openapi, resource.children[subChild])
              );
            }
          }
          /* eslint-enable */
        }

        return itemGroup;
      }

      // 2. it has only 1 direct request of its own
      if (resource.requests.length === 1) {
        return this.convertChildToItemGroup(openapi, resource.requests[0]);
      }

      // 3. it's a folder that has no child request
      // but one request somewhere in its child folders
      for (subChild in resource.children) {
        if (resource.children.hasOwnProperty(subChild) && resource.children[subChild].requestCount === 1) {
          return this.convertChildToItemGroup(openapi, resource.children[subChild]);
        }
      }
    }

    // it's a request item
    item = this.convertRequestToItem(openapi, resource);
    return item;
  },

  /**
   * Gets helper object based on the root spec and the operation.security object
   * @param {*} openapi - the json object representing the OAS spec
   * @param {Array<object>} securitySet - the security object at an operation level
   * @returns {object} The authHelper to use while constructing the Postman Request. This is
   * not directly supported in the SDK - the caller needs to determine the header/body based on the return
   * value
   * @no-unit-test
   */
  getAuthHelper: function(openapi, securitySet) {
    var securityDef,
      helper;

    // return noAuth if security set is not defined
    // or is an empty array
    if (!securitySet || (Array.isArray(securitySet) && securitySet.length === 0)) {
      return {
        type: 'noauth'
      };
    }

    securitySet.forEach((security) => {
      securityDef = openapi.securityDefs[Object.keys(security)[0]];
      if (!securityDef) {
        return false;
      }
      else if (securityDef.type === 'http') {
        helper = {
          type: securityDef.scheme
        };
      }
      else if (securityDef.type === 'oauth2') {
        helper = {
          type: 'oauth2'
        };
      }
      else if (securityDef.type === 'apiKey') {
        helper = {
          type: 'api-key',
          properties: securityDef
        };
      }
      return false;
    });
    return helper;
  },

  /**
   * Converts a 'content' object into Postman response body. Any content-type header determined
   * from the body is returned as well
   * @param {*} contentObj response content - this is the content property of the response body
   * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#responseObject
   * @return {object} responseBody, contentType header needed
   */
  convertToPmResponseBody: function(contentObj) {
    var responseBody, cTypeHeader, hasComputedType, cTypes;
    if (!contentObj) {
      return {
        contentTypeHeader: null,
        responseBody: ''
      };
    }

    _.each([APP_JSON, APP_XML, APP_VND_JSON], (supportedCType) => {
      // these are the content-types that we'd prefer to generate a body for
      // in this order
      if (contentObj[supportedCType]) {
        cTypeHeader = supportedCType;
        hasComputedType = true;
        return false;
      }
      return true;
    });

    // if no JSON or XML, take whatever we have
    if (!hasComputedType) {
      cTypes = Object.keys(contentObj);
      if (cTypes.length > 0) {
        cTypeHeader = cTypes[0];
        hasComputedType = true;
      }
      else {
        // just an empty object - can't convert anything
        return {
          contentTypeHeader: null,
          responseBody: ''
        };
      }
    }

    responseBody = this.convertToPmBodyData(contentObj[cTypeHeader], cTypeHeader, this.options.indentCharacter);
    if (cTypeHeader === APP_JSON || cTypeHeader === APP_VND_JSON) {
      responseBody = JSON.stringify(responseBody, null, this.options.indentCharacter);
    }
    else if (typeof responseBody !== 'string') {
      // since the collection v2 schema only supports body being a string
      responseBody = '';
    }
    return {
      contentTypeHeader: cTypeHeader,
      responseBody: responseBody
    };
  },

  /**
   * Create parameters specific for a request
   * @param {*} localParams parameters array
   * @returns {Object} with three arrays of query, header and path as keys.
   * @no-unit-test
   */
  getParametersForPathItem: function(localParams) {
    var tempParam,
      params = {
        query: [],
        header: [],
        path: []
      };

    _.forEach(localParams, (param) => {
      tempParam = param;
      if (tempParam.in === 'query') {
        params.query.push(tempParam);
      }
      else if (tempParam.in === 'header') {
        params.header.push(tempParam);
      }
      else if (tempParam.in === 'path') {
        params.path.push(tempParam);
      }
    });

    return params;
  },

  /**
   * returns first example in the input map
   * @param {*} exampleObj map[string, exampleObject]
   * @returns {*} first example in the input map type
   */
  getExampleData: function(exampleObj) {
    var example,
      exampleKey;

    if (typeof exampleObj !== 'object') {
      return '';
    }

    exampleKey = Object.keys(exampleObj)[0];
    example = exampleObj[exampleKey];
    // return example value if present else example is returned

    if (example.hasOwnProperty('$ref')) {
      example = this.getRefObject(example.$ref);
    }

    if (example.value) {
      example = example.value;
    }

    return example;
  },

  /**
   * converts one of the eamples or schema in Media Type object to postman data
   * @param {*} bodyObj is MediaTypeObject
   * @param {string} indentCharacter is needed for XML/JSON bodies only
   * @returns {*} postman body data
   */
  // TODO: We also need to accept the content type
  // and generate the body accordingly
  // right now, even if the content-type was XML, we'll generate
  // a JSON example/schema
  convertToPmBodyData: function(bodyObj, contentType, indentCharacter = '') {
    var bodyData = '',
      schemaType = SCHEMA_FORMATS.DEFAULT;

    if (bodyObj.example) {
      if (bodyObj.example.hasOwnProperty('$ref')) {
        bodyObj.example = this.getRefObject(bodyObj.example.$ref);
        if (contentType.endsWith('json')) {
          // try to parse the example as JSON. OK if this fails

          try {
            bodyObj.example = JSON.parse(bodyObj.example);
          }
          // eslint-disable-next-line no-empty
          catch (e) {}
        }
      }
      bodyData = bodyObj.example;
      // return example value if present else example is returned
      if (bodyData.value) {
        bodyData = bodyData.value;
      }
    }
    else if (bodyObj.examples) {
      // take one of the examples as the body and not all
      bodyData = this.getExampleData(bodyObj.examples);
    }
    else if (bodyObj.schema) {
      if (bodyObj.schema.hasOwnProperty('$ref')) {
        bodyObj.schema = this.getRefObject(bodyObj.schema.$ref);
      }
      if (this.options.schemaFaker) {
        if (contentType === APP_XML || contentType === TEXT_XML) {
          schemaType = SCHEMA_FORMATS.XML;
        }
        bodyData = safeSchemaFaker(bodyObj.schema || {}, this.components, schemaType, indentCharacter);
      }
      else {
        // do not fake if the option is false
        bodyData = '';
      }
    }
    return bodyData;
  },

  /**
   * convert param with in='query' to string considering style and type
   * @param {*} param with in='query'
   * @returns {array} converted queryparam
   */
  convertToPmQueryParameters: function(param) {
    var pmParams = [],
      paramValue;

    if (!param) {
      return [];
    }
    // check for existence of schema
    if (param.hasOwnProperty('schema')) {
      // fake data generated
      paramValue = this.options.schemaFaker ?
        safeSchemaFaker(param.schema, this.components, SCHEMA_FORMATS.DEFAULT) : '';
      // paramType = param.schema.type;

      if (typeof paramValue === 'number') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        paramValue = paramValue.toString();
      }
      return this.convertParamsWithStyle(param, paramValue);
    }

    // since no schema present add the parameter with no value
    pmParams.push({
      key: param.name,
      value: '',
      description: param.description
    });


    return pmParams;
  },

  /**
   * Returns an array of parameters
   * Handles array/object/string param types
   * @param {*} param - the param object, as defined in
   * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#parameterObject
   * @param {any} paramValue - the value to use (from schema or example) for the given param.
   * This will be exploded/parsed according to the param type
   * @returns {array} parameters. One param with type=array might lead to multiple params
   * in the return value
   * The styles are documented at
   * https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#style-values
   */
  convertParamsWithStyle: function(param, paramValue) {
    var paramType = param.schema.type,
      paramNameArray,
      pmParams = [],
      // converts: {a: [1,2,3]} to:
      // [{key: a, val: 1}, {key: a, val: 2}, {key: a, val: 3}] if explodeFlag
      // else to [{key:a, val: 1,2,3}]
      handleExplode = (explodeFlag, paramValue, paramName) => {
        if (explodeFlag) {
          paramNameArray = _.times(paramValue.length, _.constant(paramName));
          pmParams.push(...paramNameArray.map((value, index) => {
            return {
              key: value,
              value: paramValue[index],
              description: param.description
            };
          }));
        }
        else {
          pmParams.push({
            key: paramName,
            value: paramValue.join(','),
            description: param.description
          });
        }
        return pmParams;
      };

    if (paramType === 'array') {
      // paramValue will be an array
      if (paramValue === '') { // No example provided
        paramValue = [];
      }
      if (param.style === 'form') {
        pmParams = handleExplode(param.explode, paramValue, param.name);
      }
      else if (param.style === 'spaceDelimited') {
        pmParams.push({
          key: param.name,
          value: paramValue.join(' '),
          description: param.description
        });
      }
      else if (param.style === 'pipeDelimited') {
        pmParams.push({
          key: param.name,
          value: paramValue.join('|'),
          description: param.description
        });
      }
      else if (param.style === 'deepObject') {
        pmParams.push(..._.map(paramValue, (pv) => {
          return {
            key: param.name + '[]',
            value: pv,
            description: param.description
          };
        }));
      }
      else {
        // if there is not style parameter we assume that it will be form by default;
        if (paramValue instanceof Array) {
          // non-primitive
          // this is to avoid problems with primitives as the default even when type is array
          paramValue = paramValue.join(',');
        }

        pmParams.push({
          key: param.name,
          value: paramValue,
          description: param.description
        });
      }
    }
    else if (paramType === 'object') {
      if (paramValue === '') { // No example provided
        paramValue = {};
      }
      if (param.hasOwnProperty('style')) {
        if (param.style === 'form') {
          // converts paramValue = {a:1, b:2} to:
          // [{key: a, val: 1, desc}, {key: b, val: 2, desc}] if explode
          // else to [{key: paramName, value: a,1,b,2}]
          if (param.explode) {
            paramNameArray = Object.keys(paramValue);
            pmParams.push(...paramNameArray.map((keyName) => {
              return {
                key: keyName,
                value: paramValue[keyName],
                description: param.description
              };
            }));
          }
          else {
            pmParams.push({
              key: param.name,
              value: this.getQueryStringWithStyle(paramValue, ','),
              description: param.description
            });
          }
        }
        else if (param.style === 'spaceDelimited') {
          pmParams.push({
            key: param.name,
            value: this.getQueryStringWithStyle(paramValue, '%20'),
            description: param.description
          });
        }
        else if (param.style === 'pipeDelimited') {
          pmParams.push({
            key: param.name,
            value: this.getQueryStringWithStyle(paramValue, '|'),
            description: param.description
          });
        }
        else if (param.style === 'deepObject') {
          _.forOwn(paramValue, (value, key) => {
            pmParams.push({
              key: param.name + '[' + key + ']',
              value: value,
              description: param.description
            });
          });
        }
      }
      else {
        pmParams.push({
          key: param.name,
          value: (paramValue),
          description: param.description
        });
      }
    }
    else {
      pmParams.push({
        key: param.name,
        value: (paramValue),
        description: param.description
      });
    }

    return pmParams;
  },

  /**
   * converts params with in='header' to a Postman header object
   * @param {*} header param with in='header'
   * @returns {Object} instance of a Postman SDK Header
   */
  convertToPmHeader: function(header) {
    var fakeData,
      reqHeader;

    if (header.hasOwnProperty('schema')) {
      if (!this.options.schemaFaker) {
        fakeData = '';
      }
      else {
        fakeData = safeSchemaFaker(header.schema || {}, this.components, SCHEMA_FORMATS.DEFAULT);

        // for schema.type=string or number,
        // adding JSON.stringify will add unnecessary extra double quotes around the value
        if (header.schema && (header.schema.type === 'object')) {
          fakeData = JSON.stringify(fakeData);
        }
      }
    }
    else {
      fakeData = '';
    }

    reqHeader = new sdk.Header({
      key: header.name,
      value: fakeData
    });
    reqHeader.description = header.description;

    return reqHeader;
  },

  /**
   * converts operation item requestBody to a Postman request body
   * @param {*} requestBody in operationItem
   * @returns {Object} - Postman requestBody and Content-Type Header
   */
  convertToPmBody: function(requestBody) {
    var contentObj, // content is required
      bodyData,
      param,
      paramArray = [],
      updateOptions = {},
      reqBody = new sdk.RequestBody(),
      contentHeader,
      rDataMode,
      params,
      encoding,
      cType,
      formHeaders = [];

    // @TODO: how do we support multiple content types
    contentObj = requestBody.content;

    // to handle cases of malformed request body, where contentObj is null
    if (!contentObj) {
      return {
        body: reqBody,
        contentHeader: null,
        formHeaders: null
      };
    }

    // handling for the urlencoded media type
    if (contentObj.hasOwnProperty(URLENCODED)) {
      rDataMode = 'urlencoded';
      if (contentObj[URLENCODED].hasOwnProperty('schema') && contentObj[URLENCODED].schema.hasOwnProperty('$ref')) {
        contentObj[URLENCODED].schema = this.getRefObject(contentObj[URLENCODED].schema.$ref);
      }
      bodyData = this.convertToPmBodyData(contentObj[URLENCODED], URLENCODED);
      encoding = contentObj[URLENCODED].encoding ? contentObj[URLENCODED].encoding : {};
      // create query parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {
        if (encoding.hasOwnProperty(key)) {
          encoding[key].name = key;
          encoding[key].schema = {
            type: typeof value
          };
          params = this.convertParamsWithStyle(encoding[key], value);
          // TODO: Show warning for incorrect schema if !params
          params && params.forEach((element) => {
            if (typeof element.value === 'object') { element.value = JSON.stringify(element.value); }
            // element.value = JSON.stringify(element.value);
            delete element.description;
          });
          paramArray.push(...params);
        }
        else {
          if (typeof value === 'object') { value = JSON.stringify(value); }

          param = new sdk.QueryParam({
            key: key,
            value: value
          });
          paramArray.push(param);
        }
      });
      updateOptions = {
        mode: rDataMode,
        urlencoded: paramArray
      };

      // add a content type header for each media type for the request body
      contentHeader = new sdk.Header({
        key: 'Content-Type',
        value: URLENCODED
      });

      // update the request body with the options
      reqBody.update(updateOptions);
    }
    else if (contentObj.hasOwnProperty(FORM_DATA)) {
      rDataMode = 'formdata';
      bodyData = this.convertToPmBodyData(contentObj[FORM_DATA], FORM_DATA);
      encoding = contentObj[FORM_DATA].encoding ? contentObj[FORM_DATA].encoding : {};
      // create the form parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {
        if (encoding.hasOwnProperty(key)) {
          _.forOwn(encoding[key].headers, (value, key) => {
            if (key !== 'Content-Type') {
              if (encoding[key].headers[key].hasOwnProperty('$ref')) {
                encoding[key].headers[key] = getRefObject(encoding[key].headers[key].$ref);
              }
              encoding[key].headers[key].name = key;
              formHeaders.push(this.convertToPmHeader(encoding[key].headers[key]));
            }
          });
        }
        if (typeof value === 'object') { value = JSON.stringify(value); }

        param = new sdk.FormParam({
          key: key,
          value: value
        });
        paramArray.push(param);
      });
      updateOptions = {
        mode: rDataMode,
        formdata: paramArray
      };
      // add a content type header for the pertaining media type
      contentHeader = new sdk.Header({
        key: 'Content-Type',
        value: FORM_DATA
      });
      // update the request body
      reqBody.update(updateOptions);
    }
    else {
      rDataMode = 'raw';
      let bodyType;

      // checking for all possible raw types
      if (contentObj.hasOwnProperty(APP_JS)) { bodyType = APP_JS; }
      else if (contentObj.hasOwnProperty(APP_JSON)) { bodyType = APP_JSON; }
      else if (contentObj.hasOwnProperty(TEXT_HTML)) { bodyType = TEXT_HTML; }
      else if (contentObj.hasOwnProperty(TEXT_PLAIN)) { bodyType = TEXT_PLAIN; }
      else if (contentObj.hasOwnProperty(TEXT_XML)) { bodyType = TEXT_XML; }
      else {
        // take the first property it has
        // types like image/png etc
        for (cType in contentObj) {
          if (contentObj.hasOwnProperty(cType)) {
            bodyType = cType;
            break;
          }
        }
      }

      bodyData = this.convertToPmBodyData(contentObj[bodyType], bodyType, this.options.indentCharacter);

      updateOptions = {
        mode: rDataMode,
        raw: JSON.stringify(bodyData, null, 4)
      };

      contentHeader = new sdk.Header({
        key: 'Content-Type',
        value: bodyType
      });

      reqBody.update(updateOptions);
    }

    return {
      body: reqBody,
      contentHeader: contentHeader,
      formHeaders: formHeaders
    };
  },

  /**
   * @param {*} response in operationItem responses
   * @param {*} code - response Code
   * @param {*} originalRequest - the request for the example
   * @returns {Object} postman response
   */
  convertToPmResponse: function(response, code, originalRequest) {
    var responseHeaders = [],
      previewLanguage = 'text',
      responseBodyWrapper,
      header,
      sdkResponse;

    if (!response) {
      return null;
    }
    _.forOwn(response.headers, (value, key) => {
      if (key !== 'Content-Type') {
        if (value.$ref) {
          // the convert to PmHeader function handles the
          // schema-faking
          header = this.getRefObject(value.$ref);
        }
        else {
          header = value;
        }
        header.name = key;
        responseHeaders.push(this.convertToPmHeader(header));
      }
    });

    responseBodyWrapper = this.convertToPmResponseBody(response.content);

    if (responseBodyWrapper.contentTypeHeader) {
      // we could infer the content-type header from the body
      responseHeaders.push({ key: 'Content-Type', value: responseBodyWrapper.contentTypeHeader });
      if (responseBodyWrapper.contentTypeHeader === APP_JSON) {
        previewLanguage = 'json';
      }
      else if (responseBodyWrapper.contentTypeHeader === APP_XML) {
        previewLanguage = 'xml';
      }
    }
    else if (response.content && Object.keys(response.content).length > 0) {
      responseHeaders.push({ key: 'Content-Type', value: Object.keys(response.content)[0] });
      if (Object.keys(response.content)[0] === APP_JSON) {
        previewLanguage = 'json';
      }
      else if (Object.keys(response.content)[0] === APP_XML) {
        previewLanguage = 'xml';
      }
    }
    else {
      responseHeaders.push({ key: 'Content-Type', value: TEXT_PLAIN });
    }
    code = code.replace(/X/g, '0');

    sdkResponse = new sdk.Response({
      name: response.description,
      code: code === 'default' ? 500 : Number(code),
      header: responseHeaders,
      body: responseBodyWrapper.responseBody,
      originalRequest: originalRequest
    });
    sdkResponse._postman_previewlanguage = previewLanguage;

    return sdkResponse;
  },

  /**
   * @param {*} $ref reference object
   * @returns {Object} reference object from the saved components
   * @no-unit-tests
   */
  getRefObject: function($ref) {
    var refObj, savedSchema;

    savedSchema = $ref.split('/').slice(1).map((elem) => {
      // https://swagger.io/docs/specification/using-ref#escape
      // since / is the default delimiter, slashes are escaped with ~1
      return elem
        .replace(/~1/g, '/')
        .replace(/~0/g, '~');
    });
    // at this stage, savedSchema is [components, part1, parts]
    // must have min. 2 segments after "#/components"
    if (savedSchema.length < 3) {
      console.warn(`ref ${$ref} not found.`);
      return null;
    }

    if (savedSchema[0] !== 'components' && savedSchema[0] !== 'paths') {
      console.warn(`Error reading ${ref}. Can only use references from components and paths`);
      return null;
    }

    // at this point, savedSchema is similar to ['schemas','Address']
    refObj = _.get(this, savedSchema);
    if (!refObj) {
      console.warn(`ref ${$ref} not found.`);
      return null;
    }

    if (refObj.$ref) {
      return this.getRefObject(refObj.$ref);
    }

    return refObj;
  },

  /**
   * function to convert an openapi path item to postman item
  * @param {*} openapi openapi object with root properties
  * @param {*} operationItem path operationItem from tree structure
  * @returns {Object} postman request Item
  * @no-unit-test
  */
  convertRequestToItem: function(openapi, operationItem) {
    var reqName,
      pathVariables = openapi.baseUrlVariables,
      operation = operationItem.properties,
      reqBody = operationItem.properties.requestBody,
      itemParams = operationItem.properties.parameters,
      reqParams = this.getParametersForPathItem(itemParams),
      baseUrl = openapi.baseUrl,
      pathVarArray,
      authHelper,
      item,
      serverObj,
      displayUrl,
      reqUrl = '/' + operationItem.path,
      pmBody,
      authMeta,
      swagResponse;

    // handling path templating in request url if any
    reqUrl = reqUrl.replace(/{/g, ':').replace(/}/g, '');

    // accounting for the overriding of the root level and path level servers object if present at the operation level
    if (operationItem.properties.hasOwnProperty('servers')) {
      serverObj = operationItem.properties.servers[0];
      baseUrl = serverObj.url.replace(/{/g, ':').replace(/}/g, '');
      if (serverObj.variables) {
        pathVarArray = this.convertPathVariables('method', [], serverObj.variables);
      }
    }
    else {
      // accounting for the overriding of the root level servers object if present at the path level
      if (operationItem.hasOwnProperty('servers') && operationItem.servers) {
        if (operationItem.servers[0].hasOwnProperty('variables')) {
          serverObj = operationItem.servers[0];
          baseUrl = serverObj.url.replace(/{/g, ':').replace(/}/g, '');
          pathVariables = serverObj.variables;
        }
        else {
          displayUrl = '{{' + operationItem.path + 'Url}}' + reqUrl;
        }
      }
      else {
        baseUrl += reqUrl;
        if (pathVariables) {
          displayUrl = baseUrl;
        }
        else {
          displayUrl = '{{baseUrl}}' + reqUrl;
        }
      }
      pathVarArray = this.convertPathVariables('root', [], pathVariables);
    }

    switch (this.options.requestNameSource) {
      case 'fallback' : {
        // operationId is usually camelcase or snake case
        reqName = operation.summary || this.insertSpacesInName(operation.operationId) || reqUrl;
        break;
      }
      case 'url' : {
        reqName = displayUrl || baseUrl;
        break;
      }
      default : {
        reqName = operation[this.options.requestNameSource];
        break;
      }
    }
    if (!reqName) {
      throw new openApiErr(`requestNameSource (${this.options.requestNameSource})` +
        ` in options is invalid or property does not exist in ${operationItem.path}`);
    }

    // handling authentication here (for http type only)
    authHelper = this.getAuthHelper(openapi, operation.security);

    // creating the request object
    item = new sdk.Item({
      name: reqName,
      request: {
        description: operation.description,
        url: displayUrl || baseUrl,
        name: reqName,
        method: operationItem.method.toUpperCase()
      }
    });

    // using the auth helper
    authMeta = operation['x-postman-meta'];
    if (authMeta && authMeta.currentHelper && authMap[authMeta.currentHelper]) {
      let thisAuthObject = {
        type: authMap[authMeta.currentHelper]
      };

      thisAuthObject[authMap[authMeta.currentHelper]] = authMeta.helperAttributes;
      item.request.auth = new sdk.RequestAuth(thisAuthObject);
    }
    // TODO: Figure out what happens if type!=api-key
    else if (authHelper && authHelper.type === 'api-key') {
      if (authHelper.properties.in === 'header') {
        item.request.addHeader(this.convertToPmHeader(authHelper.properties));
        item.request.auth = {
          type: 'noauth'
        };
      }
      else if (authHelper.properties.in === 'query') {
        this.convertToPmQueryParameters(authHelper.properties).forEach((pmParam) => {
          item.request.url.addQueryParams(pmParam);
        });
        item.request.auth = {
          type: 'noauth'
        };
      }
    }
    else {
      item.request.auth = authHelper;
    }

    // adding query params to postman request url.
    _.forEach(reqParams.query, (queryParam) => {
      this.convertToPmQueryParameters(queryParam).forEach((pmParam) => {
        item.request.url.addQueryParams(pmParam);
      });
    });
    item.request.url.query.members.forEach((query) => {
      query.description = query.description.content;
      query.value = (typeof query.value === 'object') ? JSON.stringify(query.value) : query.value;
    });
    item.request.url.variables.clear();
    item.request.url.variables.assimilate(this.convertPathVariables('param', pathVarArray, reqParams.path));
    // TODO: There is a bug in Postman that causes these request descriptions
    // to be converted as "object Object"

    // adding headers to request from reqParam
    _.forEach(reqParams.header, (header) => {
      item.request.addHeader(this.convertToPmHeader(header));
    });

    // adding Request Body and Content-Type header
    if (reqBody) {
      if (reqBody.$ref) {
        reqBody = this.getRefObject(reqBody.$ref);
      }
      pmBody = this.convertToPmBody(reqBody);
      item.request.body = pmBody.body;
      item.request.addHeader(pmBody.contentHeader);
      // extra form headers if encoding is present in request Body.
      // TODO: Show warning for incorrect schema if !pmBody.formHeaders
      pmBody.formHeaders && pmBody.formHeaders.forEach((element) => {
        item.request.addHeader(element);
      });
    }

    // adding responses to request item
    if (operation.responses) {
      let thisOriginalRequest = {},
        convertedResponse;
      _.forOwn(operation.responses, (response, code) => {
        swagResponse = response;
        if (response.$ref) {
          swagResponse = this.getRefObject(response.$ref);
        }

        // Try and set fields for originalRequest (example.request)
        thisOriginalRequest.method = item.request.method;
        try {
          thisOriginalRequest.url = item.request.url.toString();
        }
        catch (e) {
          // the SDK sometimes throws an exception in url.toString :/
          // console.warn('Exception thrown while trying to stringify url for item.request.url:', item.request.url,
          // 'Exception:', e);
          thisOriginalRequest.url = '';
        }
        try {
          thisOriginalRequest.header = item.request.headers.toJSON();
        }
        catch (e) {
          // console.warn('Exception thrown while trying to stringify headers for item.request.headers:',
          // item.request.headers, 'Exception:', e);
          thisOriginalRequest.header = [];
        }
        try {
          thisOriginalRequest.body = (item.request.body ? item.request.body.toJSON() : {});
        }
        catch (e) {
          // console.warn('Exception thrown while trying to json-ify body for item.request.body:', item.request.body,
          // 'Exception:', e);
          thisOriginalRequest.body = {};
        }
        convertedResponse = this.convertToPmResponse(swagResponse, code, thisOriginalRequest);
        convertedResponse && item.responses.add(convertedResponse);
      });
    }

    return item;
  }
};

