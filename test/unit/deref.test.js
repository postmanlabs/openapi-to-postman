var expect = require('chai').expect,
  deref = require('../../lib/deref.js');

describe('DEREF FUNCTION TESTS ', function() {
  it('resolveRefs Function should return schema with resolved references.', function(done) {
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
            }
          }
        }
      },
      parameterSource = 'REQUEST',
      output = deref.resolveRefs(schema, parameterSource, componentsAndPaths),
      output_withdot = deref.resolveRefs(schemaWithDotInKey, parameterSource, componentsAndPaths),
      output_customFormat = deref.resolveRefs(schemaWithCustomFormat, parameterSource, componentsAndPaths),
      output_withAllOf = deref.resolveRefs(schemaWithAllOf, parameterSource, componentsAndPaths);


    expect(output).to.deep.include({ type: 'object',
      required: ['id'],
      properties: { id: { default: '<long>', type: 'integer' } } });

    expect(output_withdot).to.deep.include({ type: 'object',
      required: ['id'],
      properties: { id: { default: '<long>', type: 'integer' } } });

    expect(output_customFormat).to.deep.include({ type: 'object',
      properties: { emailField: { default: '<email>', type: 'string' } } });

    expect(output_withAllOf).to.deep.include({
      type: 'object',
      description: 'Schema 2',
      properties: {
        id: { default: '<long>', type: 'integer' },
        test_prop: { default: '<string>', type: 'string' }
      }
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
