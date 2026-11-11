const expect = require('chai').expect,
  Converter = require('../../dist/index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  pathItem31 = path.join(__dirname, BUNDLES_FOLDER + '/referenced_paths_31'),
  webhookItem31 = path.join(__dirname, BUNDLES_FOLDER + '/referenced_webhook_31');


describe('bundle files method - 3.1', function () {
  it('Should return bundled file as json - Path item object', async function () {
    let contentRootFile = fs.readFileSync(pathItem31 + '/root.yaml', 'utf8'),
      user = fs.readFileSync(pathItem31 + '/path.yaml', 'utf8'),
      expected = fs.readFileSync(pathItem31 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.1',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/path.yaml',
            content: user
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.1');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });

  it('Should return bundled file as json - webhook object', async function () {
    let contentRootFile = fs.readFileSync(webhookItem31 + '/root.yaml', 'utf8'),
      user = fs.readFileSync(webhookItem31 + '/webhook.yaml', 'utf8'),
      expected = fs.readFileSync(webhookItem31 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.1',
        rootFiles: [
          {
            path: '/root.yaml'
          }
        ],
        data: [
          {
            path: '/root.yaml',
            content: contentRootFile
          },
          {
            path: '/webhook.yaml',
            content: user
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.1');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });
});

describe('bundle files method - 3.1 specification validation error codes', function () {
  it('Should return SPEC_VERSION_MISMATCH for a multi-file 3.0 root when 3.1 is expected', async function () {
    const contentRootFile = fs.readFileSync(pathItem31 + '/root.yaml', 'utf8').replace(/openapi: ['"]?3\.1\.0['"]?/,
        'openapi: 3.0.3'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.1',
        rootFiles: [{ path: '/root.yaml' }],
        data: [
          { path: '/root.yaml', content: contentRootFile },
          { path: '/path.yaml', content: fs.readFileSync(pathItem31 + '/path.yaml', 'utf8') }
        ],
        options: {},
        bundleFormat: 'JSON'
      },
      res = await Converter.bundle(input);

    expect(res.result).to.be.false;
    expect(res.output.data).to.eql([]);
    expect(res.code).to.equal('SPEC_VERSION_MISMATCH');
    expect(res.meta).to.eql({ expected: '3.1', foundKey: 'openapi', found: '3.0.3' });
  });

  it('Should return SPEC_VERSION_MISSING when the root has no "openapi" field', async function () {
    const res = await Converter.bundle({
      type: 'multiFile',
      specificationVersion: '3.1',
      rootFiles: [{ path: '/root.yaml' }],
      data: [{ path: '/root.yaml', content: 'info:\n  title: a\n  version: "1"\npaths: {}\n' }],
      options: {},
      bundleFormat: 'JSON'
    });

    expect(res.result).to.be.false;
    expect(res.code).to.equal('SPEC_VERSION_MISSING');
    expect(res.meta).to.eql({ expected: '3.1' });
  });

  it('Should throw a ParseError with SPEC_EMPTY when the root file only contains "~"', async function () {
    let error;

    try {
      await Converter.bundle({
        type: 'multiFile',
        specificationVersion: '3.1',
        rootFiles: [{ path: '/root.yaml' }],
        data: [{ path: '/root.yaml', content: '~' }],
        options: {},
        bundleFormat: 'JSON'
      });
    }
    catch (err) {
      error = err;
    }

    expect(error.name).to.equal('ParseError');
    expect(error.message).to.equal('Empty input schema provided.');
    expect(error.code).to.equal('SPEC_EMPTY');
  });
});

