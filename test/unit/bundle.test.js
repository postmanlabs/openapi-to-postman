const { getReferences } = require('../../lib/bundle.js'),
  { removeLocalReferenceFromPath } = require('../../lib/jsonPointer.js'),
  parse = require('./../../lib/parse');

let expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  PETSTORE_FOLDER = '../data/petstore separate yaml',
  nestedRefsFromRootComponents = path.join(__dirname, BUNDLES_FOLDER + '/nested_references_from_root_components'),
  localRefFolder = path.join(__dirname, BUNDLES_FOLDER + '/local_references'),
  schemaFromResponse = path.join(__dirname, BUNDLES_FOLDER + '/schema_from_response'),
  petstoreFolder = path.join(__dirname, PETSTORE_FOLDER),
  withParamsFolder = path.join(__dirname, BUNDLES_FOLDER + '/with_parameters'),
  withRefInItems = path.join(__dirname, BUNDLES_FOLDER + '/with_ref_in_items'),
  sameRefDiffSource = path.join(__dirname, BUNDLES_FOLDER + '/same_ref_different_source'),
  nestedHard = path.join(__dirname, BUNDLES_FOLDER + '/multiple_references_from_root_components'),
  localFromExternal = path.join(__dirname, BUNDLES_FOLDER + '/bring_local_dependencies_from_external'),
  localFromExternalMultiple = path
    .join(__dirname, BUNDLES_FOLDER + '/bring_local_dependencies_from_external_multiple_local'),
  refTags = path.join(__dirname, BUNDLES_FOLDER + '/referenced_tags'),
  refInfo = path.join(__dirname, BUNDLES_FOLDER + '/referenced_info'),
  refPaths = path.join(__dirname, BUNDLES_FOLDER + '/referenced_paths'),
  refPathsRefToLocalSchema = path.join(__dirname, BUNDLES_FOLDER + '/referenced_paths_local_schema'),
  refInfo20 = path.join(__dirname, BUNDLES_FOLDER + '/referenced_info_2_0'),
  refTags20 = path.join(__dirname, BUNDLES_FOLDER + '/referenced_tags_2_0'),
  SWAGGER_MULTIFILE_FOLDER = '../data/toBundleExamples/swagger20',
  basicExample = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/basicExample'),
  simpleRef = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/simpleRef');

describe('bundle files method - 3.0', function () {
  it('Should return bundled file as json - schema_from_response', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.json', 'utf8'),
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
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file as yaml - schema_from_response', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.yaml', 'utf8'),
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
        ],
        options: {},
        bundleFormat: 'yaml'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file in same format than root file - schema_from_response', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.yaml', 'utf8'),
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
        ],
        options: {}
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file - nested_references_from_root_components', async function () {
    let contentRootFile = fs.readFileSync(nestedRefsFromRootComponents + '/v1.yaml', 'utf8'),
      responses = fs.readFileSync(nestedRefsFromRootComponents + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(nestedRefsFromRootComponents + '/schemas/index.yaml', 'utf8'),
      schemasUser = fs.readFileSync(nestedRefsFromRootComponents + '/schemas/user.yaml', 'utf8'),
      schemasClient = fs.readFileSync(nestedRefsFromRootComponents + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(nestedRefsFromRootComponents + '/otherSchemas/toy.yaml', 'utf8'),
      userProps = fs.readFileSync(nestedRefsFromRootComponents + '/userProps.yaml', 'utf8'),
      expected = fs.readFileSync(nestedRefsFromRootComponents + '/expected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/v1.yaml',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
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
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file - local_references', async function () {
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
        options: {},
        bundleFormat: 'JSON',
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
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file - petstore separated example', async function () {
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
      expected = fs.readFileSync(petstoreFolder + '/bundleExp.yaml', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/spec/swagger.yaml',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'yaml',
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
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file - with_parameters', async function () {
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
        options: {},
        bundleFormat: 'JSON',
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
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file - with_ref_in_items', async function () {
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
        options: {},
        bundleFormat: 'JSON',
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
    expect(res.output.data.bundledContent)
      .to.be.equal(expected);
  });

  it('Should return error data - with_ref_in_items - wrong root', async function () {
    let contentRootFile = fs.readFileSync(withRefInItems + '/wrongRoot.yaml', 'utf8'),
      user = fs.readFileSync(withRefInItems + '/schemas/user.yaml', 'utf8'),
      superProp = fs.readFileSync(withRefInItems + '/schemas/superProp.yaml', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/wrongRoot.yaml',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
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
    expect(res.result).to.be.false;
    expect(res.reason).to.equal('Invalid format. Input must be in YAML or JSON ' +
      'format. Specification is not a valid YAML. YAMLException: duplicated mapping' +
      ' key at line 30, column -54:\n    components:\n    ^');
  });

  it('Should return bundled file from same_ref_different_source', async function () {
    let contentRootFile = fs.readFileSync(sameRefDiffSource + '/root.yaml', 'utf8'),
      user = fs.readFileSync(sameRefDiffSource + '/schemas/user/user.yaml', 'utf8'),
      client = fs.readFileSync(sameRefDiffSource + '/schemas/client/client.yaml', 'utf8'),
      specialUser = fs.readFileSync(sameRefDiffSource + '/schemas/user/special.yaml', 'utf8'),
      specialClient = fs.readFileSync(sameRefDiffSource + '/schemas/client/special.yaml', 'utf8'),
      magic = fs.readFileSync(sameRefDiffSource + '/schemas/client/magic.yaml', 'utf8'),
      expected = fs.readFileSync(sameRefDiffSource + '/expected.json', 'utf8'),
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
            path: '/schemas/user/user.yaml',
            content: user
          },
          {
            path: '/schemas/user/special.yaml',
            content: specialUser
          },
          {
            path: '/schemas/client/client.yaml',
            content: client
          },
          {
            path: '/schemas/client/special.yaml',
            content: specialClient
          },
          {
            path: '/schemas/client/magic.yaml',
            content: magic
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file - multiple_references_from_root_components', async function () {
    let contentRootFile = fs.readFileSync(nestedHard + '/root.yaml', 'utf8'),
      responses = fs.readFileSync(nestedHard + '/responses.yaml', 'utf8'),
      userProps = fs.readFileSync(nestedHard + '/userProps.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(nestedHard + '/schemas/index.yaml', 'utf8'),
      schemasUser = fs.readFileSync(nestedHard + '/schemas/user.yaml', 'utf8'),
      schemasClient = fs.readFileSync(nestedHard + '/schemas/client.yaml', 'utf8'),
      schemasCarType = fs.readFileSync(nestedHard + '/schemas/carType.yaml', 'utf8'),
      otherModel = fs.readFileSync(nestedHard + '/otherSchemas/model.yaml', 'utf8'),
      othersToy = fs.readFileSync(nestedHard + '/otherSchemas/toy.yaml', 'utf8'),
      othersWork = fs.readFileSync(nestedHard + '/otherSchemas/work.yaml', 'utf8'),
      expected = fs.readFileSync(nestedHard + '/expected.json', 'utf8'),
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
            path: '/userProps.yaml',
            content: userProps
          },
          {
            path: '/schemas/index.yaml',
            content: schemasIndex
          },
          {
            path: '/schemas/user.yaml',
            content: schemasUser
          },
          {
            path: '/schemas/client.yaml',
            content: schemasClient
          },
          {
            path: '/schemas/carType.yaml',
            content: schemasCarType
          },
          {
            path: '/otherSchemas/model.yaml',
            content: otherModel
          },
          {
            path: '/otherSchemas/toy.yaml',
            content: othersToy
          },
          {
            path: '/otherSchemas/work.yaml',
            content: othersWork
          }
        ],
        options: {},
        bundleFormat: 'json'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file as json - bring_local_dependencies_from_external', async function () {
    let contentRootFile = fs.readFileSync(localFromExternal + '/root.yaml', 'utf8'),
      user = fs.readFileSync(localFromExternal + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(localFromExternal + '/expected.json', 'utf8'),
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
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file as json - bring_local_dependencies_from_external_multiple_local', async function () {
    let contentRootFile = fs.readFileSync(localFromExternalMultiple + '/root.yaml', 'utf8'),
      user = fs.readFileSync(localFromExternalMultiple + '/schemas/user.yaml', 'utf8'),
      food = fs.readFileSync(localFromExternalMultiple + '/schemas/food.yaml', 'utf8'),
      expected = fs.readFileSync(localFromExternalMultiple + '/expected.json', 'utf8'),
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
            path: '/schemas/food.yaml',
            content: food
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return a "/missing/node/path": NotProvided' +
    ' in the place of a not providen node - local_references', async function () {
    let contentRootFile = fs.readFileSync(localRefFolder + '/root.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(localRefFolder + '/schemas/index.yaml', 'utf8'),
      schemasClient = fs.readFileSync(localRefFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(localRefFolder + '/otherSchemas/toy.yaml', 'utf8'),
      expected = fs.readFileSync(localRefFolder + '/expectedNodeNotProvided.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        data: [
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
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file with referenced tags from root', async function () {
    let contentRootFile = fs.readFileSync(refTags + '/root.yaml', 'utf8'),
      tags = fs.readFileSync(refTags + '/tags/tags.yaml', 'utf8'),
      expected = fs.readFileSync(refTags + '/expected.json', 'utf8'),
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
            path: '/tags/tags.yaml',
            content: tags
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file with referenced info from root', async function () {
    let contentRootFile = fs.readFileSync(refInfo + '/root.yaml', 'utf8'),
      info = fs.readFileSync(refInfo + '/info/info.yaml', 'utf8'),
      expected = fs.readFileSync(refInfo + '/expected.json', 'utf8'),
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
            path: '/info/info.yaml',
            content: info
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file with referenced paths from root', async function () {
    let contentRootFile = fs.readFileSync(refPaths + '/root.yaml', 'utf8'),
      paths = fs.readFileSync(refPaths + '/paths/paths.yaml', 'utf8'),
      path = fs.readFileSync(refPaths + '/paths/path.yaml', 'utf8'),
      expected = fs.readFileSync(refPaths + '/expected.json', 'utf8'),
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
            path: '/paths/paths.yaml',
            content: paths
          },
          {
            path: '/paths/path.yaml',
            content: path
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file with referenced paths from root - path references local schema', async function () {
    let contentRootFile = fs.readFileSync(refPathsRefToLocalSchema + '/root.yaml', 'utf8'),
      paths = fs.readFileSync(refPathsRefToLocalSchema + '/paths/paths.yaml', 'utf8'),
      path = fs.readFileSync(refPathsRefToLocalSchema + '/paths/path.yaml', 'utf8'),
      expected = fs.readFileSync(refPathsRefToLocalSchema + '/expected.json', 'utf8'),
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
            path: '/paths/paths.yaml',
            content: paths
          },
          {
            path: '/paths/path.yaml',
            content: path
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });
});

describe('bundle files method - 2.0', function () {
  it('Should return bundled file with referenced info from root', async function () {
    let contentRootFile = fs.readFileSync(refInfo20 + '/root.yaml', 'utf8'),
      info = fs.readFileSync(refInfo20 + '/info/info.yaml', 'utf8'),
      expected = fs.readFileSync(refInfo20 + '/expected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/root.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info/info.yaml',
            content: info
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file with referenced tags from root', async function () {
    let contentRootFile = fs.readFileSync(refTags20 + '/root.yaml', 'utf8'),
      tags = fs.readFileSync(refTags20 + '/tags/tags.yaml', 'utf8'),
      expected = fs.readFileSync(refTags20 + '/expected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/root.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/tags/tags.yaml',
            content: tags
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });
});

describe('getReferences method when node does not have any reference', function() {
  it('Should return reference data empty if there are not any reference', function() {
    const userData = 'type: object\n' +
        'properties:\n' +
        '  id:\n' +
        '    type: integer\n' +
        '  userName:\n' +
        '    type: string',
      userNode = parse.getOasObject(userData),
      nodeIsRoot = false,
      result = getReferences(
        userNode.oasObject,
        nodeIsRoot,
        removeLocalReferenceFromPath,
        'the/parent/filename'
      );

    expect(result.referencesInNode).to.be.an('array').with.length(0);
    expect(Object.keys(result.nodeReferenceDirectory).length).to.equal(0);
  });

  it('Should return the reference data - schema_from_response', function() {
    const userData = 'User:\n' +
      '  $ref: \"./user.yaml\"\n' +
      '\n' +
      'Monster:\n' +
      '  type: object\n' +
      '  properties:\n' +
      '    id:\n' +
      '      type: integer\n' +
      '    clientName:\n' +
      '      type: string\n' +
      'Dog:\n' +
      '  type: object\n' +
      '  properties:\n' +
      '    id:\n' +
      '      type: integer\n' +
      '    clientName:\n' +
      '      type: string',
      userNode = parse.getOasObject(userData),
      nodeIsRoot = false,
      result = getReferences(
        userNode.oasObject,
        nodeIsRoot,
        removeLocalReferenceFromPath,
        'the/parent/filename'
      );
    expect(result.nodeReferenceDirectory).to.be.an('object');
    expect(Object.keys(result.nodeReferenceDirectory).length).to.equal(1);
    expect(result.referencesInNode).to.be.an('array').with.length(1);
    expect(Object.keys(result.nodeReferenceDirectory)[0])
      .to.equal('the/parent/user.yaml');
    expect(result.referencesInNode[0].path).to.equal('./user.yaml');
    expect(result.referencesInNode[0].newValue.$ref).to.equal('the/parent/user.yaml');
  });

  it('Should return bundled result from - basicExample', async function() {
    let contentRootFile = fs.readFileSync(basicExample + '/index.yaml', 'utf8'),
      info = fs.readFileSync(basicExample + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(basicExample + '/paths.yaml', 'utf8'),
      expected = fs.readFileSync(basicExample + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });

  it('Should return bundled result from - simpleRef', async function() {
    let contentRootFile = fs.readFileSync(simpleRef + '/index.yaml', 'utf8'),
      info = fs.readFileSync(simpleRef + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(simpleRef + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(simpleRef + '/pet.yaml', 'utf8'),
      expected = fs.readFileSync(simpleRef + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/pet.yaml',
            content: pet
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data.bundledContent).to.be.equal(expected);
  });
});
