const expect = require('chai').expect,
  Index = require('../../dist/index.js'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  valid31xFolder = '../data/valid_openapi31X/yaml',
  validWebhookFolder = '../data/valid_openapi31X/webhooks',
  validJsonFolder = '../data/valid_openapi31X/json';

describe('E2E flows to validate the convertion of OpenAPI 3.1 files', function () {
  let folderPath = path.join(__dirname, valid31xFolder),
    validFolder = fs.readdirSync(folderPath);
  async.each(validFolder, function (file) {
    it('Should generate a valid collection from a YAML file ' + file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, valid31xFolder + '/' + file), 'utf8');
      Index.convert({ type: 'string', data: fileData }, { includeWebhooks: true }, (error, result) => {
        expect(error).to.be.null;
        expect(result.result).to.equal(true);
      });
    });
  });

  folderPath = path.join(__dirname, validWebhookFolder);
  validFolder = fs.readdirSync(folderPath);
  async.each(validFolder, function (file) {
    it('Should generate a valid collection from Webhook OAS file ' + file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, validWebhookFolder + '/' + file), 'utf8');
      Index.convert({ type: 'string', data: fileData }, { includeWebhooks: true }, (error, result) => {
        expect(error).to.be.null;
        expect(result.result).to.equal(true);
      });
    });
  });

  folderPath = path.join(__dirname, validJsonFolder);
  validFolder = fs.readdirSync(folderPath);
  async.each(validFolder, function (file) {
    it('Should generate a valid collection from a JSON file ' + file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, validJsonFolder + '/' + file), 'utf8');
      Index.convert({ type: 'string', data: fileData }, { includeWebhooks: true }, (error, result) => {
        expect(error).to.be.null;
        expect(result.result).to.equal(true);
      });
    });
  });
});

describe('E2E flows to validate specification validation error codes', function () {
  it('Should return SPEC_VERSION_MISMATCH when bundling a root with a different version', async function () {
    const result = await Index.bundle({
      type: 'multiFile',
      specificationVersion: '3.0',
      rootFiles: [{ path: '/root.yaml' }],
      data: [{ path: '/root.yaml', content: 'openapi: 3.1.0\ninfo:\n  title: a\n  version: "1"\npaths: {}\n' }],
      bundleFormat: 'JSON'
    });

    expect(result.result).to.equal(false);
    expect(result.output.data).to.eql([]);
    expect(result.code).to.equal('SPEC_VERSION_MISMATCH');
    expect(result.meta).to.eql({ expected: '3.0', foundKey: 'openapi', found: '3.1.0' });
  });

  it('Should return SPEC_INFO_MISSING when converting a spec without info', function (done) {
    Index.convertV2WithTypes({ type: 'string', data: 'openapi: 3.0.3\npaths: {}\n' }, {}, (error) => {
      expect(error.name).to.equal('UserError');
      expect(error.message).to.equal('Specification must contain an Info Object for the meta-data of the API');
      expect(error.code).to.equal('SPEC_INFO_MISSING');
      done();
    });
  });
});
