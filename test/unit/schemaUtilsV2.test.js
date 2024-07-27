const {
    resolveSchema,
    resolveRequestBodyForPostmanRequest
  } = require('../../libV2/schemaUtils.js'),
  concreteUtils = require('../../lib/30XUtils/schemaUtils30X'),
  expect = require('chai').expect,

  // Example operationItem
  operationItem = {
    put: {
      'tags': [
        'Administration: Users'
      ],
      'summary': 'Create or Update User',
      'operationId': 'User',
      'requestBody': {
        'content': {
          'application/json': {
            'schema': {
              'type': 'object',
              'properties': {
                'foo': {
                  'type': 'string'
                }
              }
            }
          },
          'text/json': {
            'schema': {
              'type': 'object',
              'properties': {
                'foo': {
                  'type': 'string'
                }
              }
            }
          },
          'application/xml': {
            'schema': {
              'type': 'object',
              'properties': {
                'foo': {
                  'type': 'string'
                }
              }
            }
          },
          'multipart/form-data': {
            'schema': {
              'type': 'object',
              'properties': {
                'foo': {
                  'type': 'string'
                }
              }
            }
          },
          'application/x-www-form-urlencoded': {
            'schema': {
              'type': 'object',
              'properties': {
                'foo': {
                  'type': 'string'
                }
              }
            }
          }
        },
        'description': 'The User request.',
        'required': true
      },
      'responses': {
        '200': {
          'description': 'OK',
          'content': {
            'application/json': {
              'schema': {
                'type': 'object',
                'properties': {}
              }
            }
          }
        }
      }
    }
  };

describe('resolveRequestBodyForPostmanRequest function', function () {

  it('should return first-listed request body when preferredRequestBodyType is not set', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema'
        }
      },
      operationItemTest = operationItem.put,
      result = resolveRequestBodyForPostmanRequest(contextTest, operationItemTest);

    expect(result.body.mode).to.equal('raw');
  });

  it('should return first-listed request body when preferredRequestBodyType is not a valid option', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          preferredRequestBodyType: 'foo-bar'
        }
      },
      operationItemTest = operationItem.put,
      result = resolveRequestBodyForPostmanRequest(contextTest, operationItemTest);

    expect(result.body.mode).to.equal('raw');
  });

  it('should return encoded request body when preferredRequestBodyType is x-www-form-urlencoded', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          preferredRequestBodyType: 'x-www-form-urlencoded'
        }
      },
      operationItemTest = operationItem.put,
      result = resolveRequestBodyForPostmanRequest(contextTest, operationItemTest);

    expect(result.body.mode).to.equal('urlencoded');
  });

  it('should return form data request body when preferredRequestBodyType is form-data', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          preferredRequestBodyType: 'form-data'
        }
      },
      operationItemTest = operationItem.put,
      result = resolveRequestBodyForPostmanRequest(contextTest, operationItemTest);

    expect(result.body.mode).to.equal('formdata');
  });

  it('should return raw request body when preferredRequestBodyType is raw', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          preferredRequestBodyType: 'raw'
        }
      },
      operationItemTest = operationItem.put,
      result = resolveRequestBodyForPostmanRequest(contextTest, operationItemTest);

    expect(result.body.mode).to.equal('raw');
  });

  it('should return raw request body when preferredRequestBodyType is first-listed', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          preferredRequestBodyType: 'first-listed'
        }
      },
      operationItemTest = operationItem.put,
      result = resolveRequestBodyForPostmanRequest(contextTest, operationItemTest);

    expect(result.body.mode).to.equal('raw');
  });

});

describe('resolveSchema function', function () {

  it('should return schema value "string" for simple property', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          stackLimit: 10,
          includeDeprecated: false
        }
      },
      schema = {
        'type': 'string',
        'example': 'abc'
      },
      result = resolveSchema(contextTest, schema, 0, 'conversion');

    expect(result.default).to.equal('<string>');
  });

  it('should return example value for simple property', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'example',
          stackLimit: 10,
          includeDeprecated: false
        }
      },
      schema = {
        'type': 'string',
        'example': 'abc'
      },
      result = resolveSchema(contextTest, schema, 0, 'conversion');

    expect(result.example).to.equal('abc');
  });

  it('should return schema value "string" for nested property', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          stackLimit: 10,
          includeDeprecated: false
        }
      },
      schema = {
        'type': 'object',
        'properties': {
          'foo': {
            'type': 'string',
            'example': 'abc'
          }
        }
      },
      result = resolveSchema(contextTest, schema, 0, 'conversion');

    expect(result.properties.foo.default).to.equal('<string>');
  });

  it('should return example value for nested property', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'example',
          stackLimit: 10,
          includeDeprecated: false
        }
      },
      schema = {
        'type': 'object',
        'properties': {
          'foo': {
            'type': 'string',
            'example': 'abc'
          }
        }
      },
      result = resolveSchema(contextTest, schema, 0, 'conversion');

    expect(result.properties.foo.example).to.equal('abc');
  });

  it('should return schema value "string" for ENUM property', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'schema',
          stackLimit: 10,
          includeDeprecated: false
        }
      },
      schema = {
        'type': 'object',
        'properties': {
          'foo': {
            'type': 'string',
            'enum': [
              'primary',
              'secondary',
              'work',
              'personal',
              'other'
            ],
            'example': 'primary'
          }
        }
      },
      result = resolveSchema(contextTest, schema, 0, 'conversion');

    expect(result.properties.foo.default).to.equal('<string>');
  });

  it('should return example value for ENUM property', function () {
    const contextTest = {
        concreteUtils,
        schemaCache: {},
        schemaFakerCache: {},
        computedOptions: {
          parametersResolution: 'example',
          stackLimit: 10,
          includeDeprecated: false
        }
      },
      schema = {
        'type': 'object',
        'properties': {
          'foo': {
            'type': 'string',
            'enum': [
              'primary',
              'secondary',
              'work',
              'personal',
              'other'
            ],
            'example': 'work'
          }
        }
      },
      result = resolveSchema(contextTest, schema, 0, 'conversion');

    expect(result.properties.foo.example).to.equal('work');
  });
});
