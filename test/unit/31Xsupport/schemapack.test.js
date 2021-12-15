const { SchemaPack } = require('../../..');

const expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  OPENAPI_31_FOLDER = '../../data/valid_openapi31X',
  OPENAPI_30_FOLDER = '../../data/valid_openapi',
  _ = require('lodash');

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
    });
  });

  it('Should convert from openapi 3.1 spec to postman collection -- petstore', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/petstore.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
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
    });
  });
});
