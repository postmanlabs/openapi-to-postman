const { MODULE_VERSION } = require('../../lib/schemapack.js');

var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  requestMatchingUtils = require('../../libV2/requestMatchingUtils'),
  VALIDATION_DATA_FOLDER_PATH = '../data/validationData',
  VALIDATION_DATA_OPTIONS_FOLDER_31_PATH = '../data/31CollectionTransactions/validateOptions',
  VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH = '../data/31CollectionTransactions/validate30Scenarios',
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

/**
 * Generates random id for collection items
 * @returns {String} Random Id
 */
function idstr () {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Extract all transaction from collection and appends them into array
 * And adds id to each item object
 *
 * @param {*} collection - Postman Collection
 * @param {*} allRequests - Array to which transactions are appended
 * @returns {*} - null
 */
function getAllTransactionsInjectingId (collection, allRequests) {
  if (!_.has(collection, 'item') || !_.isArray(collection.item)) {
    return;
  }
  _.forEach(collection.item, (item) => {
    if (_.has(item, 'request') || _.has(item, 'response')) {
      // let idstr = _.get(item, 'request.method') + ' ' + _.join(_.get(item, 'request.url.path'), '/');
      allRequests.push(_.assign({}, _.omit(item, ['id', 'response']), {
        id: idstr(),
        response: _.map(item.response, (res) => {
          return _.assign({}, res, { id: idstr() });
        })
      }));
    }
    else {
      getAllTransactionsInjectingId(item, allRequests);
    }
  });
}

/**
 * Gets an array of objects with the specification file path and the version
 * @param {array} foldersByVersion An array with the path of the folders that contain the validation test files
 * @param {*} fileName the name of the file (all scenarios must be in both folders)
 * @returns {array} An array with objects that contains the version and the specification file path
 */
function getSpecsPathByVersion(foldersByVersion, fileName) {
  return foldersByVersion.map((folderData) => {
    return {
      path: path.join(__dirname, folderData.path + fileName),
      version: folderData.version
    };
  });
}

/**
 * Returns an array with objects with the version and the folder where the files are
 * @param {string} folder30Path the path of the 3.0 spec validation files folder
 * @param {*} folder31Path the path of the 3.1 spec validation files folder
 * @returns {array} An array with objects that contain the version and the corresponding files folder
 */
function getFoldersByVersion(folder30Path, folder31Path) {
  return [{
    version: '3.0',
    path: folder30Path
  },
  {
    version: '3.1',
    path: folder31Path
  }];
}

describe('Validate with servers', function () {

  it('Fix for GITHUB#496: Should identify url with fragment', function () {
    const openAPI = path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/explicit_server_in_path.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
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
      schemaPack = new Converter.SchemaPack({ type: 'string', data: openAPIData }, options);
    schemaPack.convertV2((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransactionV2(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        let requestIds = Object.keys(result.requests);
        expect(err).to.be.null;
        expect(result.missingEndpoints.length).to.eq(0);
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0]).to.not.be.undefined;
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
        });
      });
    });
  });
});

describe('Validation with different resolution parameters options', function () {

  it('Should validate correctly with request and example parameters as Schema', function () {
    let fileData = fs.readFileSync(path.join(__dirname, VALID_OPENAPI_FOLDER_PATH,
        '/issue#479_2.yaml'), 'utf8'),
      options = {
        requestParametersResolution: 'Schema',
        exampleParametersResolution: 'Schema',
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        validateMetadata: true,
        suggestAvailableFixes: true,
        detailedBlobValidation: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: fileData }, options);
    schemaPack.convertV2((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransactionV2(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        let requestIds = Object.keys(result.requests);
        expect(err).to.be.null;
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
          const responsesIds = Object.keys(result.requests[requestId].endpoints[0].responses);
          responsesIds.forEach((responseId) => {
            expect(result.requests[requestId].endpoints[0].responses[responseId].matched).to.be.true;
          });
        });
      });
    });
  });

  it('Should validate correctly with request as schema and example parameters as Example', function () {
    let fileData = fs.readFileSync(path.join(__dirname, VALID_OPENAPI_FOLDER_PATH,
        '/issue#479_2.yaml'), 'utf8'),
      options = {
        requestParametersResolution: 'Schema',
        exampleParametersResolution: 'Example',
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        validateMetadata: true,
        suggestAvailableFixes: true,
        detailedBlobValidation: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: fileData }, options);
    schemaPack.convertV2((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransactionV2(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        let requestIds = Object.keys(result.requests);
        expect(err).to.be.null;
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
          const responsesIds = Object.keys(result.requests[requestId].endpoints[0].responses);
          responsesIds.forEach((responseId) => {
            expect(result.requests[requestId].endpoints[0].responses[responseId].matched).to.be.true;
          });
        });
      });
    });
  });

  it('Should validate correctly with request as Example and example parameters as Schema', function () {
    let fileData = fs.readFileSync(path.join(__dirname, VALID_OPENAPI_FOLDER_PATH,
        '/issue#479_2.yaml'), 'utf8'),
      options = {
        requestParametersResolution: 'Example',
        exampleParametersResolution: 'Schema',
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        validateMetadata: true,
        suggestAvailableFixes: true,
        detailedBlobValidation: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: fileData }, options);
    schemaPack.convertV2((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransactionV2(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        let requestIds = Object.keys(result.requests);
        expect(err).to.be.null;
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
          const responsesIds = Object.keys(result.requests[requestId].endpoints[0].responses);
          responsesIds.forEach((responseId) => {
            expect(result.requests[requestId].endpoints[0].responses[responseId].matched).to.be.true;
          });
        });
      });
    });
  });

  it('Should validate correctly with request and example parameters as Example', function () {
    let fileData = fs.readFileSync(path.join(__dirname, VALID_OPENAPI_FOLDER_PATH,
        '/issue#479_2.yaml'), 'utf8'),
      options = {
        requestParametersResolution: 'Example',
        exampleParametersResolution: 'Example',
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        validateMetadata: true,
        suggestAvailableFixes: true,
        detailedBlobValidation: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: fileData }, options);
    schemaPack.convertV2((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransactionV2(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        let requestIds = Object.keys(result.requests);
        expect(err).to.be.null;
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
          const responsesIds = Object.keys(result.requests[requestId].endpoints[0].responses);
          responsesIds.forEach((responseId) => {
            expect(result.requests[requestId].endpoints[0].responses[responseId].matched).to.be.true;
          });
        });
      });
    });
  });


});

describe('The validator must validate generated collection from schema against schema itself', function (done) {
  var validOpenapiFolder = fs.readdirSync(path.join(__dirname, VALID_OPENAPI_FOLDER_PATH)),
    suggestedFixProps = ['key', 'actualValue', 'suggestedValue'],
    checkMismatch = (mismatch) => {
      expect(['REQUEST_NAME', 'REQUEST_DESCRIPTION', 'PATHVARIABLE', 'QUERYPARAM', 'HEADER', 'RESPONSE_HEADER',
        'BODY', 'RESPONSE', 'RESPONSE_BODY', 'ENDPOINT']).to.include(mismatch.property);
      expect(mismatch).to.include.keys('transactionJsonPath');
      expect(mismatch).to.include.keys('schemaJsonPath');
      expect(mismatch.reason).to.be.a('string');
      expect(['MISSING_IN_REQUEST', 'INVALID_TYPE', 'MISSING_IN_SCHEMA', 'INVALID_VALUE', 'INVALID_BODY',
        'INVALID_RESPONSE_BODY', 'BODY_SCHEMA_NOT_FOUND', 'MISSING_ENDPOINT']).to.include(mismatch.reasonCode);
    };

  // Skipping nested_schemas.yaml for now.
  validOpenapiFolder = _.filter(validOpenapiFolder, (file) => {
    return file !== 'nested_schemas.yaml';
  });

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
      this.timeout(30000);

      schemaPack.convertV2((err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        let historyRequest = [];

        getAllTransactions(conversionResult.output[0].data, historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
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
  }, done);
});

describe('The Validation option', function () {
  const strictRequestMatchingSpecs = getSpecsPathByVersion(
      getFoldersByVersion(VALIDATION_DATA_FOLDER_PATH, VALIDATION_DATA_OPTIONS_FOLDER_31_PATH),
      '/strictRequestMatchingSpec.yaml'
    ),
    strictRequestMatchingCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/strictRequestMatchingCollection.json'),
    ignoreUnresolvedVariablesSpecs = getSpecsPathByVersion(
      getFoldersByVersion(VALIDATION_DATA_FOLDER_PATH, VALIDATION_DATA_OPTIONS_FOLDER_31_PATH),
      '/ignoreUnresolvedVariablesSpec.yaml'),
    ignoreUnresolvedVariablesCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/ignoreUnresolvedVariablesCollection.json'),
    validateMetadataSpecs = getSpecsPathByVersion(
      getFoldersByVersion(VALIDATION_DATA_FOLDER_PATH, VALIDATION_DATA_OPTIONS_FOLDER_31_PATH),
      '/validateMetadataSpec.yaml'),
    validateMetadataCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/validateMetadataCollection.json'),
    suggestAvailableFixesSpecs = getSpecsPathByVersion(
      getFoldersByVersion(VALIDATION_DATA_FOLDER_PATH, VALIDATION_DATA_OPTIONS_FOLDER_31_PATH),
      '/suggestAvailableFixesSpec.yaml'),
    suggestAvailableFixesCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/suggestAvailableFixesCollection.json'),
    detailedBlobValidationSpecs = getSpecsPathByVersion(
      getFoldersByVersion(VALIDATION_DATA_FOLDER_PATH, VALIDATION_DATA_OPTIONS_FOLDER_31_PATH),
      '/detailedBlobValidationSpec.yaml'),
    detailedBlobValidationCollection = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/detailedBlobValidationCollection.json');

  describe('strictRequestMatching ', function () {

    strictRequestMatchingSpecs.forEach((specData) => {
      it('should strictly match collection request with corresponding schema endpoint/s - version: ' +
        specData.version, function (done) {
        const schema = fs.readFileSync(specData.path, 'utf8'),
          collection = fs.readFileSync(strictRequestMatchingCollection, 'utf8'),
          schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
            { strictRequestMatching: true }),
          historyRequest = [];

        getAllTransactions(JSON.parse(collection), historyRequest);
        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
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
  });

  describe('ignoreUnresolvedVariables ', function () {
    ignoreUnresolvedVariablesSpecs.forEach((specData) => {
      it('should ignore all mismatches happening due to collection/environment variables present in request ' +
        '- version: ' + specData.version, function (done) {
        var schema = fs.readFileSync(specData.path, 'utf8'),
          collection = fs.readFileSync(ignoreUnresolvedVariablesCollection, 'utf8'),
          schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
            { ignoreUnresolvedVariables: true }),
          historyRequest = [];

        getAllTransactions(JSON.parse(collection), historyRequest);
        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
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
  });

  describe('validateMetadata ', function () {
    validateMetadataSpecs.forEach((specData) => {
      let schema = fs.readFileSync(specData.path, 'utf8'),
        collection = fs.readFileSync(validateMetadataCollection, 'utf8'),
        schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
          { validateMetadata: true, suggestAvailableFixes: true }),
        historyRequest = [],
        resultObj1;

      before(function (done) {
        getAllTransactions(JSON.parse(collection), historyRequest);
        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          resultObj1 = result.requests[historyRequest[0].id].endpoints[0];
          done();
        });
      });

      it('should validate request name and description according to schema - version: ' +
        specData.version, function () {
        expect(resultObj1.mismatches).to.have.lengthOf(1);
        expect(resultObj1.mismatches[0].property).to.eql('REQUEST_NAME');
        expect(resultObj1.mismatches[0].reasonCode).to.eql('INVALID_VALUE');
        expect(resultObj1.mismatches[0].reason).to.eql('The request name didn\'t match with specified schema');
        expect(resultObj1.mismatches[0].suggestedFix.suggestedValue).to.eql('List all pets Updated');
      });
    });
  });

  describe('suggestAvailableFixes ', function () {
    suggestAvailableFixesSpecs.forEach((specData) => {
      let schema = fs.readFileSync(specData.path, 'utf8'),
        collection = fs.readFileSync(suggestAvailableFixesCollection, 'utf8'),
        schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
          { suggestAvailableFixes: true }),
        historyRequest = [],
        resultObj,
        responseResult,
        propertyMismatchMap = {};

      before(function (done) {
        getAllTransactions(JSON.parse(collection), historyRequest);
        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
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

      it('should suggest valid available fix for all kind of violated properties - version: ' +
        specData.version, function () {
        // check for all suggested value to be according to schema
        expect(_.isInteger(propertyMismatchMap.PATHVARIABLE.suggestedFix.suggestedValue)).to.eql(true);
        expect(propertyMismatchMap.QUERYPARAM.suggestedFix.suggestedValue).to.be.a('number');
        expect(propertyMismatchMap.HEADER.suggestedFix.suggestedValue.value).to.be.a('boolean');
        expect(propertyMismatchMap.HEADER.suggestedFix.suggestedValue.description)
          .to.eql('(Required) Quantity of pets available');
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

      it('should maintain valid properties/items in suggested value - version:' +
        specData.version, function () {
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
  });

  describe('detailedBlobValidation ', function () {
    detailedBlobValidationSpecs.forEach((specData) => {
      it('should provide detailed mismatches for each schema keyword violation - version:' +
        specData.version, function (done) {
        var schema = fs.readFileSync(specData.path, 'utf8'),
          collection = fs.readFileSync(detailedBlobValidationCollection, 'utf8'),
          schemaPack = new Converter.SchemaPack({ type: 'string', data: schema },
            { detailedBlobValidation: true }),
          historyRequest = [],
          resultObj,
          violatedKeywords = {
            'data.items.minProperties': '$.request.body.data[0]',
            'data.items.required': '$.request.body.data[0]',
            'data.items.properties.entityId.maxLength': '$.request.body.data[0].entityId',
            'data.items.properties.accountNumber.minLength': '$.request.body.data[0].accountNumber',
            'data.items.properties.entityName.format': '$.request.body.data[0].entityName',
            'data.items.properties.incType.enum': '$.request.body.data[0].incType',
            'data.items.properties.companyNumber.exclusiveMinimum': '$.request.body.data[0].companyNumber',
            'data.items.properties.website.type': '$.request.body.data[0].website',
            'data.items.properties.turnover.multipleOf': '$.request.body.data[0].turnover',
            'data.items.properties.description.pattern': '$.request.body.data[0].description',
            'data.items.properties.wants.uniqueItems': '$.request.body.data[0].wants',
            'data.items.properties.user.properties.entityId.maxLength': '$.request.body.data[0].user.entityId',
            'meta.maxProperties': '$.request.body.meta',
            'meta.additionalProperties': '$.request.body.meta'
          };

        getAllTransactions(JSON.parse(collection), historyRequest);
        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          resultObj = result.requests[historyRequest[0].id].endpoints[0];

          // map all mismatch objects with it's property
          _.forEach(resultObj.mismatches, (mismatch) => {
            // remove starting string '$.paths[/user].post.requestBody.content[application/json].schema.properties.'
            let localJsonPath = mismatch.schemaJsonPath.slice(76);
            expect(_.includes(_.keys(violatedKeywords), localJsonPath)).to.eql(true);
            expect(_.includes(_.values(violatedKeywords), mismatch.transactionJsonPath)).to.eql(true);

            // mark matched path as empty to ensure repetition does'n occur
            violatedKeywords[_.indexOf(violatedKeywords, localJsonPath)] = '';
          });
          done();
        });
      });
    });
  });
});

describe('VALIDATE FUNCTION TESTS ', function () {
  describe('validateTransaction function', function () {
    const emptyParameterSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/emptyParameterSpec.yaml'
      ),
      implicitHeadersSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/implicitHeaderSpec.yaml'
      ),
      rootKeywordViolationSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/rootKeywordViolationSpec.yaml'
      ),
      doubleValidationFixSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/doubleValidationFixSpec.yaml'
      ),
      internalRefsSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/internalRefsSpec.yaml'
      ),
      differentContentTypesSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/differentContentTypesSpec.yaml'
      ),
      primitiveDataTypeBodySpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/primitiveDataTypeBodySpec.yaml'
      ),
      multiplePathVarSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/multiplePathVarSpec.json'
      ),
      nestedObjectParamsSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/nestedObjectParamsSpec.yaml'
      ),
      queryParamDeepObjectSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/queryParamDeepObjectSpec.yaml'
      ),
      compositeSchemaSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/compositeSchemaSpec.yaml'
      ),
      invalidTypeProperty = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/invalidTypeProperty.yaml'
      ),
      oneOfChildPropertyNoType = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/oneOfChildNoTypeSpec.json'
      ),
      missingResponsesSpecs = getSpecsPathByVersion(
        getFoldersByVersion(
          VALIDATION_DATA_FOLDER_PATH,
          VALIDATION_DATA_SCENARIOS_FOLDER_31_PATH
        ),
        '/missingResponsesSpec.yaml'
      );

    emptyParameterSpecs.forEach((specData) => {
      it('Should not fail if spec to validate contains empty parameters - version:' +
        specData.version, function (done) {
        let emptyParameterSpec = fs.readFileSync(specData.path, 'utf-8'),
          emptyParameterCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/emptyParameterCollection.json'), 'utf-8'),
          resultObj,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: emptyParameterSpec }, {});

        getAllTransactions(JSON.parse(emptyParameterCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObj = result.requests[historyRequest[0].id].endpoints[0];
          expect(resultObj.mismatches).to.have.lengthOf(0);
          done();
        });
      });
    });

    implicitHeadersSpecs.forEach((specData) => {
      it('Should correctly handle transactionPath property when Implicit headers are present - version:' +
        specData.version, function (done) {
        let implicitHeaderSpec = fs.readFileSync(specData.path, 'utf-8'),
          implicitHeaderCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/implicitHeaderCollection.json'), 'utf-8'),
          resultObj,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: implicitHeaderSpec }, {});

        getAllTransactions(JSON.parse(implicitHeaderCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
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
    });

    rootKeywordViolationSpecs.forEach((specData) => {
      it('Should correctly suggest value when violated keyword is at root level - version: ' +
        specData.version, function (done) {
        let rootKeywordViolationSpec = fs.readFileSync(specData.path, 'utf-8'),
          rootKeywordViolationCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/rootKeywordViolationCollection.json'), 'utf-8'),
          options = { suggestAvailableFixes: true },
          resultObj,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: rootKeywordViolationSpec }, options);

        getAllTransactions(JSON.parse(rootKeywordViolationCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
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
    });

    doubleValidationFixSpecs.forEach((specData) => {
      it('Should correctly suggest value when property is vioalting multiple keywords - version: ' +
        specData.version, function (done) {
        let doubleValidationFixSpec = fs.readFileSync(specData.path, 'utf-8'),
          options = { requestParametersResolution: 'Example', suggestAvailableFixes: true },
          resultObj,
          schemaPack = new Converter.SchemaPack({ type: 'string', data: doubleValidationFixSpec }, options);

        schemaPack.convertV2((err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);

          let historyRequest = [];

          getAllTransactions(conversionResult.output[0].data, historyRequest);

          schemaPack.validateTransactionV2(historyRequest, (err, result) => {
            expect(err).to.be.null;
            expect(result).to.be.an('object');
            resultObj = result.requests[historyRequest[0].id].endpoints[0];

            expect(resultObj.mismatches).to.have.lengthOf(0);

            done();
          });
        });
      });
    });

    internalRefsSpecs.forEach((specData) => {
      it('Should correctly handle internal $ref when present - version: ' +
        specData.version, function (done) {
        let internalRefsSpec = fs.readFileSync(specData.path, 'utf-8'),
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

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          _.forEach(historyRequest, (hr) => {
            resultObj = result.requests[hr.id].endpoints[0];

            // no mismatches should be found when resolved correctly
            expect(resultObj.matched).to.be.true;
            expect(resultObj.mismatches).to.have.lengthOf(0);
            _.forEach(resultObj.responses, (response) => {
              expect(response.matched).to.be.true;
              expect(response.mismatches).to.have.lengthOf(0);
            });
          });
          done();
        });
      });
    });

    differentContentTypesSpecs.forEach((specData) => {
      it('Should correctly match and validate content type headers having wildcard characters' +
        ' with collection req/res body', function (done) {
        let differentContentTypesSpec = fs.readFileSync(specData.path, 'utf-8'),
          differentContentTypesCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/differentContentTypesCollection.json'), 'utf-8'),
          resultObj,
          historyRequest = [],
          options = {
            showMissingInSchemaErrors: true,
            suggestAvailableFixes: true
          },
          schemaPack = new Converter.SchemaPack({ type: 'string', data: differentContentTypesSpec }, options);

        getAllTransactions(JSON.parse(differentContentTypesCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObj = result.requests[historyRequest[1].id].endpoints[0];

          /**
           * Both req and res body should have matched content types
           */
          expect(resultObj.matched).to.eql(true);
          expect(resultObj.mismatches).to.have.lengthOf(0);
          expect(resultObj.responses[_.keys(resultObj.responses)[0]].matched).to.eql(true);
          expect(resultObj.responses[_.keys(resultObj.responses)[0]].mismatches).to.have.lengthOf(0);
          done();
        });
      });

      it('Should correctly match and validate valid json content type with collection req/res body - version:' +
       specData.version, function (done) {
        let differentContentTypesSpec = fs.readFileSync(specData.path, 'utf-8'),
          differentContentTypesCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/differentContentTypesCollection.json'), 'utf-8'),
          resultObj,
          historyRequest = [],
          options = {
            suggestAvailableFixes: true
          },
          schemaPack = new Converter.SchemaPack({ type: 'string', data: differentContentTypesSpec }, options);

        getAllTransactions(JSON.parse(differentContentTypesCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
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
    });

    primitiveDataTypeBodySpecs.forEach((specData) => {
      it('Should be able to validate and suggest correct value for body with primitive data type - version: ' +
        specData.version, function (done) {
        let primitiveDataTypeBodySpec = fs.readFileSync(specData.path, 'utf-8'),
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
            detailedBlobValidation: true
          },
          schemaPack = new Converter.SchemaPack({ type: 'string', data: primitiveDataTypeBodySpec }, options);

        getAllTransactions(JSON.parse(primitiveDataTypeBodyCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          // request body is boolean
          resultObj = result.requests[historyRequest[0].id].endpoints[0];
          expect(resultObj.mismatches).to.have.lengthOf(0);
          const responseId = _.keys(resultObj.responses)[0];
          // request body is integer
          responseObj = resultObj.responses[responseId];
          expect(responseObj.mismatches).to.have.lengthOf(1);
          expect(responseObj.mismatches[0].suggestedFix.suggestedValue).to.be.within(5, 10);
          expect(responseObj.mismatches[0].transactionJsonPath).to
            .equal(`$.responses[${responseId}].body`);
          done();
        });
      });
    });

    multiplePathVarSpecs.forEach((specData) => {
      it('Should correctly validate path variable in collection that are part of URL itself and are ' +
        'not present in $request.url.variable', function (done) {
        let multiplePathVarSpec = fs.readFileSync(specData.path, 'utf-8'),
          multiplePathVarCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/multiplePathVarCollection.json'), 'utf-8'),
          resultObj,
          historyRequest = [],
          options = {
            detailedBlobValidation: true,
            allowUrlPathVarMatching: true
          },
          schemaPack = new Converter.SchemaPack({ type: 'string', data: multiplePathVarSpec }, options);

        getAllTransactions(JSON.parse(multiplePathVarCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          resultObj = result.requests[historyRequest[2].id].endpoints[0];
          expect(resultObj.mismatches).to.have.lengthOf(0);
          done();
        });
      });

      it('Should correctly validate schema having path with various path variables - version: ' +
        specData.version, function (done) {
        let multiplePathVarSpec = fs.readFileSync(specData.path, 'utf-8'),
          multiplePathVarCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/multiplePathVarCollection.json'), 'utf-8'),
          resultObj1,
          resultObj2,
          historyRequest = [],
          options = {
            showMissingInSchemaErrors: true,
            strictRequestMatching: true,
            ignoreUnresolvedVariables: true,
            suggestAvailableFixes: true
          },
          schemaPack = new Converter.SchemaPack({ type: 'string', data: multiplePathVarSpec }, options);

        getAllTransactions(JSON.parse(multiplePathVarCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          resultObj1 = result.requests[historyRequest[0].id].endpoints[0];
          expect(resultObj1.mismatches).to.have.lengthOf(0);

          resultObj2 = result.requests[historyRequest[1].id].endpoints[0];
          expect(resultObj2.mismatches).to.have.lengthOf(1);
          expect(resultObj2.mismatches[0].reasonCode).to.eql('MISSING_IN_REQUEST');
          done();
        });
      });
    });

    nestedObjectParamsSpecs.forEach((specData) => {
      it('Should ignore mismatches for nested objects in parameters - version: ' +
        specData.version, function (done) {
        let nestedObjectParamsSpec = fs.readFileSync(specData.path, 'utf-8'),
          nestedObjectParamsCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/nestedObjectParamsCollection.json'), 'utf-8'),
          resultObj,
          historyRequest = [],
          options = {
            showMissingInSchemaErrors: true,
            strictRequestMatching: true,
            ignoreUnresolvedVariables: true,
            suggestAvailableFixes: true
          },
          schemaPack = new Converter.SchemaPack({ type: 'string', data: nestedObjectParamsSpec }, options);

        getAllTransactions(JSON.parse(nestedObjectParamsCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          resultObj = result.requests[historyRequest[0].id].endpoints[0];
          expect(resultObj.mismatches).to.have.lengthOf(0);
          done();
        });
      });
    });

    queryParamDeepObjectSpecs.forEach((specData) => {
      it('Should be able to validate schema with deepObject style query params against corresponding ' +
      'transactions - version: ' + specData.version, function (done) {
        let queryParamDeepObjectSpec = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
          '/queryParamDeepObjectSpec.yaml'), 'utf-8'),
          queryParamDeepObjectCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/queryParamDeepObjectCollection.json'), 'utf-8'),
          resultObj,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: queryParamDeepObjectSpec },
            { suggestAvailableFixes: true, showMissingInSchemaErrors: true });

        getAllTransactions(JSON.parse(queryParamDeepObjectCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObj = result.requests[historyRequest[0].id].endpoints[0];
          expect(resultObj.mismatches).to.have.lengthOf(2);

          /**
           * no mismatches should be found for complex array type params as validation is skipped for them,
           * even though corresponding value is of incorrect type
           */
          _.forEach(resultObj.mismatches, (mismatch) => {
            expect(mismatch.suggestedFix.key).to.not.eql('propArrayComplex[0][prop1ArrayComp]');
          });

          // for deepObject param "user", child param "user[id]" is of incorrect type
          expect(resultObj.mismatches[0].reasonCode).to.eql('INVALID_TYPE');
          expect(resultObj.mismatches[0].transactionJsonPath).to.eql('$.request.url.query[0].value');
          expect(resultObj.mismatches[0].suggestedFix.actualValue).to.eql('notAnInteger');
          expect(resultObj.mismatches[0].suggestedFix.suggestedValue).to.eql(123);

          // for deepObject param "user", child param "user[address][country]" is missing in transaction
          expect(resultObj.mismatches[1].reasonCode).to.eql('MISSING_IN_REQUEST');
          expect(resultObj.mismatches[1].suggestedFix.key).to.eql('user[address][country]');
          expect(resultObj.mismatches[1].suggestedFix.actualValue).to.be.null;
          expect(resultObj.mismatches[1].suggestedFix.suggestedValue).to.eql({
            key: 'user[address][country]',
            value: 'India',
            description: '(Required) info about user'
          });
          done();
        });
      });
    });

    compositeSchemaSpecs.forEach((specData) => {
      it('Should be able to correctly validate composite schemas with anyOf, oneOf and allOf keywords correctly ' +
      'against corresponding transactions - version: ' + specData.version, function (done) {
        let compositeSchemaSpec = fs.readFileSync(specData.path, 'utf-8'),
          compositeSchemaCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/compositeSchemaCollection.json'), 'utf-8'),
          resultObjAnyOf,
          resultObjOneOf,
          resultObjAllOf,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: compositeSchemaSpec },
            { suggestAvailableFixes: true, showMissingInSchemaErrors: true });

        getAllTransactions(JSON.parse(compositeSchemaCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObjAnyOf = result.requests[historyRequest[0].id].endpoints[0];
          resultObjOneOf = result.requests[historyRequest[1].id].endpoints[0];
          resultObjAllOf = result.requests[historyRequest[2].id].endpoints[0];

          /**
           * no mismatches should be found here even though value present in collection
           * is only valid as per 2nd element of anyOf keyword here
           */
          expect(resultObjAnyOf.mismatches).to.have.lengthOf(0);

          /**
           * no mismatches should be found here even though key present in collection request body
           * is only valid as per 2nd element of oneOf keyword here
           */
          expect(resultObjOneOf.mismatches).to.have.lengthOf(0);

          //
          expect(resultObjAllOf.mismatches).to.have.lengthOf(1);
          expect(resultObjAllOf.mismatches[0].reasonCode).to.eql('INVALID_BODY');
          expect(resultObjAllOf.mismatches[0].transactionJsonPath).to.eql('$.request.body');
          expect(resultObjAllOf.mismatches[0].schemaJsonPath).to
            .eql('$.paths[/pets/allOf].post.requestBody.content[application/json].schema');
          expect(resultObjAllOf.mismatches[0].suggestedFix.actualValue).to.eql({
            objectType: 'not an integer',
            objectType2: 'prop named objectType2'
          });
          expect(resultObjAllOf.mismatches[0].suggestedFix.suggestedValue).to.eql({
            objectType: 4321,
            objectType2: 'prop named objectType2'
          });

          done();
        });
      });
    });

    invalidTypeProperty.forEach((specData) => {
      it('Should correctly suggest value and report transactionJsonPath on a body property with incorrect value ' +
        specData.version, function (done) {
        let invalidTypePropertySpec = fs.readFileSync(specData.path, 'utf-8'),
          invalidTypePropertyCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/invalidTypeProperty.json'), 'utf-8'),
          options = { suggestAvailableFixes: true, detailedBlobValidation: true },
          resultObj,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: invalidTypePropertySpec }, options);

        getAllTransactions(JSON.parse(invalidTypePropertyCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObj = result.requests[historyRequest[0].id].endpoints[0];
          const responseId = _.keys(resultObj.responses)[0],
            responseMissmatches = resultObj.responses[responseId].mismatches;
          expect(responseMissmatches).to.have.lengthOf(2);
          expect(responseMissmatches[0].transactionJsonPath)
            .to.equal(`$.responses[${responseId}].body[0].tag`);
          expect(responseMissmatches[0].suggestedFix.key).to.equal('tag');
          expect(responseMissmatches[1].transactionJsonPath)
            .to.equal(`$.responses[${responseId}].body[1].tag`);
          expect(responseMissmatches[1].suggestedFix.key).to.equal('tag');
          done();
        });
      });
    });

    oneOfChildPropertyNoType.forEach((specData) => {
      it('Should correctly resolve and validate for oneOfChild scenarios ' +
        specData.version, function (done) {
        let invalidTypePropertySpec = fs.readFileSync(specData.path, 'utf-8'),
          invalidTypePropertyCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/oneOfChildNoTypeColl.json'), 'utf-8'),
          options = { allowUrlPathVarMatching: true, detailedBlobValidation: true },
          resultObj,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: invalidTypePropertySpec }, options);

        getAllTransactions(JSON.parse(invalidTypePropertyCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObj = result.requests[historyRequest[0].id].endpoints[0];
          const responseId = _.keys(resultObj.responses)[0],
            responseMissmatches = resultObj.responses[responseId].mismatches;
          expect(responseMissmatches).to.have.lengthOf(0);
          done();
        });
      });
    });

    missingResponsesSpecs.forEach((specData) => {
      it('Should correctly provide missing responses from schema and collection in result' +
        specData.version, function (done) {
        let missingResponsesSpec = fs.readFileSync(specData.path, 'utf-8'),
          missingResponsesCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
            '/missingResponsesCollection.json'), 'utf-8'),
          options = { suggestAvailableFixes: true, showMissingInSchemaErrors: true },
          resultObj1,
          resultObj2,
          responseKey,
          responseMissmatches,
          historyRequest = [],
          schemaPack = new Converter.SchemaPack({ type: 'string', data: missingResponsesSpec }, options);

        getAllTransactions(JSON.parse(missingResponsesCollection), historyRequest);

        schemaPack.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');
          resultObj1 = result.requests[historyRequest[0].id].endpoints[0];
          resultObj2 = result.requests[historyRequest[1].id].endpoints[0];

          expect(resultObj1.matched).to.be.false;
          expect(resultObj1.mismatches).to.be.empty;
          expect(resultObj1.missingResponses.length).to.eql(1);

          expect(resultObj1.missingResponses[0].property).to.eql('RESPONSE');
          expect(resultObj1.missingResponses[0].transactionJsonPath).to.eql('$.responses');
          expect(resultObj1.missingResponses[0].schemaJsonPath).to.eql('$.paths[/pets].get.responses.200');
          expect(resultObj1.missingResponses[0].reasonCode).to.eql('MISSING_IN_REQUEST');
          expect(resultObj1.missingResponses[0].reason).to.eql(
            'The response \"200\" was not found in the transaction');

          expect(resultObj1.missingResponses[0].suggestedFix.key).to.eql('200');
          const requiredResponseProps = ['id', 'name', 'originalRequest', 'status', 'code', 'header',
              'body', 'cookie', '_postman_previewlanguage'],
            suggestedResponseProps = _.keys(resultObj1.missingResponses[0].suggestedFix.suggestedValue);

          expect(_.difference(requiredResponseProps, suggestedResponseProps)).to.be.empty;

          expect(resultObj2.matched).to.be.false;
          expect(resultObj2.mismatches).to.be.empty;
          expect(resultObj2.missingResponses.length).to.eql(1);

          responseKey = _.keys(resultObj2.responses)[0];
          responseMissmatches = resultObj2.responses[responseKey].mismatches;

          expect(responseMissmatches.length).to.eql(1);
          expect(responseMissmatches[0].property).to.eql('RESPONSE');
          expect(responseMissmatches[0].transactionJsonPath).to.eql(`$.responses[${responseKey}]`);
          expect(responseMissmatches[0].schemaJsonPath).to.be.null;
          expect(responseMissmatches[0].reasonCode).to.eql('MISSING_IN_SCHEMA');
          expect(responseMissmatches[0].reason).to.eql(
            'The response \"200\" was not found in the schema');
          done();
        });
      });
    });
  });

  describe('getPostmanUrlSuffixSchemaScore function', function () {
    it('Should maintain correct order in which path vaiables occur in result', function (done) {
      let pmSuffix = ['pets', '123', '456', '789'],
        schemaPath = ['pets', '{petId1}', '{petId2}', '{petId3}'],
        result;

      result = requestMatchingUtils.getPostmanUrlSuffixSchemaScore(pmSuffix, schemaPath,
        { strictRequestMatching: true });

      expect(result.match).to.be.true;
      expect(result.pathVars).to.have.lengthOf(3);
      expect(result.pathVars[0]).to.deep.equal({ key: 'petId1', value: pmSuffix[1] });
      expect(result.pathVars[1]).to.deep.equal({ key: 'petId2', value: pmSuffix[2] });
      expect(result.pathVars[2]).to.deep.equal({ key: 'petId3', value: pmSuffix[3] });
      done();
    });
  });

  it('Should report a mismatch when the response body is not valid', function (done) {
    let allOfExample = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
      '/invalid_response_body_all_of_properties_spec.json'), 'utf-8'),
      allOfCollection = fs.readFileSync(path.join(__dirname, VALIDATION_DATA_FOLDER_PATH +
        '/invalid_response_body_all_of_properties_collection.json'), 'utf-8'),
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: allOfExample },
        { suggestAvailableFixes: true, showMissingInSchemaErrors: true });

    getAllTransactions(JSON.parse(allOfCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      const requestId = historyRequest[0].id,
        request = result.requests[requestId],
        responseId = historyRequest[0].response[0].id,
        response = request.endpoints[0].responses[responseId];
      expect(err).to.be.null;
      expect(request.endpoints[0].matched).to.equal(false);
      expect(response.matched).to.equal(false);
      expect(response.mismatches).to.have.length(1);
      expect(response.mismatches[0].reason)
        .to.equal('The response body didn\'t match the specified schema');
      done();
    });
  });
});

describe('validateTransaction method. Path variables matching validation (issue #478)', function() {
  it('Should validate correctly while a path param in spec does not matches with collection' +
  ' (issue#478)', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(issueFolder + '/path-variable-does-not-match-spec.yaml', 'utf-8'),
      issueCollection = fs.readFileSync(issueFolder + '/path-variable-does-not-match-collection.json', 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: issueSpec }, { allowUrlPathVarMatching: false });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(1);
      expect(resultObj.mismatches[0].reasonCode).to.be.equal('MISSING_IN_REQUEST');
      expect(resultObj.mismatches[0].reason).to.be.equal(
        'The petId path variable does not match with path variable expected (peterId)' +
        ' in the schema at this position'
      );
      done();
    });
  });

  it('Should validate correctly while a path param in spec does not matches with collection' +
  ' (issue#478), allowUrlPathVarMatching: true', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(issueFolder + '/path-variable-does-not-match-spec.yaml', 'utf-8'),
      issueCollection = fs.readFileSync(issueFolder + '/path-variable-does-not-match-collection.json', 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: issueSpec }, { allowUrlPathVarMatching: true });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(0);
      done();
    });
  });

  it('Should validate correctly when a path param in spec does not matches with collection ' +
    'and there are path variables in local servers object (issue#478)', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(issueFolder + '/local-servers-path-variables-spec.yaml', 'utf-8'),
      issueCollection = fs.readFileSync(issueFolder + '/local-servers-path-variables-collection.json', 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: issueSpec }, { allowUrlPathVarMatching: false });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(1);
      expect(resultObj.mismatches[0].reason).to.equal(
        'The petId path variable does not match with path variable expected (peterId)' +
        ' in the schema at this position'
      );
      expect(resultObj.mismatches[0].reasonCode).to.equal('MISSING_IN_REQUEST');
      done();
    });
  });

  it('Should validate correctly when a path param in spec does not matches with collection ' +
    'and there are path variables in global servers object (issue#478)', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(issueFolder + '/global-servers-path-variables-spec.yaml', 'utf-8'),
      issueCollection = fs.readFileSync(issueFolder + '/global-servers-path-variables-collection.json', 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: issueSpec }, { allowUrlPathVarMatching: false });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(1);
      expect(resultObj.mismatches[0].reason).to.equal(
        'The petId path variable does not match with path variable expected (peterId)' +
        ' in the schema at this position'
      );
      expect(resultObj.mismatches[0].reasonCode).to.equal('MISSING_IN_REQUEST');
      done();
    });
  });

  it('Should validate correctly when a path param in spec does not matches with collection ' +
    'and there are path variables in global servers object (issue#478), suggestAvailableFixes: true', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(issueFolder + '/global-servers-path-variables-spec.yaml', 'utf-8'),
      issueCollection = fs.readFileSync(issueFolder + '/global-servers-path-variables-collection.json', 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack(
        { type: 'string', data: issueSpec },
        { allowUrlPathVarMatching: false, suggestAvailableFixes: true });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(1);
      expect(resultObj.mismatches[0].reason).to.equal(
        'The petId path variable does not match with path variable expected (peterId)' +
        ' in the schema at this position'
      );
      expect(resultObj.mismatches[0].reasonCode).to.equal('MISSING_IN_REQUEST');
      expect(resultObj.mismatches[0].suggestedFix.actualValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[0].suggestedFix.actualValue.key).to.be.equal('petId');
      expect(resultObj.mismatches[0].suggestedFix.suggestedValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[0].suggestedFix.suggestedValue.key).to.be.equal('peterId');
      expect(resultObj.mismatches[0].suggestedFix.key).to.be.equal('peterId');
      done();
    });
  });

  it('Should validate correctly when two path params in spec does not matches with collection ' +
    'and there are path variables in global servers object (issue#478), suggestAvailableFixes: true', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(
        issueFolder + '/global-servers-path-variables-two-vars-wrong-spec.yaml', 'utf-8'
      ),
      issueCollection = fs.readFileSync(
        issueFolder + '/global-servers-path-variables-two-vars-wrong-collection.json', 'utf-8'
      ),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack(
        { type: 'string', data: issueSpec },
        { allowUrlPathVarMatching: false, suggestAvailableFixes: true });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(2);
      expect(resultObj.mismatches[0].reason).to.equal(
        'The petId path variable does not match with path variable expected (peterId)' +
        ' in the schema at this position'
      );
      expect(resultObj.mismatches[0].reasonCode).to.equal('MISSING_IN_REQUEST');
      expect(resultObj.mismatches[1].reason).to.equal(
        'The wrongNamedId path variable does not match with path variable expected (correctName)' +
        ' in the schema at this position'
      );
      expect(resultObj.mismatches[1].reasonCode).to.equal('MISSING_IN_REQUEST');

      expect(resultObj.mismatches[0].suggestedFix.actualValue.key).to.be.equal('petId');
      expect(resultObj.mismatches[0].suggestedFix.actualValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[0].suggestedFix.suggestedValue.key).to.be.equal('peterId');
      expect(resultObj.mismatches[0].suggestedFix.suggestedValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[0].suggestedFix.key).to.be.equal('peterId');

      expect(resultObj.mismatches[1].suggestedFix.actualValue.key).to.be.equal('wrongNamedId');
      expect(resultObj.mismatches[1].suggestedFix.actualValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[1].suggestedFix.suggestedValue.key).to.be.equal('correctName');
      expect(resultObj.mismatches[1].suggestedFix.suggestedValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[1].suggestedFix.key).to.be.equal('correctName');
      done();
    });
  });

  it('Should validate correctly when one path param in spec does not matches with collection ' +
    ', global servers and one path var is not provided (issue#478), suggestAvailableFixes: true', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(
        issueFolder + '/global-servers-path-variables-two-vars-missing-one-spec.yaml', 'utf-8'
      ),
      issueCollection = fs.readFileSync(
        issueFolder + '/global-servers-path-variables-two-vars-missing-one-collection.json', 'utf-8'
      ),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack(
        { type: 'string', data: issueSpec },
        { allowUrlPathVarMatching: false, suggestAvailableFixes: true });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(2);
      expect(resultObj.mismatches[0].reason).to.equal(
        'The petId path variable does not match with path variable expected (peterId)' +
        ' in the schema at this position'
      );
      expect(resultObj.mismatches[0].reasonCode).to.equal('MISSING_IN_REQUEST');
      expect(resultObj.mismatches[1].reason).to.equal(
        'The required path variable "correctName" was not found in the transaction'
      );
      expect(resultObj.mismatches[1].reasonCode).to.equal('MISSING_IN_REQUEST');

      expect(resultObj.mismatches[0].suggestedFix.actualValue.key).to.be.equal('petId');
      expect(resultObj.mismatches[0].suggestedFix.actualValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[0].suggestedFix.suggestedValue.key).to.be.equal('peterId');
      expect(resultObj.mismatches[0].suggestedFix.suggestedValue).to.be.an('object')
        .to.have.all.keys('key', 'value', 'description');
      expect(resultObj.mismatches[0].suggestedFix.key).to.be.equal('peterId');

      expect(resultObj.mismatches[1].suggestedFix.actualValue).to.be.equal(null);
      expect(resultObj.mismatches[1].suggestedFix.suggestedValue).to.be.an('object')
        .to.include.keys(['description', 'key', 'value']);
      expect(resultObj.mismatches[1].suggestedFix.key).to.be.equal('correctName');
      done();
    });
  });

  it('Should validate correctly when one path param in spec does not matches with collection ' +
    ', global servers and one path var is not provided (issue#478), ' +
    'suggestAvailableFixes: true, allowUrlPathVarMatching: true', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(
        issueFolder + '/global-servers-path-variables-two-vars-missing-one-spec.yaml', 'utf-8'
      ),
      issueCollection = fs.readFileSync(
        issueFolder + '/global-servers-path-variables-two-vars-missing-one-collection.json', 'utf-8'
      ),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack(
        { type: 'string', data: issueSpec },
        { allowUrlPathVarMatching: true, suggestAvailableFixes: true });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransactionV2(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(0);
      done();
    });
  });
});

describe('validateTransaction convert and validate schemas with allOf', function () {
  it('Should convert and validate allOf properties for string schema', function (done) {
    const openAPI = path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/all_of_property.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      expectedRequestBody = '{\n  "id": "3",\n  "name": "Contract.pdf"\n}',
      options = {
        parametersResolution: 'Example',
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        validateMetadata: true,
        suggestAvailableFixes: true,
        detailedBlobValidation: false
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: openAPIData }, options, MODULE_VERSION.V2);
    schemaPack.convertV2((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item[0].item[0].response[0].body).to.equal(expectedRequestBody);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransactionV2(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        let requestIds = Object.keys(result.requests);
        expect(err).to.be.null;
        expect(result.missingEndpoints.length).to.eq(0);
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0]).to.not.be.undefined;
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
        });

        done();
      });
    });
  });
});

describe('Bug fixes', function () {
  it('should send correct transaction json path for invalid params when there are disabled query params ' +
  'in the request', function (done) {
    let collectionPath = path.join(__dirname, '../data/disabled_query_param_test_data/collection.json'),
      specPath = path.join(__dirname, '../data/disabled_query_param_test_data/spec.json'),
      collectionData = JSON.parse(fs.readFileSync(collectionPath, 'utf8')),
      spec = fs.readFileSync(specPath, 'utf8'),
      schemaPack = new Converter.SchemaPack({ type: 'string', data: spec }, {
        strictRequestMatching: true,
        detailedBlobValidation: true,
        suggestAvailableFixes: true,
        ignoreUnresolvedVariables: true,
        showMissingInSchemaErrors: true,
        validateMetadata: true,
        parametersResolution: 'Example'
      }),
      requests = [];

    getAllTransactionsInjectingId(collectionData, requests);

    schemaPack.validateTransactionV2(requests, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.be.an('object');

      // check for result.requests structure
      const requestId = Object.keys(result.requests)[0],
        mismatches = _.get(result, ['requests', requestId, 'endpoints', '0', 'mismatches']),
        queryParamMissingInSchemaMismatch =
          _.find(mismatches, { property: 'QUERYPARAM', reasonCode: 'MISSING_IN_SCHEMA' }),
        headerMissingInSchemaMismatch =
          _.find(mismatches, { property: 'HEADER', reasonCode: 'MISSING_IN_SCHEMA' });

      expect(queryParamMissingInSchemaMismatch.transactionJsonPath).to.be.equal('$.request.url.query[1]');
      expect(headerMissingInSchemaMismatch.transactionJsonPath).to.be.equal('$.request.header[2]');

      return done();
    });
  });

  it('should validate non required paramters', function (done) {
    let collectionPath = path.join(__dirname, '../data/disabled_query_param_test_data/collection.json'),
      specPath = path.join(__dirname, '../data/disabled_query_param_test_data/spec.json'),
      collectionData = JSON.parse(fs.readFileSync(collectionPath, 'utf8')),
      spec = fs.readFileSync(specPath, 'utf8'),
      schemaPack = new Converter.SchemaPack({ type: 'string', data: spec }, {
        strictRequestMatching: true,
        detailedBlobValidation: true,
        suggestAvailableFixes: true,
        ignoreUnresolvedVariables: true,
        showMissingInSchemaErrors: true,
        validateMetadata: true,
        parametersResolution: 'Example'
      }),
      requests = [];

    getAllTransactionsInjectingId(collectionData, requests);

    schemaPack.validateTransactionV2(requests, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.be.an('object');

      // check for result.requests structure
      const requestId = Object.keys(result.requests)[0],
        mismatches = _.get(result, ['requests', requestId, 'endpoints', '0', 'mismatches']),
        queryParamMissingInRequestMismatch =
          _.find(mismatches, { property: 'QUERYPARAM', reasonCode: 'MISSING_IN_REQUEST' }),
        headerMissingInRequestMismatch =
          _.find(mismatches, { property: 'HEADER', reasonCode: 'MISSING_IN_REQUEST' });

      expect(queryParamMissingInRequestMismatch.suggestedFix.suggestedValue.key).to.be.equal('changed');
      expect(headerMissingInRequestMismatch.suggestedFix.suggestedValue.key).to.be.equal('h1');

      return done();
    });
  });

  it('should validate non required parameters in url encoded body', function (done) {
    let collectionPath = path.join(__dirname, '../data/disabled_param_url_encoded_body/urlencodedBodyCollection.json'),
      specPath = path.join(__dirname, '../data/disabled_param_url_encoded_body/urlencodedBodySpec.yaml'),
      collectionData = JSON.parse(fs.readFileSync(collectionPath, 'utf8')),
      spec = fs.readFileSync(specPath, 'utf8'),
      schemaPack = new Converter.SchemaPack({ type: 'string', data: spec }, {
        strictRequestMatching: true,
        detailedBlobValidation: true,
        suggestAvailableFixes: true,
        ignoreUnresolvedVariables: true,
        showMissingInSchemaErrors: true,
        validateMetadata: true,
        parametersResolution: 'Example'
      }),
      requests = [];

    getAllTransactions(collectionData, requests);

    schemaPack.validateTransactionV2(requests, (err, result) => {
      expect(err).to.be.null;
      expect(result).to.be.an('object');

      // check for result.requests structure
      const requestId = Object.keys(result.requests)[0],
        mismatches = _.get(result, ['requests', requestId, 'endpoints', '0', 'mismatches']),
        nonRequiredParamMissingInRequest =
          _.find(mismatches, { property: 'BODY', reasonCode: 'MISSING_IN_REQUEST' });

      expect(nonRequiredParamMissingInRequest.schemaJsonPath).to.be.equal(
        '$.paths[/pets/{petId}].post.requestBody.content[application/x-www-form-urlencoded].' +
        'schema.properties[propMissingInReq]'
      );
      expect(nonRequiredParamMissingInRequest.suggestedFix.suggestedValue.key).to.be.equal('propMissingInReq');

      return done();
    });
  });
});
