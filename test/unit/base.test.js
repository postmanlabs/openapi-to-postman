var expect = require('chai').expect,
  _ = require('lodash'),
  Converter = require('../../index.js'),
  Utils = require('../../lib/util.js'),
  deref = require('../../lib/deref.js'),
  fs = require('fs'),
  openApiErr = require('../../lib/error.js'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  INVALID_OPENAPI_PATH = '../data/invalid_openapi';

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
            }
          }
        },
        output = Utils.generateTrieFromPaths(openapi),
        root = output.tree.root,
        collectionVariables = output.variables;
      expect(root.children).to.have.key('pet');
      expect(root.children.pet.requestCount).to.equal(3);
      expect(root.children.pet.requests.length).to.equal(2);
      expect(root.children.pet.children).to.have.key('{petId}');
      expect(root.children.pet.children['{petId}'].requestCount).to.equal(1);
      expect(collectionVariables).to.have.key('petUrl');
      done();
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
  });

  describe('convertToPmQueryParameters Function ', function() {
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
    describe('Should convert queryParam with schema {type:array, ', function() {
      describe('style:form, ', function() {
        it('explode:true} to pm param', function (done) {
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.equal('<long>');
          done();
        });
        it('explode:false} to pm param', function (done) {
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string(',');
          done();
        });
      });
      it('style:spaceDelimited} to pm param', function (done) {
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
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value).to.have.string(' ');
        done();
      });
      it('style:pipeDelimited} to pm param', function (done) {
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
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value).to.have.string('|');
        done();
      });
      it('style:deepObject} to pm param', function (done) {
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
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name + '[]');
        expect(pmParam[0].description).to.equal(param.description);
        done();
      });
      it('style:any other} to pm param', function (done) {
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
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value).to.have.string(',');
        done();
      });
    });
    describe('Should convert queryParam with schema {type:object, ', function() {
      describe('style:form, ', function() {
        it('explode:true} to pm param', function (done) {
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
        it('explode:false} to pm param ', function (done) {
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
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value).to.have.string('id');
          expect(pmParam[0].value).to.have.string('name');
          done();
        });
      });
      it('style:spaceDelimited} to pm param', function (done) {
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
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value).to.have.string('%20');
        done();
      });
      it('style:pipeDelimited} to pm param', function (done) {
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
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value).to.have.string('|');
        done();
      });
      it('style:deepObject} to pm param', function (done) {
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
      it('style:any other} to pm param', function (done) {
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
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(typeof pmParam[0].value).to.equal('object');
        done();
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
              'examples': {
                'user': {
                  'summary': 'User example in XML',
                  'externalValue': 'http://foo.bar/examples/user-example.xml'
                }
              }
            }
          },
          pmResponseBody;
        Utils.options.schemaFaker = true;
        pmResponseBody = Utils.convertToPmResponseBody(contentObj).responseBody;
        expect(typeof pmResponseBody).to.equal('string');
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
      // things remaining application/xml, application/javascript
    });
  });

  describe('convertToPmResponse function', function() {
    it('sholud convert response with content field', function(done) {
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
      expect(pmResponse.header).to.deep.include({
        'key': 'Content-Type',
        'value': 'application/json'
      });
      expect(responseBody.id).to.equal('<long>');
      expect(responseBody.name).to.equal('<string>');
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
  });

  describe('fixPathVariablesInUrl function', function() {
    it('should convert a url with scheme and path variables', function(done) {
      var convertedUrl = Utils.fixPathVariablesInUrl('{scheme}://developer.uspto.gov/{path0}/segment/{path1}');
      expect(convertedUrl).to.equal('{{scheme}}://developer.uspto.gov/:path0/segment/:path1');
      done();
    });
  });
});
describe('DEREF FUNCTION TESTS ', function() {
  it('resolveRefs Function should return schema with resolved references.', function(done) {
    var schema = {
        $ref: '#/components/schemas/schema1'
      },
      components = {
        schemas: {
          schema1: {
            anyOf: [{
              $ref: '#/components/schemas/schema2'
            },
            {
              $ref: '#/components/schemas/schema3'
            }
            ]
          },
          schema2: {
            type: 'object',
            required: [
              'id'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              }
            }
          }
        }
      },
      output = deref.resolveRefs(schema, components);
    expect(output).to.deep.include({ type: 'object',
      required: ['id'],
      properties: { id: { default: '<long>', type: 'string' } } });
    done();
  });
});
describe('CONVERT FUNCTION TESTS ', function() {
  // these two covers remaining part of util.js
  describe('The convert Function', function() {
    var pathPrefix = VALID_OPENAPI_PATH + '/test.json',
      specPath = path.join(__dirname, pathPrefix),
      pathPrefix1 = VALID_OPENAPI_PATH + '/test1.json',
      specPath1 = path.join(__dirname, pathPrefix1);


    it('Should generate collection conforming to schema for and fail if not valid ' +
     specPath, function(done) {
      var openapi = fs.readFileSync(specPath, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
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
      specPath1, function(done) {
      Converter.convert({ type: 'file', data: specPath1 }, { requestNameSource: 'url' }, (err, conversionResult) => {
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
  describe('for invalid requestNameSource option', function() {
    var pathPrefix = VALID_OPENAPI_PATH + '/test1.json',
      specPath = path.join(__dirname, pathPrefix);

    it('for invalid request name, converter should throw an error', function(done) {
      var openapi = fs.readFileSync(specPath, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { requestNameSource: 'uKnown' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.reason).to.equal(
          'requestNameSource (uKnown) in options is invalid or property does not exist in pets');
        done();
      });
    });
  });
});


/* Plugin Interface Tests */
describe('INTERFACE FUNCTION TESTS ', function () {
  describe('The converter must identify valid specifications', function () {
    var pathPrefix = VALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);

      it(specPath + ' is valid ', function(done) {
        var openapi = fs.readFileSync(specPath, 'utf8'),
          validationResult = Converter.validate({ type: 'string', data: openapi });

        expect(validationResult.result).to.equal(true);
        done();
      });
    });
  });

  describe('The converter must identify invalid specifications', function () {
    var pathPrefix = INVALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);

      it(specPath + ' is invalid ', function(done) {
        var openapi = fs.readFileSync(specPath, 'utf8'),
          validationResult = Converter.validate({ type: 'string', data: openapi });

        expect(validationResult.result).to.equal(false);
        Converter.convert({ type: 'string', data: openapi }, {}, function(err, conversionResult) {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(false);
          done();
        });
      });
    });
  });

  describe('The converter must generate a collection conforming to the schema', function () {
    var pathPrefix = VALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);
      it('Should generate collection conforming to schema for and fail if not valid ' + specPath, function(done) {
        // var openapi = fs.readFileSync(specPath, 'utf8');
        var result = Converter.validate({ type: 'file', data: specPath });
        expect(result.result).to.equal(true);
        Converter.convert({ type: 'file', data: specPath },
          {}, (err, conversionResult) => {
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
  });

  describe('The converter must throw an error for invalid input type', function() {
    it('(type: some invalid value)', function(done) {
      var result = Converter.validate({ type: 'fil', data: 'invalid_path' });
      expect(result.result).to.equal(false);
      expect(result.reason).to.equal('input type is not valid');
      Converter.convert({ type: 'fil', data: 'invalid_path' }, {}, function(err, conversionResult) {
        expect(conversionResult.result).to.equal(false);
        expect(conversionResult.reason).to.equal('input type:fil is not valid');
        done();
      });
    });
  });

  describe('The converter must throw an error for invalid input path', function() {
    it('(type: file)', function(done) {
      var result = Converter.validate({ type: 'file', data: 'invalid_path' });
      expect(result.result).to.equal(false);
      Converter.convert({ type: 'file', data: 'invalid_path' }, {}, function(err) {
        expect(err.toString()).to.equal('Error: ENOENT: no such file or directory, open \'invalid_path\'');
        done();
      });
    });
  });
});
