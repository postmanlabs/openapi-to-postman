/* eslint-disable */

const { Collection } = require('postman-collection');

var Converter = require('./index.js'),
  fs = require('fs'),
  path = require('path'),
  memoryUsage = require('process').memoryUsage,
  // profiler = require('v8-profiler'),
  VALID_OPENAPI_PATH = 'spec',
  COLLECTION_PATH = 'collection.json',
  options = {
    folderStrategy: 'Paths',
    // parametersResolution: 'Schema',
    parametersResolution: 'Example',
    includeDeprecated: false,

    // requestParametersResolution: 'Schema',
    // exampleParametersResolution: 'Schema',
    stackLimit: 8,
    // keepImplicitHeaders: true,
    // enableOptionalParameters: false,
    optimizeConversion: false
  },
  startTime;

console.log('Connected -->');

startTime = new Date();

// profiler.startProfiling('probe', true);
Converter.convertV2({ type: 'file', data: VALID_OPENAPI_PATH }, options, (err, result) => {
  console.log(new Date() - startTime);
  let col;
  if (err) {
    console.log(err);
    return;
  }
  if (!result.result) {
    console.log(result);
    return;
  }
  // console.log(memoryUsage());
  // fs.writeFileSync('collection.json', JSON.stringify(result, null, 2));


  const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

  const memoryData = process.memoryUsage();

  const memoryUsage = {
    rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
    heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
    heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
    external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
  };

  console.log(memoryUsage);

  console.log('Converted, writing to file');
  result.result && fs.writeFileSync('collection.json', JSON.stringify(result.output[0].data, null, 2));

  // col = new Collection(result.output[0].data);
  // result.result && fs.writeFileSync('collectionToJSON.json', JSON.stringify(col.toJSON(), null, 2));
  console.log('DONE');
  // const profile = profiler.stopProfiling('probe');
  // profile.export((err, res) => {
  //   err && console.log('Error in export', err);
  //   fs.writeFileSync('profile', res);
  //   profile.delete();
  //   process.exit();
  // })
});

// console.log(Converter.validate({ type: 'string', data: fs.readFileSync(COLLECTION_PATH, 'utf-8') }));
