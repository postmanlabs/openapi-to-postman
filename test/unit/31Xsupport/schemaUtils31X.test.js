const { expect } = require('chai'),
  {
    parseSpec
  } = require('../../../lib/31Xsupport/schemaUtils31X'),
  fs = require('fs'),
  valid31xFolder = './test/data/valid_openapi31X',
  invalid31xFolder = './test/data/invalid_openapi31X';

describe('parseSpec method', function () {
  it('should return true and a parsed specification', function () {
    let fileContent = fs.readFileSync(valid31xFolder + '/webhooks.json', 'utf8');
    const parsedSpec = parseSpec(fileContent);
    expect(parsedSpec.result).to.be.true;
    expect(parsedSpec.openapi.openapi).to.equal('3.1.0');
    expect(parsedSpec.openapi.webhooks).to.not.be.undefined;
  });

  it('should return false and invalid format message when input content is sent', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/empty-spec.yaml', 'utf8');
    const parsedSpec = parseSpec(fileContent);
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Invalid format. Input must be in YAML or JSON format.');
  });

  it('should return false and Spec must contain info object', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-no-info.json', 'utf8');
    const parsedSpec = parseSpec(fileContent);
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

});
