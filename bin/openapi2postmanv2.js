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
  Console.log('    Converts a given OPENAPI specification to POSTMAN Collections v2.1.0   ');
  Console.log(' ');
  Console.log('    Examples:');
  Console.log(' 		Read spec.yaml or spec.json and store the output in output.json after conversion     ');
  Console.log('	           ./openapi2postmanv2 -s spec.yaml -o output.json ');
  Console.log(' ');
  Console.log('	        Read spec.yaml or spec.json and print the output to the Console        ');
  Console.log('                   ./openapi2postmanv2 -s spec.yaml ');
  Console.log(' ');
  Console.log('                Read spec.yaml or spec.json and print the prettified output to the Console');
  Console.log('                  ./openapi2postmanv2 -s spec.yaml -p');
  Console.log(' ');
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
    fs.writeFileSync(file, JSON.stringify(collection, null, 4), (err) => {
      if (err) { Console.log('Could not write to file', err); }
      Console.log('Conversion successful', 'Collection written to file');
    });
  }
  else {
    fs.writeFileSync(file, JSON.stringify(collection), (err) => {
      if (err) { Console.log('Could not write to file', err); }
      Console.log('Conversion successful', 'Collection written to file');
    });
  }
}

if (testFlag) {
  swaggerInput = fs.readFileSync('../examples/sampleswagger.yaml', 'utf8');
  Converter.convert(swaggerInput, (status) => {
    if (!status.result) {
      Console.log(status.reason);
    }
    else if (outputFile) {
      let file = path.resolve(outputFile);
      writetoFile(prettyPrintFlag, file, status.collection);
    }
    else {
      Console.log(status.collection);
      process.exit(0);
    }
  });
}
else if (inputFile) {
  inputFile = path.resolve(__dirname, inputFile);
  swaggerData = fs.readFileSync(inputFile);
  Converter.convert(swaggerData, (status) => {
    if (!status.result) {
      Console.log(status.reason);
      process.exit(0);
    }
    else if (outputFile) {
      let file = path.resolve(outputFile);
      writetoFile(prettyPrintFlag, file, status.collection);
    }
    else {
      Console.log(status.collection);
      process.exit(0);
    }
  });
}
else {
  program.emit('--help');
  process.exit(0);
}
