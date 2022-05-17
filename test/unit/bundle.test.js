let expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  swaggerToBundleFolder = path.join(__dirname, BUNDLES_FOLDER + '/swagger-multi-file');

describe('detectRelatedFiles method', function () {

  it('Should return bundled file', async function () {
    let contentRootFile = fs.readFileSync(swaggerToBundleFolder + '/v1.yaml', 'utf8'),
      responses = fs.readFileSync(swaggerToBundleFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(swaggerToBundleFolder + '/schemas/index.yaml', 'utf8'),
      schemasUser = fs.readFileSync(swaggerToBundleFolder + '/schemas/user.yaml', 'utf8'),
      schemasClient = fs.readFileSync(swaggerToBundleFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(swaggerToBundleFolder + '/otherSchemas/toy.yaml', 'utf8'),
      userProps = fs.readFileSync(swaggerToBundleFolder + '/userProps.yaml', 'utf8'),
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
});
