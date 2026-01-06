/* eslint-disable max-len */
// Disabling max Length for better visibility of the expectedExtractedTypes

/* Disabling as we want the checks to run in order of their declaration as declaring everything as once
  even though initial declarations fails with test won't do any good */


const expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  VALID_OPENAPI31X_PATH = '../data/valid_openapi31X',
  Ajv = require('ajv'),
  testSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/test.json'),
  testSpec1 = path.join(__dirname, VALID_OPENAPI_PATH + '/test1.json'),
  testSpec2 = path.join(__dirname, VALID_OPENAPI_PATH + '/test-title-description.json'),
  readOnlyNestedSpec =
  path.join(__dirname, VALID_OPENAPI_PATH, '/readOnlyNested.json'),
  referencedPathItemsSpec =
  path.join(__dirname, VALID_OPENAPI31X_PATH, '/yaml/referencedPathItems.yaml'),
  nestedPathItemsSpec =
  path.join(__dirname, VALID_OPENAPI31X_PATH, '/yaml/nestedPathItemRefs.yaml'),
  pathItemsWithTagsSpec =
  path.join(__dirname, VALID_OPENAPI31X_PATH, '/yaml/referencedPathItemsWithTags.yaml'),
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
            deprecated: value.deprecated,
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
      options = { schemaFaker: true, parametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.output).to.be.an('array').that.is.not.empty;

      const firstFolder = conversionResult.output[0].data.item[0];
      const secondFolder = conversionResult.output[0].data.item[1];
      expect(firstFolder).to.have.property('name', 'pets');

      const listAllPets = firstFolder.item[0];
      expect(listAllPets).to.have.property('name', 'List all pets');
      expect(listAllPets.request.method).to.equal('GET');

      const createPet = firstFolder.item[1];
      const getPetById = secondFolder.item[0];
      const idDescription = getPetById.item[0].request.url.variable[0].description.content;
      expect(createPet).to.have.property('name', '/pets');
      expect(createPet.request.method).to.equal('POST');
      expect(idDescription).to.equal('The id of the pet to retrieve');
      expect(createPet.request.body.mode).to.equal('raw');
      expect(createPet.request.body.raw).to.equal('');

      const queryParams = listAllPets.request.url.query;
      expect(queryParams).to.be.an('array').that.has.length(3);
      expect(queryParams[0]).to.have.property('key', 'limit');
      expect(queryParams[0]).to.have.property('value', 'medium');
      const limitDescription = queryParams[0].description.content;
      expect(limitDescription).to.equal('component level query param');

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

  it('should pick example value for request body parametersResolution=Example', function (done) {
    const openapi = fs.readFileSync(testSpec1, 'utf8'),
      options = { schemaFaker: true, parametersResolution: 'Example' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.output).to.be.an('array').that.is.not.empty;

      const firstFolder = conversionResult.output[0].data.item[0];
      expect(firstFolder).to.have.property('name', 'pets');

      const listAllPets = firstFolder.item[0];
      expect(listAllPets).to.have.property('name', 'List all pets');
      expect(listAllPets.request.method).to.equal('GET');

      const createPet = firstFolder.item[1];
      expect(createPet.request.body.mode).to.equal('raw');
      expect(createPet.request.body.raw).to.equal('request body comes here');

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

describe('convertV2WithTypes - example originalRequest path variables', function() {
  it('should include populated path variable values in example originalRequest', function(done) {
    const openapi = fs.readFileSync(testSpec1, 'utf8'),
      options = { parametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      const item = conversionResult.output[0].data.item[1].item[0].item[0];

      const requestPathVariables = item.request && item.request.url && item.request.url.variable || [];
      expect(requestPathVariables).to.be.an('array').that.is.not.empty;
      const requestPetIdVariable = requestPathVariables.find((v) => { return v && v.key === 'petId'; });
      expect(requestPetIdVariable).to.be.an('object');
      expect(requestPetIdVariable.value).to.equal('<string>');

      const resp = item.response && item.response[0],
        exampleRequestPathVariables = resp.originalRequest && resp.originalRequest.url && resp.originalRequest.url.variable || [];
      expect(exampleRequestPathVariables).to.be.an('array').that.is.not.empty;
      const examplePetIdVariable = exampleRequestPathVariables.find((v) => { return v && v.key === 'petId'; });
      expect(examplePetIdVariable).to.be.an('object');
      expect(examplePetIdVariable.value).to.equal('<string>');
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

          const schema = JSON.parse(value.body),
            transformedSchema = transformSchema(schema),
            validate = ajv.compile(transformedSchema),
            valid = validate(example);

          expect(value).to.have.property('body').that.is.a('string');
          expect(valid, `Validation failed for key: ${key} with errors: ${JSON.stringify(validate.errors)}`).to.be.true;
        }
      });
  });

  it('should handle non existent type in parameter schema', function(done) {
    const oas = {
      openapi: '3.0.0',
      info: { title: 'Form Explode Deprecated Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            parameters: [
              {
                name: 'qp',
                in: 'query',
                schema: { deprecated: true }
              }
            ],
            responses: { '200': { description: 'ok' } }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: oas }, {
      parametersResolution: 'Example'
    }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      const items = conversionResult.output[0].data.item;
      const request = items[0].item[0].request;
      const query = request.url.query;

      expect(query.length).to.be.equal(1);
      expect(query[0].key).to.equal('qp');
      expect(query[0].value).to.equal('');
      done();
    });
  });

  it('should handle schemas with unavailable types properly with parametersResolution=Example', function(done) {
    const oas = {
      openapi: '3.0.0',
      info: { title: 'DeepObject Deprecated Test', version: '1.0.0' },
      paths: {
        '/pets': {
          post: {
            parameters: [
              {
                name: 'qp',
                in: 'query',
                style: 'deepObject',
                explode: true,
                schema: {
                  type: 'object',
                  deprecated: true,
                  properties: {
                    name: {
                      description: 'Name of the pet'
                    }
                  }
                }
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    deprecated: false,
                    description: 'Help',
                    // Type is not defined here
                    properties: {
                      name: { type: 'string' },
                      style: {
                        type: 'array',
                        items: {
                          anyOf: [
                            { type: 'string' },
                            { type: 'number' }
                          ]
                        }
                      },
                      age: {
                        // type not defined here
                        description: 'age'

                      }
                    }
                  }
                }
              }
            },
            responses: { '200': { description: 'ok' } }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: oas }, {
      parametersResolution: 'Example'
    }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      const items = conversionResult.output[0].data.item;
      const request = items[0].item[0].request;
      const query = request.url.query || [];

      expect(query.length).to.be.equal(1);
      expect(query[0].key).to.equal('qp[name]');
      expect(query[0].value).to.equal('');

      expect(request.body.raw).to.be.equal('{\n  "name": "string",\n  "style": [\n    "string",\n    "string"\n  ],\n  "age": ""\n}');

      done();
    });
  });

  it('should handle schemas with unavailable types properly with parametersResolution=Schema', function(done) {
    const oas = {
      openapi: '3.0.0',
      info: { title: 'DeepObject Deprecated Test', version: '1.0.0' },
      paths: {
        '/pets': {
          post: {
            parameters: [
              {
                name: 'qp',
                in: 'query',
                style: 'deepObject',
                explode: true,
                schema: {
                  type: 'object',
                  deprecated: true,
                  properties: {
                    name: {
                      description: 'Name of the pet'
                    }
                  }
                }
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    deprecated: false,
                    description: 'Help',
                    properties: {
                      name: { type: 'string' },
                      style: {
                        type: 'array',
                        items: {
                          anyOf: [
                            { type: 'string' },
                            { type: 'number' }
                          ]
                        }
                      },
                      age: { description: 'age' }
                    }
                  }
                }
              }
            },
            responses: { '200': { description: 'ok' } }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: oas }, {
      parametersResolution: 'Schema'
    }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      const items = conversionResult.output[0].data.item;
      const request = items[0].item[0].request;
      const query = request.url.query || [];

      expect(query.length).to.be.equal(1);
      expect(query[0].key).to.equal('qp[name]');
      expect(query[0].value).to.equal('');

      expect(request.body.raw).to.be.equal('{\n  "name": "<string>",\n  "style": [\n    "<string>",\n    "<string>"\n  ],\n  "age": ""\n}');

      done();
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
      options = { schemaFaker: true, parametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

      const element = Object.values(conversionResult.extractedTypes)[0];
      const { response } = element;
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

  it('should resolve extractedTypes into correct schema structure', function(done) {
    const expectedExtractedTypes = {
        'get/pets': {
          'request': {
            'headers': '[\n  {\n    "keyName": "variable",\n    "properties": {\n      "type": "array"\n    }\n  }\n]',
            'pathParam': '[]',
            'queryParam': '[\n  {\n    "keyName": "limit",\n    "properties": {\n      "type": "string",\n      "required": false,\n      "deprecated": false,\n      "enum": [\n        "medium"\n      ]\n    }\n  },\n  {\n    "keyName": "variable2",\n    "properties": {\n      "type": "array"\n    }\n  },\n  {\n    "keyName": "variable3",\n    "properties": {\n      "type": "array"\n    }\n  }\n]'
          },
          'response': {
            '200': {
              'body': '{\n  "type": "array",\n  "items": {\n    "type": "object",\n    "properties": {\n      "id": {\n        "type": "integer",\n        "format": "int64"\n      },\n      "name": {\n        "type": "string"\n      },\n      "tag": {\n        "type": "string"\n      }\n    },\n    "required": [\n      "id",\n      "name"\n    ]\n  }\n}',
              'headers': '[\n  {\n    "keyName": "x-next",\n    "properties": {\n      "type": "string",\n      "default": "<string>"\n    }\n  }\n]'
            },
            'default': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer",\n      "format": "int32"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
              'headers': '[]'
            }
          }
        },
        'post/pets': {
          'request': {
            'headers': '[]',
            'pathParam': '[]',
            'queryParam': '[\n  {\n    "keyName": "limit",\n    "properties": {\n      "type": "string",\n      "required": false,\n      "deprecated": false,\n      "enum": [\n        "medium"\n      ]\n    }\n  },\n  {\n    "keyName": "variable3",\n    "properties": {\n      "type": "array"\n    }\n  }\n]'
          },
          'response': {
            '201': {
              'headers': '[]'
            },
            'default': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer",\n      "format": "int32"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
              'headers': '[]'
            }
          }
        },
        'get/pet/{petId}': {
          'request': {
            'headers': '[]',
            'pathParam': '[\n  {\n    "keyName": "petId",\n    "properties": {\n      "type": "string",\n      "default": "<string>",\n      "required": true\n    }\n  }\n]',
            'queryParam': '[]'
          },
          'response': {
            '200': {
              'body': '{\n  "type": "array",\n  "items": {\n    "type": "object",\n    "properties": {\n      "id": {\n        "type": "integer",\n        "format": "int64"\n      },\n      "name": {\n        "type": "string"\n      },\n      "tag": {\n        "type": "string"\n      }\n    },\n    "required": [\n      "id",\n      "name"\n    ]\n  }\n}',
              'headers': '[]'
            },
            'default': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer",\n      "format": "int32"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
              'headers': '[]'
            }
          }
        },
        'post/pet/{petId}': {
          'request': {
            'headers': '[]',
            'pathParam': '[\n  {\n    "keyName": "petId",\n    "properties": {\n      "type": "string",\n      "default": "<string>",\n      "required": true\n    }\n  }\n]',
            'queryParam': '[]'
          },
          'response': {
            '200': {
              'body': '{\n  "type": "array",\n  "items": {\n    "type": "object",\n    "properties": {\n      "id": {\n        "type": "integer",\n        "format": "int64"\n      },\n      "name": {\n        "type": "string"\n      },\n      "tag": {\n        "type": "string"\n      }\n    },\n    "required": [\n      "id",\n      "name"\n    ]\n  }\n}',
              'headers': '[]'
            },
            'default': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer",\n      "format": "int32"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
              'headers': '[]'
            }
          }
        }
      },
      openapi = fs.readFileSync(testSpec1, 'utf8'),
      options = { schemaFaker: true, parametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

      const extractedTypes = conversionResult.extractedTypes;
      expect(JSON.parse(JSON.stringify(extractedTypes))).to.deep.equal(
        JSON.parse(JSON.stringify(expectedExtractedTypes)));
      done();
    }
    );
  });

  describe('composite schema support (anyOf, oneOf, allOf)', function() {
    it('should extract anyOf schemas in request body', function(done) {
      const openApiWithAnyOf = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      example: { name: 'default example' },
                      anyOf: [
                        {
                          type: 'object',
                          example: { name: 'John Doe' },
                          properties: {
                            name: { type: 'string', example: 'Jane' }
                          }
                        },
                        {
                          type: 'object',
                          example: { id: 123 },
                          properties: {
                            id: { type: 'integer', example: 456 }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: openApiWithAnyOf }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        const requestBody = conversionResult.extractedTypes['post/test'].request.body;
        const parsedRequestBody = JSON.parse(requestBody);

        expect(parsedRequestBody).to.have.property('anyOf');
        expect(parsedRequestBody.anyOf).to.be.an('array').with.length(2);
        expect(parsedRequestBody.anyOf[0]).to.have.property('type', 'object');
        expect(parsedRequestBody.anyOf[0].properties).to.have.property('name');
        expect(parsedRequestBody.anyOf[1]).to.have.property('type', 'object');
        expect(parsedRequestBody.anyOf[1].properties).to.have.property('id');

        expect(parsedRequestBody).to.have.property('example');
        expect(parsedRequestBody.example).to.deep.equal({ name: 'default example' });
        expect(parsedRequestBody.anyOf[0]).to.have.property('example');
        expect(parsedRequestBody.anyOf[0].example).to.deep.equal({ name: 'John Doe' });
        expect(parsedRequestBody.anyOf[0].properties.name).to.have.property('example', 'Jane');
        expect(parsedRequestBody.anyOf[1]).to.have.property('example');
        expect(parsedRequestBody.anyOf[1].example).to.deep.equal({ id: 123 });
        expect(parsedRequestBody.anyOf[1].properties.id).to.have.property('example', 456);

        done();
      });
    });

    it('should extract oneOf schemas in response body', function(done) {
      const openApiWithOneOf = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        example: 'default response',
                        oneOf: [
                          { type: 'string', example: 'success' },
                          { type: 'integer', example: 200 },
                          {
                            type: 'object',
                            example: { message: 'OK' },
                            properties: {
                              message: { type: 'string', example: 'All good' }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: openApiWithOneOf }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        const responseBody = conversionResult.extractedTypes['get/test'].response['200'].body;
        const parsedResponseBody = JSON.parse(responseBody);

        expect(parsedResponseBody).to.have.property('oneOf');
        expect(parsedResponseBody.oneOf).to.be.an('array').with.length(3);
        expect(parsedResponseBody.oneOf[0]).to.have.property('type', 'string');
        expect(parsedResponseBody.oneOf[1]).to.have.property('type', 'integer');
        expect(parsedResponseBody.oneOf[2]).to.have.property('type', 'object');
        expect(parsedResponseBody.oneOf[2].properties).to.have.property('message');

        expect(parsedResponseBody).to.have.property('example', 'default response');
        expect(parsedResponseBody.oneOf[0]).to.have.property('example', 'success');
        expect(parsedResponseBody.oneOf[1]).to.have.property('example', 200);
        expect(parsedResponseBody.oneOf[2]).to.have.property('example');
        expect(parsedResponseBody.oneOf[2].example).to.deep.equal({ message: 'OK' });
        expect(parsedResponseBody.oneOf[2].properties.message).to.have.property('example', 'All good');

        done();
      });
    });

    it('should extract allOf schemas in request and response bodies', function(done) {
      const openApiWithAllOf = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      example: { baseField: 'base', extensionField: 100 },
                      allOf: [
                        {
                          type: 'object',
                          example: { baseField: 'example base' },
                          properties: {
                            baseField: { type: 'string', example: 'field example' }
                          }
                        },
                        {
                          type: 'object',
                          example: { extensionField: 200 },
                          properties: {
                            extensionField: { type: 'integer', example: 300 }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              responses: {
                '201': {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: {
                        example: { id: 'res123', timestamp: '2024-01-01' },
                        allOf: [
                          {
                            type: 'object',
                            example: { id: '456' },
                            properties: {
                              id: { type: 'string', example: '789' }
                            }
                          },
                          {
                            type: 'object',
                            example: { timestamp: '2024-12-22T00:00:00Z' },
                            properties: {
                              timestamp: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00Z' }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: openApiWithAllOf }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        // Check request body
        const requestBody = conversionResult.extractedTypes['post/test'].request.body;
        const parsedRequestBody = JSON.parse(requestBody);

        expect(parsedRequestBody).to.have.property('allOf');
        expect(parsedRequestBody.allOf).to.be.an('array').with.length(2);
        expect(parsedRequestBody.allOf[0].properties).to.have.property('baseField');
        expect(parsedRequestBody.allOf[1].properties).to.have.property('extensionField');

        expect(parsedRequestBody).to.have.property('example');
        expect(parsedRequestBody.example).to.deep.equal({ baseField: 'base', extensionField: 100 });
        expect(parsedRequestBody.allOf[0]).to.have.property('example');
        expect(parsedRequestBody.allOf[0].example).to.deep.equal({ baseField: 'example base' });
        expect(parsedRequestBody.allOf[0].properties.baseField).to.have.property('example', 'field example');
        expect(parsedRequestBody.allOf[1]).to.have.property('example');
        expect(parsedRequestBody.allOf[1].example).to.deep.equal({ extensionField: 200 });
        expect(parsedRequestBody.allOf[1].properties.extensionField).to.have.property('example', 300);

        // Check response body
        const responseBody = conversionResult.extractedTypes['post/test'].response['201'].body;
        const parsedResponseBody = JSON.parse(responseBody);

        expect(parsedResponseBody).to.have.property('allOf');
        expect(parsedResponseBody.allOf).to.be.an('array').with.length(2);
        expect(parsedResponseBody.allOf[0].properties).to.have.property('id');
        expect(parsedResponseBody.allOf[1].properties).to.have.property('timestamp');

        expect(parsedResponseBody).to.have.property('example');
        expect(parsedResponseBody.example).to.deep.equal({ id: 'res123', timestamp: '2024-01-01' });
        expect(parsedResponseBody.allOf[0]).to.have.property('example');
        expect(parsedResponseBody.allOf[0].example).to.deep.equal({ id: '456' });
        expect(parsedResponseBody.allOf[0].properties.id).to.have.property('example', '789');
        expect(parsedResponseBody.allOf[1]).to.have.property('example');
        expect(parsedResponseBody.allOf[1].example).to.deep.equal({ timestamp: '2024-12-22T00:00:00Z' });
        expect(parsedResponseBody.allOf[1].properties.timestamp).to.have.property('example', '2025-01-01T00:00:00Z');

        done();
      });
    });

    it('should extract nested composite schemas', function(done) {
      const openApiWithNestedComposite = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          anyOf: [
                            {
                              type: 'object',
                              properties: {
                                textData: { type: 'string' }
                              }
                            },
                            {
                              type: 'object',
                              properties: {
                                numericData: { type: 'integer' }
                              }
                            }
                          ]
                        },
                        metadata: {
                          oneOf: [
                            { type: 'string' },
                            {
                              type: 'object',
                              properties: {
                                version: { type: 'string' }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: openApiWithNestedComposite }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        const requestBody = conversionResult.extractedTypes['post/test'].request.body;
        const parsedRequestBody = JSON.parse(requestBody);

        expect(parsedRequestBody).to.have.property('type', 'object');
        expect(parsedRequestBody.properties).to.have.property('data');
        expect(parsedRequestBody.properties).to.have.property('metadata');

        // Check nested anyOf
        expect(parsedRequestBody.properties.data).to.have.property('anyOf');
        expect(parsedRequestBody.properties.data.anyOf).to.be.an('array').with.length(2);
        expect(parsedRequestBody.properties.data.anyOf[0].properties).to.have.property('textData');
        expect(parsedRequestBody.properties.data.anyOf[1].properties).to.have.property('numericData');

        // Check nested oneOf
        expect(parsedRequestBody.properties.metadata).to.have.property('oneOf');
        expect(parsedRequestBody.properties.metadata.oneOf).to.be.an('array').with.length(2);
        expect(parsedRequestBody.properties.metadata.oneOf[0]).to.have.property('type', 'string');
        expect(parsedRequestBody.properties.metadata.oneOf[1]).to.have.property('type', 'object');

        done();
      });
    });

    it('should extract composite schemas with $ref (structure preserved)', function(done) {
      const openApiWithRefComposite = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' }
              }
            },
            Admin: {
              type: 'object',
              properties: {
                role: { type: 'string' },
                permissions: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        paths: {
          '/test': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        { $ref: '#/components/schemas/User' },
                        { $ref: '#/components/schemas/Admin' },
                        {
                          type: 'object',
                          properties: {
                            guest: { type: 'boolean' }
                          }
                        }
                      ]
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        allOf: [
                          { $ref: '#/components/schemas/User' },
                          {
                            type: 'object',
                            properties: {
                              timestamp: { type: 'string', format: 'date-time' }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: openApiWithRefComposite }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        // Check request body has anyOf structure
        const requestBody = conversionResult.extractedTypes['post/test'].request.body;
        const parsedRequestBody = JSON.parse(requestBody);

        expect(parsedRequestBody).to.have.property('anyOf');
        expect(parsedRequestBody.anyOf).to.be.an('array').with.length(3);
        expect(parsedRequestBody.anyOf[0]).to.deep.equal({
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        });
        expect(parsedRequestBody.anyOf[1]).to.deep.equal({
          type: 'object',
          properties: {
            role: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } }
          }
        });
        expect(parsedRequestBody.anyOf[2]).to.deep.equal({
          type: 'object',
          properties: {
            guest: { type: 'boolean' }
          }
        });

        // Check response body has allOf structure
        const responseBody = conversionResult.extractedTypes['post/test'].response['200'].body;
        const parsedResponseBody = JSON.parse(responseBody);

        expect(parsedResponseBody).to.have.property('allOf');
        expect(parsedResponseBody.allOf).to.be.an('array').with.length(2);
        expect(parsedResponseBody.allOf[1]).to.have.property('type', 'object');
        expect(parsedResponseBody.allOf[1].properties).to.have.property('timestamp');

        done();
      });
    });

    it('should extract composite schemas in array items', function(done) {
      const openApiWithArrayComposite = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          oneOf: [
                            {
                              type: 'object',
                              properties: {
                                type: { type: 'string', enum: ['user'] },
                                userData: {
                                  type: 'object',
                                  properties: {
                                    name: { type: 'string' }
                                  }
                                }
                              }
                            },
                            {
                              type: 'object',
                              properties: {
                                type: { type: 'string', enum: ['admin'] },
                                adminData: {
                                  type: 'object',
                                  properties: {
                                    role: { type: 'string' }
                                  }
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: openApiWithArrayComposite }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        const responseBody = conversionResult.extractedTypes['get/test'].response['200'].body;
        const parsedResponseBody = JSON.parse(responseBody);

        expect(parsedResponseBody).to.have.property('type', 'array');
        expect(parsedResponseBody).to.have.property('items');
        expect(parsedResponseBody.items).to.have.property('oneOf');
        expect(parsedResponseBody.items.oneOf).to.be.an('array').with.length(2);

        // Check first oneOf option
        expect(parsedResponseBody.items.oneOf[0]).to.have.property('type', 'object');
        expect(parsedResponseBody.items.oneOf[0].properties).to.have.property('type');
        expect(parsedResponseBody.items.oneOf[0].properties).to.have.property('userData');

        // Check second oneOf option
        expect(parsedResponseBody.items.oneOf[1]).to.have.property('type', 'object');
        expect(parsedResponseBody.items.oneOf[1].properties).to.have.property('type');
        expect(parsedResponseBody.items.oneOf[1].properties).to.have.property('adminData');

        done();
      });
    });

    it('should extract only first option from composite query parameters, path parameters, request headers, and response headers', function(done) {
      const openApiWithCompositeParams = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/test/{pathParam}': {
            get: {
              parameters: [
                // Query parameters with composite schemas
                {
                  name: 'status',
                  in: 'query',
                  schema: {
                    oneOf: [
                      { type: 'string', enum: ['active', 'inactive'] },
                      { type: 'integer', minimum: 1, maximum: 10 }
                    ]
                  }
                },
                {
                  name: 'category',
                  in: 'query',
                  schema: {
                    anyOf: [
                      { type: 'string' },
                      { type: 'number' }
                    ]
                  }
                },
                {
                  name: 'priority',
                  in: 'query',
                  schema: {
                    allOf: [
                      { type: 'string' },
                      { minLength: 3 }
                    ]
                  }
                },
                // Path parameter with composite schema
                {
                  name: 'pathParam',
                  in: 'path',
                  required: true,
                  schema: {
                    oneOf: [
                      { type: 'string', pattern: '^[a-z]+$' },
                      { type: 'integer', minimum: 100 }
                    ]
                  }
                },
                // Header parameters with composite schemas
                {
                  name: 'X-Custom-Header',
                  in: 'header',
                  schema: {
                    anyOf: [
                      { type: 'string', format: 'uuid' },
                      { type: 'string', enum: ['default', 'custom'] }
                    ]
                  }
                },
                {
                  name: 'X-Version',
                  in: 'header',
                  schema: {
                    allOf: [
                      { type: 'string' },
                      { pattern: '^v\\d+\\.\\d+$' }
                    ]
                  }
                }
              ],
              responses: {
                '200': {
                  description: 'Success',
                  headers: {
                    'X-Rate-Limit': {
                      description: 'Rate limit header with composite schema',
                      schema: {
                        oneOf: [
                          { type: 'integer', minimum: 1, maximum: 1000 },
                          { type: 'string', enum: ['unlimited', 'blocked'] }
                        ]
                      }
                    },
                    'X-Response-Type': {
                      description: 'Response type header with composite schema',
                      schema: {
                        anyOf: [
                          { type: 'string', format: 'uri' },
                          { type: 'string', pattern: '^[A-Z_]+$' }
                        ]
                      }
                    },
                    'X-Content-Version': {
                      description: 'Content version header with composite schema',
                      schema: {
                        allOf: [
                          { type: 'string' },
                          { pattern: '^v\\d+\\.\\d+\\.\\d+$' },
                          { minLength: 5 }
                        ]
                      }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        anyOf: [
                          { type: 'string' },
                          { type: 'object', properties: { message: { type: 'string' } } }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: openApiWithCompositeParams }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        const extractedTypes = conversionResult.extractedTypes['get/test/{pathParam}'];

        // Verify query parameters extract only first option
        const queryParams = JSON.parse(extractedTypes.request.queryParam);
        expect(queryParams).to.be.an('array').with.length(3);

        // Check oneOf query parameter - should extract first option (string with enum)
        expect(queryParams[0]).to.have.property('keyName', 'status');
        expect(queryParams[0].properties).to.have.property('type', 'string');
        expect(queryParams[0].properties).to.have.property('enum');
        expect(queryParams[0].properties.enum).to.deep.equal(['active', 'inactive']);
        expect(queryParams[0].properties).to.not.have.property('oneOf');

        // Check anyOf query parameter - should extract first option (string)
        expect(queryParams[1]).to.have.property('keyName', 'category');
        expect(queryParams[1].properties).to.have.property('type', 'string');
        expect(queryParams[1].properties).to.not.have.property('anyOf');

        // Check allOf query parameter - should merge constraints (string with minLength)
        expect(queryParams[2]).to.have.property('keyName', 'priority');
        expect(queryParams[2].properties).to.have.property('type', 'string');
        expect(queryParams[2].properties).to.have.property('minLength', 3);
        expect(queryParams[2].properties).to.not.have.property('allOf');

        // Verify path parameters extract only first option
        const pathParams = JSON.parse(extractedTypes.request.pathParam);
        expect(pathParams).to.be.an('array').with.length(1);

        // Check oneOf path parameter - should extract first option (string with pattern)
        expect(pathParams[0]).to.have.property('keyName', 'pathParam');
        expect(pathParams[0].properties).to.have.property('type', 'string');
        expect(pathParams[0].properties).to.have.property('pattern', '^[a-z]+$');
        expect(pathParams[0].properties).to.not.have.property('oneOf');

        // Verify headers extract only first option
        const headers = JSON.parse(extractedTypes.request.headers);
        expect(headers).to.be.an('array').with.length(2);

        // Check anyOf header - should extract first option (string with format)
        expect(headers[0]).to.have.property('keyName', 'X-Custom-Header');
        expect(headers[0].properties).to.have.property('type', 'string');
        expect(headers[0].properties).to.have.property('format', 'uuid');
        expect(headers[0].properties).to.not.have.property('anyOf');

        // Check allOf header - should merge constraints (string with pattern)
        expect(headers[1]).to.have.property('keyName', 'X-Version');
        expect(headers[1].properties).to.have.property('type', 'string');
        expect(headers[1].properties).to.have.property('pattern', '^v\\d+\\.\\d+$');
        expect(headers[1].properties).to.not.have.property('allOf');

        // Verify response body preserves full composite schema
        const responseBody = conversionResult.extractedTypes['get/test/{pathParam}'].response['200'].body;
        const parsedResponseBody = JSON.parse(responseBody);

        expect(parsedResponseBody).to.have.property('anyOf');
        expect(parsedResponseBody.anyOf).to.be.an('array').with.length(2);
        expect(parsedResponseBody.anyOf[0]).to.have.property('type', 'string');
        expect(parsedResponseBody.anyOf[1]).to.have.property('type', 'object');

        // Verify response headers extract only first option
        const responseHeaders = JSON.parse(extractedTypes.response['200'].headers);
        expect(responseHeaders).to.be.an('array').with.length(3);

        // Check oneOf response header - should extract first option (integer with constraints)
        expect(responseHeaders[0]).to.have.property('keyName', 'X-Rate-Limit');
        expect(responseHeaders[0].properties).to.have.property('type', 'integer');
        expect(responseHeaders[0].properties).to.have.property('minimum', 1);
        expect(responseHeaders[0].properties).to.have.property('maximum', 1000);
        expect(responseHeaders[0].properties).to.not.have.property('oneOf');

        // Check anyOf response header - should extract first option (string with format)
        expect(responseHeaders[1]).to.have.property('keyName', 'X-Response-Type');
        expect(responseHeaders[1].properties).to.have.property('type', 'string');
        expect(responseHeaders[1].properties).to.have.property('format', 'uri');
        expect(responseHeaders[1].properties).to.not.have.property('anyOf');

        // Check allOf response header - should merge constraints (string with pattern and minLength)
        expect(responseHeaders[2]).to.have.property('keyName', 'X-Content-Version');
        expect(responseHeaders[2].properties).to.have.property('type', 'string');
        expect(responseHeaders[2].properties).to.have.property('pattern', '^v\\d+\\.\\d+\\.\\d+$');
        expect(responseHeaders[2].properties).to.have.property('minLength', 5);
        expect(responseHeaders[2].properties).to.not.have.property('allOf');

        done();
      });
    });
  });

  it('types should contain title and description', function(done) {
    const openapi = fs.readFileSync(testSpec2, 'utf8'),
      options = { schemaFaker: true, parametersResolution: 'schema' };

    Converter.convertV2WithTypes({ type: 'string', data: openapi }, options, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

      const extractedTypes = conversionResult.extractedTypes;
      const element = extractedTypes['get/widgets/{id}'];
      expect(element).to.be.an('object').that.includes.keys('request', 'response');

      // Request body
      const reqBody = JSON.parse(element.request.body);
      expect(reqBody).to.have.property('title', 'GetWidgetRequest');
      expect(reqBody).to.have.property('description', 'Parameters that refine the fetch.');
      expect(reqBody.properties.verbose).to.have.property('title', 'VerboseFlag');
      expect(reqBody.properties.verbose).to.have.property('description', 'Include extra diagnostics.');
      expect(reqBody.properties.fields).to.have.property('title', 'FieldSelector');
      expect(reqBody.properties.fields).to.have.property('description', 'Limit returned fields.');
      expect(reqBody.properties.fields.items).to.have.property('title', 'Label');
      expect(reqBody.properties.fields.items).to.have.property('description', 'A descriptive label.');

      // Request headers
      const reqHeaders = JSON.parse(element.request.headers);
      expect(reqHeaders).to.be.an('array').with.length.greaterThan(0);
      expect(reqHeaders[0]).to.have.property('keyName', 'X-Client');
      expect(reqHeaders[0].properties).to.have.property('title', 'ClientHeader');
      expect(reqHeaders[0].properties).to.have.property('description', 'Client identifier header schema.');
      expect(reqHeaders[0].properties).to.have.property('type', 'string');

      // Path params
      const pathParams = JSON.parse(element.request.pathParam);
      expect(pathParams).to.be.an('array').with.length(1);
      expect(pathParams[0]).to.have.property('keyName', 'id');
      expect(pathParams[0].properties).to.have.property('title', 'WidgetId');
      expect(pathParams[0].properties).to.have.property('description', 'Schema for a widget ID.');

      // Query params
      const queryParams = JSON.parse(element.request.queryParam);
      expect(queryParams).to.be.an('array').with.length(1);
      expect(queryParams[0]).to.have.property('keyName', 'q');
      expect(queryParams[0].properties).to.have.property('title', 'QueryTerm');
      expect(queryParams[0].properties).to.have.property('description', 'Free-form query text.');

      // Response 200 body
      const res200 = element.response['200'];
      const res200Body = JSON.parse(res200.body);
      expect(res200Body).to.have.property('allOf');
      expect(res200Body.allOf[0]).to.have.property('title', 'BaseWidget');
      expect(res200Body.allOf[0]).to.have.property('description', 'Base fields of a widget.');
      expect(res200Body.allOf[0].properties.id).to.have.property('title', 'WidgetId');
      expect(res200Body.allOf[0].properties.id).to.have.property('description', 'Schema for a widget ID.');
      expect(res200Body.allOf[0].properties.name).to.have.property('title', 'WidgetName');
      expect(res200Body.allOf[0].properties.name).to.have.property('description', 'Human-readable widget name.');

      expect(res200Body.allOf[1]).to.have.property('title', 'WidgetExtra');
      expect(res200Body.allOf[1]).to.have.property('description', 'Extended fields for a widget.');
      expect(res200Body.allOf[1].properties.labels).to.have.property('title', 'TagList');
      expect(res200Body.allOf[1].properties.labels).to.have.property('description', 'List of widget tags.');
      expect(res200Body.allOf[1].properties.labels.items).to.have.property('title', 'Tag');
      expect(res200Body.allOf[1].properties.labels.items).to.have.property('description', 'A single tag for a widget.');
      expect(res200Body.allOf[1].properties.attributes).to.have.property('title', 'AttributeMap');
      expect(res200Body.allOf[1].properties.attributes).to.have.property('description', 'Map of attribute keys to values.');
      expect(res200Body.allOf[1].properties.diagnostics).to.have.property('title', 'Diagnostics');
      expect(res200Body.allOf[1].properties.diagnostics).to.have.property('description', 'Extra diagnostic information.');
      expect(res200Body.allOf[1].properties.diagnostics.properties.correlationId)
        .to.have.property('title', 'CorrelationId');
      expect(res200Body.allOf[1].properties.diagnostics.properties.correlationId)
        .to.have.property('description', 'Server-generated correlation id.');
      expect(res200Body.allOf[1].properties.diagnostics.properties.dump)
        .to.have.property('title', 'DebugDump');
      expect(res200Body.allOf[1].properties.diagnostics.properties.dump)
        .to.have.property('description', 'Optional debug info blob.');

      expect(res200Body.allOf[2]).to.have.property('oneOf');
      expect(res200Body.allOf[2].oneOf[0]).to.have.property('title', 'PhysicalWidget');
      expect(res200Body.allOf[2].oneOf[0]).to.have.property('description', 'A physical widget variant.');
      expect(res200Body.allOf[2].oneOf[0].properties.weightGrams)
        .to.have.property('title', 'WeightGrams');
      expect(res200Body.allOf[2].oneOf[0].properties.weightGrams)
        .to.have.property('description', 'Weight in grams.');
      expect(res200Body.allOf[2].oneOf[1]).to.have.property('title', 'VirtualWidget');
      expect(res200Body.allOf[2].oneOf[1]).to.have.property('description', 'A virtual widget variant.');
      expect(res200Body.allOf[2].oneOf[1].properties.licenseKey)
        .to.have.property('title', 'LicenseKey');
      expect(res200Body.allOf[2].oneOf[1].properties.licenseKey)
        .to.have.property('description', 'License key string.');

      // Response 404 body
      const res404Body = JSON.parse(element.response['404'].body);
      expect(res404Body.allOf[0]).to.have.property('title', 'Error');
      expect(res404Body.allOf[0]).to.have.property('description', 'Standard error envelope.');
      expect(res404Body.allOf[0].properties.code).to.have.property('title', 'ErrorCode');
      expect(res404Body.allOf[0].properties.code).to.have.property('description', 'Numeric error code.');
      expect(res404Body.allOf[0].properties.message).to.have.property('title', 'ErrorMessage');
      expect(res404Body.allOf[0].properties.message).to.have.property('description', 'Human-readable error message.');
      expect(res404Body.allOf[0].properties.details).to.have.property('title', 'ErrorDetails');
      expect(res404Body.allOf[0].properties.details).to.have.property('description', 'Optional error details.');

      // Response empty status code body
      const res500Body = JSON.parse(element.response.default.body);
      expect(res500Body).to.have.property('title', 'Error');
      expect(res500Body).to.have.property('description', 'Standard error envelope.');
      expect(res500Body.properties.code).to.have.property('title', 'ErrorCode');
      expect(res500Body.properties.code).to.have.property('description', 'Numeric error code.');
      expect(res500Body.properties.message).to.have.property('title', 'ErrorMessage');
      expect(res500Body.properties.message).to.have.property('description', 'Human-readable error message.');
      expect(res500Body.properties.details).to.have.property('title', 'ErrorDetails');
      expect(res500Body.properties.details).to.have.property('description', 'Optional error details.');
      // verify arrays preserve title and description
      const inventoryElement = extractedTypes['get/inventory'];
      expect(inventoryElement).to.be.an('object').that.includes.keys('response');
      const inventoryResBody = JSON.parse(inventoryElement.response['200'].body);
      expect(inventoryResBody).to.have.property('type', 'array');
      expect(inventoryResBody).to.have.property('title', 'ArrayOfInventoryItem');
      expect(inventoryResBody).to.have.property('description', 'A list of inventory items.');
      expect(inventoryResBody.items).to.have.property('title', 'InventoryItem');
      expect(inventoryResBody.items).to.have.property('description', 'An inventory item.');
      done();
    });
  });

  it('should fallback parameter description from path-level to operation-level duplicates', function(done) {
    const openApiWithParamFallback = {
      openapi: '3.0.0',
      info: { title: 'Param Fallback API', version: '1.0.0' },
      paths: {
        '/pets/{id}': {
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'Path id description', schema: { type: 'string' } },
            { name: 'q', in: 'query', description: 'Path-level query description', schema: { type: 'string' } }
          ],
          get: {
            // Duplicate params at operation-level without description; should inherit from path-level
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
              { name: 'q', in: 'query', schema: { type: 'string' } }
            ],
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { type: 'string' } } }
              }
            }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: openApiWithParamFallback }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);

      const rootItems = conversionResult.output[0].data.item;
      const findFirstRequest = (nodes) => {
        if (!Array.isArray(nodes)) { return null; }
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node && node.request) { return node; }
          if (node && Array.isArray(node.item)) {
            const found = findFirstRequest(node.item);
            if (found) { return found; }
          }
        }
        return null;
      };
      const item = findFirstRequest(rootItems);
      expect(item, 'No request item found in generated collection').to.not.be.null;

      // Path variable description should come from path-level param
      const pathVars = item.request.url.variable;
      expect(pathVars).to.be.an('array').with.length(1);
      expect(pathVars[0]).to.have.property('key', 'id');
      expect(pathVars[0]).to.have.nested.property('description.content', 'Path id description');

      // Query param description should come from path-level param
      const queryParams = item.request.url.query;
      const qParam = queryParams.find((p) => { return p.key === 'q'; });
      expect(qParam).to.not.be.undefined;
      expect(qParam).to.have.nested.property('description.content', 'Path-level query description');

      done();
    });
  });

  it('should pick up the first type for handling union types in parameters and response headers', function(done) {
    const openApiWithUnionTypes = {
      openapi: '3.1.0',
      info: {
        title: 'Union Types Test API',
        version: '1.0.0'
      },
      paths: {
        '/users/{id}': {
          get: {
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                  type: ['string', 'integer'], // Union type - should pick 'string' (first)
                  description: 'User ID as string or integer'
                }
              },
              {
                name: 'format',
                in: 'query',
                schema: {
                  type: ['integer', 'string'], // Union type - should pick 'integer' (first)
                  description: 'Format preference'
                }
              },
              {
                name: 'auth',
                in: 'header',
                schema: {
                  type: ['string', 'null'], // Union type - should pick 'string' (first)
                  description: 'Authorization header'
                }
              },
              {
                name: 'singleTypeParam',
                in: 'query',
                schema: {
                  type: 'string', // Single type - should remain 'string'
                  description: 'Simple string parameter'
                }
              },
              {
                name: 'emptyUnionParam',
                in: 'query',
                schema: {
                  type: [], // Empty union type - should not have type property
                  description: 'Empty union type parameter'
                }
              }
            ],
            responses: {
              '200': {
                description: 'Success response with union type headers',
                headers: {
                  'x-rate-limit': {
                    description: 'Rate limit counter',
                    schema: {
                      type: ['integer', 'string'] // Union type - should pick 'integer' (first)
                    }
                  },
                  'x-request-id': {
                    description: 'Request identifier',
                    schema: {
                      type: ['string', 'number'] // Union type - should pick 'string' (first)
                    }
                  },
                  'x-single-type-header': {
                    description: 'Simple header',
                    schema: {
                      type: 'boolean' // Single type - should remain 'boolean'
                    }
                  }
                },
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: openApiWithUnionTypes }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

      const extractedTypes = conversionResult.extractedTypes;
      const requestTypes = extractedTypes['get/users/{id}'];
      expect(requestTypes).to.be.an('object');

      // Check path parameters
      const pathParams = JSON.parse(requestTypes.request.pathParam);
      expect(pathParams).to.be.an('array').with.length(1);

      const idParam = pathParams.find((p) => { return p.keyName === 'id'; });
      expect(idParam).to.be.an('object');
      expect(idParam.properties.type).to.equal('string'); // First type from ['string', 'integer']

      // Check query parameters
      const queryParams = JSON.parse(requestTypes.request.queryParam);
      expect(queryParams).to.be.an('array').with.length(3);

      const formatParam = queryParams.find((p) => { return p.keyName === 'format'; });
      expect(formatParam).to.be.an('object');
      expect(formatParam.properties.type).to.equal('integer'); // First type from ['integer', 'string']

      const singleTypeParam = queryParams.find((p) => { return p.keyName === 'singleTypeParam'; });
      expect(singleTypeParam).to.be.an('object');
      expect(singleTypeParam.properties.type).to.equal('string'); // Single type should remain unchanged

      const emptyUnionParam = queryParams.find((p) => { return p.keyName === 'emptyUnionParam'; });
      expect(emptyUnionParam).to.be.an('object');
      expect(emptyUnionParam.properties).to.not.have.property('type'); // Empty union should not have type property

      // Check request header parameters
      const headerParams = JSON.parse(requestTypes.request.headers);
      expect(headerParams).to.be.an('array').with.length(1);

      const authParam = headerParams.find((p) => { return p.keyName === 'auth'; });
      expect(authParam).to.be.an('object');
      expect(authParam.properties.type).to.equal('string'); // First type from ['string', 'null']

      // Check response headers - use the first available response status for tests
      const responseStatuses = Object.keys(requestTypes.response);
      expect(responseStatuses).to.be.an('array').that.is.not.empty;

      const firstResponseStatus = responseStatuses[0];
      const responseHeaders = JSON.parse(requestTypes.response[firstResponseStatus].headers);
      expect(responseHeaders).to.be.an('array').with.length(3);

      const rateLimitHeader = responseHeaders.find((h) => { return h.keyName === 'x-rate-limit'; });
      expect(rateLimitHeader).to.be.an('object');
      expect(rateLimitHeader.properties.type).to.equal('integer'); // First type from ['integer', 'string']

      const requestIdHeader = responseHeaders.find((h) => { return h.keyName === 'x-request-id'; });
      expect(requestIdHeader).to.be.an('object');
      expect(requestIdHeader.properties.type).to.equal('string'); // First type from ['string', 'number']

      const singleTypeHeader = responseHeaders.find((h) => { return h.keyName === 'x-single-type-header'; });
      expect(singleTypeHeader).to.be.an('object');
      expect(singleTypeHeader.properties.type).to.equal('boolean'); // Single type should remain unchanged

      done();
    });
  });

  it('should omit properties when object schema has no properties', function(done) {
    const oas = {
      openapi: '3.0.0',
      info: { title: 'Empty Properties Test', version: '1.0.0' },
      paths: {
        '/empty': {
          get: {
            responses: {
              '200': {
                description: 'ok',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          },
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object'
                  }
                }
              }
            },
            responses: {
              '200': { description: 'ok' }
            }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      const body = conversionResult.extractedTypes['get/empty'].response['200'].body;
      const parsed = JSON.parse(body);
      expect(parsed).to.have.property('type', 'object');
      expect(parsed).to.not.have.property('properties');

      const reqBody = conversionResult.extractedTypes['post/empty'].request.body;
      const parsedReq = JSON.parse(reqBody);
      expect(parsedReq).to.have.property('type', 'object');
      expect(parsedReq).to.not.have.property('properties');
      done();
    });
  });

  it('should preserve the original order of required properties from schema', function(done) {
    const oas = {
      openapi: '3.0.0',
      info: { title: 'Required Properties Order Test', version: '1.0.0' },
      paths: {
        '/users': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      age: { type: 'integer' },
                      address: { type: 'string' }
                    },
                    // Intentionally define required properties in a different order than properties
                    required: ['email', 'name', 'id', 'address']
                  }
                }
              }
            },
            responses: {
              '201': {
                description: 'User created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string' },
                        username: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        profile: { type: 'object' }
                      },
                      // Different order for response schema as well
                      required: ['createdAt', 'userId', 'username']
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

      // Check request body required properties order
      const requestBody = conversionResult.extractedTypes['post/users'].request.body;
      const parsedRequestBody = JSON.parse(requestBody);

      expect(parsedRequestBody).to.have.property('required');
      expect(parsedRequestBody.required).to.deep.equal(['email', 'name', 'id', 'address']);

      // Check response body required properties order
      const responseBody = conversionResult.extractedTypes['post/users'].response['201'].body;
      const parsedResponseBody = JSON.parse(responseBody);

      expect(parsedResponseBody).to.have.property('required');
      expect(parsedResponseBody.required).to.deep.equal(['createdAt', 'userId', 'username']);

      done();
    });
  });

  it('should handle schemas without required properties correctly', function(done) {
    const oas = {
      openapi: '3.0.0',
      info: { title: 'No Required Properties Test', version: '1.0.0' },
      paths: {
        '/optional': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      age: { type: 'integer' }
                    }
                    // No required array defined
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        result: { type: 'string' }
                      },
                      required: [] // Empty required array
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

      // Check request body (schema with no required array)
      const requestBody = conversionResult.extractedTypes['post/optional'].request.body;
      const parsedRequestBody = JSON.parse(requestBody);

      // Schema has properties object, so it should be preserved
      expect(parsedRequestBody).to.have.property('properties');
      expect(parsedRequestBody.properties).to.have.property('name');
      expect(parsedRequestBody.properties).to.have.property('age');
      // When no required array is defined in original schema, it should not be present in the output
      expect(parsedRequestBody).to.not.have.property('required');

      // Check response body (schema with empty required array)
      const responseBody = conversionResult.extractedTypes['post/optional'].response['200'].body;
      const parsedResponseBody = JSON.parse(responseBody);

      expect(parsedResponseBody).to.have.property('properties');
      expect(parsedResponseBody.properties).to.have.property('result');
      expect(parsedResponseBody).to.have.property('required');
      expect(parsedResponseBody.required).to.deep.equal([]);

      done();
    });
  });

  describe('4xx and 5xx response code normalization', function() {
    it('should convert 4xx wildcard response code to 400 in collection while preserving type data', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: '4xx Wildcard Response Test', version: '1.0.0' },
        paths: {
          '/api/resource': {
            get: {
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                },
                '4xx': {
                  description: 'Client Error',
                  headers: {
                    'X-Error-Code': {
                      description: 'Error classification',
                      schema: { type: 'string', enum: ['validation', 'authentication', 'authorization'] }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          error: { type: 'string' },
                          code: { type: 'integer', minimum: 400, maximum: 499 },
                          details: {
                            type: 'object',
                            properties: {
                              field: { type: 'string' },
                              message: { type: 'string' }
                            }
                          }
                        },
                        required: ['error', 'code']
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        // Verify collection responses are normalized to 400
        const collection = conversionResult.output[0].data;
        const request = collection.item[0].item[0].item[0];
        const responses = request.response;

        // Should have responses with codes 200 and 400 (normalized from 4xx)
        const responseCodes = responses.map((r) => { return r.code; });
        expect(responseCodes).to.include(200);
        expect(responseCodes).to.include(400);
        expect(responseCodes).to.not.include('4xx');

        // Verify type data preservation in extractedTypes with original 4xx key
        const extractedTypes = conversionResult.extractedTypes['get/api/resource'];
        expect(extractedTypes).to.be.an('object');
        expect(extractedTypes.response).to.have.property('200');
        expect(extractedTypes.response).to.have.property('400');

        // Verify 4xx response type data is preserved
        const response4xx = JSON.parse(extractedTypes.response['400'].body);
        expect(response4xx).to.have.property('type', 'object');
        expect(response4xx.properties).to.have.property('error');
        expect(response4xx.properties).to.have.property('code');
        expect(response4xx.properties).to.have.property('details');
        expect(response4xx.properties.code).to.have.property('minimum', 400);
        expect(response4xx.properties.code).to.have.property('maximum', 499);
        expect(response4xx.required).to.deep.equal(['error', 'code']);

        // Verify 4xx response headers are preserved
        const response4xxHeaders = JSON.parse(extractedTypes.response['400'].headers);
        expect(response4xxHeaders).to.be.an('array').with.length(1);
        expect(response4xxHeaders[0]).to.have.property('keyName', 'X-Error-Code');
        expect(response4xxHeaders[0].properties).to.have.property('type', 'string');
        expect(response4xxHeaders[0].properties).to.have.property('enum');
        expect(response4xxHeaders[0].properties.enum).to.deep.equal(['validation', 'authentication', 'authorization']);

        done();
      });
    });

    it('should convert 5xx wildcard response code to 500 in collection while preserving type data', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: '5xx Wildcard Response Test', version: '1.0.0' },
        paths: {
          '/api/server-test': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: { type: 'string' }
                      }
                    }
                  }
                }
              },
              responses: {
                '201': {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          status: { type: 'string' }
                        }
                      }
                    }
                  }
                },
                '5xx': {
                  description: 'Server Error',
                  headers: {
                    'X-Request-ID': {
                      description: 'Request tracking identifier',
                      schema: { type: 'string', format: 'uuid' }
                    },
                    'Retry-After': {
                      description: 'Seconds to wait before retrying',
                      schema: { type: 'integer', minimum: 1, maximum: 3600 }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          error: { type: 'string' },
                          stackTrace: { type: 'string' },
                          requestId: { type: 'string', format: 'uuid' },
                          serverInfo: {
                            type: 'object',
                            properties: {
                              version: { type: 'string' },
                              environment: { type: 'string', enum: ['dev', 'staging', 'prod'] }
                            }
                          }
                        },
                        required: ['error', 'requestId']
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        // Verify collection responses are normalized to 500
        const collection = conversionResult.output[0].data;
        const request = collection.item[0].item[0].item[0];
        const responses = request.response;

        // Should have responses with codes 201 and 500 (normalized from 5xx)
        const responseCodes = responses.map((r) => { return r.code; });
        expect(responseCodes).to.include(201);
        expect(responseCodes).to.include(500);
        expect(responseCodes).to.not.include('5xx');

        // Verify type data preservation in extractedTypes with original 5xx key
        const extractedTypes = conversionResult.extractedTypes['post/api/server-test'];
        expect(extractedTypes).to.be.an('object');
        expect(extractedTypes.response).to.have.property('201');
        expect(extractedTypes.response).to.have.property('500');

        // Verify 5xx response type data is preserved
        const response5xx = JSON.parse(extractedTypes.response['500'].body);
        expect(response5xx).to.have.property('type', 'object');
        expect(response5xx.properties).to.have.property('error');
        expect(response5xx.properties).to.have.property('stackTrace');
        expect(response5xx.properties).to.have.property('requestId');
        expect(response5xx.properties).to.have.property('serverInfo');
        expect(response5xx.properties.requestId).to.have.property('format', 'uuid');
        expect(response5xx.properties.serverInfo.properties).to.have.property('environment');
        expect(response5xx.properties.serverInfo.properties.environment.enum).to.deep.equal(['dev', 'staging', 'prod']);
        expect(response5xx.required).to.deep.equal(['error', 'requestId']);

        // Verify 5xx response headers are preserved
        const response5xxHeaders = JSON.parse(extractedTypes.response['500'].headers);
        expect(response5xxHeaders).to.be.an('array').with.length(2);
        const requestIdHeader = response5xxHeaders.find((h) => { return h.keyName === 'X-Request-ID'; });
        expect(requestIdHeader).to.be.an('object');
        expect(requestIdHeader.properties).to.have.property('type', 'string');
        expect(requestIdHeader.properties).to.have.property('format', 'uuid');

        const retryAfterHeader = response5xxHeaders.find((h) => { return h.keyName === 'Retry-After'; });
        expect(retryAfterHeader).to.be.an('object');
        expect(retryAfterHeader.properties).to.have.property('type', 'integer');
        expect(retryAfterHeader.properties).to.have.property('minimum', 1);
        expect(retryAfterHeader.properties).to.have.property('maximum', 3600);

        done();
      });
    });

    it('should handle mixed 4xx/5xx wildcard responses with headers and preserve all type data', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Mixed Wildcard Response Test', version: '1.0.0' },
        paths: {
          '/api/mixed-responses': {
            put: {
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' }
                }
              ],
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        value: { type: 'number' }
                      }
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Updated successfully',
                  headers: {
                    'X-Updated-At': {
                      description: 'Update timestamp',
                      schema: { type: 'string', format: 'date-time' }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean' },
                          updatedId: { type: 'string' }
                        }
                      }
                    }
                  }
                },
                '4xx': {
                  description: 'Client Error Response',
                  headers: {
                    'X-Rate-Limit-Remaining': {
                      description: 'Requests remaining',
                      schema: { type: 'integer', minimum: 0 }
                    },
                    'X-Error-Context': {
                      description: 'Error context information',
                      schema: { type: 'string' }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          accessDenied: { type: 'boolean' },
                          reason: { type: 'string', enum: ['insufficient_permissions', 'rate_limit_exceeded', 'validation_failed'] },
                          conflictType: { type: 'string' },
                          suggestions: {
                            type: 'array',
                            items: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                },
                '5xx': {
                  description: 'Server Error Response',
                  headers: {
                    'Retry-After': {
                      description: 'Retry after seconds',
                      schema: { type: 'integer', minimum: 1 }
                    },
                    'X-Correlation-ID': {
                      description: 'Request correlation identifier',
                      schema: { type: 'string', format: 'uuid' }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          featureFlag: { type: 'string' },
                          implementationStatus: { type: 'string', enum: ['planned', 'in_development', 'blocked'] },
                          serverError: {
                            type: 'object',
                            properties: {
                              code: { type: 'integer', minimum: 500, maximum: 599 },
                              message: { type: 'string' },
                              timestamp: { type: 'string', format: 'date-time' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        // Verify collection response normalization
        const collection = conversionResult.output[0].data;
        const request = collection.item[0].item[0].item[0];
        const responses = request.response;
        const responseCodes = responses.map((r) => { return r.code; });

        expect(responseCodes).to.include(200);
        expect(responseCodes).to.include(400); // Normalized from 4xx
        expect(responseCodes).to.include(500); // Normalized from 5xx
        expect(responseCodes).to.not.include('4xx');
        expect(responseCodes).to.not.include('5xx');

        // Verify all original response codes are preserved in extractedTypes
        const extractedTypes = conversionResult.extractedTypes['put/api/mixed-responses'];
        expect(extractedTypes.response).to.have.property('200');
        expect(extractedTypes.response).to.have.property('400');
        expect(extractedTypes.response).to.have.property('500');

        // Verify 4xx response with headers and body
        const response4xxHeaders = JSON.parse(extractedTypes.response['400'].headers);
        expect(response4xxHeaders).to.be.an('array').with.length(2);

        const rateLimitHeader = response4xxHeaders.find((h) => { return h.keyName === 'X-Rate-Limit-Remaining'; });
        expect(rateLimitHeader).to.be.an('object');
        expect(rateLimitHeader.properties).to.have.property('type', 'integer');
        expect(rateLimitHeader.properties).to.have.property('minimum', 0);

        const errorContextHeader = response4xxHeaders.find((h) => { return h.keyName === 'X-Error-Context'; });
        expect(errorContextHeader).to.be.an('object');
        expect(errorContextHeader.properties).to.have.property('type', 'string');

        const response4xxBody = JSON.parse(extractedTypes.response['400'].body);
        expect(response4xxBody.properties).to.have.property('accessDenied');
        expect(response4xxBody.properties).to.have.property('reason');
        expect(response4xxBody.properties).to.have.property('conflictType');
        expect(response4xxBody.properties).to.have.property('suggestions');
        expect(response4xxBody.properties.reason).to.have.property('enum');
        expect(response4xxBody.properties.reason.enum).to.deep.equal(['insufficient_permissions', 'rate_limit_exceeded', 'validation_failed']);
        expect(response4xxBody.properties.suggestions).to.have.property('type', 'array');
        expect(response4xxBody.properties.suggestions.items).to.have.property('type', 'string');

        // Verify 5xx response with headers and body
        const response5xxHeaders = JSON.parse(extractedTypes.response['500'].headers);
        expect(response5xxHeaders).to.be.an('array').with.length(2);

        const retryAfterHeader = response5xxHeaders.find((h) => { return h.keyName === 'Retry-After'; });
        expect(retryAfterHeader).to.be.an('object');
        expect(retryAfterHeader.properties).to.have.property('type', 'integer');
        expect(retryAfterHeader.properties).to.have.property('minimum', 1);

        const correlationHeader = response5xxHeaders.find((h) => { return h.keyName === 'X-Correlation-ID'; });
        expect(correlationHeader).to.be.an('object');
        expect(correlationHeader.properties).to.have.property('type', 'string');
        expect(correlationHeader.properties).to.have.property('format', 'uuid');

        const response5xxBody = JSON.parse(extractedTypes.response['500'].body);
        expect(response5xxBody.properties).to.have.property('featureFlag');
        expect(response5xxBody.properties).to.have.property('implementationStatus');
        expect(response5xxBody.properties).to.have.property('serverError');
        expect(response5xxBody.properties.implementationStatus).to.have.property('enum');
        expect(response5xxBody.properties.implementationStatus.enum).to.deep.equal(['planned', 'in_development', 'blocked']);
        expect(response5xxBody.properties.serverError).to.have.property('type', 'object');
        expect(response5xxBody.properties.serverError.properties).to.have.property('code');
        expect(response5xxBody.properties.serverError.properties.code).to.have.property('minimum', 500);
        expect(response5xxBody.properties.serverError.properties.code).to.have.property('maximum', 599);

        done();
      });
    });

    it('should handle responses with only 4xx/5xx wildcard codes and normalize appropriately', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Error Only Wildcard Response Test', version: '1.0.0' },
        paths: {
          '/api/error-only': {
            delete: {
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' }
                }
              ],
              responses: {
                '4xx': {
                  description: 'Client Error',
                  headers: {
                    'X-Validation-Errors': {
                      description: 'Number of validation errors',
                      schema: { type: 'integer', minimum: 0 }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          validationErrors: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                field: { type: 'string' },
                                code: { type: 'string' },
                                message: { type: 'string' }
                              }
                            }
                          },
                          deletedAt: { type: 'string', format: 'date-time' },
                          reason: { type: 'string', enum: ['not_found', 'gone', 'validation_failed'] }
                        }
                      }
                    }
                  }
                },
                '5xx': {
                  description: 'Server Error',
                  headers: {
                    'X-Error-ID': {
                      description: 'Server error identifier',
                      schema: { type: 'string', format: 'uuid' }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          errorId: { type: 'string', format: 'uuid' },
                          message: { type: 'string' },
                          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                          metadata: {
                            type: 'object',
                            properties: {
                              timestamp: { type: 'string', format: 'date-time' },
                              service: { type: 'string' },
                              version: { type: 'string' }
                            }
                          }
                        },
                        required: ['errorId', 'message']
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        // Verify collection response normalization - should have 400 and 500
        const collection = conversionResult.output[0].data;
        const request = collection.item[0].item[0].item[0];
        const responses = request.response;
        const responseCodes = responses.map((r) => { return r.code; });

        expect(responseCodes).to.include(400); // Normalized from 4xx
        expect(responseCodes).to.include(500); // Normalized from 5xx
        expect(responseCodes).to.not.include('4xx');
        expect(responseCodes).to.not.include('5xx');

        // Verify all original response codes are preserved in extractedTypes
        const extractedTypes = conversionResult.extractedTypes['delete/api/error-only'];
        expect(extractedTypes.response).to.have.property('400');
        expect(extractedTypes.response).to.have.property('500');

        // Verify 4xx response type data
        const response4xxHeaders = JSON.parse(extractedTypes.response['400'].headers);
        expect(response4xxHeaders).to.be.an('array').with.length(1);
        expect(response4xxHeaders[0]).to.have.property('keyName', 'X-Validation-Errors');
        expect(response4xxHeaders[0].properties).to.have.property('type', 'integer');
        expect(response4xxHeaders[0].properties).to.have.property('minimum', 0);

        const response4xxBody = JSON.parse(extractedTypes.response['400'].body);
        expect(response4xxBody.properties).to.have.property('validationErrors');
        expect(response4xxBody.properties).to.have.property('deletedAt');
        expect(response4xxBody.properties).to.have.property('reason');
        expect(response4xxBody.properties.validationErrors).to.have.property('type', 'array');
        expect(response4xxBody.properties.validationErrors.items).to.have.property('type', 'object');
        expect(response4xxBody.properties.validationErrors.items.properties).to.have.property('field');
        expect(response4xxBody.properties.validationErrors.items.properties).to.have.property('code');
        expect(response4xxBody.properties.validationErrors.items.properties).to.have.property('message');
        expect(response4xxBody.properties.deletedAt).to.have.property('format', 'date-time');
        expect(response4xxBody.properties.reason).to.have.property('enum');
        expect(response4xxBody.properties.reason.enum).to.deep.equal(['not_found', 'gone', 'validation_failed']);

        // Verify 5xx response type data
        const response5xxHeaders = JSON.parse(extractedTypes.response['500'].headers);
        expect(response5xxHeaders).to.be.an('array').with.length(1);
        expect(response5xxHeaders[0]).to.have.property('keyName', 'X-Error-ID');
        expect(response5xxHeaders[0].properties).to.have.property('type', 'string');
        expect(response5xxHeaders[0].properties).to.have.property('format', 'uuid');

        const response5xxBody = JSON.parse(extractedTypes.response['500'].body);
        expect(response5xxBody.properties).to.have.property('errorId');
        expect(response5xxBody.properties).to.have.property('message');
        expect(response5xxBody.properties).to.have.property('severity');
        expect(response5xxBody.properties).to.have.property('metadata');
        expect(response5xxBody.properties.errorId).to.have.property('format', 'uuid');
        expect(response5xxBody.properties.severity).to.have.property('enum');
        expect(response5xxBody.properties.severity.enum).to.deep.equal(['low', 'medium', 'high', 'critical']);
        expect(response5xxBody.properties.metadata).to.have.property('type', 'object');
        expect(response5xxBody.properties.metadata.properties).to.have.property('timestamp');
        expect(response5xxBody.properties.metadata.properties).to.have.property('service');
        expect(response5xxBody.properties.metadata.properties).to.have.property('version');
        expect(response5xxBody.properties.metadata.properties.timestamp).to.have.property('format', 'date-time');
        expect(response5xxBody.required).to.deep.equal(['errorId', 'message']);

        done();
      });
    });
  });

  describe('OpenAPI 3.1 referenced path items support', function() {
    it('should correctly convert OpenAPI 3.1 specs with referenced path items from components.pathItems', function(done) {
      const openapi = fs.readFileSync(referencedPathItemsSpec, 'utf8'),
        options = { schemaFaker: true, parametersResolution: 'schema', folderStrategy: 'paths' };

      Converter.convertV2WithTypes({ type: 'json', data: openapi }, options, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output).to.be.an('array').that.is.not.empty;

        const collection = conversionResult.output[0].data;
        expect(collection).to.have.property('info');
        expect(collection.info).to.have.property('name', 'Referenced Path Items Test');
        expect(collection).to.have.property('item');

        // Should have 2 top-level folders: users and products
        expect(collection.item).to.be.an('array').with.length(2);

        // Find the users folder (referenced path item)
        const usersFolder = collection.item.find((item) => { return item.name === 'users'; });
        expect(usersFolder, 'Users folder should exist').to.not.be.undefined;
        expect(usersFolder).to.have.property('item');

        // Users folder should have 2 requests (GET and POST from referenced path item)
        expect(usersFolder.item).to.be.an('array').with.length(2);

        // Validate GET /users request
        const getUsersRequest = usersFolder.item.find((item) => {
          return item.request && item.request.method === 'GET';
        });
        expect(getUsersRequest, 'GET /users request should exist').to.not.be.undefined;
        expect(getUsersRequest).to.have.property('name', 'Get all users');
        expect(getUsersRequest.request).to.have.property('method', 'GET');
        expect(getUsersRequest.request.url.path).to.deep.equal(['users']);

        // Validate response for GET /users
        expect(getUsersRequest.response).to.be.an('array').with.length.greaterThan(0);
        const getUsersResponse = getUsersRequest.response[0];
        expect(getUsersResponse).to.have.property('name', 'successful operation');
        expect(getUsersResponse).to.have.property('code', 200);
        expect(getUsersResponse.body).to.include('"id":');
        expect(getUsersResponse.body).to.include('"name":');

        // Validate POST /users request
        const createUserRequest = usersFolder.item.find((item) => {
          return item.request && item.request.method === 'POST';
        });
        expect(createUserRequest, 'POST /users request should exist').to.not.be.undefined;
        expect(createUserRequest).to.have.property('name', 'Create a new user');
        expect(createUserRequest.request).to.have.property('method', 'POST');
        expect(createUserRequest.request.url.path).to.deep.equal(['users']);

        // Validate request body for POST /users
        expect(createUserRequest.request.body).to.have.property('mode', 'raw');
        expect(createUserRequest.request.body.raw).to.be.a('string');
        const parsedRequestBody = JSON.parse(createUserRequest.request.body.raw);
        expect(parsedRequestBody).to.have.property('id');
        expect(parsedRequestBody).to.have.property('name');

        // Validate response for POST /users
        expect(createUserRequest.response).to.be.an('array').with.length.greaterThan(0);
        const createUserResponse = createUserRequest.response[0];
        expect(createUserResponse).to.have.property('name', 'User created successfully');
        expect(createUserResponse).to.have.property('code', 201);

        // Find the products folder (inline path item - not referenced)
        const productsFolder = collection.item.find((item) => { return item.name === 'products'; });
        expect(productsFolder, 'Products folder should exist').to.not.be.undefined;
        expect(productsFolder).to.have.property('item');

        // Products folder should have 1 request (GET only)
        expect(productsFolder.item).to.be.an('array').with.length(1);

        // Validate GET /products request
        const getProductsRequest = productsFolder.item[0];
        expect(getProductsRequest).to.have.property('name', 'Get products');
        expect(getProductsRequest.request).to.have.property('method', 'GET');
        expect(getProductsRequest.request.url.path).to.deep.equal(['products']);

        // Validate extractedTypes contains data for both paths
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;
        expect(conversionResult.extractedTypes).to.have.property('get/users');
        expect(conversionResult.extractedTypes).to.have.property('post/users');
        expect(conversionResult.extractedTypes).to.have.property('get/products');

        // Validate GET /users extracted types
        const getUsersTypes = conversionResult.extractedTypes['get/users'];
        expect(getUsersTypes).to.have.property('response');
        expect(getUsersTypes.response).to.have.property('200');
        const getUsersResponseBody = JSON.parse(getUsersTypes.response['200'].body);
        expect(getUsersResponseBody).to.have.property('type', 'array');
        expect(getUsersResponseBody.items).to.have.property('type', 'object');
        expect(getUsersResponseBody.items.properties).to.have.property('id');
        expect(getUsersResponseBody.items.properties).to.have.property('name');
        expect(getUsersResponseBody.items.properties).to.have.property('email');

        // Validate POST /users extracted types
        const createUserTypes = conversionResult.extractedTypes['post/users'];
        expect(createUserTypes).to.have.property('request');
        expect(createUserTypes.request).to.have.property('body');
        const createUserRequestBody = JSON.parse(createUserTypes.request.body);
        expect(createUserRequestBody).to.have.property('type', 'object');
        expect(createUserRequestBody.properties).to.have.property('id');
        expect(createUserRequestBody.properties).to.have.property('name');
        expect(createUserRequestBody.required).to.deep.equal(['id', 'name']);

        // Validate GET /products extracted types
        const getProductsTypes = conversionResult.extractedTypes['get/products'];
        expect(getProductsTypes).to.have.property('response');
        expect(getProductsTypes.response).to.have.property('200');
        const getProductsResponseBody = JSON.parse(getProductsTypes.response['200'].body);
        expect(getProductsResponseBody).to.have.property('type', 'array');
        expect(getProductsResponseBody.items.properties).to.have.property('id');
        expect(getProductsResponseBody.items.properties).to.have.property('name');
        expect(getProductsResponseBody.items.properties).to.have.property('price');

        done();
      });
    });

    it('should correctly convert OpenAPI 3.1 specs with referenced path items using tags folding strategy', function(done) {
      const openApiWithTags = fs.readFileSync(pathItemsWithTagsSpec, 'utf8');

      Converter.convertV2WithTypes(
        { type: 'json', data: openApiWithTags },
        { folderStrategy: 'tags' },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);

          const collection = conversionResult.output[0].data;
          expect(collection.item).to.be.an('array').with.length(2);

          // Find Users tag folder
          const usersTagFolder = collection.item.find((item) => { return item.name === 'Users'; });
          expect(usersTagFolder, 'Users tag folder should exist').to.not.be.undefined;
          expect(usersTagFolder.item).to.be.an('array').with.length(2);

          // Verify GET and POST requests are in Users folder
          const getUsersInTag = usersTagFolder.item.find((item) => {
            return item.request && item.request.method === 'GET';
          });
          const createUserInTag = usersTagFolder.item.find((item) => {
            return item.request && item.request.method === 'POST';
          });

          expect(getUsersInTag, 'GET /users should be in Users tag').to.not.be.undefined;
          expect(getUsersInTag.name).to.equal('Get all users');
          expect(createUserInTag, 'POST /users should be in Users tag').to.not.be.undefined;
          expect(createUserInTag.name).to.equal('Create user');

          // Find Products tag folder
          const productsTagFolder = collection.item.find((item) => { return item.name === 'Products'; });
          expect(productsTagFolder, 'Products tag folder should exist').to.not.be.undefined;
          expect(productsTagFolder.item).to.be.an('array').with.length(1);

          // Verify extractedTypes
          expect(conversionResult.extractedTypes).to.have.property('get/users');
          expect(conversionResult.extractedTypes).to.have.property('post/users');
          expect(conversionResult.extractedTypes).to.have.property('get/products');

          done();
        }
      );
    });

    it('should correctly resolve OpenAPI 3.1 specs with nested path item references (multiple levels of $ref)', function(done) {
      const openapi = fs.readFileSync(nestedPathItemsSpec, 'utf8');

      Converter.convertV2WithTypes({ type: 'json', data: openapi }, { folderStrategy: 'paths' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.be.true;
        expect(conversionResult.output).to.be.an('array').that.is.not.empty;

        const collection = conversionResult.output[0].data;
        expect(collection.item).to.have.lengthOf(3); // /users, /products, /orders

        // Verify /users path item (3 levels deep)
        const usersFolder = collection.item.find((item) => {
          return item.name === 'users';
        });
        expect(usersFolder, '/users folder should exist').to.exist;
        expect(usersFolder.item).to.have.lengthOf(3); // GET, POST, DELETE

        // Verify /products path item
        const productsFolder = collection.item.find((item) => {
          return item.name === 'products';
        });
        expect(productsFolder.item, '/products should have 2 operations').to.have.lengthOf(2); // GET, POST

        // Verify /orders path item (inline, no ref) - should be a folder with one request
        const ordersFolder = collection.item.find((item) => {
          return item.name === 'orders';
        });
        expect(ordersFolder.item).to.have.lengthOf(1);
        expect(ordersFolder.item[0].name).to.equal('Get orders');
        expect(ordersFolder.item[0].request.method).to.equal('GET');

        done();
      });
    });
  });

  describe('multiple examples handling', function() {
    it('should generate only one response per response code when multiple request and response examples are present', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Multiple Examples Test', version: '1.0.0' },
        paths: {
          '/spacecrafts': {
            post: {
              summary: 'Create spacecraft',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        type: { type: 'string' }
                      }
                    },
                    examples: {
                      capsuleExample: {
                        value: { name: 'Dragon', type: 'capsule' }
                      },
                      probeExample: {
                        value: { name: 'Voyager', type: 'probe' }
                      },
                      satelliteExample: {
                        value: { name: 'Hubble', type: 'satellite' }
                      }
                    }
                  }
                }
              },
              responses: {
                '201': {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' }
                        }
                      },
                      examples: {
                        example1: {
                          value: { id: '1', name: 'Dragon' }
                        },
                        example2: {
                          value: { id: '2', name: 'Voyager' }
                        },
                        example3: {
                          value: { id: '3', name: 'Hubble' }
                        }
                      }
                    }
                  }
                },
                '400': {
                  description: 'Bad Request',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          error: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        const collection = conversionResult.output[0].data;

        // Find the POST request
        const findRequest = (items) => {
          for (let item of items) {
            if (item.request) {
              return item;
            }
            if (item.item) {
              const found = findRequest(item.item);
              if (found) { return found; }
            }
          }
          return null;
        };

        const request = findRequest(collection.item);
        expect(request, 'POST request should exist').to.not.be.null;

        // CRITICAL: Should generate exactly 2 responses (one for 201, one for 400)
        // NOT 6 responses (3 examples × 2 response codes) or 3 responses (3 examples for 201 code)
        expect(request.response).to.be.an('array').with.length(2);

        // Verify we have one response for each status code
        const responseCodes = request.response.map((r) => { return r.code; });
        expect(responseCodes).to.include(201);
        expect(responseCodes).to.include(400);

        // Verify no duplicate response codes
        const uniqueCodes = [...new Set(responseCodes)];
        expect(uniqueCodes.length).to.equal(2);

        done();
      });
    });
  });

  describe('example field preservation', function() {
    it('should preserve example fields in request and response bodies with different schema types', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Example Preservation Test', version: '1.0.0' },
        paths: {
          '/test': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      example: { name: 'John Doe', age: 30 },
                      properties: {
                        name: {
                          type: 'string',
                          example: 'Jane Smith'
                        },
                        age: {
                          type: 'integer',
                          example: 25
                        },
                        tags: {
                          type: 'array',
                          example: ['tag1', 'tag2'],
                          items: {
                            type: 'string',
                            example: 'sample-tag'
                          }
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        example: { id: '123', status: 'created' },
                        properties: {
                          id: {
                            type: 'string',
                            example: 'abc123'
                          },
                          status: {
                            type: 'string',
                            example: 'active'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        // Check request body examples
        const requestBody = JSON.parse(conversionResult.extractedTypes['post/test'].request.body);
        expect(requestBody).to.have.property('example');
        expect(requestBody.example).to.deep.equal({ name: 'John Doe', age: 30 });
        expect(requestBody.properties.name).to.have.property('example', 'Jane Smith');
        expect(requestBody.properties.age).to.have.property('example', 25);
        expect(requestBody.properties.tags).to.have.property('example');
        expect(requestBody.properties.tags.example).to.deep.equal(['tag1', 'tag2']);
        expect(requestBody.properties.tags.items).to.have.property('example', 'sample-tag');

        // Check response body examples
        const responseBody = JSON.parse(conversionResult.extractedTypes['post/test'].response['200'].body);
        expect(responseBody).to.have.property('example');
        expect(responseBody.example).to.deep.equal({ id: '123', status: 'created' });
        expect(responseBody.properties.id).to.have.property('example', 'abc123');
        expect(responseBody.properties.status).to.have.property('example', 'active');

        done();
      });
    });

    it('should preserve example fields in composite schemas (anyOf, oneOf, allOf)', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Composite Example Test', version: '1.0.0' },
        paths: {
          '/composite': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          type: 'object',
                          example: { type: 'user', name: 'John' },
                          properties: {
                            name: { type: 'string' }
                          }
                        },
                        {
                          type: 'object',
                          example: { type: 'admin', role: 'superadmin' },
                          properties: {
                            role: { type: 'string' }
                          }
                        }
                      ],
                      example: { type: 'guest' }
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        oneOf: [
                          {
                            type: 'string',
                            example: 'success'
                          },
                          {
                            type: 'object',
                            example: { message: 'OK' },
                            properties: {
                              message: { type: 'string', example: 'Operation completed' }
                            }
                          }
                        ],
                        example: 'default response'
                      }
                    }
                  }
                },
                '201': {
                  description: 'Created',
                  content: {
                    'application/json': {
                      schema: {
                        allOf: [
                          {
                            type: 'object',
                            example: { id: '123' },
                            properties: {
                              id: { type: 'string', example: 'abc' }
                            }
                          },
                          {
                            type: 'object',
                            example: { timestamp: '2024-01-01' },
                            properties: {
                              timestamp: { type: 'string', example: '2024-12-22T00:00:00Z' }
                            }
                          }
                        ],
                        example: { id: '999', timestamp: '2025-01-01' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        // Check anyOf with examples
        const requestBody = JSON.parse(conversionResult.extractedTypes['post/composite'].request.body);
        expect(requestBody).to.have.property('example');
        expect(requestBody.example).to.deep.equal({ type: 'guest' });
        expect(requestBody.anyOf).to.be.an('array').with.length(2);
        expect(requestBody.anyOf[0]).to.have.property('example');
        expect(requestBody.anyOf[0].example).to.deep.equal({ type: 'user', name: 'John' });
        expect(requestBody.anyOf[1]).to.have.property('example');
        expect(requestBody.anyOf[1].example).to.deep.equal({ type: 'admin', role: 'superadmin' });

        // Check oneOf with examples
        const response200 = JSON.parse(conversionResult.extractedTypes['post/composite'].response['200'].body);
        expect(response200).to.have.property('example', 'default response');
        expect(response200.oneOf).to.be.an('array').with.length(2);
        expect(response200.oneOf[0]).to.have.property('example', 'success');
        expect(response200.oneOf[1]).to.have.property('example');
        expect(response200.oneOf[1].example).to.deep.equal({ message: 'OK' });
        expect(response200.oneOf[1].properties.message).to.have.property('example', 'Operation completed');

        // Check allOf with examples
        const response201 = JSON.parse(conversionResult.extractedTypes['post/composite'].response['201'].body);
        expect(response201).to.have.property('example');
        expect(response201.example).to.deep.equal({ id: '999', timestamp: '2025-01-01' });
        expect(response201.allOf).to.be.an('array').with.length(2);
        expect(response201.allOf[0]).to.have.property('example');
        expect(response201.allOf[0].example).to.deep.equal({ id: '123' });
        expect(response201.allOf[0].properties.id).to.have.property('example', 'abc');
        expect(response201.allOf[1]).to.have.property('example');
        expect(response201.allOf[1].example).to.deep.equal({ timestamp: '2024-01-01' });
        expect(response201.allOf[1].properties.timestamp).to.have.property('example', '2024-12-22T00:00:00Z');

        done();
      });
    });

    it('should preserve example fields in query parameters, path parameters, and headers', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Parameter Example Test', version: '1.0.0' },
        paths: {
          '/users/{userId}': {
            get: {
              parameters: [
                {
                  name: 'userId',
                  in: 'path',
                  required: true,
                  schema: {
                    type: 'string',
                    example: 'user-123'
                  }
                },
                {
                  name: 'filter',
                  in: 'query',
                  schema: {
                    type: 'string',
                    example: 'active'
                  }
                },
                {
                  name: 'limit',
                  in: 'query',
                  schema: {
                    type: 'integer',
                    example: 50
                  }
                },
                {
                  name: 'X-API-Key',
                  in: 'header',
                  schema: {
                    type: 'string',
                    example: 'api-key-abc123'
                  }
                },
                {
                  name: 'X-Request-ID',
                  in: 'header',
                  schema: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440000'
                  }
                }
              ],
              responses: {
                '200': {
                  description: 'Success',
                  headers: {
                    'X-Rate-Limit': {
                      description: 'Rate limit',
                      schema: {
                        type: 'integer',
                        example: 1000
                      }
                    },
                    'X-Session-Token': {
                      description: 'Session token',
                      schema: {
                        type: 'string',
                        example: 'session-xyz789'
                      }
                    }
                  },
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        const extractedTypes = conversionResult.extractedTypes['get/users/{userId}'];

        // Check path parameter examples
        const pathParams = JSON.parse(extractedTypes.request.pathParam);
        expect(pathParams).to.be.an('array').with.length(1);
        const userIdParam = pathParams.find((p) => { return p.keyName === 'userId'; });
        expect(userIdParam).to.be.an('object');
        expect(userIdParam.properties).to.have.property('example', 'user-123');

        // Check query parameter examples
        const queryParams = JSON.parse(extractedTypes.request.queryParam);
        expect(queryParams).to.be.an('array').with.length(2);
        const filterParam = queryParams.find((p) => { return p.keyName === 'filter'; });
        expect(filterParam).to.be.an('object');
        expect(filterParam.properties).to.have.property('example', 'active');

        const limitParam = queryParams.find((p) => { return p.keyName === 'limit'; });
        expect(limitParam).to.be.an('object');
        expect(limitParam.properties).to.have.property('example', 50);

        // Check request header examples
        const headers = JSON.parse(extractedTypes.request.headers);
        expect(headers).to.be.an('array').with.length(2);
        const apiKeyHeader = headers.find((h) => { return h.keyName === 'X-API-Key'; });
        expect(apiKeyHeader).to.be.an('object');
        expect(apiKeyHeader.properties).to.have.property('example', 'api-key-abc123');

        const requestIdHeader = headers.find((h) => { return h.keyName === 'X-Request-ID'; });
        expect(requestIdHeader).to.be.an('object');
        expect(requestIdHeader.properties).to.have.property('example', '550e8400-e29b-41d4-a716-446655440000');

        // Check response header examples
        const responseHeaders = JSON.parse(extractedTypes.response['200'].headers);
        expect(responseHeaders).to.be.an('array').with.length(2);
        const rateLimitHeader = responseHeaders.find((h) => { return h.keyName === 'X-Rate-Limit'; });
        expect(rateLimitHeader).to.be.an('object');
        expect(rateLimitHeader.properties).to.have.property('example', 1000);

        const sessionTokenHeader = responseHeaders.find((h) => { return h.keyName === 'X-Session-Token'; });
        expect(sessionTokenHeader).to.be.an('object');
        expect(sessionTokenHeader.properties).to.have.property('example', 'session-xyz789');

        done();
      });
    });

    it('should preserve example fields in nested object and array schemas', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Nested Example Test', version: '1.0.0' },
        paths: {
          '/nested': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      example: { user: { name: 'John', addresses: [{ city: 'NYC' }] } },
                      properties: {
                        user: {
                          type: 'object',
                          example: { name: 'Jane', email: 'jane@example.com' },
                          properties: {
                            name: {
                              type: 'string',
                              example: 'Bob'
                            },
                            email: {
                              type: 'string',
                              example: 'bob@example.com'
                            },
                            addresses: {
                              type: 'array',
                              example: [{ city: 'SF', zip: '94105' }],
                              items: {
                                type: 'object',
                                example: { city: 'LA', zip: '90001' },
                                properties: {
                                  city: {
                                    type: 'string',
                                    example: 'Boston'
                                  },
                                  zip: {
                                    type: 'string',
                                    example: '02101'
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              responses: {
                '200': {
                  description: 'Success',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        example: [{ id: '1' }, { id: '2' }],
                        items: {
                          type: 'object',
                          example: { id: '3', name: 'Item 3' },
                          properties: {
                            id: { type: 'string', example: '999' },
                            name: { type: 'string', example: 'Default Item' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        // Check nested object examples
        const requestBody = JSON.parse(conversionResult.extractedTypes['post/nested'].request.body);
        expect(requestBody).to.have.property('example');
        expect(requestBody.example).to.deep.equal({ user: { name: 'John', addresses: [{ city: 'NYC' }] } });
        expect(requestBody.properties.user).to.have.property('example');
        expect(requestBody.properties.user.example).to.deep.equal({ name: 'Jane', email: 'jane@example.com' });
        expect(requestBody.properties.user.properties.name).to.have.property('example', 'Bob');
        expect(requestBody.properties.user.properties.email).to.have.property('example', 'bob@example.com');
        expect(requestBody.properties.user.properties.addresses).to.have.property('example');
        expect(requestBody.properties.user.properties.addresses.example).to.deep.equal([{ city: 'SF', zip: '94105' }]);
        expect(requestBody.properties.user.properties.addresses.items).to.have.property('example');
        expect(requestBody.properties.user.properties.addresses.items.example).to.deep.equal({ city: 'LA', zip: '90001' });
        expect(requestBody.properties.user.properties.addresses.items.properties.city).to.have.property('example', 'Boston');
        expect(requestBody.properties.user.properties.addresses.items.properties.zip).to.have.property('example', '02101');

        // Check array with nested object examples
        const responseBody = JSON.parse(conversionResult.extractedTypes['post/nested'].response['200'].body);
        expect(responseBody).to.have.property('type', 'array');
        expect(responseBody).to.have.property('example');
        expect(responseBody.example).to.deep.equal([{ id: '1' }, { id: '2' }]);
        expect(responseBody.items).to.have.property('example');
        expect(responseBody.items.example).to.deep.equal({ id: '3', name: 'Item 3' });
        expect(responseBody.items.properties.id).to.have.property('example', '999');
        expect(responseBody.items.properties.name).to.have.property('example', 'Default Item');

        done();
      });
    });

    it('should preserve example fields in primitive type schemas', function(done) {
      const oas = {
        openapi: '3.0.0',
        info: { title: 'Primitive Example Test', version: '1.0.0' },
        paths: {
          '/primitive': {
            get: {
              responses: {
                '200': {
                  description: 'String response',
                  content: {
                    'text/plain': {
                      schema: {
                        type: 'string',
                        example: 'Hello World'
                      }
                    }
                  }
                },
                '201': {
                  description: 'Integer response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'integer',
                        example: 42
                      }
                    }
                  }
                },
                '202': {
                  description: 'Boolean response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'boolean',
                        example: true
                      }
                    }
                  }
                },
                '203': {
                  description: 'Number response',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'number',
                        example: 3.14159
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      Converter.convertV2WithTypes({ type: 'json', data: oas }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.extractedTypes).to.be.an('object').that.is.not.empty;

        const extractedTypes = conversionResult.extractedTypes['get/primitive'];

        // Check string example
        const response200 = JSON.parse(extractedTypes.response['200'].body);
        expect(response200).to.have.property('type', 'string');
        expect(response200).to.have.property('example', 'Hello World');

        // Check integer example
        const response201 = JSON.parse(extractedTypes.response['201'].body);
        expect(response201).to.have.property('type', 'integer');
        expect(response201).to.have.property('example', 42);

        // Check boolean example
        const response202 = JSON.parse(extractedTypes.response['202'].body);
        expect(response202).to.have.property('type', 'boolean');
        expect(response202).to.have.property('example', true);

        // Check number example
        const response203 = JSON.parse(extractedTypes.response['203'].body);
        expect(response203).to.have.property('type', 'number');
        expect(response203).to.have.property('example', 3.14159);

        done();
      });
    });
  });
});
