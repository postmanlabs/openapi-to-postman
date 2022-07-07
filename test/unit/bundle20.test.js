let expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  SWAGGER_MULTIFILE_FOLDER = '../data/toBundleExamples/swagger20',
  refTags20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/referenced_tags'),
  basicExample = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/basicExample'),
  refPaths20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/referenced_paths'),
  refPathsRefToLocalSchema20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/referenced_paths_local_schema'),
  nestedRefs = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/nestedRefs'),
  nestedLocalRef = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/nestedLocalRef'),
  withParametersAndItems = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/withParametersAndItems'),
  bringLocalFromExternal = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/bringLocalDependenciesFromExternal'),
  bringLocalFromExternalWithItems = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER +
    '/bringLocalDependenciesFromExternalWithItems'),
  bringLocalFromExternalMultiple = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER +
    '/bringLocalDependenciesFromExternalMultiple'),
  multipleRefFromRootComponents = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/multipleRefFromRootComponents'),
  sameRefDifferentSource = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/sameRefDifferentSource'),
  nestedProperties20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/nestedProperties20'),
  simpleRef = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/simpleRef'),
  refExample20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/referenced_example'),
  SWAGGER_PETSTORE_FOLDER = path.join(__dirname, '../data/swaggerMultifile/petstore-separate-yaml'),
  additionalProperties20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/additionalProperties'),
  referencedSecuritySchemes20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/referenced_security_schemes'),
  referencedResponse20 = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER + '/referenced_response'),
  schemaCollision = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER +
      '/schema_collision_from_responses'),
  schemaCollisionWRootComponent = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER +
      '/schema_collision_w_root_components'),
  referencedRootComponents = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER +
    '/referenced_root_components'),
  referencedExampleKey = path.join(__dirname, SWAGGER_MULTIFILE_FOLDER +
    '/referenced_example_key');

describe('bundle files method - 2.0', function() {
  it('Should return bundled result from - nestedProperties20', async function() {
    let contentRootFile = fs.readFileSync(nestedProperties20 + '/index.yaml', 'utf8'),
      info = fs.readFileSync(nestedProperties20 + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(nestedProperties20 + '/paths.yaml', 'utf8'),
      age = fs.readFileSync(nestedProperties20 + '/schemas/age.yaml', 'utf8'),
      hobbies = fs.readFileSync(nestedProperties20 + '/schemas/hobbies.yaml', 'utf8'),
      hobby = fs.readFileSync(nestedProperties20 + '/schemas/hobby.yaml', 'utf8'),
      user = fs.readFileSync(nestedProperties20 + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(nestedProperties20 + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/schemas/user.yaml',
            content: user
          },
          {
            path: '/schemas/age.yaml',
            content: age
          },
          {
            path: '/schemas/hobbies.yaml',
            content: hobbies
          },
          {
            path: '/schemas/hobby.yaml',
            content: hobby
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

  it('Should return bundled result from - sameRefDifferentSource', async function() {
    let contentRootFile = fs.readFileSync(sameRefDifferentSource + '/index.yaml', 'utf8'),
      info = fs.readFileSync(sameRefDifferentSource + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(sameRefDifferentSource + '/paths.yaml', 'utf8'),
      user = fs.readFileSync(sameRefDifferentSource + '/schemas/user.yaml', 'utf8'),
      userDetail = fs.readFileSync(sameRefDifferentSource + '/schemas/detail.yaml', 'utf8'),
      client = fs.readFileSync(sameRefDifferentSource + '/otherSchemas/client.yaml', 'utf8'),
      clientDetail = fs.readFileSync(sameRefDifferentSource + '/otherSchemas/detail.yaml', 'utf8'),
      expected = fs.readFileSync(sameRefDifferentSource + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/schemas/user.yaml',
            content: user
          },
          {
            path: '/schemas/detail.yaml',
            content: userDetail
          },
          {
            path: '/otherSchemas/client.yaml',
            content: client
          },
          {
            path: '/otherSchemas/detail.yaml',
            content: clientDetail
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

  it('Should return bundled result from - multipleRefFromRootComponents', async function() {
    let contentRootFile = fs.readFileSync(multipleRefFromRootComponents + '/index.yaml', 'utf8'),
      info = fs.readFileSync(multipleRefFromRootComponents + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(multipleRefFromRootComponents + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(multipleRefFromRootComponents + '/pet.yaml', 'utf8'),
      parameters = fs.readFileSync(multipleRefFromRootComponents + '/parameters/parameters.yaml', 'utf8'),
      expected = fs.readFileSync(multipleRefFromRootComponents + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
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
          },
          {
            path: '/parameters/parameters.yaml',
            content: parameters
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

  it('Should return bundled result from - bringLocalDependenciesFromExternalMultiple', async function() {
    let contentRootFile = fs.readFileSync(bringLocalFromExternalMultiple + '/index.yaml', 'utf8'),
      info = fs.readFileSync(bringLocalFromExternalMultiple + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(bringLocalFromExternalMultiple + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(bringLocalFromExternalMultiple + '/pet.yaml', 'utf8'),
      food = fs.readFileSync(bringLocalFromExternalMultiple + '/food.yaml', 'utf8'),
      parameters = fs.readFileSync(bringLocalFromExternalMultiple + '/parameters/parameters.yaml', 'utf8'),
      expected = fs.readFileSync(bringLocalFromExternalMultiple + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
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
          },
          {
            path: '/food.yaml',
            content: food
          },
          {
            path: '/parameters/parameters.yaml',
            content: parameters
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

  it('Should return bundled result from - bringLocalDependenciesFromExternalWithItems', async function() {
    let contentRootFile = fs.readFileSync(bringLocalFromExternalWithItems + '/index.yaml', 'utf8'),
      info = fs.readFileSync(bringLocalFromExternalWithItems + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(bringLocalFromExternalWithItems + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(bringLocalFromExternalWithItems + '/pet.yaml', 'utf8'),
      expected = fs.readFileSync(bringLocalFromExternalWithItems + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled result from - bringLocalDependenciesFromExternal', async function() {
    let contentRootFile = fs.readFileSync(bringLocalFromExternal + '/index.yaml', 'utf8'),
      info = fs.readFileSync(bringLocalFromExternal + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(bringLocalFromExternal + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(bringLocalFromExternal + '/pet.yaml', 'utf8'),
      expected = fs.readFileSync(bringLocalFromExternal + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled result from - withParametersAndItems', async function() {
    let contentRootFile = fs.readFileSync(withParametersAndItems + '/index.yaml', 'utf8'),
      info = fs.readFileSync(withParametersAndItems + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(withParametersAndItems + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(withParametersAndItems + '/pet.yaml', 'utf8'),
      parameters = fs.readFileSync(withParametersAndItems + '/parameters/parameters.yaml', 'utf8'),
      expected = fs.readFileSync(withParametersAndItems + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
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
          },
          {
            path: '/parameters/parameters.yaml',
            content: parameters
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

  it('Should return bundled result from - nestedLocalRef', async function() {
    let contentRootFile = fs.readFileSync(nestedLocalRef + '/index.yaml', 'utf8'),
      info = fs.readFileSync(nestedLocalRef + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(nestedLocalRef + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(nestedLocalRef + '/schemas/pet.yaml', 'utf8'),
      favoriteFood = fs.readFileSync(nestedLocalRef + '/schemas/favorite_food.yaml', 'utf8'),
      expected = fs.readFileSync(nestedLocalRef + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/schemas/pet.yaml',
            content: pet
          },
          {
            path: '/schemas/favorite_food.yaml',
            content: favoriteFood
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

  it('Should return bundled result from - nestedRefs', async function() {
    let contentRootFile = fs.readFileSync(nestedRefs + '/index.yaml', 'utf8'),
      info = fs.readFileSync(nestedRefs + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(nestedRefs + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(nestedRefs + '/schemas/pet.yaml', 'utf8'),
      favoriteFood = fs.readFileSync(nestedRefs + '/schemas/favorite_food.yaml', 'utf8'),
      expected = fs.readFileSync(nestedRefs + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/paths.yaml',
            content: paths
          },
          {
            path: '/schemas/pet.yaml',
            content: pet
          },
          {
            path: '/schemas/favorite_food.yaml',
            content: favoriteFood
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

  it('Should return bundled result from - basicExample', async function() {
    let contentRootFile = fs.readFileSync(basicExample + '/index.yaml', 'utf8'),
      info = fs.readFileSync(basicExample + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(basicExample + '/paths.yaml', 'utf8'),
      expected = fs.readFileSync(basicExample + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled result from - simpleRef', async function() {
    let contentRootFile = fs.readFileSync(simpleRef + '/index.yaml', 'utf8'),
      info = fs.readFileSync(simpleRef + '/info.yaml', 'utf8'),
      paths = fs.readFileSync(simpleRef + '/paths.yaml', 'utf8'),
      pet = fs.readFileSync(simpleRef + '/pet.yaml', 'utf8'),
      expected = fs.readFileSync(simpleRef + '/bundleExpected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/index.yaml'
          }
        ],
        data: [
          {
            path: '/index.yaml',
            content: contentRootFile
          },
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
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file with referenced tags from root', async function () {
    let contentRootFile = fs.readFileSync(refTags20 + '/root.yaml', 'utf8'),
      tags = fs.readFileSync(refTags20 + '/tags/tags.yaml', 'utf8'),
      expected = fs.readFileSync(refTags20 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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

  it('Should return bundled file with referenced paths from root', async function () {
    let contentRootFile = fs.readFileSync(refPaths20 + '/root.yaml', 'utf8'),
      paths = fs.readFileSync(refPaths20 + '/paths/paths.yaml', 'utf8'),
      path = fs.readFileSync(refPaths20 + '/paths/path.yaml', 'utf8'),
      expected = fs.readFileSync(refPaths20 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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

  it('Should return bundled file with referenced paths from root - path references local schema', async function () {
    let contentRootFile = fs.readFileSync(refPathsRefToLocalSchema20 + '/root.yaml', 'utf8'),
      paths = fs.readFileSync(refPathsRefToLocalSchema20 + '/paths/paths.yaml', 'utf8'),
      path = fs.readFileSync(refPathsRefToLocalSchema20 + '/paths/path.yaml', 'utf8'),
      expected = fs.readFileSync(refPathsRefToLocalSchema20 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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

  it('Should return bundled file with referenced example', async function () {
    let contentRootFile = fs.readFileSync(refExample20 + '/root.yaml', 'utf8'),
      examples = fs.readFileSync(refExample20 + '/examples.yaml', 'utf8'),
      expected = fs.readFileSync(refExample20 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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
            content: examples
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

  it('Should return bundled file from - petstore-separated-yaml (contains allOf)', async function() {
    let contentRootFile = fs.readFileSync(SWAGGER_PETSTORE_FOLDER + '/spec/swagger.yaml', 'utf8'),
      parameters = fs.readFileSync(SWAGGER_PETSTORE_FOLDER + '/spec/parameters.yaml', 'utf8'),
      pet = fs.readFileSync(SWAGGER_PETSTORE_FOLDER + '/spec/Pet.yaml', 'utf8'),
      newPet = fs.readFileSync(SWAGGER_PETSTORE_FOLDER + '/spec/NewPet.yaml', 'utf8'),
      error = fs.readFileSync(SWAGGER_PETSTORE_FOLDER + '/common/Error.yaml', 'utf8'),
      expected = fs.readFileSync(SWAGGER_PETSTORE_FOLDER + '/expectedBundle.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
        rootFiles: [
          {
            path: '/spec/swagger.yaml'
          }
        ],
        data: [
          {
            path: '/spec/swagger.yaml',
            content: contentRootFile
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
            path: '/spec/NewPet.yaml',
            content: newPet
          },
          {
            path: '/common/Error.yaml',
            content: error
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

  it('Should bundle file from - additionalProperties 2.0', async function() {
    let contentRootFile = fs.readFileSync(additionalProperties20 + '/root.yaml', 'utf8'),
      pet = fs.readFileSync(additionalProperties20 + '/pet.yaml', 'utf8'),
      additionalProps = fs.readFileSync(additionalProperties20 + '/additionalProperties.yaml', 'utf8'),
      expected = fs.readFileSync(additionalProperties20 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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

  it('Should return bundled file - referenced Security Schemes', async function () {
    let contentRoot = fs.readFileSync(referencedSecuritySchemes20 + '/root.yaml', 'utf8'),
      contentRef = fs.readFileSync(referencedSecuritySchemes20 + '/sschemes.yaml', 'utf8'),
      expected = fs.readFileSync(referencedSecuritySchemes20 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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

  it('Should bundle file from - referenced response 2.0', async function() {
    let contentRootFile = fs.readFileSync(referencedResponse20 + '/root.yaml', 'utf8'),
      referenced = fs.readFileSync(referencedResponse20 + '/response.yaml', 'utf8'),
      expected = fs.readFileSync(referencedResponse20 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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
            path: '/response.yaml',
            content: referenced
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

  it('Should return bundled file as json - schema_collision_from_responses', async function () {
    let contentRootFile = fs.readFileSync(schemaCollision + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaCollision + '/schemas_/_user.yaml', 'utf8'),
      user1 = fs.readFileSync(schemaCollision + '/schemas/__user.yaml', 'utf8'),
      user2 = fs.readFileSync(schemaCollision + '/schemas__/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaCollision + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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
    expect(res.output.specification.version).to.equal('2.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - schema_collision_w_root_components', async function () {
    let contentRootFile = fs.readFileSync(schemaCollisionWRootComponent + '/root.yaml', 'utf8'),
      user = fs.readFileSync(schemaCollisionWRootComponent + '/schemas/user.yaml', 'utf8'),
      expected = fs.readFileSync(schemaCollisionWRootComponent + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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
    expect(res.output.specification.version).to.equal('2.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - referenced_root_components', async function () {
    let contentRootFile = fs.readFileSync(referencedRootComponents + '/root.yaml', 'utf8'),
      definitions = fs.readFileSync(referencedRootComponents + '/definitions.yaml', 'utf8'),
      info = fs.readFileSync(referencedRootComponents + '/info.yaml', 'utf8'),
      responses = fs.readFileSync(referencedRootComponents + '/responses.yaml', 'utf8'),
      securitySchemes = fs.readFileSync(referencedRootComponents + '/securitySchemes.yaml', 'utf8'),
      tags = fs.readFileSync(referencedRootComponents + '/tags.yaml', 'utf8'),
      paths = fs.readFileSync(referencedRootComponents + '/paths/paths.yaml', 'utf8'),
      singlePath = fs.readFileSync(referencedRootComponents + '/paths/path.yaml', 'utf8'),
      expected = fs.readFileSync(referencedRootComponents + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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
            path: '/definitions.yaml',
            content: definitions
          },
          {
            path: '/info.yaml',
            content: info
          },
          {
            path: '/responses.yaml',
            content: responses
          },
          {
            path: '/securitySchemes.yaml',
            content: securitySchemes
          },
          {
            path: '/tags.yaml',
            content: tags
          },
          {
            path: '/paths/paths.yaml',
            content: paths
          },
          {
            path: '/paths/path.yaml',
            content: singlePath
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('2.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - referenced_example_key', async function () {
    let contentRootFile = fs.readFileSync(referencedExampleKey + '/root.yaml', 'utf8'),
      example = fs.readFileSync(referencedExampleKey + '/example.yaml', 'utf8'),
      expected = fs.readFileSync(referencedExampleKey + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '2.0',
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
            path: '/example.yaml',
            content: example
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('2.0');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });
});
