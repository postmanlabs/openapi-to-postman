let fs = require('fs'),
  _ = require('lodash'),
  expect = require('chai').expect,
  getOptions = require('../../index').getOptions;

const optionIds = [
    'collapseFolders',
    'requestParametersResolution',
    'exampleParametersResolution',
    'folderStrategy',
    'indentCharacter',
    'requestNameSource',
    'schemaFaker',
    'stackLimit',
    'includeAuthInfoInExample',
    'shortValidationErrors',
    'validationPropertiesToIgnore',
    'showMissingInSchemaErrors',
    'detailedBlobValidation',
    'suggestAvailableFixes',
    'validateMetadata',
    'ignoreUnresolvedVariables',
    'optimizeConversion',
    'strictRequestMatching',
    'enableOptionalParameters',
    'keepImplicitHeaders',
    'includeWebhooks',
    'allowUrlPathVarMatching',
    'includeReferenceMap',
    'includeDeprecated',
    'parametersResolution',
    'disabledParametersValidation',
    'alwaysInheritAuthentication',
    'preferredRequestBodyType'
  ],
  expectedOptions = {
    collapseFolders: {
      name: 'Collapse redundant folders',
      type: 'boolean',
      default: true,
      description: 'Importing will collapse all folders that have only one child element and lack ' +
        'persistent folder-level data.'
    },
    requestParametersResolution: {
      name: 'Request parameter generation',
      type: 'enum',
      default: 'Schema',
      availableOptions: ['Example', 'Schema'],
      description: 'Select whether to generate the request parameters based on the' +
        ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject) or the' +
        ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject)' +
        ' in the schema.'
    },
    exampleParametersResolution: {
      name: 'Response parameter generation',
      type: 'enum',
      default: 'Example',
      availableOptions: ['Example', 'Schema'],
      description: 'Select whether to generate the response parameters based on the' +
        ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject) or the' +
        ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject)' +
        ' in the schema.'
    },
    folderStrategy: {
      name: 'Folder organization',
      type: 'enum',
      default: 'Paths',
      availableOptions: ['Paths', 'Tags'],
      description: 'Select whether to create folders according to the spec’s paths or tags.'
    },
    optimizeConversion: {
      name: 'Optimize conversion',
      id: 'optimizeConversion',
      type: 'boolean',
      default: true,
      description: 'Optimizes conversion for large specification, disabling this option might affect' +
        ' the performance of conversion.'
    },
    indentCharacter: {
      name: 'Set indent character',
      type: 'enum',
      default: 'Space',
      availableOptions: ['Space', 'Tab'],
      description: 'Option for setting indentation character.'
    },
    requestNameSource: {
      name: 'Naming requests',
      type: 'enum',
      default: 'Fallback',
      availableOptions: ['Url', 'Fallback'],
      description: 'Determines how the requests inside the generated collection will be named.' +
        ' If “Fallback” is selected, the request will be named after one of the following schema' +
        ' values: `summary`, `operationId`, `description`, `url`.'
    },
    schemaFaker: {
      name: 'Enable Schema Faking',
      type: 'boolean',
      default: true,
      description: 'Whether or not schemas should be faked.'
    },
    stackLimit: {
      name: 'Schema resolution nesting limit',
      type: 'integer',
      default: 10,
      description: 'Number of nesting limit till which schema resolution will happen. Increasing this limit may' +
        ' result in more time to convert collection depending on complexity of specification. (To make sure this' +
        ' option works correctly "optimizeConversion" option needs to be disabled)'
    },
    includeAuthInfoInExample: {
      name: 'Include auth info in example requests',
      type: 'boolean',
      default: true,
      description: 'Select whether to include authentication parameters in the example request.'
    },
    shortValidationErrors: {
      name: 'Short error messages during request <> schema validation',
      type: 'boolean',
      default: false,
      description: 'Whether detailed error messages are required for request <> schema validation operations.'
    },
    validationPropertiesToIgnore: {
      name: 'Properties to ignore during validation',
      type: 'array',
      default: [],
      description: 'Specific properties (parts of a request/response pair) to ignore during validation.' +
        ' Must be sent as an array of strings. Valid inputs in the array: PATHVARIABLE, QUERYPARAM,' +
        ' HEADER, BODY, RESPONSE_HEADER, RESPONSE_BODY'
    },
    showMissingInSchemaErrors: {
      name: 'Whether MISSING_IN_SCHEMA mismatches should be returned',
      type: 'boolean',
      default: false,
      description: 'MISSING_IN_SCHEMA indicates that an extra parameter was included in the request. For most ' +
        'use cases, this need not be considered an error.'
    },
    detailedBlobValidation: {
      name: 'Show detailed body validation messages',
      id: 'detailedBlobValidation',
      type: 'boolean',
      default: false,
      description: 'Determines whether to show detailed mismatch information for application/json content ' +
        'in the request/response body.'
    },
    suggestAvailableFixes: {
      name: 'Suggest fixes if available',
      type: 'boolean',
      default: false,
      description: 'Whether to provide fixes for patching corresponding mismatches.'
    },
    validateMetadata: {
      name: 'Show Metadata validation messages',
      type: 'boolean',
      default: false,
      description: 'Whether to show mismatches for incorrect name and description of request'
    },
    ignoreUnresolvedVariables: {
      name: 'Ignore mismatch for unresolved postman variables',
      type: 'boolean',
      default: false,
      description: 'Whether to ignore mismatches resulting from unresolved variables in the Postman request'
    },
    strictRequestMatching: {
      name: 'Enable strict request matching',
      type: 'boolean',
      default: false,
      description: 'Whether requests should be strictly matched with schema operations. Setting to true will not ' +
        'include any matches where the URL path segments don\'t match exactly.'
    },
    enableOptionalParameters: {
      name: 'Enable optional parameters',
      type: 'boolean',
      default: true,
      description: 'Optional parameters aren\'t selected in the collection. ' +
        'Once enabled they will be selected in the collection and request as well.'
    },
    keepImplicitHeaders: {
      name: 'Keep implicit headers',
      type: 'boolean',
      default: false,
      description: 'Whether to keep implicit headers from the OpenAPI specification, which are removed by default.',
      external: true,
      usage: ['CONVERSION']
    },
    allowUrlPathVarMatching: {
      name: 'Allow matching of Path variables present in URL',
      type: 'boolean',
      default: false,
      description: 'Whether to allow matching path variables that are available as part of URL itself ' +
        'in the collection request'
    },
    includeReferenceMap: {
      name: 'Include Reference map',
      type: 'boolean',
      default: false,
      description: 'Whether or not to include reference map or not as part of output',
      external: false,
      usage: ['BUNDLE']
    },
    includeDeprecated: {
      name: 'Include deprecated properties',
      type: 'boolean',
      default: true,
      description: 'Select whether to include deprecated operations, parameters, and properties' +
        ' in generated collection or not',
      external: true,
      usage: ['CONVERSION']
    },
    parametersResolution: {
      name: 'Parameter generation',
      type: 'enum',
      default: 'Schema',
      availableOptions: ['Example', 'Schema'],
      description: 'Select whether to generate the request and response parameters based on the' +
        ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject) or the' +
        ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject)' +
        ' in the schema.',
      external: true,
      usage: ['CONVERSION']
    },
    disabledParametersValidation: {
      name: 'Disabled Parameter validation',
      type: 'boolean',
      default: true,
      description: 'Whether disabled parameters of collection should be validated',
      external: false,
      usage: ['VALIDATION']
    },
    alwaysInheritAuthentication: {
      name: 'Always inherit authentication',
      type: 'boolean',
      default: false,
      description: 'Whether authentication details should be included on every request, or always inherited from ' +
        'the collection.',
      external: true,
      usage: ['CONVERSION']
    }, preferredRequestBodyType: {
      name: 'Select request body type',
      type: 'enum',
      default: 'first-listed',
      availableOptions: ['x-www-form-urlencoded', 'form-data', 'raw', 'first-listed'],
      description: 'When there are multiple content-types defined in the request body of OpenAPI, the conversion ' +
        'selects the preferred option content-type as request body.If "first-listed" is set, the first ' +
        'content-type defined in the OpenAPI spec will be selected.',
      external: false,
      usage: ['CONVERSION']
    }
  };

/**
 * Generates markdown table documentation of options from getOptions()
 *
 * @param {Object} options - options from getOptions()
 * @returns {String} - markdown table consisting documetation for options
 */
function generateOptionsDoc (options) {
  var doc = 'id|type|available options|default|description|usage|version\n|---|---|---|---|---|---|---|\n';

  _.forEach(options, (option) => {
    var convertArrayToDoc = (array) => {
        return _.reduce(array, (acc, ele) => {
          return (_.isEmpty(acc) ? acc : acc + ', ') + ele;
        }, '') || '-';
      },
      defaultOption = option.default;

    // override empty values with stringified equivalent to represent correctly in README
    (_.isEmpty(defaultOption)) && (defaultOption = JSON.stringify(defaultOption));

    doc += `${option.id}|${option.type}|${convertArrayToDoc(option.availableOptions, true)}|` +
      `${defaultOption}|${option.description}|${convertArrayToDoc(option.usage)}|` +
      `${convertArrayToDoc(option.supportedModuleVersion)}\n`;
  });
  return doc;
}

describe('getOptions', function() {
  let options = getOptions();

  it('must be a valid id and should be present in the whitelist of options id', function () {
    options.forEach((option) => {
      expect(option.id).to.be.oneOf(optionIds);
    });
  });

  it('must have a valid structure', function () {
    options.forEach((option) => {
      expect(option).to.have.property('name');
      expect(option).to.have.property('id');
      expect(option).to.have.property('type');
      expect(option).to.have.property('default');
      expect(option).to.have.property('description');
    });
  });

  it('must have consistent type, description and name', function () {
    options.forEach((option) => {
      if (expectedOptions[option.id]) {
        expect(option).to.have.property('description');
        expect(option.name).to.be.eql(expectedOptions[option.id].name);
        expect(option.type).to.be.eql(expectedOptions[option.id].type);
        expect(option.description).to.be.eql(expectedOptions[option.id].description);
      }
      else {
        console.warn(`Option ${option.name} not present in the list of expected options.`);
      }
    });
  });

  it('must return all valid options based on criteria', function () {
    getOptions({ external: true, usage: ['CONVERSION'] }).forEach((option) => {
      expect(option.id).to.be.oneOf(optionIds);
      expect(option.usage).to.include('CONVERSION');
    });

    getOptions({ external: true, usage: ['VALIDATION'] }).forEach((option) => {
      expect(option.id).to.be.oneOf(optionIds);
      expect(option.external).to.eql(true);
      expect(option.usage).to.include('VALIDATION');
    });
  });
});

describe('OPTIONS.md', function() {
  it('must contain all details of options', function () {
    const optionsDoc = fs.readFileSync('OPTIONS.md', 'utf-8'),
      v1Options = getOptions(undefined, { moduleVersion: 'v1' }),
      v2Options = getOptions(undefined, { moduleVersion: 'v2' }),
      allOptions = _.uniqBy(_.concat(v1Options, v2Options), 'id');

    expect(optionsDoc).to.eql(generateOptionsDoc(allOptions));
  });
});
