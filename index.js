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
  }
};
