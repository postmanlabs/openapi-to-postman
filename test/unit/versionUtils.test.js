const { getSpecVersion, filterOptionsByVersion } = require('../../lib/common/versionUtils'),
  expect = require('chai').expect;

describe('getSpecVersion', function() {
  const stringType = 'string',
    jsonType = 'json';
  it('Should resolve as 3.0 the provided spec version from a YAML input', function() {
    const inputData = 'openapi: 3.0.0' +
      'info:' +
      '  version: 1.0.0' +
      '  title: Sample API' +
      '  description: A sample API to illustrate OpenAPI concepts' +
      'paths:' +
      '  /list:' +
      '    get:' +
      '      description: Returns a list of stuff' +
      '      responses:' +
      '        \'200\':' +
      '          description: Successful response',
      specVersion = getSpecVersion({ type: stringType, data: inputData });
    expect(specVersion).to.be.equal('3.0');
  });

  it('Should resolve as 3.1 the provided spec version from a YAML input', function() {
    const inputData = 'openapi: 3.1.0' +
      'info:' +
      '  title: Non-oAuth Scopes example' +
      '  version: 1.0.0' +
      'paths:' +
      '  /users:' +
      '    get:' +
      '      security:' +
      '        - bearerAuth:' +
      '            - \'read:users\'' +
      '            - \'public\'' +
      'components:' +
      '  securitySchemes:' +
      '    bearerAuth:' +
      '      type: http' +
      '      scheme: bearer' +
      '      bearerFormat: jwt' +
      '      description: \'note: non-oauth scopes are not defined at the securityScheme level\'',
      specVersion = getSpecVersion({ type: stringType, data: inputData });
    expect(specVersion).to.be.equal('3.1');
  });

  it('Should resolve as 2.0 the provided spec version from a YAML input', function() {
    const inputData = 'swagger: "2.0"' +
      'info:' +
      '  version: 1.0.0' +
      '  title: Swagger Petstore' +
      '  license:' +
      '    name: MIT' +
      'host: petstore.swagger.io' +
      'basePath: /v1' +
      'schemes:' +
      '  - http' +
      'consumes:' +
      '  - application/json' +
      'produces:' +
      '  - application/json' +
      'paths:' +
      '  /pets:' +
      '    get:' +
      '      summary: List all pets' +
      '      operationId: listPets' +
      '      tags:' +
      '        - pets',
      specVersion = getSpecVersion({ type: stringType, data: inputData });
    expect(specVersion).to.be.equal('2.0');
  });

  it('Should resolve as 3.0 the provided spec version from a JSON input', function() {
    const inputData = {
        'openapi': '3.0.0',
        'info': {
          'version': '1.0.0',
          'title': 'Sample API',
          'description': 'A sample API to illustrate OpenAPI concepts'
        },
        'paths': {
          '/users': {
            'get': {
              'security': [
                {
                  'bearerAuth': [
                    'read:users',
                    'public'
                  ]
                }
              ]
            }
          }
        }
      },
      specVersion = getSpecVersion({ type: jsonType, data: inputData });
    expect(specVersion).to.be.equal('3.0');
  });

  it('Should resolve as 3.1 the provided spec version from a JSON input', function() {
    const inputData = {
        'openapi': '3.1.0',
        'info': {
          'title': 'Non-oAuth Scopes example',
          'version': '1.0.0'
        },
        'paths': {
          '/users': {
            'get': {
              'security': [
                {
                  'bearerAuth': [
                    'read:users',
                    'public'
                  ]
                }
              ]
            }
          }
        },
        'components': {
          'securitySchemes': {
            'bearerAuth': {
              'type': 'http',
              'scheme': 'bearer',
              'bearerFormat': 'jwt',
              'description': 'note: non-oauth scopes are not defined at the securityScheme level'
            }
          }
        }
      },
      specVersion = getSpecVersion({ type: jsonType, data: inputData });
    expect(specVersion).to.be.equal('3.1');
  });

  it('Should resolve as 2.0 the provided spec version from a JSON input', function() {
    const inputData = {
        'swagger': '2.0',
        'info': {
          'version': '1.0.0',
          'title': 'Swagger Petstore',
          'license': {
            'name': 'MIT'
          }
        },
        'host': 'petstore.swagger.io',
        'basePath': '/v1',
        'schemes': [
          'http'
        ],
        'consumes': [
          'application/json'
        ],
        'produces': [
          'application/json'
        ],
        'paths': {
          '/pets': {
            'get': {
              'summary': 'List all pets',
              'operationId': 'listPets',
              'tags': [
                'pets'
              ]
            }
          }
        }
      },
      specVersion = getSpecVersion({ type: jsonType, data: inputData });
    expect(specVersion).to.be.equal('2.0');
  });
});

describe('filterOptionsByVersion method', function() {
  it('Should return the options supported in version 3.1', function() {
    const optionsMock = [
        {
          id: 'optionA',
          name: 'option A',
          supportedIn: ['3.0'],
          default: 'A default value for option A'
        },
        {
          id: 'optionB',
          name: 'option B',
          supportedIn: ['3.0'],
          default: 'A default value for option B'
        },
        {
          id: 'optionC',
          name: 'option C',
          supportedIn: ['3.1'],
          default: 'A default value for option C'
        },
        {
          id: 'optionD',
          name: 'option D',
          supportedIn: ['3.0', '3.1'],
          default: 'A default value for option D'
        }
      ],
      optionsFiltered = filterOptionsByVersion(optionsMock, '3.1');
    expect(optionsFiltered).to.be.an('array');
    expect(optionsFiltered.map((option) => {
      return option.id;
    })).to.include.members(['optionC', 'optionD']);
  });

  it('Should return the options supported in version 3.0', function() {
    const optionsMock = [
        {
          id: 'optionA',
          name: 'option A',
          supportedIn: ['3.0'],
          default: 'A default value for option A'
        },
        {
          id: 'optionB',
          name: 'option B',
          supportedIn: ['3.0'],
          default: 'A default value for option B'
        },
        {
          id: 'optionC',
          name: 'option C',
          supportedIn: ['3.1'],
          default: 'A default value for option C'
        },
        {
          id: 'optionD',
          name: 'option D',
          supportedIn: ['3.0', '3.1'],
          default: 'A default value for option D'
        }
      ],
      optionsFiltered = filterOptionsByVersion(optionsMock, '3.0');
    expect(optionsFiltered).to.be.an('array');
    expect(optionsFiltered.map((option) => {
      return option.id;
    })).to.include.members(['optionA', 'optionB', 'optionD']);
  });
});
