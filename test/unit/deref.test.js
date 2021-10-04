var expect = require('chai').expect,
  _ = require('lodash'),
  deref = require('../../lib/deref.js');

describe('DEREF FUNCTION TESTS ', function() {
  describe('resolveRefs Function', function () {
    it('should return schema with resolved references.', function(done) {
      var schema = {
          $ref: '#/components/schemas/schema1'
        },
        schemaWithDotInKey = {
          $ref: '#/components/schemas/schema.four'
        },
        schemaWithCustomFormat = {
          $ref: '#/components/schemas/schema3'
        },
        schemaWithAllOf = {
          allOf: [{
            $ref: '#/components/schemas/schema2'
          },
          {
            properties: {
              test_prop: {
                type: 'string'
              }
            }
          }]
        },
        schemaWithTypeArray = {
          $ref: '#/components/schemas/schemaTypeArray'
        },
        schemaWithEmptyObject = {
          $ref: '#/components/schemas/schemaWithEmptyObject'
        },
        componentsAndPaths = {
          components: {
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
                description: 'Schema 2',
                properties: {
                  id: {
                    type: 'integer',
                    format: 'int64'
                  }
                }
              },
              'schema.four': {
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
              },
              schema3: {
                type: 'object',
                properties: {
                  emailField: {
                    type: 'string',
                    format: 'email'
                  }
                }
              },
              schemaTypeArray: {
                type: 'array',
                items: {
                  type: 'string'
                },
                minItems: 5,
                maxItems: 55
              },
              schemaWithEmptyObject: {
                type: 'object'
              }
            }
          }
        },
        parameterSource = 'REQUEST',
        output = deref.resolveRefs(schema, parameterSource, componentsAndPaths),
        output_withdot = deref.resolveRefs(schemaWithDotInKey, parameterSource, componentsAndPaths),
        output_customFormat = deref.resolveRefs(schemaWithCustomFormat, parameterSource, componentsAndPaths),
        output_withAllOf = deref.resolveRefs(schemaWithAllOf, parameterSource, componentsAndPaths),
        output_validationTypeArray = deref.resolveRefs(schemaWithTypeArray, parameterSource, componentsAndPaths,
          {}, 'VALIDATION'),
        output_emptyObject = deref.resolveRefs(schemaWithEmptyObject, parameterSource, componentsAndPaths);

      expect(output).to.deep.include({ type: 'object',
        required: ['id'],
        properties: { id: { default: '<long>', type: 'integer' } } });

      expect(output_withdot).to.deep.include({ type: 'object',
        required: ['id'],
        properties: { id: { default: '<long>', type: 'integer' } } });

      expect(output_customFormat).to.deep.include({ type: 'object',
        properties: { emailField: { default: '<email>', format: 'email', type: 'string' } } });

      expect(output_withAllOf).to.deep.include({
        type: 'object',
        description: 'Schema 2',
        properties: {
          id: { default: '<long>', type: 'integer', format: 'int64' },
          test_prop: { default: '<string>', type: 'string' }
        }
      });

      // deref.resolveRef() should not change minItems and maxItems for VALIDATION
      expect(output_validationTypeArray).to.deep.include({
        type: 'array',
        items: {
          type: 'string'
        },
        minItems: 5,
        maxItems: 55
      });

      // object without no properties should not resolve to string
      expect(output_emptyObject).to.deep.include({
        type: 'object'
      });

      done();
    });

    it('should populate schemaResolutionCache having key as the ref provided', function (done) {
      var schema = {
          $ref: '#/components/schema/request'
        },
        componentsAndPaths = {
          components: {
            schema: {
              request: {
                properties: {
                  name: {
                    type: 'string',
                    example: 'example name'
                  }
                }
              }
            }
          }
        },
        parameterSource = 'REQUEST',
        schemaResolutionCache = {},
        resolvedSchema = deref.resolveRefs(schema, parameterSource, componentsAndPaths, schemaResolutionCache);
      expect(_.get(schemaResolutionCache, ['#/components/schema/request', 'schema'])).to.deep.equal(resolvedSchema);
      expect(resolvedSchema).to.deep.equal({
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'example name',
            default: '<string>'
          }
        }
      });
      done();
    });

    it('should only contain format property in resolved schema for supported formats', function(done) {
      var schema = {
          $ref: '#/components/schemas/schemaWithFormat'
        },
        allSupportedFormats = [
          'date', 'time', 'date-time', 'uri', 'uri-reference', 'uri-template', 'email',
          'hostname', 'ipv4', 'ipv6', 'regex', 'uuid', 'json-pointer'
        ],
        nonSupportedFormats = [
          { type: 'integer', format: 'int32' },
          { type: 'integer', format: 'int64' },
          { type: 'number', format: 'float' },
          { type: 'number', format: 'double' },
          { type: 'string', format: 'byte' },
          { type: 'string', format: 'binary' },
          { type: 'string', format: 'password' },
          { type: 'string', format: 'nonExistentFormat' }
        ],
        parameterSource = 'REQUEST',
        output;

      // check for supported formats
      _.forEach(allSupportedFormats, (supportedFormat) => {
        output = deref.resolveRefs(schema, parameterSource,
          { components: { schemas: { schemaWithFormat: { type: 'string', format: supportedFormat } } } });

        expect(output.type).to.equal('string');
        expect(output.format).to.equal(supportedFormat);
      });

      // check for not supported formats
      _.forEach(nonSupportedFormats, (nonSupportedFormat) => {
        output = deref.resolveRefs(schema, parameterSource,
          { components: { schemas: { schemaWithFormat: nonSupportedFormat } } });

        expect(output.type).to.equal(nonSupportedFormat.type);
        expect(output.format).to.be.undefined;
      });
      done();
    });

    it('should not contain format property in resolved schema if pattern is already defined', function(done) {
      var schema = {
          'type': 'string',
          'format': 'date-time',
          'pattern': '^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])' +
            '( (2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9]))?$'
        },
        parameterSource = 'REQUEST',
        output;

      output = deref.resolveRefs(schema, parameterSource, {});
      expect(output.type).to.equal('string');
      expect(output.format).to.be.undefined;
      expect(output.pattern).to.eql(schema.pattern);
      done();
    });

    it('should correctly resolve schema from schemaResoltionCache based on schema resolution level', function (done) {
      let schema = {
          $ref: '#/components/schemas/schemaUsed'
        },
        consumerSchema = {
          type: 'object',
          properties: { level2: {
            type: 'object',
            properties: { level3: {
              type: 'object',
              properties: { level4: {
                type: 'object',
                properties: { level5: {
                  type: 'object',
                  properties: { level6: {
                    type: 'object',
                    properties: { level7: {
                      type: 'object',
                      properties: { level8: {
                        type: 'object',
                        properties: { level9: { $ref: '#/components/schemas/schemaUsed' } }
                      } }
                    } }
                  } }
                } }
              } }
            } }
          } }
        },
        componentsAndPaths = {
          components: {
            schemas: {
              schemaUsed: {
                'type': 'object',
                'required': [
                  'id',
                  'name'
                ],
                'properties': {
                  'id': {
                    'type': 'integer',
                    'format': 'int64'
                  },
                  'name': {
                    'type': 'string'
                  },
                  'tag': {
                    'type': 'string'
                  }
                }
              }
            }
          }
        },
        parameterSource = 'REQUEST',
        schemaResoltionCache = {},
        resolvedConsumerSchema,
        resolvedSchema;

      resolvedConsumerSchema = deref.resolveRefs(consumerSchema, parameterSource, componentsAndPaths,
        schemaResoltionCache);

      // Consumer schema contains schema at nesting level 9, which results in impartial resolution of schema
      expect(_.get(schemaResoltionCache, ['#/components/schemas/schemaUsed', 'resLevel'])).to.eql(9);
      expect(_.get(resolvedConsumerSchema, _.join(_.map(_.range(1, 10), (ele) => {
        return `properties.level${ele}`;
      }), '.'))).to.not.deep.equal(componentsAndPaths.components.schemas.schemaUsed);
      expect(_.get(schemaResoltionCache, ['#/components/schemas/schemaUsed', 'schema'])).to.not.deep
        .equal(componentsAndPaths.components.schemas.schemaUsed);
      resolvedSchema = deref.resolveRefs(schema, parameterSource, componentsAndPaths, schemaResoltionCache);
      // Restoring the original format as it is deleted if not supported by json-schema-faker and ajv
      resolvedSchema.properties.id.format = 'int64';

      /**
       * Even though schema cache contains schemaUsed as impartially cached,resolution were it's used again will
       * depend on ongoing resolution level and schema is cached again if it's updated.
       */
      expect(resolvedSchema).to.deep.equal(componentsAndPaths.components.schemas.schemaUsed);
      expect(_.get(schemaResoltionCache, ['#/components/schemas/schemaUsed', 'schema'])).to.deep
        .equal(componentsAndPaths.components.schemas.schemaUsed);
      done();
    });
  });

  describe('resolveAllOf Function', function () {
    it('should resolve allOf schemas correctly', function (done) {
      var allOfschema = [
        {
          'type': 'object',
          'properties': {
            'source': {
              'type': 'string',
              'format': 'uuid'
            },
            'actionId': { 'type': 'integer', 'minimum': 5 },
            'result': { 'type': 'object' }
          },
          'required': ['source', 'actionId', 'result']
        },
        {
          'properties': {
            'result': {
              'type': 'object',
              'properties': {
                'err': { 'type': 'string' },
                'data': { 'type': 'object' }
              }
            }
          }
        }
      ];

      expect(deref.resolveAllOf(allOfschema, 'REQUEST', {}, {}, null, 'example')).to.deep.include({
        type: 'object',
        properties: {
          source: {
            type: 'string',
            format: 'uuid'
          },
          actionId: { 'type': 'integer', 'minimum': 5 },
          result: {
            type: 'object',
            properties: {
              err: { 'type': 'string' },
              data: { 'type': 'object' }
            }
          }
        }
      });
      done();
    });
  });

  describe('_getEscaped should', function() {
    var rootObject = {
      person: {
        name: {
          firstName: 'John'
        },
        'key.with.period': true,
        pets: ['Cooper', 'Calvin']
      },
      alive: true
    };

    it('work correctly for all _.get cases', function() {
      // return object at path
      expect(deref._getEscaped(rootObject, ['person', 'name'], 'Jane').firstName).to.equal('John');

      // return object at path
      expect(deref._getEscaped(rootObject, ['alive'], 'Jane')).to.equal(true);

      // return primitive at path
      expect(deref._getEscaped(rootObject, ['person', 'name', 'firstName'], 'Jane')).to.equal('John');

      // return primitive at path with . in propname
      expect(deref._getEscaped(rootObject, ['person', 'key.with.period'], 'Jane')).to.equal(true);

      // return default for wrong path
      expect(deref._getEscaped(rootObject, ['person', 'wrongname'], 'Jane')).to.equal('Jane');

      // return array elem 0
      expect(deref._getEscaped(rootObject, ['person', 'pets', 0], 'Hello?')).to.equal('Cooper');

      // return array elem 1
      expect(deref._getEscaped(rootObject, ['person', 'pets', 1], 'Hello?')).to.equal('Calvin');

      // return array elem 2 (nonexistent)
      expect(deref._getEscaped(rootObject, ['person', 'pets', 2], 'Pet not found')).to.equal('Pet not found');

      // bad inputs should not crash the process
      expect(deref._getEscaped(rootObject, { randomObject: 1 })).to.equal(null);
      expect(deref._getEscaped(2, { randomObject: 1 })).to.equal(null);
      expect(deref._getEscaped(null, { randomObject: 1 })).to.equal(null);
    });
  });
});
