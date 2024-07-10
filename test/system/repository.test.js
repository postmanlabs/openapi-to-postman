/**
 * @fileOverview This test specs runs tests on the package.json file of repository. It has a set of strict tests on the
 * content of the file as well. Any change to package.json must be accompanied by valid test case in this spec-sheet.
 */
var _ = require('lodash'),
  expect = require('expect.js'),
  parseIgnore = require('parse-gitignore');

/* global describe, it */
describe('project repository', function () {
  var fs = require('fs');

  describe('package.json', function () {
    var content,
      json;

    try {
      content = fs.readFileSync('./package.json').toString();
      json = JSON.parse(content);
    }
    catch (e) {
      console.error(e);
      content = '';
      json = {};
    }

    it('must have readable JSON content', function () {
      expect(content).to.be.ok();
      expect(json).to.not.eql({});
    });

    describe('package.json JSON data', function () {
      it('must have valid name, description and author', function () {
        expect(json).to.have.property('name', 'openapi-to-postmanv2');
        expect(json).to.have.property('description',
          'Convert a given OpenAPI specification to Postman Collection v2.0');
        expect(json).to.have.property('author', 'Postman Labs <help@getpostman.com>');
        expect(json).to.have.property('license', 'Apache-2.0');
        expect(json).to.have.property('homepage', 'https://github.com/postmanlabs/openapi-to-postman');
        expect(json).to.have.property('bugs', 'https://github.com/postmanlabs/openapi-to-postman/issues');

        expect(json).to.have.property('repository');
        expect(json.repository).to.eql({
          type: 'git',
          url: 'git://github.com/postmanlabs/openapi-to-postman.git'
        });

        expect(json).to.have.property('keywords');
        expect(json.keywords).to.eql(['openapi', 'postman', 'api', 'schema', 'swagger', 'oas']);

        expect(json).to.have.property('engines');
        expect(json.engines).to.eql({ node: '>=8' });
      });

      it('must have a valid version string in form of <major>.<minor>.<revision>', function () {
        // eslint-disable-next-line max-len
        expect(json.version).to.match(/^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/);
      });
    });

    describe('binary definitions', function () {
      it('must exist', function () {
        expect(json.bin).be.ok();
        expect(json.bin).to.eql({ 'openapi2postmanv2': './bin/openapi2postmanv2.js' });
      });

      it('must have valid node shebang', function () {
        json.bin && Object.keys(json.bin).forEach(function (scriptName) {
          var fileContent = fs.readFileSync(json.bin[scriptName]).toString();
          expect((/^#!\/(bin\/bash|usr\/bin\/env\snode)[\r\n][\W\w]*$/g).test(fileContent)).to.be.ok();
        });
      });
    });

    describe('dependencies', function () {
      it('must exist', function () {
        expect(json.dependencies).to.be.a('object');
      });

      it('should have a valid version string in form of <major>.<minor>.<revision>', function () {
        expect(json.version)
          // eslint-disable-next-line max-len, security/detect-unsafe-regex
          .to.match(/^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/);
      });
    });

    describe('devDependencies', function () {
      it('must exist', function () {
        expect(json.devDependencies).to.be.a('object');
      });

      it('should point to a valid semver', function () {
        Object.keys(json.devDependencies).forEach(function (dependencyName) {
          // eslint-disable-next-line security/detect-non-literal-regexp
          expect(json.devDependencies[dependencyName]).to.match(new RegExp('((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
            '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$'));
        });
      });

      it('should not overlap devDependencies', function () {
        var clean = [];

        json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
          !json.dependencies[item] && clean.push(item);
        });

        expect(Object.keys(json.devDependencies)).to.eql(clean);
      });
    });

    describe('main entry script', function () {
      it('must point to a valid file', function (done) {
        expect(json.main).to.equal('index.js');
        fs.stat(json.main, done);
      });
    });
  });

  describe('README.md', function () {
    it('must exist', function (done) {
      fs.stat('./README.md', done);
    });

    it('must have readable content', function () {
      expect(fs.readFileSync('./README.md').toString()).to.be.ok();
    });
  });

  describe('LICENSE.md', function () {
    it('must exist', function (done) {
      fs.stat('./LICENSE.md', done);
    });

    it('must have readable content', function () {
      expect(fs.readFileSync('./LICENSE.md').toString()).to.be.ok();
    });
  });

  describe('.ignore files', function () {
    var gitignorePath = '.gitignore',
      npmignorePath = '.npmignore',
      npmignore = parseIgnore(npmignorePath),
      gitignore = parseIgnore(gitignorePath);

    describe(gitignorePath, function () {
      it('must exist', function (done) {
        fs.stat(gitignorePath, done);
      });

      it('must have valid content', function () {
        expect(_.isEmpty(gitignore)).to.not.be.ok();
      });
    });

    describe(npmignorePath, function () {
      it('must exist', function (done) {
        fs.stat(npmignorePath, done);
      });

      it('must have valid content', function () {
        expect(_.isEmpty(npmignore)).to.not.be.ok();
      });
    });

    it('.gitignore coverage must be a subset of .npmignore coverage', function () {
      expect(_.intersection(gitignore, npmignore)).to.eql(gitignore);
    });
  });

  describe('.eslintrc', function () {
    it('must exist', function (done) {
      fs.stat('./.eslintrc', done);
    });

    it('must have readable content', function () {
      expect(fs.readFileSync('./.eslintrc').toString()).to.be.ok();
    });
  });
});
