const schemaUtilsCommon = require('../../lib/common/schemaUtilsCommon');
const { formatDataPath } = require('../../lib/common/schemaUtilsCommon'),
  expect = require('chai').expect;

describe('formatData method', function() {
  it('Should format a simple ajv instancePath to old ajv dataPath', function() {
    const instancePath = '/test',
      expectedDataPath = '.test',
      formattedDataPath = formatDataPath(instancePath);
    expect(formattedDataPath).to.be.equal(expectedDataPath);
  });

  it('Should format a ajv instancePath that represents an element in an array to old ajv dataPath', function() {
    const instancePath = '/test/3',
      expectedDataPath = '.test[3]',
      formattedDataPath = formatDataPath(instancePath);
    expect(formattedDataPath).to.be.equal(expectedDataPath);
  });

  it('Should return the same string when input is a data path ".id" ', function() {
    const inputAlreadyDataPath = '.id',
      expectedDataPath = '.id',
      formattedDataPath = formatDataPath(inputAlreadyDataPath);
    expect(formattedDataPath).to.be.equal(expectedDataPath);
  });

  it('Should return the same string when input is a data path ".test[3]" ', function() {
    const inputAlreadyDataPath = '.test[3]',
      expectedDataPath = '.test[3]',
      formattedDataPath = formatDataPath(inputAlreadyDataPath);
    expect(formattedDataPath).to.be.equal(expectedDataPath);
  });

});

describe('handleExclusiveMaximum method', function() {
  it('Should the maximum in a schema that uses exclusiveMaximum', function() {
    const defaultMaximum = 1000000,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMaximum: 100
      },
      newMaximum = schemaUtilsCommon.handleExclusiveMaximum(schema, defaultMaximum),
      expectedMaximum = 99;
    expect(newMaximum).to.be.equal(expectedMaximum);
  });

  it('Should the maximum in a schema that uses exclusiveMaximum and multipleOf', function() {
    const defaultMaximum = 1000000,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMaximum: 100,
        multipleOf: 10
      },
      newMaximum = schemaUtilsCommon.handleExclusiveMaximum(schema, defaultMaximum),
      expectedMaximum = 90;
    expect(newMaximum).to.be.equal(expectedMaximum);
  });

  it('Should the maximum in a schema that uses exclusiveMaximum in old way', function() {
    const defaultMaximum = 1000000,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMaximum: true,
        maximum: 100
      },
      newMaximum = schemaUtilsCommon.handleExclusiveMaximum(schema, defaultMaximum),
      expectedMaximum = 99;
    expect(newMaximum).to.be.equal(expectedMaximum);
  });

  it('Should the maximum in a schema that uses exclusiveMaximum and multipleOf in old way', function() {
    const defaultMaximum = 1000000,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMaximum: true,
        maximum: 100,
        multipleOf: 10
      },
      newMaximum = schemaUtilsCommon.handleExclusiveMaximum(schema, defaultMaximum),
      expectedMaximum = 90;
    expect(newMaximum).to.be.equal(expectedMaximum);
  });
});

describe('handleExclusiveMinimum method', function() {
  it('Should the maximum in a schema that uses exclusiveMinimum', function() {
    const defaultMinimum = 10,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMinimum: 100
      },
      newMinimum = schemaUtilsCommon.handleExclusiveMinimum(schema, defaultMinimum),
      expectedMinimum = 101;
    expect(newMinimum).to.be.equal(expectedMinimum);
  });

  it('Should the minimum in a schema that uses exclusiveMinimum and multipleOf', function() {
    const defaultMinimum = 10,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMinimum: 100,
        multipleOf: 10
      },
      newMinimum = schemaUtilsCommon.handleExclusiveMinimum(schema, defaultMinimum),
      expectedMinimum = 110;
    expect(newMinimum).to.be.equal(expectedMinimum);
  });

  it('Should the minimum in a schema that uses exclusiveMinimum in old way', function() {
    const defaultMinimum = 10,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMinimum: true,
        minimum: 100
      },
      newMinimum = schemaUtilsCommon.handleExclusiveMinimum(schema, defaultMinimum),
      expectedMinimum = 101;
    expect(newMinimum).to.be.equal(expectedMinimum);
  });

  it('Should the minimum in a schema that uses exclusiveMinimum and multipleOf in old way', function() {
    const defaultMinimum = 10,
      schema = {
        type: [
          'integer'
        ],
        exclusiveMinimum: true,
        minimum: 100,
        multipleOf: 10
      },
      newMinimum = schemaUtilsCommon.handleExclusiveMinimum(schema, defaultMinimum),
      expectedMinimum = 110;
    expect(newMinimum).to.be.equal(expectedMinimum);
  });
});


