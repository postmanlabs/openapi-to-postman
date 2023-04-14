const {
    getParametersForPathItem,
    verifyDeprecatedProperties,
    getExampleData,
    extractDeepObjectParams
  } = require('../../lib/schemaUtils'),
  expect = require('chai').expect;


describe('getParametersForPathItem function', function () {
  const params = [
    {
      name: 'limit',
      in: 'header',
      description: 'How many items to return at one time (max 100)',
      required: false,
      schema: {
        type: [
          'integer'
        ],
        format: 'int32',
        examples: [
          2
        ]
      }
    },
    {
      name: 'variable',
      in: 'query',
      description: 'random variable',
      style: 'form',
      explode: false,
      schema: {
        type: [
          'array'
        ],
        items: {
          type: [
            'string'
          ],
          examples: [
            'Hola Mundo'
          ]
        }
      }
    },
    {
      name: 'variable2',
      in: 'query',
      description: 'another random variable',
      style: 'spaceDelimited',
      deprecated: true,
      schema: {
        type: [
          'array'
        ],
        items: {
          type: [
            'integer'
          ],
          format: 'int64'
        }
      }
    },
    {
      name: 'limit_2',
      in: 'header',
      description: 'How many items to return at one time (max 100)',
      required: false,
      deprecated: true,
      schema: {
        type: [
          'integer'
        ],
        format: 'int32'
      }
    },
    {
      name: 'limit_Dep',
      in: 'path',
      description: 'How many items to return at one time (max 100)',
      required: false,
      deprecated: true,
      schema: {
        type: [
          'integer'
        ],
        format: 'int32'
      }
    },
    {
      name: 'path_not_Dep',
      in: 'path',
      description: 'How many items to return at one time (max 100)',
      required: false,
      schema: {
        type: [
          'integer'
        ],
        format: 'int32'
      }
    }
  ];

  it('should categorize and exclude deprecated', function () {
    const options = { includeDeprecated: false },
      result = getParametersForPathItem(params, options);
    expect(result.header.length).to.equal(1);
    expect(result.query.length).to.equal(1);
    expect(result.path.length).to.equal(1);
  });

  it('should categorize and include deprecated', function () {
    const options = { includeDeprecated: true },
      result = getParametersForPathItem(params, options);
    expect(result.query.length).to.equal(2);
    expect(result.header.length).to.equal(2);
    expect(result.path.length).to.equal(2);
  });
  it('should categorize and include deprecated option is undefined', function () {
    const options = { },
      result = getParametersForPathItem(params, options);
    expect(result.query.length).to.equal(2);
    expect(result.header.length).to.equal(2);
    expect(result.path.length).to.equal(2);
  });
});

describe('verifyDeprecatedProperties function', function () {
  it('should remove the deprecated properties when the option is false', function () {
    let schema = {
      type: 'object',
      properties: {
        a: {
          type: 'string',
          deprecated: true,
          default: '<string>'
        },
        b: {
          type: 'string',
          example: 'example-b',
          default: '<string>'
        }
      }
    };
    verifyDeprecatedProperties(schema, false);
    expect(schema.properties.a).to.be.undefined;
  });

  it('should leave the deprecated properties when the option is true', function () {
    let schema = {
      type: 'object',
      properties: {
        a: {
          type: 'string',
          deprecated: true,
          default: '<string>'
        },
        b: {
          type: 'string',
          example: 'example-b',
          default: '<string>'
        }
      }
    };
    verifyDeprecatedProperties(schema, true);
    expect(schema.properties.a).to.not.be.undefined;
  });

  it('should remove the deprecated properties when the option is false nested property', function () {
    let schema = {
      type: 'object',
      properties: {
        a: {
          type: 'string',
          deprecated: true,
          default: '<string>'
        },
        b: {
          type: 'object',
          properties: {
            c: {
              type: 'string',
              deprecated: true,
              default: '<string>'
            },
            d: {
              type: 'string',
              default: '<string>'
            }
          }
        }
      }
    };
    verifyDeprecatedProperties(schema, false);
    expect(schema.properties.a).to.be.undefined;
    expect(schema.properties.b).to.not.be.undefined;
    expect(schema.properties.b.properties.c).to.be.undefined;
    expect(schema.properties.b.properties.d).to.not.be.undefined;
  });

  it('should leave the deprecated properties when the option is true nested property', function () {
    let schema = {
      type: 'object',
      properties: {
        a: {
          type: 'string',
          deprecated: true,
          default: '<string>'
        },
        b: {
          type: 'object',
          properties: {
            c: {
              type: 'string',
              deprecated: true,
              default: '<string>'
            },
            d: {
              type: 'string',
              default: '<string>'
            }
          }
        }
      }
    };
    verifyDeprecatedProperties(schema, true);
    expect(schema.properties.a).to.not.be.undefined;
    expect(schema.properties.b).to.not.be.undefined;
    expect(schema.properties.b.properties.c).to.not.be.undefined;
    expect(schema.properties.b.properties.d).to.not.be.undefined;
  });

  it('should leave the deprecated properties when the option is true nested property' +
  'property has a name of deprecated', function () {
    let schema = {
      type: 'object',
      properties: {
        deprecated: {
          type: 'boolean'
        },
        b: {
          type: 'object',
          properties: {
            c: {
              type: 'string',
              deprecated: true,
              default: '<string>'
            },
            d: {
              type: 'string',
              default: '<string>'
            },
            deprecated: {
              type: 'string',
              default: '<string>'
            }
          }
        }
      }
    };
    verifyDeprecatedProperties(schema, false);
    expect(schema.properties.deprecated).to.not.be.undefined;
    expect(schema.properties.b).to.not.be.undefined;
    expect(schema.properties.b.properties.c).to.be.undefined;
    expect(schema.properties.b.properties.d).to.not.be.undefined;
  });
});

describe('getExampleData function', function () {
  it('should correctly provide result with null example object', function () {
    const result = getExampleData(null, {}, {});

    expect(result).to.equal('');
  });
});

describe('extractDeepObjectParams function', function () {
  it('should correctly provide result with nested object containing null values', function () {
    const result = extractDeepObjectParams({ id: null }, 'user');

    expect(result).to.eql([{
      key: 'user[id]',
      value: null
    }]);
  });
});
