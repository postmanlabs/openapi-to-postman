const expect = require('chai').expect,
  Index = require('../../dist/src/index.js'),
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
