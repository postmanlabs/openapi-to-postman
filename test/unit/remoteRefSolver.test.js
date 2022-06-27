let expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  { getAdjacentAndMissing, getRemoteReferences, mapToLocalPath } = require('../../lib/remoteRefSolver'),
  schemaUtils = require('../../lib//schemaUtils'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  REMOTE_REFS_PATH = '../data/remote_refs',
  petstoreRemoteRef = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml'),
  swaggerRemoteRef = path.join(__dirname, REMOTE_REFS_PATH + '/swagger.yaml'),
  swaggerRemoteRefMissing = path.join(__dirname, REMOTE_REFS_PATH + '/swaggerMissing.yaml'),
  bundleExpected = path.join(__dirname, REMOTE_REFS_PATH + '/bundleExpected.json');


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
    expect(graphAdj[0].fileName).to.eq('https://postman-echo.com/get');
    expect(graphAdj[0].url).to.eq('https://postman-echo.com/get');
    expect(missingNodes).to.be.empty;

  });

  it('should find the adjacent nodes with URL in $ref value multiple no repeated', async function () {
    const contentFilePetstoreRemoteRef = fs.readFileSync(swaggerRemoteRef, 'utf8'),
      exFn0 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/remote_refs/' +
        'parameters.yaml',
      exFn1 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/' +
      'remote_refs/Pet.yaml',
      exFn2 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/' +
      'remote_refs/Error.yaml',
      exFn3 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/remoteRef/test/data/' +
      'remote_refs/NewPet.yaml',
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
  it('should return http://localhost:3000/projects for entry "http://localhost:3000/projects"', function () {
    const result = mapToLocalPath('http://localhost:3000/projects');
    expect(result).to.equal('http://localhost:3000/projects');
  });

  it('should return https://raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml' +
    'for entry https://raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml"',
  function () {
    const result =
    mapToLocalPath('https://raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml');
    expect(result).to.equal('https://raw.githubusercontent.com/postmanlabs/remoteRef/test/data/remote_refs/Pet.yaml');
  });
});


describe('resolveRemote and bundle', function () {
  it('Should resolve remote references and bundle using custom fetch', async function () {
    let openapi = fs.readFileSync(swaggerRemoteRef, 'utf8'),
      expected = fs.readFileSync(bundleExpected, 'utf8'),
      customFetch = (url) => {
        const url1 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/' +
          'remoteRef/test/data/remote_refs/parameters.yaml',
          url2 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/' +
            'remoteRef/test/data/remote_refs/Pet.yaml',
          url3 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/' +
            'remoteRef/test/data/remote_refs/Error.yaml',
          url4 = 'https://raw.githubusercontent.com/postmanlabs/openapi-to-postman/' +
            'remoteRef/test/data/remote_refs/NewPet.yaml',
          path1 = swaggerRemoteRef = path.join(__dirname, REMOTE_REFS_PATH + '/parameters.yaml'),
          path2 = swaggerRemoteRef = path.join(__dirname, REMOTE_REFS_PATH + '/Pet.yaml'),
          path3 = swaggerRemoteRef = path.join(__dirname, REMOTE_REFS_PATH + '/Error.yaml'),
          path4 = swaggerRemoteRef = path.join(__dirname, REMOTE_REFS_PATH + '/NewPet.yaml'),
          urlMap = {};
        urlMap[url1] = fs.readFileSync(path1, 'utf8');
        urlMap[url2] = fs.readFileSync(path2, 'utf8');
        urlMap[url3] = fs.readFileSync(path3, 'utf8');
        urlMap[url4] = fs.readFileSync(path4, 'utf8');
        let content = urlMap[url];
        return Promise.resolve({
          text: () => { return Promise.resolve(content); },
          status: 200
        });
      },
      { remoteRefs, specRoot } = await getRemoteReferences({
        fileName: 'swagger.yaml',
        content: openapi
      }, undefined, customFetch),
      bundleRes = schemaUtils.processRelatedFiles({
        type: 'folder',
        specificationVersion: '3.0.0',
        rootFiles: [
          {
            fileName: 'root.yaml',
            content: openapi,
            parsed: specRoot.parsed
          }
        ],
        data: remoteRefs,
        options: {},
        bundleFormat: 'object'
      }, true);
    expect(bundleRes).to.not.be.null;
    expect(JSON.stringify(bundleRes.output.data[0].bundledContent, null, 2)).to.be.equal(expected);

  });
});
