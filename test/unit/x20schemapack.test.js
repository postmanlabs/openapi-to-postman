const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  SWAGGER_20_FOLDER_JSON = '../data/valid_swagger/json/';

describe('SchemaPack instance creation', function() {
  it('Should create an instance of SchemaPack when input is a string', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + '/sampleswagger.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input);

    expect(schemapack);
  });

  it('Should create an instance of SchemaPack when input is a file', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + '/sampleswagger.json'),
      input = {
        type: 'file',
        data: fileSource
      },
      schemapack = new SchemaPack(input);

    expect(schemapack);
  });
});

describe('getMetaData method', function() {
  it('Should return the provided input metadata', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'sampleswagger.json'),
      input = {
        type: 'file',
        data: fileSource
      },
      schemapack = new SchemaPack(input);

    schemapack.getMetaData((error, result) => {
      expect(error).to.be.null;
      expect(result.result).to.be.true;
      expect(result.name).to.be.equal('Swagger Petstore');
    });
  });
});

describe('Convert method', function() {
  it('Should convert an example file from: ', function(done) {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'sampleswagger.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input);

    schemapack.convert((error, result) => {
      expect(error).to.be.null;
      expect(result.result).to.be.true;
    });
    done();
  });

  it('Should convert and exclude deprecated operations - has only one op and is deprecated', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_one_op_dep.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input, { includeDeprecated: false });

    schemapack.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item).to.be.empty;
    });
  });

  it('Should convert and exclude deprecated operations -- has some deprecated', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_some_op_dep.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input, { includeDeprecated: false });

    schemapack.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item[0].item.length).to.equal(2);
      expect(result.output[0].data.item[0].item[0].name).to.equal('Create a pet');
      expect(result.output[0].data.item[0].item[1].name).to.equal('Info for a specific pet');
    });
  });

  it('Should convert and exclude deprecated operations - has only one op and is deprecated' +
    'using tags as folder strategy operation has not tag', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_one_op_dep.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input, { includeDeprecated: false, folderStrategy: 'tags' });

    schemapack.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item).to.be.empty;
    });
  });

  it('Should convert and exclude deprecated operations - has some deprecated' +
  'using tags as folder strategy', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_some_op_dep_use_tags.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input, { includeDeprecated: false, folderStrategy: 'tags' });

    schemapack.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(result.output[0].data.item.length).to.equal(1);
      expect(result.output[0].data.item[0].name).to.equal('pets');
      expect(result.output[0].data.item[0].item.length).to.equal(2);
    });
  });
});

describe('Swagger 2.0  schemapack mergeAndValidate method', function() {
  it('Should merge correctly the files in folder - petstore separated', function(done) {
    let folderPath = path.join(__dirname, '../data/swaggerMultifile/petstore-separate-yaml'),
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

  it('Should merge correctly the files in folder - basicExample', function(done) {
    let folderPath = path.join(__dirname, '../data/swaggerMultifile/basicExample'),
      files = [],
      array = [
        { fileName: folderPath + '/index.yaml' },
        { fileName: folderPath + '/info.yaml' },
        { fileName: folderPath + '/paths.yaml' }
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
          expect(result.output[0].data.info.name).to.equal('Sample API');
          expect(result.output[0].data).to.have.property('item');
          expect(result.output[0].data.item[0].request.name).to.equal('Returns a list of users.');
          done();
        });
      }
      else {
        expect.fail(null, null, status.reason);
        done();
      }
    });
  });

  it('Should merge correctly the files in folder - uberTest', function(done) {
    let folderPath = path.join(__dirname, '../data/swaggerMultifile/uberTest'),
      files = [],
      array = [
        { fileName: folderPath + '/index.yaml' },
        { fileName: folderPath + '/definitions/Activities.yaml' },
        { fileName: folderPath + '/definitions/Activity.yaml' },
        { fileName: folderPath + '/definitions/Error.yaml' },
        { fileName: folderPath + '/definitions/Product.yaml' },
        { fileName: folderPath + '/definitions/ProductList.yaml' },
        { fileName: folderPath + '/definitions/Profile.yaml' },
        { fileName: folderPath + '/definitions/PriceEstimate.yaml' }
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
          expect(result.output[0].data.item[0].response[0].body).to.include('product_id');
          expect(result.output[0].data.item[0].response[0].body).to.include('description');
          expect(result.output[0].data.item[1].item[0].response[0].body).to.include('product_id');
          expect(result.output[0].data.item[1].item[0].response[0].body).to.include('currency_code');
          expect(result.output[0].data.item[2].response[0].body).to.include('first_name');
          expect(result.output[0].data.item[2].response[0].body).to.include('last_name');
          expect(result.output[0].data.item[3].response[0].body).to.include('offset');
          expect(result.output[0].data.item[3].response[0].body).to.include('limit');
          expect(result.output[0].data.item[0].response[1].body).to.include('code');
          expect(result.output[0].data.item[0].response[1].body).to.include('message');
          done();
        });
      }
      else {
        expect.fail(null, null, status.reason);
        done();
      }
    });
  });

  it('Should not merge because therer are 2 root files - multifile-two-root-files', function() {
    let folderPath = path.join(__dirname, '../data/swaggerMultifile/multifile-two-root-files'),
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
      }
      expect(status.result).to.equal(false);
      expect(status.reason).to.be.equal('More than one root file not supported.');
    });
  });
});

describe('Validate Transactions method', function () {
  /**
 * @description Takes in a collection and a buffered allRequests array
 *
 * @param {object} collection a postman collection object
 * @param {Array} allRequests array as buffer
 * @returns {undefined} nothing
 */
  function getAllTransactions(collection, allRequests) {
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

  it('Should convert and validate and include deprecated operation default option', function () {
    const openAPI = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true
      },
      schemaPack = new SchemaPack({ type: 'string', data: openAPIData }, options);
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
    const openAPI = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: true
      },
      schemaPack = new SchemaPack({ type: 'string', data: openAPIData }, options);
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
    const openAPI = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: false
      },
      schemaPack = new SchemaPack({ type: 'string', data: openAPIData }, options);
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
    const openAPI = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: true
      },
      schemaPack = new SchemaPack({ type: 'string', data: openAPIData }, options);
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
    const openAPI = path.join(__dirname, SWAGGER_20_FOLDER_JSON + 'has_some_op_dep.json'),
      openAPIData = fs.readFileSync(openAPI, 'utf8'),
      options = {
        showMissingInSchemaErrors: true,
        strictRequestMatching: true,
        ignoreUnresolvedVariables: true,
        includeDeprecated: true
      },
      schemaPack = new SchemaPack({ type: 'string', data: openAPIData }, options);
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
        schemaPack2 = new SchemaPack({ type: 'string', data: openAPIData }, optionsOtherSchemaPack);

      getAllTransactions(conversionResult.output[0].data, historyRequest);

      schemaPack2.validateTransaction(historyRequest, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.an('object');

        expect(err).to.be.null;
        let requestIds = Object.keys(result.requests);
        expect(requestIds.length).to.eq(3);
      });
    });
  });
});
