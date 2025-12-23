/**
 * This file is meant for debugging purposes only. It is excluded from `npm test`
 * Add any openapi file to ../data/.temp before running this
 */

var expect = require('chai').expect,
  Converter = require('../../dist/src/index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/.temp/specs';

describe('The converter must generate a collection conforming to the schema', function () {
  var pathPrefix = VALID_OPENAPI_PATH,
    sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

  sampleSpecs.map((sample) => {
    var specPath = path.join(__dirname, pathPrefix, sample);
    it('Should generate collection conforming to schema for and fail if not valid ' + specPath, function(done) {
      // var openapi = fs.readFileSync(specPath, 'utf8');
      var result = Converter.validate({ type: 'file', data: specPath });
      expect(result.result).to.equal(true);
      Converter.convert({ type: 'file', data: specPath },
        {}, (err, conversionResult) => {
          expect(err).to.be.null;

          let collection = conversionResult.output[0].data;
          fs.writeFileSync(
            path.join(__dirname, '../data/.temp/temp-collection.json'),
            JSON.stringify(collection, null, 2)
          );
          done();
        });
    });
  });
});
