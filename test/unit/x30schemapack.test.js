const expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  VALIDATION_DATA_FOLDER_PATH = '../data/validationData';

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

describe('validateTransaction method', function() {
  it('Should validate correctly while a path param in spec does not matches with collection' +
  ' (issue#478)', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(issueFolder + '/issueSpec.yaml', 'utf-8'),
      issueCollection = fs.readFileSync(issueFolder + '/issueCollection.json', 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: issueSpec }, { allowUrlPathVarMatching: false });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransaction(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(1);
      done();
    });
  });

  it('Should validate correctly when a path param in spec does not matches with collection ' +
    'and there are path variables in servers object (issue#478)', function(done) {
    let issueFolder = path.join(__dirname, VALIDATION_DATA_FOLDER_PATH + '/issues/issue#478'),
      issueSpec = fs.readFileSync(issueFolder + '/local-servers-path-variables-spec.yaml', 'utf-8'),
      issueCollection = fs.readFileSync(issueFolder + '/local-servers-path-variables-collection.json', 'utf-8'),
      resultObj,
      historyRequest = [],
      schemaPack = new Converter.SchemaPack({ type: 'string', data: issueSpec }, { allowUrlPathVarMatching: false });

    getAllTransactions(JSON.parse(issueCollection), historyRequest);

    schemaPack.validateTransaction(historyRequest, (err, result) => {
      // Schema is sample petsore with one of parameter as empty, expect no mismatch / error
      expect(err).to.be.null;
      expect(result).to.be.an('object');
      resultObj = result.requests[historyRequest[0].id].endpoints[0];
      expect(resultObj.mismatches).to.have.length(1);
      expect(resultObj.mismatches[0].reason).to.equal(
        'Some provided path variables in transaction (petId) does not' +
        ' match with path variables expected in schema (peterId)'
      );
      expect(resultObj.mismatches[0].reasonCode).to.equal('INVALID_VALUE');
      done();
    });
  });
});
