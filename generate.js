/* eslint-disable */
var Converter = require('./index.js'),
  fs = require('fs'),
  path = require('path'),
  // profiler = require('v8-profiler'),
  COLLECTION_PATH = './collection.json',
  schemaPack;

async function main () {
  let collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf-8')),
    result;

  schemaPack = new Converter.SchemaPack({ type: 'collection', data: collection }, {
    outputType: 'json',
    requireCommonProps: true,
    includeExamples: true,
    extractionLevels: 5
  });
  
  result = await schemaPack.convertToSpec();

  if (!result.result) {
    console.log(result);
  }
  else {
    result.result && fs.writeFileSync('openapi.yaml', JSON.stringify(result.output[0].data, null, 2));
  }
}

main();
