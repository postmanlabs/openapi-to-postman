const { convertSwaggerToOpenapi } = require('../../lib/swaggerUtils/swaggerToOpenapi'),
  fs = require('fs'),
  path = require('path'),
  SWAGGER_20_FOLDER_JSON = '../data/valid_swagger/json/',
  SWAGGER_20_INVALID_FOLDER_JSON = '../data/invalid_swagger/',
  utils = require('../../lib/swaggerUtils/schemaUtilsSwagger'),
  expect = require('chai').expect;

describe('Test swaggerToOpenapi method', async function() {
  it('Should convert a swagger file to an openapi', async function() {
    const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_JSON + '/sampleswagger.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      parsedSpec = utils.parseSpec(fileData);
    let result = await convertSwaggerToOpenapi(parsedSpec.openapi);
    expect(result.openapi.openapi).to.be.equal('3.0.0');
  });

  it('Should throw an error when swagger file is not complete', async function() {
    const fileSource = path.join(__dirname, SWAGGER_20_INVALID_FOLDER_JSON + '/invalid_no_info.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      parsedSpec = utils.parseSpec(fileData);
    try {
      await convertSwaggerToOpenapi(parsedSpec.openapi);
      expect.fail();
    }
    catch (error) {
      expect(error.message).to.be.equal('Unsupported swagger/OpenAPI version: undefined');
    }
  });
});
