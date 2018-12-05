var sdk = require('postman-collection'),
  schemaFaker = require('../assets/json-schema-faker.js'),
  parse = require('./parse.js'),
  deref = require('./deref.js'),
  _ = require('lodash'),
  openApiErr = require('./error.js');

const URLENCODED = 'application/x-www-form-urlencoded',
  APP_JSON = 'application/json',
  APP_JS = 'application/javascript',
  APP_XML = 'application/xml',
  TEXT_XML = 'text/xml',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  FORM_DATA = 'multipart/form-data',
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
* @returns {object} fakedObject
*/
function safeSchemaFaker(oldSchema, components) {
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
    return schemaFaker(schema);
  }
  catch (e) {
    console.error(
      'Error faking a schema. Not faking this schema. Schema:', schema,
      'Error', e
    );
    return null;
  }
}

/**
 * Class for the node of the tree containing the folders
 * @param {object} options - Contains details about the folder/collection node
 * @returns {void}
 */
function Node (options) {
  // human-readable name
  this.name = options ? options.name : '/';

  // number of requests in the sub-trie of this node
  this.requestCount = options ? options.requestCount : 0;

  this.type = options ? options.type : 'item';

  // stores all direct folder descendants of this node
  this.children = {};

  this.requests = options ? options.requests : []; // request will be an array of objects

  this.addChildren = function (child, value) {
    this.children[child] = value;
  };

  this.addMethod = function (method) {
    this.requests.push(method);
  };
}

class Trie {
  constructor(node) {
    this.root = node;
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
    /*
    The first .replace:
      Handling path templating in request url if any
      only replace /{pet}<end-of-string> or /{pet}/
      https://regex101.com/r/Yqm2As/2

    The second .replace:
      we also need to replace the scheme variables
      {scheme}://api.com
      needs to become
      {{scheme}}://api.com
      and scheme is already set as a collection variable
    */

    return url
      .replace(/\/\{([a-zA-Z0-9\-\_]+)\}(\/|$)/g, '/:$1$2')
      .replace(/^\{([a-zA-Z0-9\-\_]+)\}\:/, '{{$1}}:');
  },

  /**
   * Adds the neccessary server variables to the collection
   * TODO: Figure out better description
   * @param {object} serverVariables - Object containing the server variables at the root/path-item level
   * @param {string} level - root / path-item level
   * @param {string} serverUrl - URL from the server object
   *
   * @returns {object} modified collection after the addition of the server variables
   */
  convertToPmCollectionVariables: function(serverVariables, level, serverUrl = '') {
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
    else {
      variables.push(new sdk.Variable({
        id: level,
        value: serverUrl,
        type: 'string'
      }));
    }
    return variables;
  },

  /**
   * Parses an OAS string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.x specification specified in either YAML or JSON
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec
   */
  parseSpec: function (openApiSpec) {
    var openApiObj = openApiSpec,
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
          return {
            result: false,
            reason: 'Invalid format. Input must be in YAML or JSON format'
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
      method,
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
      // returns a list of methods supported at each path
      getPathMethods = function(pathKeys) {
        var methods = [];
        pathKeys.forEach(function(element) {
          if (METHODS.indexOf(element) !== -1) {
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

        // split the path into indiv. segments for trie-generation
        currentPath = path.split('/');
        pathLength = currentPath.length;

        // stores names of methods in path to pathMethods, if they're present in METHODS.
        pathMethods = getPathMethods(Object.keys(currentPathObject));
        // the number of requests under this node
        currentPathRequestCount = pathMethods.length;
        currentNode = trie.root;

        // adding children for the nodes in the trie
        // starts at the top-level and does a DFS
        for (i = 0; i < pathLength; i++) {
          if (!currentNode.children[currentPath[i]]) {
            // if the currentPath doesn't already exist at this node,
            // add it as a folder
            currentNode.addChildren(currentPath[i], new Node({
              name: currentPath[i],
              requestCount: 0,
              requests: [],
              children: {},
              type: 'item-group'
            }));
          }
          // requestCount increment for the node we just added
          currentNode.children[currentPath[i]].requestCount += currentPathRequestCount;
          currentNode = currentNode.children[currentPath[i]];
        }

        // extracting common parameters for all the methods in the current path item
        if (currentPathObject.hasOwnProperty('parameters')) {
          commonParams = currentPathObject.parameters;
          delete currentPathObject.parameters;
        }

        // storing common path/collection vars from the server object at the path item level
        if (currentPathObject.hasOwnProperty('servers')) {
          pathLevelServers = currentPathObject.servers;
          collectionVariables[path + 'Url'] = pathLevelServers[0];
          delete currentPathObject.servers;
        }

        // if this path has direct methods under it
        for (method in currentPathObject) {
          // check for valid methods
          if (currentPathObject.hasOwnProperty(method) && METHODS.indexOf(method) !== -1) {
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
          }
        }
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
   * @param {object} commonPathVariables - Object of path variables taken from the specification
   * @returns {Array<object>} returns array of sdk.Variable
   */
  convertPathVariables: function(type, providedPathVars, commonPathVariables) {
    var variables = providedPathVars;
    // converting the base uri path variables, if any
    if (type === 'root' || type === 'method') {
      _.forOwn(commonPathVariables, (value, key) => {
        variables.push({
          key: key,
          value: type === 'root' ? '{{' + key + '}}' : value.default,
          description: (value.description || '') + (value.enum ?
            ' (This can only be one of ' + value.enum.toString() + ')' : '')
        });
      });
    }
    else {
      _.forEach(commonPathVariables, (variable) => {
        variables.push({
          key: variable.name,
          // we only fake the schema for param-level pathVars
          value: this.options.schemaFaker ? safeSchemaFaker(variable.schema || {}, this.components) : '',
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
    if (!string) {
      return null;
    }

    return string
      .replace(/([a-z])([A-Z])/g, '$1 $2') // convert createUser to create User
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // convert NASAMission to NASA Mission
      .replace(/(_+)([A-Za-z0-9])/g, ' $2'); // convert create_user to create user
  },

  /**
   * convert childItem from openAPI to Postman itemGroup if requestCount(no of requests inside childitem)>1
   * otherwise return postman request
   * @param {*} openapi object with root-level data like pathVariables baseurl
   * @param {*} child object is of type itemGroup or request
   * @returns {*} Postman itemGroup or request
   */
  convertChildToItemGroup: function(openapi, child) {
    var resource = child,
      itemGroup,
      subChild,
      item,
      i,
      requestCount;

    if (resource.type === 'item-group') {
      // 3 options:

      // 1. folder with more than one request in its subtree
      if (resource.requestCount > 1) {
        // only return a Postman folder if this folder has>1 requests in its subtree
        // otherwise we can end up with 10 levels of folders
        // with 1 request in the end
        itemGroup = new sdk.ItemGroup({
          name: this.insertSpacesInName(resource.name)
          // TODO: have to add auth here (but first, auth to be put into the openapi tree)
        });

        for (i = 0, requestCount = resource.requests.length; i < requestCount; i++) {
          // recurse over child requests
          itemGroup.items.add(
            this.convertChildToItemGroup(openapi, resource.requests[i])
          );
        }

        for (subChild in resource.children) {
          // recurese over child folders
          if (resource.children.hasOwnProperty(subChild) && resource.children[subChild].requestCount > 0) {
            itemGroup.items.add(
              this.convertChildToItemGroup(openapi, resource.children[subChild])
            );
          }
        }

        return itemGroup;
      }

      // 2. it's a folder with just one request in its subtree
      // recurse DFS-ly to find that one request
      if (resource.requests.length === 1) {
        return this.convertChildToItemGroup(openapi, resource.requests[0]);
      }

      // 3. it has only request
      for (subChild in resource.children) {
        if (resource.children.hasOwnProperty(subChild) && resource.children[subChild].requestCount === 1) {
          return this.convertChildToItemGroup(openapi, resource.children[subChild]);
        }
      }
    }

    item = this.convertRequestToItem(openapi, resource);
    return item;
  },

  /**
   * Gets helper object based on the root spec and the operation.security object
   * @param {*} openapi
   * @param {Array<object>} securitySet
   * @returns {object} The authHelper to use while constructing the Postman Request
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
      if (securityDef.type === 'http') {
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
   * conerts into POSTMAN Response body
   * @param {*} contentObj response content
   * @return {string} responseBody
   */
  convertToPmResponseBody: function(contentObj) {
    var responseBody, cTypeHeader;
    if (!contentObj) {
      return {
        contentTypeHeader: null,
        responseBody: ''
      };
    }

    if (contentObj[APP_JSON]) {
      cTypeHeader = APP_JSON;
      responseBody = this.convertToPmBodyData(contentObj[APP_JSON]);
    }
    else if (contentObj[APP_XML]) {
      cTypeHeader = APP_XML;
      responseBody = this.convertToPmBodyData(contentObj[APP_XML]);
    }
    else if (contentObj[APP_JS]) {
      cTypeHeader = APP_JS;
      responseBody = this.convertToPmBodyData(contentObj[APP_JS]);
    }
    else if (contentObj[TEXT_PLAIN]) {
      cTypeHeader = TEXT_PLAIN;
      responseBody = this.convertToPmBodyData(contentObj[TEXT_PLAIN]);
    }
    // TODO: Need to figure out the else case

    return {
      contentTypeHeader: cTypeHeader,
      responseBody: JSON.stringify(responseBody, null, 4)
    };
  },

  /**
   *  map for creating parameters specific for a request
   * @param {*} localParams parameters array
   * @returns {Object} with three arrays of query, header and path as keys.
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
    if (example.value) {
      example = example.value;
    }

    return example;
  },

  /**
   * converts one of the eamples or schema in Media Type object to postman data
   * @param {*} bodyObj is MediaTypeObject
   * @returns {*} postman body data
   */
  convertToPmBodyData: function(bodyObj) {
    var bodyData = '';

    // This part is to remove format:binary from any string-type properties
    // will cause schemaFaker to crash if left untreated
    if (bodyObj.hasOwnProperty('example')) {
      bodyData = bodyObj.example;
      // return example value if present else example is returned
      if (bodyData.value) {
        bodyData = bodyData.value;
      }
    }
    else if (bodyObj.hasOwnProperty('examples')) {
      bodyData = this.getExampleData(bodyObj.examples);
      // take one of the examples as the body and not all
    }
    else if (bodyObj.hasOwnProperty('schema')) {
      if (bodyObj.schema.hasOwnProperty('$ref')) {
        bodyObj.schema = this.getRefObject(bodyObj.schema.$ref);
      }
      bodyData = this.options.schemaFaker ? safeSchemaFaker(bodyObj.schema || {}, this.components) : '';
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
      paramValue = this.options.schemaFaker ? safeSchemaFaker(param.schema, this.components) : '';
      // paramType = param.schema.type;
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

  convertParamsWithStyle: function(param, paramValue) {
    var paramType = param.schema.type,
      paramNameArray,
      pmParams = [],
      handleExplode = (explodeFlag, paramValue, paramName) => {
        if (explodeFlag) {
          paramNameArray = Array.from(Array(paramValue.length), () => { return paramName; });
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
    // checking the type of the query parameter
    if (paramType === 'array') {
      // which style is there ?
      if (param.style === 'form') {
        // check for the truthness of explode
        pmParams = handleExplode(param.explode, paramValue, param.name);
      }
      else if (param.style === 'spaceDelimited') {
        // explode parameter doesn't really affect anything here
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
        pmParams.push({
          key: param.name,
          value: paramValue.join(','),
          description: param.description
        });
      }
    }
    else if (paramType === 'object') {
      // following similar checks as above
      if (param.hasOwnProperty('style')) {
        if (param.style === 'form') {
          if (param.explode) {
            // if explode is true
            paramNameArray = Object.keys(paramValue);
            pmParams.push(...paramNameArray.map((value, index) => {
              return {
                key: value,
                value: Object.values(paramValue)[index],
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
   * converts param with in='header' and response header to POSTMAN header
   * @param {*} header param with in='header'
   * @returns {Object} instance of POSTMAN sdk Header
   */
  convertToPmHeader: function(header) {
    var fakeData,
      reqHeader;

    if (header.hasOwnProperty('schema')) {
      fakeData = this.options.schemaFaker ? JSON.stringify(safeSchemaFaker(header.schema || {}, this.components)) : '';
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
   * converts operation item requestBody to POSTMAN request body
   * @param {*} requestBody in operationItem
   * @returns {Object} - postman requestBody and Content-Type Header
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

    // handling for the urlencoded media type
    if (contentObj.hasOwnProperty(URLENCODED)) {
      rDataMode = 'urlencoded';
      if (contentObj[URLENCODED].hasOwnProperty('schema') && contentObj[URLENCODED].schema.hasOwnProperty('$ref')) {
        contentObj[URLENCODED].schema = this.getRefObject(contentObj[URLENCODED].schema.$ref);
      }
      bodyData = this.convertToPmBodyData(contentObj[URLENCODED]);
      encoding = contentObj[URLENCODED].encoding ? contentObj[URLENCODED].encoding : {};
      // create query parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {
        if (encoding.hasOwnProperty(key)) {
          encoding[key].name = key;
          encoding[key].schema = {
            type: typeof value
          };
          params = this.convertParamsWithStyle(encoding[key], value);
          params.forEach((element) => {
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
      bodyData = this.convertToPmBodyData(contentObj[FORM_DATA]);
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

      bodyData = this.convertToPmBodyData(contentObj[bodyType]);

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
      header;
    _.forOwn(response.headers, (value, key) => {
      if (key !== 'Content-Type') {
        if (value.$ref) {
          header = this.getRefObject(value.$ref);
          // header.name = value.$ref.split('/').slice(3)[0];
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

    return new sdk.Response({
      name: response.description,
      code: code === 'default' ? 500 : Number(code),
      header: responseHeaders,
      body: responseBodyWrapper.responseBody,
      originalRequest: originalRequest,
      _postman_previewlanguage: previewLanguage
    });
  },

  /**
   * @param {*} $ref of reference object
   * @returns {Object} reference object in components
   */
  getRefObject: function($ref) {
    var refObj, savedSchema;

    savedSchema = $ref.split('/').slice(2);
    if (savedSchema.length !== 2) {
      console.error(`ref ${$ref} not found.`);
      return null;
    }

    refObj = _.get(this.components, [savedSchema[0], savedSchema[1]]);
    if (!refObj) {
      console.error(`ref ${$ref} not found.`);
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
    if (authHelper.type === 'api-key') {
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
      pmBody.formHeaders.forEach((element) => {
        item.request.addHeader(element);
      });
    }

    // adding responses to request item
    if (operation.responses) {
      let thisOriginalRequest = {};
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
          // console.error('Exception thrown while trying to stringify url for item.request.url:', item.request.url,
          // 'Exception:', e);
          thisOriginalRequest.url = '';
        }
        try {
          thisOriginalRequest.header = item.request.headers.toJSON();
        }
        catch (e) {
          // console.error('Exception thrown while trying to stringify headers for item.request.headers:',
          // item.request.headers, 'Exception:', e);
          thisOriginalRequest.header = [];
        }
        try {
          thisOriginalRequest.body = (item.request.body ? item.request.body.toJSON() : {});
        }
        catch (e) {
          // console.error('Exception thrown while trying to json-ify body for item.request.body:', item.request.body,
          // 'Exception:', e);
          thisOriginalRequest.body = {};
        }
        item.responses.add(this.convertToPmResponse(swagResponse, code, thisOriginalRequest));
      });
    }

    return item;
  }
};

