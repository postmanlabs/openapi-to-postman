const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  OPENAPI_31_FOLDER = '../data/valid_openapi31X',
  OPENAPI_31_COLLECTIONS = '../data/31CollectionTransactions',
  _ = require('lodash');
describe('Testing openapi 3.1 schema pack convert', function() {
  it('Should convert from openapi 3.1 spec to postman collection -- multiple refs', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/multiple_refs.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
    });
  });

  it('Should interpret binary types correctly and set mode as file in body -- petstore', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/petstore.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input),
      expectedValue = JSON.stringify({
        mode: 'file'
      });

    converter.convert((err, result) => {
      let binaryTypedElement = result.output[0].data.item.find((item) => {
        return item.name === 'uploads an image';
      });
      expect(err).to.be.null;
      expect(JSON.stringify(binaryTypedElement.request.body)).to.be.equal(expectedValue);
    });
  });

  it('Should convert from openapi 3.1 spec to postman collection -- multiple refs outer required', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/multiple_refs_outer_required.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
    });
  });

  it('Should convert from openapi 3.1 spec to postman collection -- accountService', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/accountService.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
    });
  });

  it('Should convert from openapi 3.1 spec to postman collection -- binLookupService', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/binLookupService.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
    });
  });

  it('Should convert a provided input with examples in schema and takes the first example in examples', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/simpleSchemaWithExamples.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.output[0].data.item[0].response[0].originalRequest.body.raw)
        .to.be.equal('{\n    \"objectType\": 1234\n}');
    });
  });
});


describe('Openapi 3.1 schema pack validateTransactions', function() {
  function getAllTransactions (collection, allRequests) {
    if (!_.has(collection, 'item') || !_.isArray(collection.item)) {
      return;
    }
    _.forEach(collection.item, (item) => {
      if (_.has(item, 'request') || _.has(item, 'response')) {
        allRequests.push(item);
      }
      else {
        getAllTransactions(item, allRequests);
      }
    });
  }
  it('Should not generate any mismatch with a correct file', function() {
    const collectionSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/compositeSchemaCollection.json'),
      collectionData = fs.readFileSync(collectionSource, 'utf8'),
      schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/compositeSchemaSpec.yaml'),
      schemaData = fs.readFileSync(schemaSource, 'utf8'),
      validator = new SchemaPack({
        type: 'string',
        data: schemaData
      });
    let transactions = [];
    getAllTransactions(JSON.parse(collectionData), transactions);

    validator.validateTransaction(transactions, (err, result) => {
      let requestIds = Object.keys(result.requests);
      expect(err).to.be.null;
      requestIds.forEach((requestId) => {
        expect(result.requests[requestId].endpoints[0].matched).to.be.true;
      });
    });
  });

  it('Should not generate any mismatch with a correct file with null type', function() {
    const collectionSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/compositeSchemaNullableCollection.json'),
      collectionData = fs.readFileSync(collectionSource, 'utf8'),
      schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/compositeSchemaNullableSpec.yaml'),
      schemaData = fs.readFileSync(schemaSource, 'utf8'),
      validator = new SchemaPack({
        type: 'string',
        data: schemaData
      }, { suggestAvailableFixes: true });
    let transactions = [];
    getAllTransactions(JSON.parse(collectionData), transactions);

    validator.validateTransaction(transactions, (err, result) => {
      let requestIds = Object.keys(result.requests);
      expect(err).to.be.null;
      requestIds.forEach((requestId) => {
        expect(result.requests[requestId].endpoints[0].matched).to.be.true;
      });
    });
  });

  it('Should validate exclusiveMinimum correctly', function() {
    const collectionSource = path.join(
        __dirname, OPENAPI_31_COLLECTIONS + '/exclusiveMinimumCollection.json'
      ),
      collectionData = fs.readFileSync(collectionSource, 'utf8'),
      schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/exclusiveMinimumSpec.yaml'),
      schemaData = fs.readFileSync(schemaSource, 'utf8'),
      validator = new SchemaPack({
        type: 'string',
        data: schemaData
      }, { suggestAvailableFixes: true, detailedBlobValidation: true }),
      requestId = '39329aa6-d7e3-4c8e-ab22-dae4d9048c29',
      responseId = 'd34c6873-910e-4272-8eed-c8d1162aedfc';
    let transactions = [];
    getAllTransactions(JSON.parse(collectionData), transactions);

    validator.validateTransaction(transactions, (err, result) => {
      expect(err).to.be.null;
      expect(result.requests[requestId].endpoints[0].matched).to.be.false;
      expect(result.requests[requestId].endpoints[0].matched).to.be.false;
      expect(result.requests[requestId].endpoints[0].mismatches[0].reason)
        .to.be.equal('The request body property \"objectType\" must be > 10');
      expect(result.requests[requestId].endpoints[0].responses[responseId].matched).to.be.false;
      expect(result.requests[requestId].endpoints[0].responses[responseId].mismatches[0].reason)
        .to.be.equal('The response body property \"objectType\" must be > 10');
    });
  });

  it('Should validate exclusiveMaximum correctly', function() {
    const collectionSource = path.join(
        __dirname, OPENAPI_31_COLLECTIONS + '/exclusiveMaximumCollection.json'
      ),
      collectionData = fs.readFileSync(collectionSource, 'utf8'),
      schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/exclusiveMaximumSpec.yaml'),
      schemaData = fs.readFileSync(schemaSource, 'utf8'),
      validator = new SchemaPack({
        type: 'string',
        data: schemaData
      }, { suggestAvailableFixes: true, detailedBlobValidation: true }),
      requestId = '39329aa6-d7e3-4c8e-ab22-dae4d9048c29',
      responseId = 'd34c6873-910e-4272-8eed-c8d1162aedfc';
    let transactions = [];
    getAllTransactions(JSON.parse(collectionData), transactions);

    validator.validateTransaction(transactions, (err, result) => {
      expect(err).to.be.null;
      expect(result.requests[requestId].endpoints[0].matched).to.be.false;
      expect(result.requests[requestId].endpoints[0].matched).to.be.false;
      expect(result.requests[requestId].endpoints[0].mismatches[0].reason)
        .to.be.equal('The request body property \"objectType\" must be < 1000');
      expect(result.requests[requestId].endpoints[0].responses[responseId].matched).to.be.false;
      expect(result.requests[requestId].endpoints[0].responses[responseId].mismatches[0].reason)
        .to.be.equal('The response body property \"objectType\" must be < 1000');
    });
  });

  it('Should not have any mismatch when types are provided as array', function() {
    const collectionSource = path.join(
        __dirname, OPENAPI_31_COLLECTIONS + '/typesAsArrayCollectionValidType.json'
      ),
      collectionData = fs.readFileSync(collectionSource, 'utf8'),
      schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/typesAsArraySpec.yaml'),
      schemaData = fs.readFileSync(schemaSource, 'utf8'),
      validator = new SchemaPack({
        type: 'string',
        data: schemaData
      }, { suggestAvailableFixes: true, detailedBlobValidation: true }),
      requestId = 'bd6fd7fa-b979-45d7-a617-515da0ab78e1';
    // validator.convert((err, res) => {
    //   expect(err).to.be.null;
    // });
    let transactions = [];
    getAllTransactions(JSON.parse(collectionData), transactions);

    validator.validateTransaction(transactions, (err, result) => {
      expect(err).to.be.null;
      expect(result.requests[requestId].endpoints[0].matched).to.be.true;
      expect(result.requests[requestId].endpoints[0].mismatches).to.have.length(0);
    });
  });

  it('Should have a mismatch when types are provided as array and user provides an invalid one',
    function() {
      const collectionSource = path.join(
          __dirname, OPENAPI_31_COLLECTIONS + '/typesAsArrayCollectionInvalidType.json'
        ),
        collectionData = fs.readFileSync(collectionSource, 'utf8'),
        schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/typesAsArraySpec.yaml'),
        schemaData = fs.readFileSync(schemaSource, 'utf8'),
        validator = new SchemaPack({
          type: 'string',
          data: schemaData
        }, { suggestAvailableFixes: true, detailedBlobValidation: true }),
        requestId = 'bd6fd7fa-b979-45d7-a617-515da0ab78e1';
      // validator.convert((err, res) => {
      //   expect(err).to.be.null;
      // });
      let transactions = [];
      getAllTransactions(JSON.parse(collectionData), transactions);

      validator.validateTransaction(transactions, (err, result) => {
        expect(err).to.be.null;
        expect(result.requests[requestId].endpoints[0].matched).to.be.false;
        expect(result.requests[requestId].endpoints[0].mismatches[0].reason)
          .to.be.equal('The request body property \"objectType\" must be integer,string');
      });
    });

  it('Should validate the schema with outer properties', function() {
    const collectionSource = path.join(
        __dirname, OPENAPI_31_COLLECTIONS + '/simpleSchemaWithOuterPropertiesCollection.json'
      ),
      collectionData = fs.readFileSync(collectionSource, 'utf8'),
      schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/simpleSchemaWithOuterPropertiesSpec.yaml'),
      schemaData = fs.readFileSync(schemaSource, 'utf8'),
      validator = new SchemaPack({
        type: 'string',
        data: schemaData
      }, { suggestAvailableFixes: true, detailedBlobValidation: true }),
      requestId = 'e70eb3df-3c60-4512-b1f3-72e0d6356d4c';
    // validator.convert((err, res) => {
    //   expect(err).to.be.null;
    // });
    let transactions = [];
    getAllTransactions(JSON.parse(collectionData), transactions);

    validator.validateTransaction(transactions, (err, result) => {
      expect(err).to.be.null;
      expect(result.requests[requestId].endpoints[0].matched).to.be.false;
      expect(result.requests[requestId].endpoints[0].mismatches[0].reason)
        .to.be.equal('The request body property \"\" should have required property \"notRequiredElement\"');
    });
  });
});
