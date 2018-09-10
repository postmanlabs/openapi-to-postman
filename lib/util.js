var sdk = require('postman-collection'),
  schemaFaker = require('json-schema-faker'),
  parse = require('./parse.js'),
  deref = require('./deref.js'),
  _ = require('lodash');

const URLENCODED = 'application/x-www-form-urlencoded',
  APP_JSON = 'application/json',
  APP_JS = 'application/javascript',
  APP_XML = 'application/xml',
  TEXT_XML = 'text/xml',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  FORM_DATA = 'multipart/form-data';

schemaFaker.option({
  requiredOnly: false,
  minLength: 4,
  maxLength: 4,
  minItems: 1,
  maxItems: 2
});

/**
 * Removes things that might make schemaFaker crash
* @param {*} oldSchema the schema to fake
* @param {*} components list of predefined components (with schemas)
 * @returns {object} fakedObject
 */
function safeSchemaFaker(oldSchema, components) {
  var prop,
    savedSchemaName,
    schema = deref.resolveRefs(oldSchema, components);
  if (schema.anyOf) {
    return safeSchemaFaker(schema.anyOf[0], components);
  }
  if (schema.$ref) {
    // points to an existing location
    // .split will return [#, components, schemas, schemaName]
    try {
      savedSchemaName = schema.$ref.split('/').slice(3)[0];
      if (components.schemas[savedSchemaName]) {
        return safeSchemaFaker(components.schemas[savedSchemaName], components);
      }
      return '';
    }
    catch (e) {
      // could not slice or fake reference
      return '';
    }
  }

  if (schema.properties) {
    // 1. If any property exists with format:binary (and type: string) schemaFaker crashes
    // we just delete based on format=binary
    for (prop in schema.properties) {
      if (schema.properties.hasOwnProperty(prop)) {
        if (schema.properties[prop].format === 'binary') {
          delete schema.properties[prop].format;
        }
      }
    }
  }

  return schemaFaker(schema);
}

/**
 * Class for the node of the tree containing the folders
 * @param {object} options - Contains details about the folder node
 * @returns {void}
 */
function Node (options) {
  this.name = options ? options.name : '/';
  this.requestCount = options ? options.requestCount : 0;
  this.type = options ? options.type : 'item';
  this.children = {}; // object of objects
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

  /**
   * Adds the neccessary server variables to the collection
   * @param {object} collection - POSTMAN Collection JSON object
   * @param {object} serverVariables - Object containing the server variables at the root/path-item level
   * @param {string} level - root / path-item level
   * @param {string} serverUrl - URL from the server object
   *
   * @returns {object} modified collection after the addition of the server variables
   */
  addCollectionVariables: function(collection, serverVariables, level, serverUrl = '') {
    var modifiedCollection = collection;
    if (serverVariables) {
      _.forOwn(serverVariables, (value, key) => {
        modifiedCollection.variables.add(new sdk.Variable({
          id: key,
          value: value.default || '',
          description: value.description + (value.enum || '')
        }));
      });
    }
    else {
      modifiedCollection.variables.add(new sdk.Variable({
        id: level,
        value: serverUrl,
        type: 'string'
      }));
    }

    return modifiedCollection;
  },

  /**
   * Parses an open api string as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The swagger 3.0.0 specification specified in either YAML or JSON
   * @returns {Object} - Contains the folder trie and the array of collection variables to be created
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
        // Could be a JSON as well
        try {
          openApiObj = parse.asJson(openApiSpec);
        }
        catch (jsonException) {
          // Its neither JSON nor YAML
          return {
            result: false,
            reason: 'Invalid format. Input must be in YAML or JSON format'
          };
        }
      }
    }

    // spec is a valid JSON
    // Validate the root level object
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
   * Generates a Trie like folder structure from the path object of the OPENAPI specification
   * @param {Object} spec - specification in json format
   * @returns {Object} - The final object consists of the tree structure and collection variables
   */
  generateTrieFromPaths: function (spec) {
    var paths = spec.paths,
      currentPath = '',
      currentPathObject = '',
      commonParams = '',
      collectionVariables = [],
      root = new Node({
        name: '/'
      }),
      method,
      operationItem,
      pathLevelServers = '',
      pathLength,
      currentPathRequestCount,
      currentNode,
      i,
      summary,
      path,
      xthis,
      // creating a root node for the trie (serves as the root dir)
      trie = new Trie(root);

    xthis = this;
    for (path in paths) {
      if (paths.hasOwnProperty(path)) {
        // decalring a variable to be in this loops context only
        currentPathObject = paths[path];
        // console.log("path object = ", currentPathObject);
        // the key should not be empty
        if (path[0] === '/') {
          path = path.substring(1);
        }

        currentPath = path.split('/');
        pathLength = currentPath.length;
        currentPathRequestCount = Object.keys(currentPathObject).length;
        currentNode = trie.root;

        // adding children for the nodes in the trie
        for (i = 0; i < pathLength; i++) {
          if (!currentNode.children[currentPath[i]]) {
            currentNode.addChildren(currentPath[i], new Node({
              name: currentPath[i],
              requestCount: 0,
              requests: [],
              children: {},
              type: 'item-group'
            }));
          }
          currentNode.children[currentPath[i]].requestCount += currentPathRequestCount;
          currentNode = currentNode.children[currentPath[i]];
        }

        // handling common parameters for all the methods in the current path item
        if (currentPathObject.hasOwnProperty('parameters')) {
          commonParams = currentPathObject.parameters;
          // console.log(' ' ,commonParams);
          delete currentPathObject.parameters;
        }

        // handling the server object at the path item level
        if (currentPathObject.hasOwnProperty('servers')) {
          pathLevelServers = currentPathObject.servers;
          delete currentPathObject.servers;
          if (pathLevelServers[0].hasOwnProperty('variables')) {
            collectionVariables.push(pathLevelServers[0].variables);
          }
        }


        for (method in currentPathObject) {
          if (currentPathObject.hasOwnProperty(method)) {
            operationItem = currentPathObject[method];
            operationItem.parameters = operationItem.parameters || commonParams;
            summary = operationItem.summary || operationItem.description;
            // extending the parameters array for each method with the common ones
            // for ease of accessing

            currentNode.addMethod({
              name: summary,
              id: operationItem[xthis.options.requestName],
              method: method,
              path: path,
              properties: operationItem,
              type: 'item',
              servers: pathLevelServers || undefined
            });
          }
        }
      }
    }

    return {
      tree: trie,
      variables: collectionVariables
    };
  },

  /**
   * Converts the path variable in a more accessible format
   * @param {string} type - Level at the tree root/path level
   * @param {Array<object>} pathVarArray - Array of path variables
   * @param {object} pathVariables - Object of path variables taken from the specification
   * @returns {Array<object>} returns array of variables
   */
  convertPathVariables: function(type, pathVarArray, pathVariables) {
    var variables = pathVarArray;
    // converting the base uri path variables if any
    if (type === 'root') {
      _.forOwn(pathVariables, (value, key) => {
        variables.push({
          key: key,
          value: '{{' + key + '}}',
          description: value.enum ? value.description + 'can be only one of' + value.enum.toString() : value.description
        });
      });
    }
    else {
      _.forEach(pathVariables, (variable) => {
        variables.push({
          key: variable.name,
          value: this.options.schemaFaker ? safeSchemaFaker(variable.schema || {}, this.components) : '',
          description: variable.description || ''
        });
      });
    }

    return variables;
  },

  /**
   * Helper function in order to handle query string with delimiters
   * @param {String} paramValue - name of the query parameter
   * @param {String} delimiter - the delimiter which is to be used
   * @returns {String} returns the query string with the delimiter at appropriate points
   */
  getQueryStringWithStyle: function(paramValue, delimiter) {
    var queryString,
      paramNameArray = Object.keys(paramValue),
      paramValueArray = Object.values(paramValue),
      queryParams = paramNameArray.map((value, index) => {
        if (!paramValueArray[index]) {
          return value;
        }
        return value + delimiter + paramValueArray[index];
      });
    queryString = queryParams.join(delimiter);
    return queryString;
  },

  convertChildToItemGroup: function(openapi, child) {
    var resource = child,
      itemGroup,
      subChild,
      item,
      i,
      requestCount;

    if (resource.type === 'item-group') {
      // the resource should be a folder
      itemGroup = new sdk.ItemGroup({
        name: resource.name
        // have to add auth here (first auth to be put in the tree)
      });

      for (subChild in resource.children) {
        if (resource.children.hasOwnProperty(subChild)) {
          itemGroup.items.add(
            this.convertChildToItemGroup(openapi, resource.children[subChild])
          );
        }
      }

      for (i = 0, requestCount = resource.requests.length; i < requestCount; i++) {
        itemGroup.items.add(
          this.convertChildToItemGroup(openapi, resource.requests[i])
        );
      }

      return itemGroup;
    }

    item = this.convertRequestToItem(openapi, resource);
    return item;
  },

  getAuthHelper: function(openapi, securitySet) {
    var securityDef,
      helper;

    if (!securitySet) {
      return {
        type: 'noauth'
      };
    }

    _.forEach(securitySet, (security) => {
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


  getResponseHeaders: function(contentTypes, responseHeaders) {
    var headerArray = [{
        key: 'Content-Type',
        value: contentTypes ? (contentTypes[0]) : TEXT_PLAIN
      }],
      header;

    if (!responseHeaders) { return headerArray; }

    _.forOwn(responseHeaders, (value, key) => {
      header = {
        key: key,
        value: this.options.schemaFaker ? safeSchemaFaker(value.schema || {}, this.components) : '',
        description: value.description || ''
      };
      headerArray.push(header);
    });
    return headerArray;
  },

  getResponseBody: function(openapi, contentObj) {
    var responseBody;
    if (!contentObj) {
      return '';
    }

    if (contentObj[APP_JSON]) {
      responseBody = this.getBodyData(openapi, contentObj[APP_JSON]);
    }
    else if (contentObj[APP_XML]) {
      responseBody = this.getBodyData(openapi, contentObj[APP_XML]);
    }
    else if (contentObj[APP_JS]) {
      responseBody = this.getBodyData(openapi, contentObj[APP_XML]);
    }
    else if (contentObj[TEXT_PLAIN]) {
      responseBody = this.getBodyData(openapi, contentObj[TEXT_PLAIN]);
    }

    return JSON.stringify(responseBody, null, 4);
  },

  // map for creating parameters specific for a request
  getParametersForPathItem: function(openapi, localParams) {
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

  getExampleData: function(openapi, exampleObj) {
    var example,
      exampleKey;

    if (exampleObj) {
      return {};
    }

    exampleKey = Object.keys(exampleObj)[0];
    example = exampleObj[exampleKey];

    return example;
  },

  getBodyData: function(openapi, bodyObj) {
    var bodyData = '';

    // This part is to remove format:binary from any string-type properties
    // will cause schemaFaker to crash if left untreated
    if (bodyObj.hasOwnProperty('schema')) {
      bodyData = this.options.schemaFaker ? safeSchemaFaker(bodyObj.schema || {}, this.components) : '';
    }
    else if (bodyObj.hasOwnProperty('examples')) {
      bodyData = this.getExampleData(openapi, bodyObj.examples);
      // take one of the examples as the body and not all
    }
    else if (bodyObj.hasOwnProperty('example')) {
      bodyData = bodyObj.example;
    }
    return bodyData;
  },

  addQueryParameters: function(requestObj, queryParameters) {
    var modifiedRequestObj = requestObj,
      modifiedUrl = requestObj.url.toString(),
      queryParams,
      paramNameArray,
      handleExplode = (explodeFlag, paramValue, paramName) => {
        if (explodeFlag) {
          paramNameArray = Array.from(Array(paramValue.length), () => { return paramName; });
          queryParams = paramNameArray.map((value, index) => { return (value + '=' + paramValue[index]); });
          modifiedUrl += queryParams.join('&');
        }
        else {
          modifiedUrl += paramName + '=' + paramValue.join(',');
        }
        return modifiedUrl;
      },
      paramValue;

    if (queryParameters === []) {
      return requestObj;
    }

    modifiedUrl += '?';
    _.forEach(queryParameters, (param) => {
      // check for existence of schema
      if (param.hasOwnProperty('schema')) {
        // fake data generated
        paramValue = this.options.schemaFaker ? safeSchemaFaker(param.schema, this.components) : '';
        paramType = param.schema.type;
        // checking the type of the query parameter
        if (paramType === 'array') {
          // which style is there ?
          if (param.style === 'form') {
            // check for the truthness of explode
            modifiedUrl = handleExplode(param.explode, paramValue, param.name);
          }
          else if (param.style === 'spaceDelimited') {
            // explode parameter doesn't really affect anything here
            modifiedUrl += param.name + '=' + paramValue.join('%20');
          }
          else if (param.style === 'pipeDelimited') {
            modifiedUrl += param.name + '=' + paramValue.join('|');
          }
          else if (param.style === 'deepObject') {
            modifiedUrl += _.map(paramValue, (pv) => {
              return (param.name + '[]=' + pv);
            }).join('&');
          }
          else {
            // if there is not style parameter we assume that it will be form by default;
            modifiedUrl += param.name + '=' + paramValue.join(',');
          }
        }
        else if (paramType === 'object') {
          // following similar checks as above
          if (param.hasOwnProperty('style')) {
            if (param.style === 'form') {
              if (param.explode) {
                // if explode is true
                paramNameArray = Object.keys(paramValue);
                queryParams = paramNameArray.map((value, index) => {
                  return (value + '=' + Object.values(paramValue)[index]);
                });
                modifiedUrl += queryParams.join('&');
              }
              else {
                modifiedUrl += this.getQueryStringWithStyle(paramValue, ',');
              }
            }
            else if (param.style === 'spaceDelimited') {
              modifiedUrl += this.getQueryStringWithStyle(paramValue, '%20');
            }
            else if (param.style === 'pipeDelimited') {
              modifiedUrl += this.getQueryStringWithStyle(paramValue, '|');
            }
            else if (param.style === 'deepObject') {
              _.forOwn(paramValue, (value, key) => {
                modifiedUrl += param.name + '[' + key + ']=' + value + '&';
              });
              modifiedUrl = modifiedUrl.slice(0, -1);
            }
          }
          else {
            modifiedUrl += param.name + '=' + (paramValue);
          }
        }
        else {
          modifiedUrl += param.name + '=' + (paramValue);
        }
      }
      else {
        // since no schema present add the parameter with no value
        modifiedUrl += param.name + '=';
      }
      modifiedUrl += '&';
    });
    modifiedUrl = modifiedUrl.slice(0, -1);
    // updating the request url
    modifiedRequestObj.url = new sdk.Url(modifiedUrl);
    return modifiedRequestObj;
  },

  addHeaders: function(postmanItemObj, headers) {
    var modifiedPostmanItemObj = postmanItemObj,
      fakeData,
      reqHeader;
    if (headers === []) {
      return modifedPostmanItemObj;
    }

    _.forEach(headers, (header) => {
      if (header.hasOwnProperty('schema')) {
        fakeData = options.schemaFaker ? safeSchemaFaker(header.schema || {}, this.components) : '';
      }
      else {
        fakeData = '';
      }

      reqHeader = new sdk.Header({
        key: header.name,
        value: fakeData
      });
      reqHeader.description = header.description;
      modifiedPostmanItemObj.request.addHeader(reqHeader);
    });

    return modifiedPostmanItemObj;
  },

  addRequestBody: function(postmanItemObj, requestBody, openapi) {
    var modifiedPostmanItemObj = postmanItemObj,
      contentObj, // content is required
      bodyData,
      param,
      paramArray = [],
      updateOptions = {},
      reqBody = new sdk.RequestBody(),
      rDataMode;

    if (!requestBody) {
      return postmanItemObj;
    }

    // how do I support multiple content types
    contentObj = requestBody.content;

    // handling for the urlencoded media type
    if (contentObj.hasOwnProperty(URLENCODED)) {
      rDataMode = 'urlencoded';
      bodyData = this.getBodyData(openapi, contentObj[URLENCODED]);
      // create query parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {
        if (typeof value === 'object') { value = JSON.stringify(value); }

        param = new sdk.QueryParam({
          key: key,
          value: value
        });
        paramArray.push(param);
      });
      updateOptions = {
        mode: rDataMode,
        urlencoded: paramArray
      };

      // add a content type header for each media type for the request body
      modifiedPostmanItemObj.request.addHeader(new sdk.Header({
        key: 'Content-Type',
        value: URLENCODED
      }));

      // update the request body with the options
      reqBody.update(updateOptions);
    }
    else if (contentObj.hasOwnProperty(FORM_DATA)) {
      rDataMode = 'formdata';
      bodyData = this.getBodyData(openapi, contentObj[FORM_DATA]);
      // create the form parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {
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
      modifiedPostmanItemObj.request.addHeader(new sdk.Header({
        key: 'Content-Type',
        value: FORM_DATA
      }));
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

      bodyData = this.getBodyData(openapi, contentObj[bodyType]);

      updateOptions = {
        mode: rDataMode,
        raw: JSON.stringify(bodyData, null, 4)
      };

      modifiedPostmanItemObj.request.addHeader(new sdk.Header({
        key: 'Content-Type',
        value: bodyType
      }));

      reqBody.update(updateOptions);
    }

    modifiedPostmanItemObj.request.body = reqBody;
    return modifiedPostmanItemObj;
  },

  addResponse: function(postmanItemObj, responses, openapi) {
    var modifedPostmanItemObj = postmanItemObj,
      response;

    if (!responses) {
      return postmanItemObj;
    }

    _.forOwn(responses, (value, code) => {
      response = new sdk.Response({
        name: code.toString(),
        code: code === 'default' ? 500 : Number(code),
        header: this.getResponseHeaders(Object.keys(value.content || {}), value.headers),
        body: this.getResponseBody(openapi, value.content)
      });
      modifedPostmanItemObj.responses.add(response);
    });

    return modifedPostmanItemObj;
  },

  // function to convert an openapi path item to postman item
  convertRequestToItem: function(openapi, operationItem) {
    var reqName,
      itemName = operationItem.id,
      pathVariables = openapi.baseUrlVariables,
      reqBody = operationItem.properties.requestBody,
      itemParams = operationItem.properties.parameters,
      reqParams = this.getParametersForPathItem(openapi, itemParams),
      baseUrl = openapi.baseUrl,
      pathVarArray,
      authHelper,
      item,
      serverObj,
      displayUrl,
      reqUrl = '/' + operationItem.path;

    // handling path templating in request url if any
    reqUrl = reqUrl.replace(/{/g, ':').replace(/}/g, '');

    // accounting for the overriding of the root level servers object if present at the path level
    if (operationItem.hasOwnProperty('servers') && operationItem.servers) {
      serverObj = operationItem.servers[0];
      baseUrl = serverObj.url.replace(/{/g, ':').replace(/}/g, '');
      pathVariables = serverObj.variables;
    }
    else {
      baseUrl += reqUrl;
      if (pathVariables) {
        displayUrl = baseUrl;
      }
      else {
        displayUrl = '{{base-url}}' + reqUrl;
      }
    }

    pathVarArray = this.convertPathVariables('root', [], pathVariables);
    reqName = operationItem.id;

    // handling authentication here (for http type only)
    authHelper = this.getAuthHelper(openapi, operationItem.properties.security);

    // creating the request object
    item = new sdk.Item({
      name: itemName,
      request: {
        description: operationItem.properties.description,
        url: displayUrl || baseUrl,
        name: reqName,
        method: operationItem.method.toUpperCase()
      }
    });

    // using the auth helper
    if (authHelper.type === 'api-key') {
      if (authHelper.properties.in === 'header') {
        item = this.addHeaders(item, [authHelper.properties]);
        item.request.auth = {
          type: 'noauth'
        };
      }
      else if (authHelper.properties.in === 'query') {
        item.request = this.addQueryParameters(item.request, [authHelper.properties]);
        item.request.auth = {
          type: 'noauth'
        };
      }
    }
    else {
      item.request.auth = authHelper;
    }

    // console.log("path params = ", reqParams.path, pathVarArray)

    item.request = this.addQueryParameters(item.request, reqParams.query);

    item.request.url.variables = this.convertPathVariables('method', pathVarArray, reqParams.path);

    item = this.addHeaders(item, reqParams.header);

    item = this.addRequestBody(item, reqBody, openapi);

    item = this.addResponse(item, operationItem.properties.responses, openapi);

    return item;
  }
};

