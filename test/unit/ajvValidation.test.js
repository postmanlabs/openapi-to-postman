const { getLocalDraft, getAjvValidator } = require('../../lib/ajValidation/ajvValidation'),
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

  it('should return normla ajv validator when draft is undefined', function() {
    let validator = getAjvValidator();
    expect(validator.name).to.equal('validateSchemaAJV');
  });

});
