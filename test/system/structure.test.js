let expect = require('chai').expect,
  getOptions = require('../../index').getOptions;

const optionIds = [
    'schemaFaker',
    'collapseFolders',
    'requestParametersResolution',
    'exampleParametersResolution',
    'folderStrategy',
    'indentCharacter',
    'requestNameSource'
  ],
  expectedOptions = {
    schemaFaker: {
      name: 'Toggle for faking schema',
      type: 'boolean',
      default: true,
      description: 'Option for Fake the schema using json or xml schema faker'
    },
    collapseFolders: {
      name: 'Toggle for collapsing folder for long routes',
      type: 'boolean',
      default: true,
      description: 'Collapse folders in case of long routes leading to unnecessary folders'
    },
    requestParametersResolution: {
      name: 'Set root request body type',
      type: 'string',
      default: 'schema',
      description: 'Option for setting root request body between schema or example'
    },
    exampleParametersResolution: {
      name: 'Set example request and response body type',
      type: 'string',
      default: 'example',
      description: 'Option for setting example request and response body between schema or example'
    },
    folderStrategy: {
      name: 'Set folder strategy',
      type: 'string',
      default: 'paths',
      description: 'Option for setting folder creating strategy between paths or tags'
    },
    indentCharacter: {
      name: 'Set indent character',
      type: 'string',
      default: ' ',
      description: 'Option for setting indentation character'
    },
    requestNameSource: {
      name: 'Set request name source',
      type: 'string',
      default: 'fallback',
      description: 'Option for setting source for a request name'
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

