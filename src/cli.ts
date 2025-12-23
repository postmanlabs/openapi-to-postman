#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { convert as convertV1, convertV2, getOptions } from './index';
import type { ConversionOptions, ConversionCallback, PostmanCollectionDefinition } from './types';

// Get available options for validation
const availableOptions = getOptions('use', { usage: ['CONVERSION'] }) as Record<string, unknown>;

/**
 * Parses comma separated options mentioned in command args and generates JSON object
 */
function parseOptions(value: string): ConversionOptions {
  const definedOptions = value.split(',');
  const parsedOptions: Record<string, unknown> = {};

  definedOptions.forEach((definedOption) => {
    const option = definedOption.split('=');

    if (option.length === 2 && Object.keys(availableOptions).includes(option[0])) {
      try {
        // parse parsable data types (e.g. boolean, integer etc)
        parsedOptions[option[0]] = JSON.parse(option[1]);
      } catch {
        // treat value as string if can not be parsed
        parsedOptions[option[0]] = option[1];
      }
    } else {
      console.warn('\x1b[33m%s\x1b[0m', 'Warning: Invalid option supplied ', option[0]);
    }
  });

  /**
   * As v2 interface uses parametersResolution instead of previous requestParametersResolution option,
   * override value of parametersResolution if it's not defined and requestParametersResolution is defined
   */
  if ('requestParametersResolution' in parsedOptions && !('parametersResolution' in parsedOptions)) {
    parsedOptions.parametersResolution = parsedOptions.requestParametersResolution;
  }

  return parsedOptions as ConversionOptions;
}

/**
 * Writes collection to file with optional pretty printing
 */
function writeToFile(prettyPrint: boolean, filePath: string, collection: PostmanCollectionDefinition): void {
  const content = prettyPrint
    ? JSON.stringify(collection, null, 4)
    : JSON.stringify(collection);

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error('Could not write to file', err);
      process.exit(1);
    }
    console.log('\x1b[32m%s\x1b[0m', 'Conversion successful, collection written to file');
  });
}

/**
 * Main conversion function
 */
function convert(
  specData: string,
  options: ConversionOptions,
  outputFile: string | false,
  prettyPrint: boolean,
  interfaceVersion: string
): void {
  const convertFn: (
    input: { type: 'string'; data: string },
    options: ConversionOptions,
    callback: ConversionCallback
  ) => void = interfaceVersion === 'v1' ? convertV1 : convertV2;

  convertFn(
    { type: 'string', data: specData },
    options,
    (err, result) => {
      if (err) {
        return console.error(err);
      }

      if (!result || !result.result) {
        console.log(result?.reason || 'Conversion failed');
        process.exit(0);
      }

      const collection = result.output[0].data;

      if (outputFile) {
        const resolvedPath = path.resolve(outputFile);
        console.log('Writing to file: ', prettyPrint, resolvedPath, result);
        writeToFile(prettyPrint, resolvedPath, collection);
      } else {
        console.log(collection);
        process.exit(0);
      }
    }
  );
}

// Setup CLI program
const program = new Command();

program
  .version(require('../../package.json').version, '-v, --version')
  .option('-s, --spec <spec>', 'Convert given OPENAPI 3.0.0 spec to Postman Collection v2.0')
  .option('-o, --output <output>', 'Write the collection to an output file')
  .option('-t, --test', 'Test the OPENAPI converter')
  .option('-p, --pretty', 'Pretty print the JSON file')
  .option('-i, --interface-version <interfaceVersion>', 'Interface version of convert() to be used')
  .option('-c, --options-config <optionsConfig>', 'JSON file containing Converter options')
  .option('-O, --options <options>', 'comma separated list of options', parseOptions);

program.on('--help', () => {
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
});

program.parse(process.argv);

const opts = program.opts();
const inputFile = opts.spec as string | undefined;
const outputFile = (opts.output as string | undefined) || false;
const testFlag = opts.test as boolean || false;
const prettyPrintFlag = opts.pretty as boolean || false;
const interfaceVersion = (opts.interfaceVersion as string | undefined) || 'v2';
const configFile = opts.optionsConfig as string | undefined;
let definedOptions: ConversionOptions = (opts.options as ConversionOptions) || {};

// Main execution
let options: ConversionOptions = {};

// Apply options from config file if present
if (configFile) {
  const resolvedConfigPath = path.resolve(configFile);
  console.log('Options Config file: ', resolvedConfigPath);
  const configContent = fs.readFileSync(resolvedConfigPath, 'utf8');
  options = JSON.parse(configContent) as ConversionOptions;
}

// Override options provided via CLI
if (definedOptions && Object.keys(definedOptions).length > 0) {
  options = definedOptions;
}

if (testFlag) {
  const testSpecPath = path.resolve(__dirname, '..', '..', 'examples', 'sample-swagger.yaml');
  const specData = fs.readFileSync(testSpecPath, 'utf8');
  convert(specData, options, outputFile, prettyPrintFlag, interfaceVersion);
} else if (inputFile) {
  const resolvedInputPath = path.resolve(inputFile);
  console.log('Input file: ', resolvedInputPath);
  const specData = fs.readFileSync(resolvedInputPath, 'utf8');
  convert(specData, options, outputFile, prettyPrintFlag, interfaceVersion);
} else {
  program.emit('--help');
  process.exit(0);
}
