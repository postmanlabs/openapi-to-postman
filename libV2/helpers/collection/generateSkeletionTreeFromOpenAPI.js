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

  _generateTreeFromPaths = function (openapi, { includeDeprecated }) {
    /**
     * We will create a unidirectional graph
     */
    let tree = new Graph();

    tree.setNode('root:collection', {
      type: 'collection',
      data: {},
      meta: {}
    });

    _.forEach(openapi.paths, function (methods, path) {
      let pathSplit = _.compact(path.split('/'));

      // if after path split we just have one entry
      // that means no folders need to be generated.
      // check for all the methods inside it and expand.
      if (pathSplit.length === 1) {
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

          tree.setNode(`path:${pathSplit[0]}:${method}`, {
            type: 'request',
            meta: {
              path: path,
              method: method,
              pathIdentifier: pathSplit[0]
            },
            data: {}
          });

          tree.setEdge('root:collection', `path:${pathSplit[0]}:${method}`);
        });
      }

      else {
        _.forEach(pathSplit, function (p, index) {
          let previousPathIdentified = pathSplit.slice(0, index).join('/'),
            pathIdentifier = pathSplit.slice(0, index + 1).join('/');

          /**
           * Always first try to find the node if it already exists.
           * if yes, bail out nothing is needed to be done.
           */
          if (tree.hasNode(`path:${pathIdentifier}`)) {
            return;
          }

          else {
            tree.setNode(`path:${pathIdentifier}`, {
              type: 'folder',
              meta: {
                path: p,
                pathIdentifier: pathIdentifier
              },
              data: {}
            });

            /**
             * If index is 0, this means that we are on the first level.
             * Hence it is folder/request to be added on the first level
             *
             * If after the split we have more than one paths, then we need
             * to add to the previous node.
             */
            tree.setEdge(index === 0 ? 'root:collection' : `path:${previousPathIdentified}`, `path:${pathIdentifier}`);
          }
        });

        /**
         * Now for all the methods present in the path, add the request nodes.
         */

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

          // join till the last path i.e. the folder.
          let previousPathIdentified = pathSplit.slice(0, (pathSplit.length)).join('/'),
            pathIdentifier = `${pathSplit.join('/')}:${method}`;

          tree.setNode(`path:${pathIdentifier}`, {
            type: 'request',
            data: {},
            meta: {
              path: path,
              method: method,
              pathIdentifier: pathIdentifier
            }
          });

          tree.setEdge(`path:${previousPathIdentified}`, `path:${pathIdentifier}`);
        });
      }
    });

    return tree;
  },

  _generateTreeFromTags = function (openapi) {
    let tree = new Graph();

    tree.setNode('root:collection', {
      type: 'collection',
      data: {},
      meta: {}
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

        tree.setNode(`path:${path}:${method}`, {
          type: 'request',
          data: {},
          meta: {
            path: path,
            method: method
          }
        });

        /**
         * Pick the first tag. That needs to become a folder.
         * If the folder does not exist, create and set the edge b/w folder and request
         *
         * else if tags not present set the edge b/w collection and request
         */
        if (data.tags && data.tags.length > 0) {
          let tag = data.tags[0];

          if (!tree.hasNode(`path:${tag}`)) {
            tree.setNode(`path:${tag}`, {
              type: 'folder',
              meta: { path: path },
              data: {}
            });

            tree.setEdge('root:collection', `path:${tag}`);
          }

          tree.setEdge(`path:${tag}`, `path:${path}:${method}`);
        }
        else {
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
        meta: { path: 'webhook~folder' },
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
module.exports = function (openapi, { folderStrategy, includeWebhooks, includeDeprecated }) {
  let skeletonTree;

  switch (folderStrategy) {
    case 'tags':
      skeletonTree = _generateTreeFromTags(openapi, { includeDeprecated });
      break;

    case 'paths':
      skeletonTree = _generateTreeFromPaths(openapi, { includeDeprecated });
      break;

    default:
      throw new Error('generateSkeletonTreeFromOpenAPI~folderStrategy not valid');
  }

  if (includeWebhooks) {
    skeletonTree = _generateWebhookEndpoints(openapi, skeletonTree, { includeDeprecated });
  }

  return skeletonTree;
};
