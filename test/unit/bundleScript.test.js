const dir = './tmp',
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  folders = [
    {
      path: path.join(__dirname, BUNDLES_FOLDER + '/nested_references_from_root_components'),
      folderName: 'nested_references_from_root_components',
      root: '/v1.yaml'
    },
    {
      path: path.join(__dirname, BUNDLES_FOLDER + '/local_references'),
      folderName: 'local_references',
      root: '/root.yaml'
    }
  ];

describe('bundle files from different folders', function () {

  const getAllFiles = function (dirPath, arrayOfFiles) {
    let files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
      if (fs.statSync(dirPath + '/' + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
      }
      else {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    });

    return arrayOfFiles;
  };

  it('Should return bundled file as json - schema_from_response', async function () {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    for (let index = 0; index < folders.length; index++) {
      const currentPath = folders[index].path,
        root = folders[index].root,
        folder = folders[index].folderName,
        outputDir = path.join(dir, folder);
      let input,
        res,
        data,
        arrayOfFiles = [];
      getAllFiles(currentPath, arrayOfFiles);
      data = arrayOfFiles.map((file) => {
        let fileName = '/' + file.split('/').reverse()[0],
          content = fs.readFileSync(file, 'utf8');
        return {
          path: fileName,
          content: content
        };
      });
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: root
          }
        ],
        data: data,
        options: {},
        bundleFormat: 'JSON'
      };
      res = await Converter.bundle(input);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      fs.writeFileSync(outputDir + '/bundled.json', res.output.data[0].bundledContent);

      Converter.convert({ type: 'string', data: res.output.data[0].bundledContent }, {}, (err, conversionResult) => {
        fs.writeFileSync(outputDir + '/coll.json', JSON.stringify(conversionResult.output[0].data));
      });
    }
  });
});
