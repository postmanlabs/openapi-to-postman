const _ = require('lodash'),
  expect = require('chai').expect,
  schemaFaker = require('../../assets/json-schema-faker.js');

describe('JSON SCHEMA FAKER TESTS', function () {

  before(function () {
    schemaFaker.option({
      requiredOnly: false,
      optionalsProbability: 1.0,
      minItems: 1,
      maxItems: 20,
      useDefaultValue: true,
      useExamplesValue: true,
      ignoreMissingRefs: true,
      avoidExampleItemsLength: false,
      failOnInvalidFormat: false
    });
  });

  after(function () {
    // Set default options that are used at global level
    schemaFaker.option({
      requiredOnly: false,
      optionalsProbability: 1.0,
      maxLength: 256,
      minItems: 1,
      maxItems: 20,
      useDefaultValue: true,
      ignoreMissingRefs: true,
      avoidExampleItemsLength: true,
      failOnInvalidFormat: false
    });
  });

  describe('Custom defined option "avoidExampleItemsLength"', function () {
    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timebase: { type: 'string' },
          linkid: { type: 'string' },
          chartRef: { type: 'string' }
        }
      },
      example: [
        { timebase: 'q', linkid: '250', chartRef: '5f123' },
        { timebase: 'p', linkid: '251', chartRef: '5f623' },
        { timebase: 'r', linkid: '252', chartRef: '5f183' }
      ]
    };

    it('Should use example with more than two elements for type array schema in faking. GitHub#9344', function () {
      var fakedData = schemaFaker(schema);

      schemaFaker.option({ avoidExampleItemsLength: true });
      expect(fakedData).to.deep.equal(schema.example);
    });
  });

  it('Should not use actual property named "default" as faked value', function () {
    const schema = {
      type: 'object',
      properties: {
        default: {
          type: 'string',
          example: 'This is actual property and not JSON schema defined "default" keyword'
        }
      }
    };

    schemaFaker.option({
      useExamplesValue: true
    });

    var fakedData = schemaFaker(schema);
    expect(fakedData).to.deep.equal({
      default: 'This is actual property and not JSON schema defined "default" keyword'
    });
  });

  it('Should use example value with pm variable syntax even though it violates schema type.', function () {
    const schema = {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          example: '{{orderId}}',
          description: 'Above example value is not valid integer but is an pm variable'
        }
      }
    };

    schemaFaker.option({
      useExamplesValue: true
    });

    var fakedData = schemaFaker(schema);
    expect(fakedData).to.deep.equal({
      id: '{{orderId}}'
    });
  });

  it('Should add properties from additionalProperties schema when no other properties are available', function () {
    const schema = {
      type: 'object',
      additionalProperties: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string'
          }
        }
      }
    };

    var fakedData = schemaFaker(schema);
    expect(fakedData).to.be.an('object');
    expect(fakedData).to.be.not.empty;
    _.forEach(fakedData, (value) => {
      expect(value.name).to.be.a('string');
    });
  });

  it('Should successsfully generate data for certain patterns that can generate empty string', function () {
    const schema = {
      'maxLength': 63,
      'minLength': 2,
      'pattern': '^[A-Za-z !#$%&0-9,\'*+\\-.()/:;=@\\\\_\\[\\]`{}]*$',
      'type': 'string',
      'description': 'The exact name on the credit card.'
    };

    var fakedData = schemaFaker(schema);
    expect(fakedData).to.be.an('string');
    expect(fakedData.length >= 2).to.be.true;
    expect(fakedData.length <= 63).to.be.true;
  });

  it('Should successsfully generate data iff required is defined as string', function () {
    const schema = {
      type: 'object',
      required: 'timebase',
      properties: {
        timebase: { type: 'string' },
        linkid: { type: 'string' },
        chartRef: { type: 'string' }
      }
    };

    var fakedData = schemaFaker(schema);
    expect(fakedData).to.be.an('object');
    expect(fakedData.timebase).to.be.a('string');
    expect(fakedData.linkid).to.be.a('string');
    expect(fakedData.chartRef).to.be.a('string');
  });
});
