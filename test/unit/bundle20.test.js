const expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  SWAGGER_MULTIFILE_FOLDER = '../data/toBundleExamples/swagger20',
  basicExample = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/basicExample'),
  nestedRefs = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/nestedRefs'),
  nestedLocalRef = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/nestedLocalRef'),
  withParametersAndItems = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/withParametersAndItems'),
  simpleRef = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/simpleRef');

describe('bundle files method - 2.0', function() {
  it('Should return bundled result from - withParametersAndItems', async function() {
    let contentRootFile = fs.readFileSync(withParametersAndItems + '/index.yaml', 'utf8'),
      info = fs.readFileSync(withParametersAndItems + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(withParametersAndItems + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(withParametersAndItems + '/pet.yaml', 'utf8'),
      parameters = fs.readFileSync(withParametersAndItems + '/parameters/parameters.yaml', 'utf8'),
      expected = fs.readFileSync(withParametersAndItems + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/pet.yaml',
            content: pet
          },
          {
            path: '/parameters/parameters.yaml',
            content: parameters
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled result from - nestedLocalRef', async function() {
    let contentRootFile = fs.readFileSync(nestedLocalRef + '/index.yaml', 'utf8'),
      info = fs.readFileSync(nestedLocalRef + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(nestedLocalRef + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(nestedLocalRef + '/schemas/pet.yaml', 'utf8'),
      favoriteFood = fs.readFileSync(nestedLocalRef + '/schemas/favorite_food.yaml', 'utf8'),
      expected = fs.readFileSync(nestedLocalRef + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/schemas/pet.yaml',
            content: pet
          },
          {
            path: '/schemas/favorite_food.yaml',
            content: favoriteFood
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled result from - nestedRefs', async function() {
    let contentRootFile = fs.readFileSync(nestedRefs + '/index.yaml', 'utf8'),
      info = fs.readFileSync(nestedRefs + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(nestedRefs + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(nestedRefs + '/schemas/pet.yaml', 'utf8'),
      favoriteFood = fs.readFileSync(nestedRefs + '/schemas/favorite_food.yaml', 'utf8'),
      expected = fs.readFileSync(nestedRefs + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/schemas/pet.yaml',
            content: pet
          },
          {
            path: '/schemas/favorite_food.yaml',
            content: favoriteFood
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled result from - basicExample', async function() {
    let contentRootFile = fs.readFileSync(basicExample + '/index.yaml', 'utf8'),
      info = fs.readFileSync(basicExample + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(basicExample + '/paths.yaml', 'utf8'),
      expected = fs.readFileSync(basicExample + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled result from - simpleRef', async function() {
    let contentRootFile = fs.readFileSync(simpleRef + '/index.yaml', 'utf8'),
      info = fs.readFileSync(simpleRef + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(simpleRef + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(simpleRef + '/pet.yaml', 'utf8'),
      expected = fs.readFileSync(simpleRef + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/pet.yaml',
            content: pet
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });
});
