let expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  swaggerMultifileFolder = path.join(__dirname, BUNDLES_FOLDER + '/swagger-multi-file'),
  localRefFolder = path.join(__dirname, BUNDLES_FOLDER + '/local_ref'),
  easyFolder = path.join(__dirname, BUNDLES_FOLDER + '/swagger-multi-file_easy');

describe('bundle files method', function () {
  it('Should return bundled file with an schema called from a response', async function () {
    let contentRootFile = fs.readFileSync(easyFolder + '/root.yaml', 'utf8'),
      user = fs.readFileSync(easyFolder + '/schemas/user.yaml', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/schemas/user.yaml',
            content: user
          }
        ]
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent.paths['/users/{userId}'].get.responses['200']
      .content['application/json'].schema.$ref)
      .to.be.equal('#/components/schema/~1schemas~1user.yaml');
    expect(Object.keys(res.output.data.bundledContent.components.schemas['/schemas/user.yaml']))
      .to.have.members(['type', 'properties']);
  });

  it('Should return bundled file from root with components with', async function () {
    let contentRootFile = fs.readFileSync(swaggerMultifileFolder + '/v1.yaml', 'utf8'),
      responses = fs.readFileSync(swaggerMultifileFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(swaggerMultifileFolder + '/schemas/index.yaml', 'utf8'),
      schemasUser = fs.readFileSync(swaggerMultifileFolder + '/schemas/user.yaml', 'utf8'),
      schemasClient = fs.readFileSync(swaggerMultifileFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(swaggerMultifileFolder + '/otherSchemas/toy.yaml', 'utf8'),
      userProps = fs.readFileSync(swaggerMultifileFolder + '/userProps.yaml', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/v1.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/responses.yaml',
            content: responses
          },
          {
            path: '/schemas/index.yaml',
            content: schemasIndex
          },
          {
            path: '/schemas/client.yaml',
            content: schemasClient
          },
          {
            path: '/schemas/user.yaml',
            content: schemasUser
          },
          {
            path: '/otherSchemas/toy.yaml',
            content: toySchema
          },
          {
            path: '/userProps.yaml',
            content: userProps
          }
        ]
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
  });

  it('Should return bundled file from a file with local references', async function () {
    let contentRootFile = fs.readFileSync(localRefFolder + '/root.yaml', 'utf8'),
      responses = fs.readFileSync(localRefFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(localRefFolder + '/schemas/index.yaml', 'utf8'),
      schemasClient = fs.readFileSync(localRefFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(localRefFolder + '/otherSchemas/toy.yaml', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/responses.yaml',
            content: responses
          },
          {
            path: '/schemas/index.yaml',
            content: schemasIndex
          },
          {
            path: '/schemas/client.yaml',
            content: schemasClient
          },
          {
            path: '/otherSchemas/toy.yaml',
            content: toySchema
          }
        ]
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
  });
});
