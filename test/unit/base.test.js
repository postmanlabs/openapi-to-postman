var expect = require('chai').expect,
  Converter = require('../../index.js'),
  Utils = require('../../lib/util.js'),
  fs = require('fs'),
  // sdk = require('postman-collection'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  INVALID_OPENAPI_PATH = '../data/invalid_openapi';

/* Utility function Unit tests */
describe('UTILITY FUNCTION TESTS', function () {
  describe('convertToPmHeader Function', function() {
    it('Should conevrt header with schema to pm header', function (done) {
      var header = {
        name: 'X-Header-One',
        in: 'header',
        description: 'Header1',
        schema: {
          type: 'integer',
          format: 'int64'
        }
      };
      Utils.options.schemaFaker = true;
      let pmHeader = Utils.convertToPmHeader(header);
      expect(pmHeader.key).to.equal(header.name);
      expect(pmHeader.description).to.equal(header.description);
      expect(typeof pmHeader.value).to.equal('number');
      done();
    });
    it('Should conevrt header without schema to pm header', function (done) {
      var header = {
        name: 'X-Header-One',
        in: 'header',
        description: 'Header1'
      };
      Utils.options.schemaFaker = true;
      let pmHeader = Utils.convertToPmHeader(header);
      expect(pmHeader.key).to.equal(header.name);
      expect(pmHeader.description).to.equal(header.description);
      expect(pmHeader.value).to.equal('');
      done();
    });
  });

  describe('convertToPmQueryParameters Function', function() {
    it('Should conevrt queryParam without schema to pm header', function (done) {
      var param = {
        name: 'X-Header-One',
        in: 'query',
        description: 'query param'
      };
      Utils.options.schemaFaker = true;
      let pmParam = Utils.convertToPmQueryParameters(param);
      expect(pmParam[0].key).to.equal(param.name);
      expect(pmParam[0].description).to.equal(param.description);
      expect(pmParam[0].value).to.equal('');
      done();
    });
    describe('Should conevrt queryParam with schema {type:array, ', function() {
      describe('style:form, ', function() {
        it('explode:true} to pm header', function (done) {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: true,
            schema: {
              type: 'array',
              items: {
                type: 'integer',
                format: 'int64'
              }
            }
          };
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(typeof pmParam[0].value).to.equal('number');
          done();
        });
        it('explode:false} to pm header', function (done) {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: false,
            schema: {
              type: 'array',
              items: {
                type: 'integer',
                format: 'int64'
              }
            }
          };
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value.indexOf(',')).to.not.equal(-1);
          done();
        });
      });
      it('style:spaceDelimited} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'spaceDelimited',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value.indexOf('%20')).to.not.equal(-1);
        done();
      });
      it('style:pipeDelimited} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'pipeDelimited',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value.indexOf('|')).to.not.equal(-1);
        done();
      });
      it('style:deepObject} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'deepObject',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name + '[]');
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].key.indexOf('[]')).to.not.equal(-1);
        expect(pmParam[0].value.indexOf('string')).to.not.equal(-1);
        done();
      });
      it('style:any other} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value.indexOf(',')).to.not.equal(-1);
        done();
      });
    });
    describe('Should conevrt queryParam with schema {type:object, ', function() {
      describe('style:form, ', function() {
        it('explode:true} to pm header', function (done) {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: true,
            schema: {
              type: 'object',
              required: [
                'id',
                'name'
              ],
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64'
                },
                name: {
                  type: 'string'
                }
              }
            }
          };
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal('id');
          expect(pmParam[1].key).to.equal('name');
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[1].description).to.equal(param.description);
          expect(typeof pmParam[0].value).to.equal('number');
          expect(typeof pmParam[1].value).to.equal('string');
          done();
        });
        it('explode:false} to pm header ', function (done) {
          var param = {
            name: 'X-Header-One',
            in: 'query',
            description: 'query param',
            style: 'form',
            explode: false,
            schema: {
              type: 'object',
              required: [
                'id',
                'name'
              ],
              properties: {
                id: {
                  type: 'integer',
                  format: 'int64'
                },
                name: {
                  type: 'string'
                }
              }
            }
          };
          Utils.options.schemaFaker = true;
          let pmParam = Utils.convertToPmQueryParameters(param);
          expect(pmParam[0].key).to.equal(param.name);
          expect(pmParam[0].description).to.equal(param.description);
          expect(pmParam[0].value.indexOf('id')).to.not.equal(-1);
          expect(pmParam[0].value.indexOf('name')).to.not.equal(-1);
          done();
        });
      });
      it('style:spaceDelimited} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'spaceDelimited',
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'integer',
                format: 'int64'
              }
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value.indexOf('%20')).to.not.equal(-1);
        done();
      });
      it('style:pipeDelimited} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'pipeDelimited',
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'integer',
                format: 'int64'
              }
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[0].value.indexOf('|')).to.not.equal(-1);
        done();
      });
      it('style:deepObject} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          style: 'deepObject',
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'string'
              }
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name + '[id]');
        expect(pmParam[1].key).to.equal(param.name + '[name]');
        expect(pmParam[0].description).to.equal(param.description);
        expect(pmParam[1].description).to.equal(param.description);
        expect(typeof pmParam[0].value).to.equal('number');
        expect(typeof pmParam[1].value).to.equal('string');
        done();
      });
      it('style:any other} to pm header', function (done) {
        var param = {
          name: 'X-Header-One',
          in: 'query',
          description: 'query param',
          schema: {
            type: 'object',
            required: [
              'id',
              'name'
            ],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'string'
              }
            }
          }
        };
        Utils.options.schemaFaker = true;
        let pmParam = Utils.convertToPmQueryParameters(param);
        expect(pmParam[0].key).to.equal(param.name);
        expect(pmParam[0].description).to.equal(param.description);
        expect(typeof pmParam[0].value).to.equal('object');
        done();
      });
    });
  });

  describe('getQueryStringWithStyle function', function () {
    it('Should correctly return the query string with the appropriate delimiter', function (done) {
      var param = {
        name: 'tuhin',
        age: 22,
        occupation: 'student'
      };

      expect(Utils.getQueryStringWithStyle(param, '%20')).to.equal('name%20tuhin%20age%2022%20occupation%20student');
      expect(Utils.getQueryStringWithStyle(param, '|')).to.equal('name|tuhin|age|22|occupation|student');
      expect(Utils.getQueryStringWithStyle(param, ',')).to.equal('name,tuhin,age,22,occupation,student');
      done();
    });

    it('Should add the delimiter if the value is undefined', function (done) {
      var param = {
        name: 'tuhin',
        age: undefined,
        occupation: 'student'
      };

      expect(Utils.getQueryStringWithStyle(param, '%20')).to.equal('name%20tuhin%20age%20occupation%20student');
      expect(Utils.getQueryStringWithStyle(param, '|')).to.equal('name|tuhin|age|occupation|student');
      expect(Utils.getQueryStringWithStyle(param, ',')).to.equal('name,tuhin,age,occupation,student');
      done();
    });
  });

  // describe.only('convertToPmBody function', function() {
  //   it('should convert requestbody of media type', function() {
  //     var requestBody = {
  //         description: 'body description',
  //         content: {
  //           'application/json': {
  //             'schema': {
  //               type: 'object',
  //               properties: {
  //                 id: {
  //                   type: 'string'
  //                 },
  //                 name: {
  //                   type: 'integer',
  //                   format: 'int64'
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       },
  //       result = Utils.convertToPmBody(requestBody);

  //     console.log(result);
  //   });
  // });
});


/* Plugin Interface Tests */
describe('------------------------------ INTERFACE FUNCTION TESTS ------------------------------', function () {
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
        done();
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
          Converter.convert({ type: 'string', data: openapi }, {}, (err, conversionResult) => {
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

