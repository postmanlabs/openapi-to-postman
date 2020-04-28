let expect = require('chai').expect,
  getOptions = require('../../index').getOptions;

const optionIds = [
    'collapseFolders',
    'requestParametersResolution',
    'exampleParametersResolution',
    'indentCharacter',
    'requestNameSource',
    'shortValidationErrors',
    'validationPropertiesToIgnore',
    'showMissingInSchemaErrors',
    'detailedBlobValidation'
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
    indentCharacter: {
      name: 'Set indent character',
      type: 'enum',
      default: 'Space',
      availableOptions: ['Space', 'Tab'],
      description: 'Option for setting indentation character'
    },
    requestNameSource: {
      name: 'Naming requests',
      type: 'enum',
      default: 'Fallback',
      availableOptions: ['Url', 'Fallback'],
      description: 'Determines how the requests inside the generated collection will be named.' +
      ' If “Fallback” is selected, the request will be named after one of the following schema' +
      ' values: `description`, `operationid`, `url`.'
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
    }
  };

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
    getOptions({ usage: ['CONVERSION'] }).forEach((option) => {
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

