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

  it('should accept --sync-options flag with --sync', function(done) {
    const tempSyncFile = 'tempSyncOutput.json';
    exec('./bin/openapi2postmanv2.js -s examples/petstore.yaml --sync collection.json ' +
      '--sync-options syncExamples=true -o ' + tempSyncFile, function(err, stdout) {
      if (fs.existsSync(tempSyncFile)) {
        fs.unlinkSync(tempSyncFile);
      }
      expect(err).to.be.null;
      expect(stdout).to.include('Writing synced collection to file');
      done();
    });
  });

  it('should accept --sync-options-config flag with --sync', function(done) {
    const tempSyncFile = 'tempSyncOutput2.json';
    const tempSyncConfigFile = 'tempSyncConfig.json';

    // Create a temporary sync options config file
    fs.writeFileSync(tempSyncConfigFile, JSON.stringify({ syncExamples: true }, null, 2));

    exec('./bin/openapi2postmanv2.js -s examples/petstore.yaml --sync collection.json ' +
      '--sync-options-config ' + tempSyncConfigFile + ' -o ' + tempSyncFile, function(err, stdout) {
      // Cleanup
      if (fs.existsSync(tempSyncFile)) {
        fs.unlinkSync(tempSyncFile);
      }
      if (fs.existsSync(tempSyncConfigFile)) {
        fs.unlinkSync(tempSyncConfigFile);
      }

      expect(err).to.be.null;
      expect(stdout).to.include('Writing synced collection to file');
      done();
    });
  });
});
