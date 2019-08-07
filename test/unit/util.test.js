var expect = require('chai').expect,
  _ = require('lodash'),
  Utils = require('../../lib/util.js'),
  openApiErr = require('../../lib/error.js');

/* Utility function Unit tests */
describe('UTILITY FUNCTION TESTS ', function () {
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
        };

      expect(Utils.safeSchemaFaker(schema, components)).to.equal('<string>');
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
        };

      expect(function() {
        Utils.safeSchemaFaker(schema, components);
      }).to.throw(openApiErr, 'Invalid schema reference: #/components/schem2');
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
        retVal = Utils.convertToPmCollectionVariables(serverVariables, null, null);
      expect(retVal).to.be.an('array');
      expect(retVal[0].id).to.equal('v1');
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
        retVal = Utils.convertToPmCollectionVariables(serverVariables, keyName, baseUrl);

      expect(retVal).to.be.an('array');

      expect(retVal[0].id).to.equal('v1');
      expect(retVal[0].value).to.equal('v2.0');
      expect(retVal[1].id).to.equal('baseUrl');
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
        retVal = Utils.getRequestParams(operationParams, pathParams);

      expect(retVal).to.be.an('array');
      expect(retVal.length).to.equal(2);
      expect(retVal[0].name).to.equal('limit');
      expect(retVal[0].description).to.equal('hello operation');
      expect(retVal[1].name).to.equal('variable');
      expect(retVal[1].description).to.equal('hello again');
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
        output = Utils.generateTrieFromPaths(openapi),
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
      expect(collectionVariables).to.have.key('petUrl');
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
        output = Utils.generateTrieFromPaths(openapi),
        root = output.tree.root;

      expect(root.children).to.be.an('object').that.has.all.keys('(root)');
      expect(root.children['(root)'].requestCount).to.equal(1);
      expect(root.children['(root)'].requests.length).to.equal(1);

      done();
    });
  });

  describe('convertPathVariables', function() {
    it('should convert method variables', function() {
      var retVal = Utils.convertPathVariables(
        'method',
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
      expect(retVal[0].value).to.equal('v6.0');
    });

    it('should convert root variables', function() {
      var retVal = Utils.convertPathVariables(
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
      Utils.options.schemaFaker = true;
      var retVal = Utils.convertPathVariables(
        'not-root-or-method',
        [],
        [
          {
            name: 'varName',
            description: 'varDesc',
            schema: {
              type: 'integer',
              format: 'int32'
            }
          }
        ]
      );
      expect(retVal).to.be.an('array');
      expect(retVal[0].key).to.equal('varName');
      expect(retVal[0].description).to.equal('varDesc');
      expect(retVal[0].value).to.equal('<integer>');
    });
  });

  describe('convertToPmBodyData', function() {
    it('should work for schemas', function() {
      Utils.options.schemaFaker = true;
      var bodyWithSchema = {
          schema: {
            type: 'integer',
            format: 'int32'
          }
        },
        retValSchema = Utils.convertToPmBodyData(bodyWithSchema, 'application/json');

      expect(retValSchema).to.be.equal('<integer>');
    });

    it('should work for example', function() {
      Utils.options.schemaFaker = true;
      var bodyWithExample = {
          example: {
            value: 'This is a sample value'
          }
        },
        retValExample = Utils.convertToPmBodyData(bodyWithExample, 'application/json');

      expect(retValExample).to.equal('This is a sample value');
    });

    it('should work for examples', function() {
      Utils.options.schemaFaker = true;
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
        retValExamples = Utils.convertToPmBodyData(bodyWithExamples, 'application/json');
      expect(retValExamples.foo).to.equal(1);
      expect(retValExamples.bar).to.equal(2);
    });

    it('should work for examples with a $ref for non-json requests', function() {
      Utils.options.schemaFaker = true;
      Utils.components = {
        'examples': {
          'SampleExample': {
            'summary': 'SampleExample',
            'description': 'Sample example',
            'value': 'Hello'
          }
        }
      };

      var bodyWithExamples = {
          'example': {
            '$ref': '#/components/examples/SampleExample/value'
          }
        },
        retValExample = Utils.convertToPmBodyData(bodyWithExamples, 'text/plain');
      expect(retValExample).to.equal('Hello');
    });

    it('should work for examples with a $ref for json requests', function() {
      Utils.options.schemaFaker = true;
      Utils.components = {
        'examples': {
          'SampleExample': {
            'summary': 'SampleExample',
            'description': 'Sample example',
            'value': '{"name": "Example"}'
          }
        }
      };

      var bodyWithExamples = {
          'example': {
            '$ref': '#/components/examples/SampleExample/value'
          }
        },
        retValExample = Utils.convertToPmBodyData(bodyWithExamples, 'application/json');
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
      Utils.options.schemaFaker = true;
      let pmHeader = Utils.convertToPmHeader(header);
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
      Utils.options.schemaFaker = true;
      let pmHeader = Utils.convertToPmHeader(header);
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
      Utils.options.schemaFaker = true;
      let pmHeader = Utils.convertToPmHeader(header);
      expect(pmHeader.key).to.equal('Authorization');
      expect(pmHeader.value).to.equal('Bearer'); // not \"Bearer\"
      done();
    });
  });

  describe('getRefObject', function() {
    it('Should convert schemas where compnents have refs to other components', function (done) {
      Utils.components = {
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
      };
      // deref compnents more than 2 levels deep
      var resolvedObject = Utils.getRefObject('#/components/responses/InternalError/headers/Retry-After');
      expect(resolvedObject.description).to.equal('Some description');
      expect(resolvedObject.schema.oneOf.length).to.equal(1);
      done();
    });

    it('Should convert schemas with references to paths (using ~1 and ~0)', function (done) {
      Utils.paths = {
        '/category': {
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
      };
      var resolvedObject = Utils.getRefObject('#/paths/~1category/get/parameters/0');
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
        retVal = Utils.convertParamsWithStyle(params, paramValue);

      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].description).to.equal(params.description);
      expect(retVal[0].key).to.equal(params.name);
      expect(retVal[0].value).to.equal(paramValue);
    });

    it('should work for different styles of arrays', function() {
      var paramsExplode = {
          explode: true,
          style: 'form',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramsSpace = {
          style: 'spaceDelimited',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramsPipe = {
          style: 'pipeDelimited',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramsDeep = {
          style: 'deepObject',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramsForm = {
          style: 'form',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'array'
          }
        },
        paramValue = ['1', '2'],
        retVal;

      retVal = Utils.convertParamsWithStyle(paramsExplode, paramValue);
      expect(retVal).be.an('array').with.length(2);
      expect(retVal[0].key).to.equal(paramsExplode.name);
      expect(retVal[0].value).to.equal(paramValue[0]);
      expect(retVal[1].key).to.equal(paramsExplode.name);
      expect(retVal[1].value).to.equal(paramValue[1]);


      retVal = Utils.convertParamsWithStyle(paramsSpace, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsSpace.name);
      expect(retVal[0].value).to.equal('1 2');

      retVal = Utils.convertParamsWithStyle(paramsPipe, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsPipe.name);
      expect(retVal[0].value).to.equal('1|2');

      retVal = Utils.convertParamsWithStyle(paramsDeep, paramValue);
      expect(retVal).be.an('array').with.length(2);
      expect(retVal[0].key).to.equal(paramsDeep.name + '[]');
      expect(retVal[0].value).to.equal('1');
      expect(retVal[1].key).to.equal(paramsDeep.name + '[]');
      expect(retVal[1].value).to.equal('2');

      retVal = Utils.convertParamsWithStyle(paramsForm, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsForm.name);
      expect(retVal[0].value).to.equal('1,2');
    });

    it('should work for different styles of objects', function() {
      var paramsSpace = {
          style: 'spaceDelimited',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'object'
          }
        },
        paramsPipe = {
          style: 'pipeDelimited',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'object'
          }
        },
        paramsDeep = {
          style: 'deepObject',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'object'
          }
        },
        paramsForm = {
          style: 'form',
          name: 'arrayParam',
          in: 'query',
          schema: {
            type: 'object'
          }
        },
        paramValue = { a: 1, b: 2 },
        retVal = Utils.convertParamsWithStyle(paramsSpace, paramValue);

      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsSpace.name);
      expect(retVal[0].value).to.equal('a%201%20b%202');

      retVal = Utils.convertParamsWithStyle(paramsPipe, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsPipe.name);
      expect(retVal[0].value).to.equal('a|1|b|2');

      retVal = Utils.convertParamsWithStyle(paramsDeep, paramValue);
      expect(retVal).be.an('array').with.length(2);
      expect(retVal[0].key).to.equal(paramsDeep.name + '[a]');
      expect(retVal[0].value).to.equal(1);
      expect(retVal[1].key).to.equal(paramsDeep.name + '[b]');
      expect(retVal[1].value).to.equal(2);

      retVal = Utils.convertParamsWithStyle(paramsForm, paramValue);
      expect(retVal).be.an('array').with.length(1);
      expect(retVal[0].key).to.equal(paramsForm.name);
      expect(retVal[0].value).to.equal('a,1,b,2');
    });
  });

  describe('convertToPmQueryParameters ', function() {
    it('Should convert undefined queryParam to pm param', function (done) {
      var param;
      let pmParam = Utils.convertToPmQueryParameters(param);
      expect(pmParam.length).to.equal(0);
      done();
    });
    it('Should convert queryParam without schema to pm param', function (done) {
      var param = {
        name: 'X-Header-One',
        in: 'query',
        description: 'query param'
      };
      Utils.options.schemaFaker = true;
      let pmParam = Utils.convertToPmQueryParameters(param);
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
      Utils.options.schemaFaker = true;
      let pmParam = Utils.convertToPmQueryParameters(param);
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
      Utils.options.schemaFaker = true;
      let pmParam = Utils.convertToPmQueryParameters(param);
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
            Utils.options.schemaFaker = true;
            let pmParam = Utils.convertToPmQueryParameters(param);
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.equal('<long>');
            done();
          });
          it('schemaFaker = false', function (done) {
            Utils.options.schemaFaker = false;
            let pmParam = Utils.convertToPmQueryParameters(param);
            expect(pmParam).to.eql([]);
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
            Utils.options.schemaFaker = true;
            let pmParam = Utils.convertToPmQueryParameters(param);
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.have.string(',');
            done();
          });
          it('schemaFaker = false', function (done) {
            Utils.options.schemaFaker = false;
            let pmParam = Utils.convertToPmQueryParameters(param);
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string(' ');
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('|');
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
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
            type: 'array',
            maxItems: 2,
            minItems: 2,
            items: {
              type: 'string'
            }
          }
        };
        it('schemaFaker = true', function (done) {
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name + '[]');
          expect(pmParam[0].description).to.equal(param.description);
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam).to.eql([]);
          done();
        });
      });
      describe('style:any other} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        it('schemaFaker = true', function (done) {
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string(',');
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
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
            Utils.options.schemaFaker = true;
            let pmParam = Utils.convertToPmQueryParameters(param);
            expect(pmParam[0].key).to.equal('id');
            expect(pmParam[1].key).to.equal('name');
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[1].description).to.equal(param.description);
            expect(pmParam[0].value).to.equal('<long>');
            expect(pmParam[1].value).to.equal('<string>');
            done();
          });
          it('schemaFaker = false', function (done) {
            Utils.options.schemaFaker = false;
            let pmParam = Utils.convertToPmQueryParameters(param);
            expect(pmParam).to.eql([]);
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
            Utils.options.schemaFaker = true;
            let pmParam = Utils.convertToPmQueryParameters(param);
            expect(pmParam[0].key).to.equal(param.name);
            expect(pmParam[0].description).to.equal(param.description);
            expect(pmParam[0].value).to.have.string('id');
            expect(pmParam[0].value).to.have.string('name');
            done();
          });
          it('schemaFaker = false', function (done) {
            Utils.options.schemaFaker = false;
            let pmParam = Utils.convertToPmQueryParameters(param);
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('%20');
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('|');
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
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
              }
            }
          }
        };
        it('schemaFaker = true', function (done) {
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name + '[id]');
          expect(pmParam[1].key).to.equal(param.name + '[name]');
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[1].description).to.equal(param.description);
          expect(pmParam[0].value).to.equal('<long>');
          expect(pmParam[1].value).to.equal('<string>');
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam).to.eql([]);
          done();
        });
      });
      describe('style:any other} to pm param ', function () {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(typeof pmParam[0].value).to.equal('object');
          done();
        });
        it('schemaFaker = false', function (done) {
          Utils.options.schemaFaker = false;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(typeof pmParam[0].value).to.equal('object');
          done();
        });
      });
    });
  });

  describe('getQueryStringWithStyle function', function () {
    it('Should correctly return the query string with the appropriate delimiter', function (done) {
      var param = {
        name: 'tuhin',
        age: 22,
        occupation: 'student'
      };

      expect(Utils.getQueryStringWithStyle(param, '%20')).to.equal('name%20tuhin%20age%2022%20occupation%20student');
      expect(Utils.getQueryStringWithStyle(param, '|')).to.equal('name|tuhin|age|22|occupation|student');
      expect(Utils.getQueryStringWithStyle(param, ',')).to.equal('name,tuhin,age,22,occupation,student');
      done();
    });

    it('Should add the delimiter if the value is undefined', function (done) {
      var param = {
        name: 'tuhin',
        age: undefined,
        occupation: 'student'
      };

      expect(Utils.getQueryStringWithStyle(param, '%20')).to.equal('name%20tuhin%20age%20occupation%20student');
      expect(Utils.getQueryStringWithStyle(param, '|')).to.equal('name|tuhin|age|occupation|student');
      expect(Utils.getQueryStringWithStyle(param, ',')).to.equal('name,tuhin,age,occupation,student');
      done();
    });
  });

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

  describe('convertToPmBody function', function() {
    describe('should convert requestbody of media type', function() {
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
        Utils.options.schemaFaker = true;
        result = Utils.convertToPmBody(requestBody);
        resultBody = JSON.parse(result.body.raw);
        expect(resultBody.id).to.equal('<long>');
        expect(resultBody.name).to.equal('<string>');
        expect(result.contentHeader).to.deep.include({ key: 'Content-Type', value: 'application/json' });
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
        Utils.options.schemaFaker = true;
        result = Utils.convertToPmBody(requestBody);
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
        Utils.options.schemaFaker = true;
        result = Utils.convertToPmBody(requestBody);
        resultBody = (result.body.formdata.toJSON());
        expect(resultBody[0].key).to.equal('file');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'multipart/form-data' });
        done();
      });
      it(' text/xml', function(done) { // not properly done
        var requestBody = {
            description: 'body description',
            content: {
              'text/xml': {
                examples: {
                  xml: {
                    summary: 'A list containing two items',
                    value: 'text/plain description'
                  }
                }
              }
            }
          },
          result, resultBody;
        Utils.options.schemaFaker = true;
        result = Utils.convertToPmBody(requestBody);
        resultBody = (result.body.raw);
        expect(resultBody).to.equal('"text/plain description"');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'text/xml' });
        done();
      });
      it(' text/plain', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'text/plain': {
                example: {
                  summary: 'A list containing two items',
                  value: 'text/plain description'
                }
              }
            }
          },
          result, resultBody;
        Utils.options.schemaFaker = true;
        result = Utils.convertToPmBody(requestBody);
        resultBody = result.body.raw;
        expect(resultBody).to.equal('"text/plain description"');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'text/plain' });
        done();
      });
      it(' text/html', function(done) {
        var requestBody = {
            description: 'body description',
            content: {
              'text/html': {
                example: {
                  summary: 'A list containing two items',
                  value: '<html><body><ul><li>item 1</li><li>item 2</li></ul></body></html>'
                }
              }
            }
          },
          result, resultBody;
        Utils.options.schemaFaker = true;
        result = Utils.convertToPmBody(requestBody);
        resultBody = (result.body.raw);
        expect(resultBody).to.equal('"<html><body><ul><li>item 1</li><li>item 2</li></ul></body></html>"');
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
        Utils.options.schemaFaker = true;
        result = Utils.convertToPmBody(requestBody);
        resultBody = (result.body.raw);
        expect(typeof resultBody).to.equal('string');
        expect(result.contentHeader).to.deep.include(
          { key: 'Content-Type', value: 'application/javascript' });
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
        pmResponseBody = Utils.convertToPmResponseBody(contentObj).responseBody;
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
        Utils.options.schemaFaker = true;
        pmResponseBody = JSON.parse(Utils.convertToPmResponseBody(contentObj).responseBody);
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
        Utils.options.schemaFaker = true;
        pmResponseBody = JSON.parse(Utils.convertToPmResponseBody(contentObj).responseBody);
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
        Utils.options.schemaFaker = true;
        Utils.options.indentCharacter = '\t';
        pmResponseBody = Utils.convertToPmResponseBody(contentObj).responseBody;
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
        Utils.options.schemaFaker = true;
        pmResponseBody = Utils.convertToPmResponseBody(contentObj).responseBody;
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
        Utils.options.schemaFaker = true;
        Utils.options.indentCharacter = ' ';
        pmResponseBody = Utils.convertToPmResponseBody(contentObj).responseBody;
        expect(pmResponseBody).to.equal(
          [
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
        Utils.options.schemaFaker = true;
        pmResponseBody = Utils.convertToPmResponseBody(contentObj).responseBody;
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
        Utils.options.schemaFaker = true;
        pmResponseBody = Utils.convertToPmResponseBody(contentObj).responseBody;
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

      Utils.options.schemaFaker = true;
      pmResponse = Utils.convertToPmResponse(response, code).toJSON();
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

      Utils.options.schemaFaker = true;
      pmResponse = Utils.convertToPmResponse(response, code).toJSON();
      expect(pmResponse.body).to.equal('<element>\n <id>(integer)</id>\n <name>(string)</name>\n</element>');
      expect(pmResponse.name).to.equal(response.description);
      expect(pmResponse.code).to.equal(200);
      expect(pmResponse._postman_previewlanguage).to.equal('xml');
      expect(pmResponse.header).to.deep.include({
        'key': 'Content-Type',
        'value': 'application/xml'
      });
      done();
    });
    it('sholud convert response without content field', function(done) {
      var response = {
          'description': 'A list of pets.'
        },
        code = '201',
        pmResponse;

      Utils.options.schemaFaker = true;
      pmResponse = Utils.convertToPmResponse(response, code).toJSON();
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
      Utils.components = {
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
      };
      var response = {
          'description': '`Too Many Requests`\\n',
          'headers': {
            'Retry-After': {
              '$ref': '#/components/responses/InternalError/headers/Retry-After'
            }
          }
        },
        code = '200',
        pmResponse = Utils.convertToPmResponse(response, code, null);

      expect(pmResponse.headers.members[0].key).to.equal('Retry-After');
      expect(pmResponse.headers.members[0].description).to.equal('Some description');
      done();
    });
  });

  describe('fixPathVariablesInUrl function', function() {
    it('should convert a url with scheme and path variables', function(done) {
      var convertedUrl = Utils.fixPathVariablesInUrl('{scheme}://developer.uspto.gov/{path0}/segment/{path1}');
      expect(convertedUrl).to.equal('{{scheme}}://developer.uspto.gov/{{path0}}/segment/{{path1}}');

      expect(Utils.fixPathVariablesInUrl('{{a}}')).to.equal('{{a}}');

      expect(Utils.fixPathVariablesInUrl('{{a}}://{b}.com/{pathvar}/{morevar}'))
        .to.equal('{{a}}://{{b}}.com/{{pathvar}}/{{morevar}}');

      expect(Utils.fixPathVariablesInUrl('{protocol}://{host}:{port}/{contextpath}/{restapi}'))
        .to.equal('{{protocol}}://{{host}}:{{port}}/{{contextpath}}/{{restapi}}');

      done();
    });
  });
});
