var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  // VALID_OPENAPI_31_PATH = '../data/valid_openapi31X',
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  RELATED_FILES = '../data/relatedFiles',
  // PET_STORE_SEPARATED_JSON = '../data/petstore-separate/spec',
  validPetstore = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml'),
  // noauth = path.join(__dirname, VALID_OPENAPI_PATH + '/noauth.yaml'),
  // petstoreSeparated = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  petstoreSeparatedPet = path.join(__dirname, PET_STORE_SEPARATED + '/Pet.yaml'),
  missedRef = path.join(__dirname, RELATED_FILES + '/missedRef.yaml');
  // petstoreSeparatedJson = path.join(__dirname, PET_STORE_SEPARATED_JSON + '/swagger.json'),
  // petstoreSeparatedPetJson = path.join(__dirname, PET_STORE_SEPARATED_JSON + '/Pet.json'),
  // validHopService31x = path.join(__dirname, VALID_OPENAPI_31_PATH + '/yaml/hopService.yaml');


describe('detectRoot method', function() {

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
            path: 'Pet.yaml',
            content: contentFilePet
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;

  });
});
