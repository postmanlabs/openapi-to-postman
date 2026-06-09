const { getSpecVersion,
    filterOptionsByVersion,
    compareVersion,
    getVersionRegexBySpecificationVersion,
    validateSupportedVersion,
    getBundleRulesDataByVersion } = require('../../lib/common/versionUtils'),
  { RULES_32 } = require('../../lib/bundleRules/spec32'),
  { RULES_31 } = require('../../lib/bundleRules/spec31'),
  { RULES_30 } = require('../../lib/bundleRules/spec30'),
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

  it('Should resolve as 3.0 even if the provided spec contain spaces before version from a YAML input', function() {
    const inputData = 'openapi : 3.0.0' +
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

  it('Should resolve as 3.2 the provided spec version from a YAML input', function() {
    const inputData = 'openapi: 3.2.0' +
      'info:' +
      '  title: 3.2 sample' +
      '  version: 1.0.0' +
      'paths:' +
      '  /users:' +
      '    get:' +
      '      summary: List users',
      specVersion = getSpecVersion({ type: stringType, data: inputData });
    expect(specVersion).to.be.equal('3.2');
  });

  it('Should resolve as 3.2 even if the provided spec contains spaces before version from a YAML input', function() {
    const inputData = 'openapi :  \t"3.2.1"' +
      'info:' +
      '  title: 3.2 sample' +
      '  version: 1.0.0' +
      'paths:' +
      '  /users:' +
      '    get:' +
      '      summary: List users',
      specVersion = getSpecVersion({ type: stringType, data: inputData });
    expect(specVersion).to.be.equal('3.2');
  });

  it('Should resolve as 3.2 the provided spec version from a JSON input', function() {
    const inputData = {
        'openapi': '3.2.0',
        'info': {
          'title': '3.2 sample',
          'version': '1.0.0'
        },
        'paths': {
          '/users': {
            'get': { 'summary': 'List users' }
          }
        }
      },
      specVersion = getSpecVersion({ type: jsonType, data: inputData });
    expect(specVersion).to.be.equal('3.2');
  });

  it('Should resolve as 3.1 even if the provided spec contain spaces before version from a YAML input', function() {
    // Below data contains tabs and spaces before version field which is considered a valid YAML
    const inputData = 'openapi :  \t"3.1.0"' +
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

  it('Should resolve as 2.0 even if the provided spec contain spaces before version from a YAML input', function() {
    // Below data contains newline before version field which is considered a valid YAML
    const inputData = 'swagger  :\n "2.0"\n' +
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

  it('Should resolve as 3.0 even if the provided spec contain spaces before version from a JSON input', function() {
    const inputData = `{
        'openapi' :  '3.0.0',
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
      }`,
      specVersion = getSpecVersion({ type: stringType, data: inputData });
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

  it('Should resolve as 3.1 even if the provided spec contain spaces before version from a JSON input', function() {
    // Below data contains both tab and spaces after openapi field
    const inputData = `{
        'openapi'	 : '3.1.0',
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
      }`,
      specVersion = getSpecVersion({ type: stringType, data: inputData });
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

  it('Should resolve as 2.0 even if the provided spec contain spaces before version from a JSON input', function() {
    // Below data contains new line before version field which is a valid json
    const inputData = `{
        'swagger':
        '2.0',
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
      }`,
      specVersion = getSpecVersion({ type: stringType, data: inputData });
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
          supportedIn: ['3.1', '2.0'],
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

  it('Should return the options supported in version 3.2', function() {
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
          supportedIn: ['3.1'],
          default: 'A default value for option B'
        },
        {
          id: 'optionC',
          name: 'option C',
          supportedIn: ['3.1', '3.2'],
          default: 'A default value for option C'
        },
        {
          id: 'optionD',
          name: 'option D',
          supportedIn: ['3.0', '3.1', '3.2'],
          default: 'A default value for option D'
        }
      ],
      optionsFiltered = filterOptionsByVersion(optionsMock, '3.2');
    expect(optionsFiltered).to.be.an('array');
    expect(optionsFiltered.map((option) => {
      return option.id;
    })).to.include.members(['optionC', 'optionD']);
    expect(optionsFiltered.map((option) => {
      return option.id;
    })).to.not.include('optionA');
    expect(optionsFiltered.map((option) => {
      return option.id;
    })).to.not.include('optionB');
  });

  it('Should return the options supported in version 2.0', function() {
    const optionsMock = [
        {
          id: 'optionA',
          name: 'option A',
          supportedIn: ['2.0'],
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
          supportedIn: ['3.1', '2.0'],
          default: 'A default value for option C'
        },
        {
          id: 'optionD',
          name: 'option D',
          supportedIn: ['3.0', '3.1'],
          default: 'A default value for option D'
        }
      ],
      optionsFiltered = filterOptionsByVersion(optionsMock, '2.0');

    expect(optionsFiltered).to.be.an('array');
    expect(optionsFiltered.map((option) => {
      return option.id;
    })).to.include.members(['optionC', 'optionA']);
  });
});

describe('compareVersion method', function () {
  it('should return true when input and version are equal', function () {
    const result = compareVersion('3.0.0', '3.0.0');
    expect(result).to.be.true;
  });
  it('should return false when input and version are different', function () {
    const result = compareVersion('3.1.0', '3.0.0');
    expect(result).to.be.false;
  });
  it('should return true when input and version are semantically equal', function () {
    const result = compareVersion('3.0', '3.0.0');
    expect(result).to.be.true;
  });
  it('should return false when input is not a valid version string', function () {
    const result = compareVersion('invalid', '3.0.0');
    expect(result).to.be.false;
  });
  it('should return false when version is not a valid version string', function () {
    const result = compareVersion('3.0.0', 'invalid');
    expect(result).to.be.false;
  });
  it('should return false when version and input are not valid', function () {
    const result = compareVersion('invalid', 'invalid');
    expect(result).to.be.false;
  });
  it('should return true when input is 3.0.2 and version is 3.0.0', function () {
    const result = compareVersion('3.0.2', '3.0.0');
    expect(result).to.be.true;
  });
});

describe('getVersionRegexBySpecificationVersion method', function () {
  it('should return regex for 3.0', function () {
    const result = getVersionRegexBySpecificationVersion('3.0');
    expect(result.toString()).to.equal('/openapi[\'|\"]?\\s*:\\s*[\\]?[\'|\"]?3.0/');
  });
  it('should return regex for 3.0.0', function () {
    const result = getVersionRegexBySpecificationVersion('3.0.0');
    expect(result.toString()).to.equal('/openapi[\'|\"]?\\s*:\\s*[\\]?[\'|\"]?3.0/');
  });
  it('should return regex for 3.1', function () {
    const result = getVersionRegexBySpecificationVersion('3.1');
    expect(result.toString()).to.equal('/openapi[\'|\"]?\\s*:\\s*[\\]?[\'|\"]?3.1/');
  });
  it('should return regex for 3.2', function () {
    const result = getVersionRegexBySpecificationVersion('3.2');
    expect(result.toString()).to.equal('/openapi[\'|\"]?\\s*:\\s*[\\]?[\'|\"]?3.2/');
  });
  it('should return regex for 3.2.0', function () {
    const result = getVersionRegexBySpecificationVersion('3.2.0');
    expect(result.toString()).to.equal('/openapi[\'|\"]?\\s*:\\s*[\\]?[\'|\"]?3.2/');
  });
  it('should return regex for 2.0', function () {
    const result = getVersionRegexBySpecificationVersion('2.0');
    expect(result.toString()).to.equal('/swagger[\'|\"]?\\s*:\\s*[\\]?[\'|\"]?2.0/');
  });
  it('should return regex for 3.0 as default', function () {
    const result = getVersionRegexBySpecificationVersion('invalid');
    expect(result.toString()).to.equal('/openapi[\'|\"]?\\s*:\\s*[\\]?[\'|\"]?3.0/');
  });
});

describe('validateSupportedVersion method', function () {
  it('should return true with version 3.0', function () {
    const result = validateSupportedVersion('3.0');
    expect(result).to.be.true;
  });

  it('should return true with version 2.0', function () {
    const result = validateSupportedVersion('2.0');
    expect(result).to.be.true;
  });

  it('should return true with version 3.1', function () {
    const result = validateSupportedVersion('3.1');
    expect(result).to.be.true;
  });

  it('should return true with version 3.2', function () {
    const result = validateSupportedVersion('3.2');
    expect(result).to.be.true;
  });

  it('should return true with version 3.2.0', function () {
    const result = validateSupportedVersion('3.2.0');
    expect(result).to.be.true;
  });

  it('should return false with version "any"', function () {
    const result = validateSupportedVersion('any');
    expect(result).to.be.false;
  });

  it('should return false with version ""', function () {
    const result = validateSupportedVersion('');
    expect(result).to.be.false;
  });

  it('should return false with version undefined', function () {
    const result = validateSupportedVersion();
    expect(result).to.be.false;
  });
});

describe('getBundleRulesDataByVersion method', function () {
  it('should return the 3.2 rules for a 3.2 version', function () {
    expect(getBundleRulesDataByVersion('3.2')).to.equal(RULES_32);
    expect(getBundleRulesDataByVersion('3.2.0')).to.equal(RULES_32);
  });

  it('should return the 3.1 rules for a 3.1 version', function () {
    expect(getBundleRulesDataByVersion('3.1')).to.equal(RULES_31);
  });

  it('should return the 3.0 rules as the default', function () {
    expect(getBundleRulesDataByVersion('3.0')).to.equal(RULES_30);
  });

  it('should expose pathItems as a referenceable component in 3.2', function () {
    expect(RULES_32.COMPONENTS_KEYS).to.include('pathItems');
    expect(RULES_32.DEFINITIONS).to.have.property('paths', 'pathItems');
  });
});

