/* eslint-disable */

var Converter = require('./index.js'),
  fs = require('fs'),
  path = require('path'),
  // profiler = require('v8-profiler'),
  VALID_OPENAPI_PATH = 'spec.json',
  HISTORY_PATH = './test/data/validationData/history_obj.json',
  options = {
    folderStrategy: 'Tags',
    requestParametersResolution: 'Example',
    exampleParametersResolution: 'Example',
    optimizeConversion: false
  };

console.log('Connected -->');

// profiler.startProfiling('probe', true);
Converter.convert({ type: 'file', data: VALID_OPENAPI_PATH }, options, (err, result) => {
  if (err) {
    console.log(err);
  }
  if (!result.result) {
    console.log(result.reason);
  }
  result.result && fs.writeFileSync('collection.json', JSON.stringify(result.output[0].data, null, 2));
  console.log('DONEEEEE');
  // const profile = profiler.stopProfiling('probe');
  // profile.export((err, res) => {
  //   err && console.log('Error in export', err);
  //   fs.writeFileSync('profile', res);
  //   profile.delete();
  //   process.exit();
  // })
});

// console.log(Converter.validate({ type: 'string', data: fs.readFileSync(VALID_OPENAPI_PATH, 'utf-8') }));

// let schemaPack = new Converter.SchemaPack({ type: 'string', data: fs.readFileSync(VALID_OPENAPI_PATH, 'utf-8') });
// console.log(schemaPack.validated);