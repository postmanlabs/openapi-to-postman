var expect = require('chai').expect,
    Converter = require('../../index.js'),
    Utils = require('../../lib/util.js'),
    schemaValidator = require('jsonschema').Validator;
    fs = require('fs'),
    sdk = require('postman-collection'),
    path = require('path'),
    COLLECTION_SCHEMA_PATH = path.join(__dirname, '../../schemas/collection-schema-v2.1.0.json'),
    VALID_OPENAPI_PATH = '../data/valid_openapi',
    INVALID_OPENAPI_PATH = '../data/invalid_openapi';

/* Utility function Unit tests */
describe('------------------------------ UTILITY FUNCTION TESTS ------------------------------', function (){
  describe('addHeaders Function', function(){
      it('Should add the headers', function (){
        var item = new sdk.Item({
          name: 'postman-item',
          request: {
            url: 'https://petstore.swagger.io/api'
          }
        });
        var headers = [
          {
            name: 'X-Header-One',
            description: 'Header1',  
          },
          {
            name: 'X-Header-Two',
            description: 'Header2', 
          },
          {
            name: 'X-Header-Three',
            description: 'Header3',
          }
        ],
        postmanHeaders =  [
        {
          'key': 'X-Header-One',
          'value': '',
          'description': 'Header1'
        },
        {
          'key': 'X-Header-Two',
          'value': '',
          'description': 'Header2'
        },
        {
          'key': 'X-Header-Three', 
          'value': '',
          'description': 'Header3'
        }
      ];
      let updatedItem = Utils.addHeaders(item, headers);
      expect(JSON.stringify(updatedItem.request.headers.members)).to.eql(JSON.stringify(postmanHeaders));
    });
  
    it('Should return the original item object if no headers are passed', function (){
      var item = new sdk.Item({
        name: 'postman-item',
        request: {
          url: 'https://petstore.swagger.io/api'
        }
      });
      let updatedItem = Utils.addHeaders(item, []);
      expect(updatedItem).to.deep.equal(item);
    });
  });
});


/* Plugin Interface Tests */
describe('------------------------------ INTERFACE FUNCTION TESTS ------------------------------', function (){
  describe('The converter must indentify valid specifications', function (){
    var pathPrefix = VALID_OPENAPI_PATH,
        sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));
    
    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);
  
      it(specPath + ' is valid ', () => {
        var openapi = fs.readFileSync(specPath, 'utf8'),
            validationResult = Converter.validate(openapi);
    
        expect(validationResult.result).to.equal(true);
        
      });
    });
  });
  
  describe('The converter must identify invalid specifications', function (){
    var pathPrefix = INVALID_OPENAPI_PATH,
        sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));
    
    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);
  
      it(specPath + ' is invalid ', () => {
        var openapi = fs.readFileSync(specPath, 'utf8'),
            validationResult = Converter.validate(openapi);
    
        expect(validationResult.result).to.equal(false);
        
      });
    });
  });
  
  describe('The converter must generate a collection conforming to the schema', function (){
    var pathPrefix = VALID_OPENAPI_PATH,
        sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix)),
        schema = fs.readFileSync(COLLECTION_SCHEMA_PATH, 'utf8'),
        validator = new schemaValidator(),
        validationResult,
        collectionInstance;
    
    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);
      
      it('Should generate collection conforming to schema for and fail if not valid ' + specPath, function(){
        var openapi = fs.readFileSync(specPath, 'utf8');
        Converter.convert(openapi, (status) => {
          if(!status.result){
            expect()
          } else {
            validationResult = validator.validate(status.collection, schema);
            expect(validationResult.valid).to.equal(true);
          }
        });
      });
    });
  });
});

