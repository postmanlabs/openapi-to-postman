const { getRelatedFiles, getReferences, getAdjacentAndMissing } = require('./../../lib/relatedFiles'),
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  RELATED_FILES = '../data/relatedFiles',
  newPet = path.join(__dirname, PET_STORE_SEPARATED + '/NewPet.yaml'),
  swaggerRoot = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  petstoreSeparatedPet = path.join(__dirname, PET_STORE_SEPARATED + '/Pet.yaml'),
  missedRef = path.join(__dirname, RELATED_FILES + '/missedRef.yaml');


describe('getAdjacentAndMissing function', function () {
  it('should return adjacent and no missing nodes', function () {
    const contentFileNewPet = fs.readFileSync(newPet, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      inputNode = {
        fileName: '/NewPet.yaml',
        content: contentFileNewPet
      },
      inputData = [{
        fileName: 'Pet.yaml',
        content: contentFilePet
      }],
      { graphAdj, missingNodes } = getAdjacentAndMissing(inputNode, inputData, inputNode);
    expect(graphAdj.length).to.equal(1);
    expect(graphAdj[0].fileName).to.equal('Pet.yaml');
    expect(missingNodes.length).to.equal(0);
  });

  it('should return adjacent and missing nodes', function () {
    const contentFileMissedRef = fs.readFileSync(missedRef, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      inputNode = {
        path: '/missedRef.yaml',
        content: contentFileMissedRef
      },
      inputData = [{
        fileName: 'Pet.yaml',
        content: contentFilePet
      }],
      { graphAdj, missingNodes } = getAdjacentAndMissing(inputNode, inputData, inputNode);
    expect(graphAdj.length).to.equal(1);
    expect(graphAdj[0].fileName).to.equal('Pet.yaml');
    expect(missingNodes.length).to.equal(1);
    expect(missingNodes[0].relativeToRootPath).to.equal('../common/Error.yaml');

  });
});

describe('getReferences function', function () {
  it('should return 1 reference from input', function () {
    const contentFile = fs.readFileSync(newPet, 'utf8'),

      inputNode = {
        fileName: '/NewPet.yaml',
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

describe('getRelatedFiles function ', function () {

  it('should return adjacent and missing nodes', function () {
    const contentFileMissedRef = fs.readFileSync(missedRef, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      rootNode = {
        fileName: '/missedRef.yaml',
        content: contentFileMissedRef
      },
      inputData = [{
        fileName: 'Pet.yaml',
        content: contentFilePet
      }],
      { relatedFiles, missingRelatedFiles } = getRelatedFiles(rootNode, inputData);
    expect(relatedFiles.length).to.equal(1);
    expect(relatedFiles[0].path).to.equal('Pet.yaml');
    expect(missingRelatedFiles.length).to.equal(1);
    expect(missingRelatedFiles[0].relativeToRootPath).to.equal('../common/Error.yaml');

  });

});
