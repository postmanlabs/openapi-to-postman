var expect = require('chai').expect,
  fs = require('fs'),
  exec = require('child_process').exec,
  collection;

describe('openapi2postmanv2 ', function() {
  const tempOutputFile = 'tempOutput.json';

  after(function () {
    if (fs.existsSync(tempOutputFile)) {
      fs.unlinkSync(tempOutputFile);
    }
  });

  it('should print to console', function(done) {
    exec('./bin/openapi2postmanv2.js -s test/data/valid_openapi/petstore.json', function(err, stdout) {
      expect(err).to.be.null;
      expect(stdout).to.include('Swagger Petstore');
      done();
    });
  });

  it('should print to file', function(done) {
    exec('./bin/openapi2postmanv2.js -s test/data/valid_openapi/petstore.json -o tempOutput.json', function(err) {
      expect(err).to.be.null;
      fs.readFile(tempOutputFile, 'utf8', (err, data) => {
        collection = JSON.parse(data);
        expect(collection.info.name).to.equal('Swagger Petstore');
        expect(collection.item.length).to.equal(1);
        done();
      });
    });
  });

  it('should show appropriate messages for invalid input', function (done) {
    exec('./bin/openapi2postmanv2.js -s test/data/invalid_openapi/multiple-components.yaml',
      function(err, stdout, stderr) {
        expect(err).to.be.null;
        expect(stderr).to.include('duplicated mapping key');
        done();
      });
  });
});
