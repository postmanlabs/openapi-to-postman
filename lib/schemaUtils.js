/**
 * This file contains util functions that need OAS-awareness
 * utils.js contains other util functions
 */

const async = require('async'),
  Ajv = require('ajv'),
  sdk = require('postman-collection'),
  schemaFaker = require('../assets/json-schema-faker.js'),
  parse = require('./parse.js'),
  deref = require('./deref.js'),
  _ = require('lodash'),
  xmlFaker = require('./xmlSchemaFaker.js'),
  openApiErr = require('./error.js'),
  utils = require('./utils.js'),
  defaultOptions = require('../lib/options.js').getOptions('use'),
  { Node, Trie } = require('./trie.js'),
  SCHEMA_FORMATS = {
    DEFAULT: 'default', // used for non-request-body data and json
    XML: 'xml' // used for request-body XMLs
  },
  URLENCODED = 'application/x-www-form-urlencoded',
  APP_JSON = 'application/json',
  APP_JS = 'application/javascript',
  TEXT_XML = 'text/xml',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  FORM_DATA = 'multipart/form-data',
  REQUEST_TYPE = {
    EXAMPLE: 'EXAMPLE',
    ROOT: 'ROOT'
  },
  PARAMETER_SOURCE = {
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE'
  },
  HEADER_TYPE = {
    JSON: 'json',
    XML: 'xml',
    INVALID: 'invalid'
  },
  PREVIEW_LANGUAGE = {
    JSON: 'json',
    XML: 'xml',
    TEXT: 'text',
    HTML: 'html'
  },
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
  propNames = {
    QUERYPARAM: 'query parameter',
    PATHVARIABLE: 'path variable',
    HEADER: 'header',
    REQUEST_BODY: 'request body',
    RESPONSE_HEADER: 'response header',
    RESPONSE_BODY: 'response body'
  },

  // These are the methods supported in the PathItem schema
  // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject
  METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'],

  /* eslint-disable arrow-body-style */
  schemaTypeToJsValidator = {
    'string': (d) => typeof d === 'string',
    'number': (d) => !isNaN(d),
    'integer': (d) => !isNaN(d) && Number.isInteger(Number(d)),
    'boolean': (d) => d === 'true' || d === 'false',
    'array': (d) => Array.isArray(d),
    'object': (d) => typeof d === 'object' && !Array.isArray(d)
  },
  crypto = require('crypto');
  /* eslint-enable */

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
 *
 * @param {string} input - input string that needs to be hashed
 * @returns {*} sha1 hash of the string
 */
function hash(input) {
  return crypto.createHash('sha1').update(input).digest('base64');
}

/**
* Safe wrapper for schemaFaker that resolves references and
* removes things that might make schemaFaker crash
* @param {*} oldSchema the schema to fake
* @param {string} resolveTo The desired JSON-generation mechanism (schema: prefer using the JSONschema to
   generate a fake object, example: use specified examples as-is). Default: schema
* @param {string} parameterSourceOption Specifies whether the schema being faked is from a request or response.
* @param {*} components list of predefined components (with schemas)
* @param {string} schemaFormat default or xml
* @param {string} indentCharacter char for 1 unit of indentation
* @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
* @returns {object} fakedObject
*/
function safeSchemaFaker(oldSchema, resolveTo, parameterSourceOption, components,
  schemaFormat, indentCharacter, schemaCache) {
  var prop, key, resolvedSchema, fakedSchema,
    schemaResolutionCache = _.get(schemaCache, 'schemaResolutionCache', {}),
    schemaFakerCache = _.get(schemaCache, 'schemaFakerCache', {});

  resolvedSchema = deref.resolveRefs(oldSchema, parameterSourceOption, components, schemaResolutionCache);
  key = JSON.stringify(resolvedSchema);

  if (resolveTo === 'schema') {
    key = 'resolveToSchema ' + key;
    schemaFaker.option({
      useExamplesValue: false
    });
  }
  else if (resolveTo === 'example') {
    key = 'resolveToExample ' + key;
    schemaFaker.option({
      useExamplesValue: true
    });
  }

  key = hash(key);
  if (schemaFakerCache[key]) {
    return schemaFakerCache[key];
  }

  if (resolvedSchema.properties) {
    // If any property exists with format:binary (and type: string) schemaFaker crashes
    // we just delete based on format=binary
    for (prop in resolvedSchema.properties) {
      if (resolvedSchema.properties.hasOwnProperty(prop)) {
        if (resolvedSchema.properties[prop].format === 'binary') {
          delete resolvedSchema.properties[prop].format;
        }
      }
    }
  }

  try {
    if (schemaFormat === SCHEMA_FORMATS.XML) {
      fakedSchema = xmlFaker(null, resolvedSchema, indentCharacter);
      schemaFakerCache[key] = fakedSchema;
      return fakedSchema;
    }
    // for JSON, the indentCharacter will be applied in the JSON.stringify step later on
    fakedSchema = schemaFaker(resolvedSchema);
    schemaFakerCache[key] = fakedSchema;
    return fakedSchema;
  }
  catch (e) {
    console.warn(
      'Error faking a schema. Not faking this schema. Schema:', resolvedSchema,
      'Error', e
    );
    return null;
  }
}

module.exports = {

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
   * Returns a description that's usable at the collection-level
   * Adds the collection description and uses any relevant contact info
   * @param {*} openapi The JSON representation of the OAS spec
   * @returns {string} description
   */
  getCollectionDescription: function (openapi) {
    let description = _.get(openapi, 'info.description', '');
    if (_.get(openapi, 'info.contact')) {
      let contact = [];
      if (openapi.info.contact.name) {
        contact.push(' Name: ' + openapi.info.contact.name);
      }
      if (openapi.info.contact.email) {
        contact.push(' Email: ' + openapi.info.contact.email);
      }
      if (contact.length > 0) {
        // why to add unnecessary lines if there is no description
        if (description !== '') {
          description += '\n\n';
        }
        description += 'Contact Support:\n' + contact.join('\n');
      }
    }
    return description;
  },

  /**
  * Get the format of content type header
  * @param {string} cTypeHeader - the content type header string
  * @returns {string} type of content type header
  */
  getHeaderFamily: function(cTypeHeader) {
    if (cTypeHeader.startsWith('application') && cTypeHeader.endsWith('json')) {
      return HEADER_TYPE.JSON;
    }
    if ((cTypeHeader.startsWith('application') && cTypeHeader.endsWith('xml')) || cTypeHeader === TEXT_XML) {
      return HEADER_TYPE.XML;
    }
    return HEADER_TYPE.INVALID;
  },

  /**
   * Gets the description of the parameter.
   * If the parameter is required, it prepends a `(Requried)` before the parameter description
   * If the parameter type is enum, it appends the possible enum values
   * @param {object} parameter - input param for which description needs to be returned
   * @returns {string} description of the parameters
   */
  getParameterDescription: function(parameter) {
    return (parameter.required ? '(Required) ' : '') + (parameter.description || '') +
      (parameter.enum ? ' (This can only be one of ' + parameter.enum + ')' : '');
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
        let description = this.getParameterDescription(value);
        variables.push(new sdk.Variable({
          id: key,
          value: value.default || '',
          description: description
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
    rootValidation = parse.validateSpec(openApiObj);
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
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.)
   * @returns {*} combined requestParams from operation and path params.
   */
  getRequestParams: function(operationParam, pathParam, components, options) {
    options = _.merge({}, defaultOptions, options);
    if (!Array.isArray(operationParam)) {
      operationParam = [];
    }
    if (!Array.isArray(pathParam)) {
      pathParam = [];
    }
    pathParam.forEach((param, index, arr) => {
      if (param.hasOwnProperty('$ref')) {
        arr[index] = this.getRefObject(param.$ref, components, options);
      }
    });

    operationParam.forEach((param, index, arr) => {
      if (param.hasOwnProperty('$ref')) {
        arr[index] = this.getRefObject(param.$ref, components, options);
      }
    });

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
        return element.name === param.name && element.in === param.in &&
        // the below two conditions because undefined === undefined returns true
          element.name && param.name &&
          element.in && param.in;
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
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.)
   * @returns {Object} - The final object consists of the tree structure and collection variables
   */
  generateTrieFromPaths: function (spec, options) {
    options = _.merge({}, defaultOptions, options);
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
      componentsAndPaths = {
        components: spec.components,
        paths: spec.paths
      },
      pathMethods = [],
      // creating a root node for the trie (serves as the root dir)
      trie = new Trie(new Node({
        name: '/'
      })),

      // returns a list of methods supported at each pathItem
      // some pathItem props are not methods
      // https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#pathItemObject

      /**
     * @param {Array} pathKeys - Keys in a path object
     * @returns {Array} - Method names available for the path object
     */
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

            // We are keeping the count children in a folder which can be a request or folder
            // For ex- In case of /pets/a/b, pets has 1 childCount (i.e a)
            currentNode.childCount += 1;
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
          operationItem.parameters = this.getRequestParams(operationItem.parameters, commonParams,
            componentsAndPaths, options);
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
          currentNode.childCount += 1;
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
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @returns {Array<object>} returns an array of sdk.Variable
   */
  convertPathVariables: function(type, providedPathVars, commonPathVars, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);

    var variables = providedPathVars;
    // converting the base uri path variables, if any
    // commonPathVars is an object for type = root/method
    // array otherwise
    if (type === 'root' || type === 'method') {
      _.forOwn(commonPathVars, (value, key) => {
        let description = this.getParameterDescription(value);
        variables.push({
          key: key,
          value: type === 'root' ? '{{' + key + '}}' : value.default,
          description: description
        });
      });
    }
    else {
      _.forEach(commonPathVars, (variable) => {
        let description = this.getParameterDescription(variable);
        variables.push({
          key: variable.name,
          // we only fake the schema for param-level pathVars
          value: options.schemaFaker ?
            safeSchemaFaker(variable.schema || {}, 'schema', components, 'REQUEST',
              SCHEMA_FORMATS.DEFAULT, options.indentCharacter, schemaCache) : '',
          description: description
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
   * convert childItem from OpenAPI to Postman itemGroup if requestCount(no of requests inside childitem)>1
   * otherwise return postman request
   * @param {*} openapi object with root-level data like pathVariables baseurl
   * @param {*} child object is of type itemGroup or request
   * resolve references while generating params.
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @param {object} variableStore - array for storing collection variables
   * @returns {*} Postman itemGroup or request
   * @no-unit-test
   */
  convertChildToItemGroup: function (openapi, child, components, options, schemaCache, variableStore) {
    options = _.merge({}, defaultOptions, options);

    var resource = child,
      itemGroup,
      subChild,
      i,
      requestCount;

    // 3 options:

    // 1. folder with more than one request in its subtree
    // (immediate children or otherwise)
    if (resource.requestCount > 1) {
      // only return a Postman folder if this folder has>1 children in its subtree
      // otherwise we can end up with 10 levels of folders with 1 request in the end
      itemGroup = new sdk.ItemGroup({
        name: utils.insertSpacesInName(resource.name)
        // TODO: have to add auth here (but first, auth to be put into the openapi tree)
      });
      // If a folder has only one child which is a folder then we collapsed the child folder
      // with parent folder.
      /* eslint-disable max-depth */
      if (resource.childCount === 1 && options.collapseFolders) {
        let subChild = Object.keys(resource.children)[0],
          resourceSubChild = resource.children[subChild];

        resourceSubChild.name = resource.name + '/' + resourceSubChild.name;
        return this.convertChildToItemGroup(openapi, resourceSubChild, components, options, schemaCache, variableStore);
      }
      /* eslint-enable */
      // recurse over child leaf nodes
      // and add as children to this folder
      for (i = 0, requestCount = resource.requests.length; i < requestCount; i++) {
        itemGroup.items.add(
          this.convertRequestToItem(openapi, resource.requests[i], components, options, schemaCache, variableStore)
        );
      }

      // recurse over child folders
      // and add as child folders to this folder
      /* eslint-disable max-depth*/
      for (subChild in resource.children) {
        if (resource.children.hasOwnProperty(subChild) && resource.children[subChild].requestCount > 0) {
          itemGroup.items.add(
            this.convertChildToItemGroup(openapi, resource.children[subChild], components, options, schemaCache,
              variableStore)
          );
        }
      }
      /* eslint-enable */

      return itemGroup;
    }

    // 2. it has only 1 direct request of its own
    if (resource.requests.length === 1) {
      return this.convertRequestToItem(openapi, resource.requests[0], components, options, schemaCache, variableStore);
    }

    // 3. it's a folder that has no child request
    // but one request somewhere in its child folders
    for (subChild in resource.children) {
      if (resource.children.hasOwnProperty(subChild) && resource.children[subChild].requestCount === 1) {
        return this.convertChildToItemGroup(openapi, resource.children[subChild], components, options, schemaCache,
          variableStore);
      }
    }
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
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
  * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
  * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @return {object} responseBody, contentType header needed
   */
  convertToPmResponseBody: function(contentObj, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);

    var responseBody, cTypeHeader, hasComputedType, cTypes;
    if (!contentObj) {
      return {
        contentTypeHeader: null,
        responseBody: ''
      };
    }
    let headers = Object.keys(contentObj);

    for (let i = 0; i < headers.length; i++) {
      let headerFamily = this.getHeaderFamily(headers[i]);
      if (headerFamily !== HEADER_TYPE.INVALID) {
        cTypeHeader = headers[i];
        hasComputedType = true;
        if (headerFamily === HEADER_TYPE.JSON) {
          break;
        }
      }
    }

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
    responseBody = this.convertToPmBodyData(contentObj[cTypeHeader], REQUEST_TYPE.EXAMPLE, cTypeHeader,
      PARAMETER_SOURCE.RESPONSE, options.indentCharacter, components, options, schemaCache);
    if (this.getHeaderFamily(cTypeHeader) === HEADER_TYPE.JSON) {
      responseBody = JSON.stringify(responseBody, null, options.indentCharacter);
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
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.)
   * @returns {*} first example in the input map type
   */
  getExampleData: function(exampleObj, components, options) {
    options = _.merge({}, defaultOptions, options);

    var example,
      exampleKey;

    if (typeof exampleObj !== 'object') {
      return '';
    }

    exampleKey = Object.keys(exampleObj)[0];
    example = exampleObj[exampleKey];
    // return example value if present else example is returned

    if (example.hasOwnProperty('$ref')) {
      example = this.getRefObject(example.$ref, components, options);
    }

    if (example.hasOwnProperty('value')) {
      example = example.value;
    }

    return example;
  },

  /**
   * converts one of the examples or schema in Media Type object to postman data
   * @param {*} bodyObj is MediaTypeObject
   * @param {*} requestType - Specifies whether the request body is of example request or root request
   * @param {*} contentType - content type header
   * @param {string} parameterSourceOption tells that the schema object is of request or response
   * @param {string} indentCharacter is needed for XML/JSON bodies only
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @returns {*} postman body data
   */
  // TODO: We also need to accept the content type
  // and generate the body accordingly
  // right now, even if the content-type was XML, we'll generate
  // a JSON example/schema
  convertToPmBodyData: function(bodyObj, requestType, contentType, parameterSourceOption,
    indentCharacter, components, options, schemaCache) {

    options = _.merge({}, defaultOptions, options);
    var bodyData = '',
      schemaType = SCHEMA_FORMATS.DEFAULT,
      resolveTo = this.resolveToExampleOrSchema(requestType, options.requestParametersResolution,
        options.exampleParametersResolution);

    if (bodyObj.example && (resolveTo === 'example' || !bodyObj.schema)) {
      if (bodyObj.example.hasOwnProperty('$ref')) {
        bodyObj.example = this.getRefObject(bodyObj.example.$ref, components, options);
        if (this.getHeaderFamily(contentType) === HEADER_TYPE.JSON) {
          // try to parse the example as JSON. OK if this fails

          // eslint-disable-next-line max-depth
          try {
            bodyObj.example = JSON.parse(bodyObj.example);
          }
          // eslint-disable-next-line no-empty
          catch (e) {}
        }
      }
      bodyData = bodyObj.example;
      // return example value if present else example is returned
      if (bodyData.hasOwnProperty('value')) {
        bodyData = bodyData.value;
      }
    }
    else if (!_.isEmpty(bodyObj.examples) && (resolveTo === 'example' || !bodyObj.schema)) {
      // take one of the examples as the body and not all
      bodyData = this.getExampleData(bodyObj.examples, components, options);
    }
    else if (bodyObj.schema) {
      if (bodyObj.schema.hasOwnProperty('$ref')) {
        bodyObj.schema = this.getRefObject(bodyObj.schema.$ref, components, options);
      }
      if (options.schemaFaker) {
        if (this.getHeaderFamily(contentType) === HEADER_TYPE.XML) {
          schemaType = SCHEMA_FORMATS.XML;
        }
        bodyData = safeSchemaFaker(bodyObj.schema || {}, resolveTo, parameterSourceOption,
          components, schemaType, indentCharacter, schemaCache);
      }
      else {
        // do not fake if the option is false
        bodyData = '';
      }
    }
    return bodyData;
  },

  /**
   * returns whether to resolve to example or schema
   * @param {string} requestType - Specifies whether the request body is of example request or root request
   * @param {string} requestParametersResolution - the option value of requestParametersResolution
   * @param {string} exampleParametersResolution - the option value of exampleParametersResolution
   * @returns {string} Whether to resolve to example or schema
   */
  resolveToExampleOrSchema(requestType, requestParametersResolution, exampleParametersResolution) {
    if (requestType === REQUEST_TYPE.ROOT) {
      if (requestParametersResolution === 'example') {
        return 'example';
      }
      else if (requestParametersResolution === 'schema') {
        return 'schema';
      }
    }

    if (requestType === REQUEST_TYPE.EXAMPLE) {
      if (exampleParametersResolution === 'example') {
        return 'example';
      }
      else if (exampleParametersResolution === 'schema') {
        return 'schema';
      }
    }

    return 'schema';
  },

  /**
   * convert param with in='query' to string considering style and type
   * @param {*} param with in='query'
   * @param {*} requestType Specifies whether the request body is of example request or root request
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
  * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
  * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @returns {array} converted queryparam
   */
  convertToPmQueryParameters: function(param, requestType, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);
    var pmParams = [],
      paramValue,
      resolveTo = this.resolveToExampleOrSchema(requestType, options.requestParametersResolution,
        options.exampleParametersResolution);

    if (!param) {
      return [];
    }
    // check for existence of schema
    if (param.hasOwnProperty('schema')) {
      // fake data generated
      paramValue = options.schemaFaker ?
        safeSchemaFaker(param.schema, resolveTo, PARAMETER_SOURCE.REQUEST,
          components, SCHEMA_FORMATS.DEFAULT, options.indentCharacter, schemaCache) : '';
      // paramType = param.schema.type;

      if (typeof paramValue === 'number' || typeof paramValue === 'boolean') {
        // the SDK will keep the number-ness,
        // which will be rejected by the collection v2 schema
        // converting to string to prevent issues like
        // https://github.com/postmanlabs/postman-app-support/issues/6500
        paramValue = paramValue.toString();
      }
      return this.convertParamsWithStyle(param, paramValue);
    }

    let description = this.getParameterDescription(param);
    // since no schema present add the parameter with no value
    pmParams.push({
      key: param.name,
      value: '',
      description: description
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
      description = this.getParameterDescription(param),
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
              description: description
            };
          }));
        }
        else {
          pmParams.push({
            key: paramName,
            value: paramValue.join(','),
            description: description
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
          description: description
        });
      }
      else if (param.style === 'pipeDelimited') {
        pmParams.push({
          key: param.name,
          value: paramValue.join('|'),
          description: description
        });
      }
      else if (param.style === 'deepObject') {
        pmParams.push(..._.map(paramValue, (pv) => {
          return {
            key: param.name + '[]',
            value: pv,
            description: description
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
          description: description
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
                description: description
              };
            }));
          }
          else {
            pmParams.push({
              key: param.name,
              value: this.getQueryStringWithStyle(paramValue, ','),
              description: description
            });
          }
        }
        else if (param.style === 'spaceDelimited') {
          pmParams.push({
            key: param.name,
            value: this.getQueryStringWithStyle(paramValue, '%20'),
            description: description
          });
        }
        else if (param.style === 'pipeDelimited') {
          pmParams.push({
            key: param.name,
            value: this.getQueryStringWithStyle(paramValue, '|'),
            description: description
          });
        }
        else if (param.style === 'deepObject') {
          _.forOwn(paramValue, (value, key) => {
            pmParams.push({
              key: param.name + '[' + key + ']',
              value: value,
              description: description
            });
          });
        }
      }
      else {
        pmParams.push({
          key: param.name,
          value: (paramValue),
          description: description
        });
      }
    }
    else {
      pmParams.push({
        key: param.name,
        value: (paramValue),
        description: description
      });
    }

    return pmParams;
  },

  /**
   * converts params with in='header' to a Postman header object
   * @param {*} header param with in='header'
   * @param {*} requestType Specifies whether the request body is of example request or root request
   * @param  {*} parameterSource — Specifies whether the schema being faked is from a request or response.
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
  * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
  * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @returns {Object} instance of a Postman SDK Header
   */
  convertToPmHeader: function(header, requestType, parameterSource, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);

    var fakeData,
      reqHeader,
      resolveTo = this.resolveToExampleOrSchema(requestType, options.requestParametersResolution,
        options.exampleParametersResolution);

    if (header.hasOwnProperty('schema')) {
      if (!options.schemaFaker) {
        fakeData = '';
      }
      else {
        fakeData = safeSchemaFaker(header.schema || {}, resolveTo, parameterSource,
          components, SCHEMA_FORMATS.DEFAULT, options.indentCharacter, schemaCache);

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
    reqHeader.description = this.getParameterDescription(header);

    return reqHeader;
  },

  /**
   * converts operation item requestBody to a Postman request body
   * @param {*} requestBody in operationItem
   * @param {*} requestType - Specifies whether the request body is of example request or root request
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
  * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
  * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @returns {Object} - Postman requestBody and Content-Type Header
   */
  convertToPmBody: function(requestBody, requestType, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);
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
      description,
      required,
      enumValue,
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
        contentObj[URLENCODED].schema = this.getRefObject(contentObj[URLENCODED].schema.$ref, components, options);
      }
      bodyData = this.convertToPmBodyData(contentObj[URLENCODED], requestType, URLENCODED,
        PARAMETER_SOURCE.REQUEST, options.indentCharacter, components, options, schemaCache);
      encoding = contentObj[URLENCODED].encoding ? contentObj[URLENCODED].encoding : {};
      // create query parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {

        if (_.get(contentObj[URLENCODED], 'schema.type') === 'object') {
          description = _.get(contentObj[URLENCODED], ['schema', 'properties', key, 'description'], '');
          required = _.get(contentObj[URLENCODED], ['schema', 'properties', key, 'required'], false);
          enumValue = _.get(contentObj[URLENCODED], ['schema', 'properties', key, 'enum']);
        }
        description = (required ? '(Required) ' : '') + description +
          (enumValue ? ' (This can only be one of ' + enumValue + ')' : '');
        if (encoding.hasOwnProperty(key)) {
          encoding[key].name = key;
          encoding[key].schema = {
            type: typeof value
          };
          encoding[key].description = description;
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
          param.description = description;
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
      bodyData = this.convertToPmBodyData(contentObj[FORM_DATA], requestType, FORM_DATA,
        PARAMETER_SOURCE.REQUEST, options.indentCharacter, components, options, schemaCache);
      encoding = contentObj[FORM_DATA].encoding ? contentObj[FORM_DATA].encoding : {};
      // create the form parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {

        if (_.get(contentObj[FORM_DATA], 'schema.type') === 'object') {
          description = _.get(contentObj[FORM_DATA], ['schema', 'properties', key, 'description'], '');
          required = _.get(contentObj[FORM_DATA], ['schema', 'properties', key, 'required'], false);
          enumValue = _.get(contentObj[FORM_DATA], ['schema', 'properties', key, 'enum']);
        }
        description = (required ? '(Required) ' : '') + description +
          (enumValue ? ' (This can only be one of ' + enumValue + ')' : '');

        if (encoding.hasOwnProperty(key)) {
          _.forOwn(encoding[key].headers, (value, key) => {
            if (key !== 'Content-Type') {
              if (encoding[key].headers[key].hasOwnProperty('$ref')) {
                encoding[key].headers[key] = getRefObject(encoding[key].headers[key].$ref, components, options);
              }
              encoding[key].headers[key].name = key;
              // this is only for ROOT request because we are adding the headers for example request later
              formHeaders.push(this.convertToPmHeader(encoding[key].headers[key],
                REQUEST_TYPE.ROOT, PARAMETER_SOURCE.REQUEST, components, options, schemaCache));
            }
          });
        }
        if (typeof value === 'object') { value = JSON.stringify(value); }

        param = new sdk.FormParam({
          key: key,
          value: value
        });
        param.description = description;
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

      bodyData = this.convertToPmBodyData(contentObj[bodyType], requestType, bodyType,
        PARAMETER_SOURCE.REQUEST, options.indentCharacter, components, options, schemaCache);

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
   * converts operation item response to a Postman response
   * @param {*} response in operationItem responses
   * @param {*} code - response Code
   * @param {*} originalRequest - the request for the example
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
  * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
  * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @returns {Object} postman response
   */
  convertToPmResponse: function(response, code, originalRequest, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);
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
          header = this.getRefObject(value.$ref, components, options);
        }
        else {
          header = value;
        }
        header.name = key;
        responseHeaders.push(this.convertToPmHeader(header, REQUEST_TYPE.EXAMPLE,
          PARAMETER_SOURCE.RESPONSE, components, options, schemaCache));
      }
    });

    responseBodyWrapper = this.convertToPmResponseBody(response.content, components, options, schemaCache);

    if (responseBodyWrapper.contentTypeHeader) {
      // we could infer the content-type header from the body
      responseHeaders.push({ key: 'Content-Type', value: responseBodyWrapper.contentTypeHeader });
      if (this.getHeaderFamily(responseBodyWrapper.contentTypeHeader) === HEADER_TYPE.JSON) {
        previewLanguage = PREVIEW_LANGUAGE.JSON;
      }
      else if (this.getHeaderFamily(responseBodyWrapper.contentTypeHeader) === HEADER_TYPE.XML) {
        previewLanguage = PREVIEW_LANGUAGE.XML;
      }
    }
    else if (response.content && Object.keys(response.content).length > 0) {
      responseHeaders.push({ key: 'Content-Type', value: Object.keys(response.content)[0] });
      if (this.getHeaderFamily(Object.keys(response.content)[0]) === HEADER_TYPE.JSON) {
        previewLanguage = PREVIEW_LANGUAGE.JSON;
      }
      else if (this.getHeaderFamily(Object.keys(response.content)[0]) === HEADER_TYPE.XML) {
        previewLanguage = PREVIEW_LANGUAGE.XML;
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
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.)
   * @returns {Object} reference object from the saved components
   * @no-unit-tests
   */
  getRefObject: function($ref, components, options) {
    options = _.merge({}, defaultOptions, options);
    var refObj, savedSchema;

    savedSchema = $ref.split('/').slice(1).map((elem) => {
      // https://swagger.io/docs/specification/using-ref#escape
      // since / is the default delimiter, slashes are escaped with ~1
      return decodeURIComponent(
        elem
          .replace(/~1/g, '/')
          .replace(/~0/g, '~')
      );
    });
    // at this stage, savedSchema is [components, part1, parts]
    // must have min. 2 segments after "#/components"
    if (savedSchema.length < 3) {
      console.warn(`ref ${$ref} not found.`);
      return { value: `reference ${$ref} not found in the given specification` };
    }

    if (savedSchema[0] !== 'components' && savedSchema[0] !== 'paths') {
      console.warn(`Error reading ${$ref}. Can only use references from components and paths`);
      return { value: `Error reading ${$ref}. Can only use references from components and paths` };
    }

    // at this point, savedSchema is similar to ['components', 'schemas','Address']
    // components is actually components and paths (an object with components + paths as 1st-level-props)
    refObj = _.get(components, savedSchema);

    if (!refObj) {
      console.warn(`ref ${$ref} not found.`);
      return { value: `reference ${$ref} not found in the given specification` };
    }

    if (refObj.$ref) {
      return this.getRefObject(refObj.$ref, components, options);
    }

    return refObj;
  },

  /** Finds all the possible path variables in a given path string
   * @param {string} path Path string : /pets/{petId}
   * @returns {array} Array of path variables.
   */
  findPathVariablesFromPath: function (path) {

    // /{{path}}/{{file}}.{{format}}/{{hello}} return [ '{{path}}', '{{hello}}' ]
    // https://regex101.com/r/XGL4Gh/1
    return path.match(/(\/\{\{[^\/\{\}]+\}\})(?=\/|$)/g);
  },

  /** Finds all the possible collection variables in a given path string
   * @param {string} path Path string : /pets/{petId}
   * @returns {array} Array of collection variables.
   */
  findCollectionVariablesFromPath: function (path) {

    // /:path/{{file}}.{{format}}/:hello => only {{file}} and {{format}} will match
    // https://regex101.com/r/XGL4Gh/2
    return path.match(/(\{\{[^\/\{\}]+\}\})/g);
  },

  /** Separates outs collection and path variables from the reqUrl
   *
   * @param {string} reqUrl Request Url
   * @param {Array} pathVars Path variables
   *
   * @returns {Object} reqUrl, updated path Variables array and collection Variables.
   */
  sanitizeUrlPathParams: function (reqUrl, pathVars) {
    var matches,
      collectionVars = [];

    // converts all the of the following:
    // /{{path}}/{{file}}.{{format}}/{{hello}} => /:path/{{file}}.{{format}}/:hello
    matches = this.findPathVariablesFromPath(reqUrl);
    if (matches) {
      matches.forEach((match) => {
        const replaceWith = match.replace(/{{/g, ':').replace(/}}/g, '');
        reqUrl = reqUrl.replace(match, replaceWith);
      });
    }

    // Separates pathVars array and collectionVars.
    matches = this.findCollectionVariablesFromPath(reqUrl);
    if (matches) {
      matches.forEach((match) => {
        const collVar = match.replace(/{{/g, '').replace(/}}/g, '');

        pathVars = pathVars.filter((item) => {
          if (item.name === collVar) {
            collectionVars.push(item);
          }
          return !(item.name === collVar);
        });
      });
    }

    return { reqUrl, pathVars, collectionVars };
  },

  /**
   * function to convert an openapi path item to postman item
  * @param {*} openapi openapi object with root properties
  * @param {*} operationItem path operationItem from tree structure
  * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
  * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
  * @param {array} variableStore - array
  * @returns {Object} postman request Item
  * @no-unit-test
  */
  convertRequestToItem: function(openapi, operationItem, components, options, schemaCache, variableStore) {
    options = _.merge({}, defaultOptions, options);
    var reqName,
      pathVariables = openapi.baseUrlVariables,
      operation = operationItem.properties,
      reqBody = operationItem.properties.requestBody,
      itemParams = operationItem.properties.parameters,
      reqParams = this.getParametersForPathItem(itemParams),
      baseUrl = openapi.baseUrl,
      pathVarArray = [],
      authHelper,
      item,
      serverObj,
      displayUrl,
      reqUrl = '/' + operationItem.path,
      pmBody,
      authMeta,
      swagResponse,
      localServers = _.get(operationItem, 'properties.servers'),
      exampleRequestBody,
      sanitizeResult,
      globalServers = _.get(operationItem, 'servers');

    // handling path templating in request url if any
    // convert all {anything} to {{anything}}
    reqUrl = this.fixPathVariablesInUrl(reqUrl);

    // convert all /{{one}}/{{two}} to /:one/:two
    // Doesn't touch /{{file}}.{{format}}
    sanitizeResult = this.sanitizeUrlPathParams(reqUrl, reqParams.path);

    // Updated reqUrl
    reqUrl = sanitizeResult.reqUrl;

    // Updated reqParams.path
    reqParams.path = sanitizeResult.pathVars;

    // Add collection variables to the variableStore.
    sanitizeResult.collectionVars.forEach((element) => {
      if (!variableStore[element.name]) {
        variableStore[element.name] = {
          id: element.name,
          value: element.default || '',
          description: element.description,
          type: 'collection'
        };
      }
    });
    // accounting for the overriding of the root level and path level servers object if present at the operation level

    if (Array.isArray(localServers) && localServers.length) {
      serverObj = operationItem.properties.servers[0];
      baseUrl = serverObj.url.replace(/{/g, ':').replace(/}/g, '');
      baseUrl += reqUrl;
      if (serverObj.variables) {
        pathVarArray = this.convertPathVariables('method', [], serverObj.variables, components, options, schemaCache);
      }
    }
    else {
      // accounting for the overriding of the root level servers object if present at the path level
      if (Array.isArray(globalServers) && globalServers.length) {
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
      pathVarArray = this.convertPathVariables('root', [], pathVariables, components, options, schemaCache);
    }

    switch (options.requestNameSource) {
      case 'fallback' : {
        // operationId is usually camelcase or snake case
        reqName = operation.summary || utils.insertSpacesInName(operation.operationId) || reqUrl;
        break;
      }
      case 'url' : {
        reqName = displayUrl || baseUrl;
        break;
      }
      default : {
        reqName = operation[options.requestNameSource];
        break;
      }
    }
    if (!reqName) {
      throw new openApiErr(`requestNameSource (${options.requestNameSource})` +
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
        item.request.addHeader(this.convertToPmHeader(authHelper.properties,
          REQUEST_TYPE.ROOT, PARAMETER_SOURCE.REQUEST, components, options, schemaCache));
        item.request.auth = {
          type: 'noauth'
        };
      }
      else if (authHelper.properties.in === 'query') {
        this.convertToPmQueryParameters(authHelper.properties, REQUEST_TYPE.ROOT,
          components, options, schemaCache).forEach((pmParam) => {
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
      this.convertToPmQueryParameters(queryParam, REQUEST_TYPE.ROOT, components, options, schemaCache)
        .forEach((pmParam) => {
          item.request.url.addQueryParams(pmParam);
        });
    });
    item.request.url.query.members.forEach((query) => {
      query.description = _.get(query, 'description.content', '');
      query.value = (typeof query.value === 'object') ? JSON.stringify(query.value) : query.value;
    });
    item.request.url.variables.clear();
    item.request.url.variables.assimilate(this.convertPathVariables('param', pathVarArray, reqParams.path,
      components, options, schemaCache));

    // Making sure description never goes out as an object
    // App / Collection transformer fail with the object syntax
    if (item.request.url.variables.members && item.request.url.variables.members.length > 0) {
      item.request.url.variables.members = _.map(item.request.url.variables.members, (m) => {
        if (typeof m.description === 'object' && m.description.content) {
          m.description = m.description.content;
        }
        return m;
      });
    }

    // adding headers to request from reqParam
    _.forEach(reqParams.header, (header) => {
      item.request.addHeader(this.convertToPmHeader(header, REQUEST_TYPE.ROOT, PARAMETER_SOURCE.REQUEST,
        components, options, schemaCache));
    });

    // adding Request Body and Content-Type header
    if (reqBody) {
      if (reqBody.$ref) {
        reqBody = this.getRefObject(reqBody.$ref, components, options);
      }
      pmBody = this.convertToPmBody(reqBody, REQUEST_TYPE.ROOT, components, options, schemaCache);
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
        let originalRequestHeaders = [];
        swagResponse = response;
        if (response.$ref) {
          swagResponse = this.getRefObject(response.$ref, components, options);
        }

        // Try and set fields for originalRequest (example.request)
        thisOriginalRequest.method = item.request.method;
        // setting URL
        thisOriginalRequest.url = displayUrl;
        // setting query params
        thisOriginalRequest.url += '?';
        thisOriginalRequest.url += this.convertToPmQueryArray(reqParams, REQUEST_TYPE.EXAMPLE, components,
          options, schemaCache).join('&');
        // setting headers
        _.forEach(reqParams.header, (header) => {
          originalRequestHeaders.push(this.convertToPmHeader(header, REQUEST_TYPE.EXAMPLE,
            PARAMETER_SOURCE.REQUEST, components, options, schemaCache));
        });
        thisOriginalRequest.header = originalRequestHeaders;
        // setting request body
        try {
          exampleRequestBody = this.convertToPmBody(operationItem.properties.requestBody,
            REQUEST_TYPE.EXAMPLE, components, options, schemaCache);
          thisOriginalRequest.body = exampleRequestBody.body ? exampleRequestBody.body.toJSON() : {};
        }
        catch (e) {
          // console.warn('Exception thrown while trying to json-ify body for item.request.body:', item.request.body,
          // 'Exception:', e);
          thisOriginalRequest.body = {};
        }
        convertedResponse = this.convertToPmResponse(swagResponse, code, thisOriginalRequest,
          components, options, schemaCache);
        convertedResponse && item.responses.add(convertedResponse);
      });
    }

    return item;
  },

  /**
   * function to convert an openapi query params object to array of query params
  * @param {*} reqParams openapi query params object
  * @param {*} requestType Specifies whether the request body is of example request or root request
  * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
  * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
  * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
  * @returns {*} array of all query params
  */
  convertToPmQueryArray: function(reqParams, requestType, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);
    let requestQueryParams = [];
    _.forEach(reqParams.query, (queryParam) => {
      this.convertToPmQueryParameters(queryParam, requestType, components, options, schemaCache).forEach((pmParam) => {
        requestQueryParams.push(pmParam.key + '=' + pmParam.value);
      });
    });
    return requestQueryParams;
  },

  // along with the path object, this also returns the values of the
  // path variable's values
  // also, any endpoint-level params are merged into the returned pathItemObject
  /**
   * @param {*} method http method of a Postman transaction request object
   * @param {*} url stringified url of a Postman transaction request object
   * @param {*} schema takes an openapi schema object
   * @returns {array} array of path objects
   */
  findMatchingRequestFromSchema: function (method, url, schema) {
    // first step - get array of requests from schema
    let parsedUrl = require('url').parse(url),
      retVal = [],
      pathToMatch = decodeURI(parsedUrl.pathname),
      matchedPath,
      matchedPathJsonPath,
      schemaPathItems = schema.paths,
      filteredPathItemsArray = [];

    // if pathToMatch starts with '/', we assume it's the correct path
    // if not, we assume the segment till the first '/' is the host
    // this is because a Postman URL like "{{url}}/a/b" will
    // likely have {{url}} as the host segment
    if (!pathToMatch.startsWith('/')) {
      pathToMatch = pathToMatch.substring(pathToMatch.indexOf('/'));
    }

    // Here, only take pathItemObjects that have the right method
    // of those that do, determine a score
    // then just pick that key-value pair from schemaPathItems
    _.forOwn(schemaPathItems, (pathItemObject, path) => {
      if (!pathItemObject) {
        // invalid schema. schema.paths had an invalid entry
        return true;
      }

      if (!pathItemObject.hasOwnProperty(method.toLowerCase())) {
        // the required method was not found at this path
        return true;
      }

      // check if path and pathToMatch match (non-null)
      let schemaMatchResult = this.getPostmanUrlSchemaMatchScore(pathToMatch, path);
      if (!schemaMatchResult.match) {
        // there was no reasonable match b/w the postman path and this schema path
        return true;
      }

      filteredPathItemsArray.push({
        path,
        pathItem: pathItemObject,
        matchScore: schemaMatchResult.score,
        pathVars: schemaMatchResult.pathVars
      });
    });

    _.each(filteredPathItemsArray, (fp) => {
      let path = fp.path,
        pathItemObject = fp.pathItem,
        score = fp.matchScore,
        pathVars = fp.pathVars;

      matchedPath = pathItemObject[method.toLowerCase()];
      if (!matchedPath) {
        // method existed at the path, but was a falsy value
        return true;
      }

      matchedPathJsonPath = `$.paths[${path}]`;

      if (!matchedPath.parameters) {
        matchedPath.parameters = [];
      }

      // aggregate local + global parameters for this path
      matchedPath.parameters = _.map(matchedPath.parameters, (commonParam) => {
        // for path-specifix params that are added to the path, have a way to identify them
        // when the schemaPath is required
        // method is lowercased because OAS methods are always lowercase
        commonParam.pathPrefix = `${matchedPathJsonPath}.${method.toLowerCase()}.parameters`;

        return commonParam;
      }).concat(
        _.map(pathItemObject.parameters || [], (commonParam) => {
          // for common params that are added to the path, have a way to identify them
          // when the schemaPath is required
          commonParam.pathPrefix = matchedPathJsonPath + '.parameters';
          return commonParam;
        })
      );

      retVal.push({
        // using path instead of operationId / summary since it's widely understood
        name: method + ' ' + path,
        path: matchedPath,
        jsonPath: matchedPathJsonPath + '.' + method.toLowerCase(),
        pathVariables: pathVars,
        score: score
      });

      // code reaching here indicates the given method was not found
      return true;
    });

    return retVal;
  },

  /**
   * @description - validates value of the specified property against the schema passed in arguments
   *  and returns array of mismatches (containing property, paths & reason)
   * @param {*} property - one of QUERYPARAM, PATHVARIABLE, HEADER, REQUEST_BODY, RESPONSE_HEADER, RESPONSE_BODY
   * @param {*} jsonPathPrefix - this will be prepended to all JSON schema paths on the request
   * @param {*} txnParamName - Optional - The name of the param being validated (useful for query params,
   *  req headers, res headers)
   * @param {*} value - the value of the property in the request
   * @param {*} schemaPathPrefix - this will be prepended to all JSON schema paths on the schema
   * @param {*} schema - The schema against which to validate
   * @param {*} components - Components in the spec that the schema might refer to
   * @param {*} options - Global options
   * @param {*} callback - For return
   * @returns {*} array of mismatches
   */
  checkValueAgainstSchema: function (property, jsonPathPrefix, txnParamName, value, schemaPathPrefix, schema,
    components, options, callback) {

    let mismatches = [],
      jsonValue,
      humanPropName = propNames[property],
      needJsonMatching = (property === 'BODY' || property === 'RESPONSE_BODY'),
      invalidJson = false,
      ajv, validate,
      valueToUse = value,
      res = true;

    if (needJsonMatching) {
      try {
        jsonValue = JSON.parse(value);
        // If valid JSON is detected, the parsed value should be used
        // to determine mismatches
        valueToUse = jsonValue;
      }
      catch (e) {
        jsonValue = '';
        invalidJson = true;
      }
    }

    // When processing a reference, schema.type could also be undefined
    if (schema && schema.type) {
      if (typeof schemaTypeToJsValidator[schema.type] === 'function') {
        if (!schemaTypeToJsValidator[schema.type](valueToUse)) {
          // if type didn't match, no point checking for AJV
          let reason = '';
          if (property === 'RESPONSE_BODY' || property === 'BODY') {
            // we don't have names for the body, but there's only one
            reason = 'The ' + humanPropName;
          }
          else if (txnParamName) {
            // for query params, req/res headers, path vars, we have a name. Praise the lord.
            reason = `The ${humanPropName} "${txnParamName}"`;
          }
          else {
            // for query params, req/res headers, path vars, we might not ALWAYS have a name.
            reason = `A ${humanPropName}`;
          }
          reason += ` needs to be of type ${schema.type}, but we found `;
          if (!options.shortValidationErrors) {
            reason += `"${valueToUse}"`;
          }
          else if (invalidJson) {
            reason += 'invalid JSON';
          }
          else if (Array.isArray(valueToUse)) {
            reason += 'an array instead';
          }
          else if (typeof valueToUse === 'object') {
            reason += 'an object instead';
          }
          else {
            reason += `a ${typeof valueToUse} instead`;
          }

          return callback(null, [{
            property,
            transactionJsonPath: jsonPathPrefix,
            schemaJsonPath: schemaPathPrefix,
            reasonCode: 'INVALID_TYPE',
            reason
          }]);
        }

        // only do AJV if type is array or object
        // simpler cases are handled by a type check
        if (schema.type === 'array' || schema.type === 'object') {
          try {
            ajv = new Ajv({ unknownFormats: ['int32', 'int64'], allErrors: true });
            validate = ajv.compile(schema);
            res = validate(valueToUse);
          }
          catch (e) {
            // something went wrong validating the schema
            // input was invalid. Don't throw mismatch
          }
          if (!res) {
            mismatches.push({
              property: property,
              transactionJsonPath: jsonPathPrefix,
              schemaJsonPath: schemaPathPrefix,
              reasonCode: 'INVALID_TYPE',
              reason: 'The property didn\'t match the specified schema'
            });

            // only return AJV mismatches
            return callback(null, mismatches);
          }
          // result passed. No AJV mismatch
        }
        // Schema was not AJV or object
      }
      else {
        // unknown schema.type found
        // TODO: Decide how to handle. Log?
      }
    }
    // Schema not defined
    return callback(null, []);

    // if (!schemaTypeToJsValidator[schema.type](value)) {
    //   callback(null, [{
    //     property,
    //     transactionJsonPath: jsonPathPrefix,
    //     schemaJsonPath: schemaPathPrefix,
    //     reasonCode: 'INVALID_TYPE',
    //     reason: `Value must be a token of type ${schema.type}, found ${value}`
    //   }]);
    // }
    // TODO: Further checks for object type
    // else {
    //   callback(null, []);
    // }
  },

  /**
   *
   * @description - validates path variables of request schema (from Postman) and returns mismatches
   * @param {*} determinedPathVariables the key/determined-value pairs of the path variables (from Postman)
   * @param {*} transactionPathPrefix the jsonpath for this validation (will be prepended to all identified mismatches)
   * @param {*} schemaPath the applicable pathItem defined at the schema level
   * @param {*} components the components + paths from the OAS spec that need to be used to resolve $refs
   * @param {*} options OAS options
   * @param {*} schemaResolutionCache cache used to store resolved schemas
   * @param {*} callback Callback
   * @returns {array} mismatches (in the callback)
   */
  checkPathVariables: function (
    determinedPathVariables,
    transactionPathPrefix,
    schemaPath,
    components,
    options,
    schemaResolutionCache,
    callback) {

    // schema path should have all parameters needed
    // components need to be stored globally
    var mismatchProperty = 'PATHVARIABLE',
      // all path variables defined in this path. acc. to the spec, all path params are required
      schemaPathVariables,
      schemaPathVar;

    if (options.validationPropertiesToIgnore.includes(mismatchProperty)) {
      return callback(null, []);
    }

    schemaPathVariables = _.filter(schemaPath.parameters, (param) => {
      return (param.in === 'path');
    });

    async.map(determinedPathVariables, (pathVar, cb) => {
      let mismatches = [];

      schemaPathVar = _.find(schemaPathVariables, (param) => {
        return param.name === pathVar.key;
      });

      if (!schemaPathVar) {
        // extra pathVar present in given request.
        if (options.showMissingInSchemaErrors) {
          mismatches.push({
            property: mismatchProperty,
            // not adding the pathVar name to the jsonPath because URL is just a string
            transactionJsonPath: transactionPathPrefix,
            schemaJsonPath: null,
            reasonCode: 'MISSING_IN_SCHEMA',
            reason: `The path variable ${pathVar.key} was not found in the schema`
          });
        }
        return cb(null, mismatches);
      }

      setTimeout(() => {
        if (!(schemaPathVar && schemaPathVar.schema)) {
          // no errors to show if there's no schema present in the spec
          return cb(null, []);
        }

        this.checkValueAgainstSchema(mismatchProperty,
          transactionPathPrefix,
          pathVar.key,
          pathVar.value,
          schemaPathVar.pathPrefix + '[?(@.name==\'' + schemaPathVar.name + '\')]',
          deref.resolveRefs(schemaPathVar.schema, 'request', components, schemaResolutionCache),
          components, options, cb);
      }, 0);
    }, (err, res) => {
      let mismatches = [];

      if (err) {
        return callback(err);
      }

      // go through required schemaPathVariables, and params that aren't found in the given transaction are errors
      _.each(schemaPathVariables, (pathVar) => {
        if (!_.find(determinedPathVariables, (param) => { return param.key === pathVar.name; })) {
          mismatches.push({
            property: mismatchProperty,
            transactionJsonPath: null,
            schemaJsonPath: pathVar.pathPrefix,
            reasonCode: 'MISSING_IN_REQUEST',
            reason: `The required path variable "${pathVar.name}" was not found in the transaction`
          });
        }
      });

      // res is an array of mismatches (also an array) from all checkValueAgainstSchema calls
      return callback(null, _.concat(_.flatten(res), mismatches));
    });
  },

  /**
   * @description - validates query params of a Postman request object and returns mismatches
   * @param {*} requestUrl stringified url of a Postman transaction request object
   * @param {*} transactionPathPrefix the jsonpath for this validation (will be prepended to all identified mismatches)
   * @param {*} schemaPath the applicable pathItem defined at the schema level
   * @param {*} components the components + paths from the OAS spec that need to be used to resolve $refs
   * @param {*} options OAS options
   * @param {*} schemaResolutionCache cache used to store resolved schemas
   * @param {*} callback Callback
   * @returns {array} mismatches (in the callback)
   */
  checkQueryParams(requestUrl, transactionPathPrefix, schemaPath, components, options,
    schemaResolutionCache, callback) {
    let parsedUrl = require('url').parse(requestUrl),
      schemaParams = _.filter(schemaPath.parameters, (param) => { return param.in === 'query'; }),
      requestQueryArray = [],
      requestQueryParams = [],
      mismatchProperty = 'QUERYPARAM',
      urlMalformedError;

    if (options.validationPropertiesToIgnore.includes(mismatchProperty)) {
      return callback(null, []);
    }

    if (!parsedUrl.query) {
      // null query params should be treated as lack of any params
      parsedUrl.query = '';
    }
    requestQueryArray = parsedUrl.query.split('&');

    _.each(requestQueryArray, (rqp) => {
      let parts = rqp.split('='),
        qKey, qVal;

      try {
        qKey = decodeURIComponent(parts[0]);
        qVal = decodeURIComponent(parts.slice(1).join('='));
      }
      catch (err) {
        return (urlMalformedError = err);
      }


      if (qKey.length > 0) {
        requestQueryParams.push({
          key: qKey,
          value: qVal
        });
      }
    });

    if (urlMalformedError) {
      return callback(urlMalformedError);
    }

    return async.map(requestQueryParams, (pQuery, cb) => {
      let mismatches = [];
      const schemaParam = _.find(schemaParams, (param) => { return param.name === pQuery.key; });

      if (!schemaParam) {
        // no schema param found
        if (options.showMissingInSchemaErrors) {
          mismatches.push({
            property: mismatchProperty,
            transactionJsonPath: transactionPathPrefix + '[?(@.key==\'' + pQuery.key + '\')]',
            schemaJsonPath: null,
            reasonCode: 'MISSING_IN_SCHEMA',
            reason: `The query parameter ${pQuery.key} was not found in the schema`
          });
        }
        return cb(null, mismatches);
      }

      // query found in spec. check query's schema
      setTimeout(() => {
        if (!schemaParam.schema) {
          // no errors to show if there's no schema present in the spec
          return cb(null, []);
        }
        this.checkValueAgainstSchema(mismatchProperty,
          transactionPathPrefix + '[?(@.key==\'' + pQuery.key + '\')]',
          pQuery.key,
          pQuery.value,
          schemaParam.pathPrefix + '[?(@.name==\'' + schemaParam.name + '\')]',
          deref.resolveRefs(schemaParam.schema, 'request', components, schemaResolutionCache),
          components, options,
          cb
        );
      }, 0);
    }, (err, res) => {
      let mismatches = [];
      _.each(_.filter(schemaParams, (q) => { return q.required; }), (qp) => {
        if (!_.find(requestQueryParams, (param) => { return param.key === qp.name; })) {
          mismatches.push({
            property: mismatchProperty,
            transactionJsonPath: null,
            schemaJsonPath: qp.pathPrefix + '[?(@.name==\'' + qp.name + '\')]',
            reasonCode: 'MISSING_IN_REQUEST',
            reason: `The required query parameter "${qp.name}" was not found in the transaction`
          });
        }
      });
      return callback(null, _.concat(_.flatten(res), mismatches));
    });
  },

  /**
   * @description - validates headers in headers of a Postman request object and returns mismatches
   * @param {*} headers headers for a Postman transaction request object
   * @param {*} transactionPathPrefix the jsonpath for this validation (will be prepended to all identified mismatches)
   * @param {*} schemaPath the applicable pathItem defined at the schema level
   * @param {*} components the components + paths from the OAS spec that need to be used to resolve $refs
   * @param {*} options OAS options
   * @param {*} schemaResolutionCache cache used to store resolved schemas
   * @param {*} callback Callback
   * @returns {array} mismatches (in the callback)
   */
  checkRequestHeaders: function (headers, transactionPathPrefix, schemaPath, components, options,
    schemaResolutionCache, callback) {
    let schemaHeaders = _.filter(schemaPath.parameters, (param) => { return param.in === 'header'; }),
      mismatchProperty = 'HEADER';

    if (options.validationPropertiesToIgnore.includes(mismatchProperty)) {
      return callback(null, []);
    }
    // 1. for each header, find relevant schemaPath property

    return async.map(headers, (pHeader, cb) => {
      let mismatches = [];
      const schemaHeader = _.find(schemaHeaders, (header) => { return header.name === pHeader.key; });

      if (!schemaHeader) {
        // no schema header found
        if (options.showMissingInSchemaErrors) {
          mismatches.push({
            property: mismatchProperty,
            transactionJsonPath: transactionPathPrefix + '[?(@.key==\'' + pHeader.key + '\')]',
            schemaJsonPath: null,
            reasonCode: 'MISSING_IN_SCHEMA',
            reason: `The header ${pHeader.key} was not found in the schema`
          });
        }
        return cb(null, mismatches);
      }

      // header found in spec. check header's schema
      setTimeout(() => {
        if (!schemaHeader.schema) {
          // no errors to show if there's no schema present in the spec
          return cb(null, []);
        }
        this.checkValueAgainstSchema(mismatchProperty,
          transactionPathPrefix + '[?(@.key==\'' + pHeader.key + '\')]',
          pHeader.key,
          pHeader.value,
          schemaHeader.pathPrefix + '[?(@.name==\'' + schemaHeader.name + '\')]',
          deref.resolveRefs(schemaHeader.schema, 'request', components, schemaResolutionCache),
          components, options,
          cb
        );
      }, 0);
    }, (err, res) => {
      let mismatches = [];
      _.each(_.filter(schemaHeaders, (h) => { return h.required; }), (header) => {
        if (!_.find(headers, (param) => { return param.key === header.name; })) {
          mismatches.push({
            property: mismatchProperty,
            transactionJsonPath: null,
            schemaJsonPath: header.pathPrefix + '[?(@.name==\'' + header.name + '\')]',
            reasonCode: 'MISSING_IN_REQUEST',
            reason: `The required header "${header.name}" was not found in the transaction`
          });
        }
      });
      return callback(null, _.concat(_.flatten(res), mismatches));
    });
  },

  /**
   * @description - validates response headers of a schema response and returns mismatches
   * @param {*} schemaResponse response against a schema (extracted from schemaPath)
   * @param {*} headers headers for a response in set of responses for Postman transaction request
   * @param {*} transactionPathPrefix the jsonpath for this validation
   * @param {*} schemaPathPrefix prepended to all JSON schema paths on the schema
   * @param {*} components the components + paths from the OAS spec that need to be used to resolve $refs
   * @param {*} options OAS options
   * @param {*} schemaResolutionCache cache used to store resolved schemas
   * @param {*} callback Callback
   * @returns {array} mismatches (in the callback)
   */
  checkResponseHeaders: function (schemaResponse, headers, transactionPathPrefix, schemaPathPrefix,
    components, options, schemaResolutionCache, callback) {
    // 0. Need to find relevant response from schemaPath.responses
    let schemaHeaders,
      mismatchProperty = 'RESPONSE_HEADER';

    if (options.validationPropertiesToIgnore.includes(mismatchProperty)) {
      return callback(null, []);
    }

    if (!schemaResponse || !(schemaResponse.headers)) {
      // no default response found, or no headers specified
      // if there is no header key, we can't call it a mismatch
      return callback(null, []);
    }

    schemaHeaders = schemaResponse.headers;

    return async.map(headers, (pHeader, cb) => {
      let mismatches = [];
      const schemaHeader = schemaHeaders[pHeader.key];

      if (!schemaHeader) {
        // no schema header found
        if (options.showMissingInSchemaErrors) {
          mismatches.push({
            property: mismatchProperty,
            transactionJsonPath: transactionPathPrefix + '/' + pHeader.key,
            schemaJsonPath: schemaPathPrefix + '/headers',
            reasonCode: 'MISSING_IN_SCHEMA',
            reason: `The header ${pHeader.key} was not found in the schema`
          });
        }
        return cb(null, []);
      }

      // header found in spec. check header's schema
      setTimeout(() => {
        if (!schemaHeader.schema) {
          // no errors to show if there's no schema present in the spec
          return cb(null, []);
        }
        return this.checkValueAgainstSchema(mismatchProperty,
          transactionPathPrefix + '/' + pHeader.key,
          pHeader.key,
          pHeader.value,
          schemaPathPrefix + '.headers[' + pHeader.key + ']',
          deref.resolveRefs(schemaHeader.schema, 'response', components, schemaResolutionCache),
          components,
          options,
          cb
        );
      }, 0);
    }, (err, res) => {
      let mismatches = [];
      _.each(_.filter(schemaHeaders, (h, hName) => {
        h.name = hName;
        return h.required;
      }), (header) => {
        if (!_.find(headers, (param) => { return param.key === header.name; })) {
          mismatches.push({
            property: mismatchProperty,
            transactionJsonPath: null,
            schemaJsonPath: schemaPathPrefix + '.headers[\'' + header.name + '\']',
            reasonCode: 'MISSING_IN_REQUEST',
            reason: `The required response header "${header.name}" was not found in the transaction`
          });
        }
      });
      callback(null, _.concat(_.flatten(res), mismatches));
    });
  },

  // Only application/json is validated for now
  /**
   * @description - validates body of a Postman request object and returns mismatches
   * @param {*} requestBody body of a Postman transaction request object
   * @param {*} transactionPathPrefix the jsonpath for this validation (will be prepended to all identified mismatches)
   * @param {*} schemaPathPrefix prepended to all JSON schema paths on the schema
   * @param {*} schemaPath the applicable pathItem defined at the schema level
   * @param {*} components the components + paths from the OAS spec that need to be used to resolve $refs
   * @param {*} options OAS options
   * @param {*} schemaResolutionCache cache used to store resolved schemas
   * @param {*} callback Callback
   * @returns {array} mismatches (in the callback)
   */
  checkRequestBody: function (requestBody, transactionPathPrefix, schemaPathPrefix, schemaPath,
    components, options, schemaResolutionCache, callback) {
    // check for body modes
    // TODO: The application/json can be anything that's application/*+json
    let jsonSchemaBody = _.get(schemaPath, ['requestBody', 'content', 'application/json', 'schema']),
      mismatches = [],
      mismatchProperty = 'BODY';

    if (options.validationPropertiesToIgnore.includes(mismatchProperty)) {
      return callback(null, []);
    }

    if (requestBody && requestBody.mode === 'raw' && jsonSchemaBody) {
      // only raw for now
      // the unknown formats are ones that are allowed in OAS, but not JSON schema
      let ajv,
        validate,
        res = true;

      try {
        ajv = new Ajv({ unknownFormats: ['int32', 'int64'], allErrors: true });
        validate = ajv.compile(deref.resolveRefs(jsonSchemaBody, 'request', components, schemaResolutionCache));
        res = validate(JSON.parse(requestBody.raw));
      }
      catch (e) {
        // something went wrong validating the schema
        // input was invalid. Don't throw mismatch
      }
      if (!res) {
        mismatches.push({
          property: mismatchProperty,
          transactionJsonPath: transactionPathPrefix,
          schemaJsonPath: schemaPathPrefix + 'requestBody.content.application.json.schema',
          reasonCode: 'INVALID_BODY',
          reason: 'The request body didn\'t match the specified schema'
        });

        // Not validating parts of the body for now
        // _.each(validate.errors, (error) => {
        //   // error.keyword can be https://ajv.js.org/keywords.html
        //   mismatches.push({
        //     property: 'REQUEST_BODY',
        //     transactionJsonPath: transactionPathPrefix + error.dataPath,
        //     schemaJsonPath: schemaPathPrefix + 'requestBody.content.application.json.schema.' + error.schemaPath,
        //     reasonCode: error.keyword.toUpperCase(),
        //     reason: error.message
        //   });
        // });
        return callback(null, mismatches);
      }
    }

    return callback(null, []);
  },

  /**
   * @description - validates response of a schema and returns mismatches
   * @param {*} schemaResponse response against a schema (extracted from schemaPath)
   * @param {*} body response body in a set of responses for Postman transaction request
   * @param {*} transactionPathPrefix the jsonpath for this validation
   * @param {*} schemaPathPrefix prepended to all JSON schema paths on the schema
   * @param {*} components the components + paths from the OAS spec that need to be used to resolve $refs
   * @param {*} options OAS options
   * @param {*} schemaResolutionCache cache used to store resolved schemas
   * @param {*} callback Callback
   * @returns {array} mismatches (in the callback)
   */
  checkResponseBody: function (schemaResponse, body, transactionPathPrefix, schemaPathPrefix,
    components, options, schemaResolutionCache, callback) {
    let schemaContent = _.get(schemaResponse, ['content', 'application/json', 'schema']),
      mismatchProperty = 'RESPONSE_BODY';

    if (options.validationPropertiesToIgnore.includes(mismatchProperty)) {
      return callback(null, []);
    }

    if (!schemaContent) {
      // no specific or default response with application/json
      // return callback(null, [{
      //   property: mismatchProperty,
      //   transactionJsonPath: transactionPathPrefix,
      //   schemaJsonPath: null,
      //   reasonCode: 'BODY_SCHEMA_NOT_FOUND',
      //   reason: 'No JSON schema found for this response'
      // }]);

      // cannot show mismatches if the schema didn't have any application/JSON response
      return callback(null, []);
    }

    setTimeout(() => {
      return this.checkValueAgainstSchema(mismatchProperty,
        transactionPathPrefix,
        null, // no param name for the request body
        body,
        schemaPathPrefix + '.content[application/json].schema',
        deref.resolveRefs(schemaContent, 'response', components, schemaResolutionCache),
        components,
        _.extend({}, options, { shortValidationErrors: true }),
        callback
      );
    }, 0);
  },

  /**
   * @description - validates responses of a Postman request object and returns mismatches
   * @param {*} responses set of responses for a Postman transaction request
   * @param {*} transactionPathPrefix the jsonpath for this validation
   * @param {*} schemaPathPrefix prepended to all JSON schema paths on the schema
   * @param {*} schemaPath the applicable pathItem defined at the schema level
   * @param {*} components the components + paths from the OAS spec that need to be used to resolve $refs
   * @param {*} options OAS options
   * @param {*} schemaResolutionCache cache used to store resolved schemas
   * @param {*} cb Callback
   * @returns {array} mismatches (in the callback)
   */
  checkResponses: function (responses, transactionPathPrefix, schemaPathPrefix, schemaPath,
    components, options, schemaResolutionCache, cb) {
    // responses is an array of repsonses recd. for one Postman request
    // we've already determined the schemaPath against which all responses need to be validated
    // loop through all responses
    // for each response, find the appropriate response from schemaPath, and then validate response body and headers
    async.map(responses, (response, responseCallback) => {
      let thisResponseCode = response.code,
        thisSchemaResponse = _.get(schemaPath, ['responses', thisResponseCode]),
        responsePathPrefix = thisResponseCode;
      // find this code from the schemaPath
      if (!thisSchemaResponse) {
        // could not find an appropriate response for this code. check default?
        thisSchemaResponse = _.get(schemaPath, ['responses', 'default']);
        responsePathPrefix = 'default';
      }

      if (!thisSchemaResponse) {
        // still didn't find a response
        responseCallback(null);
      }
      else {
        // check headers and body
        async.parallel({
          headers: (cb) => {
            this.checkResponseHeaders(thisSchemaResponse, response.header,
              transactionPathPrefix + '[' + response.id + ']header',
              schemaPathPrefix + '.responses.' + responsePathPrefix, components, options, schemaResolutionCache, cb);
          },
          body: (cb) => {
            // assume it's JSON at this point
            this.checkResponseBody(thisSchemaResponse, response.body,
              transactionPathPrefix + '[' + response.id + ']body',
              schemaPathPrefix + '.responses.' + responsePathPrefix, components, options, schemaResolutionCache, cb);
          }
        }, (err, result) => {
          return responseCallback(null, {
            id: response.id,
            matched: (result.body.length === 0 && result.headers.length === 0),
            mismatches: result.body.concat(result.headers)
          });
        });
      }
    }, (err, result) => {
      var retVal = _.keyBy(_.reject(result, (ai) => { return !ai; }), 'id');
      return cb(null, retVal);
    });
  },

  /**
   * @description - Determines whether path to a postman transaction request object & the schema path match.
   * If they do, method calculates a similarity score
   * @param {string} postmanPath - parsed path (exclude host and params) from the Postman request
   * @param {string} schemaPath - schema path from the OAS spec (exclude servers object)
   * @returns {*} score + match + pathVars - higher score - better match. null - no match
   */
  getPostmanUrlSchemaMatchScore: function (postmanPath, schemaPath) {
    var postmanPathArr = _.reject(postmanPath.split('/'), (segment) => {
        return segment === '';
      }),
      schemaPathArr = _.reject(schemaPath.split('/'), (segment) => {
        return segment === '';
      }),
      matchedPathVars = null,
      maxScoreFound = -Infinity,
      anyMatchFound = false,
      postmanPathSuffixes = [];

    // get array with all suffixes of postmanPath
    // if postmanPath = {{url}}/a/b, the suffix array is [ [{{url}}, a, b] , [a, b] , [b]]
    for (let i = postmanPathArr.length; i > 0; i--) {
      // i will be 3, 2, 1
      postmanPathSuffixes.push(postmanPathArr.slice(-i));

      break; // we only want one item in the suffixes array for now
    }

    // for each suffx, calculate score against the schemaPath
    // the schema<>postman score is the sum
    _.each(postmanPathSuffixes, (pps) => {
      let suffixMatchResult = this.getPostmanUrlSuffixSchemaScore(pps, schemaPathArr);
      if (suffixMatchResult.match && suffixMatchResult.score > maxScoreFound) {
        maxScoreFound = suffixMatchResult.score;
        matchedPathVars = suffixMatchResult.pathVars;
        anyMatchFound = true;
      }
    });

    if (anyMatchFound) {
      return {
        match: true,
        score: maxScoreFound,
        pathVars: matchedPathVars
      };
    }
    return {
      match: false
    };
  },

  /**
   * @param {array} pmSuffix - Array of '/' separated path segments from schema path from OAS spec
   * @param {array} schemaPath - Array of all possible suffixes of parsed path from Postman request
   * @returns {*} score - null of no match, int for match. higher value indicates better match
   * You get points for the number of URL segments that match
   * You are penalized for the number of schemaPath segments that you skipped
   */
  getPostmanUrlSuffixSchemaScore: function (pmSuffix, schemaPath) {
    let mismatchFound = false,
      variables = [],
      minLength = Math.min(pmSuffix.length, schemaPath.length),
      sMax = schemaPath.length - 1,
      pMax = pmSuffix.length - 1,
      matchedSegments = 0;

    // start from the last segment of both
    // segments match if the schemaPath segment is {..} or the postmanPathStr is :<anything> or {{anything}}
    // for (let i = pmSuffix.length - 1; i >= 0; i--) {
    for (let i = 0; i < minLength; i++) {
      if (
        (schemaPath[sMax - i] === pmSuffix[pMax - i]) || // exact match
        (schemaPath[sMax - i].startsWith('{') && schemaPath[sMax - i].endsWith('}')) || // schema segment is a pathVar
        (pmSuffix[pMax - i].startsWith(':')) || // postman segment is a pathVar
        (pmSuffix[pMax - i].startsWith('{{') && pmSuffix[pMax - i].endsWith('}}')) // postman segment is an env var
      ) {
        // add a matched path variable only if the schema one was a pathVar
        if (schemaPath[sMax - i].startsWith('{') && schemaPath[sMax - i].endsWith('}')) {
          variables.push({
            key: schemaPath[sMax - i].substring(1, schemaPath[sMax - i].length - 1),
            value: pmSuffix[pMax - i]
          });
        }
        matchedSegments++;
      }
      else {
        // there was one segment for which there was no mismatch
        mismatchFound = true;
        break;
      }
    }

    if (!mismatchFound) {
      return {
        match: true,
        // schemaPath endsWith postman path suffix
        // score is length of the postman path array + schema array - length difference
        // the assumption is that a longer path matching a longer path is a higher score, with
        // penalty for any length difference
        // schemaPath will always be > postmanPathSuffix because SchemaPath ands with pps
        score: ((2 * matchedSegments) / (schemaPath.length + pmSuffix.length)),
        pathVars: variables
      };
    }
    return {
      match: false,
      score: null,
      pathVars: []
    };
  }
};

