var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  async = require('async'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  INVALID_OPENAPI_PATH = '../data/invalid_openapi',
  SWAGGER_20_FOLDER_YAML = '../data/valid_swagger/yaml/',
  SWAGGER_20_FOLDER_JSON = '../data/valid_swagger/json/';

describe('CONVERT FUNCTION TESTS ', function() {
  // these two covers remaining part of util.js
  describe('The convert Function', function() {

    var testSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/test.json'),
      testSpec1 = path.join(__dirname, VALID_OPENAPI_PATH + '/test1.json'),
      test31SpecDir = path.join(__dirname, '../data/valid_openapi31X/'),
      issue133 = path.join(__dirname, VALID_OPENAPI_PATH + '/issue#133.json'),
      issue160 = path.join(__dirname, VALID_OPENAPI_PATH, '/issue#160.json'),
      issue10672 = path.join(__dirname, VALID_OPENAPI_PATH, '/issue#10672.json'),
      unique_items_schema = path.join(__dirname, VALID_OPENAPI_PATH + '/unique_items_schema.json'),
      serverOverRidingSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/server_overriding.json'),
      infoHavingContactOnlySpec = path.join(__dirname, VALID_OPENAPI_PATH + '/info_having_contact_only.json'),
      infoHavingDescriptionOnlySpec = path.join(__dirname, VALID_OPENAPI_PATH + '/info_having_description_only.json'),
      customHeadersSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/custom_headers.json'),
      implicitHeadersSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/implicit_headers.json'),
      readOnlySpec = path.join(__dirname, VALID_OPENAPI_PATH + '/readOnly.json'),
      multipleFoldersSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/multiple_folder_problem.json'),
      multipleFoldersSpec1 = path.join(__dirname, VALID_OPENAPI_PATH + '/multiple_folder_problem1.json'),
      multipleFoldersSpec2 = path.join(__dirname, VALID_OPENAPI_PATH + '/multiple_folder_problem2.json'),
      examplesInSchemaSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/example_in_schema.json'),
      schemaWithoutExampleSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/example_not_present.json'),
      examplesOutsideSchema = path.join(__dirname, VALID_OPENAPI_PATH + '/examples_outside_schema.json'),
      exampleOutsideSchema = path.join(__dirname, VALID_OPENAPI_PATH + '/example_outside_schema.json'),
      descriptionInBodyParams = path.join(__dirname, VALID_OPENAPI_PATH + '/description_in_body_params.json'),
      zeroDefaultValueSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/zero_in_default_value.json'),
      requiredInParams = path.join(__dirname, VALID_OPENAPI_PATH, '/required_in_parameters.json'),
      multipleRefs = path.join(__dirname, VALID_OPENAPI_PATH, '/multiple_refs.json'),
      issue150 = path.join(__dirname, VALID_OPENAPI_PATH + '/issue#150.yml'),
      issue173 = path.join(__dirname, VALID_OPENAPI_PATH, '/issue#173.yml'),
      issue152 = path.join(__dirname, VALID_OPENAPI_PATH, '/path-refs-error.yaml'),
      issue193 = path.join(__dirname, VALID_OPENAPI_PATH, '/issue#193.yml'),
      tooManyRefs = path.join(__dirname, VALID_OPENAPI_PATH, '/too-many-refs.json'),
      tagsFolderSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore-detailed.yaml'),
      securityTestCases = path.join(__dirname, VALID_OPENAPI_PATH + '/security-test-cases.yaml'),
      emptySecurityTestCase = path.join(__dirname, VALID_OPENAPI_PATH + '/empty-security-test-case.yaml'),
      rootUrlServerWithVariables = path.join(__dirname, VALID_OPENAPI_PATH + '/root_url_server_with_variables.json'),
      parameterExamples = path.join(__dirname, VALID_OPENAPI_PATH + '/parameteres_with_examples.yaml'),
      issue10229 = path.join(__dirname, VALID_OPENAPI_PATH, '/issue#10229.json'),
      deepObjectLengthProperty = path.join(__dirname, VALID_OPENAPI_PATH, '/deepObjectLengthProperty.yaml'),
      valuePropInExample = path.join(__dirname, VALID_OPENAPI_PATH, '/valuePropInExample.yaml'),
      petstoreParamExample = path.join(__dirname, VALID_OPENAPI_PATH, '/petstoreParamExample.yaml'),
      formDataParamDescription = path.join(__dirname, VALID_OPENAPI_PATH, '/form_data_param_description.yaml'),
      allHTTPMethodsSpec = path.join(__dirname, VALID_OPENAPI_PATH, '/all-http-methods.yaml');


    it('Should add collection level auth with type as `bearer`' +
    securityTestCases, function(done) {
      var openapi = fs.readFileSync(securityTestCases, 'utf8'),
        auth;
      Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {

        auth = conversionResult.output[0].data.item[0].request.auth;

        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(auth).to.be.null;
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.auth).to.have.property('type');
        expect(conversionResult.output[0].data.auth.type).to.equal('apikey');
        done();
      });
    });

    it('Should add collection level auth with type as `apiKey`' +
    emptySecurityTestCase, function(done) {
      var openapi = fs.readFileSync(emptySecurityTestCase, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {

        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.auth).to.have.property('type');
        expect(conversionResult.output[0].data.auth.type).to.equal('apikey');
        done();
      });
    });

    it('Should generate collection conforming to schema for and fail if not valid ' +
    tooManyRefs, function(done) {
      var openapi = fs.readFileSync(tooManyRefs, 'utf8'),
        body;
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {

        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        body = conversionResult.output[0].data.item[1].response[0].body;
        expect(body).to.not.contain('<Error: Too many levels of nesting to fake this schema>');
        done();
      });
    });

    it('Should generate collection conforming to schema for and fail if not valid ' +
    issue152, function(done) {
      var openapi = fs.readFileSync(issue152, 'utf8'),
        refNotFound = 'reference #/paths/~1pets/get/responses/200/content/application~1json/schema/properties/newprop' +
        ' not found in the OpenAPI spec';
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item[0].item[1].response[1].body).to.not.contain(refNotFound);
        done();
      });
    });

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

    it(' Fix for GITHUB#133: Should generate collection with proper Path and Collection variables', function(done) {
      var openapi = fs.readFileSync(issue133, 'utf8');
      Converter.convert({ type: 'string', data: openapi },
        { requestParametersResolution: 'Example', schemaFaker: true }, (err, conversionResult) => {

          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');
          expect(conversionResult.output[0].data).to.have.property('info');
          expect(conversionResult.output[0].data).to.have.property('item');
          expect(conversionResult.output[0].data).to.have.property('variable');
          expect(conversionResult.output[0].data.variable).to.be.an('array');
          expect(conversionResult.output[0].data.variable[1].key).to.equal('format');
          expect(conversionResult.output[0].data.variable[1].value).to.equal('json');
          expect(conversionResult.output[0].data.variable[2].key).to.equal('path');
          expect(conversionResult.output[0].data.variable[2].value).to.equal('send-email');
          expect(conversionResult.output[0].data.variable[3].key).to.equal('new-path-variable-1');
          // serialised value for object { R: 100, G: 200, B: 150 }
          expect(conversionResult.output[0].data.variable[3].value).to.equal('R,100,G,200,B,150');
          expect(conversionResult.output[0].data.variable[4].key).to.equal('new-path-variable-2');
          // serialised value for array ["exampleString", "exampleString"]
          expect(conversionResult.output[0].data.variable[4].value).to.equal('exampleString,exampleString');
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

    it('#GITHUB-160 should generate correct display url for path containing servers' +
    issue160, function(done) {
      var openapi = fs.readFileSync(issue160, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item[0].item[0].request.url.host[0]).to.equal('{{pets-Url}}');
        done();
      });
    });

    it('Should not get stuck while resolving circular references' +
    unique_items_schema, function(done) {
      Converter.convert({ type: 'file', data:
      unique_items_schema }, {}, (err, conversionResult) => {
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
    it('[Github #113]: Should convert the default value in case of zero as well' +
    zeroDefaultValueSpec, function(done) {
      var openapi = fs.readFileSync(zeroDefaultValueSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].request.url.query[0].value).to.equal('0');
        expect(conversionResult.output[0].data.item[0].request.url.variable[0].description)
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
            port = request.url.port,
            path = request.url.path.join('/'),
            endPoint = protocol + '://' + host + ':' + port + '/' + path,
            host1 = conversionResult.output[0].data.variable[0].value,
            path1 = conversionResult.output[0].data.item[0].request.url.path.join('/'),
            endPoint1 = host1 + '/' + path1;
          expect(endPoint).to.equal('http://petstore.swagger.io:{{port}}/:basePath/secondary-domain/fails');
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
    it('convertor should maintain implicit headers in the request' +
    implicitHeadersSpec, function(done) {
      var openapi = fs.readFileSync(implicitHeadersSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {
        schemaFaker: true,
        keepImplicitHeaders: true
      }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.output[0].data.item[0].item[0].request.header[0].key)
          .to.equal('Authorization');
        expect(conversionResult.output[0].data.item[0].item[0].request.header[0].value)
          .to.equal('Bearer {{oauth_access_token}}');
        expect(conversionResult.output[0].data.item[0].item[0].request.header[1].key)
          .to.equal('Content-Type');
        expect(conversionResult.output[0].data.item[0].item[0].request.header[1].value)
          .to.equal('application/json');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[0].key)
          .to.equal('Authorization');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[0].value)
          .to.equal('Bearer {{oauth_access_token}}');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[1].key)
          .to.equal('Content-Type');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[1].value)
          .to.equal('application/json');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[2].key)
          .to.equal('Accept');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[2].value)
          .to.equal('application/json');
        expect(conversionResult.output[0].data.item[0].item[1].request.header).to.have.length(3);
        done();
      });
    });
    it('convertor should remove implicit headers in the request' +
    implicitHeadersSpec, function(done) {
      var openapi = fs.readFileSync(implicitHeadersSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {
        schemaFaker: true,
        keepImplicitHeaders: false
      }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.output[0].data.item[0].item[1].request.header).to.have.length(2);
        expect(conversionResult.output[0].data.item[0].item[1].request.header[0].key)
          .to.equal('Content-Type');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[0].value)
          .to.equal('application/json');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[1].key)
          .to.equal('Accept');
        expect(conversionResult.output[0].data.item[0].item[1].request.header[1].value)
          .to.equal('application/json');
        done();
      });
    });
    it('Should respects readOnly and writeOnly properties in requestBody or response schema' +
     readOnlySpec, function(done) {
      var openapi = fs.readFileSync(readOnlySpec, 'utf8'),
        options = { schemaFaker: true, exampleParametersResolution: 'schema' };
      Converter.convert({ type: 'string', data: openapi }, options, (err, conversionResult) => {
        let requestBody = conversionResult.output[0].data.item[0].item[1].request.body.raw,
          responseBody = conversionResult.output[0].data.item[0].item[0].response[0].body;
        expect(err).to.be.null;
        expect(requestBody).to.equal('{\n  "name": "<string>",\n  "tag": "<string>"\n}');
        expect(responseBody).to.equal('[\n  {\n    "id": "<long>",\n    "name": "<string>"\n  }' +
        ',\n  {\n    "id": "<long>",\n    "name": "<string>"\n  }\n]');

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
    it('Should remove the version from generated collection for all specs', function(done) {
      Converter.convert({ type: 'file', data: testSpec }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.info).to.not.have.property('version');
        done();
      });
    });
    it('#GITHUB-10229 should generate correct example is out of the schema and is falsy' +
    issue10229, function(done) {
      var openapi = fs.readFileSync(issue10229, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { requestParametersResolution: 'Example' },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');
          expect(conversionResult.output[0].data).to.have.property('info');
          expect(conversionResult.output[0].data).to.have.property('item');
          expect(conversionResult.output[0].data.item[0].item[0].request.url.query[0].value).to.equal('0');
          expect(conversionResult.output[0].data.item[0].item[0].request.url.query[1].value).to.equal('');
          expect(conversionResult.output[0].data.item[0].item[0].request.url.query[2].value).to.equal('false');
          expect(conversionResult.output[0].data.item[0].item[1].request.body.raw).to.equal('{\n  "a": null\n}');
          expect(conversionResult.output[0].data.item[0].item[1].response[1].body).to.equal('{\n  "a": null\n}');
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
              .equal('{\n  "a": "<string>",\n  "b": "<string>"\n}');
            expect(exampleRequest.body.raw).to
              .equal('{\n  "a": "example-a",\n  "b": "example-b"\n}');
            // Request header
            expect(rootRequest.header[0].value).to.equal('<integer>');
            expect(exampleRequest.header[0].value).to.equal('123');
            // Request query parameters
            expect(rootRequest.url.query[0].value).to.equal('<long>%20<long>');
            expect(rootRequest.url.query[1].value).to.equal('<long>%20<long>');
            expect(exampleRequest.url.query[0].value).to.equal('123%20123');
            expect(exampleRequest.url.query[1].value).to.equal('456%20456');
            done();
          });
      });
      it('Should fallback to faked value if the example is not present in the spec and the option is set to example' +
      schemaWithoutExampleSpec, function(done) {
        Converter.convert({ type: 'file', data: schemaWithoutExampleSpec },
          { schemaFaker: true, requestParametersResolution: 'example', exampleParametersResolution: 'example' },
          (err, conversionResult) => {
            let rootRequestBody = JSON.parse(conversionResult.output[0].data.item[0].request.body.raw),
              exampleRequestBody = JSON.parse(conversionResult.output[0].data.item[0]
                .response[0].originalRequest.body.raw);

            expect(rootRequestBody).to.have.all.keys(['a', 'b']);
            expect(rootRequestBody.a).to.be.a('string');
            expect(rootRequestBody.b).to.be.a('string');
            expect(exampleRequestBody).to.have.all.keys(['a', 'b']);
            expect(exampleRequestBody.a).to.be.a('string');
            expect(exampleRequestBody.b).to.be.a('string');
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
              .equal('{\n  "a": "<string>",\n  "b": "<string>"\n}');
            expect(exampleRequest.body.raw).to
              .equal('{\n  "value": {\n    "a": "example-b",\n    "b": "example-c"\n  }\n}');
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
              .equal('{\n  "a": "<string>",\n  "b": "<string>"\n}');
            expect(exampleRequest.body.raw).to
              .equal('{\n  "a": "example-b",\n  "b": "example-c"\n}');
            done();
          });
      });

      it('[Github #338] Should contain non-truthy example from examples outside of schema instead of faked value' +
      examplesOutsideSchema, function(done) {
        Converter.convert({ type: 'file', data: examplesOutsideSchema },
          { schemaFaker: true, requestParametersResolution: 'example', exampleParametersResolution: 'example' },
          (err, conversionResult) => {
            let rootRequest = conversionResult.output[0].data.item[0].request;

            expect(err).to.be.null;
            expect(rootRequest.url.query[0].key).to.eql('limit');
            expect(rootRequest.url.query[0].value).to.eql('0');
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

    it('Should create collection from folder having one root file for browser', function(done) {
      let folderPath = path.join(__dirname, '../data/petstore separate yaml'),
        files = [],
        array = [
          { fileName: folderPath + '/common/Error.yaml' },
          { fileName: folderPath + '/spec/Pet.yaml' },
          { fileName: folderPath + '/spec/NewPet.yaml' },
          { fileName: folderPath + '/spec/parameters.yaml' },
          { fileName: folderPath + '/spec/swagger.yaml' }
        ];

      array.forEach((item) => {
        files.push({
          content: fs.readFileSync(item.fileName, 'utf8'),
          fileName: item.fileName
        });
      });

      var schema = new Converter.SchemaPack({ type: 'folder', data: files });
      schema.mergeAndValidate((err, status) => {
        if (err) {
          expect.fail(null, null, err);
        }
        if (status.result) {
          schema.convert((error, result) => {
            if (error) {
              expect.fail(null, null, err);
            }
            expect(result.result).to.equal(true);
            expect(result.output.length).to.equal(1);
            expect(result.output[0].type).to.have.equal('collection');
            expect(result.output[0].data).to.have.property('info');
            expect(result.output[0].data).to.have.property('item');
            done();
          });
        }
        else {
          expect.fail(null, null, status.reason);
          done();
        }
      });
    });

    it('Should create collection from folder having only one root file and spaces in folder name', function(done) {
      let folderPath = path.join(__dirname, '../data/petstore separate yaml'),
        array = [
          { fileName: folderPath + '/common/Error.yaml' },
          { fileName: folderPath + '/spec/Pet.yaml' },
          { fileName: folderPath + '/spec/NewPet.yaml' },
          { fileName: folderPath + '/spec/parameters.yaml' },
          { fileName: folderPath + '/spec/swagger.yaml' }
        ];

      var schema = new Converter.SchemaPack({ type: 'folder', data: array });
      schema.mergeAndValidate((err, status) => {
        if (err) {
          expect.fail(null, null, err);
        }
        if (status.result) {
          schema.convert((error, result) => {
            if (error) {
              expect.fail(null, null, err);
            }
            expect(result.result).to.equal(true);
            expect(result.output.length).to.equal(1);
            expect(result.output[0].type).to.have.equal('collection');
            expect(result.output[0].data).to.have.property('info');
            expect(result.output[0].data).to.have.property('item');
            done();
          });
        }
        else {
          expect.fail(null, null, status.reason);
          done();
        }
      });
    });

    it('Should create collection from folder having one root file JSON', function(done) {
      let folderPath = path.join(__dirname, '../data/petstore-separate'),
        array = [
          { fileName: folderPath + '/common/Error.json' },
          { fileName: folderPath + '/spec/Pet.json' },
          { fileName: folderPath + '/spec/NewPet.json' },
          { fileName: folderPath + '/spec/parameters.json' },
          { fileName: folderPath + '/spec/swagger.json' }
        ];
      var schema = new Converter.SchemaPack({ type: 'folder', data: array });

      schema.mergeAndValidate((err, status) => {
        if (err) {
          expect.fail(null, null, err);
        }
        if (status.result) {
          schema.convert((error, result) => {
            if (error) {
              expect.fail(null, null, err);
            }
            expect(result.result).to.equal(true);
            expect(result.output.length).to.equal(1);
            expect(result.output[0].type).to.have.equal('collection');
            expect(result.output[0].data).to.have.property('info');
            expect(result.output[0].data).to.have.property('item');
            done();
          });
        }
        else {
          expect.fail(null, null, status.reason);
          done();
        }
      });
    });

    it('Should return meta data from folder having one root file JSON', function(done) {
      let folderPath = path.join(__dirname, '../data/petstore-separate'),
        array = [
          { fileName: folderPath + '/common/Error.json' },
          { fileName: folderPath + '/spec/Pet.json' },
          { fileName: folderPath + '/spec/NewPet.json' },
          { fileName: folderPath + '/spec/parameters.json' },
          { fileName: folderPath + '/spec/swagger.json' }
        ];
      Converter.getMetaData({ type: 'folder', data: array }, (err, status) => {
        if (err) {
          expect.fail(null, null, err);
        }
        if (status.result) {
          expect(status.result).to.be.eq(true);
          expect(status.name).to.be.equal('Swagger Petstore');
          expect(status.output[0].name).to.be.equal('Swagger Petstore');
          expect(status.output[0].type).to.be.equal('collection');
          done();
        }
        else {
          expect.fail(null, null, status.reason);
          done();
        }
      });
    });
    it('Should return meta data from a valid file', function(done) {
      var openapi = fs.readFileSync(testSpec, 'utf8');
      Converter.getMetaData({ type: 'json', data: openapi }, (err, status) => {
        if (err) {
          expect.fail(null, null, err);
        }
        if (status.result) {
          expect(status.result).to.be.eq(true);
          expect(status.name).to.be.equal('Swagger Petstore');
          expect(status.output[0].name).to.be.equal('Swagger Petstore');
          expect(status.output[0].type).to.be.equal('collection');
          done();
        }
        else {
          expect.fail(null, null, status.reason);
          done();
        }
      });
    });

    it('Should return meta data from a valid 3.1 file', function(done) {
      var openapi = fs.readFileSync(test31SpecDir + '/json/non-oauth.json', 'utf8');
      Converter.getMetaData({ type: 'json', data: openapi }, (err, status) => {
        if (err) {
          expect.fail(null, null, err);
        }
        if (status.result) {
          expect(status.result).to.be.eq(true);
          expect(status.name).to.be.equal('Non-oAuth Scopes example');
          expect(status.output[0].name).to.be.equal('Non-oAuth Scopes example');
          expect(status.output[0].type).to.be.equal('collection');
          done();
        }
        else {
          expect.fail(null, null, status.reason);
          done();
        }
      });
    });

    it('Should return validation result for an invalid file', function(done) {
      var invalidNoInfo = path.join(__dirname, INVALID_OPENAPI_PATH + '/invalid-no-info.yaml'),
        openapi = fs.readFileSync(invalidNoInfo, 'utf8');
      Converter.getMetaData({ type: 'json', data: openapi }, (err, status) => {
        if (err) {
          expect.fail(null, null, err);
        }
        if (!status.result) {
          expect(status.result).to.be.eq(false);
          done();
        }
        else {
          expect.fail(null, null, status.reason);
          done();
        }
      });
    });

    it('Should return error for more than one root files', function(done) {
      let folderPath = path.join(__dirname, '../data/multiFile_with_two_root'),
        array = [
          { fileName: folderPath + '/index.yaml' },
          { fileName: folderPath + '/index1.yaml' },
          { fileName: folderPath + '/definitions/index.yaml' },
          { fileName: folderPath + '/definitions/User.yaml' },
          { fileName: folderPath + '/info/index.yaml' },
          { fileName: folderPath + '/info/index1.yaml' },
          { fileName: folderPath + '/paths/index.yaml' },
          { fileName: folderPath + '/paths/foo.yaml' },
          { fileName: folderPath + '/paths/bar.yaml' }
        ];

      Converter.mergeAndValidate({ type: 'folder', data: array }, (err, result) => {
        if (err) {
          expect.fail(null, null, err);
          done();
        }
        expect(result.result).to.be.eq(false);
        expect(result.reason).to.be.equal('More than one root file not supported.');
        return done();
      });
    });

    it('[Github #137]- Should add `requried` keyword in parameters where ' +
      'required field is set to true', function(done) {
      Converter.convert({ type: 'file', data: requiredInParams }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        let requests = conversionResult.output[0].data.item[0].item,
          request,
          response;

        // GET /pets
        // query1 required, query2 optional
        // header1 required, header2 optional
        // response: header1 required, header2 optional
        request = requests[0].request;
        response = requests[0].response[0];
        expect(request.url.query[0].description).to.equal('(Required) Description of query1');
        expect(request.url.query[1].description).to.equal('Description of query2');
        expect(request.header[0].description).to.equal('(Required) Description of header1');
        expect(request.header[1].description).to.equal('Description of header2');
        expect(response.header[0].description).to.equal('(Required) Description of responseHeader1');
        expect(response.header[1].description).to.equal('Description of responseHeader2');

        // PUT /pets
        // RequestBody: multipart/form-data
        // formParam1 required, formParam2 optional
        request = requests[1].request;
        expect(request.body.formdata[0].description).to.equal('(Required) Description of formParam1');
        expect(request.body.formdata[1].description).to.equal('Description of formParam2');

        // POST /pets
        // RequestBody: application/x-www-form-urlencoded
        // urlencodedParam1 required, urlencodedParam2 optional
        request = requests[2].request;
        expect(request.body.urlencoded[0].description).to.equal('(Required) Description of urlencodedParam1');
        expect(request.body.urlencoded[1].description).to.equal('Description of urlencodedParam2');

        // GET pets/{petId}
        // petId required
        request = requests[3].request;
        expect(request.url.variable[0].description).to.equal('(Required) The id of the pet to retrieve');
        done();
      });
    });
    it('should convert to the expected schema with use of schemaFaker and schemaResolution caches', function(done) {
      Converter.convert({ type: 'file', data: multipleRefs }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        let items = conversionResult.output[0].data.item,
          request = items[0].request,
          response = items[0].response,
          requestBody = JSON.parse(request.body.raw),
          responseBody = JSON.parse(response[0].body);
        expect(requestBody).to.deep.equal({
          key1: {
            requestId: '<long>',
            requestName: '<string>'
          },
          key2: {
            requestId: '<long>',
            requestName: '<string>'
          }
        });
        expect(responseBody).to.deep.equal({
          key1: {
            responseId: 234,
            responseName: '200 OK Response'
          },
          key2: {
            responseId: 234,
            responseName: '200 OK Response'
          }
        });
        done();
      });
    });

    it('[GitHub #150] - should generate collection if examples are empty', function (done) {
      var openapi = fs.readFileSync(issue150, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { schemaFaker: false }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        done();
      });
    });

    it('[Github #173] - should add headers correctly to sample request in examples(responses)', function (done) {
      var openapi = fs.readFileSync(issue173, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
        let responseArray;
        expect(err).to.be.null;
        responseArray = conversionResult.output[0].data.item[0].response;
        expect(responseArray).to.be.an('array');
        responseArray.forEach((response) => {
          let headerArray = response.originalRequest.header;
          expect(headerArray).to.be.an('array').that.is.not.empty;
          expect(headerArray).to.eql([
            {
              key: 'access_token',
              value: 'X-access-token',
              description: 'Access token',
              disabled: false
            }
          ]);
        });
        done();
      });
    });

    it('[Github #193] - should handle minItems and maxItems props for (type: array) appropriately', function (done) {
      var openapi = fs.readFileSync(issue193, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
        let responseBody;

        expect(err).to.be.null;
        responseBody = JSON.parse(conversionResult.output[0].data.item[0].response[0].body);

        expect(responseBody).to.be.an('object');
        expect(responseBody).to.have.keys(['min', 'max', 'minmax', 'nomin', 'nomax', 'nominmax']);

        // Check for all cases (number of items generated are kept as valid and minimum as possible)
        // maxItems # of items when minItems not defined (and maxItems < 2)
        expect(responseBody.min).to.have.length(1);
        // limit(20) # of items when minItems > 20
        expect(responseBody.max).to.have.length(20);
        // minItems # of items when minItems and maxItems both is defined
        expect(responseBody.minmax).to.have.length(3);
        // default # of items when minItems not defined (and maxItems >= 2)
        expect(responseBody.nomin).to.have.length(2);
        // minItems # of items when maxItems not defined
        expect(responseBody.nomax).to.have.length(4);
        // default # of items when minItems and maxItems not defined
        expect(responseBody.nominmax).to.have.length(2);
        done();
      });
    });

    it('[GITHUB #10672] Should convert a collection with a key "pattern" in a schema', function() {
      const fileSource = issue10672,
        fileData = fs.readFileSync(fileSource, 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };

      Converter.convert(input, {}, (err, result) => {
        expect(err).to.be.null;
        let body = JSON.parse(result.output[0].data.item[0].item[0].response[0].body);
        expect(result.result).to.be.true;
        expect(body)
          .to.be.an('array').with.length(2);
        expect(body.filter((item) => {
          return item.pattern && typeof item.pattern === 'string';
        })).to.be.an('array').with.length(2);
      });
    });

    it('should not return undefined in the error message if spec is not valid JSON/YAML', function(done) {
      // invalid JSON
      Converter.convert({ type: 'string', data: '{"key": { "value" : } ' }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.be.false;
        expect(conversionResult.reason).to.not.include('undefined');
      });

      // invalid YAML
      Converter.convert({ type: 'string', data: ' :' }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.be.false;
        expect(conversionResult.reason).to.not.include('undefined');
        done();
      });
    });

    it('should throw an invalid format error and not semantic version missing error when yaml.safeLoad ' +
    'does not throw an error while parsing yaml', function(done) {
      // YAML for which yaml.safeLoad does not throw an error
      Converter.convert({ type: 'string', data: 'no error yaml' }, {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.be.false;
        expect(conversionResult.reason).to.not.include('Specification must contain a semantic version number' +
        ' of the OAS specification');
        done();
      });
    });

    describe('[Github #57] - folderStrategy option (value: Tags) ' + tagsFolderSpec, function() {
      async.series({
        pathsOutput: (cb) => {
          Converter.convert({ type: 'file', data: tagsFolderSpec },
            { folderStrategy: 'Paths', exampleParametersResolution: 'schema' }, cb);
        },
        tagsOutput: (cb) => {
          Converter.convert({ type: 'file', data: tagsFolderSpec },
            { folderStrategy: 'Tags', exampleParametersResolution: 'schema' }, cb);
        }
      }, (err, res) => {
        var collectionItems,
          pathsCollection,
          tagsCollection,
          allPathsRequest = {},
          allTagsRequest = {};

        // Creates an object with key being request name and value being collection item (request)
        const getAllRequestsFromCollection = function (collection, allRequests) {
          if (!_.has(collection, 'item') || !_.isArray(collection.item)) {
            return;
          }
          _.forEach(collection.item, (item) => {
            if (_.has(item, 'request') || _.has(item, 'response')) {
              allRequests[item.name] = _.omit(item, ['id', 'response']);
              allRequests[item.name].response = _.map(item.response, (res) => {
                return _.omit(res, ['id']);
              });
            }
            else {
              getAllRequestsFromCollection(item, allRequests);
            }
          });
        };

        // check for successful conversion
        expect(err).to.be.null;
        expect(res.pathsOutput.result).to.be.true;
        expect(res.tagsOutput.result).to.be.true;

        // Collection item object of conversion for option value Tags
        collectionItems = res.tagsOutput.output[0].data.item;
        pathsCollection = res.pathsOutput.output[0].data;
        tagsCollection = res.tagsOutput.output[0].data;

        it('should maintain the sorted order of folder according to the global tags ', function() {
          // checking for the global tags that are used in operations
          expect(collectionItems[0].name).to.equal('pet');
          expect(collectionItems[1].name).to.equal('store');
          expect(collectionItems[2].name).to.equal('user');
        });

        it('should create empty folders on the basis of tags defined in global tags, ' +
        'even though they are not used in any operation', function () {
          // checking for the global tags that are not used in operations
          expect(collectionItems[3].name).to.equal('pet_model');
          expect(collectionItems[4].name).to.equal('store_model');
        });

        it('should create the folder when tag is only given in the operation and not in the root level', function() {
          // checking for the local tags that are used in operations but not defined in global tags object
          expect(collectionItems[5].name).to.equal('cat');
          expect(collectionItems[6].name).to.equal('dog');
        });

        it('should add the requests that doesn\'t have any tags to the collection at root level', function() {
          // skipping the first seven items as they are tag folders.
          expect(collectionItems[7].name).to.equal('Finds Pets by tags');
          expect(collectionItems[7]).to.contain.keys(['request', 'response']);
          expect(collectionItems[8].name).to.equal('Subscribe to the Store events');
          expect(collectionItems[8]).to.contain.keys(['request', 'response']);
          expect(collectionItems[9].name).to.equal('Logs out current logged in user session');
          expect(collectionItems[9]).to.contain.keys(['request', 'response']);
        });

        it('should add request with multiple tags in all mentioned tag folder', function() {
          // Path '/pet/{petId}/uploadImage' contained post operation (uploads an image) contains tags 'pet' and 'cat'
          expect(_.map(collectionItems[0].item, 'name')).to.contain('uploads an image');
          expect(_.map(collectionItems[5].item, 'name')).to.contain('uploads an image');

          // Path '/pet/findByStatus' contained get operation (Finds Pets by status) contains tags 'pet' and 'dog'
          expect(_.map(collectionItems[0].item, 'name')).to.contain('Finds Pets by status');
          expect(_.map(collectionItems[6].item, 'name')).to.contain('Finds Pets by status');
        });

        it('should contain all collection data that default folderStrategy option ' +
          '(value: Paths) contains', function() {
          // Check for collection variables and info
          expect(tagsCollection.variable).to.deep.equal(pathsCollection.variable);
          expect(_.omit(tagsCollection.info, '_postman_id')).to.deep.equal(_.omit(pathsCollection.info, '_postman_id'));

          // Check for all requests
          getAllRequestsFromCollection(pathsCollection, allPathsRequest);
          getAllRequestsFromCollection(tagsCollection, allTagsRequest);
          expect(allTagsRequest).to.deep.equal(allPathsRequest);
        });
      });
    });

    it('Should correctly define URL for root server with base URL variables', function (done) {
      var openapi = fs.readFileSync(rootUrlServerWithVariables, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
        let requestUrl,
          collectionVars;
        expect(err).to.be.null;
        expect(conversionResult.result).to.be.true;

        requestUrl = conversionResult.output[0].data.item[0].request.url;
        collectionVars = conversionResult.output[0].data.variable;
        expect(requestUrl.host).to.eql(['{{baseUrl}}']);
        expect(_.find(collectionVars, { key: 'baseUrl' }).value).to.eql('{{BASE_URI}}/api');
        expect(_.find(collectionVars, { key: 'BASE_URI' }).value).to.eql('https://api.example.com');
        done();
      });
    });

    it('[Github #31] & [GitHub #337] - should set optional params as disabled', function(done) {
      let options = { schemaFaker: true, disableOptionalParameters: true };
      Converter.convert({ type: 'file', data: requiredInParams }, options, (err, conversionResult) => {
        expect(err).to.be.null;
        let requests = conversionResult.output[0].data.item[0].item,
          request,
          urlencodedBody;

        // GET /pets
        // query1 required, query2 optional
        // header1 required, header2 optional
        request = requests[0].request;
        expect(request.url.query[0].disabled).to.be.false;
        expect(request.url.query[1].disabled).to.be.true;
        expect(request.header[0].disabled).to.be.false;
        expect(request.header[1].disabled).to.be.true;

        // POST /pets
        // urlencoded body
        urlencodedBody = requests[2].request.body.urlencoded;
        expect(urlencodedBody[0].key).to.eql('urlencodedParam1');
        expect(urlencodedBody[0].disabled).to.be.false;
        expect(urlencodedBody[1].key).to.eql('urlencodedParam2');
        expect(urlencodedBody[1].disabled).to.be.true;
        done();
      });
    });

    it('Should prefer and use example from parameter object over schema example while faking schema', function(done) {
      Converter.convert({ type: 'file', data: parameterExamples },
        { schemaFaker: true, requestParametersResolution: 'example' },
        (err, conversionResult) => {
          let rootRequest = conversionResult.output[0].data.item[0].request;

          expect(rootRequest.url.query[0].key).to.equal('limit');
          expect(rootRequest.url.query[0].value).to.equal('123');

          expect(rootRequest.url.variable[0].key).to.equal('petId');
          expect(rootRequest.url.variable[0].value).to.equal('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');

          expect(rootRequest.header[0].key).to.equal('x-date');
          expect(rootRequest.header[0].value).to.equal('2003-02-17');
          done();
        });
    });
    it('[GitHub #349] - The converter should return auth type noauth for an empty security object', function (done) {
      var emptyAuthSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/noauth.yaml'),
        openapi = fs.readFileSync(emptyAuthSpec, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { requestNameSource: 'URL' },
        (err, conversionResult) => {
          expect(err).to.be.null;
          let request = conversionResult.output[0].data.item[0].request;
          expect(request.auth.type).to.equal('noauth');
          done();
        });
    });

    it('[Github #10752]: Should convert deepObject length property' +
    deepObjectLengthProperty, function(done) {
      var openapi = fs.readFileSync(deepObjectLengthProperty, 'utf8');
      Converter.convert({ type: 'string', data: openapi },
        { schemaFaker: true, requestParametersResolution: 'Example' }, (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output[0].data.item[0].request.url.query[0].key)
            .to.equal('deepObjectLengthParameter[length]');
          expect(conversionResult.output[0].data.item[0].request.url.query[0].value).to.equal('20');
          done();
        });
    });

    it('Should convert value property in example' +
    valuePropInExample, function(done) {
      var openapi = fs.readFileSync(valuePropInExample, 'utf8');
      Converter.convert({ type: 'string', data: openapi },
        { schemaFaker: true, requestParametersResolution: 'Example' }, (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output[0].data.item[0].response[0]
            .body).to.include('"value": "QA"');
          expect(conversionResult.output[0].data.item[1].response[0]
            .body).to.include('"value": "QA"');
          done();
        });
    });

    it('Should convert example in parameters' +
    petstoreParamExample, function(done) {
      var openapi = fs.readFileSync(petstoreParamExample, 'utf8');
      Converter.convert({ type: 'string', data: openapi },
        { schemaFaker: true, requestParametersResolution: 'Example' }, (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output[0].data.item[0].request.url.variable[0].value).to.equal('value,1');
          expect(conversionResult.output[0].data.item[0].request.url.query[1].key).to.equal('user[value]');
          done();
        });
    });

    it('[Github #559]Should convert description in form data parameters' +
    petstoreParamExample, function(done) {
      var openapi = fs.readFileSync(formDataParamDescription, 'utf8');
      Converter.convert({ type: 'string', data: openapi },
        { }, (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output[0].data.item[0].request.body.formdata[0].description)
            .to.equal('Request param description');
          expect(conversionResult.output[0].data.item[0].request.body.formdata[0].key).to.equal('requestParam');
          expect(conversionResult.output[0].data.item[0].request.body.formdata[0].value).to.equal('<string>');
          done();
        });
    });

    it('Should have disableBodyPruning option for protocolProfileBehavior set to true for all types of request' +
      allHTTPMethodsSpec, function (done) {
      var openapi = fs.readFileSync(allHTTPMethodsSpec, 'utf8');

      Converter.convert({ type: 'string', data: openapi },
        {}, (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);

          _.forEach(conversionResult.output[0].data.item[0].item, (request) => {
            expect(request.protocolProfileBehavior.disableBodyPruning).to.eql(true);
          });
          done();
        });
    });

    it('[GITHUB #597] - should convert file with all of merging properties', function() {
      const fileSource = path.join(__dirname, VALID_OPENAPI_PATH, 'all_of_properties.json'),
        fileData = fs.readFileSync(fileSource, 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };

      Converter.convert(input, { optimizeConversion: false, stackLimit: 50 }, (err, result) => {
        expect(err).to.be.null;
        expect(result.result).to.be.true;
      });
    });
  });

  describe('Converting swagger 2.0 files', function() {
    it('should convert path paramters to postman-compatible paramters', function (done) {
      const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger2-with-params.json'),
        input = {
          type: 'file',
          data: fileData
        };

      Converter.convert(input, {}, function(err, convertResult) {
        expect(err).to.be.null;
        // Make sure that path params are updated and their respective default values
        convertResult.output.forEach(function(element) {
          expect(element.type).to.equal('collection');
          expect(element.data.item[0].request.url.path.indexOf(':ownerId') > -1).to.equal(true);
          expect(element.data.item[0].request.url.path.indexOf(':petId') > -1).to.equal(true);

          let thisVar = element.data.item[0].request.url.variable[0];

          expect(thisVar.type).to.equal('any');

          expect(thisVar.value).to.equal('42');
          expect(thisVar.key).to.equal('ownerId');
        });
        done();
      });
    });

    it('Should convert a swagger document with YAML anchors', function(done) {
      const fileData = fs.readFileSync(path.join(__dirname, SWAGGER_20_FOLDER_YAML, 'yaml_anchor.yaml'), 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };
      Converter.convert(input, {}, (error, result) => {
        expect(error).to.be.null;
        expect(result.result).to.equal(true);
        expect(result.output.length).to.equal(1);
        expect(result.output[0].type).to.have.equal('collection');
        expect(result.output[0].data).to.have.property('info');
        expect(result.output[0].data).to.have.property('item');
      });
      done();
    });

    it('must read values consumes', function (done) {
      const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger_aws_2.json'),
        input = {
          type: 'file',
          data: fileData
        };

      Converter.convert(input, { requestName: 'url' }, (err, convertResult) => {
        expect(err).to.be.null;
        // Make sure that consumes and produces are processed
        convertResult.output.forEach(function(element) {
          expect(element.type).to.equal('collection');
          expect(JSON.stringify(element.data.item[0].request.header[0])).to
            .equal('{"key":"Content-Type","value":"application/json"}');
        });
        done();
      });
    });

    it('should convert a swagger object which only have a root path.', function(done) {
      const fileData = JSON.parse(
          fs.readFileSync(path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger3.json'), 'utf8')
        ),
        input = {
          type: 'json',
          data: fileData
        };

      Converter.convert(input, {}, (err, result) => {
        expect(result.result).to.equal(true);
        expect(result.output.length).to.equal(1);
        expect(result.output[0].type).to.have.equal('collection');
        expect(result.output[0].data).to.have.property('info');
        expect(result.output[0].data).to.have.property('item');

        done();
      });
    });

    it('should name the requests based on requestNameSource parameter, value=`URL`', function (done) {
      const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger3.json'),
        input = {
          type: 'file',
          data: fileData
        };

      Converter.convert(input, { requestNameSource: 'URL' }, (err, convertResult) => {
        let request = convertResult.output[0].data.item[0].request;

        expect(err).to.be.null;
        expect(request.name).to.equal('{{baseUrl}}/');
        done();
      });
    });

    it('should name the requests based on requestNameSource parameter, value=`Fallback`', function (done) {
      const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger3.json'),
        input = {
          type: 'file',
          data: fileData
        };

      Converter.convert(input, { requestNameSource: 'Fallback' }, (err, convertResult) => {
        let request = convertResult.output[0].data.item[0].request;

        expect(err).to.be.null;
        expect(request.name).to.equal('List API versions');
        done();
      });
    });
  });

  describe('requestNameSource option', function() {
    var pathPrefix = VALID_OPENAPI_PATH + '/test1.json',
      specPath = path.join(__dirname, pathPrefix);

    it('for invalid request name source, converter should use the correct fallback value', function(done) {
      var openapi = fs.readFileSync(specPath, 'utf8');
      Converter.convert({ type: 'string', data: openapi }, { requestNameSource: 'uKnown' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        done();
      });
    });

    it('should name request based on url when option has value=`URL`', function (done) {
      Converter.convert({ type: 'file', data: specPath }, { requestNameSource: 'URL' }, (err, conversionResult) => {
        expect(err).to.be.null;
        let request = conversionResult.output[0].data.item[0].item[0].request;
        expect(request.name).to.equal('http://petstore3.swagger.io/:v3/pets');
        done();
      });
    });
    it('should name request based on description when option has value=`Fallback`', function (done) {
      Converter.convert({ type: 'file', data: specPath },
        { requestNameSource: 'Fallback' }, (err, conversionResult) => {
          expect(err).to.be.null;
          let request = conversionResult.output[0].data.item[0].item[0].request;
          expect(request.name).to.equal('List all pets');
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

  describe('The converter must throw an error for invalid input type', function() {
    it('(type: some invalid value)', function(done) {
      var result = Converter.validate({ type: 'fil', data: 'invalid_path' });
      expect(result.result).to.equal(false);
      expect(result.reason).to.contain('input');
      Converter.convert({ type: 'fil', data: 'invalid_path' }, {}, function(err, conversionResult) {
        expect(conversionResult.result).to.equal(false);
        expect(conversionResult.reason).to.equal('Invalid input type (fil). type must be one of file/json/string.');
        done();
      });
    });
  });

  describe('The converter must throw an error for invalid input path', function() {
    it('(type: file)', function(done) {
      var result = Converter.validate({ type: 'file', data: 'invalid_path' });
      expect(result.result).to.equal(false);
      Converter.convert({ type: 'file', data: 'invalid_path' }, {}, function(err, result) {
        expect(result.result).to.equal(false);
        expect(result.reason).to.equal('ENOENT: no such file or directory, open \'invalid_path\'');
        done();
      });
    });
  });

  describe('The converter should not throw error for empty spec', function () {
    var emptySpec = path.join(__dirname, INVALID_OPENAPI_PATH + '/empty-spec.yaml');
    it('should return `empty schema provided` error for input type string', function() {
      Converter.validate({
        type: 'string',
        data: ''
      }, {}, (err, res) => {
        expect(err).to.be.null;
        expect(res.result).to.be.false;
        expect(res.reason).to.equal('Empty input schema provided.');
      });
    });

    it('should return `empty schema provided` error for input type json', function() {
      Converter.validate({
        type: 'json',
        data: {}
      }, {}, (err, res) => {
        expect(err).to.be.null;
        expect(res.result).to.be.false;
        expect(res.reason).to.equal('Empty input schema provided.');
      });
    });

    it('should return `empty schema provided` error for input type file', function() {
      Converter.validate({
        type: 'file',
        data: emptySpec
      }, {}, (err, res) => {
        expect(err).to.be.null;
        expect(res.result).to.be.false;
        expect(res.reason).to.equal('Empty input schema provided.');
      });
    });
  });
});
