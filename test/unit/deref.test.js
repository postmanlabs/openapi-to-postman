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
          id: { default: '<long>', type: 'integer' },
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
      expect(schemaResolutionCache).to.deep.equal({
        '#/components/schema/request': resolvedSchema
      });
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
