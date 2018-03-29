var sdk = require('postman-collection'),
		fs = require('fs'),
		jsf = require('json-schema-faker'),
    util = require('./util.js'),
    _ = require('lodash'),
    $RefParser = require('json-schema-ref-parser');
    async = require('async');

// async function resolveOpenApiSpec(openapi){
//   var resolvedSchema = await $RefParser.dereference(openapi);
//   return resolvedSchema;
// }

var converter = {

  staticFolder: {},
  POSTMAN: {},

  generateCollection: function(status){
    var folderTree = status.tree,
        openapi = status.spec;

    for(var child in folderTree.root.children){
      this.POSTMAN.collection.items.add(
        util.convertChildToItemGroup(openapi, folderTree.root.children[child])
      );
    }
  },

  resolveOpenApiSpec: async function(openapi){
    var resolvedSchema = await $RefParser.dereference(openapi);
    return resolvedSchema;
  },

  convert: function (data, callback){
    // console.log("tuhin",data);
    var validation = util.parseSpec(data),
        openapi = {},
        spec,
        mycollection,
        description,
        contact,
        folderTree,
        noVarUrl, 
        deRefObj = {},
        baseUri;

    if(!validation.result){
      callback(validation);
    }

    //TODO - Have to handle global level security scheme

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
        version: openapi.info.version,
      },
    });

    // adding the collection variables for all the necessary root level variables

    this.POSTMAN.collection = util.addCollectionVariables(
                                this.POSTMAN.collection,
                                openapi.baseUrlVariables,
                                'base-url',
                                openapi.baseUrl
                              );

    // if(openapi.baseUrlVariables){
    //   _.forOwn(openapi.baseUrlVariables, (value, key) => {
    //     this.POSTMAN.collection.variables.add(new sdk.Variable({
    //       id: key,
    //       value: value.default || '',
    //       description: value.description + (value.enum || ''),
    //     }));
    //   });
    // } else {
    //    this.POSTMAN.collection.variables.add(new sdk.Variable({
    //     id: 'base-url',
    //     value: openapi.baseUrl,
    //     type: 'string', 
    //     description: openapi.servers[0].description,
    //   }));
    // }

    // adding the collection description
    description = openapi.info.description;
    
    if(openapi.info.contact){
      contact = 'Name : ' + openapi.info.contact.name + '\n' + 'Email : ' + openapi.info.contact.email +'\n';
      description += '\nContact Support + \n{' + '\n' + contact + '\n}'
    }
     
    this.POSTMAN.collection.describe(description);
    
    // the main callback exists in an asynchronous context,
    this.resolveOpenApiSpec(openapi).then((fromResolve) => {
      let status = {};
      let folderObj = util.generateTrieFromPaths(fromResolve);

      status = {
        spec: fromResolve,
        tree: folderObj.tree,
      }
      // adding path level variables which would be used
      if(folderObj.variables){
        _.forEach(folderObj.variables, (collectionVariable) => {
          this.POSTMAN.collection = util.addCollectionVariables(
                                      this.POSTMAN.collection,
                                      collectionVariable,
                                      'path-level-uri'
                                    );
        });
      }
      
      this.generateCollection(status);
      callback({
        result: true,
        collection: this.POSTMAN.collection,
      });
    }).catch((err) => {
      callback({
        result: false,
        reason: err,
      });
    });
  }
}

// module.exports = converter;
module.exports = function(json, callback){
  converter.convert(json, callback);
}
