let expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  { getAdjacentAndMissing, getRemoteReferences, mapToLocalPath } = require('../../lib/remoteRefSolver'),
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
      { graphAdj, missingNodes } = await getAdjacentAndMissing(inputNode, {});
    expect(graphAdj).to.not.be.undefined;
    expect(graphAdj.length).to.equal(1);
    expect(graphAdj[0].content).to.not.be.undefined;
    expect(graphAdj[0].content).to.not.be.empty;
    expect(graphAdj[0].fileName).to.eq('//postman-echo.com/get');
    expect(graphAdj[0].url).to.eq('https://postman-echo.com/get');
    expect(missingNodes).to.be.empty;

  });

  it('should find the adjacent nodes with URL in $ref value multiple no repeated', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(swaggerRemoteRef, 'utf8'),
      exFn0 = '//raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/remote_refs/' +
        'parameters.yaml',
      exFn1 = '//raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/remote_refs/Pet.yaml',
      exFn2 = '//raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/remote_refs/Error.yaml',
      exFn3 = '//raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/remote_refs/NewPet.yaml',
      inputNode = {
        fileName: '/swagger.yaml',
        content: contentFilePetstoreRemoteRef
      },
      { graphAdj, missingNodes } = await getAdjacentAndMissing(inputNode, {});
    expect(graphAdj).to.not.be.undefined;
    expect(graphAdj.length).to.equal(4);
    expect(graphAdj[0].content).to.not.be.undefined;
    expect(graphAdj[0].fileName).to.equal(exFn0);
    expect(graphAdj[0].url).to.not.be.empty;
    expect(graphAdj[1].fileName).to.equal(exFn1);
    expect(graphAdj[1].url).to.not.be.empty;
    expect(graphAdj[2].fileName).to.equal(exFn2);
    expect(graphAdj[2].url).to.not.be.empty;
    expect(graphAdj[3].fileName).to.equal(exFn3);
    expect(graphAdj[3].url).to.not.be.empty;
    expect(missingNodes).to.be.empty;

  });

  it('should return missing nodes when the url does not exist', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(swaggerRemoteRefMissing, 'utf8'),
      inputNode = {
        fileName: '/swaggerMissing.yaml',
        content: contentFilePetstoreRemoteRef
      },
      { graphAdj, missingNodes } = await getAdjacentAndMissing(inputNode, {});
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

describe('mapToLocalPath method', function () {
  it('should return //localhost/projects for entry "http://localhost:3000/projects"', function () {
    const result = mapToLocalPath('http://localhost:3000/projects');
    expect(result).to.equal('//localhost/projects');
  });

  it('should return //raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml' +
    'for entry https://raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml"',
  function () {
    const result =
    mapToLocalPath('https://raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml');
    expect(result).to.equal('//raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml');
  });
});
