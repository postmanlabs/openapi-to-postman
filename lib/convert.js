var sdk = require('postman-collection'),
  util = require('./util.js'),
  _ = require('lodash'),

  COLLECTION_NAME = 'OPENAPI 3.0',

  converter = {
    staticFolder: {},
    POSTMAN: {},

    /**
     * Adds items from the status trie as folders into the collection object
     * @param {object} status - status.tree is trie generated from util
     * @returns {null} adds items to postman collection
     */
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

    /**
     * Entry point to convert OpenAPI to a Postman Collection
     * @param {*} data - openapi specification can be json (string or object) or yaml(string)
     * @param {*} options - options to customize
     * @param {function} callback - with error and conversion result
     * @returns {*} callback with err and result
     */
    convert: function (data, options, callback) {
      var validation = util.parseSpec(data),
        openapi = {},
        description,
        contact;

      if (!validation.result) {
        return callback(null, validation);
      }

      // set default options
      util.options = {};
      util.options.requestName = options.hasOwnProperty('requestName') ? options.requestName : 'fallback';
      util.options.schemaFaker = options.hasOwnProperty('schemaFaker') ? options.schemaFaker : true;

      // @TODO - Have to handle global level security scheme

      // Extracing commonly used properties for ease of access
      openapi = validation.openapi;
      openapi.servers = _.isEmpty(openapi.servers) ? [{ url: '/' }] : openapi.servers;
      openapi.securityDefs = _.get(openapi, 'components.securitySchemes', {});
      openapi.baseUrl = _.get(openapi, 'servers[0].url');
      openapi.baseUrlVariables = _.get(openapi, 'servers[0].variables');


      openapi.baseUrl = util.setPathVariablesInUrl(openapi.baseUrl);

      // creating a new instance of the collection
      this.POSTMAN.collection = new sdk.Collection({
        info: {
          name: _.get(openapi, 'info.title', COLLECTION_NAME),
          version: _.get(openapi, 'info.version')
        }
      });
      // adding openapi components into util components
      util.components = openapi.components;

      // adding the collection variables for all the necessary root level variables
      util.convertToPmCollectionVariables(
        openapi.baseUrlVariables,
        'baseUrl',
        openapi.baseUrl
      ).forEach((element) => {
        this.POSTMAN.collection.variables.add(element);
      });

      // adding the collection description
      description = _.get(openapi, 'info.description');
      if (_.get(openapi, 'info.contact')) {
        contact = 'Name : ' + openapi.info.contact.name + '\n\nEmail : ' + openapi.info.contact.email + '\n';
        description += '\n\nContact Support: \n{\n\n' + contact + '\n}';
      }
      this.POSTMAN.collection.describe(description);

      let specWrapper = {},

        /**
         We need a trie because the decision of whether or not a node
        is a folder or request can only be made once the whole trie is generated
        */
        folderObj = util.generateTrieFromPaths(openapi);

      specWrapper = {
        spec: openapi,
        tree: folderObj.tree
      };

      // adding path level variables which would be used
      if (folderObj.variables) {
        _.forOwn(folderObj.variables, (server, key) => {

          util.convertToPmCollectionVariables(
            server.variables,
            key, // path+'Url'
            util.setPathVariablesInUrl(server.url)
          ).forEach((element) => {
            this.POSTMAN.collection.variables.add(element);
          });
        });
      }

      // Adds items from the trie into the collection
      this.generateCollection(specWrapper);

      process.nextTick(() => {
        return callback(null, {
          result: true,
          output: [{
            type: 'collection',
            data: this.POSTMAN.collection.toJSON()
          }]
        });
      });
    }
  };

// module.exports = converter;
module.exports = function(json, options, callback) {
  try {
    converter.convert(json, options, callback);
  }
  catch (e) {
    callback(e.toString());
  }
};
