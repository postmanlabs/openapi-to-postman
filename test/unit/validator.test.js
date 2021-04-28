var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  schemaUtils = require('../../lib/schemaUtils'),
  VALIDATION_DATA_FOLDER_PATH = '../data/validationData',
  VALID_OPENAPI_FOLDER_PATH = '../data/valid_openapi';

/**
 * Extract all transaction from collection and appends them into array
 *
 * @param {*} collection - Postman Collection
 * @param {*} allRequests - Array to which transactions are appended
 * @returns {*} - null
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

describe('The validator must validate generated collection from schema against schema itself', function () {
  var validOpenapiFolder = fs.readdirSync(path.join(__dirname, VALID_OPENAPI_FOLDER_PATH)),
    suggestedFixProps = ['key', 'actualValue', 'suggestedValue'],
    checkMismatch = (mismatch) => {
      expect(['REQUEST_NAME', 'REQUEST_DESCRIPTION', 'PATHVARIABLE', 'QUERYPARAM', 'HEADER', 'RESPONSE_HEADER',
        'BODY', 'RESPONSE_BODY', 'ENDPOINT']).to.include(mismatch.property);
      expect(mismatch).to.include.keys('transactionJsonPath');
      expect(mismatch).to.include.keys('schemaJsonPath');
      expect(mismatch.reason).to.be.a('string');
      expect(['MISSING_IN_REQUEST', 'INVALID_TYPE', 'MISSING_IN_SCHEMA', 'INVALID_VALUE', 'INVALID_BODY',
        'INVALID_RESPONSE_BODY', 'BODY_SCHEMA_NOT_FOUND', 'MISSING_ENDPOINT']).to.include(mismatch.reasonCode);
    };

  async.each(validOpenapiFolder, function (file, cb) {
    it('correctly for schema: ' + file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/' + file), 'utf8'),
        options = {
          requestParametersResolution: 'Example',
          exampleParametersResolution: 'Example',
          showMissingInSchemaErrors: true,
          strictRequestMatching: true,
          ignoreUnresolvedVariables: true,
          validateMetadata: true,
          suggestAvailableFixes: true,
          detailedBlobValidation: false
        },
        schemaPack = new Converter.SchemaPack({ type: 'string', data: fileData }, options);

      // Increase timeout for larger schema
      this.timeout(15000);

      schemaPack.convert((err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        let historyRequest = [];

        getAllTransactions(conversionResult.output[0].data, historyRequest);

        schemaPack.validateTransaction(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          // check for result.requests structure
          _.forEach(result.requests, (req) => {
            expect(req.requestId).to.be.a('string');

            _.forEach(req.endpoints, (endpoint) => {
              expect(endpoint.matched).to.be.a('boolean');
              expect(endpoint.endpointMatchScore).to.be.a('number');
              expect(endpoint.endpoint).to.be.a('string');
              expect(endpoint.endpoint).to.be.a('string');

              _.forEach(endpoint.mismatches, (mismatch) => {
                // console.log(file, ' ----------');
                // console.log(JSON.stringify(mismatch, null, 2));
                checkMismatch(mismatch);
                if (mismatch.suggestedFix) {
                  expect(mismatch.suggestedFix).to.have.all.keys(suggestedFixProps);
                }
              });

              _.forEach(endpoint.responses, (response) => {
                expect(response.id).to.be.a('string');
                expect(response.matched).to.be.a('boolean');

                _.forEach(response.mismatches, (mismatch) => {
                  // console.log(file, ' **********');
                  // console.log(JSON.stringify(mismatch, null, 2));
                  checkMismatch(mismatch);
                  if (mismatch.suggestedFix) {
                    expect(mismatch.suggestedFix).to.have.all.keys(suggestedFixProps);
                  }
                });
              });
            });
          });

          // check for result.missingEndpoints structure
          _.forEach(result.missingEndpoints, (endpoint) => {
            checkMismatch(endpoint);
            expect(endpoint.property).to.eql('ENDPOINT');
            if (endpoint.suggestedFix) {
              expect(endpoint.suggestedFix).to.have.all.keys(suggestedFixProps);
            }
          });
          return cb(null);
        });
      });
    });
  });
});

describe('The Validation option', function () {
  var strictRequestMatchingSpec = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/strictRequestMatchingSpec.yaml'),
    strictRequestMatchingCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/strictRequestMatchingCollection.json'),
    ignoreUnresolvedVariablesSpec = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/ignoreUnresolvedVariablesSpec.yaml'),
    ignoreUnresolvedVariablesCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/ignoreUnresolvedVariablesCollection.json'),
    validateMetadataSpec = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/validateMetadataSpec.yaml'),
    validateMetadataCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/validateMetadataCollection.json'),
    suggestAvailableFixesSpec = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/suggestAvailableFixesSpec.yaml'),
    suggestAvailableFixesCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/suggestAvailableFixesCollection.json'),
    detailedBlobValidationSpec = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/detailedBlobValidationSpec.yaml'),
    detailedBlobValidationCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/detailedBlobValidationCollection.json');

  describe('strictRequestMatching ', function () {
    it('should strictly match collection request with corresponding schema endpoint/s', function (done) {
      var schema = fs.readFileSync(strictRequestMatchingSpec, 'utf8'),
        collection = fs.readFileSync(strictRequestMatchingCollection, 'utf8'),
        schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
          { strictRequestMatching: true }),
        historyRequest = [];

      getAllTransactions(JSON.parse(collection), historyRequest);
      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;

        /**
         Collection request contains
          - GET /users/admin/:userId (userId = 12345)
          - GET /users/admin/profile

         Schema Endpoints contains
          - GET /users/admin/profile
          - GET /users/admin/{userId}
          - GET /admin/{adminId}

        For strictRequestMatching = false, both collection request matches with all 3 endpoints from schema,
          and no endpoint will be present in missingEndpoints
        For strictRequestMatching = true, we have matches as following
        */
        // for endpoint "/users/admin/:userId" we should only one match with "/users/admin/{userId}"
        expect(result.requests[historyRequest[0].id].endpoints).to.have.lengthOf(1);

        // for endpoint "/users/admin/profile" we should have two matches first match with "/users/admin/profile"
        // and second with "/users/admin/{userId}" as first match has more fixed matched segments
        expect(result.requests[historyRequest[1].id].endpoints).to.have.lengthOf(2);

        // endpoint "/admin/{adminId}"" should be present as missing endpoint
        expect(result.missingEndpoints).to.have.lengthOf(1);
        expect(result.missingEndpoints[0].endpoint).to.eql('GET /admin/{adminId}');
        done();
      });
    });
  });

  describe('ignoreUnresolvedVariables ', function () {
    it('should ignore all mismatches happening due to collection/environment variables present in request',
      function (done) {
        var schema = fs.readFileSync(ignoreUnresolvedVariablesSpec, 'utf8'),
          collection = fs.readFileSync(ignoreUnresolvedVariablesCollection, 'utf8'),
          schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
            { ignoreUnresolvedVariables: true }),
          historyRequest = [];

        getAllTransactions(JSON.parse(collection), historyRequest);
        schemaPack.validateTransaction(historyRequest, (err, result) => {
          var reqResultObj;
          expect(err).to.be.null;

          /**
           Schema/Collection tested here contains pm variables in all parts checked.
          i.e. path variable, query params, headers, req/res body etc
          */
          reqResultObj = result.requests[_.keys(result.requests)[0]];
          expect(reqResultObj.endpoints).to.have.lengthOf(1);
          // checking for no mismatches in req and responses
          expect(reqResultObj.endpoints[0].matched).to.be.true;
          expect(reqResultObj.endpoints[0].mismatches).to.have.lengthOf(0);
          _.forEach(reqResultObj.endpoints[0].responses, (response) => {
            expect(response.matched).to.be.true;
            expect(response.mismatches).to.have.lengthOf(0);
          });
          done();
        });
      });
  });

  describe('validateMetadata ', function () {
    var schema = fs.readFileSync(validateMetadataSpec, 'utf8'),
      collection = fs.readFileSync(validateMetadataCollection, 'utf8'),
      schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
        { validateMetadata: true, suggestAvailableFixes: true }),
      historyRequest = [],
      resultObj1,
      resultObj2;

    before(function (done) {
      getAllTransactions(JSON.parse(collection), historyRequest);
      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        resultObj1 = result.requests[historyRequest[0].id].endpoints[0];
        resultObj2 = result.requests[historyRequest[1].id].endpoints[0];
        done();
      });
    });

    it('should validate request name and description according to schema', function () {
      expect(resultObj1.mismatches).to.have.lengthOf(2);
      _.forEach(resultObj1.mismatches, (mismatch) => {
        // check for suggested value to be one in schema
        if (mismatch.property === 'REQUEST_NAME') {
          expect(mismatch.reasonCode).to.eql('INVALID_VALUE');
          expect(mismatch.reason).to.eql('The request name didn\'t match with specified schema');
          expect(mismatch.suggestedFix.suggestedValue).to.eql('List all pets Updated');
        }
        else if (mismatch.property === 'REQUEST_DESCRIPTION') {
          expect(mismatch.reasonCode).to.eql('INVALID_VALUE');
          expect(mismatch.reason).to.eql('The request description didn\'t match with specified schema');
          expect(mismatch.suggestedFix.suggestedValue).to.eql('Description for GET /pets - List all pets');
        }
        else {
          throw Error('Unhandled mismatch property in test');
        }
      });
    });

    it('should handle empty and null request name and description in request', function () {
      expect(resultObj2.mismatches).to.have.lengthOf(1);
      expect(resultObj2.mismatches[0].property).to.eql('REQUEST_DESCRIPTION');
      expect(resultObj2.mismatches[0].reasonCode).to.eql('INVALID_VALUE');
      expect(resultObj2.mismatches[0].reason).to.eql('The request description didn\'t match with specified schema');
      expect(resultObj2.mismatches[0].suggestedFix.actualValue).to.be.null;
      expect(resultObj2.mismatches[0].suggestedFix.suggestedValue)
        .to.eql('Description for POST /pets - Create a pet');
    });
  });

  describe('suggestAvailableFixes ', function () {
    var schema = fs.readFileSync(suggestAvailableFixesSpec, 'utf8'),
      collection = fs.readFileSync(suggestAvailableFixesCollection, 'utf8'),
      schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
        { suggestAvailableFixes: true }),
      historyRequest = [],
      resultObj,
      responseResult,
      propertyMismatchMap = {};

    before(function (done) {
      getAllTransactions(JSON.parse(collection), historyRequest);
      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        resultObj = result.requests[historyRequest[0].id].endpoints[0];
        responseResult = resultObj.responses[historyRequest[0].response[0].id];

        // check for expected mismatches length
        expect(resultObj.mismatches).to.have.lengthOf(4);
        expect(responseResult.mismatches).to.have.lengthOf(2);

        // map all mismatch objects with it's property
        _.forEach(_.concat(resultObj.mismatches, responseResult.mismatches), (mismatch) => {
          propertyMismatchMap[mismatch.property] = mismatch;
        });
        done();
      });
    });

    it('should suggest valid available fix for all kind of violated properties', function () {
      // check for all suggested value to be according to schema
      expect(_.isInteger(propertyMismatchMap.PATHVARIABLE.suggestedFix.suggestedValue)).to.eql(true);
      expect(propertyMismatchMap.QUERYPARAM.suggestedFix.suggestedValue).to.be.a('number');
      expect(propertyMismatchMap.HEADER.suggestedFix.suggestedValue).to.be.a('boolean');
      expect(propertyMismatchMap.BODY.suggestedFix.suggestedValue.name).to.be.a('string');
      expect(propertyMismatchMap.BODY.suggestedFix.suggestedValue.name.length >= 30).to.eql(true);
      expect(propertyMismatchMap.BODY.suggestedFix.suggestedValue.tag).to.be.a('string');
      expect(_.includes(['Bulldog', 'Retriever', 'Timberwolf', 'Grizzly', 'Husky'],
        propertyMismatchMap.BODY.suggestedFix.suggestedValue.breeds[2])).to.eql(true);
      expect(_.isInteger(propertyMismatchMap.RESPONSE_HEADER.suggestedFix.suggestedValue)).to.eql(true);
      expect(_.isInteger(propertyMismatchMap.RESPONSE_BODY.suggestedFix.suggestedValue.code)).to.eql(true);
      expect(propertyMismatchMap.RESPONSE_BODY.suggestedFix.suggestedValue.code % 7).to.equal(0);
      expect(propertyMismatchMap.RESPONSE_BODY.suggestedFix.suggestedValue.message).to.be.a('string');
    });

    it('should maintain valid properties/items in suggested value', function () {
      expect(propertyMismatchMap.BODY.suggestedFix.suggestedValue.petId).to.eql(
        propertyMismatchMap.BODY.suggestedFix.actualValue.petId
      );
      expect(propertyMismatchMap.BODY.suggestedFix.suggestedValue.breeds[0]).to.eql(
        propertyMismatchMap.BODY.suggestedFix.actualValue.breeds[0]
      );
      expect(propertyMismatchMap.BODY.suggestedFix.suggestedValue.breeds[1]).to.eql(
        propertyMismatchMap.BODY.suggestedFix.actualValue.breeds[1]
      );
    });
  });

  describe('detailedBlobValidation ', function () {
    it('should provide detailed mismatches for each schema keyword violation', function (done) {
      var schema = fs.readFileSync(detailedBlobValidationSpec, 'utf8'),
        collection = fs.readFileSync(detailedBlobValidationCollection, 'utf8'),
        schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
          { detailedBlobValidation: true }),
        historyRequest = [],
        resultObj,
        violatedKeywords = [
          'data.items.minProperties',
          'data.items.required',
          'data.items.properties.entityId.maxLength',
          'data.items.properties.accountNumber.minLength',
          'data.items.properties.entityName.format',
          'data.items.properties.incType.enum',
          'data.items.properties.companyNumber.exclusiveMinimum',
          'data.items.properties.website.type',
          'data.items.properties.turnover.multipleOf',
          'data.items.properties.description.pattern',
          'data.items.properties.wants.uniqueItems',
          'meta.maxProperties',
          'meta.additionalProperties'
        ];

      getAllTransactions(JSON.parse(collection), historyRequest);
      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        resultObj = result.requests[historyRequest[0].id].endpoints[0];

        // map all mismatch objects with it's property
        _.forEach(resultObj.mismatches, (mismatch) => {
          // remove starting string '$.paths[/user].post.requestBody.content[application/json].schema.properties.'
          let localJsonPath = mismatch.schemaJsonPath.slice(76);
          expect(_.includes(violatedKeywords, localJsonPath)).to.eql(true);

          // mark matched path as empty to ensure repetition does'n occur
          violatedKeywords[_.indexOf(violatedKeywords, localJsonPath)] = '';
        });
        done();
      });
    });
  });
});

describe('VALIDATE FUNCTION TESTS ', function () {
  describe('validateTransaction function', function () {
    it('Should not fail if spec to validate contains empty parameters', function (done) {
      let emptyParameterSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/emptyParameterSpec.yaml'), 'utf-8'),
        emptyParameterCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/emptyParameterCollection.json'), 'utf-8'),
        resultObj,
        historyRequest = [],
        schemaPack = new Converter.SchemaPack({ type: 'string', data: emptyParameterSpec }, {});

      getAllTransactions(JSON.parse(emptyParameterCollection), historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        resultObj = result.requests[historyRequest[0].id].endpoints[0];
        expect(resultObj.mismatches).to.have.lengthOf(0);
        done();
      });
    });

    it('Should correctly handle transactionPath property when Implicit headers are present', function (done) {
      let implicitHeaderSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/implicitHeaderSpec.yaml'), 'utf-8'),
        implicitHeaderCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/implicitHeaderCollection.json'), 'utf-8'),
        resultObj,
        historyRequest = [],
        schemaPack = new Converter.SchemaPack({ type: 'string', data: implicitHeaderSpec }, {});

      getAllTransactions(JSON.parse(implicitHeaderCollection), historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        resultObj = result.requests[historyRequest[0].id].endpoints[0];

        expect(resultObj.mismatches).to.have.lengthOf(1);

        /**
          header-1 is invalid according to schema, as request contains other 2 implicit headers(Content-Type and Accept)
          the mismatch for header-1 should contain correct index as in request.
        */
        expect(_.endsWith(resultObj.mismatches[0].transactionJsonPath, '[2].value')).to.eql(true);
        _.forEach(resultObj.responses, (response) => {
          expect(response.matched).to.be.true;
          expect(response.mismatches).to.have.lengthOf(0);
        });
        done();
      });
    });

    it('Should correctly suggest value when violated keyword is at root level', function (done) {
      let rootKeywordViolationSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/rootKeywordViolationSpec.yaml'), 'utf-8'),
        rootKeywordViolationCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/rootKeywordViolationCollection.json'), 'utf-8'),
        options = { suggestAvailableFixes: true },
        resultObj,
        historyRequest = [],
        schemaPack = new Converter.SchemaPack({ type: 'string', data: rootKeywordViolationSpec }, options);

      getAllTransactions(JSON.parse(rootKeywordViolationCollection), historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        resultObj = result.requests[historyRequest[0].id].endpoints[0];

        expect(resultObj.mismatches).to.have.lengthOf(1);

        /**
          The spec contains "POST /pet" endpoint with request body as Pet object which requires minimum property of 4
          as this property is root (Json path to prop is ''(empty), we expect suggested value to be according to spec)
        */
        expect(_.keys(resultObj.mismatches[0].suggestedFix.actualValue)).to.have.lengthOf(3);
        expect(_.keys(resultObj.mismatches[0].suggestedFix.suggestedValue)).to.have.lengthOf(4);
        done();
      });
    });

    it('Should correctly suggest value when property is vioalting multiple keywords', function (done) {
      let doubleValidationFixSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/doubleValidationFixSpec.yaml'), 'utf-8'),
        options = { requestParametersResolution: 'Example', suggestAvailableFixes: true },
        resultObj,
        schemaPack = new Converter.SchemaPack({ type: 'string', data: doubleValidationFixSpec }, options);

      schemaPack.convert((err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        let historyRequest = [];

        getAllTransactions(conversionResult.output[0].data, historyRequest);

        schemaPack.validateTransaction(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObj = result.requests[historyRequest[0].id].endpoints[0];

          expect(resultObj.mismatches).to.have.lengthOf(1);

          /**
            The spec contains request body which has name and identifier props as required which is
            violated in collection. We expect both props to be present and valid according to schema.
          */
          expect(resultObj.mismatches[0].suggestedFix.suggestedValue).to.contain.keys(['name', 'identifier']);
          expect(resultObj.mismatches[0].suggestedFix.suggestedValue.name).to.be.a('string');
          expect(resultObj.mismatches[0].suggestedFix.suggestedValue.identifier).to.be.a('string');
          done();
        });
      });
    });

    it('Should correctly handle internal $ref when present', function (done) {
      let internalRefsSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/internalRefsSpec.yaml'), 'utf-8'),
        internalRefsCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/internalRefsCollection.json'), 'utf-8'),
        resultObj,
        options = {
          showMissingInSchemaErrors: true,
          strictRequestMatching: true,
          ignoreUnresolvedVariables: true,
          validateMetadata: true,
          suggestAvailableFixes: true,
          detailedBlobValidation: false
        },
        historyRequest = [],
        schemaPack = new Converter.SchemaPack({ type: 'string', data: internalRefsSpec }, options);

      getAllTransactions(JSON.parse(internalRefsCollection), historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        resultObj = result.requests[historyRequest[0].id].endpoints[0];

        // no mismatches should be found when resolved correctly
        expect(resultObj.matched).to.be.true;
        expect(resultObj.mismatches).to.have.lengthOf(0);
        _.forEach(resultObj.responses, (response) => {
          expect(response.matched).to.be.true;
          expect(response.mismatches).to.have.lengthOf(0);
        });
        done();
      });
    });

    it('Should correctly match and validate valid json content type with collection req/res body', function (done) {
      let differentContentTypesSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/differentContentTypesSpec.yaml'), 'utf-8'),
        differentContentTypesCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/differentContentTypesCollection.json'), 'utf-8'),
        resultObj,
        historyRequest = [],
        options = {
          suggestAvailableFixes: true
        },
        schemaPack = new Converter.SchemaPack({ type: 'string', data: differentContentTypesSpec }, options);

      getAllTransactions(JSON.parse(differentContentTypesCollection), historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        resultObj = result.requests[historyRequest[0].id].endpoints[0];

        /**
         * Both req and res body should match with schema content object and each have one mismatch
         */
        expect(resultObj.mismatches).to.have.lengthOf(1);
        expect(resultObj.mismatches[0].property).to.equal('BODY');
        expect(resultObj.responses[_.keys(resultObj.responses)[0]].mismatches).to.have.lengthOf(1);
        expect(resultObj.responses[_.keys(resultObj.responses)[0]].mismatches[0].property).to.equal('RESPONSE_BODY');
        done();
      });
    });

    it('Should be able to validate and suggest correct value for body with primitive data type', function (done) {
      let primitiveDataTypeBodySpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/primitiveDataTypeBodySpec.yaml'), 'utf-8'),
        primitiveDataTypeBodyCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/primitiveDataTypeBodyCollection.json'), 'utf-8'),
        resultObj,
        responseObj,
        historyRequest = [],
        options = {
          showMissingInSchemaErrors: true,
          strictRequestMatching: true,
          ignoreUnresolvedVariables: true,
          validateMetadata: true,
          suggestAvailableFixes: true,
          detailedBlobValidation: false
        },
        schemaPack = new Converter.SchemaPack({ type: 'string', data: primitiveDataTypeBodySpec }, options);

      getAllTransactions(JSON.parse(primitiveDataTypeBodyCollection), historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        // request body is boolean
        resultObj = result.requests[historyRequest[0].id].endpoints[0];
        expect(resultObj.mismatches).to.have.lengthOf(0);

        // request body is integer
        responseObj = resultObj.responses[_.keys(resultObj.responses)[0]];
        expect(responseObj.mismatches).to.have.lengthOf(1);
        expect(responseObj.mismatches[0].suggestedFix.suggestedValue).to.be.within(5, 10);
        done();
      });
    });

    it('Should correctly validate schema having path with multiple path variables', function (done) {
      let multiplePathVarSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/multiplePathVarSpec.json'), 'utf-8'),
        multiplePathVarCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/multiplePathVarCollection.json'), 'utf-8'),
        resultObj,
        historyRequest = [],
        options = {
          showMissingInSchemaErrors: true,
          strictRequestMatching: true,
          ignoreUnresolvedVariables: true,
          suggestAvailableFixes: true
        },
        schemaPack = new Converter.SchemaPack({ type: 'string', data: multiplePathVarSpec }, options);

      getAllTransactions(JSON.parse(multiplePathVarCollection), historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        resultObj = result.requests[historyRequest[0].id].endpoints[0];
        expect(resultObj.mismatches).to.have.lengthOf(0);
        done();
      });
    });
  });

  describe('getPostmanUrlSuffixSchemaScore function', function () {
    it('Should maintain correct order in which path vaiables occur in result', function (done) {
      let pmSuffix = ['pets', '123', '456', '789'],
        schemaPath = ['pets', '{petId1}', '{petId2}', '{petId3}'],
        result;

      result = schemaUtils.getPostmanUrlSuffixSchemaScore(pmSuffix, schemaPath, { strictRequestMatching: true });

      expect(result.match).to.be.true;
      expect(result.pathVars).to.have.lengthOf(3);
      expect(result.pathVars[0]).to.deep.equal({ key: 'petId1', value: pmSuffix[1] });
      expect(result.pathVars[1]).to.deep.equal({ key: 'petId2', value: pmSuffix[2] });
      expect(result.pathVars[2]).to.deep.equal({ key: 'petId3', value: pmSuffix[3] });
      done();
    });
  });

  it('Should be able to validate schema with request body of content type "application/x-www-form-urlencoded" ' +
    'against transaction with valid UrlEncoded body correctly', function (done) {
    let urlencodedBodySpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/urlencodedBodySpec.yaml'), 'utf-8'),
      urlencodedBodyCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
        '/urlencodedBodyCollection.json'), 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: urlencodedBodySpec },
        { suggestAvailableFixes: true });

    getAllTransactions(JSON.parse(urlencodedBodyCollection), historyRequest);

    schemaPack.validateTransaction(historyRequest, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.lengthOf(3);

      // for explodable property of type object named "propObjectExplodable",
      // second property named "prop2" is incorrect, while property "prop1" is correct
      expect(resultObj.mismatches[0].transactionJsonPath).to.eql('$.request.body.urlencoded[1].value');
      expect(resultObj.mismatches[0].suggestedFix.actualValue).to.eql('false');
      expect(resultObj.mismatches[0].suggestedFix.suggestedValue).to.eql('world');

      // for non explodable property of type object, entire property with updated value should be suggested
      expect(resultObj.mismatches[1].transactionJsonPath).to.eql('$.request.body.urlencoded[2].value');
      expect(resultObj.mismatches[1].suggestedFix.actualValue).to.eql('prop3,hello,prop4,true');
      expect(resultObj.mismatches[1].suggestedFix.suggestedValue).to.eql('prop3,hello,prop4,world');

      // for type array property named "propArray" second element is incorrect
      expect(resultObj.mismatches[2].transactionJsonPath).to.eql('$.request.body.urlencoded[4].value');
      expect(resultObj.mismatches[2].suggestedFix.actualValue).to.eql('999');
      expect(resultObj.mismatches[2].suggestedFix.suggestedValue).to.eql('exampleString');
      done();
    });
  });

  describe('findMatchingRequestFromSchema function', function () {
    it('#GITHUB-9396 Should maintain correct order of matched endpoint', function (done) {
      let schema = {
          paths: {
            '/lookups': {
              'get': { 'summary': 'Lookup Job Values' }
            },
            '/{jobid}': {
              'get': {
                'summary': 'Get Job by ID',
                'parameters': [
                  {
                    'in': 'path',
                    'name': 'jobid',
                    'schema': {
                      'type': 'string'
                    },
                    'required': true,
                    'description': 'Unique identifier for a job to retrieve.',
                    'example': '{{jobid}}'
                  }
                ]
              }
            }
          }
        },
        schemaPath = '{{baseUrl}}/{{jobid}}',
        result;

      result = schemaUtils.findMatchingRequestFromSchema('GET', schemaPath, schema, { strictRequestMatching: true });

      expect(result).to.have.lengthOf(2);
      expect(result[0].name).to.eql('GET /{jobid}');
      expect(result[1].name).to.eql('GET /lookups');
      done();
    });
  });
});
