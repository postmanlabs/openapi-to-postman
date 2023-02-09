/* eslint-disable one-var */
const _ = require('lodash'),
  GraphLib = require('graphlib'),
  generateSkeletonTreeFromOpenAPI = require('./helpers/collection/generateSkeletionTreeeFromOpenAPI'),
  generateCollectionFromOpenAPI = require('./helpers/collection/generateCollectionFromOpenAPI'),
  generateFolderFromOpenAPI = require('./helpers/folder/generateFolderForOpenAPI');

module.exports = {
  convertV2: function (context, cb) {
    /**
     * Start generating the Bare bone tree that should exist for the schema
     */

    let collectionTree = generateSkeletonTreeFromOpenAPI(context.openapi, context.computedOptions.folderStrategy);

    /**
     * Do post order traversal so we get the request nodes first and generate the request object
     */

    let postOrderTraversal = GraphLib.alg.postorder(collectionTree, 'root:collection');

    /**
     * individually start generating the folder, request, collection
     * and keep adding to the collection tree.
     */
    _.forEach(postOrderTraversal, function (nodeIdentified) {
      let node = collectionTree.node(nodeIdentified);

      switch (node.type) {
        case 'request': {
          break;
        }

        case 'folder': {
          collectionTree.setNode(nodeIdentified,
            Object.assign(node, generateFolderFromOpenAPI(context, nodeIdentified)));

          break;
        }

        case 'collection': {
          collectionTree.setNode(nodeIdentified,
            Object.assign(node, generateCollectionFromOpenAPI(context, nodeIdentified)));

          break;
        }

        default: break;
      }
    });

    return cb();
  }
};
