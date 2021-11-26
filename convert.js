/* eslint-disable no-console */
const fs = require('fs');
const yaml = require('js-yaml');

const Converter = require('./index');
const args = require('minimist')(process.argv.slice(2));
const openapiData = fs.readFileSync(args['schema_path'], { encoding: 'UTF8' });
let jsonOpenapiData = yaml.safeLoad(openapiData);

  targetTag = args.tag;
let resource = '';

// --tagの指定がなければ全endpoint変換対象にする
if (targetTag) {
  resource = targetTag.split(' ').join('_').toLowerCase();
  const re = new RegExp(resource, 'g'),
    targetPathKeys = Object.keys(jsonOpenapiData.paths).filter((path) => { return path.match(re); });

  // 上含め書き方はかなり気に入らんが対象のpathだけとりだす
  let targetPaths = {};
  targetPathKeys.forEach((key) => { return targetPaths[key] = jsonOpenapiData.paths[key]; });
  jsonOpenapiData.paths = targetPaths;

  // 対象以外のtagも消す
  let targetTags = [];
  targetTags = jsonOpenapiData.tags.filter((tag) => { return tag.name === targetTag; });
  jsonOpenapiData.tags = targetTags;
}

Converter.convert({ type: 'json', data: jsonOpenapiData },
  {
    folderStrategy: 'tags',
    requestParametersResolution: 'example'
  }, (err, conversionResult) => {
    if (!conversionResult.result) {
      console.log('Could not convert', conversionResult.reason);
    }
    else {
      const outputData = JSON.stringify(conversionResult.output[0].data);
      const fileName = resource !== '' ? resource : 'collection';
      fs.writeFile(`${fileName}.json`, outputData.replace(/\\"{{company_id}}\\"/gm, '{{company_id}}'), (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
      console.log(`${fileName}.json was created`);
    }
  }
);


