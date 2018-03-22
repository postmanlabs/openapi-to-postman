var Converter = require('./lib/convert.js'),
    fs = require('fs'),
    yaml = require('js-yaml'),
    file = fs.readFileSync('./examples/petstore-expanded.yaml'),
    data = yaml.safeLoad(file),
    refparser = require('json-schema-ref-parser'),
    log = require('console-emoji');

setTimeout(() => {
  log('\n\nPicking up all of your Swagger 3.0........ -> \n', 'red');
}, 50);

setTimeout(() => {
  log('Launching escape pods...\n\nFasten your seatbelts...\n', 'red');
},1000);

fs.writeFileSync('normal.json', JSON.stringify(data, null, 4), (err) => {
  if(err){
    console.log('not done');
  } else {
    console.log('done');
  }
});


Converter.convert(data, (status) => {
  if(!status.result){
    console.log(status.reason);
  } else {
    fs.writeFileSync('collection-file.json', JSON.stringify(status.collection, null, 4), (err) => {
      if(err){
        console.log('not done');
      } else {
        console.log('done');
      }
    });
  } 
});

setTimeout(() => {
  log('Collection created!\n', 'ok')
}, 3000);



setTimeout(() => {
  log('You may unbuckle your seatbelts now  :pray:\n\n','yellow');
}, 4000);



