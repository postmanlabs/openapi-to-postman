const expect = require('chai').expect,
  Converter = require('../../index.js'),
  async = require('async'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  INVALID_OPENAPI_PATH = '../data/invalid_openapi',
  SWAGGER_20_FOLDER_YAML = '../data/valid_swagger/yaml/',
  SWAGGER_20_FOLDER_JSON = '../data/valid_swagger/json/',
  // VALID_OPENAPI_3_1_FOLDER_JSON = '../data/valid_openapi31X/json',
  testSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/test.json'),
  tagsFolderSpec = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore-detailed.yaml'),
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
  tooManyRefs = path.join(__dirname, VALID_OPENAPI_PATH, '/too_many_ref_example.json'),
  securityTestCases = path.join(__dirname, VALID_OPENAPI_PATH + '/security-test-cases.yaml'),
  securityTestInheritance = path.join(__dirname, VALID_OPENAPI_PATH + '/security-test-inheritance.yaml'),
  emptySecurityTestCase = path.join(__dirname, VALID_OPENAPI_PATH + '/empty-security-test-case.yaml'),
  rootUrlServerWithVariables = path.join(__dirname, VALID_OPENAPI_PATH + '/root_url_server_with_variables.json'),
  parameterExamples = path.join(__dirname, VALID_OPENAPI_PATH + '/parameteres_with_examples.yaml'),
  issue10229 = path.join(__dirname, VALID_OPENAPI_PATH, '/issue#10229.json'),
  deepObjectLengthProperty = path.join(__dirname, VALID_OPENAPI_PATH, '/deepObjectLengthProperty.yaml'),
  valuePropInExample = path.join(__dirname, VALID_OPENAPI_PATH, '/valuePropInExample.yaml'),
  petstoreParamExample = path.join(__dirname, VALID_OPENAPI_PATH, '/petstoreParamExample.yaml'),
  xmlrequestBody = path.join(__dirname, VALID_OPENAPI_PATH, '/xmlExample.yaml'),
  xmlrequestExampleBody = path.join(__dirname, VALID_OPENAPI_PATH, '/xmlExampleWithString.yaml'),
  queryParamWithEnumResolveAsExample =
    path.join(__dirname, VALID_OPENAPI_PATH, '/query_param_with_enum_resolve_as_example.json'),
  formDataParamDescription = path.join(__dirname, VALID_OPENAPI_PATH, '/form_data_param_description.yaml'),
  allHTTPMethodsSpec = path.join(__dirname, VALID_OPENAPI_PATH, '/all-http-methods.yaml'),
  descriptionTestSpec = path.join(__dirname, VALID_OPENAPI_PATH, '/description-test.yaml'),
  invalidNullInfo = path.join(__dirname, INVALID_OPENAPI_PATH, '/invalid-null-info.json'),
  invalidNullInfoTitle = path.join(__dirname, INVALID_OPENAPI_PATH, '/invalid-info-null-title.json'),
  invalidNullInfoVersion = path.join(__dirname, INVALID_OPENAPI_PATH, '/invalid-info-null-version.json'),
  onlyOneOperationDeprecated = path.join(__dirname, VALID_OPENAPI_PATH, '/has_one_op_dep.json'),
  someOperationOneDeprecated = path.join(__dirname, VALID_OPENAPI_PATH, '/has_some_op_dep.json'),
  someOperationDeprecatedUsingTags =
        path.join(__dirname, VALID_OPENAPI_PATH, '/has_some_op_dep_use_tags.json'),
  deprecatedParams =
    path.join(__dirname, VALID_OPENAPI_PATH, '/petstore_deprecated_param.json'),
  deprecatedProperty =
    path.join(__dirname, VALID_OPENAPI_PATH, '/deprecated_property.json'),
  schemaParamDeprecated =
    path.join(__dirname, VALID_OPENAPI_PATH, '/parameter_schema_dep_property.json'),
  specWithAuthBearer = path.join(__dirname, VALID_OPENAPI_PATH + '/specWithAuthBearer.yaml'),
  specWithAuthApiKey = path.join(__dirname, VALID_OPENAPI_PATH + '/specWithAuthApiKey.yaml'),
  specWithAuthDigest = path.join(__dirname, VALID_OPENAPI_PATH + '/specWithAuthDigest.yaml'),
  specWithAuthOauth1 = path.join(__dirname, VALID_OPENAPI_PATH + '/specWithAuthOauth1.yaml'),
  specWithAuthBasic = path.join(__dirname, VALID_OPENAPI_PATH + '/specWithAuthBasic.yaml'),
  schemaWithArrayTypeAndAdditionalProperties =
    path.join(__dirname, VALID_OPENAPI_PATH + '/schemaWithArrayTypeAndAdditionalProperties.yaml'),
  xmlRequestAndResponseBody = path.join(__dirname, VALID_OPENAPI_PATH, '/xmlRequestAndResponseBody.json'),
  xmlRequestAndResponseBodyNoPrefix =
    path.join(__dirname, VALID_OPENAPI_PATH, '/xmlRequestAndResponseBodyNoPrefix.json'),
  xmlRequestAndResponseBodyArrayType =
    path.join(__dirname, VALID_OPENAPI_PATH, '/xmlRequestAndResponseBodyArrayType.json'),
  xmlRequestAndResponseBodyArrayTypeNoPrefix =
    path.join(__dirname, VALID_OPENAPI_PATH, '/xmlRequestAndResponseBodyArrayTypeNoPrefix.json'),
  xmlRequestAndResponseBodyArrayTypeWrapped =
    path.join(__dirname, VALID_OPENAPI_PATH, '/xmlRequestAndResponseBodyArrayTypeWrapped.json'),
  schemaWithAdditionalProperties =
    path.join(__dirname, VALID_OPENAPI_PATH, '/schemaWithAdditionalProperties.yaml'),
  specWithResponseRef =
    path.join(__dirname, VALID_OPENAPI_PATH, '/specWithResponseRef.yaml'),
  specWithNullParams =
    path.join(__dirname, VALID_OPENAPI_PATH, '/specWithNullParams.yaml'),
  acceptHeaderExample =
    path.join(__dirname, VALID_OPENAPI_PATH, '/acceptHeaderExample.json'),
  recursiveRefComponents =
    path.join(__dirname, VALID_OPENAPI_PATH, '/recursiveRefComponents.yaml'),
  securityAuthUnresolvedInPathItem =
    path.join(__dirname, VALID_OPENAPI_PATH, '/securityAuthUnresolvedInPathItem.yaml'),
  multiExampleRequest =
    path.join(__dirname, VALID_OPENAPI_PATH, '/multiExampleRequest.yaml'),
  multiExampleResponse =
    path.join(__dirname, VALID_OPENAPI_PATH, '/multiExampleResponse.yaml'),
  multiExampleRequestResponse =
    path.join(__dirname, VALID_OPENAPI_PATH, '/multiExampleRequestResponse.yaml'),
  multiExampleMatchingRequestResponse =
    path.join(__dirname, VALID_OPENAPI_PATH, '/multiExampleMatchingRequestResponse.yaml'),
  multiContentTypesMultiExample =
    path.join(__dirname, VALID_OPENAPI_PATH, '/multiContentTypesMultiExample.json'),
  multiExampleRequestVariousResponse =
    path.join(__dirname, VALID_OPENAPI_PATH, '/multiExampleRequestVariousResponse.yaml');


describe('The convert v2 Function', function() {

  it('Should explicitly set auth when specified on a request ' +
  securityTestInheritance, function(done) {
    var openapi = fs.readFileSync(securityTestInheritance, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {}, (err, conversionResult) => {

      expect(err).to.be.null;
      expect(conversionResult.output[0].data.auth.type).to.equal('apikey');
      expect(conversionResult.output[0].data.item[0].item[0].request.auth.type).to.equal('bearer');
      expect(conversionResult.output[0].data.item[1].item[0].request.auth.type).to.equal('apikey');
      done();
    });
  });

  it('Should not explicitly set auth when specified on a request when passed alwaysInheritAuthentication ' +
  securityTestInheritance, function(done) {
    const isEmptyArrayOrNull = (value) => {
      return Array.isArray(value) && value.length === 0 || value === null;
    };
    var openapi = fs.readFileSync(securityTestInheritance, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { alwaysInheritAuthentication: true }, (err, conversionResult) => {

        expect(err).to.be.null;
        expect(conversionResult.output[0].data.auth.type).to.equal('apikey');
        expect(conversionResult.output[0].data.item[0].item[0].request.auth).to.satisfy(isEmptyArrayOrNull);
        expect(conversionResult.output[0].data.item[1].item[0].request.auth).to.satisfy(isEmptyArrayOrNull);
        done();
      });
  });

  it('Should add collection level auth with type as `bearer`' +
  securityTestCases, function(done) {
    var openapi = fs.readFileSync(securityTestCases, 'utf8'),
      auth;
    Converter.convertV2({ type: 'string', data: openapi }, {
      requestNameSource: 'Fallback',
      indentCharacter: 'Space',
      collapseFolders: true,
      optimizeConversion: true,
      parametersResolution: 'Example'
    }, (err, conversionResult) => {

      auth = conversionResult.output[0].data.item[0].item[0].request.auth;

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
    Converter.convertV2({ type: 'string', data: openapi }, {}, (err, conversionResult) => {

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
    var openapi = fs.readFileSync(tooManyRefs, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {

      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      let body = conversionResult.output[0].data.item[1].item[0].response[0].body;

      expect(body).to.contain('<Error: Too many levels of nesting to fake this schema>');
      done();
    });
  });

  it('Should generate collection conforming to schema for and fail if not valid ' +
  issue152, function(done) {
    var openapi = fs.readFileSync(issue152, 'utf8'),
      refNotFound = 'reference #/paths/~1pets/get/responses/200/content/application~1json/schema/properties/newprop' +
      ' not found in the OpenAPI spec';
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      expect(conversionResult.output[0].data.item[0].item[0].response[1].body).to.not.contain(refNotFound);
      done();
    });
  });

  it('Should generate collection conforming to schema for and fail if not valid ' +
   testSpec, function(done) {
    var openapi = fs.readFileSync(testSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
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
    Converter.convertV2({ type: 'string', data: openapi },
      { parametersResolution: 'Example', schemaFaker: true }, (err, conversionResult) => {

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
        expect(conversionResult.output[0].data.variable[4].value).to.contain('exampleString');
        done();
      });
  });

  it('Should generate collection conforming to schema for and fail if not valid ' +
  testSpec1, function(done) {
    Converter.convertV2({ type: 'file', data: testSpec1 }, { requestNameSource: 'url' }, (err, conversionResult) => {
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
    Converter.convertV2({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      expect(conversionResult.output[0].data.item[0].item[0].request.url.host[0]).to.equal('{{baseUrl}}');
      done();
    });
  });

  it('Should not get stuck while resolving circular references' +
  unique_items_schema, function(done) {
    Converter.convertV2({ type: 'file', data:
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

  // Need to handle collaping of folders
  it.skip('Should generate collection with collapsing unnecessary folders ' +
  multipleFoldersSpec, function(done) {
    var openapi = fs.readFileSync(multipleFoldersSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item[0].name).to.equal('pets/a/b');
      expect(conversionResult.output[0].data.item[0].item[0].request.method).to.equal('GET');
      expect(conversionResult.output[0].data.item[0].item[1].request.method).to.equal('POST');
      done();
    });
  });
  it.skip('Should collapse child and parent folder when parent has only one child' +
  multipleFoldersSpec1, function(done) {
    var openapi = fs.readFileSync(multipleFoldersSpec1, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
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
  it.skip('Should generate collection without creating folders and having only one request' +
  multipleFoldersSpec2, function(done) {
    var openapi = fs.readFileSync(multipleFoldersSpec2, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item[0].request.name).to.equal('find Pets');
      expect(conversionResult.output[0].data.item[0].request.method).to.equal('GET');
      done();
    });
  });

  it('Should generate collection without collapsing unnecessary folders ' +
  '(if the option is specified) ' +
  multipleFoldersSpec, function(done) {
    var openapi = fs.readFileSync(multipleFoldersSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { collapseFolders: false }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item[0].name).to.equal('pets');
      done();
    });
  });

  it('[Github #113]: Should convert the default value in case of zero as well' +
  zeroDefaultValueSpec, function(done) {
    var openapi = fs.readFileSync(zeroDefaultValueSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output[0].data.item[0].item[0].item[0].item[0].request.url.query[0].value).to.equal('0');
      done();
    });
  });

  it('[Github #90] - Should create a request using local server instead of global server ' +
  serverOverRidingSpec, function(done) {
    Converter.convertV2({ type: 'file', data: serverOverRidingSpec }, { schemaFaker: true },
      (err, conversionResult) => {
      // Combining protocol, host, path to create a request
      // Ex https:// + example.com + /example = https://example.com/example
        let request = conversionResult.output[0].data.item[1].item[0].item[0].request,
          protocol = request.url.protocol,
          host = request.url.host.join('.'),
          port = request.url.port,
          path = request.url.path.join('/'),
          endPoint = protocol + '://' + host + ':' + port + '/' + path,
          host1 = conversionResult.output[0].data.variable[0].value,
          path1 = conversionResult.output[0].data.item[0].item[0].item[0].request.url.path.join('/'),
          endPoint1 = host1 + '/' + path1;
        expect(endPoint).to.equal('http://petstore.swagger.io:{{port}}/:basePath/secondary-domain/fails');
        expect(endPoint1).to.equal('https://api.example.com/primary-domain/works');
        done();
      });
  });

  // Need to handle xml body properly
  it('convertor should add custom header in the response' +
  customHeadersSpec, function(done) {
    var openapi = fs.readFileSync(customHeadersSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.output[0].data.item[0].item[0].item[0].response[0].header[0].value)
        .to.equal('application/vnd.retailer.v3+xml');
      done();
    });
  });

  it('convertor should maintain implicit headers in the request' +
  implicitHeadersSpec, function(done) {
    var openapi = fs.readFileSync(implicitHeadersSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {
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
      done();
    });
  });

  it('convertor should remove implicit headers in the request' +
  implicitHeadersSpec, function(done) {
    var openapi = fs.readFileSync(implicitHeadersSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {
      schemaFaker: true,
      keepImplicitHeaders: false
    }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.output[0].data.item[0].item[0].request.header.length).to.eql(1);
      expect(conversionResult.output[0].data.item[0].item[0].request.header[0].key).to.eql('Accept');
      expect(conversionResult.output[0].data.item[0].item[0].request.header[0].value).to.eql('application/json');
      done();
    });
  });

  it('[Github #102]- Should generate collection info with only contact info' +
    infoHavingContactOnlySpec, function(done) {
    Converter.convertV2({ type: 'file', data: infoHavingContactOnlySpec },
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
    Converter.convertV2({ type: 'file', data: infoHavingDescriptionOnlySpec },
      { schemaFaker: true }, (err, conversionResult) => {
        let description;
        description = conversionResult.output[0].data.info.description;
        expect(description.content).to
          .equal('Hey, this is the description.');
        done();
      });
  });

  it('#GITHUB-10229 should generate correct example is out of the schema and is falsy' +
  issue10229, function(done) {
    var openapi = fs.readFileSync(issue10229, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
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
      Converter.convertV2({ type: 'file', data: examplesInSchemaSpec },
        { schemaFaker: true, parametersResolution: 'example' },
        (err, conversionResult) => {
          let rootRequest = conversionResult.output[0].data.item[0].item[0].request,
            exampleRequest = conversionResult.output[0].data.item[0].item[0].response[0].originalRequest;
          // Request body
          expect(rootRequest.body.raw).to
            .equal('{\n  "a": "example-a",\n  "b": "example-b"\n}');
          expect(exampleRequest.body.raw).to
            .equal('{\n  "a": "example-a",\n  "b": "example-b"\n}');
          done();
        });
    });
    it('Should fallback to faked value if the example is not present in the spec and the option is set to example' +
    schemaWithoutExampleSpec, function(done) {
      Converter.convertV2({ type: 'file', data: schemaWithoutExampleSpec },
        { schemaFaker: true, parametersResolution: 'example', exampleParametersResolution: 'example' },
        (err, conversionResult) => {
          let rootRequestBody = JSON.parse(conversionResult.output[0].data.item[0].item[0].request.body.raw),
            exampleRequestBody = JSON.parse(conversionResult.output[0].data.item[0].item[0]
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
      Converter.convertV2({ type: 'file', data: exampleOutsideSchema },
        { schemaFaker: true, parametersResolution: 'example', exampleParametersResolution: 'example' },
        (err, conversionResult) => {
          let rootRequest = conversionResult.output[0].data.item[0].item[0].request,
            exampleRequest = conversionResult.output[0].data.item[0].item[0].response[0].originalRequest;
          expect(rootRequest.body.raw).to
            .equal('{\n  "a": "example-b",\n  "b": "example-c"\n}');
          expect(exampleRequest.body.raw).to
            .equal('{\n  "a": "example-b",\n  "b": "example-c"\n}');
          done();
        });
    });
    it('Should use example outside of schema instead of schema properties' +
    examplesOutsideSchema, function(done) {
      Converter.convertV2({ type: 'file', data: examplesOutsideSchema },
        { schemaFaker: true, parametersResolution: 'example', exampleParametersResolution: 'example' },
        (err, conversionResult) => {
          let rootRequest = conversionResult.output[0].data.item[0].item[0].request,
            exampleRequest = conversionResult.output[0].data.item[0].item[0].response[0].originalRequest;
          expect(rootRequest.body.raw).to
            .equal('{\n  "a": "example-b",\n  "b": "example-c"\n}');
          expect(exampleRequest.body.raw).to
            .equal('{\n  "a": "example-b",\n  "b": "example-c"\n}');
          done();
        });
    });
  });

  it('[Github #117]- Should add the description in body params in case of urlencoded' +
  descriptionInBodyParams, function(done) {
    var openapi = fs.readFileSync(descriptionInBodyParams, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      let descriptionOne = conversionResult.output[0].data.item[0].item[0].request.body.urlencoded[0].description,
        descriptionTwo = conversionResult.output[0].data.item[0].item[0].request.body.urlencoded[1].description;
      expect(err).to.be.null;
      expect(descriptionOne.content).to.equal('Description of Pet ID');
      expect(descriptionTwo.content).to.equal('Description of Pet name');
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
        schema.convertV2((error, result) => {
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
        schema.convertV2((error, result) => {
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
        schema.convertV2((error, result) => {
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

  it('[Github #137]- Should add `required` keyword in parameters where ' +
    'required field is set to true', function(done) {
    Converter.convertV2({ type: 'file', data: requiredInParams }, { schemaFaker: true }, (err, conversionResult) => {
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
      expect(request.url.query[0].description.content).to.equal('(Required) Description of query1');
      expect(request.url.query[1].description.content).to.equal('Description of query2');
      expect(request.header[0].description.content).to.equal('(Required) Description of header1');
      expect(request.header[1].description.content).to.equal('Description of header2');
      expect(response.header[0].description.content).to.equal('(Required) Description of responseHeader1');
      expect(response.header[1].description.content).to.equal('Description of responseHeader2');

      // PUT /pets
      // RequestBody: multipart/form-data
      // formParam1 required, formParam2 optional
      request = requests[1].request;
      expect(request.body.formdata[0].description.content).to.equal('(Required) Description of formParam1');
      expect(request.body.formdata[1].description.content).to.equal('Description of formParam2');
      expect(request.body.formdata[0].contentType).to.equal('application/xml');
      expect(request.body.formdata[1].contentType).to.equal('application/js');

      // POST /pets
      // RequestBody: application/x-www-form-urlencoded
      // urlencodedParam1 required, urlencodedParam2 optional
      request = requests[2].request;
      expect(request.body.urlencoded[0].description.content).to.equal('(Required) Description of urlencodedParam1');
      expect(request.body.urlencoded[1].description.content).to.equal('Description of urlencodedParam2');

      done();
    });
  });

  // Confirm behaviour for `schema` resolution
  it('should convert to the expected schema with use of schemaFaker and schemaResolution caches', function(done) {
    Converter.convertV2({ type: 'file', data: multipleRefs }, {}, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      let item = conversionResult.output[0].data.item[0].item[0],
        request = item.request,
        response = item.response,
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
          responseId: '<long>',
          responseName: '<string>'
        },
        key2: {
          responseId: '<long>',
          responseName: '<string>'
        }
      });
      done();
    });
  });

  it('[GitHub #150] - should generate collection if examples are empty', function (done) {
    var openapi = fs.readFileSync(issue150, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: false }, (err, conversionResult) => {
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
    Converter.convertV2({ type: 'string', data: openapi },
      { parametersResolution: 'Example' },
      (err, conversionResult) => {
        let responseArray;
        expect(err).to.be.null;
        responseArray = conversionResult.output[0].data.item[0].item[0].response;
        expect(responseArray).to.be.an('array');
        responseArray.forEach((response) => {
          let headerArray = response.originalRequest.header;
          expect(headerArray).to.be.an('array').that.is.not.empty;
          expect(headerArray).to.eql([
            {
              key: 'access_token',
              value: 'X-access-token',
              disabled: false,
              description: {
                content: 'Access token',
                type: 'text/plain'
              }
            }
          ]);
        });
        done();
      });
  });

  it('[Github #193] - should handle minItems and maxItems props for (type: array) appropriately', function (done) {
    var openapi = fs.readFileSync(issue193, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
      let responseBody;

      expect(err).to.be.null;
      responseBody = JSON.parse(conversionResult.output[0].data.item[0].item[0].response[0].body);

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

    Converter.convertV2(input, {}, (err, result) => {
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

  it('should return correct error message if spec is not valid JSON/YAML', function(done) {
    // invalid JSON
    Converter.convertV2({ type: 'string', data: '{"key": { "value" : } ' }, {}, (err) => {
      expect(err).to.not.be.null;
      expect(err.name).to.eql('UserError');
      expect(err.message).to.include('Invalid format. Input must be in YAML or JSON format.');
    });

    // invalid YAML
    Converter.convertV2({ type: 'string', data: ' :' }, {}, (err) => {
      expect(err).to.not.be.null;
      expect(err.name).to.eql('UserError');
      expect(err.message).to.include('Invalid format. Input must be in YAML or JSON format.');
      done();
    });
  });

  it('should throw an invalid format error and not semantic version missing error when yaml.safeLoad ' +
  'does not throw an error while parsing yaml', function(done) {
    // YAML for which yaml.safeLoad does not throw an error
    Converter.convertV2({ type: 'string', data: 'no error yaml' }, {}, (err) => {
      expect(err).to.not.be.null;
      expect(err.name).to.eql('UserError');
      expect(err.message).to.not.include('Specification must contain a semantic version number' +
      ' of the OAS specification');
      done();
    });
  });

  it('Should correctly define URL for root server with base URL variables', function (done) {
    var openapi = fs.readFileSync(rootUrlServerWithVariables, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
      let requestUrl,
        collectionVars;
      expect(err).to.be.null;
      expect(conversionResult.result).to.be.true;

      requestUrl = conversionResult.output[0].data.item[0].item[0].item[0].request.url;
      collectionVars = conversionResult.output[0].data.variable;
      expect(requestUrl.host).to.eql(['{{baseUrl}}']);
      expect(_.find(collectionVars, { key: 'baseUrl' }).value).to.eql('{{BASE_URI}}/api');
      expect(_.find(collectionVars, { key: 'BASE_URI' }).value).to.eql('https://api.example.com');
      done();
    });
  });

  // Handle optional parameters to be made disabled
  it('[Github #31] & [GitHub #337] - should set optional params as disabled', function(done) {
    let options = { schemaFaker: true, enableOptionalParameters: false };
    Converter.convertV2({ type: 'file', data: requiredInParams }, options, (err, conversionResult) => {
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
    Converter.convertV2({ type: 'file', data: parameterExamples },
      { schemaFaker: true, parametersResolution: 'example' },
      (err, conversionResult) => {
        let rootRequest = conversionResult.output[0].data.item[0].item[0].item[0].request;

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
    Converter.convertV2({ type: 'string', data: openapi }, { requestNameSource: 'URL' },
      (err, conversionResult) => {
        expect(err).to.be.null;
        let request = conversionResult.output[0].data.item[0].item[0].request;
        expect(request.auth).to.be.eql({
          type: 'noauth'
        });
        done();
      });
  });

  it('[Github #10752]: Should convert deepObject length property' +
  deepObjectLengthProperty, function(done) {
    var openapi = fs.readFileSync(deepObjectLengthProperty, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { schemaFaker: true, parametersResolution: 'Example' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].item[0].request.url.query[0].key)
          .to.equal('deepObjectLengthParameter[length]');
        expect(conversionResult.output[0].data.item[0].item[0].request.url.query[0].value).to.equal('20');
        done();
      });
  });

  it('Should convert value property in example' +
  valuePropInExample, function(done) {
    var openapi = fs.readFileSync(valuePropInExample, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { schemaFaker: true, parametersResolution: 'Example' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].item[0].response[0]
          .body).to.include('"value": "QA"');
        expect(conversionResult.output[0].data.item[1].item[0].response[0]
          .body).to.include('"value": "QA"');
        done();
      });
  });

  it('Should convert example in parameters' +
  petstoreParamExample, function(done) {
    var openapi = fs.readFileSync(petstoreParamExample, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { schemaFaker: true, parametersResolution: 'Example' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        const request = conversionResult.output[0].data.item[0].item[0].item[0].request;
        expect(request.url.variable[0].value).to.equal('value,1');
        expect(request.url.query[1].key).to.equal('user[value]');
        done();
      });
  });

  it('Should convert xml request body correctly', function(done) {
    const openapi = fs.readFileSync(xmlrequestBody, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { schemaFaker: true, parametersResolution: 'Example' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].item[0].request.body.raw)
          .to.equal(
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope">\n' +
            '  <soap:Body>\n    <NumberToWords ' +
            'xmlns="http://www.dataaccess.com/webservicesserver">\n' +
            '      <ubiNum>500</ubiNum>\n    </NumberToWords>\n  </soap:Body>\n' +
            '</soap:Envelope>'
          );
        done();
      });
  });

  it('Should convert xml request body with complete string example correctly', function(done) {
    const openapi = fs.readFileSync(xmlrequestExampleBody, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { schemaFaker: true, parametersResolution: 'Example' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].item[0].request.body.raw)
          .to.equal(`<?xml version="1.0" encoding="UTF-8"?>
<Errors>
  <error>
    <issue>Mandatory field are missing.</issue>
    <action>Resend request with valid values, any one of Hello or World.</action>
  </error>
</Errors>
`);
        done();
      });
  });

  it('[Github #518]- integer query params with enum values get default value of NaN' +
  descriptionInBodyParams, function(done) {
    var openapi = fs.readFileSync(queryParamWithEnumResolveAsExample, 'utf8');
    Converter.convertV2({
      type: 'string',
      data: openapi
    }, {
      schemaFaker: true,
      parametersResolution: 'Example'
    }, (err, conversionResult) => {
      let fakedParam = conversionResult.output[0].data.item[0].item[0].request.url.query[0].value;
      expect(err).to.be.null;
      expect(fakedParam).to.be.equal('120');
      done();
    });
  });

  it('[Github #559]Should convert description in form data parameters' +
  petstoreParamExample, function(done) {
    var openapi = fs.readFileSync(formDataParamDescription, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output[0].data.item[0].item[0].request.body.formdata[0].description.content)
          .to.equal('Request param description');
        expect(conversionResult.output[0].data.item[0].item[0].request.body.formdata[0].key).to.equal('requestParam');
        expect(conversionResult.output[0].data.item[0].item[0].request.body.formdata[0].value).to.be.a('string');
        done();
      });
  });

  it('should generate a collection with description for Query Params, Path variables and Headers', function(done) {
    var openapi = fs.readFileSync(descriptionTestSpec, 'utf8');

    Converter.convertV2({ type: 'string', data: openapi },
      {}, (err, conversionResult) => {
        expect(
          conversionResult.output[0].data.item[0].item[0].item[0].request.url.query[0].description.content
        ).to.equal('(Required) QUERY PARAM DESCRIPTION');

        expect(
          conversionResult.output[0].data.item[0].item[0].item[0].request.url.query[1].description.content
        ).to.equal('QUERY PARAM Optional');

        expect(
          conversionResult.output[0].data.item[0].item[0].item[0].request.url.variable[0].description.content
        ).to.equal('(Required) Required spacecraftId path param');

        expect(
          conversionResult.output[0].data.item[0].item[0].item[0].request.url.variable[1].description.content
        ).to.equal('Path param optional description');

        expect(
          conversionResult.output[0].data.item[0].item[0].item[0].request.header[0].description.content
        ).to.equal('(Required) HEADER PARAM DESCRIPTION');

        expect(
          conversionResult.output[0].data.item[0].item[0].item[0].request.header[1].description.content
        ).to.equal('HEADER PARAM Optional');
        done();
      });
  });

  it('Should have disableBodyPruning option for protocolProfileBehavior set to true for all types of request' +
    allHTTPMethodsSpec, function (done) {
    var openapi = fs.readFileSync(allHTTPMethodsSpec, 'utf8');

    Converter.convertV2({ type: 'string', data: openapi },
      {}, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        _.forEach(conversionResult.output[0].data.item[0].item, (request) => {
          expect(request.protocolProfileBehavior.disableBodyPruning).to.eql(true);
        });
        done();
      });
  });

  it('[GITHUB #597] - should convert file with all of merging properties', function(done) {
    const fileSource = path.join(__dirname, VALID_OPENAPI_PATH, 'all_of_properties.json'),
      fileData = fs.readFileSync(fileSource, 'utf8'),
      input = {
        type: 'string',
        data: fileData
      };

    Converter.convertV2(input, { optimizeConversion: false, stackLimit: 50 }, (err, result) => {
      let responseBody = JSON.parse(result.output[0].data.item[0].item[0].item[0].response[0].body);
      expect(err).to.be.null;
      expect(result.result).to.be.true;
      expect(responseBody)
        .to.have.all.keys('grandParentTypeData', 'specificType');
      expect(responseBody.specificType)
        .to.have.all.keys(
          'grandParentTypeData',
          'parentTypeData',
          'specificTypeData'
        );

      done();
    });
  });

  it('The converter must throw an error for invalid null info', function (done) {
    var openapi = fs.readFileSync(invalidNullInfo, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      {}, (err) => {
        expect(err).to.not.be.null;
        expect(err.name).to.eql('UserError');
        expect(err.message)
          .to.equal('Specification must contain an Info Object for the meta-data of the API');
        done();
      });
  });

  it('The converter must throw an error for invalid null info title', function (done) {
    var openapi = fs.readFileSync(invalidNullInfoTitle, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      {}, (err) => {
        expect(err).to.not.be.null;
        expect(err.name).to.eql('UserError');
        expect(err.message)
          .to.equal('Specification must contain a title in order to generate a collection');
        done();
      });
  });

  it('The converter must throw an error for invalid null info version', function (done) {
    var openapi = fs.readFileSync(invalidNullInfoVersion, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      {}, (err) => {
        expect(err).to.not.be.null;
        expect(err.name).to.eql('UserError');
        expect(err.message)
          .to.equal('Specification must contain a semantic version number of the API in the Info Object');
        done();
      });
  });

  // TODO: Handle deprecated property config option
  describe('Deprecated property', function () {
    it('Should convert and exclude deprecated operations - has only one op and is deprecated', function (done) {
      const fileData = fs.readFileSync(onlyOneOperationDeprecated, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData }, { includeDeprecated: false },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.result).to.be.true;
          expect(result.output[0].data.item).to.be.empty;
          done();
        });
    });

    it('Should convert and exclude deprecated operations - has some deprecated', function (done) {
      const fileData = fs.readFileSync(someOperationOneDeprecated, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: false },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.result).to.be.true;
          expect(result.output[0].data.item.length).to.equal(1);
          done();
        });
    });

    it('Should convert and exclude deprecated operations - has only one op and is deprecated' +
      'using tags as folder strategy operation has not tag', function (done) {
      const fileData = fs.readFileSync(onlyOneOperationDeprecated, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: false, folderStrategy: 'tags' },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.result).to.be.true;
          expect(result.output[0].data.item).to.be.empty;
          done();
        });
    });

    it('Should convert and exclude deprecated operations - has some deprecated' +
      'using tags as folder strategy', function (done) {
      const fileData = fs.readFileSync(someOperationDeprecatedUsingTags, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: false, folderStrategy: 'tags' },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.result).to.be.true;
          expect(result.output[0].data.item.length).to.equal(1);
          expect(result.output[0].data.item[0].name).to.equal('pets');
          done();
        });
    });

    it('Should convert and exclude deprecated params when option is set to false', function(done) {
      const fileData = fs.readFileSync(deprecatedParams, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: false },
        (err, result) => {
          const req1 = result.output[0].data.item[0].item[0],
            req2 = result.output[0].data.item[0].item[1];

          expect(err).to.be.null;
          expect(req1.request.url.query.length).to.equal(1);
          expect(req1.request.url.query[0].key).to.equal('variable');
          expect(req1.request.header[0].key).to.equal('limit');
          expect(req1.request.header[1].key).to.equal('limit_2');
          expect(req2.request.header[0].key).to.equal('limit_2');

          done();
        });
    });

    it('Should convert and include deprecated params when option is set to true', function(done) {
      const fileData = fs.readFileSync(deprecatedParams, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: true },
        (err, result) => {
          const req = result.output[0].data.item[0].item[0];

          expect(err).to.be.null;
          expect(req.request.url.query.length).to.equal(2);
          expect(req.request.url.query[0].key).to.equal('variable');
          expect(req.request.url.query[1].key).to.equal('variable2');
          expect(req.request.header[0].key).to.equal('limit');
          expect(req.request.header[1].key).to.equal('limit_2');
          expect(req.request.header[2].key).to.equal('limit_Dep');

          done();
        });
    });

    it('Should convert and include deprecated params when option is not present', function(done) {
      const fileData = fs.readFileSync(deprecatedParams, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData }, {},
        (err, result) => {
          const req = result.output[0].data.item[0].item[0];

          expect(err).to.be.null;
          expect(req.request.url.query.length).to.equal(2);
          expect(req.request.url.query[0].key).to.equal('variable');
          expect(req.request.url.query[1].key).to.equal('variable2');
          expect(req.request.header[0].key).to.equal('limit');
          expect(req.request.header[1].key).to.equal('limit_2');
          expect(req.request.header[2].key).to.equal('limit_Dep');

          done();
        });
    });

    it('Should convert and exclude deprecated property when option is set to false', function(done) {
      const fileData = fs.readFileSync(deprecatedProperty, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: false },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.output[0].data.item[0].item[0].request.body.raw)
            .to.equal('{\n  "b": "<string>"\n}');
          expect(result.output[0].data.item[0].item[0].response[1].body.includes('errorCode')).to.be.false;
          expect(result.output[0].data.item[0].item[0].response[1].body.includes('ErrorData')).to.be.true;

          done();
        });
    });

    it('Should convert and include deprecated property when option is set to true', function(done) {
      const fileData = fs.readFileSync(deprecatedProperty, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: true },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.output[0].data.item[0].item[0].request.body.raw)
            .to.equal('{\n  "a": "<string>",\n  "b": "<string>"\n}');
          expect(result.output[0].data.item[0].item[0].response[1].body.includes('errorCode')).to.be.true;

          done();
        });
    });

    it('Should convert and include deprecated property when option is set to true in query and path', function(done) {
      const fileData = fs.readFileSync(schemaParamDeprecated, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: true },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.output[0].data.item[0].item[0].request.url.query[0].key)
            .to.equal('deprecated');
          expect(result.output[0].data.item[0].item[0].request.url.query[1].key)
            .to.equal('b');
          expect(result.output[0].data.item[0].item[0].request.url.variable[0].value)
            .to.equal(';limitPath=deprecated,<boolean>,b,<string>');
          expect(result.output[0].data.item[0].item[0].request.header[0].value)
            .to.equal('deprecated,<boolean>,b,<string>');

          done();
        });
    });

    it('Should convert and include deprecated property when option is set to false in query and path', function() {
      const fileData = fs.readFileSync(schemaParamDeprecated, 'utf8');
      Converter.convertV2({ type: 'string', data: fileData },
        { includeDeprecated: false },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.output[0].data.item[0].item[0].request.url.query[0].key)
            .to.equal('deprecated');
          expect(result.output[0].data.item[0].item[0].request.url.query[1].key)
            .to.equal('b');
          expect(result.output[0].data.item[0].item[0].request.url.variable[0].value)
            .to.equal(';limitPath=b,<string>');
          expect(result.output[0].data.item[0].item[0].request.header[0].value)
            .to.equal('b,<string>');
        });
    });
  });

  it('Should generate collection where folder name doesn\'t contain spaces when ' +
  'not present in operation path', function (done) {
    var openapi = fs.readFileSync(testSpec, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      expect(conversionResult.output[0].data.item.length).to.equal(2);
      expect(_.map(conversionResult.output[0].data.item[0].item, 'name')).to.include
        .members(['List all pets', '/pets']);

      done();
    });
  });

  describe('[Github #643] - Generated value for corresponding' +
    ' authorization should be as environment variable format', function() {

    it('Should convert a collection and set bearer auth placeholder as variable', function(done) {
      var openapi = fs.readFileSync(specWithAuthBearer, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);
        expect(conversionResult.output[0].data.auth.bearer[0].value).to.equal('{{bearerToken}}');
        done();
      });
    });

    it('Should convert a collection and set basic auth placeholder as variable', function(done) {
      var openapi = fs.readFileSync(specWithAuthBasic, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);
        expect(conversionResult.output[0].data.auth.basic[0].value).to.equal('{{basicAuthUsername}}');
        expect(conversionResult.output[0].data.auth.basic[1].value).to.equal('{{basicAuthPassword}}');
        done();
      });
    });

    it('Should convert a collection and set digest auth placeholder as variable', function(done) {
      var openapi = fs.readFileSync(specWithAuthDigest, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);
        expect(conversionResult.output[0].data.auth.digest[0].value).to.equal('{{digestAuthUsername}}');
        expect(conversionResult.output[0].data.auth.digest[1].value).to.equal('{{digestAuthPassword}}');
        expect(conversionResult.output[0].data.auth.digest[2].value).to.equal('{{realm}}');
        done();
      });
    });

    it('Should convert a collection and set oauth1 auth placeholder as variable', function(done) {
      var openapi = fs.readFileSync(specWithAuthOauth1, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);
        expect(conversionResult.output[0].data.auth.oauth1[0].value).to.equal('{{consumerSecret}}');
        expect(conversionResult.output[0].data.auth.oauth1[1].value).to.equal('{{consumerKey}}');
        done();
      });
    });

    it('Should convert a collection and set apiKey auth placeholder as variable', function(done) {
      var openapi = fs.readFileSync(specWithAuthApiKey, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);
        expect(conversionResult.output[0].data.auth.apikey[0].value).to.equal('{{apiKeyName}}');
        expect(conversionResult.output[0].data.auth.apikey[1].value).to.equal('{{apiKey}}');
        done();
      });
    });
  });

  it('Should convert and resolve xml bodies correctly when prefix is provided', function(done) {
    var openapi = fs.readFileSync(xmlRequestAndResponseBody, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const resultantRequestBody = conversionResult.output[0].data.item[0].item[0].request.body.raw,
          resultantResponseBody = conversionResult.output[0].data.item[0].item[0].response[0].body,
          expectedRequestBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ex:ExampleXMLRequest xmlns:ex=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '  <requestNumber>(number)</requestNumber>\n' +
            '</ex:ExampleXMLRequest>',
          expectedResponseBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ex:ExampleXMLResponse xmlns:ex=\"urn:ExampleXML\">\n' +
            '  <responseInteger>(integer)</responseInteger>\n' +
            '  <responseString>(string)</responseString>\n' +
            '  <responseBoolean>(boolean)</responseBoolean>\n' +
            '  <responseNumber>(number)</responseNumber>\n' +
            '</ex:ExampleXMLResponse>';
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(resultantRequestBody).to.equal(expectedRequestBody);
        expect(resultantResponseBody).to.equal(expectedResponseBody);
        done();
      }
    );
  });

  it('Should convert and resolve xml bodies correctly when prefix is not provided', function(done) {
    var openapi = fs.readFileSync(xmlRequestAndResponseBodyNoPrefix, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const resultantRequestBody = conversionResult.output[0].data.item[0].item[0].request.body.raw,
          resultantResponseBody = conversionResult.output[0].data.item[0].item[0].response[0].body,
          expectedRequestBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ExampleXMLRequest xmlns=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ExampleXMLRequest>',
          expectedResponseBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ExampleXMLResponse xmlns=\"urn:ExampleXML\">\n' +
            '  <responseInteger>(integer)</responseInteger>\n' +
            '  <responseString>(string)</responseString>\n' +
            '  <responseBoolean>(boolean)</responseBoolean>\n' +
            '</ExampleXMLResponse>';
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(resultantRequestBody).to.equal(expectedRequestBody);
        expect(resultantResponseBody).to.equal(expectedResponseBody);
        done();
      }
    );
  });

  it('Should convert and resolve xml bodies correctly when type is array', function(done) {
    var openapi = fs.readFileSync(xmlRequestAndResponseBodyArrayType, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const resultantRequestBody = conversionResult.output[0].data.item[0].item[0].request.body.raw,
          resultantResponseBody = conversionResult.output[0].data.item[0].item[0].response[0].body,
          expectedRequestBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ex:ExampleXMLRequest xmlns:ex=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ex:ExampleXMLRequest>\n' +
            '<ex:ExampleXMLRequest xmlns:ex=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ex:ExampleXMLRequest>',
          expectedResponseBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ex:ExampleXMLResponse xmlns:ex=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ex:ExampleXMLResponse>\n' +
            '<ex:ExampleXMLResponse xmlns:ex=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ex:ExampleXMLResponse>';
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(resultantRequestBody).to.equal(expectedRequestBody);
        expect(resultantResponseBody).to.equal(expectedResponseBody);
        done();
      }
    );
  });

  it('Should convert and resolve xml bodies correctly when type is array and prefix is not provided', function(done) {
    var openapi = fs.readFileSync(xmlRequestAndResponseBodyArrayTypeNoPrefix, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const resultantRequestBody = conversionResult.output[0].data.item[0].item[0].request.body.raw,
          resultantResponseBody = conversionResult.output[0].data.item[0].item[0].response[0].body,
          expectedRequestBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ExampleXMLRequest xmlns=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ExampleXMLRequest>\n' +
            '<ExampleXMLRequest xmlns=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ExampleXMLRequest>',
          expectedResponseBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ExampleXMLResponse xmlns=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ExampleXMLResponse>\n' +
            '<ExampleXMLResponse xmlns=\"urn:ExampleXML\">\n' +
            '  <requestInteger>(integer)</requestInteger>\n' +
            '  <requestString>(string)</requestString>\n' +
            '  <requestBoolean>(boolean)</requestBoolean>\n' +
            '</ExampleXMLResponse>';
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(resultantRequestBody).to.equal(expectedRequestBody);
        expect(resultantResponseBody).to.equal(expectedResponseBody);
        done();
      }
    );
  });

  it('Should convert and resolve xml bodies correctly when type is array and xml has wrapped', function(done) {
    var openapi = fs.readFileSync(xmlRequestAndResponseBodyArrayTypeWrapped, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const resultantRequestBody = conversionResult.output[0].data.item[0].item[0].request.body.raw,
          resultantResponseBody = conversionResult.output[0].data.item[0].item[0].response[0].body,
          expectedRequestBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<ex:ExampleXMLRequest>\n' +
            '  <ex:ExampleXMLRequest xmlns:ex=\"urn:ExampleXML\">\n' +
            '    <requestInteger>(integer)</requestInteger>\n' +
            '    <requestString>(string)</requestString>\n' +
            '    <requestBoolean>(boolean)</requestBoolean>\n' +
            '  </ex:ExampleXMLRequest>\n' +
            '  <ex:ExampleXMLRequest xmlns:ex=\"urn:ExampleXML\">\n' +
            '    <requestInteger>(integer)</requestInteger>\n' +
            '    <requestString>(string)</requestString>\n' +
            '    <requestBoolean>(boolean)</requestBoolean>\n' +
            '  </ex:ExampleXMLRequest>\n' +
            '</ex:ExampleXMLRequest>',
          expectedResponseBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
          '<ex:ExampleXMLResponse>\n' +
          '  <ex:ExampleXMLResponse xmlns:ex=\"urn:ExampleXML\">\n' +
          '    <requestInteger>(integer)</requestInteger>\n' +
          '    <requestString>(string)</requestString>\n' +
          '    <requestBoolean>(boolean)</requestBoolean>\n' +
          '  </ex:ExampleXMLResponse>\n' +
          '  <ex:ExampleXMLResponse xmlns:ex=\"urn:ExampleXML\">\n' +
          '    <requestInteger>(integer)</requestInteger>\n' +
          '    <requestString>(string)</requestString>\n' +
          '    <requestBoolean>(boolean)</requestBoolean>\n' +
          '  </ex:ExampleXMLResponse>\n' +
          '</ex:ExampleXMLResponse>';
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(resultantRequestBody).to.equal(expectedRequestBody);
        expect(resultantResponseBody).to.equal(expectedResponseBody);
        done();
      }
    );
  });

  it('Should fake correctly the body when schema has array type and additionalProperties', function(done) {
    var openapi = fs.readFileSync(schemaWithArrayTypeAndAdditionalProperties, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { schemaFaker: true }, (err, conversionResult) => {
      const resultantResponseBody = JSON.parse(
          conversionResult.output[0].data.item[0].item[0].item[0].response[0].body
        ),
        resultantRequestBody = JSON.parse(
          conversionResult.output[0].data.item[0].item[0].item[0].request.body.raw
        );
      expect(err).to.be.null;
      expect(conversionResult.result).to.equal(true);
      expect(conversionResult.output.length).to.equal(1);
      expect(conversionResult.output[0].type).to.equal('collection');
      expect(conversionResult.output[0].data).to.have.property('info');
      expect(conversionResult.output[0].data).to.have.property('item');
      expect(resultantResponseBody.result).to.be.an('array')
        .with.length(2);
      expect(resultantResponseBody.result[0]).to.include.all.keys('id', 'name');
      expect(resultantResponseBody.result[1]).to.include.all.keys('id', 'name');
      expect(resultantRequestBody.result).to.be.an('array')
        .with.length(2);
      expect(resultantRequestBody.result[0]).to.include.all.keys('id', 'name');
      expect(resultantRequestBody.result[1]).to.include.all.keys('id', 'name');
      done();
    });
  });

  it('Should resolve correctly schemas with additionalProperties as false', function(done) {
    var openapi = fs.readFileSync(schemaWithAdditionalProperties, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const requestBodyWithAdditionalPropertiesAsFalse =
          JSON.parse(conversionResult.output[0].data.item[0].item[0].item[0].request.body.raw);
        expect(requestBodyWithAdditionalPropertiesAsFalse).to.include.keys('test');
        expect(Object.keys(requestBodyWithAdditionalPropertiesAsFalse)).to.have.length(1);
        done();
      });
  });

  it('Should resolve correctly schemas with ONLY additionalProperties', function(done) {
    var openapi = fs.readFileSync(schemaWithAdditionalProperties, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const responseBodyWithOnlyAdditionalProperties =
          JSON.parse(conversionResult.output[0].data.item[0].item[0].item[0].response[0].body);
        expect(Object.keys(responseBodyWithOnlyAdditionalProperties).length).to.be.greaterThan(0);
        done();
      });
  });

  it('Should resolve correctly schemas with additionalProperties', function(done) {
    var openapi = fs.readFileSync(schemaWithAdditionalProperties, 'utf8');
    Converter.convertV2(
      { type: 'string', data: openapi },
      { schemaFaker: true },
      (err, conversionResult) => {
        const responseBodyWithAdditionalProperties =
          JSON.parse(conversionResult.output[0].data.item[0].item[0].item[0].response[1].body);
        expect(responseBodyWithAdditionalProperties).to.include.keys('test1');

        // json-schema-faker doesn't guarantee that there will always be additional properties generated
        expect(Object.keys(responseBodyWithAdditionalProperties).length).to.be.greaterThanOrEqual(1);
        done();
      });
  });

  it('Should convert using tags as folder strategy', function () {
    const someOperationDeprecatedUsingTags =
      path.join(__dirname, VALID_OPENAPI_PATH, '/has_some_op_dep_use_tags.json'),
      fileData = fs.readFileSync(someOperationDeprecatedUsingTags, 'utf8');
    Converter.convert({ type: 'string', data: fileData },
      { includeDeprecated: false, folderStrategy: 'tags' },
      (err, result) => {
        expect(err).to.be.null;
        expect(result.result).to.be.true;
        expect(result.output[0].data.item.length).to.equal(1);
        expect(result.output[0].data.item[0].name).to.equal('pets');
      });
  });

  describe('[Github #57] - folderStrategy option (value: Tags) ' + tagsFolderSpec, function() {
    async.series({
      pathsOutput: (cb) => {
        Converter.convertV2({ type: 'file', data: tagsFolderSpec },
          { folderStrategy: 'Paths', exampleParametersResolution: 'schema' }, cb);
      },
      tagsOutput: (cb) => {
        Converter.convertV2({ type: 'file', data: tagsFolderSpec },
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
        expect(_.size(allTagsRequest)).to.deep.equal(_.size(allPathsRequest));
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

      Converter.convertV2(input, {}, function(err, convertResult) {
        expect(err).to.be.null;
        // Make sure that path params are updated and their respective default values
        convertResult.output.forEach(function(element) {
          expect(element.type).to.equal('collection');
          expect(element.data.item[0].item[0].item[0]
            .item[0].item[0].request.url.path.indexOf(':ownerId') > -1)
            .to.equal(true);
          expect(element.data.item[0].item[0].item[0]
            .item[0].item[0].request.url.path.indexOf(':petId') > -1)
            .to.equal(true);

          let thisVar = element.data.item[0].item[0].item[0].item[0].item[0].request.url.variable[0];

          expect(thisVar.type).to.equal('any');

          expect(thisVar.value).to.equal('42');
          expect(thisVar.key).to.equal('ownerId');

          done();
        });
      });
    });

    it('Should convert a swagger document with YAML anchors', function(done) {
      const fileData = fs.readFileSync(path.join(__dirname, SWAGGER_20_FOLDER_YAML, 'yaml_anchor.yaml'), 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };
      Converter.convertV2(input, {}, (error, result) => {
        expect(error).to.be.null;
        expect(result.result).to.equal(true);
        expect(result.output.length).to.equal(1);
        expect(result.output[0].type).to.have.equal('collection');
        expect(result.output[0].data).to.have.property('info');
        expect(result.output[0].data).to.have.property('item');
        done();
      });
    });

    it('must read values consumes', function (done) {
      const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger_aws_2.json'),
        input = {
          type: 'file',
          data: fileData
        };

      Converter.convertV2(input, { requestName: 'url' }, (err, convertResult) => {
        expect(err).to.be.null;
        // Make sure that consumes and produces are processed
        convertResult.output.forEach(function(element) {
          expect(element.type).to.equal('collection');
          expect(JSON.stringify(element.data.item[0].item[0].request.header[0])).to
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

      Converter.convertV2(input, {}, (err, result) => {
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

      Converter.convertV2(input, { requestNameSource: 'URL' }, (err, convertResult) => {
        let request = convertResult.output[0].data.item[0].item[0].request;

        expect(err).to.be.null;
        expect(request.name).to.equal('/');
        done();
      });
    });

    it('should name the requests based on requestNameSource parameter, value=`Fallback`', function (done) {
      const fileData = path.join(__dirname, SWAGGER_20_FOLDER_JSON, 'swagger3.json'),
        input = {
          type: 'file',
          data: fileData
        };

      Converter.convertV2(input, { requestNameSource: 'Fallback' }, (err, convertResult) => {
        let request = convertResult.output[0].data.item[0].item[0].request;

        expect(err).to.be.null;
        expect(request.name).to.equal('List API versions');
        done();
      });
    });

    it('[GITHUB #10710] - should convert file with all of merging properties. ' +
      'One ocurrence is an empty object and the other is a boolean type', function() {
      const fileSource = path.join(__dirname, SWAGGER_20_FOLDER_YAML, 'allOfConflicted.yaml'),
        fileData = fs.readFileSync(fileSource, 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };

      Converter.convertV2(input, {
        optimizeConversion: false, stackLimit: 50
      }, (err, result) => {
        const expectedResponseBody1 = JSON.parse(
            result.output[0].data.item[0].item[0].item[1]
              .item[0].response[0].body
          ),
          expectedResponseBody2 = JSON.parse(
            result.output[0].data.item[0].item[0].item[0].item[0].item[0].response[0].body
          );
        expect(err).to.be.null;
        expect(result.result).to.be.true;
        expect(expectedResponseBody2.payload).to.be.eql('<boolean>');
        expect(expectedResponseBody1.payload).to.be.an('object')
          .and.to.have.all.keys('content', 'paging');
      });
    });

    it('[GITHUB #417] - should convert file with enum as conflicts while merging allOf keyword', function() {
      const fileSource = path.join(__dirname, VALID_OPENAPI_PATH, 'enumAllOfConflicts.yaml'),
        fileData = fs.readFileSync(fileSource, 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };

      Converter.convertV2(input, {
        optimizeConversion: false
      }, (err, result) => {
        const expectedResponseBody = JSON.parse(result.output[0].data.item[0].item[0].response[0].body);
        expect(err).to.be.null;
        expect(result.result).to.be.true;
        expect(expectedResponseBody).to.be.an('object');
        expect(expectedResponseBody).to.have.property('status');
        expect(expectedResponseBody.status).to.be.a('string');
        expect(expectedResponseBody.status).to.be.oneOf(['no_market', 'too_small', 'too_large',
          'incomplete', 'completed', 'refunded']);
      });
    });

    it('[GITHUB #417] - should convert file with allOf schemas containing additionalProperties as false ', function() {
      const fileSource = path.join(__dirname, VALID_OPENAPI_PATH, 'allOfAdditionalProperties.json'),
        fileData = fs.readFileSync(fileSource, 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };

      Converter.convertV2(input, {
        optimizeConversion: false
      }, (err, result) => {
        const expectedRequestBody = JSON.parse(result.output[0].data.item[0].item[0].item[0].request.body.raw);

        expect(err).to.be.null;
        expect(result.result).to.be.true;

        expect(expectedRequestBody).to.be.an('object');
        expect(expectedRequestBody).to.have.keys(['phoneNumber', 'zipCode', 'countryCode', 'state', 'city',
          'address1', 'lastName', 'firstName', 'email', 'campaignId']);
      });
    });

    it('Should convert a swagger document with XML example correctly', function(done) {
      const fileData = fs.readFileSync(path.join(__dirname, SWAGGER_20_FOLDER_YAML, 'xml_example.yaml'), 'utf8'),
        input = {
          type: 'string',
          data: fileData
        };
      Converter.convertV2(input, { parametersResolution: 'Example' }, (error, result) => {
        expect(error).to.be.null;
        expect(result.result).to.equal(true);
        expect(result.output.length).to.equal(1);
        expect(result.output[0].type).to.have.equal('collection');
        expect(result.output[0].data).to.have.property('info');
        expect(result.output[0].data).to.have.property('item');
        expect(result.output[0].data.item[0].item[0].response[0].body).to.eql(`<?xml version="1.0" encoding="UTF-8"?>
<element>
  <CstmrPmtStsRpt>
    <GrpHdr>
      <MsgId>20231213-PSR/1798570726</MsgId>
      <InitgPty>
        <Id>
          <OrgId>
            <BICOrBEI>US33</BICOrBEI>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <OrgnlGrpInfAndSts>
      <OrgnlMsgId>100060058</OrgnlMsgId>
      <Orgn1MsgNmId>pain.001.02</Orgn1MsgNmId>
      <OrgnlCreDtTm>2023-05-16T14:35:23-05:00</OrgnlCreDtTm>
      <Orgn1NbOfTxs>1</Orgn1NbOfTxs>
    </OrgnlGrpInfAndSts>
    <OrgnlPmtInfAndSts>
      <OrgnlPmtInfId>ASIA</OrgnlPmtInfId>
      <TxInfAndSts>
        <OrgnlEndToEndId>ASIADD</OrgnlEndToEndId>
        <TxSts>ACTC</TxSts>
      </TxInfAndSts>
    </OrgnlPmtInfAndSts>
    <OrgnlPmtInfAndSts>
      <OrgnlPmtInfId>EU</OrgnlPmtInfId>
      <TxInfAndSts>
        <OrgnlEndToEndId>EUDD</OrgnlEndToEndId>
        <TxSts>EUTC</TxSts>
      </TxInfAndSts>
    </OrgnlPmtInfAndSts>
  </CstmrPmtStsRpt>
</element>`);
        expect(result.output[0].data.item[0].item[1].response[0].body).to.eql(`<?xml version="1.0" encoding="UTF-8"?>
<element>
  <CstmrPmtStsRpt>
    <GrpHdr>
      <MsgId>20201213-PSR/1798570726</MsgId>
      <InitgPty>
        <Id>
          <OrgId>
            <BICOrBEI>US33</BICOrBEI>
          </OrgId>
        </Id>
      </InitgPty>
    </GrpHdr>
    <OrgnlGrpInfAndSts>
      <OrgnlMsgId>100060058</OrgnlMsgId>
      <Orgn1MsgNmId>pain.001.02</Orgn1MsgNmId>
      <OrgnlCreDtTm>2023-05-16T14:35:23-05:00</OrgnlCreDtTm>
      <Orgn1NbOfTxs>1</Orgn1NbOfTxs>
    </OrgnlGrpInfAndSts>
    <OrgnlPmtInfAndSts>
      <OrgnlPmtInfId>ASIA</OrgnlPmtInfId>
      <TxInfAndSts>
        <OrgnlEndToEndId>ASIADD</OrgnlEndToEndId>
        <TxSts>ACTC</TxSts>
      </TxInfAndSts>
    </OrgnlPmtInfAndSts>
    <OrgnlPmtInfAndSts>
      <OrgnlPmtInfId>EU</OrgnlPmtInfId>
      <TxInfAndSts>
        <OrgnlEndToEndId>EUDD</OrgnlEndToEndId>
        <TxSts>EUTC</TxSts>
      </TxInfAndSts>
    </OrgnlPmtInfAndSts>
  </CstmrPmtStsRpt>
</element>`);
        done();
      });
    });
  });

  it('Should honor indent character option', function(done) {
    var openapi = fs.readFileSync(petstoreParamExample, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { parametersResolution: 'Schema', indentCharacter: 'Tab' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        const response = conversionResult.output[0].data.item[0].item[0].item[0].response[0];
        expect(response.body).to.equal('[\n\t{\n\t\t"id": "<long>",\n\t\t"name": "<string>",\n\t\t"tag": "<string>"' +
          '\n\t},\n\t{\n\t\t"id": "<long>",\n\t\t"name": "<string>",\n\t\t"tag": "<string>"' +
          '\n\t}\n]');
        done();
      });
  });

  it('Should honor indent character option set as space', function(done) {
    var openapi = fs.readFileSync(petstoreParamExample, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi },
      { parametersResolution: 'Schema', indentCharacter: 'Space' }, (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);

        const response = conversionResult.output[0].data.item[0].item[0].item[0].response[0];
        expect(response.body).to.equal('[\n  {\n    "id": "<long>",\n    "name": "<string>",\n    "tag": "<string>' +
          '"\n  },\n  {\n    "id": "<long>",\n    "name": "<string>",\n    "tag": "<string>"\n  }\n]');
        done();
      });
  });

  it('Should add auth information in responses when includeAuthInfoInExample option is set', function(done) {
    var openapi = fs.readFileSync(specWithAuthApiKey, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { includeAuthInfoInExample: true },
      (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);
        expect(conversionResult.output[0].data.auth.apikey[0].value).to.equal('{{apiKeyName}}');
        expect(conversionResult.output[0].data.auth.apikey[1].value).to.equal('{{apiKey}}');

        const item = conversionResult.output[0].data.item[0].item[0].item[0];
        expect(item.request.header.length).to.eql(1);
        expect(item.request.header[0].key).to.eql('Accept');
        expect(item.request.header[0].value).to.eql('application/json');
        expect(item.response[0].originalRequest.header[0]).to.be.eql({
          key: 'Accept',
          value: 'application/json'
        });
        expect(item.response[0].originalRequest.header[1]).to.be.eql({
          description: {
            content: 'Added as a part of security scheme: apikey',
            type: 'text/plain'
          },
          key: '{{apiKeyName}}',
          value: '<API Key>'
        });
        done();
      });
  });

  it('Should not add auth information in responses when includeAuthInfoInExample option is false',
    function(done) {
      var openapi = fs.readFileSync(specWithAuthApiKey, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { includeAuthInfoInExample: false },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);

          const item = conversionResult.output[0].data.item[0].item[0].item[0];
          expect(item.request.header.length).to.eql(1);
          expect(item.request.header[0].key).to.eql('Accept');
          expect(item.request.header[0].value).to.eql('application/json');
          expect(item.response[0].originalRequest.header.length).to.eql(1);
          expect(item.response[0].originalRequest.header[0].key).to.eql('Accept');
          expect(item.response[0].originalRequest.header[0].value).to.eql('application/json');

          done();
        });
    });

  it('Should convert a collection and set oauth1 header in response', function(done) {
    var openapi = fs.readFileSync(specWithAuthOauth1, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { includeAuthInfoInExample: true },
      (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);
        expect(conversionResult.output[0].data.auth.oauth1[0].value).to.equal('{{consumerSecret}}');
        expect(conversionResult.output[0].data.auth.oauth1[1].value).to.equal('{{consumerKey}}');

        const item = conversionResult.output[0].data.item[0].item[0].item[0];

        expect(item.request.header.length).to.eql(1);
        expect(item.request.header[0].key).to.eql('Accept');
        expect(item.request.header[0].value).to.eql('application/json');
        expect(item.response[0].originalRequest.header[0]).to.be.eql({
          key: 'Accept',
          value: 'application/json'
        });
        expect(item.response[0].originalRequest.header[1]).to.be.eql({
          description: {
            content: 'Added as a part of security scheme: oauth1',
            type: 'text/plain'
          },
          key: 'Authorization',
          value: 'OAuth <credentials>'
        });
        done();
      });
  });

  it('Should convert a collection with response $ref correctly', function(done) {
    var openapi = fs.readFileSync(specWithResponseRef, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
      (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);

        const item = conversionResult.output[0].data.item[0].item[0].item[0];

        expect(item.response[1].name).to.eql('unexpected error');
        expect(item.response[1].header.length).to.eql(2);
        expect(item.response[1].header[0].key).to.eql('Content-Type');
        expect(item.response[1].header[0].value).to.eql('application/json');
        expect(item.response[1].header[1].key).to.eql('x-trace-id');
        expect(item.response[1].header[1].value).to.eql('12345-6789');
        expect(JSON.parse(item.response[1].body)).to.have.property('code');
        expect(JSON.parse(item.response[1].body)).to.have.property('message');

        // Incorrectly defined properties will be skipped
        expect(JSON.parse(item.response[1].body)).to.not.have.property('nullProp');
        done();
      });
  });

  it('Should convert a collection with undefined/null params and response headers without error', function(done) {
    var openapi = fs.readFileSync(specWithNullParams, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {},
      (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);

        const item = conversionResult.output[0].data.item[0].item[0].item[0];

        expect(item.request.url.query.length).to.eql(1);
        expect(item.request.url.variable.length).to.eql(1);
        expect(item.request.header.length).to.eql(1);

        expect(item.response[0].header.length).to.eql(1);
        done();
      });
  });

  it('Should add corresponding Accept header in collection example\'s request correctly', function(done) {
    var openapi = fs.readFileSync(acceptHeaderExample, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {},
      (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);

        const item1 = conversionResult.output[0].data.item[0].item[1].item[0].item[0],
          item2 = conversionResult.output[0].data.item[0].item[0].item[0],
          acceptHeader = {
            key: 'Accept',
            value: 'application/json'
          };

        expect(item1.request.header.length).to.eql(1);
        expect(item1.request.header[0]).to.eql(acceptHeader);
        expect(item1.response[0].originalRequest.header.length).to.eql(1);
        expect(item1.response[0].originalRequest.header[0]).to.eql(acceptHeader);
        expect(item1.response[1].originalRequest.header).to.be.undefined;

        expect(item2.request.header.length).to.eql(2);
        expect(item2.request.header[0].key).to.eql('x-hello');
        expect(item2.request.header[1]).to.eql(acceptHeader);
        expect(item2.response[0].originalRequest.header.length).to.eql(2);
        expect(item2.response[0].originalRequest.header[0].key).to.eql('x-hello');
        expect(item2.response[0].originalRequest.header[1]).to.eql(acceptHeader);
        expect(item2.response[1].originalRequest.header.length).to.eql(2);
        expect(item2.response[1].originalRequest.header[0].key).to.eql('x-hello');
        expect(item2.response[1].originalRequest.header[1]).to.eql(acceptHeader);
        done();
      });
  });

  it('Should handle recursive references for non-schema $refs correctly', function(done) {
    var openapi = fs.readFileSync(recursiveRefComponents, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {},
      (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);

        const item = conversionResult.output[0].data.item[0].item[0];

        expect(item.request.header).to.be.undefined;
        expect(item.request.url.query).to.be.empty;
        expect(item.response.length).to.eql(2);
        expect(item.response[0].header).to.be.empty;
        expect(item.response[0].body).to.be.undefined;
        expect(item.response[1].header).to.be.empty;
        expect(item.response[1].body).to.be.undefined;
        done();
      });
  });

  it('Should generate auth as null when it cannot be resolved from provided security definitions', function(done) {
    const openapi = fs.readFileSync(securityAuthUnresolvedInPathItem, 'utf8');
    Converter.convertV2({ type: 'string', data: openapi }, {},
      (err, conversionResult) => {
        expect(err).to.be.null;
        expect(conversionResult.result).to.equal(true);
        expect(conversionResult.output.length).to.equal(1);
        expect(conversionResult.output[0].type).to.equal('collection');
        expect(conversionResult.output[0].data).to.have.property('info');
        expect(conversionResult.output[0].data).to.have.property('item');
        expect(conversionResult.output[0].data.item.length).to.equal(1);

        const item = conversionResult.output[0].data.item[0].item[0];
        expect(item.request.auth).to.be.null;
        done();
      });
  });

  it('Should convert definition with empty title field correctly with default name', function(done) {
    const fileData = fs.readFileSync(path.join(__dirname, VALID_OPENAPI_PATH, 'empty-title.yaml'), 'utf8'),
      input = {
        type: 'string',
        data: fileData
      };

    Converter.convert(input, { }, (error, result) => {
      expect(error).to.be.null;
      expect(result.result).to.equal(true);
      expect(result.output.length).to.equal(1);
      expect(result.output[0].type).to.have.equal('collection');
      expect(result.output[0].data).to.have.property('info');
      expect(result.output[0].data.info.name).to.eql('Imported from OpenAPI');
      expect(result.output[0].data).to.have.property('item');
      done();
    });
  });

  describe('Should generate multiple examples when', function() {
    it('request body contains multiple examples but request body has single example', function(done) {
      var openapi = fs.readFileSync(multiExampleRequest, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');
          expect(conversionResult.output[0].data).to.have.property('info');
          expect(conversionResult.output[0].data).to.have.property('item');
          expect(conversionResult.output[0].data.item[0].item.length).to.equal(1);

          const item = conversionResult.output[0].data.item[0].item[0];

          expect(JSON.parse(item.request.body.raw)).to.eql({
            user: 1,
            height: 168,
            weight: 44
          });
          expect(item.response).to.have.lengthOf(2);
          expect(item.response[0].name).to.eql('valid-request');
          expect(item.response[0]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[0].body)).to.eql({ hello: 'world' });
          expect(JSON.parse(item.response[0].originalRequest.body.raw)).to.eql({
            user: 1,
            height: 168,
            weight: 44
          });

          expect(item.response[1].name).to.eql('missing-required-parameter');
          expect(item.response[1]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[1].body)).to.eql({ hello: 'world' });
          expect(JSON.parse(item.response[1].originalRequest.body.raw)).to.eql({
            user: 1
          });
          done();
        });
    });

    it('response body contains multiple examples but response body has single example', function(done) {
      var openapi = fs.readFileSync(multiExampleResponse, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');
          expect(conversionResult.output[0].data).to.have.property('info');
          expect(conversionResult.output[0].data).to.have.property('item');
          expect(conversionResult.output[0].data.item[0].item.length).to.equal(1);

          const item = conversionResult.output[0].data.item[0].item[0];

          expect(JSON.parse(item.request.body.raw)).to.eql({ hello: 'world' });
          expect(item.response).to.have.lengthOf(2);
          expect(item.response[0].name).to.eql('valid-request');
          expect(item.response[0]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[0].body)).to.eql({
            user: 1,
            height: 168,
            weight: 44
          });
          expect(JSON.parse(item.response[0].originalRequest.body.raw)).to.eql({ hello: 'world' });

          expect(item.response[1].name).to.eql('missing-required-parameter');
          expect(item.response[1]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[1].body)).to.eql({ user: 1 });
          expect(JSON.parse(item.response[1].originalRequest.body.raw)).to.eql({ hello: 'world' });
          done();
        });
    });

    it('both request and response body contains multiple examples with matching keys and ignore non matching keys',
      function(done) {
        const openapi = fs.readFileSync(multiExampleMatchingRequestResponse, 'utf8');
        Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
          (err, conversionResult) => {
            expect(err).to.be.null;
            expect(conversionResult.result).to.equal(true);
            expect(conversionResult.output.length).to.equal(1);
            expect(conversionResult.output[0].type).to.equal('collection');
            expect(conversionResult.output[0].data).to.have.property('info');
            expect(conversionResult.output[0].data).to.have.property('item');
            expect(conversionResult.output[0].data.item[0].item.length).to.equal(1);

            const item = conversionResult.output[0].data.item[0].item[0];

            expect(JSON.parse(item.request.body.raw)).to.eql({
              includedFields: ['user', 'height', 'weight']
            });

            /**
             * Even though both req and res has 3 examples, only 2 example should be present
             * as only 2 examples have matching keys
             */
            expect(item.response).to.have.lengthOf(2);
            expect(item.response[0].name).to.eql('Complete request');
            expect(item.response[0]._postman_previewlanguage).to.eql('json');
            expect(JSON.parse(item.response[0].body)).to.eql({
              user: 1,
              height: 168,
              weight: 44
            });
            expect(JSON.parse(item.response[0].originalRequest.body.raw)).to.eql({
              includedFields: ['user', 'height', 'weight']
            });

            expect(item.response[1].name).to.eql('Request with only required params');
            expect(item.response[1]._postman_previewlanguage).to.eql('json');
            expect(JSON.parse(item.response[1].body)).to.eql({ user: 1 });
            expect(JSON.parse(item.response[1].originalRequest.body.raw)).to.eql({
              includedFields: ['user']
            });
            done();
          });
      });

    it('both request and response body contains multiple examples in mentioned order when no matching keys',
      function(done) {
        var openapi = fs.readFileSync(multiExampleRequestResponse, 'utf8');
        Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
          (err, conversionResult) => {
            expect(err).to.be.null;
            expect(conversionResult.result).to.equal(true);
            expect(conversionResult.output.length).to.equal(1);
            expect(conversionResult.output[0].type).to.equal('collection');
            expect(conversionResult.output[0].data).to.have.property('info');
            expect(conversionResult.output[0].data).to.have.property('item');
            expect(conversionResult.output[0].data.item[0].item.length).to.equal(1);

            const item = conversionResult.output[0].data.item[0].item[0];

            expect(JSON.parse(item.request.body.raw)).to.eql({
              includedFields: ['user', 'height', 'weight']
            });
            expect(item.response).to.have.lengthOf(2);
            expect(item.response[0].name).to.eql('Request with only required params');
            expect(item.response[0]._postman_previewlanguage).to.eql('json');
            expect(JSON.parse(item.response[0].body)).to.eql({
              user: 1
            });
            expect(JSON.parse(item.response[0].originalRequest.body.raw)).to.eql({
              includedFields: ['user', 'height', 'weight']
            });

            expect(item.response[1].name).to.eql('Complete request');
            expect(item.response[1]._postman_previewlanguage).to.eql('json');
            expect(JSON.parse(item.response[1].body)).to.eql({
              user: 1,
              height: 168,
              weight: 44
            });
            expect(JSON.parse(item.response[1].originalRequest.body.raw)).to.eql({
              includedFields: ['user']
            });
            done();
          });
      });

    it('request body and responses contain multiple content types and multiple examples', function(done) {
      const openapi = fs.readFileSync(multiContentTypesMultiExample, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');
          expect(conversionResult.output[0].data).to.have.property('info');
          expect(conversionResult.output[0].data).to.have.property('item');
          expect(conversionResult.output[0].data.item[0].item.length).to.equal(1);

          const item = conversionResult.output[0].data.item[0].item[0],
            okReqExample = { message: 'ok' },
            failReqExample = { message: 'fail' },
            okResExample = { message: 'Found', code: 200123 },
            failResExample = { message: 'Not Found' };

          expect(JSON.parse(item.request.body.raw)).to.eql(okReqExample);
          expect(item.response).to.have.lengthOf(4);
          expect(item.response[0].name).to.eql('ok_example');
          expect(item.response[0].code).to.eql(200);
          expect(item.response[0]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[0].originalRequest.body.raw)).to.eql(okReqExample);
          expect(JSON.parse(item.response[0].body)).to.eql(okResExample);

          expect(item.response[1].name).to.eql('not_ok_example');
          expect(item.response[1].code).to.eql(200);
          expect(item.response[1]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[1].originalRequest.body.raw)).to.eql(failReqExample);
          expect(JSON.parse(item.response[1].body)).to.eql(okResExample);

          expect(item.response[2].name).to.eql('ok_example');
          expect(item.response[2].code).to.eql(500);
          expect(item.response[2]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[2].originalRequest.body.raw)).to.eql(okReqExample);
          expect(JSON.parse(item.response[2].body)).to.eql(failResExample);

          expect(item.response[3].name).to.eql('not_ok_example');
          expect(item.response[3].code).to.eql(500);
          expect(item.response[3]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[3].originalRequest.body.raw)).to.eql(failReqExample);
          expect(JSON.parse(item.response[3].body)).to.eql(failResExample);
          done();
        });
    });

    it('request body and responses contain multiple examples with various response code ' +
      'having single or multiple examples', function(done) {
      const openapi = fs.readFileSync(multiExampleRequestVariousResponse, 'utf8');
      Converter.convertV2({ type: 'string', data: openapi }, { parametersResolution: 'Example' },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.equal(true);
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');
          expect(conversionResult.output[0].data).to.have.property('info');
          expect(conversionResult.output[0].data).to.have.property('item');
          expect(conversionResult.output[0].data.item[0].item.length).to.equal(1);

          const item = conversionResult.output[0].data.item[0].item[0],
            reqBody1 = { includedFields: ['user', 'height', 'weight'] },
            reqBody2 = { includedFields: ['eyeColor'] };

          expect(JSON.parse(item.request.body.raw)).to.eql(reqBody1);
          expect(item.response).to.have.lengthOf(4);
          expect(item.response[0].name).to.eql('Request with only required params');
          expect(item.response[0].code).to.eql(200);
          expect(item.response[0]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[0].originalRequest.body.raw)).to.eql(reqBody1);
          expect(JSON.parse(item.response[0].body)).to.eql({ user: 1 });

          expect(item.response[1].name).to.eql('Request with only bad params');
          expect(item.response[1].code).to.eql(400);
          expect(item.response[1]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[1].originalRequest.body.raw)).to.eql(reqBody2);
          expect(JSON.parse(item.response[1].body)).to.eql({ eyeColor: 'gray' });

          expect(item.response[2].name).to.eql('Failed request - Negative user');
          expect(item.response[2].code).to.eql(500);
          expect(item.response[2]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[2].originalRequest.body.raw)).to.eql(reqBody1);
          expect(JSON.parse(item.response[2].body)).to.eql({ user: -99 });

          expect(item.response[3].name).to.eql('Failed request - All negatives');
          expect(item.response[3].code).to.eql(500);
          expect(item.response[3]._postman_previewlanguage).to.eql('json');
          expect(JSON.parse(item.response[3].originalRequest.body.raw)).to.eql(reqBody2);
          expect(JSON.parse(item.response[3].body)).to.eql({ user: -999, height: -168, weight: -44 });
          done();
        });
    });
  });
});
