var sdk = require('postman-collection'),
  util = require('./util.js'),
  _ = require('lodash'),
  $RefParser = require('json-schema-ref-parser'),
  converter = {

    staticFolder: {},
    POSTMAN: {},

    generateCollection: function(status) {
      var folderTree = status.tree,
        openapi = status.spec,
        child;

      for (child in folderTree.root.children) {
        if (folderTree.root.children.hasOwnProperty(child)) {
          this.POSTMAN.collection.items.add(
            util.convertChildToItemGroup(openapi, folderTree.root.children[child])
          );
        }
      }
    },

    resolveOpenApiSpec: async function(openapi) {
      var resolvedSchema = await $RefParser.dereference(openapi);
      return resolvedSchema;
    },

    convert: function (data, callback) {
      var validation = util.parseSpec(data),
        openapi = {},
        description,
        contact;

      if (!validation.result) {
        callback(validation);
      }

      // TODO - Have to handle global level security scheme

      // changing the openapi spec for ease of access
      openapi = validation.openapi;
      openapi.securityDefs = openapi.components.securitySchemes || {};
      openapi.baseUrl = openapi.servers[0].url;
      openapi.baseUrlVariables = openapi.servers[0].variables;

      // handling path templating in request url if any
      openapi.baseUrl = openapi.baseUrl.replace(/{/g, ':').replace(/}/g, '');


      // creating a new instance of the collection
      this.POSTMAN.collection = new sdk.Collection({
        info: {
          name: openapi.info.title,
          version: openapi.info.version
        }
      });

      // adding the collection variables for all the necessary root level variables

      this.POSTMAN.collection = util.addCollectionVariables(
        this.POSTMAN.collection,
        openapi.baseUrlVariables,
        'base-url',
        openapi.baseUrl
      );
      // adding the collection description
      description = openapi.info.description;

      if (openapi.info.contact) {
        contact = 'Name : ' + openapi.info.contact.name + '\nEmail : ' + openapi.info.contact.email + '\n';
        description += '\nContact Support + \n{\n' + contact + '\n}';
      }

      this.POSTMAN.collection.describe(description);

      // the main callback exists in an asynchronous context,
      this.resolveOpenApiSpec(openapi).then((fromResolve) => {
        let status = {};
        folderObj = util.generateTrieFromPaths(fromResolve);

        status = {
          spec: fromResolve,
          tree: folderObj.tree
        };
        // adding path level variables which would be used
        if (folderObj.variables) {
          _.forEach(folderObj.variables, (collectionVariable) => {
            this.POSTMAN.collection = util.addCollectionVariables(
              this.POSTMAN.collection,
              collectionVariable,
              'path-level-uri'
            );
          });
        }

        this.generateCollection(status);

        process.nextTick(() => {
          callback(null, {
            result: true,
            output: [
              {
                type: 'collection',
                data: this.POSTMAN.collection.toJSON()
              }
            ]
          });
        });
      }, (err) => {
        return callback(err);
      }).catch((err) => {
        return callback(err);
      });
    }
  };

// module.exports = converter;
module.exports = function(json, callback) {
  converter.convert(json, callback);
};
