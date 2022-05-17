let expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  { getAdjacentAndMissing, getRemoteReferences } = require('../../lib/remoteRefSolver'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  petstoreRemoteRef = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml');


describe('getAdjacentAndMissing function ', async function () {
  it('should find the adjacent nodes with URL in $ref value', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(petstoreRemoteRef, 'utf8'),
      inputNode = {
        fileName: '/petstore.yaml',
        content: contentFilePetstoreRemoteRef
      },
      { graphAdj, missingNodes } = await getAdjacentAndMissing(inputNode);
    expect(graphAdj).to.not.be.undefined;
    expect(missingNodes).to.be.empty;

  });
});

describe('getRemoteReferences function ', async function () {
  it('should find the adjacent nodes with URL in $ref value', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(petstoreRemoteRef, 'utf8'),
      inputNode = {
        fileName: '/petstore.yaml',
        content: contentFilePetstoreRemoteRef
      },
      { graphAdj, missingNodes } = await getRemoteReferences(inputNode);
    expect(graphAdj).to.not.be.undefined;
    expect(missingNodes).to.be.empty;

  });
});
