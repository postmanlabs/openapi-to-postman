const expect = require('chai').expect,
  path = require('path'),
  fs = require('fs'),
  parse = require('../../lib/parse.js');

describe('PARSE FUNCTION TESTS', function() {
  it('getRootFiles should return an array with only one root file path', function() {
    let folderPath = path.join(__dirname, '../data/multiFile_with_one_root'),
      array = [
        { fileName: folderPath + '/index.yaml' },
        { fileName: folderPath + '/definitions/index.yaml' },
        { fileName: folderPath + '/definitions/User.yaml' },
        { fileName: folderPath + '/info/index.yaml' },
        { fileName: folderPath + '/paths/index.yaml' },
        { fileName: folderPath + '/paths/foo.yaml' },
        { fileName: folderPath + '/paths/bar.yaml' }
      ],
      result = parse.getRootFiles({ data: array, type: 'string' });
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal(folderPath + '/index.yaml');
  });

  it('getOasObject function should return a valid oas object from a yaml file', function() {
    let filePath = path.join(__dirname, '../data/multiFile_with_one_root/index.yaml'),
      file = fs.readFileSync(filePath, 'utf8'),
      result = parse.getOasObject(file);

    expect(result.oasObject.openapi).to.equal('3.0.0');
  });

  it('mergeFiles function should merge all files in the folder correctly', function() {
    const filePath = path.join(__dirname, '../data/multiFile_with_one_root/index.yaml'),
      OasResolverOptions = {
        resolve: true,
        jsonSchema: true
      };
    parse.mergeFiles(filePath, OasResolverOptions).then((result) => {
      expect(JSON.stringify(result)).to.equal('{"openapi":"3.0.0","info":{"version":"0.0.0","title":"Simple API"},' +
      '"paths":{"/foo":{"get":{"responses":{"200":{"description":"OK"}}}},"/bar":{"get":{"responses":{"200":' +
      '{"description":"OK","schema":{}}}}}},"definitions":{"User":{"type":"object","properties":{"name":{"type":' +
      '"string"}}}}}');
    });
  });
});
