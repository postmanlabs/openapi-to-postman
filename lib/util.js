var sdk = require('postman-collection'),  
    schemaFaker = require('json-schema-faker'),
    parse = require('./parse.js'),
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
  requiredOnly: false
});
      
function Node (options) {
  this.name = options ? options.name : '/';
  this.requestCount = options ? options.requestCount : 0;
  this.type = options ? options.type : 'item';  
  this.children = {};   // object of objects
  this.requests = options ? options.requests : [];   // request will be an array of objects

  this.addChildren = function (child, value){
    this.children[child] = value;
  }
  
  this.addMethod = function (method){
    this.requests.push(method);
  }
}

class Trie{
  constructor(node){
    this.root = node;
  }
}

module.exports = {

  /**
   * Adds the neccessary server variables to the collection
   */
  addCollectionVariables: function(collection, serverVariables,level, serverUrl = ''){
    var modifiedCollection = collection;
    if(serverVariables){
      _.forOwn(serverVariables, (value, key) => {
          modifiedCollection.variables.add(new sdk.Variable({
            id: key,
            value: value.default || '',
            description: value.description + (value.enum || ''),
          }));
      });
    } else {
      modifiedCollection.variables.add(new sdk.Variable({
        id: level,
        value: serverUrl,
        type: 'string',
      }));
    }

    return modifiedCollection;
  },

  /**
   * Parses an open api string as a YAML or JSON
   */ 
  parseSpec: function (openApiSpec){
    var openApiObj = openApiSpec,
        rootValidation;
    // If the open api specification is a string could be YAML or JSON
    if(typeof openApiSpec == 'string'){ 
      try{
        openApiObj = parse.asYaml(openApiSpec);
      }
      catch(yamlException) {
        // Could be a JSON as well 
        try{
          openApiObj = parse.asJson(openApiSpec);
        }
        catch(jsonException) {
          // Its neither JSON nor YAML
          return {
            result: false,
            reason: 'Invalid format. Input must be in YAML or JSON format'
          }
        }
      }
    }

    // spec is a valid JSON
    // Validate the root level object
    rootValidation = parse.validateRoot(openApiObj);
    
    if(!rootValidation.result){
      return {
        result: false,
        reason: rootValidation.reason,
      }
    }

    // Valid openapi root object
    return {
      result: true,
      openapi: rootValidation.openapi,
    }
  },

  generateTrieFromPaths: function (spec){
    var paths = spec.paths,
        pathStrings = Object.keys(paths),
        currentPath,
        currentPathObject,
        commonParams,
        methodParams,
        collectionVariables = [],
        validMethodNames = ['get', 'post', 'put', 'delete', 'patch', 'option', 'head', 'trace'],
        root = new Node({
          name: '/',
        }),
        //creating a root node for the trie (serves as the root dir)
        trie = new Trie(root);
      
    for(path in paths){
      
      // decalring a variable to be in this loops context only
      let pathLevelServers;

      currentPathObject = paths[path];
      // console.log("path object = ", currentPathObject);

      // the key should not be empty
      if(path[0] == '/'){
        path = path.substring(1);
      }

      currentPath = path.split('/');
      pathLength = currentPath.length;
      currentPathRequestCount = Object.keys(currentPathObject).length;
          
			currentNode = trie.root;
      
      // adding children for the nodes in the trie
      for(var i = 0; i < pathLength;i++){
        if(!currentNode.children[currentPath[i]]){
          currentNode.addChildren(currentPath[i], new Node({
              name: currentPath[i],
              requestCount: 0,
              requests: [],
              children: {},
              type: 'item-group',
          }));
        }
        currentNode.children[currentPath[i]].requestCount += currentPathRequestCount;
        currentNode = currentNode.children[currentPath[i]];
      }

      //handling common parameters for all the methods in the current path item
      if(currentPathObject.hasOwnProperty('parameters')){
        commonParams = currentPathObject.parameters;
        // console.log(' ' ,commonParams);
        delete currentPathObject.parameters;
      }

      //handling the server object at the path item level
      if(currentPathObject.hasOwnProperty('servers')){
        pathLevelServers  = currentPathObject.servers;
        if(pathLevelServers[0].hasOwnProperty('variables')){
          collectionVariables.push(pathLevelServers[0].variables);
        }
      }


      for(method in currentPathObject){
        // console.log(method);
        var summary = '';

        if(currentPathObject[method].hasOwnProperty('summary')){
          summary = currentPathObject[method].summary;
        } else {
          summary = currentPathObject[method].description;
        }
        
        // extending the parameters array for each method with the common ones
        // for ease of accessing
        if(commonParams && commonParams.length > 0){
          if(!currentPathObject[method].hasOwnProperty('parameters'))
            currentPathObject[method].parameters  = commonParams;
          // if does should I extend ? (don't know yet)
        }

        if(validMethodNames.includes(method)){
          currentNode.addMethod({
            name: summary,
            id: currentPathObject[method].operationId,
					  method: method,
					  path: path,
					  properties: currentPathObject[method],
            type: 'item',
            servers: pathLevelServers || undefined,
          });
        } 
      }
    }

    return {
      tree: trie,
      variables: collectionVariables,
    };
  },

  // takes in a string url or a server item object
  convertPathVariables: function(type, pathVarArray, pathVariables){

    // console.log("here i am",pathVariables);

    var variables = pathVarArray;

    //converting the base uri path variables if any
    if(type == 'root'){
      // console.log("base variables", pathVariables);
      _.forOwn(pathVariables, (value, key) => {
        variables.push({
          key: key,
          value: '{{' + key + '}}',
          description: value.enum ? value.description + 'can be only one of' + value.enum.toString() : value.description,
        })
      });
    } else {
      // console.log("")
      _.forEach(pathVariables, (variable) => {
        variables.push({
          key: variable.name,
          value: schemaFaker(variable.schema || {}),
          description: variable.description || '',
        });
      });
    }

    return variables;
  },

  convertChildToItemGroup: function(openapi, child){
    var resource = child,
        itemGroup,
        subChild,
        item,
        singleRequest;
        // resourceUri = new sdk.Url(parentUri + '/' + resource.path)
    
    if(resource.type == 'item-group'){
      // the resource should be a folder
      if(resource.requestCount > 1){
        // definetive conversion
        itemGroup = new sdk.ItemGroup({
          name: resource.name,
          // have to add auth here (first auth to be put in the tree)
        });
        
        for(subChild in resource.children) {
          itemGroup.items.add(
            this.convertChildToItemGroup(openapi, resource.children[subChild])
          );
        }
        
        for(var i = 0, requestCount = resource.requests.length; i < requestCount;i++){
          itemGroup.items.add(
            this.convertChildToItemGroup(openapi, resource.requests[i])
          );
        }

        return itemGroup;
      }
      else {
        // single request exists in the folder
        // pull it out from there
        singleRequest = resource.requests[0];
        return this.convertRequestToItem(openapi, singleRequest);
      }
    }

    item = this.convertRequestToItem(openapi, resource);
    return item;
  },

  getAuthHelper: function(openapi, securitySet){
    var securityDef,
        helper;

    if(!securitySet){
      return {
        type: 'noauth'
      };
    }

    _.forEach(securitySet, (security) => {
      securityDef = openapi.securityDefs[Object.keys(security)[0]];
      if(securityDef.type == 'http'){
        helper =  {  
          type: securityDef.scheme,
        };
        return false;
      } else if(securityDef.type == 'oauth2') {
        helper =  {
          type: 'oauth2',
        };
        return false;
      } else if(securityDef.type == 'apiKey'){
        helper =  {
          type: 'api-key',
          properties: securityDef,
        };
        return false;
      }
    });
    return helper;
  },


  getResponseHeaders: function(contentTypes, responseHeaders){
    var headerArray = [{
            key: 'Content-Type',
            value: contentTypes ? (contentTypes[0]) : TEXT_PLAIN,
         }],
        header;

    if(!responseHeaders)
      return headerArray;
  
    _.forOwn(responseHeaders, (value, key) => {
      header = {
        key: key,
        value: schemaFaker(value.schema || {}),
        description: value.description || '',
      }
      headerArray.push(header);
    });
    return headerArray;
  },

  getResponseBody: function(openapi, contentObj){
    var responseBody;
    if(!contentObj){
      return "";
    }

    if(contentObj[APP_JSON]){
      responseBody = this.getBodyData(openapi, contentObj[APP_JSON]);
    } else if(contentObj[APP_XML]){
      responseBody = this.getBodyData(openapi, contentObj[APP_XML]);
    } else if(contentObj[APP_JS]){
      responseBody = this.getBodyData(openapi, contentObj[APP_XML]);
    } else if(contentObj[TEXT_PLAIN]){
      responseBody = this.getBodyData(openapi, contentObj[TEXT_PLAIN]);
    }

    return JSON.stringify(responseBody, null, 4);
  },

  // map for creating parameters specific for a request
  getParametersForPathItem: function(openapi, localParams){
    var tempParam,
        params = {
          query: [],
          header: [],
          path: [],
        };
    
    _.forEach(localParams, (param) => {
        tempParam = param;

        if(tempParam.in == 'query'){
          params.query.push(tempParam);
        } else if(tempParam.in == 'header'){
          params.header.push(tempParam);
        } else if(tempParam.in == 'path'){
          params.path.push(tempParam);
        }
    });

    return params;
  },

  getExampleData: function(openapi, exampleObj){
    var exampleData,
        example,
        exampleKey;

    if(exampleObj){
      return {};
    }

    exampleKey = Object.keys(exampleObj)[0];
    example = exampleObj[exampleKey];

    return example;
  },

  getBodyData: function(openapi, bodyObj){
    var bodyData = '';
    if(bodyObj.hasOwnProperty('schema')) {
      bodyData = schemaFaker(bodyObj.schema || {});
    } else if(bodyObj.hasOwnProperty('examples')) {
      bodyData = this.getExampleData(openapi, bodyObj.examples);
      // take one of the examples as the body and not all
    } else if(bodyObj.hasOwnProperty('example')){
      bodyData = bodyObj.example;
    }
    return bodyData;
  },

  addQueryParameters: function(requestObj, queryParameters){
    var modifiedRequestObj = requestObj,
        modifiedUrl = requestObj.url.toString(),
        queryParam,
        paramValue;

    if(queryParameters == []){
      return requestObj;
    }

    // console.log("modified url => ", modifiedUrl);

    modifiedUrl += '?'
    _.forEach(queryParameters, (param) => {
        // check for existence of schema
        if(param.hasOwnProperty('schema')){
          paramValue = schemaFaker(param.schema);  // fake data generated
          paramType = param.schema.type;
          // checking the type of the query parameter
          if(paramType == 'array'){
            // check for the existence of the style property
            if(param.hasOwnProperty('style')){
              // which style is there ?
              if(param.style == 'form'){
                // check for the existence of explode property
                if(param.hasOwnProperty('explode')){
                  // default is true for form so must be false here
                  modifiedUrl += param.name + '=';
                  _.forEach(paramValue, (value) => {
                    modifiedUrl += value + ',';
                  });
                  modifiedUrl = modifiedUrl.slice(0,-1);
                } else {
                  _.forEach(paramValue, (value) => {
                    modifiedUrl += param.name + '=' + value + '&';
                  });
                  modifiedUrl = modifiedUrl.slice(0, -1);
                }
              } else if(param.style == 'spaceDelimited'){
                // explode parameter doesn't really affect anything here
                  modifiedUrl += param.name + '=';
                  _.forEach(paramValue, (value) => {
                    modifiedUrl += value + '%20';
                  });
                  modifiedUrl = modifiedUrl.slice(0, -3);
              } else if(param.style == 'pipeDelimited'){
                  modifiedUrl += param.name + '=';
                  _.forEach(paramValue, (value) => {
                    modifiedUrl += value + '|';
                  });
                  modifiedUrl = modifiedUrl.slice(0, -1);
              } 
            } else {
              // if there is not style parameter we assume that it will be form by default;
              queryParam = new sdk.QueryParam({
                key: param.name,
                value: schemaFaker(param.schema),
              });
              queryParam.description = param.description;
              modifiedRequestObj.addQueryParams(queryParam);
            }
          } else if(paramType == 'object'){
            // following similar checks as above
            if(param.hasOwnProperty('style')){
              if(param.style == 'form'){
                if(param.hasOwnProperty('explode')){
                  // false if present
                  modifiedUrl += param.name + '=';
                  _.forOwn(paramValue, (value, key) => {
                    modifiedUrl += key + ',' + value + ',';
                  });
                  modifiedUrl = modifiedUrl.slice(0, -1);
                } else {
                  // true by default 
                  _.forOwn(paramValue, (value, key) => {
                    modifiedUrl += key + '=' + value + '&';
                  });
                  modifiedUrl = modifiedUrl.slice(0, -1); 
                }
              } else if (param.style == 'spaceDelimited'){
                _.forOwn(paramValue, (value, key) => {
                  modifiedUrl += key + '%20' + value + '%20';
                });
                modifiedUrl = modifiedUrl.slice(0, -3);
                
              } else if (param.style == 'pipeDelimited'){
                _.forOwn(paramValue, (value, key) => {
                  modifiedUrl += key + '|' + value + '|';
                });
                modifiedUrl = modifiedUrl.slice(0, -1);
               
              } else if (param.style == 'deepObject'){
                _.forOwn(paramValue, (value, key) => {
                  modifiedUrl += param.name + '[' + key + ']' + '=' + value + '&';
                });
                modifiedUrl = modifiedUrl.slice(0, -1);
              }
            } else {
              modifiedUrl += param.name + '=' + paramValue;
            }
          } else {
            // for all the primitive types 
            modifiedUrl += param.name + '=' + paramValue;
          }
        } else {
          // since schema was not present (it wasnt a required property)
          // using the max info I can from the spec

          modifiedUrl += param.name + '=';
        }

        modifiedUrl += '&'
    });

    modifiedUrl = modifiedUrl.slice(0, -1);

    // updating the request url
    modifiedRequestObj.url = new sdk.Url(modifiedUrl);
    
    return modifiedRequestObj;
  },

  addHeaders: function(postmanItemObj, headers){
    var modifiedPostmanItemObj = postmanItemObj,
        fakeData,
        reqHeader,
        description;
    if(headers == []){
      return modifedPostmanItemObj;
    }

    _.forEach(headers, (header) => {
        if(header.hasOwnProperty('schema')){
          fakeData = schemaFaker(header.schema || {});
        } else {
          fakeData = '';
        }

        reqHeader = new sdk.Header({
          key: header.name,
          value: fakeData,
        });
        reqHeader.description = header.description;
        modifiedPostmanItemObj.request.addHeader(reqHeader);
    });

    return modifiedPostmanItemObj;
  },

  addRequestBody: function(postmanItemObj, requestBody, openapi){
    var modifiedPostmanItemObj = postmanItemObj, 
        contentObj, // content is required
        bodyData,
        param,
        paramArray = [],
        updateOptions = {},
        reqBody = new sdk.RequestBody(),
        rDataMode;
    
    if(!requestBody){
      return postmanItemObj;
    }

    // how do I support multiple content types 
    contentObj = requestBody.content

    // handling for the urlencoded media type
    if(contentObj.hasOwnProperty(URLENCODED)){
      rDataMode = 'urlencoded';
      bodyData = this.getBodyData(openapi, contentObj[URLENCODED]);
      // create query parameters and add it to the request body object
      _.forOwn(bodyData, (value, key) => {
        if(typeof value == 'object')
          value = JSON.stringify(value);

        param = new sdk.QueryParam({
          key: key,
          value: value,
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
        value: URLENCODED,
      }));

      // update the request body with the options
      reqBody.update(updateOptions);
    } else if (contentObj.hasOwnProperty(FORM_DATA)){
        rDataMode = 'formdata';
        bodyData = this.getBodyData(openapi, contentObj[FORM_DATA]);
        // create the form parameters and add it to the request body object
        _.forOwn(bodyData, (value, key) => {
          if(typeof value == 'object')
            value = JSON.stringify(value);

          param = new sdk.FormParam({
            key: key,
            value: value,
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
          value: FORM_DATA,
        }));
        // update the request body
        reqBody.update(updateOptions);
    } else {
      rDataMode = 'raw';
      let bodyType;

      // checking for all possible raw types 
      if(contentObj.hasOwnProperty(APP_JS))
        bodyType = APP_JS;
      else if(contentObj.hasOwnProperty(APP_JSON))
        bodyType = APP_JSON;
      else if(contentObj.hasOwnProperty(TEXT_HTML))
        bodyType = TEXT_HTML;
      else if(contentObj.hasOwnProperty(TEXT_PLAIN))
        bodyType = TEXT_PLAIN;
      else if(contentObj.hasOwnProperty(TEXT_XML))
        bodyType = TEXT_XML;

      bodyData = this.getBodyData(openapi, contentObj[bodyType]);

      updateOptions = {
        mode: rDataMode,
        raw: JSON.stringify(bodyData, null, 4),
      }

      modifiedPostmanItemObj.request.addHeader(new sdk.Header({
        key: 'Content-Type',
        value: bodyType,
      }));

      reqBody.update(updateOptions);
    }

    modifiedPostmanItemObj.request.body = reqBody;
    return modifiedPostmanItemObj;
  },

  addResponse: function(postmanItemObj, responses, openapi){
    var modifedPostmanItemObj = postmanItemObj,
        response;
       
    if(!responses){
      return responseDefArray;
    }

    _.forOwn(responses, (value, code) => {
      response = new sdk.Response({
        name: code.toString(),
        code: code == 'default' ? 500 : Number(code),
        header: this.getResponseHeaders(Object.keys(value.content || {}),value.headers),
        body: this.getResponseBody(openapi, value.content),
      });
      modifedPostmanItemObj.responses.add(response);
    });

    return modifedPostmanItemObj;
  },

  // function to convert an openapi path item to postman item
  convertRequestToItem: function(openapi, operationItem){
    // console.log(openapi.components)


    var reqUrl,
        reqName,
        itemName = operationItem.id,
        authHelpers,
        pathVariables = openapi.baseUrlVariables,
        baseParams = openapi.components.parameters,
        reqBody = operationItem.properties.requestBody,
        itemParams = operationItem.properties.parameters,
        reqParams = this.getParametersForPathItem(openapi, itemParams),
        baseUrl = openapi.baseUrl,
        pathVarArray,
        serverObj,
        displayUrl,
    
    
   
    reqUrl = '/' + operationItem.path;
   
    // handling path templating in request url if any
    reqUrl = reqUrl.replace(/{/g, ':').replace(/}/g, '');
    
    // accounting for the overriding of the root level servers object if present at the path level
    if(operationItem.hasOwnProperty('servers') && operationItem.servers){
      serverObj = operationItem.servers[0];
      baseUrl = serverObj.url.replace(/{/g, ':').replace(/}/g, '');;
      pathVariables = serverObj.variables;
    } else {
      baseUrl = baseUrl + reqUrl;
      displayUrl = '{{base-url}}' + reqUrl;
    }
    
    pathVarArray = this.convertPathVariables('root', [], pathVariables);
    reqName = operationItem.id;

    // handling authentication here (for http type only)
    authHelper = this.getAuthHelper(openapi, operationItem.properties.security);

    // creating the request object
    item = new sdk.Item({
      name: itemName,
      request: {
        url: displayUrl || baseUrl,
        name: reqName,
        method: operationItem.method.toUpperCase(),
      }
    });

    // using the auth helper
    if(authHelper.type == 'api-key'){
      if(authHelper.properties.in == 'header'){
        item = this.addHeaders(item, [authHelper.properties]);
        item.request.auth = {
          type: 'noauth'
        }
      } else if(authHelper.properties.in == 'query'){
        item.request = this.addQueryParameters(item.request, [authHelper.properties]);
        item.request.auth = {
          type: 'noauth'
        }
      }
    } else {
      item.request.auth = authHelper;
    }

    // console.log("path params = ", reqParams.path, pathVarArray)

    item.request = this.addQueryParameters(item.request, reqParams.query); 

    // item.request.url.variable = this.convertPathVariables('method', pathVarArray, reqParams.path);
    item.request.url.variables = this.convertPathVariables('method', pathVarArray, reqParams.path);

    item = this.addHeaders(item, reqParams.header); 

    item = this.addRequestBody(item, reqBody, openapi);

    item = this.addResponse(item, operationItem.properties.responses, openapi);

    return item;
  }
}

