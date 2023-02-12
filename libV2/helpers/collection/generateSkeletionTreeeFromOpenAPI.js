let _ = require('lodash'),
  Graph = require('graphlib').Graph,

  _generateTreeFromPaths = function (openapi) {
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
          tree.setNode(`path:${pathSplit[0]}:${method}`, {
            type: 'request',
            meta: {
              path: path,
              method: method
            },
            data: {}
          });

          tree.setEdge('root:collection', `path:${pathSplit[0]}:${method}`);
        });
      }

      else {
        _.forEach(pathSplit, function (p, index) {
          /**
           * Always first try to find the node if it already exists.
           * if yes, bail out nothing is needed to be done.
           */
          if (tree.hasNode(`path:${p}`)) {
            return;
          }

          else {
            tree.setNode(`path:${p}`, {
              type: 'folder',
              meta: {
                path: p
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
            tree.setEdge(index === 0 ? 'root:collection' : `path:${[pathSplit[index - 1]]}`, `path:${p}`);
          }
        });

        /**
         * Now for all the methods present in the path, add the request nodes.
         */

        _.forEach(methods, function (data, method) {
          tree.setNode(`path:${_.last(pathSplit)}:${method}`, {
            type: 'request',
            data: {},
            meta: {
              path: path,
              method: method
            }
          });

          tree.setEdge(`path:${_.last(pathSplit)}`, `path:${_.last(pathSplit)}:${method}`);
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
              meta: { path: p },
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
  };

/**
 * Used to generate a tree skeleton for the openapi which will be a collection
 *
 * @param  {Object} openapi - openapi schema paths in question
 * @param  {String} stratergy='PATHS'
 *
 * @returns {Object} - tree format
 */
module.exports = function (openapi, stratergy = 'paths') {
  switch (stratergy) {
    case 'tags':
      return _generateTreeFromTags(openapi);

    case 'paths':
      return _generateTreeFromPaths(openapi);

    default: break;
  }
};
