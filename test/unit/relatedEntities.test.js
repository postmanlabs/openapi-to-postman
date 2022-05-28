const { getReferences,
    isLocalRef,
    getAdjacentAndMissing,
    findNodeFromPath,
    getRelatedEntities,
    pathSolver } = require('./../../lib/relatedEntities'),
  { isExtRef,
    removeLocalReferenceFromPath } = require('./../../lib/jsonPointer'),
  path = require('path'),
  expect = require('chai').expect,
  PET_STORE_SEPARATED = '../data/petstore separate yaml/spec',
  newPet = path.join(__dirname, PET_STORE_SEPARATED + '/NewPet.yaml'),
  fs = require('fs'),
  parse = require('./../../lib/parse.js'),
  swaggerRoot = path.join(__dirname, PET_STORE_SEPARATED + '/swagger.yaml'),
  mockedInputPetstore = {
    'components': {
      'schemas': {
        'Pet': {
          'required': [
            'id',
            'name'
          ],
          'properties': {
            'id': {
              'type': 'integer',
              'format': 'int64'
            },
            'name': {
              'type': 'string'
            },
            'tag': {
              'type': 'string'
            }
          }
        },
        'Pets': {
          'type': 'array',
          'items': {
            '$ref': '#/components/schemas/Pet'
          }
        },
        'Error': {
          'required': [
            'code',
            'message'
          ],
          'properties': {
            'code': {
              'type': 'integer',
              'format': 'int32'
            },
            'message': {
              'type': 'string'
            }
          }
        }
      }
    }
  };


describe('getReferences function', function () {
  it('should return 1 local reference from input', function () {
    const inputNode = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Pet'
        }
      },
      result = getReferences(inputNode, isLocalRef, pathSolver);
    expect(result.length).to.equal(1);
    expect(result[0].path).to.equal('#/components/schemas/Pet');

  });

  it('should return 1 local reference from input, even when repeated', function () {
    const inputNode = {
        type: 'object',
        properties: {
          pet: { $ref: '#/components/schemas/Pet' },
          newPet: { $ref: '#/components/schemas/Pet' }
        }
      },
      result = getReferences(inputNode, isLocalRef, pathSolver);
    expect(result.length).to.equal(1);
    expect(result[0].path).to.equal('#/components/schemas/Pet');
  });

  it('should not identify an external ref as local ref', function () {
    const inputNode = {
        type: 'object',
        properties: {
          pet: { $ref: 'Pet.yaml' },
          newPet: { $ref: 'Pet.yaml' }
        }
      },
      result = getReferences(inputNode, isLocalRef, pathSolver);
    expect(result.length).to.equal(0);
  });


  it('should return 1 reference from input', function () {
    const parsedContentFile = parse.getOasObject(fs.readFileSync(newPet, 'utf8')),
      result = getReferences(parsedContentFile, isExtRef, removeLocalReferenceFromPath);
    expect(result.length).to.equal(1);
    expect(result[0].path).to.equal('Pet.yaml');

  });

  it('should return unique references from input', function () {
    const parsedContentFile = parse.getOasObject(fs.readFileSync(swaggerRoot, 'utf8')),
      result = getReferences(parsedContentFile, isExtRef, removeLocalReferenceFromPath);
    expect(result.length).to.equal(5);
    expect(result[0].path).to.equal('parameters.yaml');
    expect(result[1].path).to.equal('parameters.yaml');
    expect(result[2].path).to.equal('Pet.yaml');
    expect(result[3].path).to.equal('../common/Error.yaml');
    expect(result[4].path).to.equal('NewPet.yaml');

  });


});

describe('findNodeFromPath method', function () {
  it('should return the node by the json pointer', function () {
    const res = findNodeFromPath('#/components/schemas/Pet', mockedInputPetstore);
    expect(res).to.not.be.undefined;
  });
});

describe('getAdjacentAndMissing function', function () {
  it('should return 1 adjacent reference from input', function () {
    const inputNode = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Pet'
        }
      },
      { graphAdj, missingNodes } = getAdjacentAndMissing(inputNode, mockedInputPetstore);
    expect(graphAdj.length).to.equal(1);
    expect(missingNodes.length).to.equal(0);

  });

  it('should return 1 missing reference from input', function () {
    const inputNode = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Dog'
        }
      },
      { graphAdj, missingNodes } = getAdjacentAndMissing(inputNode, mockedInputPetstore);
    expect(graphAdj.length).to.equal(0);
    expect(missingNodes.length).to.equal(1);
    expect(missingNodes[0].$ref).to.equal('#/components/schemas/Dog');
  });
});

describe('getRelatedEntities function', function () {
  it('should return 1 adjacent and the root', function () {
    const inputNode = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Pet'
        }
      },
      { relatedEntities, missingRelatedEntities } = getRelatedEntities(inputNode, mockedInputPetstore);
    expect(relatedEntities.length).to.equal(2);
    expect(relatedEntities[1].$info.$ref).to.equal('#/components/schemas/Pet');
    expect(relatedEntities[1].$info.name).to.equal('Pet');
    expect(missingRelatedEntities.length).to.equal(0);

  });

  it('should return 1 adjacent and the root even with 2 refs', function () {
    const inputNode = {
        type: 'object',
        properties: {
          pet: { $ref: '#/components/schemas/Pet' },
          newPet: { $ref: '#/components/schemas/Pets' }
        }
      },
      { relatedEntities, missingRelatedEntities } = getRelatedEntities(inputNode, mockedInputPetstore);
    expect(relatedEntities.length).to.equal(3);
    expect(relatedEntities[1].$info.$ref).to.equal('#/components/schemas/Pets');
    expect(relatedEntities[1].$info.name).to.equal('Pets');
    expect(relatedEntities[2].$info.$ref).to.equal('#/components/schemas/Pet');
    expect(relatedEntities[2].$info.name).to.equal('Pet');
    expect(missingRelatedEntities.length).to.equal(0);

  });

  it('should return 1 missing reference from input', function () {
    const inputNode = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Dog'
        }
      },
      { relatedEntities, missingRelatedEntities } = getRelatedEntities(inputNode, mockedInputPetstore);
    expect(relatedEntities.length).to.equal(1);
    expect(missingRelatedEntities.length).to.equal(1);
    expect(missingRelatedEntities[0].$ref).to.equal('#/components/schemas/Dog');
  });

  it('should ignore external references', function () {
    const inputNode = {
        type: 'array',
        items: {
          $ref: 'pet.yaml'
        }
      },
      { relatedEntities, missingRelatedEntities } = getRelatedEntities(inputNode, mockedInputPetstore);
    expect(relatedEntities.length).to.equal(1);
    expect(missingRelatedEntities.length).to.equal(0);
  });

});
