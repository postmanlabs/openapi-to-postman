/* eslint-disable max-len */
// Disabling max Length for better visibility of the expectedExtractedTypes

/* eslint-disable one-var */
/* Disabling as we want the checks to run in order of their declaration as declaring everything as once
  even though initial declarations fails with test won't do any good */


const expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  Ajv = require('ajv'),
  testSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/test.json'),
  testSpec1 = path.join(__dirname, VALID_OPENAPI_PATH + '/test1.json'),
  testSpec1TypeOutput = path.join(__dirname, '../data/unitTestOutput/test1TypeOutput.json'),
  readOnlyNestedSpec =
  path.join(__dirname, VALID_OPENAPI_PATH, '/readOnlyNested.json'),
  ajv = new Ajv({ allErrors: true, strict: false }),
  transformSchema = (schema) => {
    const properties = schema.properties,
      rest = Object.keys(schema)
        .filter((key) => { return key !== 'properties'; })
        .reduce((acc, key) => {
          acc[key] = schema[key];
          return acc;
        }, {}),

      transformedProperties = Object.entries(properties).reduce(
        (acc, [key, value]) => {
          acc[key] = {
            type: value.type,
            deprecated: value.deprecated || false,
            enum: value.enum !== null ? value.enum : undefined,
            minLength: value.minLength !== null ? value.minLength : undefined,
            maxLength: value.maxLength !== null ? value.maxLength : undefined,
            minimum: value.minimum !== null ? value.minimum : undefined,
            maximum: value.maximum !== null ? value.maximum : undefined,
            pattern: value.pattern !== null ? value.pattern : undefined,
            format: value.format !== null ? value.format : undefined
          };
          return acc;
        },
        {}
      ),


      transformedObject = Object.assign({}, rest, { properties: transformedProperties });

    return transformedObject;
  };


describe('convertV2WithTypes should generate collection conforming to collection schema', function() {

  it('Should generate collection conforming to schema for and fail if not valid ' +
        testSpec, function(done) {
    var openapi = fs.readFileSync(testSpec, 'utf8');
    Converter.convertV2WithTypes({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      done();
    });
  });

  it('should validate parameters of the collection', function (done) {
    const openapi = fs.readFileSync(testSpec1, 'utf8'),
      options = { schemaFaker: true, exampleParametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.output).to.be.an('array').that.is.not.empty;

      const firstFolder = conversionResult.output[0].data.item[0];
      expect(firstFolder).to.have.property('name', 'pets');

      const listAllPets = firstFolder.item[0];
      expect(listAllPets).to.have.property('name', 'List all pets');
      expect(listAllPets.request.method).to.equal('GET');

      const createPet = firstFolder.item[1];
      expect(createPet).to.have.property('name', '/pets');
      expect(createPet.request.method).to.equal('POST');
      expect(createPet.request.body.mode).to.equal('raw');
      expect(createPet.request.body.raw).to.include('request body comes here');

      const queryParams = listAllPets.request.url.query;
      expect(queryParams).to.be.an('array').that.has.length(3);
      expect(queryParams[0]).to.have.property('key', 'limit');
      expect(queryParams[0]).to.have.property('value', '<string>');

      const headers = listAllPets.request.header;
      expect(headers).to.be.an('array').that.is.not.empty;
      expect(headers[0]).to.have.property('key', 'variable');
      expect(headers[0]).to.have.property('value', '<string>,<string>');

      const response = listAllPets.response[0];
      expect(response).to.have.property('status', 'OK');
      expect(response).to.have.property('code', 200);
      expect(response.body).to.include('"id": "<long>"');

      done();
    }
    );
  });

  it('Should generate collection conforming to schema for and fail if not valid ' +
    testSpec1, function(done) {
    Converter.convertV2WithTypes(
      { type: 'file', data: testSpec1 }, { requestNameSource: 'url' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');

        done();
      });
  });
});


describe('convertV2WithTypes', function() {
  it('should contain extracted types' + testSpec1, function () {
    Converter.convertV2WithTypes(
      { type: 'file', data: testSpec1 }, { requestNameSource: 'url' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.extractedTypes).to.not.be.undefined;
        expect(Object.keys(conversionResult.extractedTypes).length).to.not.equal(0);
      }
    );
  });

  it('should validate the generated type object' + testSpec1, function() {
    const example = {
      code: 200,
      message: 'Success'
    };
    Converter.convertV2WithTypes(
      { type: 'file', data: testSpec1 }, { requestNameSource: 'url' }, (err, conversionResult) => {

        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;
        for (const [path, element] of Object.entries(conversionResult.extractedTypes)) {
          expect(element).to.be.an('object').that.includes.keys('request');
          expect(element).to.be.an('object').that.includes.keys('response');
          expect(path).to.be.a('string');

          const { response } = element;
          expect(response).to.be.an('object').that.is.not.empty;
          const [key, value] = Object.entries(response)[1];
          expect(key).to.be.a('string');

          const schema = value.body,
            transformedSchema = transformSchema(schema),
            validate = ajv.compile(transformedSchema),
            valid = validate(example);

          expect(value).to.have.property('body').that.is.a('object');
          expect(valid, `Validation failed for key: ${key} with errors: ${JSON.stringify(validate.errors)}`).to.be.true;
        }
      });
  });

  it('should resolve nested array and object schema types correctly in extractedTypes', function(done) {
    const example = {
        name: 'Buddy',
        pet: {
          id: 123,
          name: 'Charlie',
          address: {
            addressCode: {
              code: 'A123'
            },
            city: 'New York'
          }
        }
      },
      openapi = fs.readFileSync(readOnlyNestedSpec, 'utf8'),
      options = { schemaFaker: true, exampleParametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

      const element = Object.values(conversionResult.extractedTypes)[0];
      const { response } = element;
      const [key, value] = Object.entries(response)[0];
      expect(value).to.have.property('body').that.is.a('object');

      const schema = value.body,
        transformedSchema = transformSchema(schema),
        validate = ajv.compile(transformedSchema),
        valid = validate(example);
      expect(valid, `Validation failed for key: ${key} with errors: ${JSON.stringify(validate.errors)}`).to.be.true;
      done();
    }
    );
  });

  it('should resolve extractedTypes into correct schema structure', function(done) {
    const
      openapi = fs.readFileSync(testSpec1, 'utf8'),
      expectedExtractedTypes = fs.readFileSync(testSpec1TypeOutput, 'utf8'),
      options = { schemaFaker: true, exampleParametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;
      const extractedTypes = conversionResult.extractedTypes;
      expect(JSON.parse(JSON.stringify(extractedTypes, null, 2))).to.deep.equal(JSON.parse(expectedExtractedTypes));

      done();
    }
    );
  });

});
