var expect = require('chai').expect,
  _ = require('lodash'),
  deref = require('../../lib/deref.js'),
  schemaUtils30X = require('./../../lib/30XUtils/schemaUtils30X');

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
        schemaWithAdditionPropRef = {
          $ref: '#/components/schemas/schemaAdditionalProps'
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
              },
              schemaAdditionalProps: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: {
                    type: 'string'
                  }
                },
                additionalProperties: {
                  type: 'object',
                  properties: {
                    hello: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          concreteUtils: schemaUtils30X
        },
        parameterSource = 'REQUEST',
        // deref.resolveRefs modifies the input schema and components so cloning to keep tests independent of each other
        output = deref.resolveRefs(schema, parameterSource, _.cloneDeep(componentsAndPaths), {}),
        output_validation = deref.resolveRefs(schema, parameterSource, _.cloneDeep(componentsAndPaths),
          { 'resolveFor': 'VALIDATION' }),
        output_withdot = deref.resolveRefs(schemaWithDotInKey, parameterSource, _.cloneDeep(componentsAndPaths), {}),
        output_customFormat = deref.resolveRefs(schemaWithCustomFormat, parameterSource,
          _.cloneDeep(componentsAndPaths), {}),
        output_withAllOf = deref.resolveRefs(schemaWithAllOf, parameterSource, _.cloneDeep(componentsAndPaths), {}),
        output_validationTypeArray = deref.resolveRefs(schemaWithTypeArray, parameterSource,
          _.cloneDeep(componentsAndPaths), { 'resolveFor': 'VALIDATION' }),
        output_emptyObject = deref.resolveRefs(schemaWithEmptyObject, parameterSource, _.cloneDeep(componentsAndPaths),
          {}),
        output_additionalProps = deref.resolveRefs(schemaWithAdditionPropRef, parameterSource,
          _.cloneDeep(componentsAndPaths), { 'resolveFor': 'VALIDATION' }),
        output_additionalPropsOverride;

      expect(output).to.deep.include({ type: 'object',
        required: ['id'],
        properties: { id: { default: '<long>', format: 'int64', type: 'integer' } } });

      expect(output_validation).to.deep.include({ anyOf: [
        { type: 'object',
          required: ['id'],
          description: 'Schema 2',
          properties: { id: { format: 'int64', type: 'integer' } }
        }, {
          type: 'object',
          properties: { emailField: { type: 'string', format: 'email' } }
        }
      ] });

      expect(output_withdot).to.deep.include({ type: 'object',
        required: ['id'],
        properties: { id: { default: '<long>', format: 'int64', type: 'integer' } } });

      expect(output_customFormat).to.deep.include({ type: 'object',
        properties: { emailField: { default: '<email>', format: 'email', type: 'string' } } });

      expect(output_withAllOf).to.deep.include({
        type: 'object',
        description: 'Schema 2',
        properties: {
          id: { default: '<long>', format: 'int64', type: 'integer' },
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

      // additionalProperties $ref should be resolved
      expect(output_additionalProps).to.deep.include(componentsAndPaths.components.schemas.schemaAdditionalProps);

      // add default to above resolved schema
      output_additionalProps.additionalProperties.properties.hello.default = '<string>';

      output_additionalPropsOverride = deref.resolveRefs(schemaWithAdditionPropRef, parameterSource,
        _.cloneDeep(componentsAndPaths), { resolveFor: 'VALIDATION' });

      // override should not affect newly resolved schema
      expect(output_additionalPropsOverride).to.deep.include(
        componentsAndPaths.components.schemas.schemaAdditionalProps);
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
          {
            components:
              { schemas: { schemaWithFormat: { type: 'string', format: supportedFormat } } },
            concreteUtils: schemaUtils30X
          }, {});

        expect(output.type).to.equal('string');
        expect(output.format).to.equal(supportedFormat);
      });

      // check for not supported formats
      _.forEach(nonSupportedFormats, (nonSupportedFormat) => {
        output = deref.resolveRefs(schema, parameterSource,
          {
            components: { schemas: { schemaWithFormat: nonSupportedFormat } },
            concreteUtils: schemaUtils30X
          }, {});

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

      output = deref.resolveRefs(schema, parameterSource, { concreteUtils: schemaUtils30X }, {});
      expect(output.type).to.equal('string');
      expect(output.format).to.be.undefined;
      expect(output.pattern).to.eql(schema.pattern);
      done();
    });

    it('should not contain readOnly properties in resolved schema if they are not contained' +
      ' in resolved schema', function(done) {
      var schema = {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              readOnly: true
            },
            name: {
              type: 'string'
            },
            tag: {
              type: 'string',
              writeOnly: true
            }
          }
        },
        parameterSource = 'REQUEST',
        output;

      output = deref.resolveRefs(schema, parameterSource, { concreteUtils: schemaUtils30X }, {});
      expect(output.type).to.equal('object');
      expect(output.properties).to.not.haveOwnProperty('id');
      expect(output.required).to.not.include('id');
      done();
    });

    it('should not contain writeOnly properties in resolved schema if they are not contained' +
      ' in resolved schema', function(done) {
      var schema = {
          type: 'object',
          required: ['id', 'tag'],
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
              readOnly: true
            },
            name: {
              type: 'string'
            },
            tag: {
              type: 'string',
              writeOnly: true
            }
          }
        },
        parameterSource = 'RESPONSE',
        output;

      output = deref.resolveRefs(schema, parameterSource, { concreteUtils: schemaUtils30X }, {});
      expect(output.type).to.equal('object');
      expect(output.properties).to.not.haveOwnProperty('tag');
      expect(output.required).to.not.include('tag');
      done();
    });

    it('should handle schema with enum having no type defined for resolveTo set as schema', function(done) {
      var schema = {
          'enum': [
            'capsule',
            'probe',
            'satellite',
            'spaceplane',
            'station'
          ]
        },
        resolveFor = 'CONVERSION',
        resolveTo = 'schema',
        parameterSource = 'REQUEST',
        output;

      output = deref.resolveRefs(schema, parameterSource, { concreteUtils: schemaUtils30X }, {
        resolveFor,
        resolveTo
      });
      expect(output.type).to.equal('string');
      expect(output.default).to.equal('<string>');
      done();
    });

    it('should return schema with example parameter(if given) for $ref just like inline schema', function(done) {
      var schema = {
          $ref: '#/components/schemas/schema1',
          example: 'asc'
        },
        componentsAndPaths = {
          components: {
            schemas: {
              schema1: {
                description: 'The unique identifier of a spacecraft',
                enum: [
                  'asc',
                  'desc'
                ],
                type: 'string'
              }
            }
          }
        },
        parameterSource = 'REQUEST',
        // deref.resolveRefs modifies the input schema and components so cloning to keep tests independent of each other
        output = deref.resolveRefs(schema, parameterSource, _.cloneDeep(componentsAndPaths), {});

      expect(output.example).to.equal(schema.example);
      done();
    });
  });

  describe('resolveAllOf Function', function () {
    it('should resolve schemas containing allOf keyword correctly', function (done) {
      var schema = {
        'allOf': [
          {
            'type': 'object',
            'properties': {
              'source': {
                'type': 'string',
                'format': 'uuid'
              },
              'status': {
                'type': 'string',
                'enum': ['incomplete', 'completed', 'refunded']
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
              },
              'status': {
                'type': 'string',
                'enum': ['no_market', 'too_small', 'too_large']
              }
            }
          }
        ]
      };

      expect(deref.resolveAllOf(
        schema,
        'REQUEST',
        { concreteUtils: schemaUtils30X },
        { resolveTo: 'example' }
      )).to.deep.include({
        type: 'object',
        properties: {
          source: {
            type: 'string',
            format: 'uuid'
          },
          status: {
            type: 'string',
            enum: ['incomplete', 'completed', 'refunded', 'no_market', 'too_small', 'too_large']
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

    it('should resolve schemas containing allOf keyword along with outer properties correctly', function (done) {
      var schema = {
        'properties': {
          'id': {
            'type': 'integer'
          },
          'name': {
            'type': 'string'
          },
          'type': {
            'type': 'string',
            'enum': ['capsule', 'probe', 'satellite', 'spaceplane', 'station']
          },
          'registerdDate': {
            'type': 'string',
            'format': 'date-time'
          }
        },
        'allOf': [
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
        ]
      };

      expect(deref.resolveAllOf(
        schema,
        'REQUEST',
        { concreteUtils: schemaUtils30X },
        { resolveTo: 'example' }
      )).to.deep.include({
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          name: {
            type: 'string'
          },
          type: {
            type: 'string',
            enum: ['capsule', 'probe', 'satellite', 'spaceplane', 'station']
          },
          registerdDate: {
            type: 'string',
            format: 'date-time'
          },
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

    it('should resolve schemas under allOf keyword with additionalProperties set to false correctly', function (done) {
      var schema = {
        'allOf': [
          {
            'type': 'object',
            'additionalProperties': false,
            'properties': {
              'source': {
                'type': 'string',
                'format': 'uuid'
              },
              'status': {
                'type': 'string',
                'enum': ['incomplete', 'completed', 'refunded']
              },
              'actionId': { 'type': 'integer', 'minimum': 5 },
              'result': { 'type': 'object' }
            },
            'required': ['source', 'actionId', 'result']
          },
          {
            'additionalProperties': false,
            'properties': {
              'result': {
                'type': 'object',
                'properties': {
                  'err': { 'type': 'string' },
                  'data': { 'type': 'object' }
                }
              },
              'status': {
                'type': 'string',
                'enum': ['no_market', 'too_small', 'too_large']
              }
            }
          }
        ]
      };

      expect(deref.resolveAllOf(
        schema,
        'REQUEST',
        { concreteUtils: schemaUtils30X },
        { resolveTo: 'example' }
      )).to.deep.equal({
        type: 'object',
        additionalProperties: false,
        required: ['source', 'actionId', 'result'],
        properties: {
          source: {
            type: 'string',
            format: 'uuid'
          },
          status: {
            type: 'string',
            enum: ['incomplete', 'completed', 'refunded', 'no_market', 'too_small', 'too_large']
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
