// let expect = require('chai').expect,
const { getRelatedFiles, getReferences, getReferencesNodes } = require('./../../lib/relatedFiles');

var expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  newPet = path.join(__dirname, PET_STORE_SEPARATED + '/NewPet.yaml'),
  swaggerRoot = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  petstoreSeparatedPet = path.join(__dirname, PET_STORE_SEPARATED + '/Pet.yaml');


describe('getReferencesNodes method', function () {
  it('should return adjacent and missing nodes', function () {
    const contentFileNewPet = fs.readFileSync(newPet, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      inputNode = {
        path: '/NewPet.yaml',
        content: contentFileNewPet
      },
      inputData = [{
        path: 'Pet.yaml',
        content: contentFilePet
      }],
      { graphAdj, missingNodes } = getReferencesNodes(inputNode, inputData);
    expect(graphAdj.length).to.equal(1);
    expect(missingNodes.length).to.equal(0);
  });
});

describe('getReferences method', function () {
  it('should return 1 reference from input', function () {
    const contentFile = fs.readFileSync(newPet, 'utf8'),

      inputNode = {
        path: '/NewPet.yaml',
        content: contentFile
      },
      result = getReferences(inputNode);
    expect(result.length).to.equal(1);
    expect(result[0].path).to.equal('Pet.yaml');

  });

  it('should return unique references from input', function () {
    const contentFile = fs.readFileSync(swaggerRoot, 'utf8'),

      inputNode = {
        path: '/swagger.yaml',
        content: contentFile
      },
      result = getReferences(inputNode);
    expect(result.length).to.equal(5);
    expect(result[0].path).to.equal('parameters.yaml#/tagsParam');
    expect(result[1].path).to.equal('parameters.yaml#/limitsParam');
    expect(result[2].path).to.equal('Pet.yaml');
    expect(result[3].path).to.equal('../common/Error.yaml');
    expect(result[4].path).to.equal('NewPet.yaml');

  });
});

describe('Get header family function ', function () {
  it('should check for custom type JSON header', function () {
    getRelatedFiles();

  });

});
