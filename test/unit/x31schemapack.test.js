const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  OPENAPI_31_FOLDER = '../data/valid_openapi31X',
  OPENAPI_31_COLLECTIONS = '../data/31CollectionTransactions',
  VALIDATION_DATA_ISSUES_FOLDER_31_PATH = '../data/31CollectionTransactions/issues',
  _ = require('lodash');
describe('Testing openapi 3.1 schema pack convert', function() {
  it('Should convert from openapi 3.1 spec to postman collection -- multiple refs', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/json/multiple_refs.json'),
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
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/json/petstore.json'),
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
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/json/multiple_refs_outer_required.json'),
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
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/yaml/accountService.yaml'),
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
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/yaml/binLookupService.yaml'),
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
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/yaml/simpleSchemaWithExamples.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.output[0].data.item[0].response[0].originalRequest.body.raw)
        .to.be.equal('{\n  \"objectType\": 1234\n}');
    });
  });

  it('Should convert a provided input with examples in schema and takes the first example in examples 2', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/yaml/simpleSchemaWithExamplesNotMachingType.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input, { requestParametersResolution: 'Example' });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.output[0].data.item[0].response[0].originalRequest.body.raw)
        .to.be.equal('{\n  \"id\": 1234\n}');
    });
  });
});


describe('Openapi 3.1 schema pack validateTransactions', function() {

  /**
   * @description Takes in a collection and a buffered allRequests array
   *
   * @param {object} collection a postman collection object
   * @param {Array} allRequests array as buffer
   * @returns {undefined} nothing
   */
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

  it('Should not generate any mismatch with a correct file using $schema', function() {
    const collectionSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/petstore$schemaCollection.json'),
      collectionData = fs.readFileSync(collectionSource, 'utf8'),
      schemaSource = path.join(__dirname, OPENAPI_31_COLLECTIONS + '/petstore$schema.json'),
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
});

describe('Openapi 3.1 schemapack mergeAndValidate', function() {
  it('Should merge correctly the files in folder', function(done) {
    let folderPath = path.join(__dirname, '../data/31Multifile/multiFile_with_one_root'),
      files = [],
      array = [
        { fileName: folderPath + '/index.yaml' },
        { fileName: folderPath + '/definitions/index.yaml' },
        { fileName: folderPath + '/definitions/User.yaml' },
        { fileName: folderPath + '/info/index.yaml' },
        { fileName: folderPath + '/paths/bar.yaml' },
        { fileName: folderPath + '/paths/foo.yaml' },
        { fileName: folderPath + '/paths/index.yaml' }
      ];

    array.forEach((item) => {
      files.push({
        content: fs.readFileSync(item.fileName, 'utf8'),
        fileName: item.fileName
      });
    });

    var schema = new SchemaPack({ type: 'folder', data: files });
    schema.mergeAndValidate((err, status) => {
      if (err) {
        expect.fail(null, null, err);
      }
      if (status.result) {
        schema.convert((error, result) => {
          if (error) {
            expect.fail(null, null, err);
          }
          expect(result.result).to.equal(true);
          expect(result.output.length).to.equal(1);
          expect(result.output[0].type).to.have.equal('collection');
          expect(result.output[0].data).to.have.property('info');
          expect(result.output[0].data).to.have.property('item');
          done();
        });
      }
      else {
        expect.fail(null, null, status.reason);
        done();
      }
    });
  });

  it('Should merge correctly the files in folder, multiple root files', function(done) {
    let folderPath = path.join(__dirname, '../data/31Multifile/multiFile_with_two_root'),
      files = [],
      array = [
        { fileName: folderPath + '/index.yaml' },
        { fileName: folderPath + '/index1.yaml' },
        { fileName: folderPath + '/definitions/index.yaml' },
        { fileName: folderPath + '/definitions/User.yaml' },
        { fileName: folderPath + '/info/index.yaml' },
        { fileName: folderPath + '/info/index1.yaml' },
        { fileName: folderPath + '/paths/bar.yaml' },
        { fileName: folderPath + '/paths/foo.yaml' },
        { fileName: folderPath + '/paths/index.yaml' }
      ];

    array.forEach((item) => {
      files.push({
        content: fs.readFileSync(item.fileName, 'utf8'),
        fileName: item.fileName
      });
    });

    var schema = new SchemaPack({ type: 'folder', data: files });
    schema.mergeAndValidate((err, status) => {
      if (err) {
        expect.fail(null, null, err);
        done();
      }
      expect(status.result).to.be.eq(false);
      expect(status.reason).to.be.equal('More than one root file not supported.');
      return done();
    });
  });

  it('Should merge correctly the files in folder - petstore separate yaml', function(done) {
    let folderPath = path.join(__dirname, '../data/31Multifile/petstore separate yaml'),
      files = [],
      array = [
        { fileName: folderPath + '/spec/swagger.yaml' },
        { fileName: folderPath + '/spec/Pet.yaml' },
        { fileName: folderPath + '/spec/parameters.yaml' },
        { fileName: folderPath + '/spec/NewPet.yaml' },
        { fileName: folderPath + '/common/Error.yaml' }
      ];

    array.forEach((item) => {
      files.push({
        content: fs.readFileSync(item.fileName, 'utf8'),
        fileName: item.fileName
      });
    });

    var schema = new SchemaPack({ type: 'folder', data: files });
    schema.mergeAndValidate((err, status) => {
      if (err) {
        expect.fail(null, null, err);
      }
      if (status.result) {
        schema.convert((error, result) => {
          if (error) {
            expect.fail(null, null, err);
          }
          expect(result.result).to.equal(true);
          expect(result.output.length).to.equal(1);
          expect(result.output[0].type).to.have.equal('collection');
          expect(result.output[0].data).to.have.property('info');
          expect(result.output[0].data).to.have.property('item');
          done();
        });
      }
      else {
        expect.fail(null, null, status.reason);
        done();
      }
    });
  });

  it('Should merge correctly the files in folder - by fileName - petstore separate yaml', function(done) {
    let folderPath = path.join(__dirname, '../data/31Multifile/petstore separate yaml'),
      array = [
        { fileName: folderPath + '/spec/swagger.yaml' },
        { fileName: folderPath + '/spec/Pet.yaml' },
        { fileName: folderPath + '/spec/parameters.yaml' },
        { fileName: folderPath + '/spec/NewPet.yaml' },
        { fileName: folderPath + '/common/Error.yaml' }
      ];

    var schema = new SchemaPack({ type: 'folder', data: array });
    schema.mergeAndValidate((err, status) => {
      if (err) {
        expect.fail(null, null, err);
      }
      if (status.result) {
        schema.convert((error, result) => {
          if (error) {
            expect.fail(null, null, err);
          }
          expect(result.result).to.equal(true);
          expect(result.output.length).to.equal(1);
          expect(result.output[0].type).to.have.equal('collection');
          expect(result.output[0].data).to.have.property('info');
          expect(result.output[0].data).to.have.property('item');
          done();
        });
      }
      else {
        expect.fail(null, null, status.reason);
        done();
      }
    });
  });
});

describe('Resolved issues', function() {
  const issue133 = path.join(__dirname, VALIDATION_DATA_ISSUES_FOLDER_31_PATH + '/issue#133.json'),
    issue160 = path.join(__dirname, VALIDATION_DATA_ISSUES_FOLDER_31_PATH, '/issue#160.json'),
    issue150 = path.join(__dirname, VALIDATION_DATA_ISSUES_FOLDER_31_PATH + '/issue#150.yml'),
    issue173 = path.join(__dirname, VALIDATION_DATA_ISSUES_FOLDER_31_PATH, '/issue#173.yml'),
    issue152 = path.join(__dirname, VALIDATION_DATA_ISSUES_FOLDER_31_PATH, '/path-refs-error.yaml'),
    issue193 = path.join(__dirname, VALIDATION_DATA_ISSUES_FOLDER_31_PATH, '/issue#193.yml');

  it('Should generate collection conforming to schema for and fail if not valid ' +
  issue152 + ' - version: 3.1', function(done) {
    var openapi = fs.readFileSync(issue152, 'utf8'),
      refNotFound = 'reference #/paths/~1pets/get/responses/200/content/application~1json/schema/properties/newprop' +
      ' not found in the OpenAPI spec',
      Converter = new SchemaPack({ type: 'string', data: openapi }, { schemaFaker: true });
    Converter.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      expect(conversionResult.output[0].data.item[0].item[1].response[1].body).to.not.contain(refNotFound);
      done();
    });
  });

  it(' Fix for GITHUB#133: Should generate collection with proper Path and Collection variables - version: 3.1',
    function(done) {
      var openapi = fs.readFileSync(issue133, 'utf8'),
        Converter = new SchemaPack(
          { type: 'string', data: openapi },
          { requestParametersResolution: 'Example', schemaFaker: true }
        );
      Converter.convert((err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data).to.have.property('variable');
        expect(conversionResult.output[0].data.variable).to.be.an('array');
        expect(conversionResult.output[0].data.variable[1].key).to.equal('format');
        expect(conversionResult.output[0].data.variable[1].value).to.equal('json');
        expect(conversionResult.output[0].data.variable[2].key).to.equal('path');
        expect(conversionResult.output[0].data.variable[2].value).to.equal('send-email');
        expect(conversionResult.output[0].data.variable[3].key).to.equal('new-path-variable-1');
        // serialised value for object { R: 100, G: 200, B: 150 }
        expect(conversionResult.output[0].data.variable[3].value).to.equal('R,100,G,200,B,150');
        expect(conversionResult.output[0].data.variable[4].key).to.equal('new-path-variable-2');
        // serialised value for array ["exampleString", "exampleString"]
        expect(conversionResult.output[0].data.variable[4].value).to.equal('exampleString,exampleString');
        done();
      });
    });

  it('#GITHUB-160 should generate correct display url for path containing servers' +
    issue160 + ' - version: 3.1', function(done) {
    var openapi = fs.readFileSync(issue160, 'utf8'),
      Converter = new SchemaPack({ type: 'string', data: openapi }, {});
    Converter.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      expect(conversionResult.output[0].data.item[0].item[0].request.url.host[0]).to.equal('{{pets-Url}}');
      done();
    });
  });

  it('[Github #173] - should add headers correctly to sample request in examples(responses) - ' +
    'version: 3.1', function (done) {
    var openapi = fs.readFileSync(issue173, 'utf8'),
      Converter = new SchemaPack({ type: 'string', data: openapi }, {});
    Converter.convert((err, conversionResult) => {
      let responseArray;
      expect(err).to.be.null;
      responseArray = conversionResult.output[0].data.item[0].response;
      expect(responseArray).to.be.an('array');
      responseArray.forEach((response) => {
        let headerArray = response.originalRequest.header;
        expect(headerArray).to.be.an('array').that.is.not.empty;
        expect(headerArray).to.eql([
          {
            key: 'access_token',
            value: 'X-access-token',
            description: 'Access token',
            disabled: false
          }
        ]);
      });
      done();
    });
  });

  it('[Github #193] - should handle minItems and maxItems props for (type: array) appropriately - ' +
    'version: 3.1', function (done) {
    var openapi = fs.readFileSync(issue193, 'utf8'),
      Converter = new SchemaPack({ type: 'string', data: openapi }, {});
    Converter.convert((err, conversionResult) => {
      let responseBody;

      expect(err).to.be.null;
      responseBody = JSON.parse(conversionResult.output[0].data.item[0].response[0].body);

      expect(responseBody).to.be.an('object');
      expect(responseBody).to.have.keys(['min', 'max', 'minmax', 'nomin', 'nomax', 'nominmax']);

      // Check for all cases (number of items generated are kept as valid and minimum as possible)
      // maxItems # of items when minItems not defined (and maxItems < 2)
      expect(responseBody.min).to.have.length(1);
      // limit(20) # of items when minItems > 20
      expect(responseBody.max).to.have.length(20);
      // minItems # of items when minItems and maxItems both is defined
      expect(responseBody.minmax).to.have.length(3);
      // default # of items when minItems not defined (and maxItems >= 2)
      expect(responseBody.nomin).to.have.length(2);
      // minItems # of items when maxItems not defined
      expect(responseBody.nomax).to.have.length(4);
      // default # of items when minItems and maxItems not defined
      expect(responseBody.nominmax).to.have.length(2);
      done();
    });
  });

  it('[GitHub #150] - should generate collection if examples are empty - ' +
    'version: 3.1', function (done) {
    var openapi = fs.readFileSync(issue150, 'utf8'),
      Converter = new SchemaPack({ type: 'string', data: openapi }, { schemaFaker: false });
    Converter.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      done();
    });
  });
});


describe('Webhooks support', function() {
  it('Should resolve correctly a file with only webhooks', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/payments-webhooks.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input, { includeWebhooks: true });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item[0].name).to.equal('Webhooks');
      expect(result.output[0].data.item[0].item).to.be.an('array')
        .with.length(19);
      expect(result.output[0].data.variable).to.be.an('array')
        .with.length(20);
    });
  });

  it('Should resolve a file with only webhooks but includeWebhooks is false', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/payments-webhooks.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input, { includeWebhooks: false });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item.length).to.eql(0);
    });
  });

  it('Should resolve correctly a file with only webhooks, folderStrategy as tag', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/payments-webhooks.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(
        input,
        {
          includeWebhooks: true,
          folderStrategy: 'tags'
        });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item[0].name).to.equal('Webhooks');
      expect(result.output[0].data.item[0].item).to.be.an('array')
        .with.length(19);
      expect(result.output[0].data.variable).to.be.an('array')
        .with.length(20);
    });
  });

  it('Should resolve correctly a file with two webhooks and paths', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/payments-webhooks-with-paths.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input, { includeWebhooks: true });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item[0].name).to.equal('pets');
      expect(result.output[0].data.item[0].item).to.be.an('array')
        .with.length(3);
      expect(result.output[0].data.item[1].name).to.equal('Webhooks');
      expect(result.output[0].data.item[1].item).to.be.an('array')
        .with.length(2);
    });
  });

  it('Should resolve correctly a file with two webhooks and paths, folderStrategy as tags', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/payments-webhooks-with-paths.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input, { includeWebhooks: true, folderStrategy: 'tags' });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item[0].name).to.equal('pet');
      expect(result.output[0].data.item[0].item).to.be.an('array')
        .with.length(4);
      expect(result.output[0].data.item[1].name).to.equal('Webhooks');
      expect(result.output[0].data.item[1].item).to.be.an('array')
        .with.length(2);
    });
  });

  it('Should resolve correctly a file when webhook\'s name looks like a path', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/webhook-name-with-path-format.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input, { includeWebhooks: true }),
      expectedVariableName = 'ACCOUNT_CLOSED_port_xid',
      expectedVariableValue = '/';

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item[0].name).to.equal('pets');
      expect(result.output[0].data.item[0].item).to.be.an('array')
        .with.length(3);
      expect(result.output[0].data.item[1].name).to.equal('Webhooks');
      expect(result.output[0].data.item[1].item).to.be.an('array')
        .with.length(2);
      expect(result.output[0].data.item[1].item[0].request.url.host[0])
        .to.be.equal(`{{${expectedVariableName}}}`);
      expect(result.output[0].data.variable[1].key).to.be.equal(expectedVariableName);
      expect(result.output[0].data.variable[1].value).to.be.equal(expectedVariableValue);
    });
  });

  it('Should resolve correctly a file when webhook has two requests', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/two-requests-in-webhook.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input, { includeWebhooks: true });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item[0].name).to.equal('pets');
      expect(result.output[0].data.item[0].item).to.be.an('array')
        .with.length(3);
      expect(result.output[0].data.item[1].name).to.equal('Webhooks');
      expect(result.output[0].data.item[1].item).to.be.an('array')
        .with.length(2);
      expect(result.output[0].data.item[1].item[0].item).to.be.an('array')
        .with.length(2);
      expect(result.output[0].data.item[1].item[0].item.map((item) => {
        return item.name;
      })).to.have.members(['post-ACCOUNT CLOSED', 'get-ACCOUNT CLOSED']);
    });
  });

  it('Should resolve correctly a file with two webhooks and paths, with includeWebhooks in false',
    function() {
      const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/webhooks/payments-webhooks-with-paths.yaml'),
        fileData = fs.readFileSync(fileSource, 'utf8'),
        input = {
          type: 'string',
          data: fileData
        },
        converter = new SchemaPack(input, { includeWebhooks: false });

      converter.convert((err, result) => {
        expect(err).to.be.null;
        expect(result.result).to.be.true;
        expect(result.output[0].data.item).to.be.an('array')
          .with.length(1);
        expect(result.output[0].data.item[0].name).to.equal('pets');
        expect(result.output[0].data.item[0].item).to.be.an('array')
          .with.length(3);
      });
    });
});
