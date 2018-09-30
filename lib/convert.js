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
        return callback(validation);
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
      // adding openapi components into util components
      util.components = openapi.components;
      // adding the collection variables for all the necessary root level variables

      this.POSTMAN.collection = util.addCollectionVariables(
        this.POSTMAN.collection,
        openapi.baseUrlVariables,
        'baseUrl',
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
          _.forOwn(folderObj.variables, (server, key) => {
            this.POSTMAN.collection = util.addCollectionVariables(
              this.POSTMAN.collection,
              server.variables,
              key, // 'path-level-uri'
              server.url.replace(/{/g, ':').replace(/}/g, '')
            );
          });
          // _.forEach(folderObj.variables, (collectionVariable) => {
          //   this.POSTMAN.collection = util.addCollectionVariables(
          //     this.POSTMAN.collection,
          //     collectionVariable,
          //     'path-level-uri'
          //   );
          // });
        }

        this.generateCollection(specWrapper);

        process.nextTick(() => {
          return callback(null, {
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
        return callback(e);
      }
    }
  };

// module.exports = converter;
module.exports = function(json, options, callback) {
  converter.convert(json, options, callback);
};
