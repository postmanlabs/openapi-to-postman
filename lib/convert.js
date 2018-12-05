// This is the default collection name if one can't be inferred from the OpenAPI spec
const COLLECTION_NAME = 'Converted from OpenAPI';

var sdk = require('postman-collection'),
  util = require('./util.js'),
  _ = require('lodash'),

  // This provides the base class for
  // errors with the input OpenAPI spec
  OpenApiErr = require('./error.js'),

  converter = {
    /*
     * This holds the generated collection
     * and anything we decide to export in the future
     */
    generatedStore: {},

    /**
     * Adds items from the trie as folders (or leaf requests) into the collection object
     * @param {object} specWrapper - specWrapper.tree is trie generated from util
     * @returns {void}
     */
    generateCollection: function(specWrapper) {
      var folderTree = specWrapper.tree, // this is the trie we generate (as a scaffold to the collection)
        openapi = specWrapper.spec, // this is the JSON-version of the openAPI spec
        child;

      for (child in folderTree.root.children) {
        // A Postman request or folder is added if atleast one request is present in that sub-child's tree
        // requestCount is a property added to each node (folder/request) while constructing the trie
        if (folderTree.root.children.hasOwnProperty(child) && folderTree.root.children[child].requestCount > 0) {
          this.generatedStore.collection.items.add(
            util.convertChildToItemGroup(openapi, folderTree.root.children[child])
          );
        }
      }
    },

    /**
     * Entry point to convert OpenAPI to a Postman Collection
     * @param {*} data - OpenAPI specification that can be json (string or object) or yaml (string)
     * @param {*} options - options to customize TODO: OUTLINE THESE
     * @param {function} callback - with error and conversion result
     * @returns {void}
     */
    convert: function (data, options, callback) {
      var validation = util.parseSpec(data),
        openapi = {},
        description,
        contact;

      if (!validation.result) {
        // basic spec validation failed
        return callback(null, validation);
      }

      // set default options
      util.options = {
        requestNameSource: (options.hasOwnProperty('requestNameSource') ? options.requestNameSource : 'fallback'),
        schemaFaker: (options.hasOwnProperty('schemaFaker') ? options.schemaFaker : true)
      };

      // @TODO - Have to handle global level security scheme

      // Extracing commonly used properties for ease of access throughout the importer
      openapi = validation.openapi;
      openapi.servers = _.isEmpty(openapi.servers) ? [{ url: '/' }] : openapi.servers;
      openapi.securityDefs = _.get(openapi, 'components.securitySchemes', {});
      openapi.baseUrl = _.get(openapi, 'servers.0.url');
      if (!openapi.baseUrl) {
        throw new OpenApiErr('The OpenAPI spec should have a valid URL in each servers object');
      }
      openapi.baseUrlVariables = _.get(openapi, 'servers.0.variables');

      // Fix {scheme} and {path} vars in the URL to :scheme and :path
      openapi.baseUrl = util.fixPathVariablesInUrl(openapi.baseUrl);

      // Creating a new instance of a Postman collection
      // All generated folders and requests will go inside this
      this.generatedStore.collection = new sdk.Collection({
        info: {
          name: _.get(openapi, 'info.title', COLLECTION_NAME),
          version: _.get(openapi, 'info.version')
        }
      });

      // saving in util for global access
      util.components = openapi.components;

      // ---- Collection Variables ----
      // adding the collection variables for all the necessary root level variables
      // and adding them to the collection variables
      util.convertToPmCollectionVariables(
        openapi.baseUrlVariables,
        'baseUrl',
        openapi.baseUrl
      ).forEach((element) => {
        this.generatedStore.collection.variables.add(element);
      });


      // ---- Collection Description ----
      // Adding the collection description and using any relevant contact info
      description = _.get(openapi, 'info.description');
      if (_.get(openapi, 'info.contact')) {
        contact = 'Name : ' + openapi.info.contact.name + '\n\nEmail : ' + openapi.info.contact.email + '\n';
        description += '\n\nContact Support: \n{\n\n' + contact + '\n}';
      }
      this.generatedStore.collection.describe(description);


      // ---- Collection Structure and scaffolding ----
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

      // these are variables identified at the collection level
      // they need to be added explicitly to collection variables
      // deeper down in the trie, variables will be added directly to folders
      // If the folderObj.variables have their own variables, we add
      // them to the collectionVars
      if (folderObj.variables) {
        _.forOwn(folderObj.variables, (server, key) => {
          // TODO: Figure out what this does
          util.convertToPmCollectionVariables(
            server.variables, // these are path variables in the server block
            key, // the name of the variable
            util.fixPathVariablesInUrl(server.url)
          ).forEach((element) => {
            this.generatedStore.collection.variables.add(element);
          });
        });
      }

      // Adds items from the trie into the collection
      this.generateCollection(specWrapper);

      return callback(null, {
        result: true,
        output: [{
          type: 'collection',
          data: this.generatedStore.collection.toJSON()
        }]
      });
    }
  };


module.exports = function(json, options, callback) {
  try {
    converter.convert(json, options, callback);
  }
  catch (e) {
    if (e instanceof OpenApiErr) {
      // Something wrong with the spec
      callback(null, {
        result: false,
        reason: e.message
      });
    }
    else {
      // Unhandled exception, rethrow
      callback(e);
    }
  }
};
