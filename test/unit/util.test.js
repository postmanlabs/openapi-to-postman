var expect = require('chai').expect,
  _ = require('lodash'),
  SchemaUtils = require('../../lib/schemaUtils.js'),
  Utils = require('../../lib/utils.js'),
  deref = require('../../lib/deref.js'),
  crypto = require('crypto'),
  hash = (input) => {
    return crypto.createHash('sha1').update(input).digest('base64');
  },
  concreteUtils = require('./../../lib/30XUtils/schemaUtils30X');

/* Utility function Unit tests */
describe('UTILITY FUNCTION TESTS', function() {
  describe('insertSpacesInName function', function() {
    it('should insert spaces in snake/camelCase strings correctly', function (done) {
      var stringMaps = {
        'myNameIsRed': 'my Name Is Red',
        'my_nameIs_red': 'my name Is red',
        'my_name__is_red': 'my name is red',
        'NASAMission': 'NASA Mission'
      };
      _.forOwn(stringMaps, (value, key) => {
        expect(Utils.insertSpacesInName(key)).to.equal(value);
      });
      done();
    });

    it('should work for wrong inputs', function (done) {
      var stringMaps = [
        false,
        null,
        []
      ];
      _.forEach(stringMaps, (value) => {
        expect(Utils.insertSpacesInName(value)).to.equal('');
      });
      done();
    });
  });
});

describe('SCHEMA UTILITY FUNCTION TESTS ', function () {

  describe('safeSchemaFaker Function ', function() {
    it('should return result supports json-schema', function(done) {
      var schema = {
          anyOf: [{
            '$ref': '#/components/schemas/schema1'
          },
          {
            '$ref': '#/components/schemas/schema2'
          }]
        },
        components = {
          schemas: {
            schema1: {
              anyOf: [{
                '$ref': '#/components/schemas/schema3'
              }]
            },
            schema2: {
              type: 'string'
            },
            schema3: {
              $ref: '#/components/schemas/schema2'
            }
          }
        },
        parameterSource = 'REQUEST',
        resolveTo = 'schema',
        resolveFor = 'CONVERSION',
        options = {
          indentCharacter: '  ',
          stackLimit: 10,
          includeDeprecated: true
        };

      expect(SchemaUtils.safeSchemaFaker(schema, resolveTo, resolveFor, parameterSource, { components, concreteUtils },
        '', undefined, options))
        .to.equal('<string>');
      done();
    });

    it('should not resolve circular references', function(done) {
      let schema = {
          '$ref': '#/components/schemas/a'
        },
        components = {
          schemas: {
            'a': {
              'type': 'array',
              'items': {
                '$ref': '#/components/schemas/b'
              }
            },
            'b': {
              'type': 'object',
              'properties': {
                'c': {
                  '$ref': '#/components/schemas/a'
                }
              }
            }
          }
        },
        parameterSource = 'REQUEST',
        resolveTo = 'schema',
        resolveFor = 'CONVERSION',
        options = {
          indentCharacter: '  ',
          stackLimit: 10,
          includeDeprecated: true
        },

        result = SchemaUtils.safeSchemaFaker(
          schema,
          resolveTo,
          resolveFor,
          parameterSource,
          { components, concreteUtils },
          '',
          undefined,
          options
        ),
        tooManyLevelsString = result[0].c.value;

      expect(result).to.not.equal(null);
      expect(tooManyLevelsString).to.equal('<Circular reference to #/components/schemas/a detected>');
      done();
    });

    it('should throw error ref not found', function(done) {
      var schema = {
          anyOf: [{
            '$ref': '#/components/schemas/schema1'
          },
          {
            '$ref': '#/components/schemas/schema2'
          }]
        },
        components = {
          schemas: {
            schema1: {
              anyOf: [{
                '$ref': '#/components/schemas/schema4'
              },
              {
                '$ref': '#/components'
              }
              ]
            },
            schema2: {
              type: 'string'
            },
            schema4: {
              $ref: '#/components/schem2'
            }
          }
        },
        parameterSource = 'REQUEST',
        resolveTo = 'schema',
        resolveFor = 'CONVERSION',
        options = {
          indentCharacter: '  ',
          stackLimit: 10,
          includeDeprecated: true
        },
        fakedSchema = SchemaUtils.safeSchemaFaker(
          schema,
          resolveTo,
          resolveFor,
          parameterSource,
          { components, concreteUtils },
          '',
          undefined,
          options
        );

      expect(fakedSchema.value).to.equal('reference #/components/schem2 not found in the OpenAPI spec');
      done();
    });

    it('should populate the schemaFakerCache for resolveTo set as schema', function (done) {
      var schema = {
          $ref: '#/components/schema/request'
        },
        components = {
          schema: {
            request: {
              properties: {
                name: {
                  type: 'string'
                }
              }
            }
          }
        },
        parameterSource = 'REQUEST',
        resolveTo = 'schema',
        resolveFor = 'CONVERSION',
        resolvedSchema = deref.resolveRefs(schema,
          parameterSource,
          { components, concreteUtils },
          { resolveFor, resolveTo }
        ),
        schemaCache = {
          schemaFakerCache: {}
        },
        key = hash('resolveToSchema ' + JSON.stringify(resolvedSchema) + ' schemaFormatDEFAULT'),
        options = {
          indentCharacter: '  ',
          stackLimit: 10,
          includeDeprecated: true
        },
        fakedSchema = SchemaUtils.safeSchemaFaker(schema, resolveTo, resolveFor, parameterSource,
          { components, concreteUtils }, 'default', schemaCache, options);

      expect(schemaCache.schemaFakerCache).to.have.property(key);
      expect(schemaCache.schemaFakerCache[key]).to.equal(fakedSchema);
      expect(fakedSchema).to.eql({
        name: '<string>'
      });
      done();

    });

    it('should populate the schemaFakerCache for resolveTo set as example', function (done) {
      var schema = {
          $ref: '#/components/schema/response'
        },
        components = {
          schema: {
            response: {
              properties: {
                name: {
                  type: 'string',
                  example: '200 OK Response'
                }
              }
            }
          }
        },
        parameterSource = 'RESPONSE',
        resolveTo = 'example',
        resolveFor = 'CONVERSION',
        schemaCache = {
          schemaFakerCache: {}
        },
        resolvedSchema = deref.resolveRefs(schema,
          parameterSource,
          { components, concreteUtils },
          { resolveFor, resolveTo }
        ),
        key = hash('resolveToExample ' + JSON.stringify(resolvedSchema) + ' schemaFormatDEFAULT'),
        options = {
          indentCharacter: '  ',
          stackLimit: 10,
          includeDeprecated: true
        },
        fakedSchema = SchemaUtils.safeSchemaFaker(schema, resolveTo, resolveFor, parameterSource,
          { components, concreteUtils }, 'default', schemaCache, options);

      expect(schemaCache.schemaFakerCache).to.have.property(key);
      expect(schemaCache.schemaFakerCache[key]).to.equal(fakedSchema);
      expect(fakedSchema).to.eql({
        name: '200 OK Response'
      });
      done();

    });

    it('should populate schemaFakerCache with distinct value when only the schemaFormat is different', function (done) {
      var schema = {
          $ref: '#/components/schema/request'
        },
        components = {
          schema: {
            request: {
              properties: {
                name: {
                  type: 'string'
                }
              }
            }
          }
        },
        parameterSource = 'REQUEST',
        resolveTo = 'schema',
        resolveFor = 'CONVERSION',
        resolvedSchema = deref.resolveRefs(schema,
          parameterSource,
          { components, concreteUtils },
          { resolveFor, resolveTo }
        ),
        schemaCache = {
          schemaFakerCache: {}
        },
        xml_key = hash('resolveToSchema ' + JSON.stringify(resolvedSchema) + ' schemaFormatXML'),
        default_key = hash('resolveToSchema ' + JSON.stringify(resolvedSchema) + ' schemaFormatDEFAULT'),
        options = {
          indentCharacter: '  ',
          stackLimit: 10,
          includeDeprecated: true
        },
        fakedSchema_default = SchemaUtils.safeSchemaFaker(schema, resolveTo, resolveFor, parameterSource,
          { components, concreteUtils }, 'default', schemaCache, options),
        fakedSchema_xml = SchemaUtils.safeSchemaFaker(schema, resolveTo, resolveFor, parameterSource,
          { components, concreteUtils }, 'xml', schemaCache, options);

      expect(schemaCache.schemaFakerCache).to.have.property(default_key);
      expect(schemaCache.schemaFakerCache[default_key]).to.equal(fakedSchema_default);
      expect(fakedSchema_default).to.eql({
        name: '<string>'
      });

      expect(schemaCache.schemaFakerCache).to.have.property(xml_key);
      expect(schemaCache.schemaFakerCache[xml_key]).to.equal(fakedSchema_xml);
      expect(fakedSchema_xml).to.eql(
        '<element>\n  <name>(string)</name>\n</element>'
      );

      done();
    });

  });

  describe('convertToPmCollectionVariables function', function() {
    it('should convert serverVariables correctly', function () {
      var serverVariables = {
          'v1': {
            'default': 'v2.0',
            'enum': ['v2.0', 'v2.1'],
            'description': 'version number'
          }
        },
        retVal = SchemaUtils.convertToPmCollectionVariables(serverVariables, null, null);
      expect(retVal).to.be.an('array');
      expect(retVal[0].key).to.equal('v1');
      expect(retVal[0].value).to.equal('v2.0');
    });

    it('should convert baseUrl correctly', function () {
      var serverVariables = {
          'v1': {
            'default': 'v2.0',
            'enum': ['v2.0', 'v2.1'],
            'description': 'version number'
          }
        },
        keyName = 'baseUrl',
        baseUrl = 'hello.com',
        retVal = SchemaUtils.convertToPmCollectionVariables(serverVariables, keyName, baseUrl);

      expect(retVal).to.be.an('array');

      expect(retVal[0].key).to.equal('v1');
      expect(retVal[0].value).to.equal('v2.0');
      expect(retVal[1].key).to.equal('baseUrl');
      expect(retVal[1].value).to.equal('hello.com');
    });
  });

  describe('getRequestParam', function () {
    it('should combine operationParams and pathParams', function() {
      var operationParams = [
          { name: 'limit', in: 'query', description: 'hello operation' },
          { name: 'variable', in: 'header', description: 'hello again' }
        ],
        pathParams = [
          { name: 'limit', in: 'query', description: 'hello path' }
        ],
        retVal = SchemaUtils.getRequestParams(operationParams, pathParams, {});

      expect(retVal).to.be.an('array');
      expect(retVal.length).to.equal(2);
      expect(retVal[0].name).to.equal('limit');
      expect(retVal[0].description).to.equal('hello operation');
      expect(retVal[1].name).to.equal('variable');
      expect(retVal[1].description).to.equal('hello again');
    });

    it('should return pathParam(array) if operationParam is not of type array', function () {
      var operationParam = { name: 'limit', in: 'query', description: 'hello' },
        pathParam = [
          { name: 'limit', in: 'query', description: '' }
        ],
        retVal = SchemaUtils.getRequestParams(operationParam, pathParam, {});
      expect(retVal).to.eql(pathParam);
    });

    it('should return operationParam(array) if pathParam is not of type array', function () {
      var pathParam = { name: 'limit', in: 'query', description: 'hello' },
        operationParam = [
          { name: 'limit', in: 'query', description: '' }
        ],
        retVal = SchemaUtils.getRequestParams(operationParam, pathParam, {});
      expect(retVal).to.eql(operationParam);
    });

    it('should return empty array if pathParam and operationParam are not of type array', function () {
      var operationParam = { name: 'limit', in: 'query', description: 'hello' },
        pathParam = { name: 'limit', in: 'query', description: '' },
        retVal = SchemaUtils.getRequestParams(operationParam, pathParam, {});
      expect(retVal).to.eql([]);
    });

    it('should not throw error if a parameter with invalid $ref is passed', function () {
      var operationParam = [
          { name: 'limit', in: 'query', $ref: '#/invalid/ref/1' }
        ],
        pathParam = [
          { $ref: '#/components/schemas/searchParam' }
        ],
        componentsAndPaths = {
          components: {
            schemas: {
              searchParam: {
                name: 'search',
                in: 'query',
                schema: {
                  type: 'string'
                }
              }
            }
          }
        },
        retVal = SchemaUtils.getRequestParams(operationParam, pathParam, componentsAndPaths);
      expect(retVal).to.deep.equal([
        {
          value: 'Error reading #/invalid/ref/1. Can only use references from components and paths'
        },
        {
          name: 'search',
          in: 'query',
          schema: {
            type: 'string'
          }
        }
      ]);
    });
  });

  describe('generateTrieFromPaths Function ', function() {
    it('should generate trie taking swagger specs as input', function(done) {
      var openapi = {
          'openapi': '3.0.0',
          'info': {
            'version': '1.0.0',
            'title': 'Swagger Petstore',
            'license': {
              'name': 'MIT'
            }
          },
          'servers': [
            {
              'url': 'http://petstore.swagger.io/{v1}'
            }
          ],
          'paths': {
            '/pet': {
              'get': {
                'summary': 'List all pets',
                'operationId': 'listPets',
                'tags': [
                  'pets'
                ],
                'parameters': [
                  {
                    'name': 'variable',
                    'in': 'header',
                    'description': 'random variable',
                    'style': 'form',
                    'explode': false,
                    'schema': {
                      'type': 'array',
                      'items': {
                        'type': 'string'
                      }
                    }
                  },
                  {
                    'name': 'variable2',
                    'in': 'query',
                    'description': 'another random variable',
                    'style': 'spaceDelimited',
                    'schema': {
                      'type': 'array',
                      'items': {
                        'type': 'integer',
                        'format': 'int64'
                      }
                    }
                  }
                ],
                'responses': {
                  '200': {
                    'description': 'An paged array of pets',
                    'headers': {
                      'x-next': {
                        'description': 'A link to the next page of responses',
                        'schema': {
                          'type': 'string'
                        }
                      }
                    },
                    'content': {
                      'application/json': {
                        'schema': {
                          '$ref': '#/components/schemas/Pets'
                        }
                      }
                    }
                  },
                  'default': {
                    'description': 'unexpected error',
                    'content': {
                      'application/json': {
                        'schema': {
                          '$ref': '#/components/schemas/Error'
                        }
                      }
                    }
                  }
                },
                'servers': [
                  {
                    'url': 'http://petstore3.swagger.io/{v3}',
                    'variables': {
                      'v3': {
                        'default': 'v6.0',
                        'enum': ['v4.0', 'v5.0', 'v6.0'],
                        'description': 'version number'
                      }
                    }
                  }
                ]
              },
              'post': {
                'tags': [
                  'pets'
                ],
                'requestBody': {
                  '$ref': '#/components/requestBodies/body1'
                },
                'responses': {
                  '201': {
                    'description': 'Null response'
                  },
                  'default': {
                    'description': 'unexpected error',
                    'headers': {
                      'X-Rate-Limit-Limit': {
                        '$ref': '#/components/headers/header1'
                      }
                    },
                    'content': {
                      'application/json': {
                        'schema': {
                          '$ref': '#/components/schemas/Error'
                        }
                      }
                    }
                  }
                }
              },
              'servers': [
                {
                  'url': 'http://petstore.swagger.io/{v2}',
                  'variables': {
                    'v2': {
                      'default': 'v3.0',
                      'enum': ['v2.0', 'v2.1', 'v2.2', 'v2.3'],
                      'description': 'version number'
                    }
                  }
                }
              ]
            },
            '/pet/{petId}': {
              'get': {
                'operationId': 'showPetById',
                'tags': [
                  'pets'
                ],
                'parameters': [
                  {
                    'name': 'petId',
                    'in': 'path',
                    'required': true,
                    'description': 'The id of the pet to retrieve',
                    'schema': {
                      'type': 'string'
                    }
                  }
                ],
                'responses': {
                  '200': {
                    'description': 'Expected response to a valid request',
                    'content': {
                      'application/json': {
                        'schema': {
                          '$ref': '#/components/schemas/Pets'
                        }
                      }
                    }
                  },
                  'default': {
                    'description': 'unexpected error',
                    'content': {
                      'application/json': {
                        'schema': {
                          '$ref': '#/components/schemas/Error'
                        }
                      }
                    }
                  }
                }
              }
            },
            '/nonpet/': {
              'get': {
                'summary': 'List all pets',
                'operationId': 'listPets'
              },
              'post': {
                'tags': [
                  'pets'
                ]
              }
            }
          }
        },
        output = SchemaUtils.generateTrieFromPaths(openapi),
        root = output.tree.root,
        collectionVariables = output.variables;
      expect(root.children).to.be.an('object').that.has.all.keys('pet', 'nonpet');
      expect(root.children.pet.requestCount).to.equal(3);
      expect(root.children.pet.requests.length).to.equal(2);
      expect(root.children.pet.children).to.have.key('{petId}');
      expect(root.children.pet.children['{petId}'].requestCount).to.equal(1);

      // for paths with trailing slashes
      expect(root.children.nonpet.children, 'Nonpet should have direct requests, not a child')
        .to.not.have.any.keys('');
      expect(root.children.nonpet.requestCount).to.equal(2);
      expect(collectionVariables).to.have.key('pet-Url');
      done();
    });

    // https://github.com/postmanlabs/openapi-to-postman/issues/80
    it('should generate trie taking swagger specs with root endpoint declaration as input.', function (done) {
      var openapi = {
          'openapi': '3.0.0',
          'info': {
            'version': '1.0.0',
            'title': 'Swagger Petstore',
            'license': {
              'name': 'MIT'
            }
          },
          'servers': [
            {
              'url': 'http://petstore.swagger.io/{v1}'
            }
          ],
          'paths': {
            '/': {
              'get': {
                'summary': 'List all pets',
                'operationId': 'listPets',
                'responses': {
                  '200': {
                    'description': 'An paged array of pets'
                  }
                }
              }
            }
          }
        },
        output = SchemaUtils.generateTrieFromPaths(openapi),
        root = output.tree.root;

      expect(root.children).to.be.an('object').that.has.all.keys('(root)');
      expect(root.children['(root)'].requestCount).to.equal(1);
      expect(root.children['(root)'].requests.length).to.equal(1);

      done();
    });

    it('should generate trie for definition with certain path segment same as JS object function names correctly',
      function (done) {
        var openapi = {
            'openapi': '3.0.0',
            'info': {
              'version': '1.0.0',
              'title': 'Swagger Petstore',
              'license': {
                'name': 'MIT'
              }
            },
            'servers': [
              {
                'url': 'http://petstore.swagger.io/{v1}'
              }
            ],
            'paths': {
              '/constructor/v3/update-constructor': {
                'get': {
                  'summary': 'List all pets',
                  'operationId': 'listPets',
                  'responses': {
                    '200': {
                      'description': 'An paged array of pets'
                    }
                  }
                }
              }
            }
          },
          output = SchemaUtils.generateTrieFromPaths(openapi),
          root = output.tree.root;

        expect(root.children).to.be.an('object').that.has.all.keys('constructor');
        expect(root.children.constructor.requestCount).to.equal(1);

        done();
      });
  });

  describe('convertPathVariables', function() {
    it('should convert method variables', function() {
      var retVal = SchemaUtils.convertPathVariables(
        'method',
        [],
        {
          v3: {
            default: 'v6.0',
            enum: ['v4.0', 'v5.0'],
            description: 'version number'
          }
        },
        {}
      );
      expect(retVal).to.be.an('array');
      expect(retVal[0].key).to.equal('v3');
      expect(retVal[0].description).to.equal('version number (This can only be one of v4.0,v5.0)');
      expect(retVal[0].value).to.equal('v6.0');
    });

    it('should convert root variables', function() {
      var retVal = SchemaUtils.convertPathVariables(
        'root',
        [],
        {
          v3: {
            default: 'v6.0',
            enum: ['v4.0', 'v5.0'],
            description: 'version number'
          }
        }
      );
      expect(retVal).to.be.an('array');
      expect(retVal[0].key).to.equal('v3');
      expect(retVal[0].description).to.equal('version number (This can only be one of v4.0,v5.0)');
      expect(retVal[0].value).to.equal('{{v3}}');
    });

    it('should convert non-root/method variables', function() {
      var retVal = SchemaUtils.convertPathVariables(
        'not-root-or-method',
        [],
        [
          {
            name: 'varName',
            in: 'path',
            description: 'varDesc',
            schema: {
              type: 'integer',
              format: 'int32'
            }
          }
        ],
        {}, {}, {}
      );
      expect(retVal).to.be.an('array');
      expect(retVal[0].key).to.equal('varName');
      expect(retVal[0].description).to.equal('varDesc');
      expect(retVal[0].value).to.be.a('string');
    });
  });

  describe('convertToPmBodyData', function() {
    it('should not fail when bodyObj is not defined', function() {
      var bodyWithSchema,
        retValSchema = SchemaUtils.convertToPmBodyData(bodyWithSchema, 'ROOT', 'application/json',
          'REQUEST', 'tab', {}, {}, {});

      expect(retValSchema).to.be.equal('');
    });

    it('should work for schemas', function() {
      var bodyWithSchema = {
          schema: {
            type: 'integer',
            format: 'int32'
          }
        },
        retValSchema = SchemaUtils.convertToPmBodyData(bodyWithSchema, 'ROOT', 'application/json',
          'REQUEST', 'tab', {}, { schemaFaker: true }, {});

      expect(retValSchema).to.be.equal('<integer>');
    });

    it('should work for example', function() {
      var bodyWithExample = {
          example: 'This is a sample value'
        },
        retValExample = SchemaUtils.convertToPmBodyData(bodyWithExample, 'ROOT', 'application/json',
          'REQUEST', 'tab', {}, {}, {});

      expect(retValExample).to.equal('This is a sample value');
    });

    it('should work for example with value property', function() {
      var bodyWithExample = {
          example: {
            value: 'This is a sample value'
          }
        },
        retValExample = SchemaUtils.convertToPmBodyData(bodyWithExample, 'ROOT', 'application/json',
          'REQUEST', 'tab', {}, {}, {});

      expect(retValExample.value).to.equal('This is a sample value');
    });

    it('should work for examples', function() {
      var bodyWithExamples = {
          examples: {
            foo: {
              value: {
                foo: 1,
                bar: 2
              }
            }
          }
        },
        retValExamples = SchemaUtils.convertToPmBodyData(bodyWithExamples, 'ROOT', 'application/json',
          'request', ' ', null, { requestParametersResolution: 'example' });
      expect(retValExamples.foo).to.equal(1);
      expect(retValExamples.bar).to.equal(2);
    });

    it('should work for examples with a $ref for non-json requests', function() {
      var bodyWithExamples = {
          'example': {
            '$ref': '#/components/examples/SampleExample/value'
          }
        },
        retValExample = SchemaUtils.convertToPmBodyData(bodyWithExamples, 'ROOT', 'text/plain',
          'request', ' ', {
            components: {
              examples: {
                SampleExample: {
                  summary: 'SampleExample',
                  description: 'Sample example',
                  value: 'Hello'
                }
              }
            }
          },
          { requestParametersResolution: 'example' });
      expect(retValExample).to.equal('Hello');
    });

    it('should work for examples with a $ref for json requests', function() {
      var bodyWithExamples = {
          'example': {
            '$ref': '#/components/examples/SampleExample/value'
          }
        },
        retValExample = SchemaUtils.convertToPmBodyData(bodyWithExamples, 'ROOT', 'application/json',
          'request', ' ', {
            'components': {
              'examples': {
                'SampleExample': {
                  'summary': 'SampleExample',
                  'description': 'Sample example',
                  'value': '{"name": "Example"}'
                }
              }
            }
          }, { requestParametersResolution: 'example' });
      expect(retValExample.name).to.equal('Example');
    });
  });

  describe('convertToPmHeader Function ', function() {
    it('Should convert header with schema to pm header', function (done) {
      var header = {
        name: 'X-Header-One',
        in: 'header',
        description: 'Header1',
        schema: {
          type: 'integer',
          format: 'int64'
        }
      };
      let pmHeader = SchemaUtils.convertToPmHeader(header, 'ROOT', 'REQUEST', {}, {}, {});
      expect(pmHeader.key).to.equal(header.name);
      expect(pmHeader.description).to.equal(header.description);
      expect(typeof pmHeader.value).to.equal('string');// because schema v2.1.0 supports only string value.
      done();
    });
    it('Should convert header without schema to pm header', function (done) {
      var header = {
        name: 'X-Header-One',
        in: 'header',
        description: 'Header1'
      };
      let pmHeader = SchemaUtils.convertToPmHeader(header, 'ROOT', 'REQUEST', {}, {}, {});
      expect(pmHeader.key).to.equal(header.name);
      expect(pmHeader.description).to.equal(header.description);
      expect(pmHeader.value).to.equal('');
      done();
    });
    it('Should convert strings without extra quotes', function (done) {
      var header = {
        name: 'Authorization',
        in: 'header',
        description: 'Authorization',
        required: false,
        schema: {
          type: 'string',
          default: 'Bearer'
        }
      };
      let pmHeader = SchemaUtils.convertToPmHeader(header, 'ROOT', 'REQUEST', {}, { schemaFaker: true }, {});
      expect(pmHeader.key).to.equal('Authorization');
      expect(pmHeader.value).to.equal('Bearer'); // not \"Bearer\"
      done();
    });
  });

  describe('getRefObject', function() {
    it('Should convert schemas where components have refs to other components', function (done) {
      // deref compnents more than 2 levels deep
      var resolvedObject = SchemaUtils.getRefObject('#/components/responses/InternalError/headers/Retry-After',
        {
          'components': {
            'responses': {
              'TooManyRequests': {
                'description': '`Too Many Requests`\n',
                'headers': {
                  'Retry-After': {
                    '$ref': '#/components/responses/InternalError/headers/Retry-After'
                  }
                }
              },
              'InternalError': {
                'description': '`Internal Error`\n',
                'headers': {
                  'Retry-After': {
                    'description': 'Some description',
                    'schema': {
                      'oneOf': [
                        {
                          'type': 'string',
                          'description': 'A date'
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      );
      expect(resolvedObject.description).to.equal('Some description');
      expect(resolvedObject.schema.oneOf.length).to.equal(1);
      done();
    });

    it('Should convert schemas with references to paths (using ~1, ~0, and Percent Encoding)', function (done) {
      var resolvedObject = SchemaUtils.getRefObject('#/paths/~1category~1%7Bid%7D/get/parameters/0', {
        paths: {
          '/category/{id}': {
            get: {
              summary: 'Summary',
              parameters: [{
                name: 'expand',
                in: 'query',
                description: 'Sample description',
                schema: {
                  type: 'string'
                }
              }]
            }
          }
        }
      });
      expect(resolvedObject.description).to.equal('Sample description');
      expect(resolvedObject.name).to.equal('expand');
      done();
    });
  });

  describe('convertParamsWithStyle', function () {
    it('should work for string params', function() {
      var params = {
          name: 'limit',
          in: 'query',
          description: 'How many items to return at one time (max 100)',
          schema: {
            type: 'string'
          }
        },
        paramValue = '<integer>',
        retVal = SchemaUtils.convertParamsWithStyle(params, paramValue);

      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].description).to.equal(params.description);
      expect(retVal[0].key).to.equal(params.name);
      expect(retVal[0].value).to.equal(paramValue);
    });

    it('should work for different styles of arrays', function() {
      var paramsExplode = {
          explode: true,
          style: 'form',
          name: 'paramsExplode',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramsSpace = {
          style: 'spaceDelimited',
          name: 'paramsSpace',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramsPipe = {
          style: 'pipeDelimited',
          name: 'paramsPipe',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramsForm = {
          style: 'form',
          name: 'paramsForm',
          in: 'query',
          schema: {
            type: 'array'
          },
          explode: false
        },
        paramValue = ['1', '2'],
        retVal;

      retVal = SchemaUtils.convertParamsWithStyle(paramsExplode, paramValue);
      expect(retVal).be.an('array').with.length(2);
      expect(retVal[0].key).to.equal(paramsExplode.name);
      expect(retVal[0].value).to.equal(paramValue[0]);
      expect(retVal[1].key).to.equal(paramsExplode.name);
      expect(retVal[1].value).to.equal(paramValue[1]);


      retVal = SchemaUtils.convertParamsWithStyle(paramsSpace, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsSpace.name);
      expect(retVal[0].value).to.equal('1%202');

      retVal = SchemaUtils.convertParamsWithStyle(paramsPipe, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsPipe.name);
      expect(retVal[0].value).to.equal('1|2');

      retVal = SchemaUtils.convertParamsWithStyle(paramsForm, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsForm.name);
      expect(retVal[0].value).to.equal('1,2');
    });

    it('should work for different styles of objects', function() {
      var paramSchema = {
          type: 'object',
          properties: {
            a: {
              type: 'integer'
            },
            b: {
              type: 'integer'
            }
          }
        },
        paramsSpace = {
          style: 'spaceDelimited',
          name: 'paramsSpace',
          in: 'query',
          schema: paramSchema
        },
        paramsPipe = {
          style: 'pipeDelimited',
          name: 'paramsPipe',
          in: 'query',
          schema: paramSchema
        },
        paramsDeep = {
          style: 'deepObject',
          name: 'paramsDeep',
          in: 'query',
          schema: paramSchema
        },
        paramsForm = {
          style: 'form',
          name: 'paramsForm',
          in: 'query',
          explode: false,
          schema: paramSchema
        },
        paramsFormExplode = { // explode is default if not specified for style = form
          style: 'form',
          name: 'paramsFormExplode',
          in: 'query',
          schema: paramSchema
        },
        paramValue = { a: 1, b: 2 },
        retVal = SchemaUtils.convertParamsWithStyle(paramsSpace, paramValue);

      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsSpace.name);
      expect(retVal[0].value).to.equal('a%201%20b%202');

      retVal = SchemaUtils.convertParamsWithStyle(paramsPipe, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsPipe.name);
      expect(retVal[0].value).to.equal('a|1|b|2');

      retVal = SchemaUtils.convertParamsWithStyle(paramsDeep, paramValue);
      expect(retVal).be.an('array').with.length(2);
      expect(retVal[0].key).to.equal(paramsDeep.name + '[a]');
      expect(retVal[0].value).to.equal(1);
      expect(retVal[1].key).to.equal(paramsDeep.name + '[b]');
      expect(retVal[1].value).to.equal(2);

      retVal = SchemaUtils.convertParamsWithStyle(paramsForm, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsForm.name);
      expect(retVal[0].value).to.equal('a,1,b,2');

      retVal = SchemaUtils.convertParamsWithStyle(paramsFormExplode, paramValue);
      expect(retVal).be.an('array').with.length(2);
      expect(retVal[0].key).to.equal('a');
      expect(retVal[0].value).to.equal(1);
      expect(retVal[1].key).to.equal('b');
      expect(retVal[1].value).to.equal(2);
    });
  });

  describe('convertToPmQueryParameters ', function() {
    it('Should convert undefined queryParam to pm param', function (done) {
      var param;
      let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
        schemaFaker: true
      });
      expect(pmParam.length).to.equal(0);
      done();
    });
    it('Should convert queryParam without schema to pm param', function (done) {
      var param = {
        name: 'X-Header-One',
        in: 'query',
        description: 'query param'
      };
      let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
        schemaFaker: true
      });
      expect(pmParam[0].key).to.equal(param.name);
      expect(pmParam[0].description).to.equal(param.description);
      expect(pmParam[0].value).to.equal('');
      done();
    });
    it('Should convert queryParam (number) to a query param with a string value', function (done) {
      var param = {
        name: 'X-Header-One',
        in: 'query',
        description: 'query param',
        schema: {
          type: 'integer',
          default: 10
        }
      };
      let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
        schemaFaker: true
      });
      expect(pmParam[0].value).to.equal('10'); // '10', not 10
      done();
    });
    it('Should convert queryParam (boolean) to a query param with a string value', function (done) {
      var param = {
        name: 'X-Header-One',
        in: 'query',
        description: 'query param',
        schema: {
          type: 'boolean',
          default: true
        }
      };
      let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
        schemaFaker: true
      });
      expect(pmParam[0].value).to.equal('true'); // 'true', not true
      done();
    });
    describe('Should convert queryParam with schema {type:array, ', function() {
      describe('style:form, ', function() {
        describe('explode:true} to pm param ', function () {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: true,
            schema: {
              type: 'array',
              items: {
                type: 'integer',
                format: 'int64'
              }
            }
          };
          it('schemaFaker = true', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
              schemaFaker: true
            });
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.equal('<long>');
            done();
          });
          it('schemaFaker = false', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', null, { schemaFaker: false });
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.equal('');
            done();
          });
        });
        describe('explode:false} to pm param ', function () {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: false,
            schema: {
              type: 'array',
              items: {
                type: 'integer',
                format: 'int64'
              }
            }
          };
          it('schemaFaker = true', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
              schemaFaker: true
            });
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.have.string(',');
            done();
          });
          it('schemaFaker = false', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', null, { schemaFaker: false });
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.have.string('');
            done();
          });
        });
      });
      describe('style:spaceDelimited} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'spaceDelimited',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('%20');
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', null, {
            schemaFaker: false
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.equal('');
          done();
        });
      });
      describe('style:pipeDelimited} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'pipeDelimited',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('|');
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: false
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.equal('');
          done();
        });
      });
      describe('style:deepObject} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'deepObject',
          schema: {
            type: 'object',
            properties: {
              R: { type: 'integer' },
              G: { type: 'integer' },
              B: { type: 'integer' }
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam[0].key).to.equal(param.name + '[R]');
          expect(pmParam[1].key).to.equal(param.name + '[G]');
          expect(pmParam[2].key).to.equal(param.name + '[B]');
          expect(pmParam[0].description).to.equal(param.description);
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: false
          });
          expect(pmParam).to.eql([]);
          done();
        });
      });
      describe('style:any other} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          explode: false,
          description: 'query param',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string(',');
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: false
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.equal('');
          done();
        });
      });
    });
    describe('Should convert queryParam with schema {type:object, ', function() {
      describe('style:form, ', function() {
        describe('explode:true} to pm param ', function () {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: true,
            schema: {
              type: 'object',
              required: [
                'id',
                'name'
              ],
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64'
                },
                name: {
                  type: 'string'
                }
              }
            }
          };
          it('schemaFaker = true', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
              schemaFaker: true
            });
            expect(pmParam[0].key).to.equal('id');
            expect(pmParam[1].key).to.equal('name');
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[1].description).to.equal(param.description);
            expect(pmParam[0].value).to.equal('<long>');
            expect(pmParam[1].value).to.equal('<string>');
            done();
          });
          it('schemaFaker = false', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
              schemaFaker: false
            });
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.equal('');
            done();
          });
        });
        describe('explode:false} to pm param ', function () {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: false,
            schema: {
              type: 'object',
              required: [
                'id',
                'name'
              ],
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64'
                },
                name: {
                  type: 'string'
                }
              }
            }
          };
          it('schemaFaker = true', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
              schemaFaker: true
            });
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.have.string('id');
            expect(pmParam[0].value).to.have.string('name');
            done();
          });
          it('schemaFaker = false', function (done) {
            let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
              schemaFaker: false
            });
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.equal('');
            done();
          });
        });
      });
      describe('style:spaceDelimited} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'spaceDelimited',
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'integer',
                format: 'int64'
              }
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('%20');
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: false
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.equal('');
          done();
        });
      });
      describe('style:pipeDelimited} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'pipeDelimited',
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'integer',
                format: 'int64'
              }
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('|');
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: false
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.equal('');
          done();
        });
      });
      describe('style:deepObject} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'deepObject',
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'string'
              },
              address: {
                type: 'object',
                properties: {
                  city: { type: 'string' },
                  state: { type: 'string' },
                  country: { type: 'string' }
                }
              }
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam).to.have.lengthOf(5);
          expect(pmParam[0].key).to.equal(param.name + '[id]');
          expect(pmParam[1].key).to.equal(param.name + '[name]');
          expect(pmParam[2].key).to.equal(param.name + '[address][city]');
          expect(pmParam[3].key).to.equal(param.name + '[address][state]');
          expect(pmParam[4].key).to.equal(param.name + '[address][country]');

          _.map(pmParam, (val, ind) => { expect(pmParam[ind].description).to.equal(param.description); });

          expect(pmParam[0].value).to.equal('<long>');
          expect(pmParam[1].value).to.equal('<string>');
          expect(pmParam[2].value).to.equal('<string>');
          expect(pmParam[3].value).to.equal('<string>');
          expect(pmParam[4].value).to.equal('<string>');
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: false
          });
          expect(pmParam).to.eql([]);
          done();
        });
      });
      describe('style:any other} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          explode: false,
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'string'
              }
            }
          }
        };
        it('schemaFaker = true', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: true
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(typeof pmParam[0].value).to.equal('string');
          done();
        });
        it('schemaFaker = false', function (done) {
          let pmParam = SchemaUtils.convertToPmQueryParameters(param, 'ROOT', {}, {
            schemaFaker: false
          });
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(typeof pmParam[0].value).to.equal('string');
          done();
        });
      });
    });

    describe('Should convert queryParam with schema {type:object, properties: undefined, explode: true, ', function() {
      let emptyObjParam = {
        name: 'empty-obj',
        in: 'query',
        description: 'query param',
        schema: { type: 'object' }
      };

      it('style:deepObject } to pm param', function (done) {
        let pmParam = SchemaUtils.convertToPmQueryParameters(_.assign(emptyObjParam, { style: 'deepObject' }), 'ROOT',
          {}, { schemaFaker: true });
        expect(pmParam).to.eql([]);
        done();
      });

      it('style:form } to pm param', function (done) {
        let pmParam = SchemaUtils.convertToPmQueryParameters(_.assign(emptyObjParam, { style: 'form' }), 'ROOT',
          {}, { schemaFaker: true });
        expect(pmParam).to.eql([]);
        done();
      });
    });
  });

  describe('convertToPmBody function', function() {
    describe('should convert requestbody of media type', function() {
      describe('requestType=EXAMPLE', function () {
        it(' application/json', function(done) {
          let requestBody = {
              description: 'body description',
              content: {
                'application/json': {
                  'schema': {
                    type: 'object',
                    required: [
                      'id',
                      'name'
                    ],
                    properties: {
                      id: {
                        type: 'integer',
                        format: 'int64'
                      },
                      name: {
                        type: 'string'
                      },
                      neglect: { // this will be neglected since schemaFaker does not process
                        type: 'string',
                        format: 'binary'
                      }
                    }
                  }
                }
              }
            },
            result, resultBody;
          result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
            exampleParametersResolution: 'example',
            schemaFaker: true
          });
          resultBody = JSON.parse(result.body.raw);
          expect(resultBody.id).to.be.a('number');
          expect(resultBody.name).to.be.a('string');
          expect(result.contentHeader).to.deep.include({ key: 'Content-Type', value: 'application/json' });
          expect(result.body.options.raw.language).to.equal('json');
          done();
        });

        it(' application/x-www-form-urlencoded', function(done) {
          let requestBody = {
              description: 'body description',
              content: {
                'application/x-www-form-urlencoded': {
                  examples: ''
                }
              }
            },
            result, resultBody;
          result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
            exampleParametersResolution: 'example'
          });
          resultBody = (result.body.urlencoded.toJSON());
          expect(resultBody).to.eql([]);
          expect(result.contentHeader).to.deep.include(
            { key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
          done();
        });

        it(' multipart/form-data', function(done) {
          let requestBody = {
              description: 'body description',
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      file: {
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      }
                    },
                    required: ['file']
                  }
                }
              }
            },
            result, resultBody;
          result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
            exampleParametersResolution: 'example',
            schemaFaker: true
          });
          resultBody = (result.body.formdata.toJSON());
          expect(resultBody[0].key).to.equal('file');
          expect(result.contentHeader).to.deep.include(
            { key: 'Content-Type', value: 'multipart/form-data' });
          done();
        });

        it(' text/xml', function(done) { // not properly done
          let requestBody = {
              description: 'body description',
              content: {
                'text/xml': {
                  schema: {
                    type: 'string',
                    xml: {
                      name: 'AnXMLObject'
                    }
                  },
                  examples: {
                    xml: {
                      summary: 'A list containing two items',
                      value: 'test'
                    }
                  }
                }
              }
            },
            result, resultBody;
          result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
            exampleParametersResolution: 'example'
          });
          resultBody = (result.body.raw);
          expect(resultBody).to.equal(
            '<?xml version="1.0" encoding="UTF-8"?>\n<AnXMLObject>test</AnXMLObject>'
          );
          expect(result.contentHeader).to.deep.include(
            { key: 'Content-Type', value: 'text/xml' });
          expect(result.body.options.raw.language).to.equal('xml');
          done();
        });

        it(' text/plain', function(done) {
          let requestBody = {
              description: 'body description',
              content: {
                'text/plain': {
                  example: 'text/plain description'
                }
              }
            },
            result, resultBody;
          result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
            exampleParametersResolution: 'example'
          });
          resultBody = result.body.raw;
          expect(resultBody)
            .to.equal('text/plain description');
          expect(result.contentHeader).to.deep.include(
            { key: 'Content-Type', value: 'text/plain' });
          done();
        });

        it(' text/html', function(done) {
          var requestBody = {
              description: 'body description',
              content: {
                'text/html': {
                  example: '<html><body><ul><li>item 1</li><li>item 2</li></ul></body></html>'
                }
              }
            },
            result, resultBody;
          result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
            exampleParametersResolution: 'example'
          });
          resultBody = (result.body.raw);
          expect(resultBody).to.equal('<html><body><ul><li>item 1</li><li>item 2</li></ul></body></html>');
          expect(result.contentHeader).to.deep.include(
            { key: 'Content-Type', value: 'text/html' });
          done();
        });

        it(' application/javascript', function(done) { // not properly done
          var requestBody = {
              description: 'body description',
              content: {
                'application/javascript': {
                }
              }
            },
            result, resultBody;
          result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
            exampleParametersResolution: 'example'
          });
          resultBody = (result.body.raw);
          expect(typeof resultBody).to.equal('string');
          expect(result.contentHeader).to.deep.include(
            { key: 'Content-Type', value: 'application/javascript' });
          done();
        });
      });

      it(' application/json', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'application/json': {
                'schema': {
                  type: 'object',
                  required: [
                    'id',
                    'name'
                  ],
                  properties: {
                    id: {
                      type: 'integer',
                      format: 'int64'
                    },
                    name: {
                      type: 'string'
                    },
                    neglect: { // this will be neglected since schemaFaker does not process
                      type: 'string',
                      format: 'binary'
                    }
                  }
                }
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'schema',
          schemaFaker: true
        });
        resultBody = JSON.parse(result.body.raw);
        expect(resultBody.id).to.equal('<long>');
        expect(resultBody.name).to.equal('<string>');
        expect(result.contentHeader).to.deep.include({ key: 'Content-Type', value: 'application/json' });
        expect(result.body.options.raw.language).to.equal('json');
        done();
      });
      it(' application/x-www-form-urlencoded', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'application/x-www-form-urlencoded': {
                examples: ''
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'example'
        });
        resultBody = (result.body.urlencoded.toJSON());
        expect(resultBody).to.eql([]);
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
        done();
      });
      it(' multipart/form-data', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    array: {
                      type: 'array',
                      items: {
                        type: 'string'
                      }
                    },
                    file: {
                      type: 'string',
                      format: 'binary'
                    }
                  },
                  required: ['array']
                },
                encoding: {
                  file: {
                    contentType: 'application/binary'
                  }
                }
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'example',
          schemaFaker: true
        });
        resultBody = (result.body.formdata.toJSON());
        expect(resultBody[0].key).to.equal('array');
        expect(resultBody[1].key).to.equal('file');
        expect(resultBody[1].type).to.equal('file');
        expect(resultBody[1].contentType).to.equal('application/binary');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'multipart/form-data' });
        done();
      });
      it(' text/xml', function(done) { // not properly done
        var requestBody = {
            description: 'body description',
            content: {
              'text/xml': {
                schema: {
                  type: 'string',
                  xml: {
                    name: 'AnXMLObject'
                  }
                },
                examples: {
                  xml: {
                    summary: 'A list containing two items',
                    value: 'test'
                  }
                }
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          requestParametersResolution: 'example',
          exampleParametersResolution: 'example'
        });
        resultBody = (result.body.raw);
        expect(resultBody).to.equal(
          '<?xml version="1.0" encoding="UTF-8"?>\n<AnXMLObject>test</AnXMLObject>'
        );
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'text/xml' });
        expect(result.body.options.raw.language).to.equal('xml');
        done();
      });
      it(' text/plain', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'text/plain': {
                example: 'text/plain description'
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'example'
        });
        resultBody = result.body.raw;
        expect(resultBody).to.equal('text/plain description');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'text/plain' });
        done();
      });
      it(' text/html', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'text/html': {
                example: '<html><body><ul><li>item 1</li><li>item 2</li></ul></body></html>'
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'example'
        });
        resultBody = (result.body.raw);
        expect(resultBody).to.equal('<html><body><ul><li>item 1</li><li>item 2</li></ul></body></html>');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'text/html' });
        done();
      });
      it(' application/javascript', function(done) { // not properly done
        var requestBody = {
            description: 'body description',
            content: {
              'application/javascript': {
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'example'
        });
        resultBody = (result.body.raw);
        expect(typeof resultBody).to.equal('string');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'application/javascript' });
        done();
      });
      it(' image/*', function (done) {
        var requestBody = {
            description: 'body description',
            content: {
              'image/*': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          },
          result;

        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'example'
        });
        expect(result.body.mode).to.equal('file');
        done();
      });
      it(' application/vnd.api+json (headers with different structure but still of JSON type/family)', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'application/vnd.api+json': {
                'schema': {
                  type: 'object',
                  required: [
                    'id',
                    'name'
                  ],
                  properties: {
                    id: {
                      type: 'integer',
                      format: 'int64'
                    },
                    name: {
                      type: 'string'
                    },
                    neglect: { // this will be neglected since schemaFaker does not process
                      type: 'string',
                      format: 'binary'
                    }
                  }
                }
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          exampleParametersResolution: 'schema',
          schemaFaker: true
        });
        resultBody = JSON.parse(result.body.raw);
        expect(resultBody.id).to.equal('<long>');
        expect(resultBody.name).to.equal('<string>');
        expect(result.contentHeader).to.deep.include({ key: 'Content-Type', value: 'application/vnd.api+json' });
        expect(result.body.options.raw.language).to.equal('json');
        done();
      });
      it(' application/vnd.api+xml (headers with different structure but still of XML type/family)', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'application/vnd.api+xml': {
                schema: {
                  type: 'string',
                  xml: {
                    name: 'AnXMLObject'
                  }
                },
                examples: {
                  xml: {
                    summary: 'A list containing two items',
                    value: 'test'
                  }
                }
              }
            }
          },
          result, resultBody;
        result = SchemaUtils.convertToPmBody(requestBody, 'EXAMPLE', {}, {
          requestParametersResolution: 'example',
          exampleParametersResolution: 'example'
        });
        resultBody = (result.body.raw);
        expect(resultBody).to.equal(
          '<?xml version="1.0" encoding="UTF-8"?>\n<AnXMLObject>test</AnXMLObject>'
        );
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'application/vnd.api+xml' });
        expect(result.body.options.raw.language).to.equal('xml');
        done();
      });
      // things remaining : application/xml
    });
  });

  describe('convertToPmResponseBody function', function() {
    describe('should convert content object to response body data', function() {
      it('with undefined ContentObj', function() {
        var contentObj,
          pmResponseBody;
        pmResponseBody = SchemaUtils.convertToPmResponseBody(contentObj).responseBody;
        expect(pmResponseBody).to.equal('');
      });
      it('with Content-Type application/json', function() {
        var contentObj = {
            'application/json': {
              'schema': {
                'type': 'object',
                'required': [
                  'id',
                  'name'
                ],
                'properties': {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  },
                  name: {
                    type: 'string'
                  }
                }
              }
            }
          },
          pmResponseBody;
        pmResponseBody = JSON.parse(SchemaUtils.convertToPmResponseBody(contentObj, {},
          { schemaFaker: true }).responseBody);
        expect(pmResponseBody.id).to.equal('<long>');
        expect(pmResponseBody.name).to.equal('<string>');
      });
      it('with Content-Type application/vnd.retailer.v2+json', function() {
        var contentObj = {
            'application/vnd.retailer.v2+json': {
              'schema': {
                'type': 'object',
                'required': [
                  'id',
                  'name'
                ],
                'properties': {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  },
                  name: {
                    type: 'string'
                  }
                }
              }
            }
          },
          pmResponseBody;
        pmResponseBody = JSON.parse(SchemaUtils.convertToPmResponseBody(contentObj, {},
          { schemaFaker: true }).responseBody);
        expect(pmResponseBody.id).to.equal('<long>');
        expect(pmResponseBody.name).to.equal('<string>');
      });
      it('with Content-Type application/vnd.api+json', function() {
        var contentObj = {
            'application/vnd.api+json': {
              'schema': {
                'type': 'object',
                'required': [
                  'id',
                  'name'
                ],
                'properties': {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  },
                  name: {
                    type: 'string'
                  }
                }
              }
            }
          },
          pmResponseBody;
        pmResponseBody = JSON.parse(SchemaUtils.convertToPmResponseBody(contentObj, {},
          { schemaFaker: true }).responseBody);
        expect(pmResponseBody.id).to.equal('<long>');
        expect(pmResponseBody.name).to.equal('<string>');
      });
      it('with Content-Type application/json and specified indentCharacter', function() {
        var contentObj = {
            'application/json': {
              'schema': {
                'type': 'object',
                'properties': {
                  id: {
                    type: 'integer'
                  }
                }
              }
            }
          },
          pmResponseBody;
        pmResponseBody = SchemaUtils.convertToPmResponseBody(contentObj, {}, {
          indentCharacter: '\t',
          schemaFaker: true
        }).responseBody;
        expect(pmResponseBody).to.equal('{\n\t"id": "<integer>"\n}');
      });
      it('with Content-Type text/plain', function() {
        var contentObj = {
            'text/plain': {
              'schema': {
                'type': 'string'
              }
            }
          },
          pmResponseBody;
        pmResponseBody = SchemaUtils.convertToPmResponseBody(contentObj, {},
          { schemaFaker: true }).responseBody;
        expect(typeof pmResponseBody).to.equal('string');
      });
      it('with Content-Type application/xml', function() {
        var contentObj = {
            'application/xml': {
              'schema': {
                'type': 'object',
                'properties': {
                  'id': { 'type': 'integer', 'format': 'int32', 'xml': { 'attribute': true } },
                  'name': {
                    'type': 'string',
                    'xml': { 'namespace': 'http://example.com/schema/sample', 'prefix': 'sample' }
                  },
                  'hobbies': {
                    'type': 'array', 'items': { 'type': 'string' }, 'xml': { 'wrapped': true }
                  },
                  'pets': {
                    'type': 'array', 'items': { 'type': 'string' }
                  }
                },
                'xml': { 'name': 'Person' }
              }
            }
          },
          pmResponseBody;
        pmResponseBody = SchemaUtils.convertToPmResponseBody(contentObj, {}, {
          indentCharacter: ' ',
          schemaFaker: true
        }).responseBody;
        expect(pmResponseBody).to.equal(
          [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<Person id="(integer)">',
            ' <sample:name xmlns:sample="http://example.com/schema/sample">(string)</sample:name>',
            ' <hobbies>',
            '  <hobbies>(string)</hobbies>',
            '  <hobbies>(string)</hobbies>',
            ' </hobbies>',
            ' <pets>(string)</pets>',
            ' <pets>(string)</pets>',
            '</Person>'
          ].join('\n'));
      });
      it('with Content-Type application/javascript', function() {
        var contentObj = {
            'application/javascript': {
            }
          },
          pmResponseBody;
        pmResponseBody = SchemaUtils.convertToPmResponseBody(contentObj, {},
          { schemaFaker: true }).responseBody;
        expect(typeof pmResponseBody).to.equal('string');
      });
      it('with Content-Type unsupported', function() {
        var contentObj = {
            'application/vnd.api+json+unsupported': {
              'schema': {
                'type': 'object',
                'required': [
                  'id',
                  'name'
                ],
                'properties': {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  },
                  name: {
                    type: 'string'
                  }
                }
              }
            }
          },
          pmResponseBody;
        pmResponseBody = SchemaUtils.convertToPmResponseBody(contentObj, {},
          { schemaFaker: true }).responseBody;
        expect(pmResponseBody).to.equal('');
      });
      // things remaining application/xml, application/javascript
    });
  });

  describe('convertToPmResponse function', function() {
    it('should convert response with JSON content field', function(done) {
      var response = {
          'description': 'A list of pets.',
          'content': {
            'application/json': {
              'schema': {
                'type': 'object',
                'required': [
                  'id',
                  'name'
                ],
                'properties': {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  },
                  name: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        code = '20X',
        pmResponse, responseBody;

      pmResponse = SchemaUtils.convertToPmResponse(response, code, {}, {},
        { schemaFaker: true }).toJSON();
      responseBody = JSON.parse(pmResponse.body);
      expect(pmResponse.name).to.equal(response.description);
      expect(pmResponse.code).to.equal(200);
      expect(pmResponse._postman_previewlanguage).to.equal('json');
      expect(pmResponse.header).to.deep.include({
        'key': 'Content-Type',
        'value': 'application/json'
      });
      expect(responseBody.id).to.equal('<long>');
      expect(responseBody.name).to.equal('<string>');
      done();
    });
    it('should convert response with XML content field', function(done) {
      var response = {
          'description': 'A list of pets.',
          'content': {
            'application/xml': {
              'schema': {
                'type': 'object',
                'required': [
                  'id',
                  'name'
                ],
                'properties': {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  },
                  name: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        code = '20X',
        pmResponse;

      pmResponse = SchemaUtils.convertToPmResponse(response, code, {}, {},
        { schemaFaker: true, indentCharacter: '  ' }).toJSON();
      expect(pmResponse.body).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<element>\n  <id>(integer)</id>\n  <name>(string)</name>\n</element>');
      expect(pmResponse.name).to.equal(response.description);
      expect(pmResponse.code).to.equal(200);
      expect(pmResponse._postman_previewlanguage).to.equal('xml');
      expect(pmResponse.header).to.deep.include({
        'key': 'Content-Type',
        'value': 'application/xml'
      });
      done();
    });
    it('should convert response without content field', function(done) {
      var response = {
          'description': 'A list of pets.'
        },
        code = '201',
        pmResponse;

      pmResponse = SchemaUtils.convertToPmResponse(response, code, {}, {},
        { schemaFaker: true }).toJSON();
      expect(pmResponse.name).to.equal(response.description);
      expect(pmResponse.code).to.equal(201);
      expect(pmResponse.body).to.equal('');
      expect(pmResponse.header).to.deep.include({
        'key': 'Content-Type',
        'value': 'text/plain'
      });
      done();
    });
    it('should convert headers with refs', function(done) {
      var response = {
          'description': '`Too Many Requests`\\n',
          'headers': {
            'Retry-After': {
              '$ref': '#/components/responses/InternalError/headers/Retry-After'
            }
          }
        },
        code = '200',
        pmResponse = SchemaUtils.convertToPmResponse(response, code, null, {
          components: {
            'responses': {
              'TooManyRequests': {
                'description': '`Too Many Requests`\n',
                'headers': {
                  'Retry-After': {
                    '$ref': '#/components/responses/InternalError/headers/Retry-After'
                  }
                }
              },
              'InternalError': {
                'description': '`Internal Error`\n',
                'headers': {
                  'Retry-After': {
                    'description': 'Some description',
                    'schema': {
                      'oneOf': [
                        {
                          'type': 'string',
                          'description': 'A date'
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        }, { schemaFaker: true });

      expect(pmResponse.headers.members[0].key).to.equal('Retry-After');
      expect(pmResponse.headers.members[0].description).to.equal('Some description');
      done();
    });
    it('should return proper path variables in the SDK response original request', function (done) {
      const response = {
          'description': 'The required organization detail',
          'content': {
            'application/json': {
              'schema': { '$ref': '#/components/schemas/Organization' }
            }
          }
        },
        originalRequest = {
          'method': 'GET',
          'url': {
            'path': [
              'organization',
              ':organizationID'
            ],
            'host': [
              '{{baseUrl}}'
            ],
            'query': [],
            'variable': [
              {
                'description': ' (This can only be one of 15500)',
                'type': 'any',
                'value': '{{port}}',
                'key': 'port'
              },
              {
                'description': ' (This can only be one of v1)',
                'type': 'any',
                'value': '{{version}}',
                'key': 'version'
              },
              {
                'disabled': false,
                'type': 'any',
                'value': '8888',
                'key': 'organizationID',
                'description': '(Required) The id of the organization'
              }
            ]
          },
          'header': [
            {
              'disabled': false,
              'key': 'Content-Type',
              'value': 'application/json',
              'description': ''
            }
          ],
          'body': {}
        },
        components = {
          'components': {
            'schemas': {
              'Organization': {
                'type': 'object',
                'required': [
                  'id',
                  'name',
                  'businessName'
                ],
                'properties': {
                  'id': {
                    'type': 'integer',
                    'format': 'uint32',
                    'example': 1
                  },
                  'name': {
                    'type': 'string',
                    'example': 'My Company'
                  },
                  'businessName': {
                    'type': 'string',
                    'example': 'My Super Company'
                  },
                  'address': {
                    'type': 'object',
                    '$ref': '#/components/schemas/Address'
                  }
                }
              },
              'Address': {
                'type': 'object',
                'properties': {
                  'line1': {
                    'type': 'string',
                    'example': 'Avenida da República'
                  },
                  'line2': {
                    'type': 'string',
                    'example': 'Nº 458, 2ºEsq'
                  },
                  'city': {
                    'type': 'string',
                    'example': 'Lisboa'
                  },
                  'state': {
                    'type': 'string',
                    'example': 'Lisboa'
                  },
                  'postalCode': {
                    'type': 'string',
                    'example': '1000-427'
                  },
                  'countryCode': {
                    'type': 'integer',
                    'format': 'int64',
                    'example': 620
                  }
                }
              }
            },
            'parameters': {
              'contentType': {
                'name': 'Content-Type',
                'in': 'header',
                'schema': {
                  'type': 'string',
                  'example': 'application/json'
                }
              },
              'organizationID': {
                'name': 'organizationID',
                'in': 'path',
                'description': 'The id of the organization',
                'required': true,
                'example': 8888,
                'schema': {
                  'type': 'integer',
                  'example': 8888
                }
              }
            }
          },
          'paths': {
            '/organization/{organizationID}': {
              'get': {
                'summary': 'Get Organization by ID',
                'operationId': 'getOrganizationByID',
                'tags': [
                  'Organization Endpoints'
                ],
                'parameters': [
                  {
                    'name': 'Content-Type',
                    'in': 'header',
                    'schema': {
                      'type': 'string',
                      'example': 'application/json'
                    }
                  },
                  {
                    'name': 'organizationID',
                    'in': 'path',
                    'description': 'The id of the organization',
                    'required': true,
                    'example': 8888,
                    'schema': {
                      'type': 'integer',
                      'example': 8888
                    }
                  }
                ],
                'responses': {
                  '200': {
                    'description': 'The required organization detail',
                    'content': {
                      'application/json': {
                        'schema': {
                          '$ref': '#/components/schemas/Organization'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        pmResponse = SchemaUtils.convertToPmResponse(response, '200', originalRequest, components,
          { schemaFaker: true }).toJSON(),
        pathVariables = _.get(pmResponse, 'originalRequest.url.variable');

      expect(pathVariables.length).to.eql(3);
      expect(pathVariables).to.eql([
        {
          description: {
            content: ' (This can only be one of 15500)',
            type: 'text/plain'
          },
          key: 'port',
          type: 'any',
          value: '{{port}}'
        },
        {
          description: {
            content: ' (This can only be one of v1)',
            type: 'text/plain'
          },
          key: 'version',
          type: 'any',
          value: '{{version}}'
        },
        {
          description: {
            content: '(Required) The id of the organization',
            type: 'text/plain'
          },
          disabled: false,
          key: 'organizationID',
          type: 'any',
          value: '8888'
        }
      ]);

      return done();
    });
  });

  describe('fixPathVariablesInUrl function', function() {
    it('should be able to handle incorrect urls', function(done) {
      expect(SchemaUtils.fixPathVariablesInUrl({})).to.equal('');
      expect(SchemaUtils.fixPathVariablesInUrl(null)).to.equal('');
      expect(SchemaUtils.fixPathVariablesInUrl(undefined)).to.equal('');
      done();
    });

    it('should convert a url with scheme and path variables', function(done) {
      var convertedUrl = SchemaUtils.fixPathVariablesInUrl('{scheme}://developer.uspto.gov/{path0}/segment/{path1}');
      expect(convertedUrl).to.equal('{{scheme}}://developer.uspto.gov/{{path0}}/segment/{{path1}}');

      expect(SchemaUtils.fixPathVariablesInUrl('{{a}}')).to.equal('{{a}}');

      expect(SchemaUtils.fixPathVariablesInUrl('/agents/{agentId}}')).to.equal('/agents/{{agentId}}}');

      expect(SchemaUtils.fixPathVariablesInUrl('{{a}}://{b}.com/{pathvar}/{morevar}'))
        .to.equal('{{a}}://{{b}}.com/{{pathvar}}/{{morevar}}');

      expect(SchemaUtils.fixPathVariablesInUrl('{protocol}://{host}:{port}/{contextpath}/{restapi}'))
        .to.equal('{{protocol}}://{{host}}:{{port}}/{{contextpath}}/{{restapi}}');

      done();
    });

    it('should correctly handle non string values', function(done) {
      expect(SchemaUtils.fixPathVariablesInUrl(123)).to.equal('');

      expect(SchemaUtils.fixPathVariablesInUrl([])).to.equal('');

      expect(SchemaUtils.fixPathVariablesInUrl({})).to.equal('');

      expect(SchemaUtils.fixPathVariablesInUrl(true)).to.equal('');

      done();
    });
  });

  describe('findPathVariablesFromPath function', function() {
    it('should convert a url with scheme and path variables', function(done) {
      var pathVars = SchemaUtils.findPathVariablesFromPath('/some/{{path}}');
      expect(pathVars[0]).to.equal('/{{path}}');

      pathVars = SchemaUtils.findPathVariablesFromPath('/next/{{path}}/{{new-path-variable}}');
      expect(pathVars[0]).to.equal('/{{path}}');
      expect(pathVars[1]).to.equal('/{{new-path-variable}}');

      pathVars = SchemaUtils.findPathVariablesFromPath('/anotherpath/{{path}}/{{new-path-variable}}.{{onemore}');
      expect(pathVars[0]).to.equal('/{{path}}');

      pathVars = SchemaUtils.findPathVariablesFromPath('/send-sms.{{format}}');
      expect(pathVars).to.equal(null);
      done();
    });
  });

  describe('findCollectionVariablesFromPath function', function() {
    it('should convert a url with scheme and path variables', function(done) {

      var collVars = SchemaUtils.findCollectionVariablesFromPath('/send-sms.{{format}}');
      expect(collVars[0]).to.equal('{{format}}');

      collVars = SchemaUtils.findCollectionVariablesFromPath('/next/:path/:new-path-variable');
      expect(collVars).to.equal(null);

      collVars = SchemaUtils.findCollectionVariablesFromPath('/anotherpath/:path/{{new-path-variable}}.{{onemore}}');
      expect(collVars[0]).to.equal('{{new-path-variable}}');
      expect(collVars[1]).to.equal('{{onemore}}');

      done();
    });
  });

  describe('sanitize function', function() {
    it('should convert a url with scheme and path variables', function(done) {
      var pathParams = [{ name: 'path',
          in: 'path',
          description: 'description',
          required: true,
          schema: { type: 'string', pattern: 'json|xml', example: 'json' } },
        { name: 'new-path-variable',
          in: 'path',
          description: 'description',
          required: true,
          schema: { type: 'string', pattern: 'json|xml', example: 'json' } },
        { name: 'onemore',
          in: 'path',
          description: 'description',
          required: true,
          schema: { type: 'string', pattern: 'json|xml', example: 'json' } }],
        resultObj = SchemaUtils.sanitizeUrlPathParams('/anotherpath/{{path}}/{{new-path-variable}}.{{onemore}}',
          pathParams);

      expect(resultObj).to.have.property('url');
      expect(resultObj.url).to.equal('/anotherpath/:path/{{new-path-variable}}.{{onemore}}');
      expect(resultObj).to.have.property('pathVars');
      expect(resultObj).to.have.property('collectionVars');

      done();
    });
  });

  describe('deserialiseParamValue function', function() {
    // As for style=form/deepObject and explode=true, value is split across different key-value pairs in query params
    // avoiding them in testing (for this values deserialiseParamValue() will not be called)
    var allUniqueParams = [
      { style: 'matrix', in: 'path', explode: false },
      { style: 'matrix', in: 'path', explode: true },
      { style: 'label', in: 'path', explode: false },
      { style: 'label', in: 'path', explode: true },
      { style: 'form', in: 'query', explode: false },
      // { style: 'form', in: 'query', explode: true },
      { style: 'simple', in: 'header', explode: false },
      { style: 'simple', in: 'header', explode: true },
      { style: 'spaceDelimited', in: 'query', explode: false },
      { style: 'pipeDelimited', in: 'query', explode: false }
      // { style: 'deepObject', in: 'query', explode: true }
    ];

    // assign common values to all params
    _.forEach(allUniqueParams, (param) => {
      param.name = 'color';
      param.required = true;
    });

    it('should work for primitive type params', function() {
      var paramValues = [ // explode doesn't matter for primitive values
          ';color=blue', ';color=blue',
          '.blue', '.blue',
          'blue', 'blue'
        ],
        deserialisedParamValue = 'blue';

      // First 5 combinations in allUniqueParams are allowed as per OpenAPI specifications for primitive data type
      _.forEach(allUniqueParams.slice(0, 5), (param, index) => {
        let retVal = SchemaUtils.deserialiseParamValue(param, paramValues[index], 'REQUEST', {}, {});
        expect(retVal).to.eql(deserialisedParamValue);
      });
    });

    it('should work for different styles of arrays', function() {
      var paramValues = [
          ';color=blue,black,brown',
          ';color=blue;color=black;color=brown',
          '.blue.black.brown',
          '.blue.black.brown',
          'blue,black,brown',
          'blue,black,brown',
          'blue,black,brown',
          'blue black brown',
          'blue|black|brown'
        ],
        deserialisedParamValue = ['blue', 'black', 'brown'];

      // assign schema values to all params
      _.forEach(allUniqueParams, (param) => {
        param.schema = {
          type: 'array',
          items: { type: 'integer' }
        };
      });

      // All combinations in allUniqueParams are allowed as per OpenAPI specifications for array data type
      _.forEach(allUniqueParams, (param, index) => {
        let retVal = SchemaUtils.deserialiseParamValue(param, paramValues[index], 'REQUEST', {}, {});
        expect(retVal).to.eql(deserialisedParamValue);
      });
    });

    it('should work for different styles of objects', function() {
      var paramValues = [
          ';color=R,100,G,200,B,150',
          ';R=100;G=200;B=150',
          '.R.100.G.200.B.150',
          '.R=100.G=200.B=150',
          'R,100,G,200,B,150',
          'R,100,G,200,B,150',
          'R=100,G=200,B=150',
          'R 100 G 200 B 150',
          'R|100|G|200|B|150'
        ],
        deserialisedParamValue = { 'R': 100, 'G': 200, 'B': 150 };

      // assign schema values to all params
      _.forEach(allUniqueParams, (param) => {
        param.schema = {
          type: 'object',
          properties: {
            R: { type: 'integer' },
            G: { type: 'integer' },
            B: { type: 'integer' }
          }
        };
      });

      // All combinations in allUniqueParams are allowed as per OpenAPI specifications for object data type
      _.forEach(allUniqueParams, (param, index) => {
        let retVal = SchemaUtils.deserialiseParamValue(param, paramValues[index], 'REQUEST', {}, {});
        expect(retVal).to.eql(deserialisedParamValue);
      });
    });

    it('should not override original parameter schema after execution', function () {
      let param = {
        name: 'id',
        in: 'query',
        description: 'ID of the object to fetch',
        required: false,
        schema: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        style: 'form',
        explode: true
      };

      SchemaUtils.deserialiseParamValue(param, 'id=id1&id=id2', 'REQUEST', {}, {});
      expect(param.schema).to.have.property('type', 'array');
      expect(param.schema.items).to.have.property('type', 'string');
      expect(param.schema).to.not.have.property('default');
    });
  });

  describe('getParamSerialisationInfo function', function () {
    it('should not override original parameter schema after execution', function () {
      let param = {
        name: 'id',
        in: 'query',
        description: 'ID of the object to fetch',
        required: false,
        schema: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        style: 'form',
        explode: true
      };

      SchemaUtils.getParamSerialisationInfo(param, 'REQUEST', {});
      expect(param.schema).to.have.property('type', 'array');
      expect(param.schema.items).to.have.property('type', 'string');
      expect(param.schema).to.not.have.property('default');
    });
  });

  describe('parseMediaType function', function () {
    it('should parse invalid media type with result containing empty strings', function () {
      let mediaTypeString = 'not-a-valida-mediatype',
        parsedMediaType = SchemaUtils.parseMediaType(mediaTypeString);

      expect(parsedMediaType.type).to.eql('');
      expect(parsedMediaType.subtype).to.eql('');
    });

    it('should correctly parse media type with optional parameter', function () {
      let mediaTypeString = 'application/json; charset=utf-8',
        parsedMediaType = SchemaUtils.parseMediaType(mediaTypeString);

      expect(parsedMediaType.type).to.eql('application');
      expect(parsedMediaType.subtype).to.eql('json');
    });

    it('should correctly parse media type with +format at the end of media type', function () {
      let mediaTypeString = 'application/github.vnd+json',
        parsedMediaType = SchemaUtils.parseMediaType(mediaTypeString);

      expect(parsedMediaType.type).to.eql('application');
      expect(parsedMediaType.subtype).to.eql('github.vnd+json');
    });
  });

  describe('getJsonContentType function', function () {
    it('should be able to get correct JSON media type that contains optional parameters', function () {
      let contentObj = {
          'application/json; charset=utf-8': {
            schema: { type: 'string' }
          },
          'application/xml': {
            schema: { type: 'integer' }
          }
        },
        jsonContentType = SchemaUtils.getJsonContentType(contentObj);

      expect(jsonContentType).to.eql('application/json; charset=utf-8');
    });

    it('should be able to get correct JSON media type with +format at the end of media type', function () {
      let contentObj = {
          'application/github.vnd+json': {
            schema: { type: 'string' }
          },
          'application/xml': {
            schema: { type: 'integer' }
          }
        },
        jsonContentType = SchemaUtils.getJsonContentType(contentObj);

      expect(jsonContentType).to.eql('application/github.vnd+json');
    });

    it('should correctly handle content object with no json media type', function () {
      let contentObj = {
          'application/javascript': {
            schema: { type: 'string' }
          },
          'application/xml': {
            schema: { type: 'integer' }
          }
        },
        jsonContentType = SchemaUtils.getJsonContentType(contentObj);

      expect(jsonContentType).to.be.undefined;
    });
  });

  describe('getResponseAuthHelper function', function () {
    var authTypes = {
      'basic': 'Basic <credentials>',
      'bearer': 'Bearer <token>',
      'digest': 'Digest <credentials>',
      'oauth1': 'OAuth <credentials>',
      'oauth2': '<token>'
    };

    it('should correctly generate params needed for securityScheme: apikey', function () {
      let apiKeyHeaderHelper = SchemaUtils.getResponseAuthHelper({
          type: 'apikey',
          apikey: [{ key: 'in', value: 'header' }, { key: 'key', value: 'api-key-header' }]
        }),
        apiKeyQueryHelper = SchemaUtils.getResponseAuthHelper({
          type: 'apikey',
          apikey: [{ key: 'in', value: 'query' }, { key: 'key', value: 'api-key-query' }]
        });

      expect(apiKeyHeaderHelper.header).to.have.lengthOf(1);
      expect(apiKeyHeaderHelper.query).to.have.lengthOf(0);
      expect(apiKeyHeaderHelper.header[0].key).to.eql('api-key-header');

      expect(apiKeyQueryHelper.query).to.have.lengthOf(1);
      expect(apiKeyQueryHelper.header).to.have.lengthOf(0);
      expect(apiKeyQueryHelper.query[0].key).to.eql('api-key-query');
    });

    _.forEach(authTypes, (authHeaderValue, authType) => {
      it('should correctly generate params needed for securityScheme: ' + authType, function () {
        let authHelper = SchemaUtils.getResponseAuthHelper({
          type: authType
        });

        expect(authHelper.header).to.have.lengthOf(1);
        expect(authHelper.query).to.have.lengthOf(0);
        expect(authHelper.header[0].key).to.eql('Authorization');
        expect(authHelper.header[0].value).to.eql(authHeaderValue);
      });
    });
  });
});

describe('Get header family function ', function() {
  it('should check for custom type JSON header', function() {
    let result = SchemaUtils.getHeaderFamily('application/vnd.retailer+json');
    expect(result).to.equal('json');
  });

  it('should check for custom type xml header', function() {
    let result = SchemaUtils.getHeaderFamily('application/vnd.retailer+xml');
    expect(result).to.equal('xml');
  });
});

describe('ResolveToExampleOrSchema function', function() {
  it('Should return schema if the request type is root and option is set to schema', function() {
    let result = SchemaUtils.resolveToExampleOrSchema('ROOT', 'schema', 'example');
    expect(result).to.equal('schema');
  });
  it('Should return example if the request type is root and option is set to example', function() {
    let result = SchemaUtils.resolveToExampleOrSchema('ROOT', 'example', 'example');
    expect(result).to.equal('example');
  });
  it('Should return example if the request type is example and option is set to example', function() {
    let result = SchemaUtils.resolveToExampleOrSchema('EXAMPLE', 'example', 'example');
    expect(result).to.equal('example');
  });
  it('Should return schema if the request type is example and option is set to schema', function() {
    let result = SchemaUtils.resolveToExampleOrSchema('EXAMPLE', 'example', 'schema');
    expect(result).to.equal('schema');
  });
});

describe('convertToPmQueryArray function', function() {
  it('Should creates an array having all the query params', function() {
    let queryObject = { query:
      [{ name: 'variable2',
        in: 'query',
        description: 'another random variable',
        style: 'spaceDelimited',
        schema: { type: 'array',
          items: {
            type: 'integer',
            format: 'int64',
            example: 123
          } } },
      { name: 'variable3',
        in: 'query',
        description: 'another random variable',
        style: 'spaceDelimited',
        schema: { type: 'array',
          items: {
            type: 'integer',
            format: 'int64',
            example: 456
          } } }] },
      requestType = 'EXAMPLE',
      result;
    result = SchemaUtils.convertToPmQueryArray(queryObject, requestType, null, {
      schemaFaker: true,
      exampleParametersResolution: 'example',
      requestParametersResolution: 'schema'
    });
    expect(result[0]).to.equal('variable2=123%20123');
    expect(result[1]).to.equal('variable3=456%20456');
  });
});

describe('getPostmanUrlSchemaMatchScore function', function() {
  it('Should correctly match root level path with matching request endpoint', function () {
    let schemaPath = '/',
      pmPath = '/',
      endpointMatchScore = SchemaUtils.getPostmanUrlSchemaMatchScore(schemaPath, pmPath, {});

    // root level paths should match with max score
    expect(endpointMatchScore.match).to.eql(true);
    expect(endpointMatchScore.score).to.eql(1);
  });

  it('Should correctly match path with fixed and variable path segment to matching request endpoint', function () {
    let schemaPath = '/user/send-sms.{format}',
      pmPath = '/user/send-sms.{{format}}',
      endpointMatchScore = SchemaUtils.getPostmanUrlSchemaMatchScore(pmPath, schemaPath, {});

    // both paths should match with max score
    expect(endpointMatchScore.match).to.eql(true);
    expect(endpointMatchScore.score).to.eql(1);
    // no path var should be identified as format will be stored as collection variable
    expect(endpointMatchScore.pathVars).to.have.lengthOf(0);

    schemaPath = '/spaces/{spaceId}/{path}_{pathSuffix}';
    pmPath = '/spaces/:spaceId/{{path}}_{{pathSuffix}}';
    endpointMatchScore = SchemaUtils.getPostmanUrlSchemaMatchScore(pmPath, schemaPath, {});

    // both paths should match with max score
    expect(endpointMatchScore.match).to.eql(true);
    expect(endpointMatchScore.score).to.eql(1);
    // only one path var (spaceId) should be identified as others will be stored as collection variable
    expect(endpointMatchScore.pathVars).to.have.lengthOf(1);
    expect(endpointMatchScore.pathVars[0]).to.eql({ key: 'spaceId', value: ':spaceId' });
  });
});

describe('findCommonSubpath method', function () {
  it('should return aabb with input ["aa/bb/cc/dd", "aa/bb"]', function () {
    const result = Utils.findCommonSubpath(['aa/bb/cc/dd', 'aa/bb']);
    expect(result).to.equal('aa/bb');
  });

  it('should return empty string with undefined input', function () {
    const result = Utils.findCommonSubpath();
    expect(result).to.equal('');
  });

  it('should return empty string with empty array input', function () {
    const result = Utils.findCommonSubpath([]);
    expect(result).to.equal('');
  });

  it('should return aabb with input ["aa/bb/cc/dd", "aa/bb", undefined]', function () {
    const result = Utils.findCommonSubpath(['aa/bb/cc/dd', 'aa/bb', undefined]);
    expect(result).to.equal('aa/bb');
  });

  it('should return "" with input ["aabbccdd", "aabb", "ccddee"]', function () {
    const result = Utils.findCommonSubpath(['aa/bb/cc/dd', 'aa/bb', 'ccddee']);
    expect(result).to.equal('');
  });

});

describe('getAuthHelper method - OAuth2 Flows', function() {
  it('Should parse OAuth2 configuration to collection (Single Flow) - Type 1', function() {
    const openAPISpec = {
        'components': {
          'responses': {},
          'schemas': {},
          'securitySchemes': {
            'oauth2': {
              'flows': {
                'clientCredentials': {
                  'scopes': {},
                  'tokenUrl': 'https://example.com/oauth2/token'
                }
              },
              'type': 'oauth2'
            }
          }
        },
        'info': {
          'title': 'API',
          'version': '0.2'
        },
        'openapi': '3.0.0',
        'paths': {},
        'security': [
          {
            'oauth2': []
          }
        ],
        'servers': [
          {
            'url': 'https://example.com',
            'variables': {}
          }
        ],
        'tags': [],
        'securityDefs': {
          'oauth2': {
            'flows': {
              'clientCredentials': {
                'scopes': {},
                'tokenUrl': 'https://example.com/oauth2/token'
              }
            },
            'type': 'oauth2'
          }
        },
        'baseUrl': 'https://example.com',
        'baseUrlVariables': {}
      },
      securitySet = [{ oauth2: [] }],
      helperData = SchemaUtils.getAuthHelper(openAPISpec, securitySet);

    expect(helperData.type).to.be.equal('oauth2');
    expect(helperData).to.have.property('oauth2').with.lengthOf(2);
    expect(helperData.oauth2[0]).to.be.an('object');
    expect(helperData).to.deep.equal({
      type: 'oauth2',
      oauth2: [
        {
          key: 'accessTokenUrl',
          value: 'https://example.com/oauth2/token'
        },
        { key: 'grant_type', value: 'client_credentials' }
      ]
    });
  });

  it('Should parse OAuth2 configuration to collection (Multiple Flow types)- Type 2', function() {
    const openAPISpec = {
        components: {
          responses: {},
          schemas: {},
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'https://example.com/api/oauth/dialog',
                  scopes: {
                    'write:pets': 'modify pets in your account',
                    'read:pets': 'read your pets'
                  }
                },
                authorizationCode: {
                  authorizationUrl: 'https://example.com/api/oauth/dialog',
                  tokenUrl: 'https://example.com/api/oauth/token',
                  scopes: {
                    'write:pets': 'modify pets in your account',
                    'read:pets': 'read your pets'
                  }
                }
              }
            }
          }
        },
        info: { title: 'API', version: '0.2' },
        openapi: '3.0.0',
        paths: {},
        security: [{ oauth2: [] }],
        servers: [{ url: 'https://myserver.com', variables: {} }],
        tags: [],
        securityDefs: {
          oauth2: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://example.com/api/oauth/dialog',
                scopes: {
                  'write:pets': 'modify pets in your account',
                  'read:pets': 'read your pets'
                }
              },
              authorizationCode: {
                authorizationUrl: 'https://example.com/api/oauth/dialog',
                tokenUrl: 'https://example.com/api/oauth/token',
                scopes: {
                  'write:pets': 'modify pets in your account',
                  'read:pets': 'read your pets'
                }
              }
            }
          }
        },
        baseUrl: 'https://myserver.com',
        baseUrlVariables: {}
      },
      securitySet = [{ oauth2: [] }],
      helperData = SchemaUtils.getAuthHelper(openAPISpec, securitySet);

    expect(helperData.type).to.be.equal('oauth2');
    expect(helperData).to.have.property('oauth2').with.lengthOf(3);
    expect(helperData.oauth2[0]).to.be.an('object');
    expect(helperData).to.deep.equal({
      'type': 'oauth2',
      'oauth2': [
        {
          'key': 'scope',
          'value': 'write:pets read:pets'
        },
        {
          'key': 'authUrl',
          'value': 'https://example.com/api/oauth/dialog'
        },
        {
          'key': 'grant_type',
          'value': 'implicit'
        }
      ]
    });
  });

  it('Scopes are parsed as sequence of strings', function() {
    const openAPISpec = {
        components: {
          responses: {},
          schemas: {},
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'https://example.com/api/oauth/dialog',
                  scopes: {
                    'write:pets': 'modify pets in your account',
                    'read:pets': 'read your pets'
                  }
                }
              }
            }
          }
        },
        info: { title: 'API', version: '0.2' },
        openapi: '3.0.0',
        paths: {},
        security: [{ oauth2: [] }],
        servers: [{ url: 'https://myserver.com', variables: {} }],
        tags: [],
        securityDefs: {
          oauth2: {
            type: 'oauth2',
            flows: {
              implicit: {
                authorizationUrl: 'https://example.com/api/oauth/dialog',
                scopes: {
                  'write:pets': 'modify pets in your account',
                  'read:pets': 'read your pets'
                }
              }
            }
          }
        },
        baseUrl: 'https://myserver.com',
        baseUrlVariables: {}
      },
      securitySet = [{ oauth2: [] }],
      helperData = SchemaUtils.getAuthHelper(openAPISpec, securitySet);

    expect(helperData.type).to.be.equal('oauth2');
    expect(helperData).to.have.property('oauth2').with.lengthOf(3);
    expect(helperData.oauth2[0]).to.be.an('object');
    expect(helperData.oauth2[0].key).to.be.equal('scope');
    expect(helperData.oauth2[0].value).to.be.equal('write:pets read:pets');
  });
});

describe('getAuthHelper method - Multiple API keys', function() {
  it('Should include extra API keys if they are present and we ask for them', function() {
    const openAPISpec = {
        'securityDefs': {
          'EmptyAuth': {},
          'PostmanApiKeyAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'x-api-key',
            'description': 'Needs a valid and active user accessToken.'
          },
          'PostmanAccessTokenAuth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'x-access-token',
            'description': 'Needs a valid and active user accessToken.'
          },
          'ServiceBasicAuth': {
            'type': 'http',
            'scheme': 'basic',
            'description': 'Need basic-auth credential for a service'
          }
        }
      },
      securitySet = [{ PostmanAccessTokenAuth: [] }, { PostmanApiKeyAuth: [] }],
      helperData = SchemaUtils.getAuthHelper(openAPISpec, securitySet, true);

    expect(helperData.type).to.be.equal('apikey');
    expect(helperData).to.have.property('apikey').with.lengthOf(3);
    expect(helperData.apikey[0]).to.be.an('object');
    expect(helperData).to.deep.equal({
      'type': 'apikey',
      'apikey': [
        {
          'key': 'key',
          'value': 'x-access-token'
        },
        {
          'key': 'value',
          'value': '{{apiKey}}'
        },
        {
          'key': 'in',
          'value': 'header'
        }
      ],
      'extraAPIKeys': [
        {
          'type': 'apikey',
          'apikey': [
            {
              'key': 'key',
              'value': 'x-api-key'
            },
            {
              'key': 'value',
              'value': '{{apiKey}}'
            },
            {
              'key': 'in',
              'value': 'header'
            }
          ]
        }
      ]
    });

  });
});
