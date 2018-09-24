var sdk = require('postman-collection'),
  util = require('./util.js'),
  _ = require('lodash'),
  converter = {

    staticFolder: {},
    POSTMAN: {},

    generateCollection: function(status) {
      var folderTree = status.tree,
        openapi = status.spec,
        child;

      util.components = openapi.components;
      for (child in folderTree.root.children) {
        // postman request or folder is added if atleast one request present in that sub child`s tree
        if (folderTree.root.children.hasOwnProperty(child) && folderTree.root.children[child].requestCount > 0) {
          this.POSTMAN.collection.items.add(
            util.convertChildToItemGroup(openapi, folderTree.root.children[child])
          );
        }
      }
    },

    convert: function (data, options, callback) {
      var validation = util.parseSpec(data),
        openapi = {},
        description,
        contact;

      if (!validation.result) {
        callback(validation);
      }
      // options
      util.options = {};
      util.options.requestName = options.hasOwnProperty('requestName') ? options.requestName : 'fallback';
      util.options.schemaFaker = options.hasOwnProperty('schemaFaker') ? options.schemaFaker : true;

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
        contact = 'Name : ' + openapi.info.contact.name + '\n\nEmail : ' + openapi.info.contact.email + '\n';
        description += '\n\nContact Support: \n{\n\n' + contact + '\n}';
      }

      this.POSTMAN.collection.describe(description);

      try {
        let specWrapper = {},
          folderObj = util.generateTrieFromPaths(openapi);

        specWrapper = {
          spec: openapi,
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

        this.generateCollection(specWrapper);

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
      }
      catch (e) {
        callback(e);
      }
    }
  };

// module.exports = converter;
module.exports = function(json, options, callback) {
  converter.convert(json, options, callback);
};
