var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  validPetstore = path.join(__dirname, VALID_OPENAPI_PATH + '/petstore.yaml'),
  noauth = path.join(__dirname, VALID_OPENAPI_PATH + '/noauth.yaml');


describe('requestNameSource option', function() {
  it('should return one root 3.0 correctly', async function() {
    let contentFile = fs.readFileSync(validPetstore, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        data: [
          {
            path: '/petstore.yaml',
            content: contentFile
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].path).to.equal('/petstore.yaml');
  });

  it('should return no root file when there is not a root file present', async function() {
    let input = {
      type: 'folder',
      specificationVersion: '3.0',
      data: [
        {
          path: '/petstore.yaml',
          content: 'not root'
        }
      ]
    };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data).to.be.empty;
  });

  it('should return 2 root 3.0 correctly', async function() {
    let petstoreContent = fs.readFileSync(validPetstore, 'utf8'),
      noAuthContent = fs.readFileSync(noauth, 'utf8'),
      input = {
        type: 'folder',
        specificationVersion: '3.0',
        data: [
          {
            path: '/petstore.yaml',
            content: petstoreContent
          },
          {
            path: '/noauth.yaml',
            content: noAuthContent
          }
        ]
      };
    const res = await Converter.detectRootFiles(input);
    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.data[0].path).to.equal('/petstore.yaml');
    expect(res.output.data[1].path).to.equal('/noauth.yaml');
  });

  it('should propagate one error correctly', async function () {
    let input = {
      type: 'folder',
      specificationVersion: '3.0',
      data: [
        {
          path: '',
          content: 'openapi: 3.0.0'
        }
      ]
    };
    try {
      await Converter.detectRootFiles(input);
    }
    catch (ex) {
      expect(ex.message).to.equal('undefined input');
    }
  });

});
