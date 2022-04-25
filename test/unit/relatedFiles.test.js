const { getRelatedFiles, getReferences, getAdjacentAndMissing,
    calculatePath, calculatePathMissing } = require('./../../lib/relatedFiles'),
  expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  PET_STORE_SEPARATED_COMMON = '../data/petstore separate yaml/common',
  RELATED_FILES = '../data/relatedFiles',
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  newPet = path.join(__dirname, PET_STORE_SEPARATED + '/NewPet.yaml'),
  swaggerRoot = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  petstoreSeparatedPet = path.join(__dirname, PET_STORE_SEPARATED + '/Pet.yaml'),
  petstoreSeparatedError = path.join(__dirname, PET_STORE_SEPARATED_COMMON + '/Error.yaml'),
  missedRef = path.join(__dirname, RELATED_FILES + '/missedRef.yaml'),
  missedRefOut = path.join(__dirname, RELATED_FILES + '/missingOutbounds/missedRefOut.yaml'),
  internalRefOnly = path.join(__dirname, VALID_OPENAPI_PATH + '/deepObjectLengthProperty.yaml');


describe('getAdjacentAndMissing function', function () {
  it('should return adjacent and no missing nodes', function () {
    const contentFileNewPet = fs.readFileSync(newPet, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      inputNode = {
        fileName: '/NewPet.yaml',
        content: contentFileNewPet
      },
      inputData = [{
        fileName: '/Pet.yaml',
        content: contentFilePet
      }],
      { graphAdj, missingNodes } = getAdjacentAndMissing(inputNode, inputData, inputNode);
    expect(graphAdj.length).to.equal(1);
    expect(graphAdj[0].fileName).to.equal('/Pet.yaml');
    expect(missingNodes.length).to.equal(0);
  });

  it('should return adjacent and missing nodes', function () {
    const contentFileMissedRef = fs.readFileSync(missedRef, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      inputNode = {
        fileName: '/missedRef.yaml',
        content: contentFileMissedRef
      },
      inputData = [{
        fileName: '/Pet.yaml',
        content: contentFilePet
      }],
      { graphAdj, missingNodes } = getAdjacentAndMissing(inputNode, inputData, inputNode);
    expect(graphAdj.length).to.equal(1);
    expect(graphAdj[0].fileName).to.equal('/Pet.yaml');
    expect(missingNodes.length).to.equal(1);
    expect(missingNodes[0].path).to.equal('/common/Error.yaml');

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
    expect(result[0].path).to.equal('parameters.yaml');
    expect(result[1].path).to.equal('parameters.yaml');
    expect(result[2].path).to.equal('Pet.yaml');
    expect(result[3].path).to.equal('../common/Error.yaml');
    expect(result[4].path).to.equal('NewPet.yaml');

  });
});

describe('getRelatedFiles function ', function () {

  it('should return related in a folder structure with local pointers in $ref', function () {
    const swaggerRootContent = fs.readFileSync(swaggerRoot, 'utf8'),
      petContent = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      parametersContent = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      newPetContent = fs.readFileSync(newPet, 'utf8'),
      errorContent = fs.readFileSync(petstoreSeparatedError, 'utf8'),
      rootNode = {
        fileName: 'spec/swagger.yaml',
        content: swaggerRootContent
      },
      inputData = [
        {
          fileName: 'spec/Pet.yaml',
          content: petContent
        },
        {
          fileName: 'spec/parameters.yaml',
          content: parametersContent
        },
        {
          fileName: 'spec/NewPet.yaml',
          content: newPetContent
        },
        {
          fileName: 'common/Error.yaml',
          content: errorContent
        }
      ],
      { relatedFiles, missingRelatedFiles } = getRelatedFiles(rootNode, inputData);
    expect(relatedFiles.length).to.equal(4);
    expect(relatedFiles[0].path).to.equal('spec/NewPet.yaml');
    expect(relatedFiles[1].path).to.equal('spec/Pet.yaml');
    expect(relatedFiles[2].path).to.equal('common/Error.yaml');
    expect(relatedFiles[3].path).to.equal('spec/parameters.yaml');
    expect(missingRelatedFiles.length).to.equal(0);
  });

  it('should return adjacent and missing nodes', function () {
    const contentFileMissedRef = fs.readFileSync(missedRef, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      rootNode = {
        fileName: '/missedRef.yaml',
        content: contentFileMissedRef
      },
      inputData = [{
        fileName: '/Pet.yaml',
        content: contentFilePet
      }],
      { relatedFiles, missingRelatedFiles } = getRelatedFiles(rootNode, inputData);
    expect(relatedFiles.length).to.equal(1);
    expect(relatedFiles[0].path).to.equal('/Pet.yaml');
    expect(missingRelatedFiles.length).to.equal(1);
    expect(missingRelatedFiles[0].path).to.equal('/common/Error.yaml');
  });

  it('should not return internal refs as missing ref', function () {
    const contentFile = fs.readFileSync(internalRefOnly, 'utf8'),
      rootNode = {
        fileName: '/deepObjectLengthProperty.yaml',
        content: contentFile
      },
      inputData = [],
      { relatedFiles, missingRelatedFiles } = getRelatedFiles(rootNode, inputData);
    expect(relatedFiles.length).to.equal(0);
    expect(missingRelatedFiles.length).to.equal(0);
  });

  it('should return missing nodes with $ref property', function () {
    const contentFileMissedRef = fs.readFileSync(missedRefOut, 'utf8'),
      rootNode = {
        fileName: '/missedRef.yaml',
        content: contentFileMissedRef
      },
      inputData = [],
      { relatedFiles, missingRelatedFiles } = getRelatedFiles(rootNode, inputData);
    expect(relatedFiles.length).to.equal(0);
    expect(missingRelatedFiles.length).to.equal(2);
    expect(missingRelatedFiles[0].path).to.equal('/Pet.yaml');
    expect(missingRelatedFiles[0].$ref).to.be.undefined;
    expect(missingRelatedFiles[1].path).to.be.undefined;
    expect(missingRelatedFiles[1].$ref).to.equal('../../common/Error.yaml');
  });

});

describe('calculatePath function', function () {
  it('should return the path relative to the parent', function () {
    const result = calculatePath('sf/newpet.yaml', '../error.yaml');
    expect(result).to.equal('error.yaml');
  });
  it('should return the path relative to the parent inside a folder', function () {
    const result = calculatePath('sf/spec/newpet.yaml', '../common/error.yaml');
    expect(result).to.equal('sf/common/error.yaml');
  });
});

describe('calculatePathMissing function', function () {

  it('should calculate path and $ref for absolut and relative paths', function () {
    const result = calculatePathMissing('newpet.yaml', '../../../common/error.yaml'),
      result1 = calculatePathMissing('sf/newpet.yaml', '../../../common/error.yaml'),
      result2 = calculatePathMissing('/sf/newpet.yaml', '../../../common/error.yaml'),
      result3 = calculatePathMissing('/newpet.yaml', '../../../../common/error.yaml'),
      result4 = calculatePathMissing('newpet.yaml', '/common/error.yaml'),
      result5 = calculatePathMissing('/missedRef.yaml', 'Pet.yaml'),
      result6 = calculatePathMissing('/newpet.yaml', '/common/error.yaml'),
      result7 = calculatePathMissing('/a/sf/newpet.yaml', '../common/error.yaml');

    expect(result.path).to.be.undefined;
    expect(result.$ref).to.equal('../../../common/error.yaml');

    expect(result1.path).to.be.undefined;
    expect(result1.$ref).to.equal('../../../common/error.yaml');

    expect(result2.path).to.be.undefined;
    expect(result2.$ref).to.equal('../../../common/error.yaml');

    expect(result3.path).to.be.undefined;
    expect(result3.$ref).to.equal('../../../../common/error.yaml');

    expect(result4.$ref).to.be.undefined;
    expect(result4.path).to.equal('common/error.yaml');

    expect(result5.$ref).to.be.undefined;
    expect(result5.path).to.equal('/Pet.yaml');

    expect(result6.$ref).to.be.undefined;
    expect(result6.path).to.equal('/common/error.yaml');

    expect(result7.$ref).to.be.undefined;
    expect(result7.path).to.equal('/a/common/error.yaml');

  });

});
