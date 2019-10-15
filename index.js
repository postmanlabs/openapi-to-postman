var convert = require('./lib/convert.js'),
  validate = require('./lib/validate.js'),
  fs = require('fs');

module.exports = {
  convert: function(input, options, cb) {
    if (input.type === 'string' || input.type === 'json') {
      // no need for extra processing before calling the converter
      // string can be JSON or YAML
      return convert(input.data, options, cb);
    }
    else if (input.type === 'file') {
      return fs.readFile(input.data, 'utf8', function(err, data) {
        if (err) {
          return cb(err);
        }

        // if the file contents were JSON or YAML
        return convert(data, options, cb);
      });
    }
    return cb(null, {
      result: false,
      reason: 'input type:' + input.type + ' is not valid'
    });
  },

  validate: function(input) {
    try {
      var data;
      if (input.type === 'string') {
        return validate(input.data);
      }
      else if (input.type === 'json') {
        return validate(input.data);
      }
      else if (input.type === 'file') {
        data = fs.readFileSync(input.data).toString();
        return validate(data);
      }
      return {
        result: false,
        reason: 'input type is not valid'
      };
    }
    catch (e) {
      return {
        result: false,
        reason: e.toString()
      };
    }
  },

  getOptions: function() {
    return [
      {
        name: 'Fake schema',
        id: 'schemaFaker',
        type: 'boolean',
        default: true,
        description: 'Fake the schema using json or xml schema faker'
      },
      {
        name: 'Collapse folder for long routes',
        id: 'collapseLongFolders',
        type: 'boolean',
        default: true,
        description: 'Collapse folders in case of long routes leading to unnecessary folders'
      },
      {
        name: 'Set root request body type',
        id: 'rootRequestBodyType',
        type: 'string',
        default: 'schema',
        description: 'Option for setting root request body between schema or example'
      },
      {
        name: 'Set example request and response body type',
        id: 'exampleBodyType',
        type: 'string',
        default: 'example',
        description: 'Option for setting example request and response body between schema or example'
      },
      {
        name: 'Set folder strategy',
        id: 'folderStrategy',
        type: 'string',
        default: 'paths',
        description: 'Option for setting folder creating strategy between paths or tags'
      },
      {
        name: 'Set indent character',
        id: 'indentCharacter',
        type: 'string',
        default: ' ',
        description: 'Option for setting indentation character'
      },
      {
        name: 'Set request name source',
        id: 'requestNameSource',
        type: 'string',
        default: 'fallback',
        description: 'Option for setting source for a request name'
      }
    ];
  }
};
