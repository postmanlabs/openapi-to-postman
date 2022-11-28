var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
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

describe('validateTransaction convert and validate schemas with deprecated elements', function () {

  it('Should convert and validate and include deprecated operation default option', function () {
    const openAPI = path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: openAPIData }, options);
    schemaPack.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item.length).to.equal(1);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        expect(err).to.be.null;
        expect(result.missingEndpoints.length).to.eq(0);

        let requestIds = Object.keys(result.requests);
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0]).to.not.be.undefined;
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
        });
      });
    });
  });

  it('Should convert and validate and include deprecated operation', function () {
    const openAPI = path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: openAPIData }, options);
    schemaPack.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item.length).to.equal(1);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        expect(err).to.be.null;
        expect(result.missingEndpoints.length).to.eq(0);

        let requestIds = Object.keys(result.requests);
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0]).to.not.be.undefined;
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
        });
      });
    });
  });

  it('Should convert and validate not including deprecated operation and no missing endpoint', function () {
    const openAPI = path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: false
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: openAPIData }, options);
    schemaPack.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item.length).to.equal(1);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        expect(err).to.be.null;
        expect(result.missingEndpoints.length).to.eq(0);
        let requestIds = Object.keys(result.requests);
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0]).to.not.be.undefined;
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
        });
      });
    });
  });

  it('Should convert and validate including deprecated operation and report mismatch' +
    'when missing', function () {
    const openAPI = path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: openAPIData }, options);
    schemaPack.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item.length).to.equal(1);

      let historyRequest = [];

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      historyRequest.shift();
      schemaPack.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        expect(err).to.be.null;
        expect(result.missingEndpoints.length).to.eq(1);
        expect(result.missingEndpoints[0].endpoint).to.eq('GET /pets');
        let requestIds = Object.keys(result.requests);
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0]).to.not.be.undefined;
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
        });
      });
    });
  });

  it('Should convert and validate including deprecated operation and validate when deprecated is present', function () {
    const openAPI = path.join(__dirname, VALID_OPENAPI_FOLDER_PATH + '/has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: true
      },
      schemaPack = new Converter.SchemaPack({ type: 'string', data: openAPIData }, options);
    schemaPack.convert((err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      let historyRequest = [],
        optionsOtherSchemaPack = {
          showMissingInSchemaErrors: true,
          strictRequestMatching: true,
          ignoreUnresolvedVariables: true,
          includeDeprecated: false
        },
        schemaPack2 = new Converter.SchemaPack({ type: 'string', data: openAPIData }, optionsOtherSchemaPack);

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack2.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        expect(err).to.be.null;
        let requestIds = Object.keys(result.requests);
        requestIds.forEach((requestId) => {
          expect(result.requests[requestId].endpoints[0]).to.not.be.undefined;
          expect(result.requests[requestId].endpoints[0].matched).to.be.true;
        });
      });
    });
  });
});
