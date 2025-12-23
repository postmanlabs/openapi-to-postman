let expect = require('chai').expect,
  Converter = require('../../dist/src/index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  RELATED_FILES = '../data/relatedFiles',
  PET_STORE_SEPARATED_COMMON = '../data/petstore separate yaml/common',
  PET_STORE_MULTIPLE_FILES = '../data/petstore separate yaml',
  VALID_OPENAPI_31_PATH = '../data/valid_openapi31X',
  validPetstore = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml'),
  petstoreSeparatedPet = path.join(__dirname, PET_STORE_SEPARATED + '/Pet.yaml'),
  petstoreSeparatedError = path.join(__dirname, PET_STORE_SEPARATED_COMMON + '/Error.yaml'),
  petstoreMultipleFiles = path.join(__dirname, PET_STORE_MULTIPLE_FILES + '/spec/openapi.yaml'),
  resourcesPets = path.join(__dirname, PET_STORE_MULTIPLE_FILES + '/resources/pets.yaml'),
  resourcesPet = path.join(__dirname, PET_STORE_MULTIPLE_FILES + '/resources/pet.yaml'),
  paramIndex = path.join(__dirname, PET_STORE_MULTIPLE_FILES + '/parameters/_index.yaml'),
  schemaIndex = path.join(__dirname, PET_STORE_MULTIPLE_FILES + '/schemas/_index.yaml'),
  responseIndex = path.join(__dirname, PET_STORE_MULTIPLE_FILES + '/responses/_index.yaml'),
  swaggerRoot = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  newPet = path.join(__dirname, PET_STORE_SEPARATED + '/NewPet.yaml'),
  missedRef = path.join(__dirname, RELATED_FILES + '/missedRef.yaml'),
  circularRefNewPet = path.join(__dirname, RELATED_FILES + '/NewPet.yaml'),
  refToRoot = path.join(__dirname, RELATED_FILES + '/refToRoot.yaml'),
  internalRefOnly = path.join(__dirname, VALID_OPENAPI_PATH + '/deepObjectLengthProperty.yaml'),
  circularRef = path.join(__dirname, RELATED_FILES + '/circularRef.yaml'),
  oldPet = path.join(__dirname, RELATED_FILES + '/oldPet.yaml'),
  pet = path.join(__dirname, RELATED_FILES + '/Pet.yaml'),
  validHopService31x = path.join(__dirname, VALID_OPENAPI_31_PATH + '/yaml/hopService.yaml');

describe('detectRelatedFiles method', function () {

  it('should return error when there is no root in the entry', async function () {
    let contentFile = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
        ],
        data: [
          {
            path: '/Pet.yaml',
            content: contentFile
          }
        ]
      };
    try {
      await Converter.detectRelatedFiles(input);
    }
    catch (error) {
      expect(error.message).to.equal('Input should have at least one root file');
    }
  });

  it('should throw error when rootfiles is undefined', async function () {
    let contentFile = fs.readFileSync(validPetstore, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        data: [
          {
            path: '/petstore.yaml',
            content: contentFile
          }
        ]
      };
    try {
      await Converter.detectRelatedFiles(input);
    }
    catch (error) {
      expect(error.message).to.equal('Input should have at least one root file');
    }
  });

  it('should return adjacent and missing nodes', async function () {
    const contentFileMissedRef = fs.readFileSync(missedRef, 'utf8'),
      contentFilePet = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/missedRef.yaml'
          }
        ],
        data: [
          {
            path: '/missedRef.yaml',
            content: contentFileMissedRef
          },
          {
            path: '/Pet.yaml',
            content: contentFilePet
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/missedRef.yaml');
    expect(res.output.data[0].relatedFiles[0].path).to.equal('/Pet.yaml');
    expect(res.output.data[0].missingRelatedFiles[0].path).to.equal('/common/Error.yaml');

  });

  it('should return adjacent and missing nodes and exclude root if some file is pointing to it', async function () {
    const contentFilRefToRoot = fs.readFileSync(refToRoot, 'utf8'),
      contentFilePet = fs.readFileSync(circularRefNewPet, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'refToRoot.yaml'
          }
        ],
        data: [
          {
            path: 'refToRoot.yaml',
            content: contentFilRefToRoot
          },
          {
            path: 'NewPet.yaml',
            content: contentFilePet
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles[0].path).to.equal('NewPet.yaml');
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(1);
    expect(res.output.data[0].missingRelatedFiles[0].path).to.equal('Pet.yaml');

  });

  it('should not return local ref as missing node', async function () {
    const contentFileMissedRef = fs.readFileSync(internalRefOnly, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/deepObjectLengthProperty.yaml'
          }
        ],
        data: [{
          path: '/deepObjectLengthProperty.yaml',
          content: contentFileMissedRef
        }]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/deepObjectLengthProperty.yaml');
    expect(res.output.data[0].relatedFiles.length).to.equal(0);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(0);

  });

  it('should return adjacent and missing nodes with circular refs', async function () {
    const contentCircularRef = fs.readFileSync(circularRef, 'utf8'),
      contentFileOldPet = fs.readFileSync(oldPet, 'utf8'),
      contentFilePet = fs.readFileSync(pet, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'circularRef.yaml'
          }
        ],
        data: [
          {
            path: 'circularRef.yaml',
            content: contentCircularRef
          },
          {
            path: 'oldPet.yaml',
            content: contentFileOldPet
          },
          {
            path: 'Pet.yaml',
            content: contentFilePet
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles.length).to.equal(2);
    expect(res.output.data[0].relatedFiles[0].path).to.equal('oldPet.yaml');
    expect(res.output.data[0].relatedFiles[1].path).to.equal('Pet.yaml');
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(0);

  });

  it('should return related in a folder structure with local pointers in $ref', async function () {
    const swaggerRootContent = fs.readFileSync(swaggerRoot, 'utf8'),
      petContent = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      parametersContent = fs.readFileSync(petstoreSeparatedPet, 'utf8'),
      newPetContent = fs.readFileSync(newPet, 'utf8'),
      errorContent = fs.readFileSync(petstoreSeparatedError, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: 'separatedFiles/spec/swagger.yaml'
          }
        ],
        data: [
          {
            path: 'separatedFiles/spec/swagger.yaml',
            content: swaggerRootContent
          },
          {
            path: 'separatedFiles/spec/Pet.yaml',
            content: petContent
          },
          {
            path: 'separatedFiles/spec/parameters.yaml',
            content: parametersContent
          },
          {
            path: 'separatedFiles/spec/NewPet.yaml',
            content: newPetContent
          },
          {
            path: 'separatedFiles/common/Error.yaml',
            content: errorContent
          }
        ]
      },
      res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles.length).to.equal(4);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(0);
  });

  it('should filter root according to the version 3.1', async function () {
    let contentFilePet = fs.readFileSync(validPetstore, 'utf8'),
      contentFileHop = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.1',
        rootFiles: [
          {
            path: '/petstore.yaml'
          },
          {
            path: '/hopService.yaml'
          }
        ],
        data: [{
          path: '/petstore.yaml',
          content: contentFilePet
        },
        {
          path: '/hopService.yaml',
          content: contentFileHop
        }]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/hopService.yaml');
  });

  it('should filter root according to the version default', async function () {
    let contentFilePet = fs.readFileSync(validPetstore, 'utf8'),
      contentFileHop = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'multiFile',
        rootFiles: [
          {
            path: '/petstore.yaml'
          },
          {
            path: '/hopService.yaml'
          }
        ],
        data: [{
          path: '/petstore.yaml',
          content: contentFilePet
        },
        {
          path: '/hopService.yaml',
          content: contentFileHop
        }]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/petstore.yaml');
  });

  it('should return 5 missing related files', async function () {
    let contentFile = fs.readFileSync(petstoreMultipleFiles, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/openapi.yaml'
          }
        ],
        data: [{
          path: '/openapi.yaml',
          content: contentFile
        }]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles.length).to.equal(0);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(5);
  });

  it('should return ignore one already visited node', async function () {
    let contentRootFile = fs.readFileSync(petstoreMultipleFiles, 'utf8'),
      contentFileResPets = fs.readFileSync(resourcesPets, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/openapi.yaml'
          }
        ],
        data: [
          {
            path: '/openapi.yaml',
            content: contentRootFile
          },
          {
            path: '/resources/pets.yaml',
            content: contentFileResPets
          }
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles.length).to.equal(1);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(8);
  });

  it('should return 6 missing nodes', async function () {
    let contentRootFile = fs.readFileSync(petstoreMultipleFiles, 'utf8'),
      contentFileResPets = fs.readFileSync(resourcesPets, 'utf8'),
      contentFileResPet = fs.readFileSync(resourcesPet, 'utf8'),
      contentFileParamIndex = fs.readFileSync(paramIndex, 'utf8'),
      contentFileSchemaIndex = fs.readFileSync(schemaIndex, 'utf8'),
      contentFileResponseIndex = fs.readFileSync(responseIndex, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
          {
            path: '/openapi.yaml'
          }
        ],
        data: [
          {
            path: '/openapi.yaml',
            content: contentRootFile
          },
          {
            path: '/resources/pets.yaml',
            content: contentFileResPets
          },
          {
            path: '/resources/pet.yaml',
            content: contentFileResPet
          },
          {
            path: '/parameters/_index.yaml',
            content: contentFileParamIndex
          },
          {
            path: '/schemas/_index.yaml',
            content: contentFileSchemaIndex
          },
          {
            path: '/responses/_index.yaml',
            content: contentFileResponseIndex
          }
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].relatedFiles.length).to.equal(5);
    expect(res.output.data[0].missingRelatedFiles.length).to.equal(6);
  });

  it('should return error when "type" parameter is not sent', async function () {
    let contentRootFile = fs.readFileSync(petstoreMultipleFiles, 'utf8'),
      contentFileResPets = fs.readFileSync(resourcesPets, 'utf8'),
      input = {
        rootFiles: [
          {
            path: '/openapi.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: '/resources/pets.yaml',
            content: contentFileResPets
          }
        ]
      };

    try {
      await Converter.detectRelatedFiles(input);
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('"Type" parameter should be provided');
    }
  });

  it('should return error when input is an empty object', async function () {
    try {
      await Converter.detectRelatedFiles({});
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('Input object must have "type" and "data" information');
    }
  });

  it('should return error when input data is an empty array', async function () {
    try {
      await Converter.detectRelatedFiles({ type: 'multiFile', data: [] });
    }
    catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.equal('"Data" parameter should be provided');
    }
  });

  it('Should throw error when root is not present in data array', async function () {
    let contentFileHop = fs.readFileSync(validHopService31x, 'utf8'),
      input = {
        type: 'multiFile',
        rootFiles: [
          {
            path: '/petstore.yaml'
          }
        ],
        data: [
          {
            path: '/hopService.yaml',
            content: contentFileHop
          }]
      };
    try {
      await Converter.detectRelatedFiles(input);
    }
    catch (error) {
      expect(error.message).to.equal('Root file content not found in data array');
    }
  });

  it('Should return 1 file with 2 root but 1 is missing', async function () {
    let contentFilePet = fs.readFileSync(validPetstore, 'utf8'),
      input = {
        type: 'multiFile',
        rootFiles: [
          {
            path: '/petstore.yaml'
          },
          {
            path: '/petstore2.yaml'
          }
        ],
        data: [{
          path: '/petstore.yaml',
          content: contentFilePet
        }]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/petstore.yaml');
    expect(res.output.data.length).to.equal(1);
  });

  it('Should take the root file from data array root file prop empty array', async function () {
    let contentFile = fs.readFileSync(swaggerRoot, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        rootFiles: [
        ],
        data: [
          {
            path: '/swagger.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/swagger.yaml');
    expect(res.output.data.length).to.equal(1);
  });

  it('Should take the root file from data array root file prop undefined', async function () {
    let contentFile = fs.readFileSync(swaggerRoot, 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.0',
        data: [
          {
            path: '/swagger.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRelatedFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].rootFile.path).to.equal('/swagger.yaml');
    expect(res.output.data.length).to.equal(1);
  });
});
