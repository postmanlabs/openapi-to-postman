/* eslint-disable max-len */
// Disabling max Length for better visibility of the expectedExtractedTypes

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
            'queryParam': '[\n  {\n    "keyName": "limit",\n    "properties": {\n      "type": "string",\n      "default": "<string>",\n      "required": false,\n      "deprecated": false\n    }\n  },\n  {\n    "keyName": "variable2",\n    "properties": {\n      "type": "array"\n    }\n  },\n  {\n    "keyName": "variable3",\n    "properties": {\n      "type": "array"\n    }\n  }\n]'
          },
          'response': {
            '200': {
              'body': '{\n  "type": "array",\n  "items": {\n    "type": "object",\n    "properties": {\n      "id": {\n        "type": "integer",\n        "format": "int64"\n      },\n      "name": {\n        "type": "string"\n      },\n      "tag": {\n        "type": "string"\n      }\n    },\n    "required": [\n      "id",\n      "name"\n    ]\n  }\n}',
              'headers': '[\n  {\n    "keyName": "x-next",\n    "properties": {\n      "type": "string",\n      "default": "<string>"\n    }\n  }\n]'
            },
            '500': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
              'headers': '[]'
            }
          }
        },
        'post/pets': {
          'request': {
            'headers': '[]',
            'pathParam': '[]',
            'queryParam': '[\n  {\n    "keyName": "limit",\n    "properties": {\n      "type": "string",\n      "default": "<string>",\n      "required": false,\n      "deprecated": false\n    }\n  },\n  {\n    "keyName": "variable3",\n    "properties": {\n      "type": "array"\n    }\n  }\n]'
          },
          'response': {
            '201': {
              'headers': '[]'
            },
            '500': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
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
            '500': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
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
            '500': {
              'body': '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
              'headers': '[]'
            }
          }
        }
      },
      openapi = fs.readFileSync(testSpec1, 'utf8'),
      options = { schemaFaker: true, exampleParametersResolution: 'schema' };

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
                      anyOf: [
                        {
                          type: 'object',
                          properties: {
                            name: { type: 'string' }
                          }
                        },
                        {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' }
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
                        oneOf: [
                          { type: 'string' },
                          { type: 'integer' },
                          {
                            type: 'object',
                            properties: {
                              message: { type: 'string' }
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
                      allOf: [
                        {
                          type: 'object',
                          properties: {
                            baseField: { type: 'string' }
                          }
                        },
                        {
                          type: 'object',
                          properties: {
                            extensionField: { type: 'integer' }
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
                        allOf: [
                          {
                            type: 'object',
                            properties: {
                              id: { type: 'string' }
                            }
                          },
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

        // Check response body
        const responseBody = conversionResult.extractedTypes['post/test'].response['201'].body;
        const parsedResponseBody = JSON.parse(responseBody);

        expect(parsedResponseBody).to.have.property('allOf');
        expect(parsedResponseBody.allOf).to.be.an('array').with.length(2);
        expect(parsedResponseBody.allOf[0].properties).to.have.property('id');
        expect(parsedResponseBody.allOf[1].properties).to.have.property('timestamp');

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

});
