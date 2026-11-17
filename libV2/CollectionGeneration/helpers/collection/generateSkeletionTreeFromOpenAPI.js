let _ = require('lodash'),
  Graph = require('graphlib').Graph,
  { resolveRefFromSchema } = require('../../schemaUtils'),
  { isOpenApi32, getPathItemOperations, resolveTagParentChain } = require('../../../../lib/common/oas32Utils'),

  PATH_WEBHOOK = 'path~webhook',
  ALLOWED_HTTP_METHODS = {
    get: true,
    head: true,
    post: true,
    put: true,
    patch: true,
    delete: true,
    connect: true,
    options: true,
    trace: true
  },

  STANDARD_HTTP_METHODS = _.keys(ALLOWED_HTTP_METHODS),

  /**
   * Returns operations defined on the path item (including OAS 3.2 `query` and
   * `additionalOperations`) as a list of { method, requestMethod, operation }.
   * The path item is not modified.
   *
   * @param {Object} pathItem - The resolved Path Item Object
   * @param {Boolean} is32 - whether the spec is OAS 3.2.x
   * @returns {Array<Object>} operations
   */
  getPathOperations = function (pathItem, is32) {
    return getPathItemOperations(pathItem, STANDARD_HTTP_METHODS, is32);
  },

  _generateTreeFromPathsV2 = function (context, openapi, { includeDeprecated }, is32) {
    /**
     * We will create a unidirectional graph
     */
    let tree = new Graph();

    tree.setNode('root:collection', {
      type: 'collection',
      data: {},
      meta: {}
    });

    /**
     * Get all the paths sorted in desc order.
     */
    const paths = Object.keys(openapi.paths);

    if (_.isEmpty(paths)) {
      return tree;
    }

    _.forEach(paths, function (completePath) {
      let pathSplit = completePath === '/' ? [completePath] : _.compact(completePath.split('/'));

      /**
       * /user
       * /team
       * /hi
       * /bye
       *
       * In this scenario, always create a base folder for the path
       * and then add and link the request inside the created folder.
       */
      if (pathSplit.length === 1) {
        let methods = openapi.paths[completePath];

        if (methods && methods.$ref) {
          methods = resolveRefFromSchema(context, methods.$ref);
        }

        _.forEach(getPathOperations(methods, is32), function ({ method, requestMethod, operation: data }) {

          /**
           * include deprecated handling.
           * If true, add in the postman collection. If false ignore the request.
           */
          if (!includeDeprecated && data.deprecated) {
            return;
          }

          if (!tree.hasNode(`path:folder:${pathSplit[0]}`)) {
            tree.setNode(`path:folder:${pathSplit[0]}`, {
              type: 'folder',
              meta: {
                name: pathSplit[0],
                path: pathSplit[0],
                pathIdentifier: pathSplit[0]
              },
              data: {}
            });

            tree.setEdge('root:collection', `path:folder:${pathSplit[0]}`);
          }

          tree.setNode(`path:request:${pathSplit[0]}:${method}`, {
            type: 'request',
            data: {},
            meta: {
              path: completePath,
              method: method,
              requestMethod: requestMethod,
              pathIdentifier: pathSplit[0]
            }
          });

          tree.setEdge(`path:folder:${pathSplit[0]}`, `path:request:${pathSplit[0]}:${method}`);
        });
      }

      else {
        _.forEach(pathSplit, function (path, index) {
          let previousPathIdentified = pathSplit.slice(0, index).join('/'),
            pathIdentifier = pathSplit.slice(0, index + 1).join('/');

          if ((index + 1) === pathSplit.length) {
            let methods = openapi.paths[completePath];

            if (methods && methods.$ref) {
              methods = resolveRefFromSchema(context, methods.$ref);
            }

            _.forEach(getPathOperations(methods, is32), function ({ method, requestMethod, operation: data }) {

              /**
               * include deprecated handling.
               * If true, add in the postman collection. If false ignore the request.
               */
              if (!includeDeprecated && data.deprecated) {
                return;
              }

              /**
               * If it is the last node,
               * it might happen that this exists as a folder.
               *
               * If yes add a request inside that folder else
               * add as a request on the previous path idendified which will be a folder.
               */
              if (!tree.hasNode(`path:folder:${pathIdentifier}`)) {
                tree.setNode(`path:folder:${pathIdentifier}`, {
                  type: 'folder',
                  meta: {
                    name: path,
                    path: path,
                    pathIdentifier: pathIdentifier
                  },
                  data: {}
                });

                tree.setEdge(index === 0 ? 'root:collection' : `path:folder:${previousPathIdentified}`,
                  `path:folder:${pathIdentifier}`);
              }

              tree.setNode(`path:request:${pathIdentifier}:${method}`, {
                type: 'request',
                data: {},
                meta: {
                  path: completePath,
                  method: method,
                  requestMethod: requestMethod,
                  pathIdentifier: pathIdentifier
                }
              });

              tree.setEdge(`path:folder:${pathIdentifier}`, `path:request:${pathIdentifier}:${method}`);
            });
          }

          else {
            let fromNode = index === 0 ? 'root:collection' : `path:folder:${previousPathIdentified}`,
              toNode = `path:folder:${pathIdentifier}`;

            if (!tree.hasNode(toNode)) {
              tree.setNode(toNode, {
                type: 'folder',
                meta: {
                  name: path,
                  path: path,
                  pathIdentifier: pathIdentifier
                },
                data: {}
              });
            }

            if (!tree.hasEdge(fromNode, toNode)) {
              tree.setEdge(fromNode, toNode);
            }
          }
        });
      }
    });

    return tree;
  },

  _generateTreeFromTags = function (context, openapi, { includeDeprecated }, is32) {
    let tree = new Graph(),

      tagsByName = _.reduce(openapi.tags, function (acc, data) {
        if (data && typeof data.name === 'string') {
          acc[data.name] = data;
        }
        return acc;
      }, {}),

      tagDescMap = _.reduce(openapi.tags, function (acc, data) {
        if (data && typeof data.name === 'string') {
          acc[data.name] = data.description;
        }
        return acc;
      }, {});

    tree.setNode('root:collection', {
      type: 'collection',
      data: {},
      meta: {}
    });

    /**
     * Returns the parent tag (OAS 3.2 hierarchical tags) if it refers to a known tag.
     * For 3.0/3.1 tags (no `parent`) the chain is always [tagName].
     *
     * @param {String} tagName - tag name
     * @returns {String|undefined} parent tag name
     */
    const getTagParent = function (tagName) {
      const parentName = is32 ? _.get(tagsByName, [tagName, 'parent']) : undefined;

      return _.isString(parentName) && _.has(tagsByName, parentName) ? parentName : undefined;
    };

    /**
     * Builds a chain of nested folder nodes for the given tag (resolving
     * its `parent` ancestry), wires them up, and returns the deepest
     * folder's node id so a request can attach to it.
     */
    const ensureTagFolderChain = function (tagName) {
      const chain = resolveTagParentChain(tagName, getTagParent);
      let parentNodeId = 'root:collection',
        nodeId = `path:${tagName}`;

      for (let index = 0; index < chain.length; index++) {
        const ancestorName = chain[index];
        // Root tag folders keep the flat (3.0/3.1) id. Nested folders use a JSON encoded
        // chain so that tag names containing separators can't collide with a nested chain.
        nodeId = index === 0 ? `path:${ancestorName}` : `tag-chain:${JSON.stringify(chain.slice(0, index + 1))}`;

        if (!tree.hasNode(nodeId)) {
          tree.setNode(nodeId, {
            type: 'folder',
            meta: {
              path: '',
              name: ancestorName,
              description: tagDescMap[ancestorName] || ''
            },
            data: {}
          });
          tree.setEdge(parentNodeId, nodeId);
        }
        parentNodeId = nodeId;
      }

      return nodeId;
    };

    /**
     * Create folders for all the tags present.
     */
    _.forEach(tagDescMap, function (desc, tag) {
      ensureTagFolderChain(tag);
    });

    _.forEach(openapi.paths, function (methods, path) {
      if (methods && methods.$ref) {
        methods = resolveRefFromSchema(context, methods.$ref);
      }

      _.forEach(getPathOperations(methods, is32), function ({ method, requestMethod, operation: data }) {

        /**
         * include deprecated handling.
         * If true, add in the postman collection. If false ignore the request.
         */
        if (!includeDeprecated && data.deprecated) {
          return;
        }

        /**
         * For all the tags present. Make that request to be
         * referenced in all the folder which are applicable.
         */
        if (data.tags && data.tags.length > 0) {
          _.forEach(data.tags, function (tag) {
            // OAS 3.2: walk the tag's `parent` chain so the request lands
            // in the deepest descendant folder of the hierarchy. For 3.0/3.1
            // (no `parent` field) this returns just `path:${tag}`, matching
            // the previous flat layout exactly.
            const tagFolderNodeId = ensureTagFolderChain(tag),
              requestNodeId = `${tagFolderNodeId}:${path}:${method}`;

            tree.setNode(requestNodeId, {
              type: 'request',
              data: {},
              meta: {
                tag: tag,
                path: path,
                method: method,
                requestMethod: requestMethod
              }
            });

            tree.setEdge(tagFolderNodeId, requestNodeId);
          });
        }

        else {
          tree.setNode(`path:${path}:${method}`, {
            type: 'request',
            data: {},
            meta: {
              path: path,
              method: method,
              requestMethod: requestMethod
            }
          });

          tree.setEdge('root:collection', `path:${path}:${method}`);
        }
      });
    });

    return tree;
  },

  /**
   * Generates tree structure with nested folders based on tag order
   * @param {Object} context - Global context object
   * @param {Object} openapi - OpenAPI specification
   * @param {Object} options - Generation options
   * @param {boolean} options.includeDeprecated - Whether to include deprecated operations
   * @returns {Object} - Graph tree with nested folder structure
   */
  _generateTreeFromNestedTags = function (context, openapi, { includeDeprecated }, is32) {
    let tree = new Graph(),

      tagDescMap = _.reduce(openapi.tags, function (acc, data) {
        acc[data.name] = data.description;

        return acc;
      }, {});

    tree.setNode('root:collection', {
      type: 'collection',
      data: {},
      meta: {}
    });

    /**
     * Helper function to create nested folder structure for tags
     * @param {Array} tags - Array of tags to create nested folders for
     * @returns {String} - Node ID of the deepest folder created
     */
    const createNestedFolders = function (tags) {
      if (!tags || tags.length === 0) {
        return 'root:collection';
      }

      let parentNodeId = 'root:collection';

      // Create nested folder structure based on tag order
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i],
          folderPath = tags.slice(0, i + 1).join(':'),
          currentNodeId = `path:${folderPath}`;

        // Create folder node if it doesn't exist
        if (!tree.hasNode(currentNodeId)) {
          tree.setNode(currentNodeId, {
            type: 'folder',
            meta: {
              path: '',
              name: tag,
              description: tagDescMap[tag] || ''
            },
            data: {}
          });

          // Connect to parent (either root collection or previous folder)
          tree.setEdge(parentNodeId, currentNodeId);
        }

        parentNodeId = currentNodeId;
      }

      return parentNodeId;
    };

    _.forEach(openapi.paths, function (methods, path) {
      if (methods && methods.$ref) {
        methods = resolveRefFromSchema(context, methods.$ref);
      }

      _.forEach(getPathOperations(methods, is32), function ({ method, requestMethod, operation: data }) {

        /**
         * include deprecated handling.
         * If true, add in the postman collection. If false ignore the request.
         */
        if (!includeDeprecated && data.deprecated) {
          return;
        }

        /**
         * Create nested folder structure based on tags order
         * and place the request in the deepest folder
         */
        if (data.tags && data.tags.length > 0) {
          // Create nested folder structure and get the deepest folder node
          const deepestFolderNodeId = createNestedFolders(data.tags),
            // Create a unique request node ID (one per operation)
            requestNodeId = `request:${path}:${method}`;

          tree.setNode(requestNodeId, {
            type: 'request',
            data: {},
            meta: {
              tags: data.tags,
              path: path,
              method: method,
              requestMethod: requestMethod
            }
          });

          // Connect request to the deepest folder
          tree.setEdge(deepestFolderNodeId, requestNodeId);
        }
        else {
          // No tags - place request directly under root collection
          tree.setNode(`path:${path}:${method}`, {
            type: 'request',
            data: {},
            meta: {
              path: path,
              method: method,
              requestMethod: requestMethod
            }
          });

          tree.setEdge('root:collection', `path:${path}:${method}`);
        }
      });
    });

    return tree;
  },

  _generateWebhookEndpoints = function (context, openapi, tree, { includeDeprecated }, is32) {
    if (!_.isEmpty(openapi.webhooks)) {
      tree.setNode(`${PATH_WEBHOOK}:folder`, {
        type: 'webhook~folder',
        meta: {
          path: 'webhook~folder',
          name: 'webhook~folder',
          description: ''
        },
        data: {}
      });

      tree.setEdge('root:collection', `${PATH_WEBHOOK}:folder`);
    }

    _.forEach(openapi.webhooks, function (methodData, path) {
      if (methodData && methodData.$ref) {
        methodData = resolveRefFromSchema(context, methodData.$ref);
      }

      _.forEach(getPathOperations(methodData, is32), function ({ method, requestMethod, operation: data }) {

        /**
         * include deprecated handling.
         * If true, add in the postman collection. If false ignore the request.
         */
        if (!includeDeprecated && data.deprecated) {
          return;
        }

        tree.setNode(`${PATH_WEBHOOK}:${path}:${method}`, {
          type: 'webhook~request',
          meta: { path: path, method: method, requestMethod: requestMethod },
          data: {}
        });

        tree.setEdge(`${PATH_WEBHOOK}:folder`, `${PATH_WEBHOOK}:${path}:${method}`);
      });
    });

    return tree;
  };

/**
 * Used to generate a tree skeleton for the openapi which will be a collection
 *
 * @param  {Object} context - Global context object
 * @param  {Object} openapi - openapi schema paths in question
 * @param  {String} stratergy='PATHS'
 *
 * @returns {Object} - tree format
 */
module.exports = function (context, openapi,
  { folderStrategy, includeWebhooks, includeDeprecated, nestedFolderHierarchy }) {
  let skeletonTree;
  const is32 = isOpenApi32(openapi);

  switch (folderStrategy) {
    case 'tags':
      if (nestedFolderHierarchy) {
        skeletonTree = _generateTreeFromNestedTags(context, openapi, { includeDeprecated }, is32);
      }
      else {
        skeletonTree = _generateTreeFromTags(context, openapi, { includeDeprecated }, is32);
      }

      break;

    case 'paths':
      skeletonTree = _generateTreeFromPathsV2(context, openapi, { includeDeprecated }, is32);
      break;

    default:
      throw new Error('generateSkeletonTreeFromOpenAPI~folderStrategy not valid');
  }

  if (includeWebhooks) {
    skeletonTree = _generateWebhookEndpoints(context, openapi, skeletonTree, { includeDeprecated }, is32);
  }

  return skeletonTree;
};
