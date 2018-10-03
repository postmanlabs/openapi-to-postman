var path = '../../',
  expect = require('expect.js'),
  package = require(path),
  packageJson = require(path + '/package.json');

/* global describe, it */
describe(packageJson.name, function() {
  var sampleInput = packageJson.com_postman_plugin.sample_input;

  it('should contain all com_postman_plugin attributes', function (done) {
    expect(packageJson.com_postman_plugin).to.have.property('plugin_type');
    expect(packageJson.com_postman_plugin).to.have.property('name');
    expect(packageJson.com_postman_plugin).to.have.property('source_format');
    expect(packageJson.com_postman_plugin).to.have.property('source_format_name');
    expect(packageJson.com_postman_plugin).to.have.property('sample_input');
    done();
  });

  it('should expose the required functions', function (done) {
    expect(typeof package.validate).to.equal('function');
    expect(typeof package.convert).to.equal('function');
    done();
  });

  it('should validate the sample input correctly', function (done) {
    expect(package.validate(sampleInput).result).to.equal(true);
    done();
  });

  it('should convert the sample input correctly', function (done) {
    package.convert(sampleInput, {}, function(err, result) {
      expect(err).to.be(null);
      expect(result.result).to.equal(true);
      result.output.forEach(function (element) {
        expect(element.type).to.be.within('collection', 'request', 'environment');
        if (element.type === 'collection') {
          expect(element.data).to.have.property('info');
          expect(element.data).to.have.property('item');
        }
        else if (element.type === 'request') {
          expect(element.data).to.have.property('url');
        }
        else if (element.type === 'environment') {
          expect(element.data).to.have.property('values');
        }
      });

      done();
    });
  });
});
