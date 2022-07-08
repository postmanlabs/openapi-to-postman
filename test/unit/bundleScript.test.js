const dir = './tmp',
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  folders = [
    {
      path: path.join(__dirname, BUNDLES_FOLDER + '/azure'),
      folderName: 'azure',
      root: path.join(__dirname, BUNDLES_FOLDER + '/azure/Users.json'),
      root2: path.join(__dirname, BUNDLES_FOLDER + '/azure/VirtualMachines.json'),
      root3: path.join(__dirname, BUNDLES_FOLDER + '/azure/Schedules.json')
    },
    // {
    //   path: path.join(__dirname, BUNDLES_FOLDER + '/local_references'),
    //   folderName: 'local_references',
    //   root: path.join(__dirname, BUNDLES_FOLDER + '/local_references/root.yaml')
    // }
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

  it('Should return bundled file as json', async function () {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    for (let index = 0; index < folders.length; index++) {
      const currentPath = folders[index].path,
        root = folders[index].root,
        root2 = folders[index].root2,
        root3 = folders[index].root3,
        folder = folders[index].folderName,
        outputDir = path.join(dir, folder);
      let input,
        res,
        data,
        arrayOfFiles = [];
      getAllFiles(currentPath, arrayOfFiles);
      data = arrayOfFiles.map((file) => {
        let content = fs.readFileSync(file, 'utf8');
        return {
          path: file,
          content: content
        };
      });
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          // {
          //   path: root
          // }
        ],
        data: data,
        options: {},
        bundleFormat: 'JSON'
      };
      res = await Converter.bundle(input);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      res.output.data.forEach((bundled) => {
        let rootName = bundled.rootFile.path.split('/').reverse()[0];
        fs.writeFileSync(outputDir + `/${rootName}-bundled.json`,
          JSON.stringify(JSON.parse(bundled.bundledContent), null, 2));

        Converter.convert({ type: 'string', data: bundled.bundledContent }, {}, (err, conversionResult) => {
          if (conversionResult.result) {
            fs.writeFileSync(outputDir + `/${rootName}-coll.json`,
              JSON.stringify(conversionResult.output[0].data, null, 2));
          }
        });
      });
    }
  });

  it('Should return root', async function () {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    for (let index = 0; index < folders.length; index++) {
      const currentPath = folders[index].path,
        folder = folders[index].folderName,
        outputDir = path.join(dir, folder);
      let input,
        data,
        res,
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
        data: data
      };
      res = await Converter.detectRootFiles(input);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
      fs.writeFileSync(outputDir + '/root.json', JSON.stringify(res, null, 2));
    }
  });
});
