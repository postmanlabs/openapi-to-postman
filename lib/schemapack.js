'use strict';

// This is the default collection name if one can't be inferred from the OpenAPI spec
const COLLECTION_NAME = 'Converted from OpenAPI',
  Ajv = require('ajv'),
  async = require('async'),
  sdk = require('postman-collection'),
  schemaUtils = require('./schemaUtils.js'),
  OasResolverOptions = {
    resolve: true, // Resolve external references
    jsonSchema: true // Treat $ref like JSON Schema and convert to OpenAPI Schema Objects
  },
  parse = require('./parse.js'),
  getOptions = require('./options').getOptions,
  transactionSchema = require('../assets/validationRequestListSchema.json'),
  utils = require('./utils.js'),
  _ = require('lodash'),
  fs = require('fs'),
  // options for oas-resolver

  // This provides the base class for
  // errors with the input OpenAPI spec
  OpenApiErr = require('./error.js'),

  // TODO: Move this to schemaUtils
  /**
   * Adds items from the specWrapper trie as folders (or leaf requests)
   * into the collection object (that's in generatedStore)
   * @param {object} specWrapper - specWrapper.tree is trie generated from util
   * @param {object} generatedStore - the store that holds the generated collection. Modified in-place
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @param {object} schemaCache - object storing schemaFaker and schmeResolution caches
   * @returns {void} - generatedStore is modified in-place
   */
  generateCollection = function (specWrapper, generatedStore, components, options, schemaCache) {
    var folderTree = specWrapper.tree, // this is the trie we generate (as a scaffold to the collection)
      openapi = specWrapper.spec, // this is the JSON-version of the openAPI spec
      child,
      key,
      variableStore = {};

    for (child in folderTree.root.children) {
      // A Postman request or folder is added if atleast one request is present in that sub-child's tree
      // requestCount is a property added to each node (folder/request) while constructing the trie
      if (folderTree.root.children.hasOwnProperty(child) && folderTree.root.children[child].requestCount > 0) {
        generatedStore.collection.items.add(
          schemaUtils.convertChildToItemGroup(openapi, folderTree.root.children[child],
            components, options, schemaCache, variableStore)
        );
      }
    }
    for (key in variableStore) {
      // variableStore contains all the kinds of variable created.
      // Add only the variables with type 'collection' to generatedStore.collection.variables
      if (variableStore[key].type === 'collection') {
        const collectionVar = new sdk.Variable(variableStore[key]);
        generatedStore.collection.variables.add(collectionVar);
      }
    }
  };


class SchemaPack {
  constructor (input, options = {}) {
    this.input = input;
    this.validated = false;
    this.openapi = null;
    this.validationResult = null;
    this.definedOptions = getOptions();
    this.computedOptions = null;
    this.schemaFakerCache = {};
    this.schemaResolutionCache = {};

    this.computedOptions = utils.mergeOptions(
      // predefined options
      _.keyBy(this.definedOptions, 'id'),
      // options provided by the user
      options
    );
    // hardcoding this option - not exposed to users yet
    this.computedOptions.schemaFaker = true;

    this.validate();
  }

  // need to store the schema here

  // Checks that input is valid YAML/JSON
  /**
   * @returns {object} - Object with schema validation results (true/false),
   * reason (if false) and error (if any)
   */
  validate() {
    let input = this.input,
      json,
      specParseResult;
    if (!input) {
      return {
        result: false,
        reason: 'Input not provided'
      };
    }
    if (input.type === 'string' || input.type === 'json') {
      // no need for extra processing before calling the converter
      // string can be JSON or YAML
      json = input.data;
    }
    else if (input.type === 'file') {
      try {
        json = fs.readFileSync(input.data, 'utf8');
      }
      catch (e) {
        this.validationResult = {
          result: false,
          reason: e.message
        };
        return this.validationResult;
      }
    }
    else if (input.type === 'folder') {
      this.validationResult = {
        result: false,
        reason: 'Input data not validated, please call mergeAndValidate() for input.type \'folder\''
      };

      return this.validationResult;
    }
    else {
      // invalid input type
      this.validationResult = {
        result: false,
        reason: `Invalid input type (${input.type}). type must be one of file/json/string.`
      };
      return this.validationResult;
    }
    if (_.isEmpty(json)) {
      this.validationResult = {
        result: false,
        reason: 'Empty input schema provided.'
      };
      return this.validationResult;
    }

    specParseResult = schemaUtils.parseSpec(json);

    if (!specParseResult.result) {
      // validation failed
      // calling this.convert() will be blocked
      this.validationResult = {
        result: false,
        reason: specParseResult.reason
      };
      return this.validationResult;
    }

    this.openapi = specParseResult.openapi;
    this.validated = true;
    this.validationResult = {
      result: true
    };
    return this.validationResult;
  }

  /**
   * @callback responseCallback
   * @param {object} error - For handling error object
   * @param {object} result - For handling conversion/validation object
   */

  // Checks JSON/YAML input in file hierarchy with a root dir
  /**
   * @param {responseCallback} cb - For return
   * @returns {responseCallback} Callback with success/failure status of schema validation
   */
  mergeAndValidate (cb) {
    let input = this.input,
      validationResult,
      rootFiles;

    try {
      rootFiles = parse.getRootFiles(input.data);
    }
    catch (e) {
      return cb(null, {
        result: false,
        reason: e
      });
    }
    if (rootFiles.length > 1) {
      this.validationResult = {
        result: false,
        reason: 'More than one root file not supported.'
      };
      return cb(null, this.validationResult);
    }
    if (rootFiles.length) {
      parse.mergeFiles(rootFiles[0], OasResolverOptions)
        .then((spec) => {
          this.input = {
            type: 'json',
            data: spec
          };
          validationResult = this.validate();

          return cb(null, validationResult);
        })
        .catch((err) => {
          this.validationResult = {
            result: false,
            reason: 'Error while merging files.',
            error: err
          };
          return cb(null, this.validationResult);
        });
    }
    else {
      return cb(null, {
        result: false,
        reason: 'No root files present / input is not an OpenAPI spec.'
      });
    }
  }

  // convert method, this is called when you want to convert a schema that you've already loaded
  // in the constructor
  /**
   * @param {responseCallback} callback - For return
   * @returns {responseCallback} Callback with conversion results (success/failure)
   */
  convert (callback) {
    let openapi,
      generatedStore = {},
      folderObj,
      collectionJSON;

    if (!this.validated) {
      return callback(new OpenApiErr('The schema must be validated before attempting conversion'));
    }

    // create and sanitize basic spec
    openapi = this.openapi;
    openapi.servers = _.isEmpty(openapi.servers) ? [{ url: '/' }] : openapi.servers;
    openapi.securityDefs = _.get(openapi, 'components.securitySchemes', {});
    openapi.baseUrl = _.get(openapi, 'servers.0.url', '{{baseURL}}');

    // TODO: Multiple server variables need to be saved as environments
    openapi.baseUrlVariables = _.get(openapi, 'servers.0.variables');

    // Fix {scheme} and {path} vars in the URL to :scheme and :path
    openapi.baseUrl = schemaUtils.fixPathVariablesInUrl(openapi.baseUrl);

    // Creating a new instance of a Postman collection
    // All generated folders and requests will go inside this
    generatedStore.collection = new sdk.Collection({
      info: {
        name: _.get(openapi, 'info.title', COLLECTION_NAME)
      }
    });


    // ---- Collection Variables ----
    // adding the collection variables for all the necessary root level variables
    // and adding them to the collection variables
    schemaUtils.convertToPmCollectionVariables(
      openapi.baseUrlVariables,
      'baseUrl',
      openapi.baseUrl
    ).forEach((element) => {
      generatedStore.collection.variables.add(element);
    });

    generatedStore.collection.describe(schemaUtils.getCollectionDescription(openapi));

    /**
     We need a trie because the decision of whether or not a node
      is a folder or request can only be made once the whole trie is generated
      This has a .trie and a .variables prop
    */
    folderObj = schemaUtils.generateTrieFromPaths(openapi, this.computedOptions);

    /*
      * these are variables identified at the collection level
      * they need to be added explicitly to collection variables
      * deeper down in the trie, variables will be added directly to folders
      * If the folderObj.variables have their own variables, we add
      * them to the collectionVars
    */
    if (folderObj.variables) {
      _.forOwn(folderObj.variables, (server, key) => {
        // TODO: Figure out what this does
        schemaUtils.convertToPmCollectionVariables(
          server.variables, // these are path variables in the server block
          key, // the name of the variable
          schemaUtils.fixPathVariablesInUrl(server.url)
        ).forEach((element) => {
          generatedStore.collection.variables.add(element);
        });
      });
    }

    // Adds items from the trie into the collection that's in the store
    try {
      generateCollection({
        spec: openapi,
        tree: folderObj.tree
      }, generatedStore, {
        components: openapi.components,
        paths: openapi.paths
      }, this.computedOptions, {
        schemaResolutionCache: this.schemaResolutionCache,
        schemaFakerCache: this.schemaFakerCache
      });
    }
    catch (e) {
      return callback(e);
    }

    collectionJSON = generatedStore.collection.toJSON();

    // this needs to be deleted as even if version is not specified to sdk,
    // it returns a version property with value set as undefined
    // this fails validation against v2.1 collection schema definition.
    delete collectionJSON.info.version;

    return callback(null, {
      result: true,
      output: [{
        type: 'collection',
        data: collectionJSON
      }]
    });
  }

  /**
   *
   * @description Takes in a transaction object (meant to represent a Postman history object)
   *
   * @param {*} transactions RequestList
   * @param {*} callback return
   * @returns {boolean} validation
   */
  validateTransaction(transactions, callback) {
    let schema = this.openapi,
      componentsAndPaths,
      options = this.computedOptions,
      schemaResolutionCache = this.schemaResolutionCache;


    if (!this.validated) {
      return callback(new OpenApiErr('The schema must be validated before attempting conversion'));
    }

    // this cannot be attempted before validation
    componentsAndPaths = {
      components: this.openapi.components,
      paths: this.openapi.paths
    };

    // check validity of transactions
    try {
      let ajv = new Ajv({ unknownFormats: ['int32', 'int64'], allErrors: true }),
        validate = ajv.compile(transactionSchema),
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
          // SDK URL object. Get raw string representation.
          requestUrl = (new sdk.Url(requestUrl)).toString();
        }

        // 1. Look at transaction.request.URL + method, and find matching request from schema
        matchedPaths = schemaUtils.findMatchingRequestFromSchema(
          transaction.request.method,
          requestUrl,
          schema
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
            // 3. validation involves checking these individual properties
            async.parallel({
              path: function(cb) {
                schemaUtils.checkPathVariables(matchedPath.pathVariables, '$.request.url', matchedPath.path,
                  componentsAndPaths, options, schemaResolutionCache, cb);
              },
              queryparams: function(cb) {
                schemaUtils.checkQueryParams(requestUrl, '$.request.url.query', matchedPath.path,
                  componentsAndPaths, options, schemaResolutionCache, cb);
              },
              headers: function(cb) {
                schemaUtils.checkRequestHeaders(transaction.request.header, '$.request.header', matchedPath.path,
                  componentsAndPaths, options, schemaResolutionCache, cb);
              },
              requestBody: function(cb) {
                schemaUtils.checkRequestBody(transaction.request.body, '$.request.body', matchedPath.jsonPath,
                  matchedPath.path, componentsAndPaths, options, schemaResolutionCache, cb);
              },
              responses: function (cb) {
                schemaUtils.checkResponses(transaction.response, '$.responses', matchedPath.jsonPath,
                  matchedPath.path, componentsAndPaths, options, schemaResolutionCache, cb);
              }
            }, (err, result) => {
              let allMismatches = _.concat(result.queryparams, result.headers, result.path, result.requestBody),
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
          requests: _.keyBy(result, 'requestId')
        };

        callback(null, retVal);
      });
    }, 0);
  }

  /**
   * @returns {object} options object to used as kv-pairs
   */
  static getOptions() {
    return getOptions();
  }
}

module.exports = {
  SchemaPack
};
