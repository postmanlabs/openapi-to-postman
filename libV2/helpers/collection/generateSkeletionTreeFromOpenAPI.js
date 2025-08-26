let _ = require('lodash'),
  Graph = require('graphlib').Graph,

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


  _generateTreeFromPathsV2 = function (openapi, { includeDeprecated }) {
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

  _generateTreeFromTags = function (openapi, { includeDeprecated }) {
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
     * Create folders for all the tags present.
     */
    _.forEach(tagDescMap, function (desc, tag) {
      if (tree.hasNode(`path:${tag}`)) {
        return;
      }

      /**
       * Generate a folder node and attach to root of collection.
       */
      tree.setNode(`path:${tag}`, {
        type: 'folder',
        meta: {
          path: '',
          name: tag,
          description: tagDescMap[tag]
        },
        data: {}
      });

      tree.setEdge('root:collection', `path:${tag}`);
    });

    _.forEach(openapi.paths, function (methods, path) {
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
            tree.setNode(`path:${tag}:${path}:${method}`, {
              type: 'request',
              data: {},
              meta: {
                tag: tag,
                path: path,
                method: method
              }
            });

            // safeguard just in case there is no folder created for this tag.
            if (!tree.hasNode(`path:${tag}`)) {
              tree.setNode(`path:${tag}`, {
                type: 'folder',
                meta: {
                  path: path,
                  name: tag,
                  description: tagDescMap[tag]
                },
                data: {}
              });

              tree.setEdge('root:collection', `path:${tag}`);
            }

            tree.setEdge(`path:${tag}`, `path:${tag}:${path}:${method}`);
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
   * @param {Object} openapi - OpenAPI specification
   * @param {Object} options - Generation options
   * @param {boolean} options.includeDeprecated - Whether to include deprecated operations
   * @returns {Object} - Graph tree with nested folder structure
   */
  _generateTreeFromNestedTags = function (openapi, { includeDeprecated }) {
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

  _generateWebhookEndpoints = function (openapi, tree, { includeDeprecated }) {
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
 * @param  {Object} openapi - openapi schema paths in question
 * @param  {String} stratergy='PATHS'
 *
 * @returns {Object} - tree format
 */
module.exports = function (openapi, { folderStrategy, includeWebhooks, includeDeprecated, nestedFolderHierarchy }) {
  let skeletonTree;

  switch (folderStrategy) {
    case 'tags':
      if (nestedFolderHierarchy) {
        skeletonTree = _generateTreeFromNestedTags(openapi, { includeDeprecated });
      }
      else {
        skeletonTree = _generateTreeFromTags(openapi, { includeDeprecated });
      }

      break;

    case 'paths':
      skeletonTree = _generateTreeFromPathsV2(openapi, { includeDeprecated });
      break;

    default:
      throw new Error('generateSkeletonTreeFromOpenAPI~folderStrategy not valid');
  }

  if (includeWebhooks) {
    skeletonTree = _generateWebhookEndpoints(openapi, skeletonTree, { includeDeprecated });
  }

  return skeletonTree;
};
