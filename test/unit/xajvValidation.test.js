const { getLocalDraft,
    getAjvValidator,
    validateSchema,
    isTypeValue,
    getDraftToUse } = require('../../lib/ajValidation/ajvValidation'),
  { validateSchemaAJVDraft04 } = require('../../lib/ajValidation/ajvValidatorDraft04'),
  expect = require('chai').expect;

describe('getLocalDraft', function() {
  it('should return the defined draft from the schema', function() {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      required: [
        'id',
        'name'
      ],
      type: 'object',
      properties: {
        id: {
          type: [
            'integer'
          ],
          examples: [
            111111
          ]
        },
        name: {
          type: [
            'string'
          ]
        },
        tag: {
          type: [
            'string'
          ]
        }
      }
    };
    expect(getLocalDraft(schema)).to.be.equal('http://json-schema.org/draft-07/schema#');
  });

  it('should return undefined draft from the schema when is not present', function() {
    const schema = {
      required: [
        'id',
        'name'
      ],
      type: 'object',
      properties: {
        id: {
          type: [
            'integer'
          ],
          examples: [
            111111
          ]
        },
        name: {
          type: [
            'string'
          ]
        },
        tag: {
          type: [
            'string'
          ]
        }
      }
    };
    expect(getLocalDraft(schema)).to.be.undefined;
  });
});

describe('getAjvValidator', function() {
  it('should return the ajv draft 04 validator when draft is the 04', function() {
    let validator = getAjvValidator('http://json-schema.org/draft-04/schema#');
    expect(validator.name).to.equal('validateSchemaAJVDraft04');
  });

  it('should return normal ajv validator when draft is the 06', function() {
    let validator = getAjvValidator('http://json-schema.org/draft-06/schema#');
    expect(validator.name).to.equal('validateSchemaAJV');
  });

  it('should return normal ajv validator when draft is the 07', function() {
    let validator = getAjvValidator('http://json-schema.org/draft-07/schema#');
    expect(validator.name).to.equal('validateSchemaAJV');
  });

  it('should return normal ajv validator when draft is the 2019-09', function() {
    let validator = getAjvValidator('https://json-schema.org/draft/2019-09/schema');
    expect(validator.name).to.equal('validateSchemaAJV');
  });

  it('should return normal ajv validator when draft is the 2020-12', function() {
    let validator = getAjvValidator('https://json-schema.org/draft/2020-12/schema');
    expect(validator.name).to.equal('validateSchemaAJV');
  });

  it('should return normla ajv validator when draft is undefined', function() {
    let validator = getAjvValidator();
    expect(validator.name).to.equal('validateSchemaAJV');
  });

});

describe('validateSchema', function () {
  it('should return no errors correct schema value no $schema definition', function () {
    const schema = {
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            examples: [
              111111
            ]
          },
          name: {
            type: [
              'string'
            ]
          }
        }
      },
      valueToUse = {
        id: 7784772,
        name: 'dolor consectetur Excepteur'
      },
      result = validateSchema(schema, valueToUse);
    expect(result).to.be.empty;
  });

  it('should return errors with incorrect schema that does not have $schema property', function () {
    const schema = {
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            examples: [
              111111
            ]
          },
          name: {
            type: [
              'string'
            ]
          }
        }
      },
      valueToUse = {
        id: '7784772',
        name: 'dolor consectetur Excepteur'
      },
      result = validateSchema(schema, valueToUse);
    expect(result[0].instancePath).equal('/id');
  });

  it('should return no errors correct schema value $schema pointing to draft 04', function () {
    const schema = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            examples: [
              111111
            ]
          },
          name: {
            type: [
              'string'
            ]
          }
        }
      },
      valueToUse = {
        id: 7784772,
        name: 'dolor consectetur Excepteur'
      },
      result = validateSchema(schema, valueToUse);
    expect(result).to.be.empty;
  });

  it('should return errors incorrect schema value $schema pointing to draft 04', function () {
    const schema = {
        '$schema': 'http://json-schema.org/draft-04/schema#',
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            examples: [
              111111
            ]
          },
          name: {
            type: [
              'string'
            ]
          }
        }
      },
      valueToUse = {
        id: '7784772',
        name: 'dolor consectetur Excepteur'
      },
      result = validateSchema(schema, valueToUse);
    expect(result[0].instancePath).equal('.id');
  });

  it('should return no errors correct schema value $schema pointing to draft 06', function () {
    const schema = {
        '$schema': 'http://json-schema.org/draft-06/schema#',
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            examples: [
              111111
            ]
          },
          name: {
            type: [
              'string'
            ]
          }
        }
      },
      valueToUse = {
        id: 7784772,
        name: 'dolor consectetur Excepteur'
      },
      result = validateSchema(schema, valueToUse);
    expect(result).to.be.empty;
  });

  it('should return no errors correct schema value $schema pointing to draft 2019', function () {
    const schema = {
        '$schema': 'https://json-schema.org/draft/2019-09/schema',
        required: [
          'id',
          'name'
        ],
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            examples: [
              111111
            ]
          },
          name: {
            type: [
              'string'
            ]
          }
        }
      },
      valueToUse = {
        id: 7784772,
        name: 'dolor consectetur Excepteur'
      },
      result = validateSchema(schema, valueToUse);
    expect(result).to.be.empty;
  });

  it('should return errors correct schema value $schema pointing to draft 04', function () {
    const valueToUse = {
        id: 7784772,
        name: 'dolor consectetur Excepteur'
      },
      result = validateSchemaAJVDraft04(null, valueToUse);
    expect(result.filteredValidationError).to.be.undefined;
  });

  it('Fix for GITHUB#479: should validate as correct input <integer> for type integer', function () {
    const schema = {
        type: 'object',
        properties: {
          id: {
            type: [
              'integer',
              'boolean'
            ],
            examples: [
              111111
            ]
          },
          hasPet: {
            type: [
              'boolean'
            ]
          }
        }
      },
      valueToUse = {
        'id': '<integer>',
        'hasPet': '<boolean>'
      },
      result = validateSchema(schema, valueToUse);
    expect(result).to.be.empty;
  });

  it('Fix for GITHUB#479: should validate as incorrect input <boolean> for type integer', function () {
    const schema = {
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            examples: [
              111111
            ]
          },
          hasPet: {
            type: [
              'boolean'
            ]
          }
        }
      },
      valueToUse = {
        'id': '<boolean>',
        'hasPet': '<boolean>'
      },
      result = validateSchema(schema, valueToUse);
    expect(result[0].instancePath).equal('/id');
  });

  it('Fix for GITHUB#479: should validate as correct input <long> for type integer format int64', function () {
    const schema = {
        type: 'object',
        properties: {
          id: {
            type: [
              'integer'
            ],
            format: 'int64'
          },
          hasPet: {
            type: [
              'boolean'
            ]
          }
        }
      },
      valueToUse = {
        'id': '<long>',
        'hasPet': '<boolean>'
      },
      result = validateSchema(schema, valueToUse);
    expect(result).to.be.empty;
  });

  it('Fix for GITHUB#479: should validate as correct input <long> for type integer boolean format int64', function () {
    const schema = {
        type: 'object',
        properties: {
          id: {
            type: [
              'integer',
              'boolean'
            ],
            format: 'int64'
          },
          hasPet: {
            type: [
              'boolean'
            ]
          }
        }
      },
      valueToUse = {
        'id': '<long>',
        'hasPet': '<boolean>'
      },
      result = validateSchema(schema, valueToUse);
    expect(result).to.be.empty;
  });
});

describe('getDraftToUse', function() {
  it('should return the ajv draft 04 when $schema undefined and jsonSchemaDialect is the 04', function() {
    let draftToUse = getDraftToUse(undefined, 'http://json-schema.org/draft-04/schema#');
    expect(draftToUse).to.equal('http://json-schema.org/draft-04/schema#');
  });

  it('should return the ajv draft 06 when $schema is 06 and jsonSchemaDialect is the 04', function() {
    let draftToUse = getDraftToUse('http://json-schema.org/draft-06/schema#',
      'http://json-schema.org/draft-04/schema#');
    expect(draftToUse).to.equal('http://json-schema.org/draft-06/schema#');
  });

  it('should return the ajv draft 06 when $schema is 06 and jsonSchemaDialect is undefined', function() {
    let draftToUse = getDraftToUse('http://json-schema.org/draft-06/schema#', undefined);
    expect(draftToUse).to.equal('http://json-schema.org/draft-06/schema#');
  });

  it('should return undefined when $schema  and jsonSchemaDialect are undefined', function() {
    let draftToUse = getDraftToUse(undefined, undefined);
    expect(draftToUse).to.equal(undefined);
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

});
