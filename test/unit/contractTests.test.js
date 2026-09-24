const expect = require('chai').expect,
  Converter = require('../../dist/index.js'),
  { getOptions } = require('../../lib/options.js'),
  { CONTRACT_TEST_MARKER } = require('../../libV2/CollectionGeneration/contractTests.js');

/**
 * Recursively collect all leaf request items (items that carry a `request`) from a collection.
 *
 * @param {Array} items - collection `item` array
 * @returns {Array} flat list of request items
 */
function collectRequestItems (items) {
  const requests = [];

  (items || []).forEach((item) => {
    if (item.request) {
      requests.push(item);
    }
    else if (item.item) {
      requests.push(...collectRequestItems(item.item));
    }
  });

  return requests;
}

/**
 * Return the contract-test event (listen: 'test') on an item, identified by the marker, if present.
 *
 * @param {Object} item - a Postman collection request item
 * @returns {Object|undefined} the contract-test event
 */
function getContractTestEvent (item) {
  return (item.event || []).find((event) => {
    return event.listen === 'test' && (event.script.exec[0] || '').indexOf(CONTRACT_TEST_MARKER) === 0;
  });
}

const specWithResponses = {
  openapi: '3.0.0',
  info: { title: 'Contract Test Demo', version: '1.0.0' },
  paths: {
    '/pets/{id}': {
      get: {
        summary: 'Get a pet',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'p1' } }],
        responses: {
          200: {
            description: 'A pet',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id', 'name'],
                  properties: { id: { type: 'string' }, name: { type: 'string' } }
                }
              }
            }
          },
          404: { description: 'Not found' }
        }
      }
    }
  }
};

describe('generateContractTests option', function () {
  it('should be exposed as a conversion option via getOptions()', function () {
    const option = getOptions().find((opt) => { return opt.id === 'generateContractTests'; });

    expect(option).to.be.an('object');
    expect(option.type).to.equal('boolean');
    expect(option.default).to.equal(false);
    expect(option.usage).to.include('CONVERSION');
  });

  it('should NOT add a contract-test event when the option is off (default)', function (done) {
    Converter.convertV2WithTypes({ type: 'json', data: specWithResponses }, {}, (err, result) => {
      expect(err).to.be.null;
      expect(result.result).to.be.true;

      const requestItems = collectRequestItems(result.output[0].data.item);

      expect(requestItems).to.have.lengthOf(1);
      expect(getContractTestEvent(requestItems[0])).to.be.undefined;
      done();
    });
  });

  it('should add a marked contract-test event asserting status + schema when the option is on', function (done) {
    Converter.convertV2WithTypes(
      { type: 'json', data: specWithResponses },
      { generateContractTests: true },
      (err, result) => {
        expect(err).to.be.null;
        expect(result.result).to.be.true;

        const requestItems = collectRequestItems(result.output[0].data.item);

        expect(requestItems).to.have.lengthOf(1);

        const event = getContractTestEvent(requestItems[0]);

        expect(event, 'contract-test event should be present').to.be.an('object');

        const exec = event.script.exec.join('\n');

        // Status-code assertion covers both declared codes.
        expect(exec).to.include('var declaredStatusCodes = [200,404]');
        expect(exec).to.include('Status code is declared in the API specification');

        // Response-schema assertion embeds the resolved 200 schema and validates via jsonSchema.
        expect(exec).to.include('pm.response.to.have.jsonSchema');
        expect(exec).to.include('"200"');
        expect(exec).to.include('"required":["id","name"]');

        done();
      }
    );
  });
});
