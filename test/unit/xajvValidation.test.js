const { getLocalDraft, getAjvValidator, validateSchema } = require('../../lib/ajValidation/ajvValidation'),
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

  it('should return errors incorrect schema value no $schema definition', function () {
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
    expect(result[0].instancePath).equal('/id');
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
});