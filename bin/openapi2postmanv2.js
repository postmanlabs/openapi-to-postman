#!/usr/bin/env node
var program = require('commander'),
		Converter = require('../index.js'),
		fs = require('fs'),
		path = require('path');

program
	.version('0.0.1')
	.option('-s, --spec <spec>', 'Convert given OPENAPI 3.0.0 spec to Postman Collection v2.0')
	.option('-o, --output <output>', 'Write the collection to an output file')
	.option('-t, --test', 'Test the OPENAPI converter')
	.option('-p, --pretty', 'Pretty print the JSON file');


program.on('--help', function() {
	console.log('    Converts a given OPENAPI specification to POSTMAN Collections v2.1.0   ');
	console.log(' ');
	console.log('    Examples:');
	console.log(' 		Read spec.yaml or spec.json and store the output in output.json after conversion     ');
	console.log('	           ./openapi2postmanv2 -s spec.yaml -o output.json ');
	console.log(' ');
	console.log('	        Read spec.yaml or spec.json and print the output to the console        ');
	console.log('                   ./openapi2postmanv2 -s spec.yaml ');
	console.log(' ');
	console.log('                Read spec.yaml or spec.json and print the prettified output to the console');
	console.log('                  ./openapi2postmanv2 -s spec.yaml -p');
	console.log(' ');
});

program.parse(process.argv);

var inputFile = program.spec,
		outputFile = program.output || false,
		testFlag = program.test || false,
		prettyPrintFlag = program.pretty || false,
    swaggerInput,
    swaggerData;


function writetoFile(prettyPrintFlag, file, collection){
	if(prettyPrintFlag){
		fs.writeFileSync(file, JSON.stringify(collection, null, 4), (err) => {
			if(err)
				console.log('Could not write to file',err);
			console.log('Conversion successful','Collection written to file');
		});
	} else {
		fs.writeFileSync(file, JSON.stringify(collection), (err) => {
			if(err)
				console.log('Could not write to file',err);
			console.log('Conversion successful','Collection written to file');
		});
	}
}

if(testFlag){
  swaggerInput = fs.readFileSync('../examples/sampleswagger.yaml', 'utf8');
  Converter.convert(swaggerInput, (status) => {
    if(!status.result){
      console.log(status.reason);
    } else {
        if(outputFile){
          let file = path.resolve(outputFile);
          writetoFile(prettyPrintFlag, file, status.collection);
        } else {
          console.log(status.collection);
          process.exit(0);
        }
    }
  });
} else {
		if(inputFile){
			inputFile = path.resolve(__dirname, inputFile);
			swaggerData = fs.readFileSync(inputFile),
      Converter.convert(swaggerData, (status) => {
        if(!status.result){
          console.log(status.reason);
          process.exit(0);
        } else {
          if(outputFile){
            let file = path.resolve(outputFile);
            writetoFile(prettyPrintFlag, file, status.collection);
          } else {
            console.log(status.collection);
            process.exit(0);
          }
        }
      });
		} else {
				program.emit('--help');
				process.exit(0);
		}
}