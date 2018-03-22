var sdk = require('postman-collection'),
		fs = require('fs'),
		jsf = require('json-schema-faker'),
    util = require('./util.js'),
    _ = require('lodash'),
    $RefParser = require('json-schema-ref-parser');
    async = require('async');

// resolving all cross references within the components object
// function deRefComponents(componentObj , openapi, folderTree, cb){
//   $RefParser.dereference(componentObj).then((resolvedComp) => {
//     openapi.components = resolvedComp.components;
//     cb(null, openapi, folderTree);
//   }).catch((err) => {
//     cb(err, null, null);
//   });
// }

async function getDeRefSchemas(openapi){
  var resolvedSchema = await $RefParser.dereference(openapi);
  return resolvedSchema;
}

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

  convert: function (data, callback){
    // console.log("tuhin",data);
    var validation = util.parseSpec(data),
        openapi = {},
        spec,
        mycollection,
        description,
        contact,
        folderTree,
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
  
    // creating a new instance of the collection
    this.POSTMAN.collection = new sdk.Collection({
      info: {
        name: openapi.info.title,
        version: openapi.info.version,
      },
    });

    // @todo have to add the base url in a collection variable
    this.POSTMAN.collection.variables.add(new sdk.Variable({
        id: 'base-url',
        value: openapi.baseUrl,
        type: 'string', 
        description: openapi.servers[0].description,
    }));

    // adding the collection description
    description = openapi.info.description;
    
    if(openapi.info.contact){
      contact = 'Name : ' + openapi.info.contact.name + '\n' + 'Email : ' + openapi.info.contact.email +'\n';
      description += '\nContact Support + \n{' + '\n' + contact + '\n}'
    }
     
    this.POSTMAN.collection.describe(description);

    // getting the folder structure from the paths object
    
    // the main callback exists in an asynchronous context,
    getDeRefSchemas(openapi).then((fromResolve) => {
      let status = {};
      folderTree = util.generateTrieFromPaths(fromResolve);

      status = {
        spec: fromResolve,
        tree: folderTree,
      }

      fs.writeFileSync('trie.json', JSON.stringify(status.tree, null, 4), (err) => {
        if(err){
          console.log('not done');
        } else {
          console.log('done');
        }
      });

      fs.writeFileSync('data.json', JSON.stringify(status.spec, null, 4), (err) => {
        if(err){
          console.log('not done');
        } else {
          console.log('done');
        }
      });
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
    })
  }
}

module.exports = converter;

