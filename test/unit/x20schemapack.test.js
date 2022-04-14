const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  SWAGGER_20_FOLDER = '../data/valid_swagger';

describe('SchemaPack instance creation', function() {
  it('Should create an instance of SchemaPack when input is a string', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER + '/sampleswagger.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input);
    expect(schemapack);
  });

  it('Should create an instance of SchemaPack when input is a file', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER + '/sampleswagger.json'),
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
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER + '/sampleswagger.json'),
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
