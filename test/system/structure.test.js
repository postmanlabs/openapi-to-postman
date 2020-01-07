let expect = require('chai').expect,
  getOptions = require('../../index').getOptions;

const optionIds = [
    'collapseFolders',
    'requestParametersResolution',
    'exampleParametersResolution',
    'folderStrategy',
    'indentCharacter',
    'requestNameSource',
    'validationPropertiesToIgnore',
    'showMissingInSchemaErrors'
  ],
  expectedOptions = {
    collapseFolders: {
      name: 'Toggle for collapsing folder for long routes',
      type: 'boolean',
      default: true,
      description: 'Determines whether the importer should attempt to collapse redundant folders into one.' +
       'Folders are redundant if they have only one child element, and don\'t' +
       'have any folder-level data to persist.'
    },
    requestParametersResolution: {
      name: 'Set root request parameters type',
      type: 'enum',
      default: 'schema',
      availableOptions: ['example', 'schema'],
      description: 'Determines how request parameters (query parameters, path parameters, headers,' +
       'or the request body) should be generated. Setting this to schema will cause the importer to' +
       'use the parameter\'s schema as an indicator; `example` will cause the example (if provided)' +
       'to be picked up.'
    },
    exampleParametersResolution: {
      name: 'Set example request and response parameters type',
      type: 'enum',
      default: 'example',
      availableOptions: ['example', 'schema'],
      description: 'Determines how response parameters (query parameters, path parameters, headers,' +
       'or the request body) should be generated. Setting this to schema will cause the importer to' +
       'use the parameter\'s schema as an indicator; `example` will cause the example (if provided)' +
       'to be picked up.'
    },
    folderStrategy: {
      name: 'Set folder strategy',
      type: 'enum',
      default: 'paths',
      availableOptions: ['paths', 'tags'],
      description: 'Determines whether the importer should attempt to create the folders according' +
       'to paths or tags which are given in the spec.'
    },
    indentCharacter: {
      name: 'Set indent character',
      type: 'enum',
      default: ' ',
      availableOptions: [' ', '\t'],
      description: 'Option for setting indentation character'
    },
    requestNameSource: {
      name: 'Set request name source',
      type: 'enum',
      default: 'fallback',
      availableOptions: ['url', 'uKnown', 'fallback'],
      description: 'Option for setting source for a request name'
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
});

