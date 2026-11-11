const expect = require('chai').expect,
  Converter = require('../../dist/index.js'),
  fs = require('fs'),
  path = require('path'),
  BUNDLES_FOLDER = '../data/toBundleExamples',
  mediaType32 = path.join(__dirname, BUNDLES_FOLDER + '/referenced_media_type_32');


describe('bundle files method - 3.2', function () {
  it('Should return bundled file as json - Media type object', async function () {
    let contentRootFile = fs.readFileSync(mediaType32 + '/root.yaml', 'utf8'),
      pathItem = fs.readFileSync(mediaType32 + '/path.yaml', 'utf8'),
      mediaType = fs.readFileSync(mediaType32 + '/mediaType.yaml', 'utf8'),
      order = fs.readFileSync(mediaType32 + '/order.yaml', 'utf8'),
      expected = fs.readFileSync(mediaType32 + '/expected.json', 'utf8'),
      input = {
        type: 'multiFile',
        specificationVersion: '3.2',
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
            content: pathItem
          },
          {
            path: '/mediaType.yaml',
            content: mediaType
          },
          {
            path: '/order.yaml',
            content: order
          }
        ],
        options: {},
        bundleFormat: 'JSON'
      };
    const res = await Converter.bundle(input),
      bundled = JSON.parse(res.output.data[0].bundledContent);

    expect(res).to.not.be.empty;
    expect(res.result).to.be.true;
    expect(res.output.specification.version).to.equal('3.2');
    expect(bundled.components).to.not.have.property('responses');
    expect(bundled.components).to.not.have.property('requestBodies');
    expect(JSON.stringify(bundled, null, 2)).to.be.equal(expected);
  });
});
