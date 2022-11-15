const { expect } = require('chai'),
  concreteUtils = require('../../../lib/31XUtils/schemaUtils31X'),
  fs = require('fs'),
  valid31xFolder = './test/data/valid_openapi31X',
  invalid31xFolder = './test/data/invalid_openapi31X';

describe('parseSpec method', function () {
  it('should return true and a parsed specification', function () {
    let fileContent = fs.readFileSync(valid31xFolder + '/json/webhooks.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: true });
    expect(parsedSpec.result).to.be.true;
    expect(parsedSpec.openapi.openapi).to.equal('3.1.0');
    expect(parsedSpec.openapi.webhooks).to.not.be.undefined;
  });

  it('should return false and invalid format message when input content is sent', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/empty-spec.yaml', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Invalid format. Input must be in YAML or JSON format.');
  });

  it('should return false and Spec must contain info object', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-no-info.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

  it('should return false and Spec must contain info object different than null', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-null-info.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

  it('should return false and Spec must contain information version', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-info-no-version.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a semantic version number of the API in the Info Object');
  });

  it('should return false and Spec must contain information version different than null', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-info-null-version.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a semantic version number of the API in the Info Object');
  });

  it('should return false and Spec must contain information title', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-info-no-title.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a title in order to generate a collection');
  });

  it('should return false and Spec must contain information title different than null', function () {
    let fileContent = fs.readFileSync(invalid31xFolder + '/invalid-info-null-title.json', 'utf8');
    const parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a title in order to generate a collection');
  });

});

describe('getRequiredData method', function() {
  it('Should return all required data from file', function() {
    const fileContent = fs.readFileSync(valid31xFolder + '/json/petstore.json', 'utf8'),
      requiredData = concreteUtils.getRequiredData(JSON.parse(fileContent));
    expect(requiredData).to.be.an('object')
      .and.to.have.all.keys('info', 'paths', 'webhooks', 'components');
    expect(requiredData.webhooks).to.be.an('object');
    expect(Object.keys(requiredData.webhooks)).to.have.length(0);
    expect(requiredData.paths).to.be.an('object')
      .and.to.have.all.keys('/pet/{petId}/uploadImage', '/pets', '/pets/{petId}');
    expect(requiredData.components).to.be.an('object')
      .and.to.have.all.keys('schemas');
  });

  it('Should return empty objects if data is not in spec', function() {
    const input = {
        'openapi': '3.1.0',
        'info': {
          'version': '1.0.0',
          'title': 'Swagger Petstore',
          'license': {
            'name': 'MIT'
          }
        },
        'webhooks': {
          'inbound-sms': {
            'post': {
              'operationId': 'inbound-sms'
            }
          }
        }
      },
      requiredData = concreteUtils.getRequiredData(input);
    expect(requiredData).to.be.an('object')
      .and.to.have.all.keys('info', 'paths', 'webhooks', 'components');
    expect(requiredData.webhooks).to.be.an('object');
    expect(Object.keys(requiredData.webhooks)).to.have.length(1);
    expect(requiredData.paths).to.be.an('object');
    expect(Object.keys(requiredData.paths)).to.have.length(0);
    expect(requiredData.components).to.be.an('object');
    expect(Object.keys(requiredData.components)).to.have.length(0);
    expect(requiredData.info).to.be.an('object');
  });
});

describe('compareTypes method', function() {
  it('Should match type in spec with type to compare when type in spec is a string when they are equal', function() {
    const typeInSpec = 'string',
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.true;
  });

  it('Should match type in spec with type to compare when type in spec is an array when they are equal', function() {
    const typeInSpec = ['string'],
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.true;
  });

  it('Should match type in spec with type to compare when ' +
    'type in spec is an array with multiple types when they are equal', function() {
    const typeInSpec = ['string', 'null'],
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.true;
  });

  it('Should match type in spec with type to compare when ' +
    'type in spec is a string when they are different', function() {
    const typeInSpec = 'integer',
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.false;
  });

  it('Should not match type in spec with type to compare when' +
    'type in spec is an array when they are different', function() {
    const typeInSpec = ['integer'],
      typeToCompare = 'string',
      matchTypes = concreteUtils.compareTypes(typeInSpec, typeToCompare);
    expect(matchTypes).to.be.false;
  });
});

describe('isBinaryContentType method', function() {
  it('Should be true if content type is binary type without schema', function() {
    const bodyType = 'application/octet-stream',
      contentObject = {
        'application/octet-stream': {}
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
            'examples': [
              'OK'
            ]
          }
        }
      },
      isBinary = concreteUtils.isBinaryContentType(bodyType, contentObject);
    expect(isBinary).to.be.false;
  });
});

describe('getOuterPropsIfIsSupported method', function() {
  it('Should add outer properties to a referenced schema', function() {
    const referencedSchema = {
        name: 'Test name',
        age: '30'
      },
      outerProperties = {
        job: 'This is an example'
      },
      resolvedSchema = concreteUtils.addOuterPropsToRefSchemaIfIsSupported(referencedSchema, outerProperties);
    expect(resolvedSchema).to.be.an('object')
      .nested.to.have.all.keys('name', 'age', 'job');
    expect(resolvedSchema.job).to.be.equal(outerProperties.job);
  });

  it('Should replace referenced schema existing props with outer prop if exists', function() {
    const referencedSchema = {
        name: 'Test name',
        age: '30',
        job: 'The inner job'
      },
      outerProperties = {
        job: 'The new job from out'
      },
      resolvedSchema = concreteUtils.addOuterPropsToRefSchemaIfIsSupported(referencedSchema, outerProperties);
    expect(resolvedSchema).to.be.an('object')
      .nested.to.have.all.keys('name', 'age', 'job');
    expect(resolvedSchema.job).to.be.equal(outerProperties.job);
  });

  it('Should concat an outerProperty with innerProperty values when is an array', function() {
    const referencedSchema = {
        name: 'Test name',
        age: '30',
        required: [
          'name'
        ]
      },
      outerProperties = {
        job: 'The new job from out',
        required: [
          'job'
        ]
      },
      expectedRequiredValue = ['name', 'job'],
      resolvedSchema = concreteUtils.addOuterPropsToRefSchemaIfIsSupported(referencedSchema, outerProperties);
    expect(resolvedSchema).to.be.an('object')
      .nested.to.have.all.keys('name', 'age', 'job', 'required');
    expect(resolvedSchema.job).to.be.equal(outerProperties.job);
    expect(JSON.stringify(resolvedSchema.required)).to.be.equal(JSON.stringify(expectedRequiredValue));
  });
});

describe('findTypeByExample method', function () {
  it('should return integer when the example is 123 and the types are string and integer', function () {
    const result = concreteUtils.findTypeByExample([123], ['string', 'integer']);
    expect(result.foundType).to.equal('integer');
    expect(result.foundExample).to.equal(123);
  });

  it('should return number when the example is 123.5 and the types are string and integer', function () {
    const result = concreteUtils.findTypeByExample([123.5], ['string', 'number']);
    expect(result.foundType).to.equal('number');
    expect(result.foundExample).to.equal(123.5);

  });

  it('should return string when the example is "123" and the types are integer and string', function () {
    const result = concreteUtils.findTypeByExample(['123'], ['integer', 'string']);
    expect(result.foundType).to.equal('string');
    expect(result.foundExample).to.equal('123');

  });

  it('should return boolean when the example is true and the types are integer, string and boolean', function () {
    const result = concreteUtils.findTypeByExample([true], ['integer', 'string', 'boolean']);
    expect(result.foundType).to.equal('boolean');
    expect(result.foundExample).to.equal(true);
  });

  it('should return string when the example is "true" and the types are integer, string and boolean', function () {
    const result = concreteUtils.findTypeByExample(['true'], ['integer', 'string', 'boolean']);
    expect(result.foundType).to.equal('string');
    expect(result.foundExample).to.equal('true');
  });

  it('should return boolean when the examples are "true" and false and the types are integer and boolean', function () {
    const result = concreteUtils.findTypeByExample(['true', false], ['integer', 'boolean']);
    expect(result.foundType).to.equal('boolean');
    expect(result.foundExample).to.equal(false);
  });

});
