let _ = require('lodash'),
  Graph = require('graphlib').Graph,
  { resolveRefFromSchema } = require('../../schemaUtils'),

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
    trace: true,
    // OAS 3.2 introduces the `query` HTTP method as an idempotent, body-bearing,
    // GET-like operation for complex search endpoints. The Postman SDK supports
    // arbitrary HTTP methods, so we list it alongside the standard set.
    // See https://spec.openapis.org/oas/v3.2.0.html (Path Item Object).
    query: true
  },

  /**
   * Folds OAS 3.2's `additionalOperations` map (custom HTTP methods like
   * PURGE/LINK/UNLINK) into the Path Item Object as if they were standard
   * operations: each `additionalOperations[METHOD]` entry is copied to
   * `pathItem[methodLowercased]` so the rest of the converter can iterate
   * operations uniformly. Keys that already exist on the Path Item (or that
   * collide with another additionalOperations entry of the same lowercased
   * name) are left untouched. The lowercased method name is also registered
   * on `ALLOWED_HTTP_METHODS` as a side effect so the standard tree-walkers
   * pick the operation up.
   *
   * See https://spec.openapis.org/oas/v3.2.0.html (Path Item Object,
   * `additionalOperations` field).
   *
   * @param {Object} pathItem - The resolved Path Item Object
   * @returns {Object} The same path item (mutated when applicable)
   */
  applyAdditionalOperations = function (pathItem) {
    if (!_.isObject(pathItem) || !_.isObject(pathItem.additionalOperations)) {
      return pathItem;
    }

    _.forEach(pathItem.additionalOperations, function (operation, method) {
      if (typeof method !== 'string' || method.length === 0) {
        return;
      }

      const methodLower = method.toLowerCase();
      // Don't clobber a standard operation (or another already-applied custom
      // operation) on the same path item.
      if (_.has(pathItem, methodLower)) {
        return;
      }

      pathItem[methodLower] = operation;
      ALLOWED_HTTP_METHODS[methodLower] = true;
    });

    return pathItem;
  },

  _generateTreeFromPathsV2 = function (context, openapi, { includeDeprecated }) {
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

        applyAdditionalOperations(methods);

        _.forEach(methods, function (data, method) {
          if (!ALLOWED_HTTP_METHODS[method]) {
            return;
          }

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

            applyAdditionalOperations(methods);

            _.forEach(methods, function (data, method) {
              if (!ALLOWED_HTTP_METHODS[method]) {
                return;
              }

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

  /**
   * Resolves OAS 3.2 hierarchical tags by walking each tag's `parent`
   * chain back to the root and returning [rootTag, ..., leafTag]. Cycles
   * and dangling parents are guarded against -- if a parent reference
   * cannot be resolved or a cycle is detected, the chain stops at the
   * deepest valid ancestor and returns from there. Returns the tag's
   * own name in a single-element array when no parent is declared (the
   * common 3.0/3.1 case).
   *
   * See https://spec.openapis.org/oas/v3.2.0.html (Tag Object,
   * `parent` field).
   *
   * @param {string} tagName - The leaf tag's name
   * @param {Object} tagsByName - Map of tag name to Tag Object
   * @returns {Array<string>} Ordered ancestor chain (root first, leaf last)
   */
  resolveTagParentChain = function (tagName, tagsByName) {
    const chain = [],
      seen = new Set();
    let cursor = tagName;

    while (typeof cursor === 'string' && cursor.length > 0) {
      if (seen.has(cursor)) {
        break;
      }
      seen.add(cursor);
      chain.unshift(cursor);

      const parentName = _.get(tagsByName, [cursor, 'parent']);
      if (typeof parentName !== 'string' || parentName.length === 0 || !_.has(tagsByName, parentName)) {
        break;
      }
      cursor = parentName;
    }

    return chain;
  },

  _generateTreeFromTags = function (context, openapi, { includeDeprecated }) {
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
     * Builds a chain of nested folder nodes for the given tag (resolving
     * its `parent` ancestry), wires them up, and returns the deepest
     * folder's node id so a request can attach to it.
     */
    const ensureTagFolderChain = function (tagName) {
      const chain = resolveTagParentChain(tagName, tagsByName);
      let parentNodeId = 'root:collection',
        nodeId = `path:${tagName}`;

      for (let index = 0; index < chain.length; index++) {
        const ancestorName = chain[index];
        nodeId = `path:${chain.slice(0, index + 1).join(':')}`;

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

      applyAdditionalOperations(methods);

      _.forEach(methods, function (data, method) {
        if (!ALLOWED_HTTP_METHODS[method]) {
          return;
        }

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
                method: method
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
              method: method
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
  _generateTreeFromNestedTags = function (context, openapi, { includeDeprecated }) {
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

      applyAdditionalOperations(methods);

      _.forEach(methods, function (data, method) {
        if (!ALLOWED_HTTP_METHODS[method]) {
          return;
        }

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
              method: method
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
              method: method
            }
          });

          tree.setEdge('root:collection', `path:${path}:${method}`);
        }
      });
    });

    return tree;
  },

  _generateWebhookEndpoints = function (context, openapi, tree, { includeDeprecated }) {
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

      _.forEach(methodData, function (data, method) {
        /**
         * include deprecated handling.
         * If true, add in the postman collection. If false ignore the request.
         */
        if (!includeDeprecated && data.deprecated) {
          return;
        }

        tree.setNode(`${PATH_WEBHOOK}:${path}:${method}`, {
          type: 'webhook~request',
          meta: { path: path, method: method },
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

  switch (folderStrategy) {
    case 'tags':
      if (nestedFolderHierarchy) {
        skeletonTree = _generateTreeFromNestedTags(context, openapi, { includeDeprecated });
      }
      else {
        skeletonTree = _generateTreeFromTags(context, openapi, { includeDeprecated });
      }

      break;

    case 'paths':
      skeletonTree = _generateTreeFromPathsV2(context, openapi, { includeDeprecated });
      break;

    default:
      throw new Error('generateSkeletonTreeFromOpenAPI~folderStrategy not valid');
  }

  if (includeWebhooks) {
    skeletonTree = _generateWebhookEndpoints(context, openapi, skeletonTree, { includeDeprecated });
  }

  return skeletonTree;
};
