let expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  PETSTORE_FOLDER = '../data/petstore separate yaml',
  swaggerMultifileFolder = path.join(__dirname, BUNDLES_FOLDER + '/swagger-multi-file'),
  localRefFolder = path.join(__dirname, BUNDLES_FOLDER + '/local_ref'),
  easyFolder = path.join(__dirname, BUNDLES_FOLDER + '/swagger-multi-file_easy'),
  petstoreFolder = path.join(__dirname, PETSTORE_FOLDER),
  withParamsFolder = path.join(__dirname, BUNDLES_FOLDER + '/with_parameters'),
  withRefInItems = path.join(__dirname, BUNDLES_FOLDER + '/with_ref_in_items');

describe('bundle files method', function () {
  it('Should return bundled file with an schema called from a response', async function () {
    let contentRootFile = fs.readFileSync(easyFolder + '/root.yaml', 'utf8'),
      user = fs.readFileSync(easyFolder + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(easyFolder + '/expected.json', 'utf8'),
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
      .to.be.equal('#/components/schemas/~1schemas~1user.yaml');
    expect(Object.keys(res.output.data.bundledContent.components.schemas['/schemas/user.yaml']))
      .to.have.members(['type', 'properties']);
    expect(JSON.stringify(res.output.data.bundledContent)).to.be.equal(expected);
  });

  it('Should return bundled file from root with components with', async function () {
    let contentRootFile = fs.readFileSync(swaggerMultifileFolder + '/v1.yaml', 'utf8'),
      responses = fs.readFileSync(swaggerMultifileFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(swaggerMultifileFolder + '/schemas/index.yaml', 'utf8'),
      schemasUser = fs.readFileSync(swaggerMultifileFolder + '/schemas/user.yaml', 'utf8'),
      schemasClient = fs.readFileSync(swaggerMultifileFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(swaggerMultifileFolder + '/otherSchemas/toy.yaml', 'utf8'),
      userProps = fs.readFileSync(swaggerMultifileFolder + '/userProps.yaml', 'utf8'),
      expected = fs.readFileSync(swaggerMultifileFolder + '/expected.json', 'utf8'),
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
    expect(JSON.stringify(res.output.data.bundledContent)).to.be.equal(expected);
  });

  it('Should return bundled file from a file with local references', async function () {
    let contentRootFile = fs.readFileSync(localRefFolder + '/root.yaml', 'utf8'),
      responses = fs.readFileSync(localRefFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(localRefFolder + '/schemas/index.yaml', 'utf8'),
      schemasClient = fs.readFileSync(localRefFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(localRefFolder + '/otherSchemas/toy.yaml', 'utf8'),
      expected = fs.readFileSync(localRefFolder + '/expected.json', 'utf8'),
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
    expect(JSON.stringify(res.output.data.bundledContent)).to.be.equal(expected);
  });

  it('Should return bundled file from a petstore separated yaml', async function () {
    let contentRootFile = fs.readFileSync(petstoreFolder + '/spec/swagger.yaml', 'utf8'),
      newPet = fs.readFileSync(petstoreFolder + '/spec/NewPet.yaml', 'utf8'),
      openapi = fs.readFileSync(petstoreFolder + '/spec/openapi.yaml', 'utf8'),
      parameters = fs.readFileSync(petstoreFolder + '/spec/parameters.yaml', 'utf8'),
      pet = fs.readFileSync(petstoreFolder + '/spec/Pet.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(petstoreFolder + '/schemas/_index.yaml', 'utf8'),
      error = fs.readFileSync(petstoreFolder + '/schemas/Error.yaml', 'utf8'),
      petSchema = fs.readFileSync(petstoreFolder + '/schemas/Pet.yaml', 'utf8'),
      responsesIndex = fs.readFileSync(petstoreFolder + '/responses/_index.yaml', 'utf8'),
      nullResponse = fs.readFileSync(petstoreFolder + '/responses/NullResponse.yaml', 'utf8'),
      unexpectedError = fs.readFileSync(petstoreFolder + '/responses/UnexpectedError.yaml', 'utf8'),
      petResource = fs.readFileSync(petstoreFolder + '/resources/pet.yaml', 'utf8'),
      petsResource = fs.readFileSync(petstoreFolder + '/resources/pets.yaml', 'utf8'),
      parametersIndex = fs.readFileSync(petstoreFolder + '/parameters/_index.yaml', 'utf8'),
      limitParameter = fs.readFileSync(petstoreFolder + '/parameters/query/limit.yaml', 'utf8'),
      petIdParameter = fs.readFileSync(petstoreFolder + '/parameters/path/petId.yaml', 'utf8'),
      errorCommon = fs.readFileSync(petstoreFolder + '/common/Error.yaml', 'utf8'),
      expected = fs.readFileSync(petstoreFolder + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/spec/swagger.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/spec/NewPet.yaml',
            content: newPet
          },
          {
            path: '/spec/openapi.yaml',
            content: openapi
          },
          {
            path: '/spec/parameters.yaml',
            content: parameters
          },
          {
            path: '/spec/Pet.yaml',
            content: pet
          },
          {
            path: '/schemas/_index.yaml',
            content: schemasIndex
          },
          {
            path: '/schemas/Error.yaml',
            content: error
          },
          {
            path: '/schemas/Pet.yaml',
            content: petSchema
          },
          {
            path: '/responses/_index.yaml',
            content: responsesIndex
          },
          {
            path: '/responses/NullResponse.yaml',
            content: nullResponse
          },
          {
            path: '/responses/UnexpectedError.yaml',
            content: unexpectedError
          },
          {
            path: '/resources/pet.yaml',
            content: petResource
          },
          {
            path: '/resources/pets.yaml',
            content: petsResource
          },
          {
            path: '/parameters/_index.yaml',
            content: parametersIndex
          },
          {
            path: '/parameters/path/petId.yaml',
            content: petIdParameter
          },
          {
            path: '/parameters/query/limit.yaml',
            content: limitParameter
          },
          {
            path: '/common/Error.yaml',
            content: errorCommon
          }
        ]
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(res.output.data.bundledContent)).to.be.equal(expected);
  });

  it('Should return bundled file with schemas called from parameters', async function () {
    let contentRootFile = fs.readFileSync(withParamsFolder + '/root.yaml', 'utf8'),
      user = fs.readFileSync(withParamsFolder + '/schemas/user.yaml', 'utf8'),
      parameters = fs.readFileSync(withParamsFolder + '/parameters/index.yaml', 'utf8'),
      expected = fs.readFileSync(withParamsFolder + '/expected.json', 'utf8'),
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
          },
          {
            path: '/parameters/index.yaml',
            content: parameters
          }
        ]
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent.paths['/users/{userId}'].get.responses['200']
      .content['application/json'].schema.$ref)
      .to.be.equal('#/components/schemas/~1schemas~1user.yaml');
    expect(Object.keys(res.output.data.bundledContent.components.schemas['/schemas/user.yaml']))
      .to.have.members(['type', 'properties']);
    expect(JSON.stringify(res.output.data.bundledContent)).to.be.equal(expected);
  });

  it('Should return bundled file with schemas nested and called from properties', async function () {
    let contentRootFile = fs.readFileSync(withRefInItems + '/root.yaml', 'utf8'),
      user = fs.readFileSync(withRefInItems + '/schemas/user.yaml', 'utf8'),
      superProp = fs.readFileSync(withRefInItems + '/schemas/superProp.yaml', 'utf8'),
      expected = fs.readFileSync(withRefInItems + '/expected.json', 'utf8'),
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
          },
          {
            path: '/schemas/superProp.yaml',
            content: superProp
          }
        ]
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(res.output.data.bundledContent))
      .to.be.equal(expected);
  });
});
