const expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  async = require('async'),
  Ajv = require('ajv'),
  addFormats = require('ajv-formats'),
  COLLECTION_SCHEMAS = require('../data/collection/v2.1.js').schemas,
  META_SCHEMA = require('ajv/lib/refs/json-schema-draft-07.json'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  folderPath = path.join(__dirname, VALID_OPENAPI_PATH);

describe('Runing validation tests for all files in `valid_openapi`', function () {
  var validOpenapiFolder = fs.readdirSync(folderPath);
  async.each(validOpenapiFolder, function (file, cb) {
    it('should generte a valid collection ' + file, function () {
      let fileData = fs.readFileSync(path.join(__dirname, VALID_OPENAPI_PATH + '/' + file), 'utf8');

      // Increase timeout for larger schema
      this.timeout(30000);

      Converter.convert({ data: fileData, type: 'string' }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        var validator,
          validate;
        validator = new Ajv({
          meta: false,
          allErrors: true,
          strict: false
        });
        addFormats(validator);

        validator.addMetaSchema(META_SCHEMA);

        validate = validator.compile(COLLECTION_SCHEMAS.collection['2.1.0']);
        if (!validate(conversionResult.output[0].data)) {
          let errorMessages = validate.errors.map((error) => { return error.message; }),
            errorMessage = `Found ${validate.errors.length} errors with the supplied ` +
              `collection.\n${errorMessages.join('\n')}`;
          expect.fail(null, null, errorMessage);
        }
        else {
          return cb(null);
        }
      });
    });
  });
});

