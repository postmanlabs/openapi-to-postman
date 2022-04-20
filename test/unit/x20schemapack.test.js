const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
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
