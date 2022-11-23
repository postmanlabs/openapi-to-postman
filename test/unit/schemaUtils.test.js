const { getParametersForPathItem } = require('../../lib/schemaUtils'),
  expect = require('chai').expect;


describe('getParametersForPathItem method', function () {
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
    const options = { includeDeprecatedProperties: false },
      result = getParametersForPathItem(params, options);
    expect(result.header.length).to.equal(1);
    expect(result.query.length).to.equal(1);
    expect(result.path.length).to.equal(1);
  });

  it('should categorize and include deprecated', function () {
    const options = { includeDeprecatedProperties: true },
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
