const { expect } = require('chai'),
  concreteUtils = require('../../../lib/swaggerUtils/schemaUtilsSwagger'),
  fs = require('fs'),
  validSwaggerFolder = './test/data/valid_swagger',
  invalidSwaggerFolder = './test/data/invalid_swagger';

describe('parseSpec method', function () {
  it('should return true and a parsed specification', function () {
    let fileContent = fs.readFileSync(validSwaggerFolder + '/json/sampleswagger.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, {});

    expect(parsedSpec.result).to.be.true;
    expect(parsedSpec.openapi.swagger).to.equal('2.0');
  });

  it('should return false and info must have a title message', function () {
    let fileContent = fs.readFileSync(invalidSwaggerFolder + '/invalid_no_info_title.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, {});

    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Title, and version fields are required for the Info Object');
    expect(parsedSpec.code).to.equal('SPEC_INFO_TITLE_MISSING');
  });

  it('should return false with info version missing code when only the version is missing', function () {
    const parsedSpec = concreteUtils.parseSpec({ swagger: '2.0', info: { title: 'Petstore' }, paths: {} }, {});

    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Title, and version fields are required for the Info Object');
    expect(parsedSpec.code).to.equal('SPEC_INFO_VERSION_MISSING');
  });

  it('should return false with swagger version invalid code when swagger is a number', function () {
    const parsedSpec = concreteUtils.parseSpec('swagger: 2.0\ninfo:\n  title: a\n  version: "1"\npaths: {}\n', {});

    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('The value of "swagger" field must be 2.0');
    expect(parsedSpec.code).to.equal('SPEC_SWAGGER_VERSION_INVALID');
  });

  it('should return false and swagger must have info object message', function () {
    let fileContent = fs.readFileSync(invalidSwaggerFolder + '/invalid_no_info.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, {});

    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('The Swagger specification must have an \"info\" field');
    expect(parsedSpec.code).to.equal('SPEC_INFO_MISSING');
  });

  it('should return false and invalid version message', function () {
    let fileContent = fs.readFileSync(invalidSwaggerFolder + '/invalid_wrong_swagger_version.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, {});

    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('The value of "swagger" field must be 2.0');
    expect(parsedSpec.code).to.equal('SPEC_SWAGGER_VERSION_INVALID');
  });

  it('should return false and no paths message', function () {
    let fileContent = fs.readFileSync(invalidSwaggerFolder + '/invalid_no_paths.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, {});

    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('The Swagger specification must have a "paths" field');
    expect(parsedSpec.code).to.equal('SPEC_PATHS_MISSING');
  });
});
