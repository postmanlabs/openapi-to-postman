const { expect } = require('chai'),
  fs = require('fs'),
  concreteUtils = require('../../../lib/32XUtils/schemaUtils32X'),
  schemaUtils31X = require('../../../lib/31XUtils/schemaUtils31X'),
  valid32xFolder = './test/data/valid_openapi32X',
  invalid32xFolder = './test/data/invalid_openapi32X';

describe('schemaUtils32X module', function () {
  it('Should expose a 3.2.x version marker (distinct from 3.1.x)', function () {
    expect(concreteUtils.version).to.equal('3.2.x');
    expect(schemaUtils31X.version).to.equal('3.1.x');
  });

  it('Should expose its own inputValidation, not the 3.1.x one', function () {
    expect(concreteUtils.inputValidation).to.not.equal(schemaUtils31X.inputValidation);
  });
});

describe('parseSpec method (3.2)', function () {
  it('Should parse a valid 3.2 spec with webhooks', function () {
    const fileContent = fs.readFileSync(valid32xFolder + '/json/webhooks.json', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: true });
    expect(parsedSpec.result).to.be.true;
    expect(parsedSpec.openapi.openapi).to.equal('3.2.0');
    expect(parsedSpec.openapi.webhooks).to.not.be.undefined;
  });

  it('Should return false and invalid format message when input content is empty', function () {
    const fileContent = fs.readFileSync(invalid32xFolder + '/empty-spec.yaml', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Invalid format. Input must be in YAML or JSON format.');
  });

  it('Should return false and reason when spec is missing an info object', function () {
    const fileContent = fs.readFileSync(invalid32xFolder + '/invalid-no-info.json', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

  it('Should return false and reason when info object is null', function () {
    const fileContent = fs.readFileSync(invalid32xFolder + '/invalid-null-info.json', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason).to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

  it('Should return false when info.version is missing', function () {
    const fileContent = fs.readFileSync(invalid32xFolder + '/invalid-info-no-version.json', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a semantic version number of the API in the Info Object');
  });

  it('Should return false when info.version is null', function () {
    const fileContent = fs.readFileSync(invalid32xFolder + '/invalid-info-null-version.json', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a semantic version number of the API in the Info Object');
  });

  it('Should return false when info.title is missing', function () {
    const fileContent = fs.readFileSync(invalid32xFolder + '/invalid-info-no-title.json', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a title in order to generate a collection');
  });

  it('Should return false when info.title is null', function () {
    const fileContent = fs.readFileSync(invalid32xFolder + '/invalid-info-null-title.json', 'utf8'),
      parsedSpec = concreteUtils.parseSpec(fileContent, { includeWebhooks: false });
    expect(parsedSpec.result).to.be.false;
    expect(parsedSpec.reason)
      .to.equal('Specification must contain a title in order to generate a collection');
  });
});

describe('getRequiredData method (3.2)', function () {
  it('Should return paths, info, webhooks and components carve-outs from a typical 3.2 spec', function () {
    const fileContent = fs.readFileSync(valid32xFolder + '/json/petstore.json', 'utf8'),
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

  it('Should return empty placeholders for missing carve-outs', function () {
    const input = {
        openapi: '3.2.0',
        info: {
          title: 'Webhooks only',
          version: '1.0.0'
        },
        webhooks: {
          'inbound-sms': {
            post: { operationId: 'inbound-sms' }
          }
        }
      },
      requiredData = concreteUtils.getRequiredData(input);
    expect(requiredData).to.be.an('object')
      .and.to.have.all.keys('info', 'paths', 'webhooks', 'components');
    expect(Object.keys(requiredData.webhooks)).to.have.length(1);
    expect(Object.keys(requiredData.paths)).to.have.length(0);
    expect(Object.keys(requiredData.components)).to.have.length(0);
  });
});

describe('delegated helpers (3.2 mirrors 3.1)', function () {
  it('compareTypes: matches array-of-types like 3.1 does', function () {
    expect(concreteUtils.compareTypes(['string', 'null'], 'string')).to.be.true;
    expect(concreteUtils.compareTypes(['integer'], 'string')).to.be.false;
  });

  it('fixExamplesByVersion: copies the first examples[] entry into example', function () {
    const fixed = concreteUtils.fixExamplesByVersion({
      type: 'string',
      examples: ['hello']
    });
    expect(fixed.example).to.equal('hello');
  });

  it('isBinaryContentType: true for application/octet-stream with no schema (3.1 behaviour)', function () {
    expect(
      concreteUtils.isBinaryContentType('application/octet-stream', {
        'application/octet-stream': {}
      })
    ).to.be.true;
  });

  it('addOuterPropsToRefSchemaIfIsSupported: merges array properties (3.1 behaviour)', function () {
    const resolved = concreteUtils.addOuterPropsToRefSchemaIfIsSupported(
      { name: 'Test', required: ['name'] },
      { required: ['job'], job: 'JOB' }
    );
    expect(resolved.required).to.deep.equal(['name', 'job']);
    expect(resolved.job).to.equal('JOB');
  });

  it('findTypeByExample: picks integer when the example is 123 and types include integer', function () {
    const { foundType, foundExample } = concreteUtils.findTypeByExample([123], ['string', 'integer']);
    expect(foundType).to.equal('integer');
    expect(foundExample).to.equal(123);
  });
});
