#!/usr/bin/env node
var program = require('commander'),
  Converter = require('../index.js'),
  fs = require('fs'),
  path = require('path'),
  inputFile,
  outputFile,
  prettyPrintFlag,
  testFlag,
  swaggerInput,
  swaggerData;

program
  .version('0.0.1')
  .option('-s, --spec <spec>', 'Convert given OPENAPI 3.0.0 spec to Postman Collection v2.0')
  .option('-o, --output <output>', 'Write the collection to an output file')
  .option('-t, --test', 'Test the OPENAPI converter')
  .option('-p, --pretty', 'Pretty print the JSON file');


program.on('--help', function() {
  /* eslint-disable */
  console.log('    Converts a given OPENAPI specification to POSTMAN Collections v2.1.0   ');
  console.log(' ');
  console.log('    Examples:');
  console.log(' 		Read spec.yaml or spec.json and store the output in output.json after conversion     ');
  console.log('	           ./openapi2postmanv2 -s spec.yaml -o output.json ');
  console.log(' ');
  console.log('	        Read spec.yaml or spec.json and print the output to the Console        ');
  console.log('                   ./openapi2postmanv2 -s spec.yaml ');
  console.log(' ');
  console.log('                Read spec.yaml or spec.json and print the prettified output to the Console');
  console.log('                  ./openapi2postmanv2 -s spec.yaml -p');
  console.log(' ');
  /* eslint-enable */
});

program.parse(process.argv);

inputFile = program.spec;
outputFile = program.output || false;
testFlag = program.test || false;
prettyPrintFlag = program.pretty || false;
swaggerInput;
swaggerData;


/**
 * Helper function for the CLI to perform file writes based on the flags
 * @param {Boolean} prettyPrintFlag - flag for pretty printing while writing the file
 * @param {String} file - Destination file to which the write is to be performed
 * @param {Object} collection - POSTMAN collection object
 * @returns {void}
 */
function writetoFile(prettyPrintFlag, file, collection) {
  if (prettyPrintFlag) {
    fs.writeFile(file, JSON.stringify(collection, null, 4), (err) => {
      if (err) { console.log('Could not write to file', err); }
      console.log('Conversion successful', 'Collection written to file');
    });
  }
  else {
    fs.writeFile(file, JSON.stringify(collection), (err) => {
      if (err) { console.log('Could not write to file', err); }
      console.log('Conversion successful', 'Collection written to file');
    });
  }
}

/**
 * Helper function for the CLI to convert swagger data input
 * @param {String} swaggerData - swagger data used for conversion input
 * @returns {void}
 */
function convert(swaggerData) {
  Converter.convert({
    type: 'string',
    data: swaggerData
  }, {}, (err, status) => {
    if (err) {
      return console.error(err);
    }
    if (!status.result) {
      console.log(status.reason); // eslint-disable-line no-console
      process.exit(0);
    }
    else if (outputFile) {
      let file = path.resolve(outputFile);
      console.log('Writing to file: ', prettyPrintFlag, file, status); // eslint-disable-line no-console
      writetoFile(prettyPrintFlag, file, status.output[0].data);
    }
    else {
      console.log(status.output[0].data); // eslint-disable-line no-console
      process.exit(0);
    }
  });
}

if (testFlag) {
  swaggerData = fs.readFileSync('../examples/sample-swagger.yaml', 'utf8');
  convert(swaggerData);
}
else if (inputFile) {
  inputFile = path.resolve(inputFile);
  console.log('Input file: ', inputFile); // eslint-disable-line no-console
  // The last commit removed __dirname while reading inputFile
  // this will fix https://github.com/postmanlabs/openapi-to-postman/issues/4
  // inputFile should be read from the cwd, not the path of the executable
  swaggerData = fs.readFileSync(inputFile, 'utf8');
  convert(swaggerData);
}
else {
  program.emit('--help');
  process.exit(0);
}
