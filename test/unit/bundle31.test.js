const expect = require('chai').expect,
  Converter = require('../../index.js'),
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

  it('Should bundle and convert OpenAPI 3.1 multifile spec with pathItems (type: json)', function (done) {
    let contentRootFile = fs.readFileSync(pathItem31 + '/root.yaml', 'utf8'),
      user = fs.readFileSync(pathItem31 + '/path.yaml', 'utf8'),
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

    // Step 1: Bundle the spec
    Converter.bundle(input).then((bundleRes) => {
      expect(bundleRes).to.not.be.empty;
      expect(bundleRes.result).to.be.true;
      expect(bundleRes.output.specification.version).to.equal('3.1');

      const bundledContent = bundleRes.output.data[0].bundledContent;
      const bundledSpec = JSON.parse(bundledContent);

      // Step 2: Convert the bundled spec with type 'json'
      Converter.convertV2WithTypes(
        { type: 'json', data: bundledSpec },
        { schemaFaker: true, includeWebhooks: true },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.be.true;
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');

          const collection = conversionResult.output[0].data;
          expect(collection).to.have.property('info');
          expect(collection).to.have.property('item');

          // Verify that items are not empty (pathItems should be resolved)
          expect(collection.item.length).to.be.greaterThan(0);

          // Count total requests to ensure pathItems were resolved
          let requestCount = 0;

          /**
           * Recursively count requests in collection items
           * @param {Array} items - Collection items to count
           * @returns {undefined}
           */
          function countRequests(items) {
            items.forEach((item) => {
              if (item.request) { requestCount++; }
              if (item.item) { countRequests(item.item); }
            });
          }
          countRequests(collection.item);

          expect(requestCount).to.be.greaterThan(0);
          done();
        }
      );
    }).catch(done);
  });

  it('Should bundle and convert OpenAPI 3.1 multifile spec with pathItems (type: string)', function (done) {
    let contentRootFile = fs.readFileSync(pathItem31 + '/root.yaml', 'utf8'),
      user = fs.readFileSync(pathItem31 + '/path.yaml', 'utf8'),
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

    // Step 1: Bundle the spec
    Converter.bundle(input).then((bundleRes) => {
      expect(bundleRes).to.not.be.empty;
      expect(bundleRes.result).to.be.true;
      expect(bundleRes.output.specification.version).to.equal('3.1');

      const bundledContentString = bundleRes.output.data[0].bundledContent;

      // Step 2: Convert the bundled spec with type 'string' (no parsing)
      Converter.convertV2WithTypes(
        { type: 'string', data: bundledContentString },
        { schemaFaker: true, includeWebhooks: true },
        (err, conversionResult) => {
          expect(err).to.be.null;
          expect(conversionResult.result).to.be.true;
          expect(conversionResult.output.length).to.equal(1);
          expect(conversionResult.output[0].type).to.equal('collection');

          const collection = conversionResult.output[0].data;
          expect(collection).to.have.property('info');
          expect(collection).to.have.property('item');

          // Verify that items are not empty (pathItems should be resolved)
          expect(collection.item.length).to.be.greaterThan(0);

          // Count total requests to ensure pathItems were resolved
          let requestCount = 0;

          /**
           * Recursively count requests in collection items
           * @param {Array} items - Collection items to count
           * @returns {undefined}
           */
          function countRequests(items) {
            items.forEach((item) => {
              if (item.request) { requestCount++; }
              if (item.item) { countRequests(item.item); }
            });
          }
          countRequests(collection.item);

          expect(requestCount).to.be.greaterThan(0);
          done();
        }
      );
    }).catch(done);
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
