const SchemaPack = require('../..').SchemaPack,
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  OPENAPI_32_FOLDER = '../data/valid_openapi32X';

describe('Testing openapi 3.2 schema pack convert', function () {
  it('Should detect a 3.2 document and report the 3.2.x specification version', function () {
    const fileSource = path.join(__dirname, OPENAPI_32_FOLDER + '/json/petstore.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      converter = new SchemaPack({ type: 'string', data: fileData });

    expect(converter.validated).to.be.true;
    expect(converter.validationResult.specificationVersion).to.equal('3.2.x');
  });

  it('Should convert a 3.2 petstore (JSON) to a Postman collection', function (done) {
    const fileSource = path.join(__dirname, OPENAPI_32_FOLDER + '/json/petstore.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      converter = new SchemaPack({ type: 'string', data: fileData });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      const collection = result.output[0].data;
      expect(collection.info.name).to.equal('Swagger Petstore');
      done();
    });
  });

  it('Should convert a 3.2 petstore (YAML) to a Postman collection', function (done) {
    const fileSource = path.join(__dirname, OPENAPI_32_FOLDER + '/yaml/petstore.yaml'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      converter = new SchemaPack({ type: 'string', data: fileData });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      done();
    });
  });

  it('Should treat application/octet-stream with no schema as a binary body in 3.2', function (done) {
    const fileSource = path.join(__dirname, OPENAPI_32_FOLDER + '/json/petstore.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      converter = new SchemaPack({ type: 'string', data: fileData });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      const uploads = result.output[0].data.item.find((item) => {
        return item.name === 'uploads an image';
      });
      expect(uploads.request.body).to.deep.equal({ mode: 'file' });
      done();
    });
  });

  it('Should accept a 3.2 spec that only declares webhooks (no paths) when includeWebhooks is true', function (done) {
    const fileSource = path.join(__dirname, OPENAPI_32_FOLDER + '/json/webhooks.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      converter = new SchemaPack({ type: 'string', data: fileData }, { includeWebhooks: true });

    expect(converter.validated).to.be.true;
    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      const topLevelNames = result.output[0].data.item.map((item) => { return item.name; });
      expect(topLevelNames).to.include('Webhooks');
      done();
    });
  });

  it('Should tolerate 3.2-only constructs (info.summary, tags.parent/kind, components.pathItems)', function (done) {
    const fileSource = path.join(__dirname, OPENAPI_32_FOLDER + '/json/oas32-features.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      converter = new SchemaPack({ type: 'string', data: fileData });

    converter.convert((err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      const collection = result.output[0].data;
      expect(collection.info.name).to.equal('OAS 3.2 feature sampler');
      const itemNames = collection.item.map((item) => { return item.name; });
      expect(itemNames).to.include('List invoices');
      done();
    });
  });

  it('Should fall back to default error reason when a 3.2 spec is missing required info fields', function () {
    const malformed = {
        openapi: '3.2.0',
        info: { title: 'No version' },
        paths: {
          '/users': {
            get: { responses: { '200': { description: 'ok' } } }
          }
        }
      },
      converter = new SchemaPack({ type: 'json', data: malformed });

    expect(converter.validated).to.be.false;
    expect(converter.validationResult.reason)
      .to.equal('Specification must contain a semantic version number of the API in the Info Object');
  });
});
