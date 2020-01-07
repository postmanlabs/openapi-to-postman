'use strict';

const SchemaPack = require('./lib/schemapack.js').SchemaPack;

// options for oas-resolver
const OasResolverOptions = {
  resolve: true, // Resolve external references
  jsonSchema: true // Treat $ref like JSON Schema and convert to OpenAPI Schema Objects
};

module.exports = {
  // Old API wrapping the new API
  convert: function(input, options, cb) {
    var schema = new SchemaPack(input, options);

    if (schema.validated) {
      return schema.convert(cb);
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
    var schema = new SchemaPack(input);
    return schema.validationResult;
  },

  getOptions: function() {
    return SchemaPack.getOptions();
  },

  // new API
  SchemaPack
};
