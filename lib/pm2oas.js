const _ = require('lodash'),
  yaml = require('yaml'),
  convertToJsonSchema = require('./toJsonSchema'),
  mergeJsonSchemas = require('./mergeJsonSchemas'),
  compareJsonSchemas = require('./compareJsonSchemas'),
  utils = require('./schemaUtils'),
  ID_FORMATS = [
    {
      schema: { type: 'string', format: 'uuid' },
      regex: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/g
    },
    {
      schema: { type: 'integer' },
      regex: /^[-+]?\d+$/g
    }
  ],
  EXCLUDED_HEADERS = [
    'content-type',
    'accept',
    'authorization'
  ],
  JSON_CONTENT_TYPES = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-dapp ata'
  ],
  DEFAULT_SPEC_NAME = 'OpenAPI Specification (Generated from Postman Collection)',
  DEFAULT_SPEC_DESCRIPTION = 'This OpenAPI Specification was generated from Postman Collection using ' +
    '[openapi-to-postman](https://github.com/postmanlabs/openapi-to-postman)';

/**
 * Checks if path segment value is postman variable or not
 *
 * @param {*} value - Value to check for
 * @returns {Boolean} postman variable or not
 */
function isPmVariable (value) {
  // collection/environment variables are in format - {{var}}
  return _.isString(value) && (_.startsWith(value, ':') || (_.startsWith(value, '{{') && _.endsWith(value, '}}')));
}

/**
 * Fetches description in string format from Collection SDK defined description object
 *
 * @param {*} description - Collection SDK description
 * @returns {*} - Actual description in string format or undefined if not present
 */
function getDescription (description) {
  if (_.isString(description)) {
    return description;
  }
  else if (_.isObject(description)) {
    return description.content || undefined;
  }
  return undefined;
}

/**
 * Finds variable matches from request path.
 * This variables can be path variables and generally understood id formats like uuid or integer.
 *
 * @param {Array} path - Path split into array
 * @param {Array} pathVars - Path variables defined under "request.url.variables"
 * @returns {Array} variable matches and some meta info regarding matches
 */
function findVariablesFromPath (path, pathVars) {
  let varMatches = [];
  _.forEach(path, (segment, index) => {
    // find if path segment is pm variable (collection/env/path-var)
    if (isPmVariable(segment)) {
      let key = _.startsWith(segment, ':') ? segment.slice(1) : segment.slice(2, -2),
        value = _.startsWith(segment, ':') ? _.find(pathVars, (pathVar) => { return pathVar.key === key; }).value : '';

      varMatches.push({ key, value, index });
    }
    // find if path segment is one of defined ID formats (e.g. UUID)
    else {
      // TODO: support path param serialization
      _.forEach(ID_FORMATS, (format) => {
        let match = format.regex.exec(segment),
          key = index ? path[index - 1] + 'Id' : 'id' + index;

        if (match) {
          varMatches.push({
            key,
            value: segment,
            index,
            schema: format.schema
          });
          // break once match found
          return false;
        }
      });
    }
  });
  return varMatches;
}

/**
 * Creates collection (array) from a requestGroup of given part.
 * (e.g. path variables under all requests under same group)
 *
 * @param {Array} reqGroup - Request group
 * @param {String} partPath - JSON path notation of property to be collected
 * @returns {Array} - Collected parts
 */
function getAllPartFromReqGroup (reqGroup, partPath) {
  let allReqPart = [];

  _.forEach(reqGroup, (req) => {
    allReqPart = _.concat(allReqPart, _.get(req, partPath, []));
  });
  return allReqPart;
}

/**
 * Creates collection (array) of all request bodies present in requestGroup.
 *
 * @param {Array} reqGroup - Request group
 * @returns {Array} - Collected request bodies
 */
function getAllReqBodies (reqGroup) {
  let bodies = [];

  _.forEach(reqGroup, (req) => {
    let body = _.get(req, 'request.request.body');

    body && bodies.push(body);
  });
  return bodies;
}

/**
 * Parses value provided to corresponding format.
 * Used for parsing string/null value present in headers, query params or path variables
 *
 * @param {*} value - Value to be parsed
 * @returns {*} - parsed value
 */
function parseParamValue (value) {
  let parsedValue;

  // TODO: deserialization strategy
  try {
    parsedValue = JSON.parse(value);
  }
  catch (e) {
    parsedValue = value;
  }
  return parsedValue;
}

/**
 * Transforms examples array to valid OAS examples object.
 * transformed example object will have "exampleX" (X is number) as key and value as example.
 *
 * @param {Array} examplesArr - Array of OAS example objects
 * @returns {Object} - Transformed examples object
 */
function transformToExamplesObject (examplesArr) {
  // TODO: uniq examples with no duplicate data
  let transformedExamples = {};
  _.forEach(examplesArr, (example, index) => {
    transformedExamples['Example' + (index + 1)] = {
      value: example
    };
  });
  return transformedExamples;
}

/**
 * Finds related endpoints for given endpoint from all endpoints defined in collection
 *
 * @param {String} endpoint - target endpoint
 * @param {Array} allEndpoints - All endpoints defined in collection
 * @returns {Array} - related endpoints
 */
function getRelatedEndpoints (endpoint, allEndpoints) {
  let path = endpoint.slice(endpoint.indexOf(' ') + 1).split('/'),
    pathArr = _.split(path, '/'),
    lastSegment = _.last(pathArr),
    relatedEndpoints = [];

  _.forEach(allEndpoints, (currEndpoint) => {
    let currPath = currEndpoint.slice(currEndpoint.indexOf(' ') + 1).split('/');
    if (currPath === path) {
      relatedEndpoints.push(currEndpoint);
    }
    else if (lastSegment === '*' && _.startsWith(path, currPath)) {
      relatedEndpoints.push(currEndpoint);
    }
    else if (lastSegment !== '*' && _.startsWith(currPath, path)) {
      relatedEndpoints.push(currEndpoint);
    }
  });
  return relatedEndpoints;
}

/**
 * Merges common schema and defines schema under components and includes them as $ref
 *
 * @param {*} schema1 - first schema to be merged
 * @param {*} schema2 - second schema to be merged
 * @param {*} schemaCount - count of schemas present under component
 * @param {*} components - OAS components object
 * @returns {Object} - schema after common component merged
 */
function mergeCommonComponents (schema1, schema2, schemaCount, components) {
  let result = false,
    resolvedSchema1 = schema1,
    resolvedSchema2 = schema2,
    mergedSchemas = {};

  if (_.isEmpty(schema1) || _.isEmpty(schema2)) {
    return mergedSchemas;
  }
  if (schema1.$ref && schema2.$ref) {
    return mergedSchemas;
  }

  schema1.$ref && (resolvedSchema1 = utils.getRefObject(schema1.$ref, components));
  schema2.$ref && (resolvedSchema2 = utils.getRefObject(schema2.$ref, components));

  result = compareJsonSchemas(resolvedSchema1, resolvedSchema2);
  if (!result) { return mergedSchemas; }

  if (schema1.$ref) {
    mergedSchemas = { schema2: { $ref: schema1.$ref } };
  }
  else if (schema2.$ref) {
    mergedSchemas = { schema1: { $ref: schema2.$ref } };
  }
  else {
    let pathToComponent = 'components.schemas.schema' + schemaCount,
      jsonPathToComponent = '#/components/schemas/schema' + schemaCount;

    _.set(components, pathToComponent, schema1);
    mergedSchemas = { schema1: { $ref: jsonPathToComponent }, schema2: { $ref: jsonPathToComponent } };
  }
  return mergedSchemas;
}

/**
 * Generates OAS security object from on item/request auth
 *
 * @param {*} reqAuth - Auth defined under collection item/request
 * @returns {*} - OAS securityn object
 */
function authHelper (reqAuth) {
  let oasAuth;

  if (!_.isObject(reqAuth)) {
    return null;
  }

  switch (reqAuth.type) {
    case 'apikey':
      oasAuth = { type: 'apiKey' };

      if (_.isArray(reqAuth.apikey)) {
        let apiKeyLocation = _.find(reqAuth.apikey, (keyValPair) => { return keyValPair.key === 'in'; }),
          apiKeyName = _.find(reqAuth.apikey, (keyValPair) => { return keyValPair.key === 'key'; });

        apiKeyLocation && (oasAuth.in = apiKeyLocation.value);
        apiKeyName && (oasAuth.name = apiKeyLocation.value);
      }
      break;
    case 'basic':
    case 'bearer':
    case 'digest':
      oasAuth = { type: 'http', scheme: reqAuth.type };
      break;
    case 'oauth':
    case 'oauth1':
      oasAuth = { type: 'http', scheme: 'oauth' };
      break;
    case 'oauth2':
      oasAuth = { type: 'oauth2' };
      break;
    default:
      oasAuth = null;
      break;
  }
  return oasAuth;
}

/**
 * Finds common path among all given paths
 *
 * @param {Array} paths - Paths (Array of strings)
 * @returns {String} - common path
 */
function getCommonPath (paths) {
  let commonPathLen;

  if (paths.length < 1) {
    return '';
  }
  if (paths.length < 2) {
    return paths[0];
  }

  commonPathLen = _.min(_.map(paths, (path) => { return path.length; }));

  for (let i = 0; i < paths.length - 1; i++) {
    let commonStringLen = 0;

    while (commonStringLen <= commonPathLen) {
      if (paths[i].charAt(commonStringLen) === paths[i + 1].charAt(commonStringLen)) {
        commonStringLen += 1;
      }
      else {
        commonPathLen = commonStringLen;
        break;
      }
    }
    // at below point common path is only '/'
    if (commonPathLen < 2) {
      break;
    }
  }

  // remove ending `/` from match
  if (paths[0].charAt(commonPathLen - 1) === '/') {
    commonPathLen -= 1;
  }
  return paths[0].substr(0, commonPathLen);
}

/**
 * Defines global server from all given server (hosts)
 *
 * @param {Array} servers - Host url from all endpoints
 * @returns {*} - global server
 */
function getGlobalServer (servers) {
  let globalServer,
    maxServerCount = 0,
    serverCount = {};

  _.forEach(servers, (server) => {
    serverCount[server] ? serverCount[server] += 1 : serverCount[server] = 1;
    if (serverCount[server] > maxServerCount) {
      maxServerCount = serverCount[server];
      globalServer = server;
    }
  });
  return globalServer;
}

/**
 * Merges set of path variables. (all existing in same request group)
 * merging is done based on index of path variable in path. (i.e. /user/1234 and /user/{userId} will be merged together)
 *
 * @param {Array} pathVars - Path variables
 * @param {*} options - optionss
 * @returns {Array} - merged path variables
 */
function mergePathVars (pathVars, options) {
  let allPathVars = {},
    mergedPathVars;

  // traverse through all path variables and club value/schema with same key together
  _.forEach(pathVars, (pathVar) => {
    let parsedValue = parseParamValue(pathVar.value);
    _.isEmpty(allPathVars[pathVar.index]) &&
      (allPathVars[pathVar.index] = {
        key: pathVar.key,
        description: pathVar.description,
        values: [],
        examples: []
      });

    !pathVar.schema && (allPathVars[pathVar.index].key = pathVar.key);
    allPathVars[pathVar.index].values.push(convertToJsonSchema(parsedValue));
    !_.isEmpty(parsedValue) && allPathVars[pathVar.index].examples.push(parsedValue);
  });

  // merge clubbed schemas and generate openapi parameter objects for path vars
  mergedPathVars = _.map(allPathVars, (pathVar, index) => {
    let tempPathVar = {
      index,
      name: pathVar.key,
      in: 'path',
      schema: mergeJsonSchemas(pathVar.values, options),
      required: true // path variables are always required
    };

    !_.isEmpty(pathVar.description) && (tempPathVar.description = pathVar.description);

    if (options.includeExamples) {
      pathVar.examples = _.uniq(pathVar.examples);
      if (pathVar.examples.length === 1) {
        tempPathVar.example = pathVar.examples[0];
      }
      else if (pathVar.examples.length > 1) {
        tempPathVar.examples = transformToExamplesObject(pathVar.examples);
      }
    }
    return tempPathVar;
  });

  return mergedPathVars;
}

/**
 * Merges set of query parameters. (all existing in same request group)
 * merging is done based on name of query parameter.
 *
 * @param {Array} queries - Query parameters
 * @param {*} options - options
 * @returns {Array} - Merged Query Parameters
 */
function mergeQueries (queries, options) {
  let allQueries = {},
    mergedQueries;

  // traverse through all queries and club value/schema with same key together
  _.forEach(queries, (query) => {
    let parsedValue = parseParamValue(query.value);
    _.isEmpty(allQueries[query.key]) &&
      (allQueries[query.key] = { description: query.description, values: [], examples: [] });

    allQueries[query.key].values.push(convertToJsonSchema(parsedValue));
    allQueries[query.key].examples.push(parsedValue);
  });

  // merge clubbed schemas and generate openapi parameter objects for queries
  // TODO: required queries (how to define ?)
  mergedQueries = _.map(allQueries, (query, key) => {
    let tempQuery = {
      name: key,
      in: 'query',
      schema: mergeJsonSchemas(query.values, options)
    };

    !_.isEmpty(query.description) && (tempQuery.description = query.description);

    if (options.includeExamples) {
      query.examples = _.uniq(query.examples);
      if (query.examples.length === 1) {
        tempQuery.example = query.examples[0];
      }
      else if (query.examples.length > 1) {
        tempQuery.examples = transformToExamplesObject(query.examples);
      }
    }
    return tempQuery;
  });

  return mergedQueries;
}

/**
 * Merges set of Headers. (all existing in same request group)
 * merging is done based on name of Header.
 *
 * @param {Array} headers - Headers
 * @param {*} options - options
 * @returns {Array} - Merged Headers
 */
function mergeHeaders (headers, options) {
  let allHeaders = {},
    mergedHeaders;

  // traverse through all headers and club value/schema with same key together
  _.forEach(headers, (header) => {
    let parsedValue = parseParamValue(header.value);

    if (!_.includes(EXCLUDED_HEADERS, _.toLower(_.get(header, 'key')))) {
      _.isEmpty(allHeaders[header.key]) &&
        (allHeaders[header.key] = { description: header.description, values: [], examples: [] });
      allHeaders[header.key].values.push(convertToJsonSchema(parsedValue));
      allHeaders[header.key].examples.push(parsedValue);
    }
  });

  // merge clubbed schemas and generate openapi parameter objects for headers
  // TODO: required headers (how to define ?)
  mergedHeaders = _.map(allHeaders, (header, key) => {
    let tempHeader = {
      name: key,
      in: 'header',
      schema: mergeJsonSchemas(header.values, options)
    };

    !_.isEmpty(header.description) && (tempHeader.description = header.description);

    if (options.includeExamples) {
      header.examples = _.uniq(header.examples);
      if (header.examples.length === 1) {
        tempHeader.example = header.examples[0];
      }
      else if (header.examples.length > 1) {
        tempHeader.examples = transformToExamplesObject(header.examples);
      }
    }
    return tempHeader;
  });

  return mergedHeaders;
}

/**
 * Merges set of request bodies. (all existing in same request group)
 * merging is done based content type. (i.e. if two request both has application/json as
 * content type then they will be merged otherwise both will be present as different content type)
 *
 * @param {Array} bodies - Request bodies
 * @param {*} options - options
 * @returns {Array} - Merged Request bodies
 */
function mergeReqBodies (bodies, options) {
  // raw, urlencoded, formdata, file
  let contentTypes = {};

  _.forEach(bodies, (body) => {
    let bodySchema,
      dataContentType,
      example;

    if (body.mode === 'file') {
      dataContentType = 'application/octet-stream';
      bodySchema = {
        type: 'string',
        format: 'binary'
      };
    }
    else if (body.mode === 'formdata') {
      dataContentType = 'multipart/form-data';
      bodySchema = {
        type: 'object',
        properties: {}
      };
      example = {};

      // TODO - support for disabled param
      _.forEach(body.formdata, (ele) => {
        let convertedSchema,
          description = getDescription(ele.description);

        if (ele.src) {
          convertedSchema = { type: 'string', format: 'binary' };
        }
        else {
          convertedSchema = convertToJsonSchema(ele.value);
        }
        bodySchema.properties[ele.key] = _.assign(convertedSchema, _.isEmpty(description) ? {} : { description });
        example[ele.key] = ele.value;
      });
    }
    else if (body.mode === 'urlencoded') {
      dataContentType = 'application/x-www-form-urlencoded';
      bodySchema = {
        type: 'object',
        properties: {}
      };
      example = {};

      _.forEach(body.urlencoded, (ele) => {
        let description = getDescription(ele.description);

        bodySchema.properties[ele.key] = _.assign(convertToJsonSchema(ele.value),
          _.isEmpty(description) ? {} : { description });
        example[ele.key] = ele.value;
      });
    }
    else if (body.mode === 'raw') {
      let rawData;

      try {
        rawData = JSON.parse(body.raw || null);
        dataContentType = 'application/json';
        example = rawData;
      }
      catch (e) {
        // non Json value to be treated as string with apropriate content type
        rawData = '';
        switch (_.get(body, 'options.raw.language')) {
          case 'javascript':
            dataContentType = 'application/javascript';
            break;
          case 'html':
            dataContentType = 'text/html';
            break;
          case 'xml':
            dataContentType = 'application/xml';
            break;
          case 'text':
          default:
            dataContentType = 'text/plain';
            break;
        }
      }
      bodySchema = convertToJsonSchema(rawData);
    }

    // add generated body schema to corresponding content type
    _.isEmpty(contentTypes[dataContentType]) && (contentTypes[dataContentType] = []);
    contentTypes[dataContentType].push({ schema: bodySchema, example });
  });

  // merge all body schemas under one content type
  _.forEach(contentTypes, (allBodySchemas, contentType) => {
    contentTypes[contentType] = {
      schema: mergeJsonSchemas(_.map(allBodySchemas, 'schema'), options)
    };

    if (options.includeExamples) {
      let examples = _.filter(_.map(allBodySchemas, 'example'), (example) => { return !_.isUndefined(example); });
      if (examples.length === 1) {
        contentTypes[contentType].example = examples[0];
      }
      else if (examples.length > 1) {
        contentTypes[contentType].examples = transformToExamplesObject(examples);
      }
    }
  });
  return contentTypes;
}

/**
 * Merges set of responses. (all existing in same request group)
 *
 * For Response body:
 * merging is done based content type. (i.e. if two response body both has application/json as
 * content type then they will be merged otherwise both will be present as different content type)
 *
 * For Response headers:
 * merging is done based on name of Header.
 *
 * @param {Array} responses - Responses
 * @param {*} options - options
 * @returns {Array} - Merged responses
 */
function mergeResponses (responses, options) {
  let responseGroups = {},
    mergedResponses = {};

  _.forEach(responses, (response) => {
    let responseCode = response.code || 'default';

    _.isEmpty(responseGroups[responseCode]) && (responseGroups[responseCode] = []);
    responseGroups[responseCode].push(response);
  });

  _.forEach(responseGroups, (responseGroup, responseCode) => {
    let contentTypes = {},
      allHeaders = [],
      mergedHeaders = {},
      responseDesc;

    _.forEach(responseGroup, (response) => {
      let rawData,
        bodySchema,
        dataContentType,
        example;

      try {
        rawData = JSON.parse(response.body || null);
        dataContentType = 'application/json';
        example = rawData;
      }
      catch (e) {
        // non Json value to be treated as string with apropriate content type
        rawData = '';
        switch (_.get(response, '_postman_previewlanguage', null)) {
          case 'html':
            dataContentType = 'text/html';
            break;
          case 'xml':
            dataContentType = 'application/xml';
            break;
          case 'text':
          default:
            dataContentType = 'text/plain';
            break;
        }
      }
      bodySchema = convertToJsonSchema(rawData);

      allHeaders = _.concat(allHeaders, _.get(response, 'header') || []);

      _.isEmpty(responseDesc) && (responseDesc = _.get(response, 'name'));

      // add generated body schema to corresponding content type
      _.isEmpty(contentTypes[dataContentType]) && (contentTypes[dataContentType] = []);
      contentTypes[dataContentType].push({ schema: bodySchema, example });
    });

    _.forEach(mergeHeaders(allHeaders, options), (header) => {
      mergedHeaders[header.name] = _.omit(header, ['name', 'in']);
    });

    // merge responses according to content types
    _.forEach(contentTypes, (content, contentType) => {
      let mergedBody = mergeJsonSchemas(_.map(content, 'schema'), options),
        mergedContent = {
          schema: mergedBody
        };

      if (options.includeExamples) {
        let examples = _.filter(_.map(content, 'example'), (example) => { return !_.isUndefined(example); });
        if (examples.length === 1) {
          mergedContent.example = examples[0];
        }
        else if (examples.length > 1) {
          mergedContent.examples = transformToExamplesObject(examples);
        }
      }

      _.set(mergedResponses, responseCode + '.content.' + contentType, mergedContent);
    });

    !_.isEmpty(responseDesc) && _.set(mergedResponses, responseCode + '.description', responseDesc);
    !_.isEmpty(mergedHeaders) && _.set(mergedResponses, responseCode + '.headers', mergedHeaders);
  });

  return mergedResponses;
}

/**
 * Merges Postman Collection requests based on its URL
 *
 * @param {Array} requests - Array of Postman Collection Requests
 * @param {Object} options - Options
 * @param {Function} callback - callback function
 * @returns {Array} - Merged collection requests
 */
function mergePmRequests (requests, options) {
  let reqGroups = {};

  // group requests based on URL path
  _.forEach(requests, (request) => {
    let urlPath = _.cloneDeep(request.request.url.path),
      varMatches = findVariablesFromPath(urlPath, request.request.url.variable),
      path;

    if (!_.isEmpty(varMatches)) {
      _.forEach(varMatches, (varMatch) => {
        urlPath[varMatch.index] = '*';
      });
    }

    path = _.get(request, 'request.method', 'GET') + ' ' + _.join(urlPath, '/');
    if (_.isEmpty(reqGroups[path])) {
      reqGroups[path] = [];
    }
    reqGroups[path].push({
      request,
      varMatches
    });
  });

  return _.map(reqGroups, (reqGroup, reqGroupPath) => {
    let operation = {},
      mergedPath = reqGroupPath.slice(reqGroupPath.indexOf(' ') + 1).split('/'),
      itemTreeInfo = _.get(reqGroup, '[0].request.itemTree'), // pick up first itemTree
      reqHost = _.get(reqGroup, '[0].request.request.url.host'),
      getItemProp = (itemTree, prop) => {
        return _.get(_.findLast(itemTree, (itemInfo, index) => {
          let propValue = _.get(itemInfo, prop);

          // don't count first item as it's collection info
          return index && !_.isEmpty(propValue);
        }), prop);
      };

    operation.method = reqGroupPath.slice(0, reqGroupPath.indexOf(' '));
    operation.summary = _.find(reqGroup, (request) => { return !_.isEmpty(request.name); });
    operation.description = _.find(reqGroup, (request) => { return !_.isEmpty(getDescription(request.description)); });

    operation.pathVars = mergePathVars(getAllPartFromReqGroup(reqGroup, 'varMatches'), options);
    operation.queries = mergeQueries(getAllPartFromReqGroup(reqGroup, 'request.request.url.query'), options);
    operation.headers = mergeHeaders(getAllPartFromReqGroup(reqGroup, 'request.request.header'), options);
    operation.requestBodies = mergeReqBodies(getAllReqBodies(reqGroup, 'request.request.body'), options);
    operation.responses = mergeResponses(getAllPartFromReqGroup(reqGroup, 'request.response'), options);

    _.forEach(getAllPartFromReqGroup(reqGroup, 'request.request.auth'), (auth) => {
      let securityObject = authHelper(auth);

      if (securityObject) {
        operation.security = securityObject;
        return false;
      }
    });

    // look into item tree for auth definition if exists
    if (!operation.security) {
      operation.security = authHelper(getItemProp(itemTreeInfo, 'auth'));
    }

    // update path with defined keys for identified path variables
    _.forEach(operation.pathVars, (mergedPathVar) => {
      mergedPath[mergedPathVar.index] = '{' + mergedPathVar.name + '}';
      _.unset(mergedPathVar, 'index');
    });

    if (itemTreeInfo) {
      let tag = getItemProp(itemTreeInfo, 'name');

      if (!_.isEmpty(tag)) {
        let tagDesc = getItemProp(itemTreeInfo, 'description');

        operation.tag = { name: tag };
        !_.isEmpty(tagDesc) && (operation.tag.description = tagDesc);
      }
    }

    operation.server = _.isArray(reqHost) ? _.join(reqHost, '.') : reqHost;
    operation.path = '/' + mergedPath.join('/');
    operation.groupPath = reqGroupPath;
    return operation;
  });
}

/**
 * Generates OpenAPI spec from set of requests. (as JSON (default) / YAML)
 * Requests should be valid collection request. (Although "itemTree" property is handled)
 *
 * @param {Array} requests - Requests
 * @param {*} options - options
 * @returns {*} - Generated OAS in ndesiredd format
 */
async function generateOAS (requests, options) {
  let mergedRequests = mergePmRequests(requests, options),
    oasSpec = {
      openapi: '3.0.3',
      info: {
        title: DEFAULT_SPEC_NAME,
        version: '1.0.0'
      },
      servers: [],
      paths: {},
      components: {}
    },
    schemaCount = 1,
    securitySchemeCount = 1,
    commonPath,
    globalServer = getGlobalServer(_.map(mergedRequests, 'server')),
    globalSecurityObj = authHelper(_.get(requests, '[0].itemTree[0].auth')),
    allGroupEndpoints = _.map(mergedRequests, 'groupPath');

  commonPath = getCommonPath(_.map(mergedRequests, 'path'));
  oasSpec.servers.push({ url: globalServer + commonPath });
  oasSpec.info.title = _.get(requests, '[0].itemTree[0].name', DEFAULT_SPEC_NAME);
  oasSpec.info.description = _.get(requests, '[0].itemTree[0].description', DEFAULT_SPEC_DESCRIPTION);

  if (!_.isEmpty(globalSecurityObj)) {
    let securitySchemeName = 'securityScheme' + securitySchemeCount;

    oasSpec.security = [{ [securitySchemeName]: [] }];
    _.set(oasSpec.components.securitySchemes, securitySchemeName, mergedRequest.security);
    securitySchemeCount += 1;
  }

  _.forEach(mergedRequests, (mergedRequest) => {
    let operation = {},
      allParameters,
      path = mergedRequest.path.substr(commonPath.length),
      method = _.toLower(mergedRequest.method),
      relatedEndpoints = getRelatedEndpoints(mergedRequest.groupPath, allGroupEndpoints);

    allParameters = _.concat(mergedRequest.pathVars, mergedRequest.queries, mergedRequest.headers);

    if (mergedRequest.tag) {
      let existingTag = _.find(oasSpec.tags, (tag) => {
        return mergedRequest.tag.name === tag.name;
      });

      operation.tags = [mergedRequest.tag.name];

      if (_.isEmpty(existingTag)) {
        oasSpec.tags = _.concat(oasSpec.tags || [], mergedRequest.tag);
      }
    }

    _.assign(operation, _.pick(operation, ['summary', 'description', 'servers']));

    !_.isEmpty(allParameters) && (operation.parameters = allParameters);

    if (!_.isEmpty(mergedRequest.requestBodies)) {
      _.forEach(relatedEndpoints, (relatedEndpoint) => {
        let relatedOperation = _.find(mergedRequests, (mergedRequest) => {
          return mergedRequest.groupPath === relatedEndpoint;
        });

        _.forEach(JSON_CONTENT_TYPES, (jsonContentType) => {
          let sourceReqBody = _.get(mergedRequest, 'requestBodies.' + jsonContentType + '.schema'),
            targetReqBody = _.get(relatedOperation, 'requestBodies.' + jsonContentType + '.schema');

          if (!_.isEmpty(sourceReqBody) && !_.isEmpty(targetReqBody)) {
            let result = mergeCommonComponents(sourceReqBody, targetReqBody, schemaCount, oasSpec);

            if (result.schema1) {
              _.set(mergedRequest, 'requestBodies.' + jsonContentType + '.schema', result.schema1);
            }
            if (result.schema2) {
              _.set(relatedOperation, 'requestBodies.' + jsonContentType + '.schema', result.schema2);
            }
            (result.schema1 && result.schema2) && (schemaCount++);
          }
        });
      });
      operation.requestBody = { content: mergedRequest.requestBodies };
    }

    if (!_.isEmpty(mergedRequest.responses)) {
      _.forEach(relatedEndpoints, (relatedEndpoint) => {
        let relatedOperation = _.find(mergedRequests, (mergedRequest) => {
          return mergedRequest.groupPath === relatedEndpoint;
        });

        _.forEach(mergedRequest.responses, (response, responseCode) => {
          let sourceResBody = _.get(response, 'content.application/json.schema'),
            targetResBody = _.get(relatedOperation, 'responses.' + responseCode + '.content.application/json.schema');

          if (!_.isEmpty(sourceResBody) && !_.isEmpty(targetResBody)) {
            let result = mergeCommonComponents(sourceResBody, targetResBody, schemaCount, oasSpec);

            if (result.schema1) {
              _.set(mergedRequest.responses, responseCode + '.content.application/json.schema', result.schema1);
            }
            if (result.schema2) {
              _.set(relatedOperation.responses, responseCode + '.content.application/json.schema', result.schema2);
            }
            (result.schema1 && result.schema2) && (schemaCount++);
          }
        });
      });
      operation.responses = mergedRequest.responses;
    }

    // use default description to make sure openapi spec is valid
    if (_.isEmpty(operation.responses)) {
      operation.responses = { default: { description: 'No responses available' } };
    }

    if (mergedRequest.security) {
      let securitySchemeName;

      if (!oasSpec.components.securitySchemes) {
        oasSpec.components.securitySchemes = {};
      }

      // check if same security scheme exist or not
      _.forEach(oasSpec.components.securitySchemes, (securityScheme, schemeName) => {
        if (_.isEqual(securityScheme, mergedRequest.security)) {
          securitySchemeName = schemeName;
        }
      });

      // create security scheme if not present already
      if (!securitySchemeName) {
        securitySchemeName = 'securityScheme' + securitySchemeCount;
        securitySchemeCount += 1;
        _.set(oasSpec.components.securitySchemes, securitySchemeName, mergedRequest.security);
      }

      operation.security = [{ [securitySchemeName]: [] }];
    }

    if (mergedRequest.server !== globalServer) {
      operation.servers = [{ url: mergedRequest.server + commonPath }];
    }

    // keep root endpoint as path for empty paths
    _.isEmpty(path) && (path = '/');

    // escape . inside path with [""]
    _.set(oasSpec.paths, `["${path}"].${method}`, operation);
  });

  if (options.outputFormat === 'yaml') {
    return yaml.stringify(oasSpec);
  }
  return oasSpec;
}

/**
 * Flattens Postman collection v2 into requests while still pertaining item level info under "itemTree" prop
 *
 * @param {*} collection - Postman collection to flattened
 * @param {Array} flattenCollection - Array of requests from flattened collection
 * @param {*} folderInfoArr - All folders info till corresponding item
 * @param {*} options - options
 * @returns {*} -
 */
function flattenPmCollection (collection, flattenCollection, folderInfoArr, options) {
  let folderInfo,
    tempFolderInfoArr;

  if (!_.isArray(_.get(collection, 'item'))) {
    return;
  }

  folderInfo = _.pick((collection && collection.info) ? collection.info : collection, ['name', 'description']);
  folderInfo.auth = _.get(collection, 'auth');
  folderInfo.variable = _.get(collection, 'variable');

  tempFolderInfoArr = _.concat(folderInfoArr, folderInfo);

  _.forEach(collection.item, (item) => {
    if (!_.isObject(item)) {
      return;
    }

    if (_.isArray(item.item)) {
      flattenPmCollection(item, flattenCollection, tempFolderInfoArr, options);
    }
    else if (!_.isEmpty(item.request)) {
      flattenCollection.push(_.assign({}, item, { itemTree: tempFolderInfoArr }));
    }
  });
}

module.exports = {
  generateOAS,
  flattenPmCollection
};
