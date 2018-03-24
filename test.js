var Converter = require('./lib/convert.js'),
    fs = require('fs'),
    yaml = require('js-yaml'),
    file = fs.readFileSync('./examples/petstore-expanded.yaml'),
    data = yaml.safeLoad(file),
    refparser = require('json-schema-ref-parser'),
    log = require('console-emoji');

setTimeout(() => {
  log('\n\nImma take all your swagger....Ha! :sunglasses:\n', 'red');
}, 50);

setTimeout(() => {
  log('Launching escape pods... :rocket:', 'red');
},1000);

setTimeout(() => {
  log('\nFasten your seatbelts... :seat:\n', 'red');
},2000)

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
    setTimeout(() => {
      log('Collection created!\n', 'ok')
    }, 4000);    

    setTimeout(() => {
      log('You may unbuckle your seatbelts now  :pray:\n\n','yellow');
    }, 5000);    
  } 
});




