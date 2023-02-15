/* eslint-disable one-var */
const _ = require('lodash'),
  sdk = require('postman-collection'),
  GraphLib = require('graphlib'),
  generateSkeletonTreeFromOpenAPI = require('./helpers/collection/generateSkeletionTreeeFromOpenAPI'),
  generateCollectionFromOpenAPI = require('./helpers/collection/generateCollectionFromOpenAPI'),
  generateFolderFromOpenAPI = require('./helpers/folder/generateFolderForOpenAPI'),

  Ajv = require('ajv'),
  addFormats = require('ajv-formats'),
  async = require('async'),
  transactionSchema = require('../assets/validationRequestListSchema.json'),
  { getServersPathVars } = require('../lib/common/schemaUtilsCommon'),

  // All V1 interfaces used
  OpenApiErr = require('../lib/error'),
  schemaUtils = require('../lib/schemaUtils');

const { resolvePostmanRequest } = require('./schemaUtils');
const { generateRequestItemObject } = require('./utils');

module.exports = {
  convertV2: function (context, cb) {
    /**
     * Start generating the Bare bone tree that should exist for the schema
     */

    let collectionTree = generateSkeletonTreeFromOpenAPI(context.openapi, context.computedOptions.folderStrategy);

    /**
     * Do post order traversal so we get the request nodes first and generate the request object
     */

    let preOrderTraversal = GraphLib.alg.preorder(collectionTree, 'root:collection');

    let collection = {};

    /**
     * individually start generating the folder, request, collection
     * and keep adding to the collection tree.
     */
    _.forEach(preOrderTraversal, function (nodeIdentified) {
      let node = collectionTree.node(nodeIdentified);

      switch (node.type) {
        case 'collection': {
          // dummy collection to be generated.
          collection = new sdk.Collection(generateCollectionFromOpenAPI(context, node).data);

          collection = collection.toJSON();

          // set the ref for the collection in the node.
          collectionTree.setNode(nodeIdentified,
            Object.assign(node, {
              ref: collection
            }));

          break;
        }

        case 'folder': {
          // generate the request form the node.
          let folder = generateFolderFromOpenAPI(context, node).data || {};

          // find the parent of the folder in question / root collection.
          let parent = collectionTree.predecessors(nodeIdentified);

          // this is directed graph, and hence have only one parent.
          parent = collectionTree.node(parent && parent[0]);

          // if the item construct does not exist add and initialize it to zero
          if (!parent.ref.item) {
            parent.ref.item = [];
          }

          // push the folder in the item that is in question
          parent.ref.item.push(folder);

          // set the ref for the newly created folder in this.
          collectionTree.setNode(nodeIdentified,
            Object.assign(node, {
              ref: _.last(parent.ref.item)
            }));

          break;
        }

        case 'request': {
          // generate the request form the node
          let request = {},
            requestObject = {};

          // TODO: Figure out a proper fix for this
          if (node.meta.method === 'parameters') {
            break;
          }

          try {
            request = resolvePostmanRequest(context,
              context.openapi.paths[node.meta.path],
              node.meta.path,
              node.meta.method
            );

            requestObject = generateRequestItemObject(request);
          }
          catch (error) {
            console.error(error);
          }

          // find the parent of the request in question
          let parent = collectionTree.predecessors(nodeIdentified);

          // this is directed graph, and hence have only one parent.
          parent = collectionTree.node(parent && parent[0]);

          // if the item construct does not exist add and initialize it to zero
          if (!parent.ref.item) {
            parent.ref.item = [];
          }

          // push the folder in the item that is in question
          parent.ref.item.push(requestObject);

          // set the ref for the newly created request in this.
          collectionTree.setNode(nodeIdentified,
            Object.assign(node, {
              ref: _.last(parent.ref.item)
            }));

          break;
        }

        default: break;
      }
    });

    return cb(null, collection);
  },

  /**
   *
   * @description Takes in a transaction object (meant to represent a Postman history object)
   *
   * @param {Object} context - Required context from related SchemaPack function
   * @param {*} callback return
   * @returns {boolean} validation
   */
  validateTransactionV2(context, callback) {
    let { schema, options, transactions, componentsAndPaths, schemaCache } = context,
      matchedEndpoints = [],
      jsonSchemaDialect = schema.jsonSchemaDialect;

    // create and sanitize basic spec
    schema.servers = _.isEmpty(schema.servers) ? [{ url: '/' }] : schema.servers;
    schema.securityDefs = _.get(schema, 'components.securitySchemes', {});
    schema.baseUrl = _.get(schema, 'servers.0.url', '{{baseURL}}');
    schema.baseUrlVariables = _.get(schema, 'servers.0.variables');

    // Fix {scheme} and {path} vars in the URL to :scheme and :path
    schema.baseUrl = schemaUtils.fixPathVariablesInUrl(schema.baseUrl);

    // check validity of transactions
    try {
      // add Ajv options to support validation of OpenAPI schema.
      // For more details see https://ajv.js.org/#options
      let ajv = new Ajv({
          allErrors: true,
          strict: false
        }),
        validate,
        res;
      addFormats(ajv);
      validate = ajv.compile(transactionSchema);
      res = validate(transactions);

      if (!res) {
        return callback(new OpenApiErr('Invalid syntax provided for requestList', validate.errors));
      }
    }
    catch (e) {
      return callback(new OpenApiErr('Invalid syntax provided for requestList', e));
    }

    return setTimeout(() => {
      async.map(transactions, (transaction, requestCallback) => {
        if (!transaction.id || !transaction.request) {
          return requestCallback(new Error('All transactions must have `id` and `request` properties.'));
        }

        let requestUrl = transaction.request.url,
          matchedPaths;
        if (typeof requestUrl === 'object') {

          // SDK.Url.toString() resolves pathvar to empty string if value is empty
          // so update path variable value to same as key in such cases
          _.forEach(requestUrl.variable, (pathVar) => {
            if (_.isNil(pathVar.value) || (typeof pathVar.value === 'string' && _.trim(pathVar.value).length === 0)) {
              pathVar.value = ':' + pathVar.key;
            }
          });

          // SDK URL object. Get raw string representation.
          requestUrl = (new sdk.Url(requestUrl)).toString();
        }

        // 1. Look at transaction.request.URL + method, and find matching request from schema
        matchedPaths = schemaUtils.findMatchingRequestFromSchema(
          transaction.request.method,
          requestUrl,
          schema,
          options
        );

        if (!matchedPaths.length) {
          // No matching paths found
          return requestCallback(null, {
            requestId: transaction.id,
            endpoints: []
          });
        }

        return setTimeout(() => {
          // 2. perform validation for each identified matchedPath (schema endpoint)
          return async.map(matchedPaths, (matchedPath, pathsCallback) => {
            const transactionPathVariables = _.get(transaction, 'request.url.variable', []),
              localServers = matchedPath.path.hasOwnProperty('servers') ?
                matchedPath.path.servers :
                [],
              serversPathVars = [...getServersPathVars(localServers), ...getServersPathVars(schema.servers)],
              isNotAServerPathVar = (pathVarName) => {
                return !serversPathVars.includes(pathVarName);
              };

            matchedPath.unmatchedVariablesFromTransaction = [];
            // override path variable value with actual value present in transaction
            // as matched pathvariable contains key as value, as it is generated from url only
            _.forEach(matchedPath.pathVariables, (pathVar) => {
              const mappedPathVar = _.find(transactionPathVariables, (transactionPathVar) => {
                let matched = transactionPathVar.key === pathVar.key;
                if (
                  !matched &&
                  isNotAServerPathVar(transactionPathVar.key) &&
                  !matchedPath.unmatchedVariablesFromTransaction.includes(transactionPathVar)
                ) {
                  matchedPath.unmatchedVariablesFromTransaction.push(transactionPathVar);
                }
                return matched;
              });
              pathVar.value = _.get(mappedPathVar, 'value', pathVar.value);
              // set _varMatched flag which represents if variable was found in transaction or not
              pathVar._varMatched = !_.isEmpty(mappedPathVar);
            });

            // resolve $ref in all parameter objects if present
            _.forEach(_.get(matchedPath, 'path.parameters'), (param) => {
              if (param.hasOwnProperty('$ref')) {
                _.assign(param, schemaUtils.getRefObject(param.$ref, componentsAndPaths, options));
                _.unset(param, '$ref');
              }
            });

            matchedEndpoints.push(matchedPath.jsonPath);
            // 3. validation involves checking these individual properties
            async.parallel({
              metadata: function(cb) {
                schemaUtils.checkMetadata(transaction, '$', matchedPath.path, matchedPath.name, options, cb);
              },
              path: function(cb) {
                schemaUtils.checkPathVariables(_.get(transaction, 'request.url'), matchedPath, '$.request.url.variable',
                  matchedPath.path, componentsAndPaths, options, schemaCache, jsonSchemaDialect, cb);
              },
              queryparams: function(cb) {
                schemaUtils.checkQueryParams(_.get(transaction, 'request.url.query'), requestUrl, '$.request.url.query',
                  matchedPath.path, componentsAndPaths, options, schemaCache, jsonSchemaDialect, cb);
              },
              headers: function(cb) {
                schemaUtils.checkRequestHeaders(transaction.request.header, '$.request.header', matchedPath.jsonPath,
                  matchedPath.path, componentsAndPaths, options, schemaCache, jsonSchemaDialect, cb);
              },
              requestBody: function(cb) {
                schemaUtils.checkRequestBody(transaction.request.body, '$.request.body', matchedPath.jsonPath,
                  matchedPath.path, componentsAndPaths, options, schemaCache, jsonSchemaDialect, cb);
              },
              responses: function (cb) {
                schemaUtils.checkResponses(transaction.response, '$.responses', matchedPath.jsonPath,
                  matchedPath.path, componentsAndPaths, options, schemaCache, jsonSchemaDialect, cb);
              }
            }, (err, result) => {
              let allMismatches = _.concat(result.metadata, result.queryparams, result.headers, result.path,
                  result.requestBody),
                responseMismatchesPresent = false,
                retVal;

              // adding mistmatches from responses
              _.each(result.responses, (response) => {
                if (_.get(response, 'mismatches', []).length > 0) {
                  responseMismatchesPresent = true;
                  return false;
                }
              });

              retVal = {
                matched: (allMismatches.length === 0 && !responseMismatchesPresent),
                endpointMatchScore: matchedPath.score,
                endpoint: matchedPath.name,
                mismatches: allMismatches,
                responses: result.responses
              };

              pathsCallback(null, retVal);
            });
          }, (err, result) => {
            // only need to return endpoints that have the joint-highest score
            let highestScore = -Infinity,
              bestResults;
            result.forEach((endpoint) => {
              if (endpoint.endpointMatchScore > highestScore) {
                highestScore = endpoint.endpointMatchScore;
              }
            });
            bestResults = _.filter(result, (ep) => {
              return ep.endpointMatchScore === highestScore;
            });

            requestCallback(err, {
              requestId: transaction.id,
              endpoints: bestResults
            });
          });
        }, 0);
      }, (err, result) => {
        var retVal;

        if (err) {
          return callback(err);
        }

        // determine if any endpoint for any request misatched
        _.each(result, (reqRes) => {
          let thisMismatch = false;
          _.each(reqRes.endpoints, (ep) => {
            if (!ep.matched) {
              return false;
            }
          });
          if (thisMismatch) {
            return false;
          }
        });

        retVal = {
          requests: _.keyBy(result, 'requestId'),
          missingEndpoints: schemaUtils.getMissingSchemaEndpoints(schema, matchedEndpoints,
            componentsAndPaths, options, schemaCache)
        };

        callback(null, retVal);
      });
    }, 0);
  }
};
