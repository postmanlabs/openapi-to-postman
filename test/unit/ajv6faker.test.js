const expect = require('chai').expect,
  Ajv = require('../../assets/ajv6faker');

describe('VENDORED AJV 6 TESTS', function () {
  describe('$data option', function () {
    it('should not throw when a runtime pattern is not a valid regular expression', function () {
      const ajv = new Ajv({ allErrors: true, strict: false, $data: true }),
        validate = ajv.compile({
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            value: { type: 'string', pattern: { $data: '1/pattern' } }
          }
        });

      let result;
      expect(function () {
        result = validate({ pattern: '[', value: 'abc' });
      }).to.not.throw();

      expect(result).to.equal(false);
      expect(validate.errors).to.be.an('array');
      expect(validate.errors[0].keyword).to.equal('pattern');
    });

    it('should use a custom regular expression engine when the regExp option is set', function () {
      let calls = 0;
      const ajv = new Ajv({
          allErrors: true,
          strict: false,
          $data: true,
          regExp: function (pattern) {
            calls++;
            return new RegExp(pattern);
          }
        }),
        validate = ajv.compile({
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            value: { type: 'string', pattern: { $data: '1/pattern' } }
          }
        });

      expect(validate({ pattern: '^a', value: 'abc' })).to.equal(true);
      expect(calls).to.be.above(0);
    });
  });
});
