const schemaUtilsCommon = require('../../lib/common/schemaUtilsCommon'),
  { formatDataPath,
    formatSchemaPathFromAJVErrorToConvertToDataPath,
    isTypeValue } = require('../../lib/common/schemaUtilsCommon'),
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

  it('Should return "properties.automatic.items.properties.configs.items"' +
    ' when input is "#/properties/automatic/items/properties/configs/items/type"', function() {
    const input = 'properties/automatic/items/properties/configs/items',
      expectedDataPath = 'properties.automatic.items.properties.configs.items',
      formattedDataPath = formatDataPath(input);
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

describe('formatSchemaPathFromAJVErrorToConvertToDataPath method', function () {
  it('should return properties/automatic/items/properties/configs/items ' +
  'when entry is #/properties/automatic/items/properties/configs/items/type', function () {
    const result =
      formatSchemaPathFromAJVErrorToConvertToDataPath('#/properties/automatic/items/properties/configs/items/type');
    expect(result).to.equal('properties/automatic/items/properties/configs/items');
  });
});

describe('isTypeValue method', function () {
  it('should return true when value is <integer> and type is integer', function () {
    const result = isTypeValue('<integer>', {
      type: [
        'integer'
      ]
    });
    expect(result).to.be.true;
  });

  it('should return true when input is <long> type integer and format int64', function () {
    const result = isTypeValue('<long>', {
      format: 'int64',
      type: ['integer']
    });
    expect(result).to.be.true;
  });

  it('should return true when value is <uuid> type is string format is uuid', function () {
    const result = isTypeValue('<uuid>', {
      format: 'uuid',
      type: ['string']
    });
    expect(result).to.be.true;
  });


  it('should return true when value is <otherType> type is otherType and there is not format', function () {
    const result = isTypeValue('<otherType>', {
      type: ['otherType']
    });
    expect(result).to.be.true;
  });

  it('should return true value is <otherType-otherFormat> type is otherType and format is otherFormat', function () {
    const result = isTypeValue('<otherType-otherFormat>', {
      format: 'otherFormat',
      type: ['otherType']
    });
    expect(result).to.be.true;
  });

  it('should return false when value is <integer> and type is boolean', function () {
    const result = isTypeValue('<integer>', {
      type: ['boolean']
    });
    expect(result).to.be.false;
  });

  it('should return true when value is <string> and type is string', function () {
    const result = isTypeValue('<string>', {
      type: ['string']
    });
    expect(result).to.be.true;
  });

  it('should return true when value is <integer> and type is ["boolean", "integer"]', function () {
    const result = isTypeValue('<integer>', {
      type: ['boolean', 'integer']
    });
    expect(result).to.be.true;
  });

  it('should return true when value is <integer> and type is integer not array', function () {
    const result = isTypeValue('<integer>', {
      type: 'integer'
    });
    expect(result).to.be.true;
  });

  it('should return true when value is <integer> and type is integer not array format int64', function () {
    const result = isTypeValue('<long>', {
      format: 'int64',
      type: 'integer'
    });
    expect(result).to.be.true;
  });

  it('should return true when value is <long> and type is integer, format not present default is <long>', function () {
    const result = isTypeValue('<long>', {
      default: '<long>',
      type: 'integer'
    });
    expect(result).to.be.true;
  });

  it('should return false when value is <long> and type is integer,' +
    ' there is no format default is <nlong>', function () {
    const result = isTypeValue('<nlong>', {
      default: '<long>',
      type: 'integer'
    });
    expect(result).to.be.false;
  });

});
