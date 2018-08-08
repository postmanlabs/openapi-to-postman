var expect = require('chai').expect,
  Converter = require('../../index.js'),
  Utils = require('../../lib/util.js'),
  fs = require('fs'),
  sdk = require('postman-collection'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  INVALID_OPENAPI_PATH = '../data/invalid_openapi';

/* Utility function Unit tests */
describe('------------------------------ UTILITY FUNCTION TESTS ------------------------------', function () {
  describe('addHeaders Function', function() {
    it('Should add the headers', function () {
      var item = new sdk.Item({
          name: 'postman-item',
          request: {
            url: 'https://petstore.swagger.io/api'
          }
        }),
        headers = [
          {
            name: 'X-Header-One',
            description: 'Header1'
          },
          {
            name: 'X-Header-Two',
            description: 'Header2'
          },
          {
            name: 'X-Header-Three',
            description: 'Header3'
          }
        ],
        postmanHeaders = [
          {
            'key': 'X-Header-One',
            'value': '',
            'description': 'Header1'
          },
          {
            'key': 'X-Header-Two',
            'value': '',
            'description': 'Header2'
          },
          {
            'key': 'X-Header-Three',
            'value': '',
            'description': 'Header3'
          }
        ];
      let updatedItem = Utils.addHeaders(item, headers);
      expect(JSON.stringify(updatedItem.request.headers.members)).to.eql(JSON.stringify(postmanHeaders));
    });

    it('Should return the original item object if no headers are passed', function () {
      var item = new sdk.Item({
        name: 'postman-item',
        request: {
          url: 'https://petstore.swagger.io/api'
        }
      });
      let updatedItem = Utils.addHeaders(item, []);
      expect(updatedItem).to.deep.equal(item);
    });
  });

  describe('getQueryStringWithStyle function', function () {
    it('Should correctly return the query string with the appropriate delimiter', function () {
      var param = {
        name: 'tuhin',
        age: 22,
        occupation: 'student'
      };

      expect(Utils.getQueryStringWithStyle(param, '%20')).to.equal('name%20tuhin%20age%2022%20occupation%20student');
      expect(Utils.getQueryStringWithStyle(param, '|')).to.equal('name|tuhin|age|22|occupation|student');
      expect(Utils.getQueryStringWithStyle(param, ',')).to.equal('name,tuhin,age,22,occupation,student');
    });

    it('Should add the delimiter if the value is undefined', function () {
      var param = {
        name: 'tuhin',
        age: undefined,
        occupation: 'student'
      };

      expect(Utils.getQueryStringWithStyle(param, '%20')).to.equal('name%20tuhin%20age%20occupation%20student');
      expect(Utils.getQueryStringWithStyle(param, '|')).to.equal('name|tuhin|age|occupation|student');
      expect(Utils.getQueryStringWithStyle(param, ',')).to.equal('name,tuhin,age,occupation,student');
    });
  });
});


/* Plugin Interface Tests */
describe('------------------------------ INTERFACE FUNCTION TESTS ------------------------------', function () {
  describe('The converter must identify valid specifications', function () {
    var pathPrefix = VALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);

      it(specPath + ' is valid ', function() {
        var openapi = fs.readFileSync(specPath, 'utf8'),
          validationResult = Converter.validate(openapi);

        expect(validationResult.result).to.equal(true);
      });
    });
  });

  describe('The converter must identify invalid specifications', function () {
    var pathPrefix = INVALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);

      it(specPath + ' is invalid ', function() {
        var openapi = fs.readFileSync(specPath, 'utf8'),
          validationResult = Converter.validate(openapi);

        expect(validationResult.result).to.equal(false);
      });
    });
  });

  describe('The converter must generate a collection conforming to the schema', function () {
    var pathPrefix = VALID_OPENAPI_PATH,
      sampleSpecs = fs.readdirSync(path.join(__dirname, pathPrefix));

    sampleSpecs.map((sample) => {
      var specPath = path.join(__dirname, pathPrefix, sample);
      if (specPath.endsWith('stripe_openapi.json')) {
        it('Should generate collection conforming to schema for and fail if not valid ' + specPath, function(done) {
          var openapi = fs.readFileSync(specPath, 'utf8');
          Converter.convert(openapi, (err, conversionResult) => {
            expect(err).to.be.null;

            expect(conversionResult.result).to.equal(true);
            expect(conversionResult.output.length).to.equal(1);
            expect(conversionResult.output[0].type).to.equal('collection');
            expect(conversionResult.output[0].data).to.have.property('info');
            expect(conversionResult.output[0].data).to.have.property('item');

            done();
          });
        });
      }
    });
  });
});

