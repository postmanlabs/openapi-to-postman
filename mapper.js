const _ = require('lodash'),
  SDK = require('postman-collection'),
  schemaUtils = require('./lib/schemaUtils'),
  parser = require('./lib/parse'),
  Converter = require('./index.js');

/**
 *
 * @param {*} source - Requests source to be mapped
 * @return {*} - Parsed Collection v2.1 requests
 */
function parseCollectionv2Requests (source) {
  let parsedRequests = [],
    getAllRequests = function (collection, parsedRequests, jsonPath = '$.item') {
      if (!_.has(collection, 'item') || !_.isArray(collection.item)) {
        return;
      }
      _.forEach(collection.item, (item, index) => {
        if (_.has(item, 'request') || _.has(item, 'response')) {
          let requestUrl = _.get(item, 'request.url');

          if (typeof requestUrl === 'object') {

            // SDK.Url.toString() resolves pathvar to empty string if value is empty
            // so update path variable value to same as key in such cases
            _.forEach(requestUrl.variable, (pathVar) => {
              if (_.isNil(pathVar.value) || (typeof pathVar.value === 'string' && _.trim(pathVar.value).length === 0)) {
                pathVar.value = ':' + pathVar.key;
              }
            });

            // SDK URL object. Get raw string representation.
            requestUrl = (new SDK.Url(requestUrl)).toString();
          }
          parsedRequests.push({
            id: _.get(item, 'id'),
            method: _.get(item, 'request.method', 'GET'),
            url: requestUrl,
            jsonPath: `${jsonPath}[${index}]`
          });
        }
        else {
          getAllRequests(item, parsedRequests, `${jsonPath}[${index}].item`);
        }
      });
    };

  getAllRequests(source, parsedRequests);
  return parsedRequests;
}

/**
 *
 * @param {*} source - Requests source to be mapped
 * @param {*} format - Source format
 * @return {*} - Parsed requests
 */
function parseRequests (source, format) {
  let parsedRequests;

  switch (format) {
    case 'COLLECTION2.1':
    default:
      parsedRequests = parseCollectionv2Requests(source);
      break;
  }
  return parsedRequests;
}

/**
 *
 * @param {Object} oasSpec - OpenAPI specification
 * @param {*} requestsSource - Requests to match against specification
 * @param {*} sourceFormat - Source format
 * @param {Function} callback - callback
 * @return {*} - Matched endpoints
 */
function matchEndpoints (oasSpec, requestsSource, sourceFormat, callback) {
  let parsedRequests = parseRequests(requestsSource, sourceFormat),
    parsedSpec,
    schemaPack,
    endpointMap = {},
    result = {};

  try {
    let parsedOasObject = parser.getOasObject(oasSpec);
    if (!parsedOasObject.result) {
      throw new Error('Problem with parsing OpenAPI specification');
    }
    parsedSpec = parsedOasObject.oasObject;
    schemaPack = new Converter.SchemaPack({ type: 'json', data: parsedSpec }, {});
  }
  catch (error) {
    return callback(error);
  }

  schemaPack.getSpecEndpoints((err, specEndpoints) => {
    if (err) {
      return callback(err);
    }

    _.forEach(specEndpoints, (specEndpoint) => {
      endpointMap[_.toUpper(specEndpoint.method) + ' ' + specEndpoint.path] = specEndpoint;
    });

    _.forEach(parsedRequests, (request) => {
      let matchedPaths = schemaUtils.findMatchingRequestFromSchema(
          request.method,
          request.url,
          parsedSpec,
          { strictRequestMatching: true }
        ),
        requestKey = request.id || request.jsonPath,
        mappedEndpoint;

      if (matchedPaths && matchedPaths.length === 0) {
        result[request.id] = {
          matched: false,
          request
        };
        return;
      }
      mappedEndpoint = matchedPaths[0];

      if (!endpointMap[mappedEndpoint.name]) {
        result[requestKey] = {
          matched: false,
          request
        };
        // throw new Error('Invalid endpoint "' + mappedEndpoint.name + '" found');
        return;
      }

      if (!result[requestKey]) {
        result[requestKey] = {
          matched: true,
          request,
          endpoints: []
        };
      }
      result[requestKey].endpoints.push({
        jsonPath: mappedEndpoint.jsonPath,
        endpoint: endpointMap[mappedEndpoint.name]
      });
    });
    return callback(null, result);
  });
}

module.exports = {
  matchEndpoints
};
