/* eslint-disable one-var */
const expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  Ajv = require('ajv'),
  testSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/test.json'),
  testSpec1 = path.join(__dirname, VALID_OPENAPI_PATH + '/test1.json'),
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


describe('convertV2WithTypes should generate collection confirming to collection schema', function() {

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

  it('should validate the schema' + testSpec1, function() {
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

          const schema = JSON.parse(value.body),
            transformedSchema = transformSchema(schema),
            validate = ajv.compile(transformedSchema),
            valid = validate(example);

          expect(value).to.have.property('body').that.is.a('string');
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
      // Get the schema from the response
      const [key, value] = Object.entries(response)[0];
      expect(value).to.have.property('body').that.is.a('string');

      const schema = JSON.parse(value.body),
        transformedSchema = transformSchema(schema),
        validate = ajv.compile(transformedSchema),
        valid = validate(example);
      expect(valid, `Validation failed for key: ${key} with errors: ${JSON.stringify(validate.errors)}`).to.be.true;
      done();
    }
    );
  });
});
