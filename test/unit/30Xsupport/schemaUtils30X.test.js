const { expect } = require('chai'),
  concreteUtils = require('../../../lib/30XUtils/schemaUtils30X'),
  fs = require('fs'),
  valid30xFolder = './test/data/valid_openapi',
  invalid30xFolder = './test/data/invalid_openapi';

describe('parseSpec method', function () {
  it('should return true and a parsed specification', function () {
    let fileContent = fs.readFileSync(valid30xFolder + '/petstore.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent);
    expect(parsedSpec.result).to.be.true;
    expect(parsedSpec.openapi.openapi).to.equal('3.0.0');
  });

  it('should return false and invalid format message when input content is sent', function () {
    let fileContent = fs.readFileSync(invalid30xFolder + '/empty-spec.yaml', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent);
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Invalid format. Input must be in YAML or JSON format.');
  });

  it('should return false and Spec must contain info object', function () {
    let fileContent = fs.readFileSync(invalid30xFolder + '/invalid-no-info.yaml', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent);
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

});

describe('getRequiredData method', function() {
  it('Should return all required data from file', function() {
    const fileContent = fs.readFileSync(valid30xFolder + '/petstore.json', 'utf8'),
      requiredData = concreteUtils.getRequiredData(JSON.parse(fileContent));
    expect(requiredData).to.be.an('object')
      .and.to.have.all.keys('info', 'paths', 'components');
  });
});

describe('compareTypes method', function() {
  it('Should match type in spec with type to compare when type in spec is a string when they are equal', function() {
    const typeInSpec = 'string',
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.true;
  });

  it('Should not match typeInSpec with typeToCompare when ' +
    'typeInSpec is an array that includes the typeInSpec value', function() {
    const typeInSpec = ['string'],
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.false;
  });

  it('Should not match type in spec with type to compare when ' +
    'type in spec is a string when they are different', function() {
    const typeInSpec = 'integer',
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.false;
  });
});

describe('fixExamplesByVersion method', function() {
  it('Should return the same schema than the provided', function() {
    const providedSchema = {
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: 'integer'
          },
          name: {
            type: 'string',
            example: 'this is my fisrt example name in pet'
          },
          tag: {
            type: 'string'
          }
        }
      },
      fixedSchemaWithExample = concreteUtils.fixExamplesByVersion(providedSchema);
    expect(JSON.stringify(fixedSchemaWithExample)).to.be.equal(JSON.stringify(providedSchema));
  });
});

describe('isBinaryContentType method', function() {
  it('Should be true if content type is binary type without schema', function() {
    const bodyType = 'application/octet-stream',
      contentObject = {
        'application/octet-stream': {
          'schema': {
            'type': 'string',
            'format': 'binary'
          }
        }
      },
      isBinary = concreteUtils.isBinaryContentType(bodyType, contentObject);
    expect(isBinary).to.be.true;
  });

  it('Should be false if content type is not binary type', function() {
    const bodyType = 'application/json',
      contentObject = {
        'application/json': {
          'schema': {
            'type': 'string',
            'example': 'OK'
          }
        }
      },
      isBinary = concreteUtils.isBinaryContentType(bodyType, contentObject);
    expect(isBinary).to.be.false;
  });
});

describe('addOuterPropsToRefSchemaIfIsSupported method', function() {
  it('Should return the same referencedSchema even though outerProps has been provided', function() {
    const referencedSchema = {
        name: 'Test name',
        age: 30,
        required: [
          'name'
        ]
      },
      outerProps = {
        job: 'outer props are not supported',
        require: [
          'job'
        ]
      },
      resolvedSchema = concreteUtils.addOuterPropsToRefSchemaIfIsSupported(referencedSchema, outerProps);
    expect(JSON.stringify(resolvedSchema)).to.be.equal(JSON.stringify(referencedSchema));
  });
});
