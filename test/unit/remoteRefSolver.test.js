let expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  { getAdjacentAndMissing, getRemoteReferences } = require('../../lib/remoteRefSolver'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  REMOTE_REFS_PATH = '../data/remote_refs',
  petstoreRemoteRef = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml'),
  swaggerRemoteRef = path.join(__dirname, REMOTE_REFS_PATH + '/swagger.yaml'),
  swaggerRemoteRefMissing = path.join(__dirname, REMOTE_REFS_PATH + '/swaggerMissing.yaml');


describe('getAdjacentAndMissing function ', async function () {
  it('should find the adjacent nodes with URL in $ref value', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(petstoreRemoteRef, 'utf8'),
      inputNode = {
        fileName: '/petstore.yaml',
        content: contentFilePetstoreRemoteRef
      },
      { graphAdj, missingNodes } = await getAdjacentAndMissing(inputNode);
    expect(graphAdj).to.not.be.undefined;
    expect(graphAdj.length).to.equal(1);
    expect(graphAdj[0].content).to.not.be.undefined;
    expect(graphAdj[0].content).to.not.be.empty;
    expect(missingNodes).to.be.empty;

  });

  it('should find the adjacent nodes with URL in $ref value multiple no repeated', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(swaggerRemoteRef, 'utf8'),
      inputNode = {
        fileName: '/swagger.yaml',
        content: contentFilePetstoreRemoteRef
      },
      { graphAdj, missingNodes } = await getAdjacentAndMissing(inputNode);
    expect(graphAdj).to.not.be.undefined;
    expect(graphAdj.length).to.equal(4);
    expect(graphAdj[0].content).to.not.be.undefined;
    expect(graphAdj[0].content).to.not.be.empty;
    expect(missingNodes).to.be.empty;

  });

  it('should return missing nodes when the url does not exist', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(swaggerRemoteRefMissing, 'utf8'),
      inputNode = {
        fileName: '/swaggerMissing.yaml',
        content: contentFilePetstoreRemoteRef
      },
      { graphAdj, missingNodes } = await getAdjacentAndMissing(inputNode);
    expect(graphAdj).to.not.be.undefined;
    expect(graphAdj.length).to.equal(0);
    expect(missingNodes).to.not.be.empty;

  });
});

describe('getRemoteReferences function ', function () {
  it('should find the adjacent nodes with URL in $ref value', async function () {
    const contentFileSwaggerRemoteRef = fs.readFileSync(swaggerRemoteRef, 'utf8'),
      inputNode = {
        fileName: '/swagger.yaml',
        content: contentFileSwaggerRemoteRef
      },
      { remoteRefs, missingRemoteRefs } = await getRemoteReferences(inputNode);
    expect(remoteRefs).to.not.be.undefined;
    expect(remoteRefs.length).to.equal(4);
    expect(missingRemoteRefs).to.be.empty;

  });
  it('should find the adjacent nodes with URL in $ref value as thenable', function (done) {
    const contentFileSwaggerRemoteRef = fs.readFileSync(swaggerRemoteRef, 'utf8'),
      inputNode = {
        fileName: '/swagger.yaml',
        content: contentFileSwaggerRemoteRef
      };
    getRemoteReferences(inputNode).then(({ remoteRefs, missingRemoteRefs }) => {
      expect(remoteRefs).to.not.be.undefined;
      expect(remoteRefs.length).to.equal(4);
      expect(missingRemoteRefs).to.be.empty;
      done();
    });
  });
});
