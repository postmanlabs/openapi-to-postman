const expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  pathItem31 = path.join(__dirname, BUNDLES_FOLDER + '/referenced_paths_31'),
  invalidPathRef31 = path.join(__dirname, BUNDLES_FOLDER + '/referenced_invalid_paths_31'),
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

  it('Should return bundled file where path has an invalid $ref', async function () {
    let contentRootFile = fs.readFileSync(invalidPathRef31 + '/invalid_reference_at_path.yaml', 'utf8'),
      expected = fs.readFileSync(invalidPathRef31 + '/expected.json', 'utf8'),
      input = {
        origin: 'browser',
        type: 'multiFile',
        specificationVersion: '3.1',
        options: { includeReferenceMap: true },
        bundleFormat: 'JSON',
        rootFiles: [
          {
            path: 'root.yaml',
            content: contentRootFile
          }
        ],
        data: [
          {
            path: 'root.yaml',
            content: contentRootFile
          }
        ]
      };
    const res = await Converter.bundle(input);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.1');
    expect(JSON.stringify(JSON.parse(res.output.data[0].bundledContent), null, 2)).to.be.equal(expected);
  });
});
