var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  VALID_OPENAPI_31_PATH = '../data/valid_openapi31X',
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  PET_STORE_SEPARATED_JSON = '../data/petstore-separate/spec',
  validPetstore = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml'),
  noauth = path.join(__dirname, VALID_OPENAPI_PATH + '/noauth.yaml'),
  petstoreSeparated = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  petstoreSeparatedPet = path.join(__dirname, PET_STORE_SEPARATED + '/Pet.yaml'),
  petstoreSeparatedJson = path.join(__dirname, PET_STORE_SEPARATED_JSON + '/swagger.json'),
  petstoreSeparatedPetJson = path.join(__dirname, PET_STORE_SEPARATED_JSON + '/Pet.json'),
  validHopService31x = path.join(__dirname, VALID_OPENAPI_31_PATH + '/yaml/hopService.yaml');


describe('detectRoot method', function() {

  it('should return one root 3.0 correctly no specific version', async function() {
    let contentFile = fs.readFileSync(validPetstore, 'utf8'),
      input = {
        type: 'folder',
        data: [
          {
            path: '/petstore.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].path).to.equal('/petstore.yaml');
    expect(res.output.specification.version).to.equal('3.0.0');
  });

  it('should return one root 3.0 correctly', async function() {
    let contentFile = fs.readFileSync(validPetstore, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        data: [
          {
            path: '/petstore.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].path).to.equal('/petstore.yaml');
  });

  it('should return no root when specific version is not present', async function() {
    let contentFile = fs.readFileSync(validPetstore, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.1',
        data: [
          {
            path: '/petstore.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.length).to.equal(0);
  });

  it('should return one root 3.0 correctly with other files in folder', async function() {
    let petRoot = fs.readFileSync(petstoreSeparated, 'utf8'),
      petSchema = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        data: [
          {
            path: '/swagger.yaml',
            content: petRoot
          },
          {
            path: '/Pet.yaml',
            content: petSchema
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.length).to.equal(1);
    expect(res.output.data[0].path).to.equal('/swagger.yaml');
  });

  it('should return one root 3.1 correctly', async function() {
    let contentFile = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.1',
        data: [
          {
            path: '/hopService.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].path).to.equal('/hopService.yaml');
  });

  it('should return one root when multiple versions are present correctly', async function() {
    let petstoreContent = fs.readFileSync(validPetstore, 'utf8'),
      hopService31x = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0.0',
        data: [
          {
            path: '/petstore.yaml',
            content: petstoreContent
          },
          {
            path: '/hopService.yaml',
            content: hopService31x
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.length).to.equal(1);
    expect(res.output.data[0].path).to.equal('/petstore.yaml');
  });

  it('should return one root when multiple versions are present correctly 3.1', async function() {
    let petstoreContent = fs.readFileSync(validPetstore, 'utf8'),
      hopService31x = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.1.0',
        data: [
          {
            path: '/petstore.yaml',
            content: petstoreContent
          },
          {
            path: '/hopService.yaml',
            content: hopService31x
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.length).to.equal(1);
    expect(res.output.data[0].path).to.equal('/hopService.yaml');
  });

  it('should return no root file when there is not a root file present', async function() {
    let input = {
      type: 'folder',
      specificationVersion: '3.0.0',
      data: [
        {
          path: '/petstore.yaml',
          content: 'not root'
        }
      ]
    };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data).to.be.empty;
  });

  it('should return 2 root 3.0 correctly', async function() {
    let petstoreContent = fs.readFileSync(validPetstore, 'utf8'),
      noAuthContent = fs.readFileSync(noauth, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0.0',
        data: [
          {
            path: '/petstore.yaml',
            content: petstoreContent
          },
          {
            path: '/noauth.yaml',
            content: noAuthContent
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.length).to.equal(2);
    expect(res.output.data[0].path).to.equal('/petstore.yaml');
    expect(res.output.data[1].path).to.equal('/noauth.yaml');
  });

  it('should propagate one error correctly', async function () {
    let input = {
      type: 'folder',
      specificationVersion: '3.0.0',
      data: [
        {
          path: '',
          content: 'openapi: 3.0.0'
        }
      ]
    };
    try {
      await Converter.detectRootFiles(input);
    }
    catch (ex) {
      expect(ex.message).to.equal('"Path" of the data element should be provided');
    }
  });

  it('should return one root 3.0 correctly with other files in folder json', async function() {
    let petRoot = fs.readFileSync(petstoreSeparatedJson, 'utf8'),
      petSchema = fs.readFileSync(petstoreSeparatedPetJson, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        data: [
          {
            path: '/swagger.json',
            content: petRoot
          },
          {
            path: '/Pet.json',
            content: petSchema
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.length).to.equal(1);
    expect(res.output.data[0].path).to.equal('/swagger.json');
  });

  it('should read content when is not present 3.0 and no specific version', async function () {
    let input = {
      type: 'folder',
      specificationVersion: '3.1.0',
      data: [
        {
          path: validPetstore
        },
        {
          path: validHopService31x
        }
      ]
    };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].path).to.equal(validHopService31x);

  });

  it('should return error when "type" parameter is not sent', async function () {
    let input = {
      data: [
        {
          path: validPetstore
        },
        {
          path: validHopService31x
        }
      ]
    };

    try {
      await Converter.detectRootFiles(input);
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('"Type" parameter should be provided');
    }
  });

  it('should return error when input is an empty object', async function () {
    try {
      await Converter.detectRootFiles({});
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('Input object must have "type" and "data" information');
    }
  });

  it('should return error when input data is an empty array', async function () {
    try {
      await Converter.detectRootFiles({ type: 'folder', data: [] });
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('"Data" parameter should be provided');
    }
  });

});
