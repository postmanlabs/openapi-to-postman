const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  SWAGGER_20_FOLDER_YAML = '../data/valid_swagger/yaml/',
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

  it('Should convert a swagger document with YAML anchors', function(done) {
    const fileData = fs.readFileSync(path.join(__dirname, SWAGGER_20_FOLDER_YAML, 'yaml_anchor.yaml'), 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      schemapack = new SchemaPack(input);
    schemapack.convert((error, result) => {
      expect(error).to.be.null;
      expect(result.result).to.equal(true);
      expect(result.output.length).to.equal(1);
      expect(result.output[0].type).to.have.equal('collection');
      expect(result.output[0].data).to.have.property('info');
      expect(result.output[0].data).to.have.property('item');
    });
    done();
  });

  it('must read values consumes', function (done) {
    const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger_aws_2.json'),
      input = {
        type: 'file',
        data: fileData
      },
      schemapack = new SchemaPack(input, { requestName: 'url' });

    schemapack.convert((err, convertResult) => {
      expect(err).to.be.null;
      // Make sure that consumes and produces are processed
      convertResult.output.forEach(function(element) {
        expect(element.type).to.equal('collection');
        expect(JSON.stringify(element.data.item[0].request.header[0])).to
          .equal('{"key":"Content-Type","value":"application/json"}');
      });
      done();
    });
  });

  it('should convert a swagger object which only have a root path.', function(done) {
    const fileData = JSON.parse(
        fs.readFileSync(path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger3.json'), 'utf8')
      ),
      input = {
        type: 'json',
        data: fileData
      },
      schemapack = new SchemaPack(input, {});

    schemapack.convert((err, result) => {
      expect(result.result).to.equal(true);
      expect(result.output.length).to.equal(1);
      expect(result.output[0].type).to.have.equal('collection');
      expect(result.output[0].data).to.have.property('info');
      expect(result.output[0].data).to.have.property('item');

      done();
    });
  });

  it('should name the requests based on requestNameSource parameter, value=`URL`', function (done) {
    const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger3.json'),
      input = {
        type: 'file',
        data: fileData
      },
      schemapack = new SchemaPack(input, { requestNameSource: 'URL' });

    schemapack.convert((err, convertResult) => {
      let request = convertResult.output[0].data.item[0].request;

      expect(err).to.be.null;
      expect(request.name).to.equal('{{baseUrl}}/');
      done();
    });
  });

  it('should name the requests based on requestNameSource parameter, value=`Fallback`', function (done) {
    const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger3.json'),
      input = {
        type: 'file',
        data: fileData
      },
      schemapack = new SchemaPack(input, { requestNameSource: 'Fallback' });

    schemapack.convert((err, convertResult) => {
      let request = convertResult.output[0].data.item[0].request;

      expect(err).to.be.null;
      expect(request.name).to.equal('List API versions');
      done();
    });
  });
});
