const expect = require('chai').expect,
  Index = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  valid31xFolder = '../data/valid_openapi31X/yaml',
  folderPath = path.join(__dirname, valid31xFolder);

describe('E2E flows to validate the convertion of OpenAPI 3.1 files', function () {
  let validYamlFolder = fs.readdirSync(folderPath);
  async.each(validYamlFolder, function (file) {
    it('Should generate a valid collection from ' + file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, valid31xFolder + '/' + file), 'utf8');
      Index.convert({ type: 'string', data: fileData }, {}, (error, result) => {
        expect(error).to.be.null;
        expect(result.result).to.equal(true);
      });
    });
  });
});
