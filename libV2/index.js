const _ = require('lodash'),
  { Collection } = require('postman-collection/lib/collection/collection'),
  GraphLib = require('graphlib'),
  generateSkeletonTreeFromOpenAPI =
    require('./CollectionGeneration/helpers/collection/generateSkeletionTreeFromOpenAPI'),
  generateCollectionFromOpenAPI =
    require('./CollectionGeneration/helpers/collection/generateCollectionFromOpenAPI'),
  generateFolderFromOpenAPI = require('./CollectionGeneration/helpers/folder/generateFolderForOpenAPI'),

  Ajv = require('ajv'),
  addFormats = require('ajv-formats'),
  async = require('async'),
  transactionSchema = require('../assets/validationRequestListSchema.json'),

  // All V1 interfaces used
  OpenApiErr = require('../lib/error'),
  { validateTransaction, getMissingSchemaEndpoints } = require('./CollectionGeneration/validationUtils'),
  { syncCollection: syncCollectionState } = require('../dist/libV2/SpecificationCollectionSyncing');

const { resolvePostmanRequest, resolveRefFromSchema, recordConversionIssue, CONVERSION_ISSUE_TYPES } =
  require('./CollectionGeneration/schemaUtils');
const { generateRequestItemObject, fixPathVariablesInUrl } = require('./CollectionGeneration/utils');

module.exports = {
  convertV2: function (context, cb) {
    // Reset per-conversion issue accumulation (a SchemaPack can be converted more than once).
    context.conversionIssues = [];

    /**
     * Start generating the Bare bone tree that should exist for the schema
     */

    let collectionTree = generateSkeletonTreeFromOpenAPI(context, context.openapi, context.computedOptions);

    /**
     * Do post order traversal so we get the request nodes first and generate the request object
     */

    let preOrderTraversal = GraphLib.alg.preorder(collectionTree, 'root:collection');

    let collection = {},
      extractedTypesObject = {};

    /**
     * individually start generating the folder, request, collection
     * and keep adding to the collection tree.
     */
    _.forEach(preOrderTraversal, function (nodeIdentified) {
      let node = collectionTree.node(nodeIdentified);

      switch (node.type) {
        case 'collection': {
          // dummy collection to be generated.
          const { data, variables } = generateCollectionFromOpenAPI(context, node);
          collection = new Collection(data);

          collection = collection.toJSON();

          collection.variable.push(...variables);

          // set the ref for the collection in the node.
          collectionTree.setNode(nodeIdentified,
            Object.assign(node, {
              ref: collection
            }));

          break;
        }

        case 'folder': {
          // generate the folder form the node.
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
            collectionVariables = [],
            requestObject = {},
            requestTypesObject = {},
            pathItem = context.openapi.paths[node.meta.path];

          if (pathItem && pathItem.$ref) {
            pathItem = resolveRefFromSchema(context, pathItem.$ref);
          }

          context.currentOperation = { path: node.meta.path, method: node.meta.method };

          try {
            ({ request, collectionVariables, requestTypesObject } = resolvePostmanRequest(context,
              pathItem,
              node.meta.path,
              node.meta.method
            ));

            requestObject = generateRequestItemObject(request);
            extractedTypesObject = Object.assign({}, extractedTypesObject, requestTypesObject);

          }
          catch (error) {
            /**
             * The request could not be generated, so it is dropped from the collection. Record it
             * so the caller is told which requests are missing instead of silently receiving a
             * collection with fewer requests than the specification describes.
             */
            recordConversionIssue(context, {
              type: CONVERSION_ISSUE_TYPES.REQUEST_GENERATION_FAILED,
              reason: _.get(error, 'message', String(error))
            });
            break;
          }
          finally {
            context.currentOperation = undefined;
          }

          collection.variable.push(...collectionVariables);

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

        case 'webhook~folder': {
          // generate the folder form the node.
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

        case 'webhook~request': {
          // generate the request form the node
          let request = {},
            collectionVariables = [],
            requestObject = {},
            webhookPathItem = context.openapi.webhooks[node.meta.path];

          if (webhookPathItem && webhookPathItem.$ref) {
            webhookPathItem = resolveRefFromSchema(context, webhookPathItem.$ref);
          }

          // TODO: Figure out a proper fix for this
          if (node.meta.method === 'parameters') {
            break;
          }

          context.currentOperation = { webhook: node.meta.path, method: node.meta.method };

          try {
            ({ request, collectionVariables } = resolvePostmanRequest(context,
              webhookPathItem,
              node.meta.path,
              node.meta.method
            ));

            requestObject = generateRequestItemObject(request);
          }
          catch (error) {
            // Same silent-drop hazard as the `request` case above - see the comment there.
            recordConversionIssue(context, {
              type: CONVERSION_ISSUE_TYPES.REQUEST_GENERATION_FAILED,
              reason: _.get(error, 'message', String(error))
            });
            break;
          }
          finally {
            context.currentOperation = undefined;
          }

          collection.variable.push(...collectionVariables);

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

    // Remove duplicate variables as different requests could end up creating same variables
    if (!_.isEmpty(collection.variable)) {
      collection.variable = _.uniqBy(collection.variable, 'key');
    }

    const result = {
      result: true,
      output: [{
        type: 'collection',
        data: collection
      }],
      analytics: this.analytics || {}
    };

    if (context.enableTypeFetching) {
      result.extractedTypes = extractedTypesObject || {};
    }

    /**
     * Requests that could not be generated, and bodies that breached the size ceiling, are not
     * fatal - the rest of the collection is still usable - but they must not be silent either.
     * The key is only added when something actually went wrong, so a clean conversion returns
     * exactly the shape it always has.
     */
    if (!_.isEmpty(context.conversionIssues)) {
      result.conversionIssues = context.conversionIssues;
    }

    return cb(null, result);
  },

  /**
   *
   * @description Takes in a request collection (transaction object) and validates it against
   * corresponding definition matching endpoint
   *
   * @param {Object} context - Required context from related SchemaPack function
   * @param {Array} transactions - Transactions to be validated
   * @param {*} callback return
   * @returns {boolean} validation
   */
  validateTransactionV2(context, transactions, callback) {
    let schema = context.openapi,
      options = context.computedOptions,
      concreteUtils = context.concreteUtils,
      componentsAndPaths = { concreteUtils },
      schemaCache = context.schemaFakerCache,
      matchedEndpoints = [];

    context.schemaCache = context.schemaCache || {};
    context.schemaFakerCache = context.schemaFakerCache || {};
    Object.assign(componentsAndPaths, concreteUtils.getRequiredData(schema));

    // create and sanitize basic spec
    schema.servers = _.isEmpty(schema.servers) ? [{ url: '/' }] : schema.servers;
    schema.securityDefs = _.get(schema, 'components.securitySchemes', {});
    schema.baseUrl = _.get(schema, 'servers.0.url', '{{baseURL}}');
    schema.baseUrlVariables = _.get(schema, 'servers.0.variables');

    // Fix {scheme} and {path} vars in the URL to :scheme and :path
    schema.baseUrl = fixPathVariablesInUrl(schema.baseUrl);

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

    return async.map(transactions, (transaction, callback) => {
      return validateTransaction(context, transaction, {
        schema, options, componentsAndPaths, schemaCache, matchedEndpoints
      }, callback);
    }, (err, result) => {
      var retVal;

      if (err) {
        return callback(err);
      }

      retVal = {
        requests: _.keyBy(result, 'requestId'),
        missingEndpoints: getMissingSchemaEndpoints(context, schema, matchedEndpoints,
          componentsAndPaths, options, schemaCache)
      };

      return callback(null, retVal);
    });
  },

  /**
   * Syncs a collection generated with changes from a specification
   *
   * @param {Object} context - Required context from related SchemaPack function
   * @param {Object} currentCollection - The existing collection JSON to sync with
   * @param {Object} syncOptions - Options for syncing
   * @param {Function} cb - Callback function
   * @returns {void}
   */
  syncCollection: function (context, currentCollection, syncOptions, cb) {
    return this.convertV2(context, (err, result) => {
      if (err) {
        return cb(err);
      }

      if (!result || !result.output || !result.output[0]) {
        return cb(new OpenApiErr('Failed to generate collection from specification'));
      }

      try {
        const latestCollectionState = new Collection(result.output[0].data);
        const currentCollectionState = new Collection(currentCollection);

        const syncedCollection = syncCollectionState(latestCollectionState, currentCollectionState, syncOptions);

        return cb(null, {
          result: true,
          output: [{ type: 'collection', data: syncedCollection }],
          analytics: result.analytics || {},
          extractedTypes: result.extractedTypes || {}
        });
      }
      catch (syncError) {
        return cb(syncError);
      }
    });
  }
};
