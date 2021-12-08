const { SchemaPack } = require('../../..');

const expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  OPENAPI_31_FOLDER = '../../data/valid_openapi31X',
  OPENAPI_30_FOLDER = '../../data/valid_openapi';

describe('Testing openapi 3.1 schema pack convert', function() {
  // it('Should convert from openapi 3.1 spec to postman collection', function() {
  //   const fileSource = path.join(__dirname, OPENAPI_30_FOLDER + '/petstore-detailed.yaml'),
  //     fileData = fs.readFileSync(fileSource, 'utf8'),
  //     input = {
  //       type: 'string',
  //       data: fileData
  //     },
  //     converter = new SchemaPack(input);

  //   converter.convert((err, result) => {
  //     expect(err).to.be.null;
  //   });
  // });

  it('Should convert from openapi 3.1 spec to postman collection -- petstore modifyed', function() {
    const fileSource = path.join(__dirname, OPENAPI_31_FOLDER + '/petstore.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      },
      converter = new SchemaPack(input);

    converter.convert((err, result) => {
      expect(err).to.be.null;
    });
  });

  // it('Should convert from openapi 3.0 spec to postman collection', function() {
  //   const fileSource = path.join(__dirname, OPENAPI_30_FOLDER + '/petstore.json'),
  //     fileData = fs.readFileSync(fileSource, 'utf8'),
  //     input = {
  //       type: 'json',
  //       data: fileData
  //     },
  //     converter = new SchemaPack(input);

  //   converter.convert((err, result) => {
  //     expect(err).to.be.null;
  //   });
  // });
});
