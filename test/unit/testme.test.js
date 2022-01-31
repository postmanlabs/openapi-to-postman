const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  OPENAPI_31_COLLECTIONS = '../data/31CollectionTransactions',
  _ = require('lodash');

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
