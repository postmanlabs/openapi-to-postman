const _ = require('lodash');

module.exports = {
  // default options
  // if mode=document, returns an array of name/id/default etc.

  /**
   * name - human-readable name for the option
   * id - key to pass the option with
   * type - boolean or enum for now
   * default - the value that's assumed if not specified
   * availableOptions - allowed values (only for type=enum)
   * description - human-readable description of the item
   * external - whether the option is settable via the API
   *
   * @param {string} [mode='document'] Describes use-case. 'document' will return an array
   * with all options being described. 'use' will return the default values of all options
   * @returns {mixed} An array or object (depending on mode) that describes available options
   */
  getOptions: function(mode = 'document') {
    let optsArray = [
      {
        name: 'Set request name source',
        id: 'requestNameSource',
        type: 'enum',
        default: 'fallback',
        availableOptions: ['url', 'fallback'],
        description: 'Option for setting source for a request name',
        external: true
      },
      {
        name: 'Set indent character',
        id: 'indentCharacter',
        type: 'enum',
        default: 'Space',
        availableOptions: ['Space', 'Tab'],
        description: 'Option for setting indentation character',
        external: true
      },
      {
        name: 'Toggle for collapsing folder for long routes',
        id: 'collapseFolders',
        type: 'boolean',
        default: true,
        description: 'Determines whether the importer should attempt to collapse redundant folders into one.' +
         ' Folders are redundant if they have only one child element, and don\'t' +
         ' have any folder-level data to persist.',
        external: true
      },
      {
        name: 'Set root request parameters type',
        id: 'requestParametersResolution',
        type: 'enum',
        default: 'schema',
        availableOptions: ['example', 'schema'],
        description: 'Determines how request parameters (query parameters, path parameters, headers, or the request' +
         ' body) should be generated. Setting this to schema will cause the importer to use parameter\'s' +
         ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject)' +
         ' as an indicator; example will cause the' +
         ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject)' +
         ' (if provided) to be picked up.',
        external: true
      },
      {
        name: 'Set example request and response parameters type',
        id: 'exampleParametersResolution',
        type: 'enum',
        default: 'example',
        availableOptions: ['example', 'schema'],
        description: 'Determines how response parameters (query parameters, path parameters, headers, or the response' +
        ' body) should be generated. Setting this to schema will cause the importer to use parameter\'s' +
        ' [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject)' +
        ' as an indicator; example will cause the' +
        ' [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject)' +
        ' (if provided) to be picked up.',
        external: true
      },
      {
        name: 'Set folder strategy',
        id: 'folderStrategy',
        type: 'enum',
        default: 'paths',
        availableOptions: ['paths', 'tags'],
        description: 'Determines whether the importer should attempt to create the folders according' +
         ' to paths or tags which are given in the spec.',
        external: true
      },
      {
        name: 'Enable Schema Faking',
        id: 'schemaFaker',
        type: 'boolean',
        default: true,
        description: 'Whether or not schemas should be faked.',
        external: false
      },
      {
        name: 'Short error messages during request <> schema validation',
        id: 'shortValidationErrors',
        type: 'boolean',
        default: false,
        description: 'Whether detailed error messages are required for request <> schema validation operations',
        external: false
      },
      {
        name: 'Properties to ignore during validation',
        id: 'validationPropertiesToIgnore',
        type: 'array',
        default: [],
        description: 'Specific properties (parts of a request/response pair) to ignore during validation.' +
          ' Must be sent as an array of strings. Valid inputs in the array: PATHVARIABLE, QUERYPARAM,' +
          ' HEADER, BODY, RESPONSE_HEADER, RESPONSE_BODY',
        external: false
      },
      {
        name: 'Whether MISSING_IN_SCHEMA mismatches should be returned',
        id: 'showMissingInSchemaErrors',
        type: 'boolean',
        default: false,
        description: 'MISSING_IN_SCHEMA indicates that an extra parameter was included in the request. For most ' +
          'use cases, this need not be considered an error.',
        external: false
      }
    ];

    if (mode === 'use') {
      // options to be used as default kv-pairs
      let defOptions = {};
      _.each(optsArray, (opt) => {
        // special handling for indent character as in documentation it states `Tab` and `Space`
        // but for the generation mode, we need actual values
        if (opt.id === 'indentCharacter') {
          defOptions[opt.id] = opt.default === 'Tab' ? '\t' : ' ';
        }
        else {
          defOptions[opt.id] = opt.default;
        }
      });
      return defOptions;
    }

    // options to be used as documentation
    return _.filter(optsArray, (opt) => {
      // only return options that are externally controllable
      return opt.external === true;
    });
  }
};
