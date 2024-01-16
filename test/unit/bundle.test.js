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
  remoteURLRefExamples = path.join(__dirname, BUNDLES_FOLDER + '/remote_url_refs'),
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
  refExample = path.join(__dirname, BUNDLES_FOLDER + '/referenced_examples'),
  properties = path.join(__dirname, BUNDLES_FOLDER + '/properties'),
  sameSourceDifferentPlace = path.join(__dirname, BUNDLES_FOLDER + '/same_source_different_place'),
  nestedProperties = path.join(__dirname, BUNDLES_FOLDER + '/nestedProperties'),
  referencedResponse = path.join(__dirname, BUNDLES_FOLDER + '/referenced_response'),
  referencedParameter = path.join(__dirname, BUNDLES_FOLDER + '/referenced_parameter'),
  referencedMultipleParameters = path.join(__dirname, BUNDLES_FOLDER + '/referenced_multiple_parameters'),
  referencedRequestBody = path.join(__dirname, BUNDLES_FOLDER + '/referenced_request_body'),
  referencedHeader = path.join(__dirname, BUNDLES_FOLDER + '/referenced_header'),
  referencedLink = path.join(__dirname, BUNDLES_FOLDER + '/referenced_link'),
  referencedCallback = path.join(__dirname, BUNDLES_FOLDER + '/referenced_callback'),
  referencedSecuritySchemes = path.join(__dirname, BUNDLES_FOLDER + '/referenced_security_schemes'),
  additionalProperties = path.join(__dirname, BUNDLES_FOLDER + '/additionalProperties'),
  compositeOneOf = path.join(__dirname, BUNDLES_FOLDER + '/composite_oneOf'),
  compositeNot = path.join(__dirname, BUNDLES_FOLDER + '/composite_not'),
  compositeAnyOf = path.join(__dirname, BUNDLES_FOLDER + '/composite_anyOf'),
  longPath = path.join(__dirname, BUNDLES_FOLDER + '/longPath'),
  schemaCollision = path.join(__dirname, BUNDLES_FOLDER + '/schema_collision_from_responses'),
  schemaCollisionWRootComponent = path.join(__dirname, BUNDLES_FOLDER + '/schema_collision_w_root_components'),
  referencedProperties = path.join(__dirname, BUNDLES_FOLDER + '/referenced_properties'),
  nestedExamplesAsValue = path.join(__dirname, BUNDLES_FOLDER + '/nested_examples_as_value'),
  referencedComponents = path.join(__dirname, BUNDLES_FOLDER + '/referenced_components'),
  referencedPath = path.join(__dirname, BUNDLES_FOLDER + '/referenced_path'),
  referencedPathSchema = path.join(__dirname, BUNDLES_FOLDER + '/paths_schema'),
  exampleValue = path.join(__dirname, BUNDLES_FOLDER + '/example_value'),
  example2 = path.join(__dirname, BUNDLES_FOLDER + '/example2'),
  schemaCircularRef = path.join(__dirname, BUNDLES_FOLDER + '/circular_reference'),
  schemaCircularRefInline = path.join(__dirname, BUNDLES_FOLDER + '/circular_reference_inline');

describe('bundle files method - 3.0', function () {
  it('Should return bundled file as json - schema_from_response', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as yaml - schema_from_response', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(res.output.data[0].bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file in same format than root file - schema_from_response', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(res.output.data[0].bundledContent).to.be.equal(expected);
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
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/v1.yaml'
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        data: [
          {
            path: '/v1.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);

  });

  it('Should return bundled file - local_references', async function () {
    let contentRootFile = fs.readFileSync(localRefFolder + '/root.yaml', 'utf8'),
      responses = fs.readFileSync(localRefFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(localRefFolder + '/schemas/index.yaml', 'utf8'),
      schemasClient = fs.readFileSync(localRefFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(localRefFolder + '/otherSchemas/toy.yaml', 'utf8'),
      expected = fs.readFileSync(localRefFolder + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
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
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/spec/swagger.yaml'
          }
        ],
        options: {},
        bundleFormat: 'yaml',
        data: [
          {
            path: '/spec/swagger.yaml',
            content: contentRootFile
          },
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
    expect(res.output.data[0].bundledContent).to.be.equal(expected);

  });

  it('Should return bundled file - with_parameters', async function () {
    let contentRootFile = fs.readFileSync(withParamsFolder + '/root.yaml', 'utf8'),
      user = fs.readFileSync(withParamsFolder + '/schemas/user.yaml', 'utf8'),
      parameters = fs.readFileSync(withParamsFolder + '/parameters/index.yaml', 'utf8'),
      expected = fs.readFileSync(withParamsFolder + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - with_ref_in_items', async function () {
    let contentRootFile = fs.readFileSync(withRefInItems + '/root.yaml', 'utf8'),
      user = fs.readFileSync(withRefInItems + '/schemas/user.yaml', 'utf8'),
      superProp = fs.readFileSync(withRefInItems + '/schemas/superProp.yaml', 'utf8'),
      expected = fs.readFileSync(withRefInItems + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return error data - with_ref_in_items - wrong root', async function () {
    let contentRootFile = fs.readFileSync(withRefInItems + '/wrongRoot.yaml', 'utf8'),
      user = fs.readFileSync(withRefInItems + '/schemas/user.yaml', 'utf8'),
      superProp = fs.readFileSync(withRefInItems + '/schemas/superProp.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/wrongRoot.yaml'
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        data: [
          {
            path: '/wrongRoot.yaml',
            content: contentRootFile
          },
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
    try {
      await Converter.bundle(input);
    }
    catch (error) {
      expect(error.message).to.equal('Invalid format. Input must be in YAML or JSON ' +
        'format. Specification is not a valid YAML. YAMLException: duplicated mapping' +
        ' key (30:1)\n\n 27 |     Test:\n 28 |       type: string\n 29 | \n 30 | components:' +
        '\n------^\n 31 |   schemas:\n 32 |     Test2: ');
    }
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
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
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
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - bring_local_dependencies_from_external', async function () {
    let contentRootFile = fs.readFileSync(localFromExternal + '/root.yaml', 'utf8'),
      user = fs.readFileSync(localFromExternal + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(localFromExternal + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - bring_local_dependencies_from_external_multiple_local', async function () {
    let contentRootFile = fs.readFileSync(localFromExternalMultiple + '/root.yaml', 'utf8'),
      user = fs.readFileSync(localFromExternalMultiple + '/schemas/user.yaml', 'utf8'),
      food = fs.readFileSync(localFromExternalMultiple + '/schemas/food.yaml', 'utf8'),
      expected = fs.readFileSync(localFromExternalMultiple + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return the not handled reference ($ref: ./responses.yaml) ' +
    'in the place of a not provided node - local_references', async function () {
    let contentRootFile = fs.readFileSync(localRefFolder + '/root.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(localRefFolder + '/schemas/index.yaml', 'utf8'),
      schemasClient = fs.readFileSync(localRefFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(localRefFolder + '/otherSchemas/toy.yaml', 'utf8'),
      expected = fs.readFileSync(localRefFolder + '/expectedNodeNotProvided.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file with referenced tags from root', async function () {
    let contentRootFile = fs.readFileSync(refTags + '/root.yaml', 'utf8'),
      tags = fs.readFileSync(refTags + '/tags/tags.yaml', 'utf8'),
      expected = fs.readFileSync(refTags + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file with referenced info from root', async function () {
    let contentRootFile = fs.readFileSync(refInfo + '/root.yaml', 'utf8'),
      info = fs.readFileSync(refInfo + '/info/info.yaml', 'utf8'),
      expected = fs.readFileSync(refInfo + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file with referenced paths from root', async function () {
    let contentRootFile = fs.readFileSync(refPaths + '/root.yaml', 'utf8'),
      paths = fs.readFileSync(refPaths + '/paths/paths.yaml', 'utf8'),
      path = fs.readFileSync(refPaths + '/paths/path.yaml', 'utf8'),
      expected = fs.readFileSync(refPaths + '/expected.json', 'utf8'),
      expectedMap = {
        '#/paths': {
          path: '/paths/paths.yaml',
          type: 'inline'
        },
        '#/paths//pets/get': {
          path: '/paths/path.yaml',
          type: 'inline'
        }
      },
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/paths/paths.yaml',
            content: paths
          },
          {
            path: '/paths/path.yaml',
            content: path
          }
        ],
        options: { includeReferenceMap: true },
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].referenceMap).to.deep.equal(expectedMap);
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file with referenced paths from root - path references local schema', async function () {
    let contentRootFile = fs.readFileSync(refPathsRefToLocalSchema + '/root.yaml', 'utf8'),
      paths = fs.readFileSync(refPathsRefToLocalSchema + '/paths/paths.yaml', 'utf8'),
      path = fs.readFileSync(refPathsRefToLocalSchema + '/paths/path.yaml', 'utf8'),
      expected = fs.readFileSync(refPathsRefToLocalSchema + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should throw error when root files is undefined and in data there is no root file', async function () {
    let user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        data: [
          {
            path: '/schemas/user.yaml',
            content: user
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };

    try {
      await Converter.bundle(input);
    }
    catch (error) {
      expect(error.message).to.equal('Input should have at least one root file');
    }
  });

  it('Should take the root file from data array root file prop empty array', async function () {
    let contentRootFile = fs.readFileSync(sameRefDiffSource + '/root.yaml', 'utf8'),
      user = fs.readFileSync(sameRefDiffSource + '/schemas/user/user.yaml', 'utf8'),
      client = fs.readFileSync(sameRefDiffSource + '/schemas/client/client.yaml', 'utf8'),
      specialUser = fs.readFileSync(sameRefDiffSource + '/schemas/user/special.yaml', 'utf8'),
      specialClient = fs.readFileSync(sameRefDiffSource + '/schemas/client/special.yaml', 'utf8'),
      magic = fs.readFileSync(sameRefDiffSource + '/schemas/client/magic.yaml', 'utf8'),
      expected = fs.readFileSync(sameRefDiffSource + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should throw error when root files is empty array and in data there is no root file', async function () {
    let user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [],
        data: [
          {
            path: '/schemas/user.yaml',
            content: user
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };

    try {
      await Converter.bundle(input);
    }
    catch (error) {
      expect(error.message).to.equal('Input should have at least one root file');
    }
  });

  it('Should return bundled files with 2 root', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.json', 'utf8'),
      contentRootFile2 = fs.readFileSync(localRefFolder + '/root.yaml', 'utf8'),
      responses = fs.readFileSync(localRefFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(localRefFolder + '/schemas/index.yaml', 'utf8'),
      schemasClient = fs.readFileSync(localRefFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(localRefFolder + '/otherSchemas/toy.yaml', 'utf8'),
      expected2 = fs.readFileSync(localRefFolder + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          },
          {
            path: '/root2.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/root2.yaml',
            content: contentRootFile2
          },
          {
            path: '/schemas/user.yaml',
            content: user
          },
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
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
    expect(JSON.stringify(JSON.parse(res.output.data[1].bundledContent), null, 2)).to.be.equal(expected2);
    expect(res.output.data[0].rootFile.path).to.equal('/root.yaml');
    expect(res.output.data[1].rootFile.path).to.equal('/root2.yaml');
  });

  it('Should throw error when root is not present in data array', async function () {
    let user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
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

    try {
      await Converter.bundle(input);
    }
    catch (error) {
      expect(error.message).to.equal('Root file content not found in data array');
    }
  });

  it('Should return bundled 1 file with 2 root but 1 is missing', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.json', 'utf8'),
      responses = fs.readFileSync(localRefFolder + '/responses.yaml', 'utf8'),
      schemasIndex = fs.readFileSync(localRefFolder + '/schemas/index.yaml', 'utf8'),
      schemasClient = fs.readFileSync(localRefFolder + '/schemas/client.yaml', 'utf8'),
      toySchema = fs.readFileSync(localRefFolder + '/otherSchemas/toy.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          },
          {
            path: '/root2.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/schemas/user.yaml',
            content: user
          },
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
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
    expect(res.output.data.length).to.equal(1);
  });

  it('Should bundle only the files with the specified version 3.1', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      contentRootFile31 = fs.readFileSync(schemaFromResponse + '/root3_1.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected3_1.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.1',
        rootFiles: [
          {
            path: '/root3_1.yaml'
          },
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/root3_1.yaml',
            content: contentRootFile31
          },
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
    expect(res.output.specification.version).to.equal('3.1');
    expect(res.output.data.length).to.equal(1);
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should bundle only the files with the specified version 3.0', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      contentRootFile31 = fs.readFileSync(schemaFromResponse + '/root3_1.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root3_1.yaml'
          },
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/root3_1.yaml',
            content: contentRootFile31
          },
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
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data.length).to.equal(1);
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('should bundle files to 3.0 when specificationVersion is not provided', async function () {
    let contentRootFile = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      contentRootFile31 = fs.readFileSync(schemaFromResponse + '/root3_1.yaml', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaFromResponse + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        rootFiles: [
          {
            path: '/root3_1.yaml'
          },
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/root3_1.yaml',
            content: contentRootFile31
          },
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
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data.length).to.equal(1);
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file with referenced example', async function () {
    let contentRootFile = fs.readFileSync(refExample + '/root.yaml', 'utf8'),
      example = fs.readFileSync(refExample + '/examples.yaml', 'utf8'),
      expected = fs.readFileSync(refExample + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/examples.yaml',
            content: example
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
    expect(res.output.data.length).to.equal(1);
  });

  it('should return error when "type" parameter is not sent', async function () {
    let contentRootFile = fs.readFileSync(refExample + '/root.yaml', 'utf8'),
      example = fs.readFileSync(refExample + '/examples.yaml', 'utf8'),
      input = {
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/examples.yaml',
            content: example
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };

    try {
      await Converter.bundle(input);
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('"Type" parameter should be provided');
    }
  });

  it('should return error when input is an empty object', async function () {
    try {
      await Converter.bundle({});
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('Input object must have "type" and "data" information');
    }
  });

  it('should return error when input has no root files', async function () {
    let contentRootFile = fs.readFileSync(refExample + '/root.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };

    try {
      await Converter.bundle(input);
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('Input should have at least one root file');
    }
  });

  it('Should return bundled file as json - sameSourceDifferentPlace', async function () {
    let contentRootFile = fs.readFileSync(sameSourceDifferentPlace + '/root.yaml', 'utf8'),
      user = fs.readFileSync(sameSourceDifferentPlace + '/schemas/user/user.yaml', 'utf8'),
      special = fs.readFileSync(sameSourceDifferentPlace + '/schemas/user/special.yaml', 'utf8'),
      client = fs.readFileSync(sameSourceDifferentPlace + '/schemas/client/client.yaml', 'utf8'),
      expected = fs.readFileSync(sameSourceDifferentPlace + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/schemas/user/user.yaml',
            content: user
          },
          {
            path: '/schemas/user/special.yaml',
            content: special
          },
          {
            path: '/schemas/client/client.yaml',
            content: client
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
    expect(res.output.data.length).to.equal(1);
  });

  it('Should return bundled file as json - nestedProperties', async function () {
    let contentRootFile = fs.readFileSync(nestedProperties + '/root.yaml', 'utf8'),
      user = fs.readFileSync(nestedProperties + '/schemas/user.yaml', 'utf8'),
      prop = fs.readFileSync(nestedProperties + '/properties/prop.yaml', 'utf8'),
      nestedProp = fs.readFileSync(nestedProperties + '/properties/nestedProp.yaml', 'utf8'),
      lastNested = fs.readFileSync(nestedProperties + '/properties/lastNested.yaml', 'utf8'),
      warrior = fs.readFileSync(nestedProperties + '/properties/warrior.yaml', 'utf8'),
      country = fs.readFileSync(nestedProperties + '/properties/country.yaml', 'utf8'),
      expected = fs.readFileSync(nestedProperties + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/schemas/user.yaml',
            content: user
          },
          {
            path: '/properties/prop.yaml',
            content: prop
          },
          {
            path: '/properties/nestedProp.yaml',
            content: nestedProp
          },
          {
            path: '/properties/country.yaml',
            content: country
          },
          {
            path: '/properties/lastNested.yaml',
            content: lastNested
          },
          {
            path: '/properties/warrior.yaml',
            content: warrior
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
    expect(res.output.data.length).to.equal(1);
  });

  it('Should return bundled file as json - properties', async function () {
    let contentRootFile = fs.readFileSync(properties + '/root.yaml', 'utf8'),
      user = fs.readFileSync(properties + '/schemas/user.yaml', 'utf8'),
      prop = fs.readFileSync(properties + '/schemas/prop.yaml', 'utf8'),
      expected = fs.readFileSync(properties + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/schemas/user.yaml',
            content: user
          },
          {
            path: '/schemas/prop.yaml',
            content: prop
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
    expect(res.output.data.length).to.equal(1);
  });

  it('Should bundle according to the input root format when bundleFormat is not present', async function () {
    let contentRootFileYAML = fs.readFileSync(schemaFromResponse + '/root.yaml', 'utf8'),
      contentRootJSON = fs.readFileSync(schemaFromResponse + '/root.json', 'utf8'),
      user = fs.readFileSync(schemaFromResponse + '/schemas/user.yaml', 'utf8'),
      expectedJSON = fs.readFileSync(schemaFromResponse + '/expected.json', 'utf8'),
      expectedYAML = fs.readFileSync(schemaFromResponse + '/expected.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.json'
          },
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFileYAML
          },
          {
            path: '/root.json',
            content: contentRootJSON
          },
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
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data.length).to.equal(2);
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expectedJSON);
    expect(res.output.data[1].bundledContent).to.be.equal(expectedYAML);
  });

  it('Should take the root file from data array root file prop undefined', async function () {
    let contentRootFile = fs.readFileSync(sameRefDiffSource + '/root.yaml', 'utf8'),
      user = fs.readFileSync(sameRefDiffSource + '/schemas/user/user.yaml', 'utf8'),
      client = fs.readFileSync(sameRefDiffSource + '/schemas/client/client.yaml', 'utf8'),
      specialUser = fs.readFileSync(sameRefDiffSource + '/schemas/user/special.yaml', 'utf8'),
      specialClient = fs.readFileSync(sameRefDiffSource + '/schemas/client/special.yaml', 'utf8'),
      magic = fs.readFileSync(sameRefDiffSource + '/schemas/client/magic.yaml', 'utf8'),
      expected = fs.readFileSync(sameRefDiffSource + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced response', async function () {
    let contentRoot = fs.readFileSync(referencedResponse + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedResponse + '/response.yaml', 'utf8'),
      expected = fs.readFileSync(referencedResponse + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/response.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced Parameter', async function () {
    let contentRoot = fs.readFileSync(referencedParameter + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedParameter + '/parameter.yaml', 'utf8'),
      expected = fs.readFileSync(referencedParameter + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/parameter.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced Multiple Parameter', async function () {
    let contentRoot = fs.readFileSync(referencedMultipleParameters + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedMultipleParameters + '/parameters.yaml', 'utf8'),
      expected = fs.readFileSync(referencedMultipleParameters + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/parameters.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced Request Body', async function () {
    let contentRoot = fs.readFileSync(referencedRequestBody + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedRequestBody + '/rbody.yaml', 'utf8'),
      expected = fs.readFileSync(referencedRequestBody + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/rbody.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced Header', async function () {
    let contentRoot = fs.readFileSync(referencedHeader + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedHeader + '/header.yaml', 'utf8'),
      expected = fs.readFileSync(referencedHeader + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/header.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced Link', async function () {
    let contentRoot = fs.readFileSync(referencedLink + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedLink + '/link.yaml', 'utf8'),
      expected = fs.readFileSync(referencedLink + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/link.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced Callback', async function () {
    let contentRoot = fs.readFileSync(referencedCallback + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedCallback + '/callback.yaml', 'utf8'),
      expected = fs.readFileSync(referencedCallback + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/callback.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - referenced Security Schemes', async function () {
    let contentRoot = fs.readFileSync(referencedSecuritySchemes + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedSecuritySchemes + '/sschemes.yaml', 'utf8'),
      expected = fs.readFileSync(referencedSecuritySchemes + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/sschemes.yaml',
            content: contentRef
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should bundle file from - additionalProperties', async function() {
    let contentRoot = fs.readFileSync(additionalProperties + '/root.yaml', 'utf8'),
      pet = fs.readFileSync(additionalProperties + '/pet.yaml', 'utf8'),
      additionalProps = fs.readFileSync(additionalProperties + '/additionalProperties.yaml', 'utf8'),
      expected = fs.readFileSync(additionalProperties + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/pet.yaml',
            content: pet
          },
          {
            path: '/additionalProperties.yaml',
            content: additionalProps
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should bundle composite file with oneOf - composite_oneOf', async function() {
    let contentRoot = fs.readFileSync(compositeOneOf + '/root.yaml', 'utf8'),
      pet = fs.readFileSync(compositeOneOf + '/schemas/pet.yaml', 'utf8'),
      user = fs.readFileSync(compositeOneOf + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(compositeOneOf + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/schemas/pet.yaml',
            content: pet
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should bundle composite file with anyOf - composite_anyOf', async function() {
    let contentRoot = fs.readFileSync(compositeAnyOf + '/root.yaml', 'utf8'),
      pet = fs.readFileSync(compositeAnyOf + '/schemas/pet.yaml', 'utf8'),
      user = fs.readFileSync(compositeAnyOf + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(compositeAnyOf + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
          {
            path: '/schemas/pet.yaml',
            content: pet
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should bundle composite file with not - composite_not', async function() {
    let contentRoot = fs.readFileSync(compositeNot + '/root.yaml', 'utf8'),
      user = fs.readFileSync(compositeNot + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(compositeNot + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should throw error when version is not correct', async function () {
    let contentRoot = fs.readFileSync(compositeNot + '/root.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: 'Anything',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRoot
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };

    try {
      await Converter.bundle(input);
    }
    catch (error) {
      expect(error.message).to.equal('The provided version "Anything" is not valid');
    }
  });

  it('Should return bundled file as json - schema_collision_from_responses', async function () {
    let contentRootFile = fs.readFileSync(schemaCollision + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaCollision + '/schemas_/_user.yaml', 'utf8'),
      user1 = fs.readFileSync(schemaCollision + '/schemas/__user.yaml', 'utf8'),
      user2 = fs.readFileSync(schemaCollision + '/schemas__/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaCollision + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/schemas__/user.yaml',
            content: user2
          },
          {
            path: '/schemas_/_user.yaml',
            content: user
          },
          {
            path: '/schemas/__user.yaml',
            content: user1
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - schema_collision_w_root_components', async function () {
    let contentRootFile = fs.readFileSync(schemaCollisionWRootComponent + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaCollisionWRootComponent + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaCollisionWRootComponent + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
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
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should bundle long paths into shorter ones', async function () {
    let contentRootFile = fs.readFileSync(longPath + '/root.yaml', 'utf8'),
      client = fs.readFileSync(longPath + '/client.json', 'utf8'),
      magic = fs.readFileSync(longPath + '/magic.yaml', 'utf8'),
      special = fs.readFileSync(longPath + '/special.yaml', 'utf8'),
      userSpecial = fs.readFileSync(longPath + '/userSpecial.yaml', 'utf8'),
      user = fs.readFileSync(longPath + '/user.yaml', 'utf8'),
      expected = fs.readFileSync(longPath + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/pm/openapi-to-postman/test/data/toBundleExamples/same_ref_different_source/root.yaml'
          }
        ],
        data: [
          {
            'content': contentRootFile,
            'path': '/pm/openapi-to-postman/test/data/toBundleExamples/same_ref_different_source/root.yaml'
          },
          {
            'content': client,
            'path': '/pm/openapi-to-postman/test/data/toBundleExamples/same_ref_different_source/schemas' +
              '/client/client.json'
          },
          {
            'content': magic,
            'path': '/pm/openapi-to-postman/test/data/toBundleExamples/same_ref_different_source/schemas' +
              '/client/magic.yaml'
          },
          {
            'content': special,
            'path': '/pm/openapi-to-postman/test/data/toBundleExamples/same_ref_different_source/schemas' +
              '/client/special.yaml'
          },
          {
            'content': userSpecial,
            'path': '/pm/openapi-to-postman/test/data/toBundleExamples/same_ref_different_source/schemas' +
              '/user/special.yaml'
          },
          {
            'content': user,
            'path': '/pm/openapi-to-postman/test/data/toBundleExamples/same_ref_different_source/schemas/user/user.yaml'
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });
  it('should ignore reference when is empty content and no root is sent', async function () {
    let input =
    {
      type: 'multiFile',
      specificationVersion: '3.0',
      bundleFormat: 'YAML',
      data: [
        {
          path: 'hello.yaml',
          content: ''
        },
        {
          path: 'openapi.yaml',
          content: 'openapi: 3.0.0\n' +
            'info:\n' +
            '  title: hello world\n' +
            '  version: 0.1.1\n' +
            'paths:\n' +
            '  /hello:\n' +
            '    get:\n' +
            '      summary: get the hello\n' +
            '      responses:\n' +
            '        \'200\':\n' +
            '          description: sample des\n' +
            '          content:\n' +
            '            application/json:\n' +
            '              schema:\n' +
            '                $ref: ./hello.yaml\n'
        }
      ]
    };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data[0].bundledContent).to.be.equal(input.data[1].content);
  });

  it('should ignore reference when is empty content', async function () {
    let input =
    {
      type: 'multiFile',
      specificationVersion: '3.0',
      bundleFormat: 'YAML',
      rootFiles: [{ path: 'openapi.yaml' }],
      data: [
        {
          path: 'hello.yaml',
          content: ''
        },
        {
          path: 'openapi.yaml',
          content: 'openapi: 3.0.0\n' +
            'info:\n' +
            '  title: hello world\n' +
            '  version: 0.1.1\n' +
            'paths:\n' +
            '  /hello:\n' +
            '    get:\n' +
            '      summary: get the hello\n' +
            '      responses:\n' +
            '        \'200\':\n' +
            '          description: sample des\n' +
            '          content:\n' +
            '            application/json:\n' +
            '              schema:\n' +
            '                $ref: ./hello.yaml\n'
        }
      ]
    };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data[0].bundledContent).to.be.equal(input.data[1].content);
  });

  it('should ignore reference when is invalid content', async function () {
    let input =
    {
      type: 'multiFile',
      specificationVersion: '3.0',
      bundleFormat: 'YAML',
      rootFiles: [{ path: 'openapi.yaml' }],
      data: [
        {
          path: 'hello.yaml',
          content: 'asd'
        },
        {
          path: 'openapi.yaml',
          content: 'openapi: 3.0.0\n' +
            'info:\n' +
            '  title: hello world\n' +
            '  version: 0.1.1\n' +
            'paths:\n' +
            '  /hello:\n' +
            '    get:\n' +
            '      summary: get the hello\n' +
            '      responses:\n' +
            '        \'200\':\n' +
            '          description: sample des\n' +
            '          content:\n' +
            '            application/json:\n' +
            '              schema:\n' +
            '                $ref: ./hello.yaml\n'
        }
      ]
    };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data[0].bundledContent).to.be.equal(input.data[1].content);
  });

  it('should ignore reference when is invalid', async function () {
    let input =
    {
      type: 'multiFile',
      specificationVersion: '3.0',
      bundleFormat: 'YAML',
      rootFiles: [{ path: 'openapi.yaml' }],
      data: [
        {
          path: 'openapi.yaml',
          content: 'openapi: 3.0.0\n' +
            'info:\n' +
            '  title: hello world\n' +
            '  version: 0.1.1\n' +
            'paths:\n' +
            '  /hello:\n' +
            '    get:\n' +
            '      summary: get the hello\n' +
            '      responses:\n' +
            '        \'200\':\n' +
            '          description: sample des\n' +
            '          content:\n' +
            '            application/json:\n' +
            '              schema:\n' +
            '                $ref: ./hello.yaml\n'
        }
      ]
    };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data[0].bundledContent).to.be.equal(input.data[0].content);
  });

  it('Should return bundled file as with referenced properties', async function () {
    let contentRootFile = fs.readFileSync(referencedProperties + '/root.yaml', 'utf8'),
      operation = fs.readFileSync(referencedProperties + '/operation.yaml', 'utf8'),
      attributes = fs.readFileSync(referencedProperties + '/attributes.yaml', 'utf8'),
      expected = fs.readFileSync(referencedProperties + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/operation.yaml',
            content: operation
          },
          {
            path: '/attributes.yaml',
            content: attributes
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file - TestSpec_from_issue_14', async function () {
    let contentRoot = fs.readFileSync(nestedExamplesAsValue + '/index.yml', 'utf8'),
      parametersIndex = fs.readFileSync(nestedExamplesAsValue + '/parameters/_index.yml', 'utf8'),
      arrivalTime = fs.readFileSync(nestedExamplesAsValue + '/parameters/arrival_time.yml', 'utf8'),
      pathsIndex = fs.readFileSync(nestedExamplesAsValue + '/paths/_index.yml', 'utf8'),
      geolocate = fs.readFileSync(nestedExamplesAsValue + '/paths/geolocate.yml', 'utf8'),
      requests =
        fs.readFileSync(nestedExamplesAsValue + '/requests/maps_http_geolocation_celltowers_request.yml', 'utf8'),
      schemasIndex = fs.readFileSync(nestedExamplesAsValue + '/schemas/_index.yml', 'utf8'),
      bounds = fs.readFileSync(nestedExamplesAsValue + '/schemas/Bounds.yml', 'utf8'),
      cellTower = fs.readFileSync(nestedExamplesAsValue + '/schemas/CellTower.yml', 'utf8'),
      geolocationRequest = fs.readFileSync(nestedExamplesAsValue + '/schemas/GeolocationRequest.yml', 'utf8'),
      latLngLiteral = fs.readFileSync(nestedExamplesAsValue + '/schemas/LatLngLiteral.yml', 'utf8'),
      wifiResponse =
        fs.readFileSync(nestedExamplesAsValue + '/responses/maps_http_geolocation_wifi_response.yml', 'utf8'),
      wifiRequest = fs.readFileSync(nestedExamplesAsValue + '/requests/maps_http_geolocation_wifi_request.yml', 'utf8'),
      geolocationResponse = fs.readFileSync(nestedExamplesAsValue + '/schemas/GeolocationResponse.yml', 'utf8'),
      testSchema = fs.readFileSync(nestedExamplesAsValue + '/schemas/test.yml', 'utf8'),
      expected = fs.readFileSync(nestedExamplesAsValue + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/index.yml'
          }
        ],
        data: [
          {
            path: '/index.yml',
            content: contentRoot
          },
          {
            path: '/parameters/_index.yml',
            content: parametersIndex
          },
          {
            path: '/parameters/arrival_time.yml',
            content: arrivalTime
          },
          {
            path: '/paths/_index.yml',
            content: pathsIndex
          },
          {
            path: '/paths/geolocate.yml',
            content: geolocate
          },
          {
            path: '/requests/maps_http_geolocation_celltowers_request.yml',
            content: requests
          },
          {
            path: '/schemas/_index.yml',
            content: schemasIndex
          },
          {
            path: '/schemas/Bounds.yml',
            content: bounds
          },
          {
            path: '/schemas/CellTower.yml',
            content: cellTower
          },
          {
            path: '/schemas/GeolocationRequest.yml',
            content: geolocationRequest
          },
          {
            path: '/schemas/LatLngLiteral.yml',
            content: latLngLiteral
          },
          {
            path: '/schemas/GeolocationResponse.yml',
            content: geolocationResponse
          },
          {
            path: '/requests/maps_http_geolocation_wifi_request.yml',
            content: wifiRequest
          },
          {
            path: '/responses/maps_http_geolocation_wifi_response.yml',
            content: wifiResponse
          },
          {
            path: '/schemas/test.yml',
            content: testSchema
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return correct map with inline and components resolving', async function () {
    let contentRootFile = fs.readFileSync(referencedPath + '/root.yaml', 'utf8'),
      path = fs.readFileSync(referencedPath + '/path.yaml', 'utf8'),
      pet = fs.readFileSync(referencedPath + '/pet.yaml', 'utf8'),
      cat = fs.readFileSync(referencedPath + '/cat.yaml', 'utf8'),
      expectedBundled = fs.readFileSync(referencedPath + '/expected.json', 'utf8'),
      expected = {
        '#/paths//pets/get': {
          path: '/path.yaml',
          type: 'inline'
        },
        '#/components/schemas/_cat.yaml': {
          path: '/cat.yaml',
          type: 'component'
        },
        '#/components/schemas/_pet.yaml': {
          path: '/pet.yaml',
          type: 'component'
        }
      },
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/pet.yaml',
            content: pet
          },
          {
            path: '/path.yaml',
            content: path
          },
          {
            path: '/cat.yaml',
            content: cat
          }
        ],
        options: { includeReferenceMap: true },
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].referenceMap).to.deep.equal(expected);
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expectedBundled);
  });

  it('Should return bundled file - referenced-components', async function () {
    let contentRootFile = fs.readFileSync(referencedComponents + '/root.yaml', 'utf8'),
      components = fs.readFileSync(referencedComponents + '/components.yaml', 'utf8'),
      responses = fs.readFileSync(referencedComponents + '/responses.yaml', 'utf8'),
      schemas = fs.readFileSync(referencedComponents + '/schemas.yaml', 'utf8'),
      schemaA = fs.readFileSync(referencedComponents + '/schemaA.yaml', 'utf8'),
      expected = fs.readFileSync(referencedComponents + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/components.yaml',
            content: components
          },
          {
            path: '/responses.yaml',
            content: responses
          },
          {
            path: '/schemas.yaml',
            content: schemas
          },
          {
            path: '/schemaA.yaml',
            content: schemaA
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file with referenced paths from roots', async function () {
    let contentRootFile = fs.readFileSync(referencedPathSchema + '/index.yml', 'utf8'),
      paths = fs.readFileSync(referencedPathSchema + '/paths.yml', 'utf8'),
      errorResponse = fs.readFileSync(referencedPathSchema + '/ErrorResponse.yml', 'utf8'),
      geolocationResponse = fs.readFileSync(referencedPathSchema + '/GeolocationResponse.yml', 'utf8'),
      geolocationRequest = fs.readFileSync(referencedPathSchema + '/GeolocationRequest.yml', 'utf8'),
      geolocate = fs.readFileSync(referencedPathSchema + '/geolocate.yml', 'utf8'),
      expectedMap = {
        '#/paths': {
          path: '/paths.yml',
          type: 'inline'
        },
        '#/paths//geolocation/v1/geolocate/post': {
          path: '/geolocate.yml',
          type: 'inline'
        },
        '#/components/schemas/_GeolocationRequest.yml': {
          path: '/GeolocationRequest.yml',
          type: 'component'
        },
        '#/components/schemas/_GeolocationResponse.yml': {
          path: '/GeolocationResponse.yml',
          type: 'component'
        },
        '#/components/schemas/_ErrorResponse.yml': {
          path: '/ErrorResponse.yml',
          type: 'component'
        },
        '#/components/schemas/_CellTower.yml': {
          path: '/CellTower.yml',
          type: 'component'
        }
      },
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/index.yml'
          }
        ],
        data: [
          {
            path: '/index.yml',
            content: contentRootFile
          },
          {
            path: '/paths.yml',
            content: paths
          },
          {
            path: '/ErrorResponse.yml',
            content: errorResponse
          },
          {
            path: '/GeolocationResponse.yml',
            content: geolocationResponse
          },
          {
            path: '/GeolocationRequest.yml',
            content: geolocationRequest
          },
          {
            path: '/geolocate.yml',
            content: geolocate
          }
        ],
        options: { includeReferenceMap: true },
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].referenceMap).to.deep.equal(expectedMap);
  });

  it('Should return bundled file - example_schema', async function () {
    let contentRootFile = fs.readFileSync(exampleValue + '/root.yml', 'utf8'),
      example = fs.readFileSync(exampleValue + '/example_value.yml', 'utf8'),
      expected = fs.readFileSync(exampleValue + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yml'
          }
        ],
        data: [
          {
            path: '/root.yml',
            content: contentRootFile
          },
          {
            path: '/example_value.yml',
            content: example
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should resolve examples correctly', async function () {
    let contentRootFile = fs.readFileSync(example2 + '/another.yml', 'utf8'),
      example = fs.readFileSync(example2 + '/example2.yaml', 'utf8'),
      expected = fs.readFileSync(example2 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/another.yml'
          }
        ],
        data: [
          {
            path: '/another.yml',
            content: contentRootFile
          },
          {
            path: '/example2.yaml',
            content: example
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should resolve circular reference in schema correctly', async function () {
    let contentRootFile = fs.readFileSync(schemaCircularRef + '/root.yaml', 'utf8'),
      schema = fs.readFileSync(schemaCircularRef + '/schemas/schemas.yaml', 'utf8'),
      expected = fs.readFileSync(schemaCircularRef + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/schemas/schemas.yaml',
            content: schema
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should resolve circular reference in schema correctly resolved inline', async function () {
    let contentRootFile = fs.readFileSync(schemaCircularRefInline + '/root.yaml', 'utf8'),
      schema = fs.readFileSync(schemaCircularRefInline + '/schemas/schemas.yaml', 'utf8'),
      expected = fs.readFileSync(schemaCircularRefInline + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/schemas/schemas.yaml',
            content: schema
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - remote_url_refs', async function () {
    let contentRootFile = fs.readFileSync(remoteURLRefExamples + '/root_2.json', 'utf8'),
      spacecraftId = fs.readFileSync(remoteURLRefExamples + '/schemas/SpacecraftId.json', 'utf8'),

      remoteRefResolver = async (refURL) => {
        if (refURL.includes('SpacecraftId')) {
          return JSON.parse(spacecraftId);
        }
      },
      expected = fs.readFileSync(remoteURLRefExamples + '/expected_2.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'root.json'
          }
        ],
        data: [
          {
            path: 'root.json',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        remoteRefResolver
      };

    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json with deep url refs - remote_url_refs', async function () {
    let contentRootFile = fs.readFileSync(remoteURLRefExamples + '/root.json', 'utf8'),
      spacecraft = fs.readFileSync(remoteURLRefExamples + '/schemas/Spacecraft.json', 'utf8'),
      peakThrustSecond = fs.readFileSync(remoteURLRefExamples + '/schemas/peakThrustSecond.json', 'utf8'),
      peakThrustSecondProperty =
        fs.readFileSync(remoteURLRefExamples + '/schemas/peakThrustSecondProperty.json', 'utf8'),
      remoteRefResolver = async (refURL) => {
        if (refURL.includes('peakThrustSecondProperty')) {
          return JSON.parse(peakThrustSecondProperty);
        }

        if (refURL.includes('peakThrustSecond')) {
          return JSON.parse(peakThrustSecond);
        }

        if (refURL.includes('Spacecraft')) {
          return JSON.parse(spacecraft);
        }
      },
      expected = fs.readFileSync(remoteURLRefExamples + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'root.json'
          }
        ],
        data: [
          {
            path: 'root.json',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        remoteRefResolver
      };

    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json with yaml content remote refs - remote_url_refs', async function () {
    let contentRootFile = fs.readFileSync(remoteURLRefExamples + '/yaml/root.json', 'utf8'),
      spacecraftId = fs.readFileSync(remoteURLRefExamples + '/yaml/SpacecraftId.yaml', 'utf8'),

      remoteRefResolver = async (refURL) => {
        if (refURL.includes('SpacecraftId')) {
          return spacecraftId;
        }
      },
      expected = fs.readFileSync(remoteURLRefExamples + '/yaml/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'root.json'
          }
        ],
        data: [
          {
            path: 'root.json',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        remoteRefResolver
      };

    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as yaml with yaml content remote refs - remote_url_refs', async function () {
    let contentRootFile = fs.readFileSync(remoteURLRefExamples + '/yaml/root.yaml', 'utf8'),
      spacecraftId = fs.readFileSync(remoteURLRefExamples + '/yaml/SpacecraftId.yaml', 'utf8'),

      remoteRefResolver = async (refURL) => {
        if (refURL.includes('SpacecraftId')) {
          return spacecraftId;
        }
      },
      expected = fs.readFileSync(remoteURLRefExamples + '/yaml/expected.yaml', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'root.json'
          }
        ],
        data: [
          {
            path: 'root.json',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'YAML',
        remoteRefResolver
      };

    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(res.output.data[0].bundledContent).to.be.equal(expected);
  });

  it('Should return bundled file as json with yaml content refs and root file - remote_url_refs', async function () {
    let contentRootFile = fs.readFileSync(remoteURLRefExamples + '/yaml/root.yaml', 'utf8'),
      spacecraftId = fs.readFileSync(remoteURLRefExamples + '/yaml/SpacecraftId.yaml', 'utf8'),

      remoteRefResolver = async (refURL) => {
        if (refURL.includes('SpacecraftId')) {
          return spacecraftId;
        }
      },
      expected = fs.readFileSync(remoteURLRefExamples + '/yaml/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'root.json'
          }
        ],
        data: [
          {
            path: 'root.json',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        remoteRefResolver
      };

    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json without resolving the reference if resolver threw err - remote_url_refs',
    async function () {
      let contentRootFile = fs.readFileSync(remoteURLRefExamples + '/root_3.json', 'utf8'),
        remoteRefResolver = async () => {
          // eslint-disable-next-line no-throw-literal
          throw { message: 'Something went wrong' };
        },
        expected = fs.readFileSync(remoteURLRefExamples + '/expected_3.json', 'utf8'),
        input = {
          type: 'multiFile',
          specificationVersion: '3.0',
          rootFiles: [
            {
              path: 'root.json'
            }
          ],
          data: [
            {
              path: 'root.json',
              content: contentRootFile
            }
          ],
          options: {},
          bundleFormat: 'JSON',
          remoteRefResolver
        };

      const res = await Converter.bundle(input);

      expect(res).to.not.be.empty;
      expect(res.result).to.be.true;
      expect(res.output.specification.version).to.equal('3.0');
      expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
    });

  it('Should return bundled file as json with circular url refs - remote_url_refs', async function () {
    let contentRootFile = fs.readFileSync(remoteURLRefExamples + '/circular/root.json', 'utf8'),
      schema = fs.readFileSync(remoteURLRefExamples + '/circular/schema.json', 'utf8'),

      remoteRefResolver = async (refURL) => {
        if (refURL.includes('schema')) {
          return JSON.parse(schema);
        }

        if (refURL.includes('root')) {
          return JSON.parse(contentRootFile);
        }
      },
      expected = fs.readFileSync(remoteURLRefExamples + '/circular/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'root.json'
          }
        ],
        data: [
          {
            path: 'root.json',
            content: contentRootFile
          }
        ],
        options: {},
        bundleFormat: 'JSON',
        remoteRefResolver
      };

    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });
});

describe('getReferences method when node does not have any reference', function() {
  it('Should return reference data empty if there are not any reference', async function() {
    const userData = 'type: object\n' +
        'properties:\n' +
        '  id:\n' +
        '    type: integer\n' +
        '  userName:\n' +
        '    type: string',
      userNode = parse.getOasObject(userData),
      nodeIsRoot = false,
      result = await getReferences(
        userNode.oasObject,
        nodeIsRoot,
        removeLocalReferenceFromPath,
        'the/parent/filename',
        '3.0',
        {},
        ''
      );

    expect(result.referencesInNode).to.be.an('array').with.length(0);
    expect(Object.keys(result.nodeReferenceDirectory).length).to.equal(0);
  });

  it('Should return the reference data - schema_from_response', async function() {
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
      result = await getReferences(
        userNode.oasObject,
        nodeIsRoot,
        removeLocalReferenceFromPath,
        'the/parent/filename',
        '3.0',
        {},
        '',
        [],
        {}
      );
    expect(result.nodeReferenceDirectory).to.be.an('object');
    expect(Object.keys(result.nodeReferenceDirectory).length).to.equal(1);
    expect(result.referencesInNode).to.be.an('array').with.length(1);
    expect(Object.keys(result.nodeReferenceDirectory)[0])
      .to.equal('the/parent/user.yaml');
    expect(result.referencesInNode[0].path).to.equal('./user.yaml');
    expect(result.referencesInNode[0].newValue.$ref).to.equal('the/parent/user.yaml');
  });
});
