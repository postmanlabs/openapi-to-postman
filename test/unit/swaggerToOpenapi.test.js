const { convertToOAS30IfSwagger } = require('../../lib/swaggerUtils/swaggerToOpenapi'),
  fs = require('fs'),
  path = require('path'),
  SWAGGER_20_FOLDER_JSON = '../data/valid_swagger/json/',
  SWAGGER_20_INVALID_FOLDER_JSON = '../data/invalid_swagger/',
  utils = require('../../lib/swaggerUtils/schemaUtilsSwagger'),
  expect = require('chai').expect;

describe('Test swaggerToOpenapi method', function() {
  it('Should convert a swagger file to an openapi', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + '/sampleswagger.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      parsedSpec = utils.parseSpec(fileData);

    convertToOAS30IfSwagger(utils, parsedSpec.openapi, (error, openapi) => {
      expect(error).to.be.null;
      expect(openapi.openapi).to.be.equal('3.0.0');
    });
  });

  it('Should throw an error when swagger file is not complete', function() {
    const fileSource = path.join(__dirname, SWAGGER_20_INVALID_FOLDER_JSON + '/invalid_no_info.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      parsedSpec = utils.parseSpec(fileData);

    convertToOAS30IfSwagger(utils, parsedSpec.openapi, (error, openapi) => {
      expect(error.message).to.be.equal('Unsupported swagger/OpenAPI version: undefined');
      expect(openapi).to.be.undefined;
    });
  });
});
