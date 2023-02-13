/* eslint-disable one-var */
const _ = require('lodash'),
  sdk = require('postman-collection'),
  GraphLib = require('graphlib'),
  generateSkeletonTreeFromOpenAPI = require('./helpers/collection/generateSkeletionTreeeFromOpenAPI'),
  generateCollectionFromOpenAPI = require('./helpers/collection/generateCollectionFromOpenAPI'),
  generateFolderFromOpenAPI = require('./helpers/folder/generateFolderForOpenAPI');
const { resolvePostmanRequest } = require('./schemaUtils');

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

            requestObject = new sdk.Item(request);

            _.forEach(request.request.responses, (response) => {
              // replace 'X' char with '0'
              response.code = response.code.replace(/X|x/g, '0');
              response.code = response.code === 'default' ? 500 : _.toSafeInteger(response.code);

              requestObject.responses.add(new sdk.Response({
                name: response.name,
                code: response.code,
                header: response.headers,
                body: response.body,
                originalRequest: response.originalRequest
              }));
            });
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
  }
};
