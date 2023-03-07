const { MODULE_VERSION } = require('../../lib/schemapack.js');

var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  _ = require('lodash'),
  REAL_WORLD_EXAMPLES_PATH = '../data/realWorldExamples';

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

describe('validateTransactionV2() should be able to validate collections generated from convertV2()' +
  ' for real world example with parametersResolution=Schema: ', function (done) {
  var realWorldDefinitions = fs.readdirSync(path.join(__dirname, REAL_WORLD_EXAMPLES_PATH));

  async.each(realWorldDefinitions, function (file, cb) {
    it(file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, REAL_WORLD_EXAMPLES_PATH + '/' + file), 'utf8'),
        options = {
          parametersResolution: 'Schema',
          showMissingInSchemaErrors: true,
          strictRequestMatching: true,
          ignoreUnresolvedVariables: true,
          validateMetadata: true,
          suggestAvailableFixes: true,
          detailedBlobValidation: false
        },
        // Different schemaPack instances are used as conversion resolves schema differently then validation
        schemaPackConversion = new Converter.SchemaPack({ type: 'string', data: fileData }, options, MODULE_VERSION.V2),
        schemaPackValidation = new Converter.SchemaPack({ type: 'string', data: fileData }, options, MODULE_VERSION.V2);

      // Increase timeout for larger schema
      this.timeout(30000);

      schemaPackConversion.convertV2((err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        let historyRequest = [];

        getAllTransactions(conversionResult.output[0].data, historyRequest);

        schemaPackValidation.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          // No mismatches should be present for any request
          _.forEach(result.requests, (req) => {
            expect(req.requestId).to.be.a('string');

            // Use first/highest matched endpoint
            expect(req.endpoints[0].matched).to.be.true;
          });

          // No endpoint should be reported missing
          expect(result.missingEndpoints).to.be.empty;
          return cb(null);
        });
      });
    });
  }, done);
});

describe('validateTransactionV2() should be able to validate collections generated from convertV2()' +
  ' for real world example with parametersResolution=Example: ', function (done) {
  var realWorldDefinitions = fs.readdirSync(path.join(__dirname, REAL_WORLD_EXAMPLES_PATH));

  async.each(realWorldDefinitions, function (file, cb) {
    it(file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, REAL_WORLD_EXAMPLES_PATH + '/' + file), 'utf8'),
        options = {
          parametersResolution: 'Example',
          showMissingInSchemaErrors: true,
          strictRequestMatching: true,
          ignoreUnresolvedVariables: true,
          validateMetadata: true,
          suggestAvailableFixes: true,
          detailedBlobValidation: false
        },
        // Different schemaPack instances are used as conversion resolves schema differently then validation
        schemaPackConversion = new Converter.SchemaPack({ type: 'string', data: fileData }, options, MODULE_VERSION.V2),
        schemaPackValidation = new Converter.SchemaPack({ type: 'string', data: fileData }, options, MODULE_VERSION.V2);

      // Increase timeout for larger schema
      this.timeout(30000);

      schemaPackConversion.convertV2((err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        let historyRequest = [];

        getAllTransactions(conversionResult.output[0].data, historyRequest);

        schemaPackValidation.validateTransactionV2(historyRequest, (err, result) => {
          expect(err).to.be.null;
          expect(result).to.be.an('object');

          // No mismatches should be present for any request
          _.forEach(result.requests, (req) => {
            expect(req.requestId).to.be.a('string');

            // Use first/highest matched endpoint
            expect(req.endpoints[0].matched).to.be.true;
          });

          // No endpoint should be reported missing
          expect(result.missingEndpoints).to.be.empty;
          return cb(null);
        });
      });
    });
  }, done);
});
