var path = '../../',
  expect = require('expect.js'),
  mod = require(path),
  package = require(path + '/package.json');
/* global describe, it */
describe(package.name + ' should contains', function() {
  describe('com_postman_plugin attributes', function() {
    it('plugin_type', function(done) {
      expect(package.com_postman_plugin).to.have.property('plugin_type');
      done();
    });
    it('name', function(done) {
      expect(package.com_postman_plugin).to.have.property('name');
      done();
    });
    it('source_format', function(done) {
      expect(package.com_postman_plugin).to.have.property('source_format');
      done();
    });
    it('sample_input', function (done) {
      expect(package.com_postman_plugin).to.have.property('sample_input');
      done();
    });
  });
  describe('functions', function() {
    it('validate', function(done) {
      expect(typeof mod.validate).to.equal('function');
      done();
    });
    it('convert', function(done) {
      expect(typeof mod.convert).to.equal('function');
      done();
    });
  });
  describe('retun values of', function() {
    it('validate as expected', function(done) {
      expect(
        mod.validate(package.com_postman_plugin.sample_input).result
      ).to.equal(true);
      done();
    });
    it('convert as expected', function(done) {
      mod.convert(package.com_postman_plugin.sample_input, function(
        err,
        ConversionResult
      ) {
        expect(ConversionResult.result).to.equal(true);
        ConversionResult.output.forEach(function(element) {
          expect(element.type).to.be.within('collection', 'request');
          if (element.type === 'collection') {
            expect(element.data).to.have.property('info');
            expect(element.data).to.have.property('item');
          }
          else {
            expect(ConversionResult.data).to.have.property('url');
          }
          done();
        });
      });
    });
  });
});
