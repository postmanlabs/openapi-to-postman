var expect = require('chai').expect,
  deref = require('../../lib/deref.js');

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
