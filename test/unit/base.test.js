var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  INVALID_OPENAPI_PATH = '../data/invalid_openapi';

describe('CONVERT FUNCTION TESTS ', function() {
  // these two covers remaining part of util.js
  describe('The convert Function', function() {
    var pathPrefix = VALID_OPENAPI_PATH + '/test.json',
      specPath = path.join(__dirname, pathPrefix),
      pathPrefix1 = VALID_OPENAPI_PATH + '/test1.json',
      specPath1 = path.join(__dirname, pathPrefix1),
      pathPrefix2 = VALID_OPENAPI_PATH + '/server_overriding.json',
      specPath2 = path.join(__dirname, pathPrefix2);

    it('Should generate collection conforming to schema for and fail if not valid ' +
     specPath, function(done) {
      var openapi = fs.readFileSync(specPath, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        done();
      });
    });
    it('Should generate collection conforming to schema for and fail if not valid ' +
      specPath1, function(done) {
      Converter.convert({ type: 'file', data: specPath1 }, { requestNameSource: 'url' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');

        done();
      });
    });
    it('[Github #90] - Should create a request using local server instead of global server ' +
    specPath2, function(done) {
      Converter.convert({ type: 'file', data: specPath2 }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item[1].request.url.path).to.be.an('array');
        expect(conversionResult.output[0].data.item[1].request.url.path).to.have.lengthOf(2);
        expect(conversionResult.output[0].data.item[1].request.url.host).to.be.an('array');

        done();
      });
    });
  });
  describe('for invalid requestNameSource option', function() {
    var pathPrefix = VALID_OPENAPI_PATH + '/test1.json',
      specPath = path.join(__dirname, pathPrefix);

    it('for invalid request name, converter should throw an error', function(done) {
      var openapi = fs.readFileSync(specPath, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { requestNameSource: 'uKnown' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.reason).to.equal(
          'requestNameSource (uKnown) in options is invalid or property does not exist in pets');
        done();
      });
    });
  });
});

/* Plugin Interface Tests */
describe('INTERFACE FUNCTION TESTS ', function () {
  describe('The converter must identify valid specifications', function () {
    var pathPrefix = VALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);

      it(specPath + ' is valid ', function(done) {
        var openapi = fs.readFileSync(specPath, 'utf8'),
          validationResult = Converter.validate({ type: 'string', data: openapi });

        expect(validationResult.result).to.equal(true);
        done();
      });
    });
  });
  describe('The converter must identify invalid specifications', function () {
    var pathPrefix = INVALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);

      it(specPath + ' is invalid ', function(done) {
        var openapi = fs.readFileSync(specPath, 'utf8'),
          validationResult = Converter.validate({ type: 'string', data: openapi });

        expect(validationResult.result).to.equal(false);
        Converter.convert({ type: 'string', data: openapi }, {}, function(err, conversionResult) {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(false);
          done();
        });
      });
    });
  });

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

            expect(conversionResult.result).to.equal(true);
            expect(conversionResult.output.length).to.equal(1);
            expect(conversionResult.output[0].type).to.equal('collection');
            expect(conversionResult.output[0].data).to.have.property('info');
            expect(conversionResult.output[0].data).to.have.property('item');

            done();
          });
      });
    });
  });

  describe('The converter must throw an error for invalid input type', function() {
    it('(type: some invalid value)', function(done) {
      var result = Converter.validate({ type: 'fil', data: 'invalid_path' });
      expect(result.result).to.equal(false);
      expect(result.reason).to.equal('input type is not valid');
      Converter.convert({ type: 'fil', data: 'invalid_path' }, {}, function(err, conversionResult) {
        expect(conversionResult.result).to.equal(false);
        expect(conversionResult.reason).to.equal('input type:fil is not valid');
        done();
      });
    });
  });

  describe('The converter must throw an error for invalid input path', function() {
    it('(type: file)', function(done) {
      var result = Converter.validate({ type: 'file', data: 'invalid_path' });
      expect(result.result).to.equal(false);
      Converter.convert({ type: 'file', data: 'invalid_path' }, {}, function(err) {
        expect(err.toString()).to.equal('Error: ENOENT: no such file or directory, open \'invalid_path\'');
        done();
      });
    });
  });
});
