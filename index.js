var converter = require('./lib/convert.js'),
  validate = require('./lib/validate.js'),
  parse = require('./lib/parse.js'),
  async = require('async'),
  _ = require('lodash'),
  fs = require('fs');

// options for oas-resolver
const OasResolverOptions = {
  resolve: true, // Resolve external references
  jsonSchema: true // Treat $ref like JSON Schema and convert to OpenAPI Schema Objects
};

module.exports = {
  convert: function(input, options, cb) {
    if (input.type === 'string' || input.type === 'json') {
      // no need for extra processing before calling the converter
      // string can be JSON or YAML
      return converter.convert(input.data, options, cb);
    }
    else if (input.type === 'file') {
      return fs.readFile(input.data, 'utf8', function(err, data) {
        if (err) {
          return cb(err);
        }

        // if the file contents were JSON or YAML
        return converter.convert(data, options, cb);
      });
    }
    else if (input.type === 'folder') {
      let filesPathArray = input.data,
        convertedSpecs = [],
        rootFiles = parse.getRootFiles(filesPathArray);

      async.eachSeries(rootFiles, (rootFile, callback) => {
        parse
        // will merge all the files in the folder
          .mergeFiles(rootFile, OasResolverOptions)
          .then((spec) => {
            converter.convert(spec, options, (err, result) => {
              if (err) {
                return callback(err);
              }
              convertedSpecs.push(result);
              return callback(null);
            });
          })
          .catch((err) => {
            return callback(err);
          });
      }, (err) => {

        if (err) {
          return cb({
            result: false,
            reason: 'input type:' + input.type + ' is not valid'
          });
        }

        var conversionResult = false,
          convertedCollections = [],
          reasonForFail;

        _.forEach(convertedSpecs, (convertedSpec) => {
          if (convertedSpec.result) {
            let result;
            conversionResult = conversionResult || convertedSpec.result;

            function returnCollection (resultSpec) {
              if (resultSpec.type === 'collection') {
                return true;
              }
            }

            // filtering out the collections from the convertedSpec
            result = convertedSpec.output.filter(returnCollection);
            convertedCollections.push(result[0]);
          }
          else {
            conversionResult = conversionResult || convertedSpec.result;
            reasonForFail = convertedSpec.reason;
          }
        });

        if (conversionResult) {
          return cb(null, {
            result: true,
            output: convertedCollections
          });
        }

        return cb(null, {
          result: false,
          reason: reasonForFail
        });
      });
    }
    // eslint-disable-next-line no-else-return
    else {
      return cb(null, {
        result: false,
        reason: 'input type:' + input.type + ' is not valid'
      });
    }
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
      else if (input.type === 'folder') {
        if (!_.isEmpty(parse.getRootFiles(input.data))) {
          return {
            result: true
          };
        }
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
    return converter.getOptions();
  }
};
