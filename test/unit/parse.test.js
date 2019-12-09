/* eslint-disable no-unused-vars */
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
      result = parse.getRootFiles(array);
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal(folderPath + '/index.yaml');
  });

  it('validateRoot function should return an object with result true', function() {
    let oas = {
        'openapi': '3.0.0',
        'info': {
          'title': 'sample title',
          'version': '1.2.4'
        },
        'paths': {
          '/': {}
        }
      },
      result = parse.validateRoot(oas);
    expect(result.result).to.equal(true);
  });

  it('getOasObject function should return a valid oas object from a yaml file', function() {
    let filePath = path.join(__dirname, '../data/multiFile_with_one_root/index.yaml'),
      file = fs.readFileSync(filePath, 'utf8'),
      result = parse.getOasObject(file);

    expect(result.openapi).to.equal('3.0.0');
  });

  describe('readSpecFile function', function() {
    it('Should return the content from a remote file', function() {
      let file = 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification' +
      '/master/examples/v3.0/api-with-examples.yaml';
      parse.readSpecFile(file).then((result) => {
        expect(result.startsWith('openapi: "3.0.0"')).to.equal(true);
      });
    });
    it('Should return the content from a local file', function() {
      let file = path.join(__dirname, '../data/valid_openapi/petstore.yaml');
      parse.readSpecFile(file).then((result) => {
        expect(result.startsWith('openapi: 3.0.0')).to.equal(true);
      });
    });
  });
});
