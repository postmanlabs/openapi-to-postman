let expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  RELATED_FILES = '../data/relatedFiles',
  PET_STORE_SEPARATED_COMMON = '../data/petstore separate yaml/common',
  VALID_OPENAPI_31_PATH = '../data/valid_openapi31X',
  validPetstore = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml'),
  petstoreSeparatedPet = path.join(__dirname, PET_STORE_SEPARATED + '/Pet.yaml'),
  petstoreSeparatedError = path.join(__dirname, PET_STORE_SEPARATED_COMMON + '/Error.yaml'),
  swaggerRoot = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  newPet = path.join(__dirname, PET_STORE_SEPARATED + '/NewPet.yaml'),
  missedRef = path.join(__dirname, RELATED_FILES + '/missedRef.yaml'),
  circularRefNewPet = path.join(__dirname, RELATED_FILES + '/NewPet.yaml'),
  refToRoot = path.join(__dirname, RELATED_FILES + '/refToRoot.yaml'),
  internalRefOnly = path.join(__dirname, VALID_OPENAPI_PATH + '/deepObjectLengthProperty.yaml'),
  circularRef = path.join(__dirname, RELATED_FILES + '/circularRef.yaml'),
  oldPet = path.join(__dirname, RELATED_FILES + '/oldPet.yaml'),
  pet = path.join(__dirname, RELATED_FILES + '/Pet.yaml'),
  validHopService31x = path.join(__dirname, VALID_OPENAPI_31_PATH + '/yaml/hopService.yaml');

describe('detectRelatedFiles method', function() {

  it('should return empty data when there is no root in the entry', async function() {
    let contentFile = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
        ],
        data: [
          {
            path: '/Pet.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.length).to.equal(0);
  });

  it('should locate root and return empty data when there is no ref', async function() {
    let contentFile = fs.readFileSync(validPetstore, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
        ],
        data: [
          {
            path: '/petstore.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/petstore.yaml');
    expect(res.output.data[0].relatedFiles.length).to.equal(0);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(0);
  });

  it('should return adjacent and missing nodes', async function () {
    const contentFileMissedRef = fs.readFileSync(missedRef, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/missedRef.yaml',
            content: contentFileMissedRef
          }
        ],
        data: [
          {
            path: '/Pet.yaml',
            content: contentFilePet
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/missedRef.yaml');
    expect(res.output.data[0].relatedFiles[0].path).to.equal('/Pet.yaml');
    expect(res.output.data[0].missingRelatedFiles[0].path).to.equal('/common/Error.yaml');

  });

  it('should return adjacent and missing nodes and exclude root if some file is pointing to it', async function () {
    const contentFilRefToRoot = fs.readFileSync(refToRoot, 'utf8'),
      contentFilePet = fs.readFileSync(circularRefNewPet, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'refToRoot.yaml',
            content: contentFilRefToRoot
          }
        ],
        data: [
          {
            path: 'NewPet.yaml',
            content: contentFilePet
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles[0].path).to.equal('NewPet.yaml');
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(1);
    expect(res.output.data[0].missingRelatedFiles[0].path).to.equal('Pet.yaml');

  });

  it('should not return local ref as missing node', async function () {
    const contentFileMissedRef = fs.readFileSync(internalRefOnly, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/deepObjectLengthProperty.yaml',
            content: contentFileMissedRef
          }
        ],
        data: [
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/deepObjectLengthProperty.yaml');
    expect(res.output.data[0].relatedFiles.length).to.equal(0);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(0);

  });

  it('should return adjacent and missing nodes with circular refs', async function () {
    const contentCircularRef = fs.readFileSync(circularRef, 'utf8'),
      contentFileOldPet = fs.readFileSync(oldPet, 'utf8'),
      contentFilePet = fs.readFileSync(pet, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'circularRef.yaml',
            content: contentCircularRef
          }
        ],
        data: [
          {
            path: 'oldPet.yaml',
            content: contentFileOldPet
          },
          {
            path: 'Pet.yaml',
            content: contentFilePet
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles.length).to.equal(2);
    expect(res.output.data[0].relatedFiles[0].path).to.equal('oldPet.yaml');
    expect(res.output.data[0].relatedFiles[1].path).to.equal('Pet.yaml');
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(0);

  });

  it('should return related in a folder structure with local pointers in $ref', async function () {
    const swaggerRootContent = fs.readFileSync(swaggerRoot, 'utf8'),
      petContent = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      parametersContent = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      newPetContent = fs.readFileSync(newPet, 'utf8'),
      errorContent = fs.readFileSync(petstoreSeparatedError, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'separatedFiles/spec/swagger.yaml',
            content: swaggerRootContent
          }
        ],
        data: [
          {
            path: 'separatedFiles/spec/Pet.yaml',
            content: petContent
          },
          {
            path: 'separatedFiles/spec/parameters.yaml',
            content: parametersContent
          },
          {
            path: 'separatedFiles/spec/NewPet.yaml',
            content: newPetContent
          },
          {
            path: 'separatedFiles/common/Error.yaml',
            content: errorContent
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles.length).to.equal(4);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(0);
  });

  it('should filter root according to the version 3.1', async function() {
    let contentFilePet = fs.readFileSync(validPetstore, 'utf8'),
      contentFileHop = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.1',
        rootFiles: [
          {
            path: '/petstore.yaml',
            content: contentFilePet
          },
          {
            path: '/hopService.yaml',
            content: contentFileHop
          }
        ],
        data: [
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/hopService.yaml');
  });
  it('should filter root according to the version default', async function() {
    let contentFilePet = fs.readFileSync(validPetstore, 'utf8'),
      contentFileHop = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'folder',
        rootFiles: [
          {
            path: '/petstore.yaml',
            content: contentFilePet
          },
          {
            path: '/hopService.yaml',
            content: contentFileHop
          }
        ],
        data: [
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/petstore.yaml');
  });
});
