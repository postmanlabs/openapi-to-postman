var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  INVALID_OPENAPI_PATH = '../data/invalid_openapi';

describe('CONVERT FUNCTION TESTS ', function() {
  // these two covers remaining part of util.js
  describe('The convert Function', function() {

    var testSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/test.json'),
      testSpec1 = path.join(__dirname, VALID_OPENAPI_PATH + '/test1.json'),
      serverOverRidingSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/server_overriding.json'),
      infoHavingContactOnlySpec = path.join(__dirname, VALID_OPENAPI_PATH + '/info_having_contact_only.json'),
      infoHavingDescriptionOnlySpec = path.join(__dirname, VALID_OPENAPI_PATH + '/info_having_description_only.json'),
      customHeadersSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/custom_headers.json'),
      readOnlySpec = path.join(__dirname, VALID_OPENAPI_PATH + '/readOnly.json'),
      multipleFoldersSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/multiple_folder_problem.json'),
      multipleFoldersSpec1 = path.join(__dirname, VALID_OPENAPI_PATH + '/multiple_folder_problem1.json'),
      multipleFoldersSpec2 = path.join(__dirname, VALID_OPENAPI_PATH + '/multiple_folder_problem2.json'),
      examplesInSchemaSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/example_in_schema.json'),
      schemaWithoutExampleSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/example_not_present.json'),
      examplesOutsideSchema = path.join(__dirname, VALID_OPENAPI_PATH + '/examples_outside_schema.json'),
      exampleOutsideSchema = path.join(__dirname, VALID_OPENAPI_PATH + '/example_outside_schema.json'),
      descriptionInBodyParams = path.join(__dirname, VALID_OPENAPI_PATH + '/description_in_body_params.json'),
      zeroDefaultValueSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/zero_in_default_value.json');

    it('Should generate collection conforming to schema for and fail if not valid ' +
     testSpec, function(done) {
      var openapi = fs.readFileSync(testSpec, 'utf8');
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
      testSpec1, function(done) {
      Converter.convert({ type: 'file', data: testSpec1 }, { requestNameSource: 'url' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');

        done();
      });
    });
    it('Should generate collection with collapsing unnecessary folders ' +
    multipleFoldersSpec, function(done) {
      var openapi = fs.readFileSync(multipleFoldersSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].name).to.equal('pets/a/b');
        expect(conversionResult.output[0].data.item[0].item[0].request.method).to.equal('GET');
        expect(conversionResult.output[0].data.item[0].item[1].request.method).to.equal('POST');
        done();
      });
    });
    it('Should generate collection without collapsing unnecessary folders ' +
      '(if the option is specified) ' +
      multipleFoldersSpec, function(done) {
      var openapi = fs.readFileSync(multipleFoldersSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { collapseFolders: false }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].name).to.equal('pets');
        done();
      });
    });
    it('Should collapse child and parent folder when parent has only one child' +
    multipleFoldersSpec1, function(done) {
      var openapi = fs.readFileSync(multipleFoldersSpec1, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].name).to.equal('pets/a');
        expect(conversionResult.output[0].data.item[0].item[0].request.method).to.equal('GET');
        expect(conversionResult.output[0].data.item[0].item[1].name).to.equal('b');
        expect(conversionResult.output[0].data.item[0].item[1].item[0].request.method).to.equal('GET');
        expect(conversionResult.output[0].data.item[0].item[1].item[1].request.method).to.equal('POST');
        done();
      });
    });
    it('Should generate collection without creating folders and having only one request' +
    multipleFoldersSpec2, function(done) {
      var openapi = fs.readFileSync(multipleFoldersSpec2, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].request.name).to.equal('find Pets');
        expect(conversionResult.output[0].data.item[0].request.method).to.equal('GET');
        done();
      });
    });
    it('[Github #113]: Should convert the default value in case of zero as well', function(done) {
      var openapi = fs.readFileSync(zeroDefaultValueSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].request.url.query[0].value).to.equal('0');
        expect(conversionResult.output[0].data.item[0].request.url.variable[0].description.content)
          .to.equal('This description doesn\'t show up.');
        done();
      });
    });
    it('[Github #90] - Should create a request using local server instead of global server ' +
    serverOverRidingSpec, function(done) {
      Converter.convert({ type: 'file', data: serverOverRidingSpec }, { schemaFaker: true },
        (err, conversionResult) => {
        // Combining protocol, host, path to create a request
        // Ex https:// + example.com + /example = https://example.com/example
          let request = conversionResult.output[0].data.item[1].request,
            protocol = request.url.protocol,
            host = request.url.host.join('.'),
            path = request.url.path.join('/'),
            endPoint = protocol + '://' + host + '/' + path,
            host1 = conversionResult.output[0].data.variable[0].value,
            path1 = conversionResult.output[0].data.item[0].request.url.path.join('/'),
            endPoint1 = host1 + '/' + path1;
          expect(endPoint).to.equal('https://other-api.example.com/secondary-domain/fails');
          expect(endPoint1).to.equal('https://api.example.com/primary-domain/works');
          done();
        });
    });
    it('convertor should add custom header in the response' +
    customHeadersSpec, function(done) {
      var openapi = fs.readFileSync(customHeadersSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.output[0].data.item[0].response[0].header[0].value)
          .to.equal('application/vnd.retailer.v3+json');
        done();
      });
    });
    it('Should respects readOnly and writeOnly properties in requestBody or response schema' +
     readOnlySpec, function(done) {
      var openapi = fs.readFileSync(readOnlySpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        let requestBody = conversionResult.output[0].data.item[0].item[1].request.body.raw,
          responseBody = conversionResult.output[0].data.item[0].item[0].response[0].body;
        expect(err).to.be.null;
        expect(requestBody).to.equal('{\n    "name": "<string>",\n    "tag": "<string>"\n}');
        expect(responseBody).to.equal('[\n {\n  "id": "<long>",\n  "name": "<string>"\n }' +
        ',\n {\n  "id": "<long>",\n  "name": "<string>"\n }\n]');

        done();
      });
    });

    it('[Github #102]- Should generate collection info with only contact info' +
      infoHavingContactOnlySpec, function(done) {
      Converter.convert({ type: 'file', data: infoHavingContactOnlySpec },
        { schemaFaker: true }, (err, conversionResult) => {
          let description;
          description = conversionResult.output[0].data.info.description;
          expect(description.content).to
            .equal('Contact Support:\n Name: API Support\n Email: support@example.com');

          done();
        });
    });
    it('[Github #102]- Should generate collection info with only description' +
      infoHavingDescriptionOnlySpec, function(done) {
      Converter.convert({ type: 'file', data: infoHavingDescriptionOnlySpec },
        { schemaFaker: true }, (err, conversionResult) => {
          let description;
          description = conversionResult.output[0].data.info.description;
          expect(description.content).to
            .equal('Hey, this is the description.');
          done();
        });
    });
    describe('[Github #108]- Parameters resolution option', function() {
      it('Should respect schema faking for root request and example for example request' +
      examplesInSchemaSpec, function(done) {
        Converter.convert({ type: 'file', data: examplesInSchemaSpec },
          { schemaFaker: true, requestParametersResolution: 'schema', exampleParametersResolution: 'example' },
          (err, conversionResult) => {
            let rootRequest = conversionResult.output[0].data.item[0].request,
              exampleRequest = conversionResult.output[0].data.item[0].response[0].originalRequest;
            // Request body
            expect(rootRequest.body.raw).to
              .equal('{\n    "a": "<string>",\n    "b": "<string>"\n}');
            expect(exampleRequest.body.raw).to
              .equal('{\n    "a": "example-a",\n    "b": "example-b"\n}');
            // Request header
            expect(rootRequest.header[0].value).to.equal('<integer>');
            expect(exampleRequest.header[0].value).to.equal('header example');
            // Request query parameters
            expect(rootRequest.url.query[0].value).to.equal('<long> <long>');
            expect(rootRequest.url.query[1].value).to.equal('<long> <long>');
            expect(exampleRequest.url.query[0].value).to.equal('queryParamExample queryParamExample');
            expect(exampleRequest.url.query[1].value).to.equal('queryParamExample1 queryParamExample1');
            done();
          });
      });
      it('Should fallback to schema if the example is not present in the spec and the option is set to example' +
      schemaWithoutExampleSpec, function(done) {
        Converter.convert({ type: 'file', data: schemaWithoutExampleSpec },
          { schemaFaker: true, requestParametersResolution: 'example', exampleParametersResolution: 'example' },
          (err, conversionResult) => {
            let rootRequest = conversionResult.output[0].data.item[0].request,
              exampleRequest = conversionResult.output[0].data.item[0].response[0].originalRequest;
            expect(exampleRequest.body.raw).to
              .equal('{\n    "a": "<string>",\n    "b": "<string>"\n}');
            expect(rootRequest.body.raw).to
              .equal('{\n    "a": "<string>",\n    "b": "<string>"\n}');
            done();
          });
      });
      it('Should use examples outside of schema instead of schema properties' +
      exampleOutsideSchema, function(done) {
        Converter.convert({ type: 'file', data: exampleOutsideSchema },
          { schemaFaker: true, requestParametersResolution: 'schema', exampleParametersResolution: 'example' },
          (err, conversionResult) => {
            let rootRequest = conversionResult.output[0].data.item[0].request,
              exampleRequest = conversionResult.output[0].data.item[0].response[0].originalRequest;
            expect(rootRequest.body.raw).to
              .equal('{\n    "a": "<string>",\n    "b": "<string>"\n}');
            expect(exampleRequest.body.raw).to
              .equal('{\n    "a": "example-b",\n    "b": "example-c"\n}');
            done();
          });
      });
      it('Should use example outside of schema instead of schema properties' +
      examplesOutsideSchema, function(done) {
        Converter.convert({ type: 'file', data: examplesOutsideSchema },
          { schemaFaker: true, requestParametersResolution: 'schema', exampleParametersResolution: 'example' },
          (err, conversionResult) => {
            let rootRequest = conversionResult.output[0].data.item[0].request,
              exampleRequest = conversionResult.output[0].data.item[0].response[0].originalRequest;
            expect(rootRequest.body.raw).to
              .equal('{\n    "a": "<string>",\n    "b": "<string>"\n}');
            expect(exampleRequest.body.raw).to
              .equal('{\n    "a": "example-b",\n    "b": "example-c"\n}');
            done();
          });
      });
    });
    it('[Github #117]- Should add the description in body params in case of urlencoded' +
    descriptionInBodyParams, function(done) {
      var openapi = fs.readFileSync(descriptionInBodyParams, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        let descriptionOne = conversionResult.output[0].data.item[0].request.body.urlencoded[0].description,
          descriptionTwo = conversionResult.output[0].data.item[0].request.body.urlencoded[1].description;
        expect(err).to.be.null;
        expect(descriptionOne).to.equal('Description of Pet ID');
        expect(descriptionTwo).to.equal('Description of Pet name');
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
