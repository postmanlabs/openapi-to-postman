const expect = require('chai').expect,
  AjvModule = require('ajv'),
  Ajv = AjvModule.default || AjvModule,
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

/**
 * Parse the embedded `responseSchemas` object out of a contract-test event's script.
 *
 * @param {Object} item - a Postman collection request item carrying a contract-test event
 * @returns {Object} the status-code -> JSON Schema map embedded in the script
 */
function embeddedResponseSchemas (item) {
  const exec = getContractTestEvent(item).script.exec.join('\n'),
    line = exec.split('\n').find((l) => { return l.indexOf('var responseSchemas = ') === 0; }),
    json = line.replace('var responseSchemas = ', '').replace(/;$/, '');

  return JSON.parse(json);
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

describe('generateContractTests — embedded schema is JSON-Schema compliant', function () {
  const specWithOASKeywords = {
    openapi: '3.0.0',
    info: { title: 'OAS keywords', version: '1.0.0' },
    paths: {
      '/things': {
        get: {
          summary: 'List things',
          responses: {
            200: {
              description: 'ok',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['id'],
                    discriminator: { propertyName: 'kind' },
                    externalDocs: { url: 'https://example.com' },
                    properties: {
                      // Non-standard OpenAPI format that Ajv 6 would throw on.
                      id: { type: 'integer', format: 'int64' },
                      // Standard format must be preserved.
                      email: { type: 'string', format: 'email' },
                      // OAS 3.0 nullable on a typed field.
                      nick: { type: 'string', nullable: true },
                      // `example` (singular, OAS) stripped; `examples` (plural, JSON Schema) kept.
                      kind: { type: 'string', example: 'a', examples: ['a', 'b'] },
                      // Nullable with no `type` (enum only) -> anyOf wrap.
                      status: { enum: ['on', 'off'], nullable: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  let schema200;

  before(function (done) {
    Converter.convertV2WithTypes(
      { type: 'json', data: specWithOASKeywords },
      { generateContractTests: true },
      (err, result) => {
        expect(err).to.be.null;

        const requestItems = collectRequestItems(result.output[0].data.item);

        schema200 = embeddedResponseSchemas(requestItems[0])['200'];
        done();
      }
    );
  });

  it('should convert nullable:true on a typed field to a JSON Schema type union', function () {
    expect(schema200.properties.nick).to.not.have.property('nullable');
    expect(schema200.properties.nick.type).to.have.members(['string', 'null']);
  });

  it('should wrap a nullable field that has no type in an anyOf with {type:null}', function () {
    expect(schema200.properties.status).to.not.have.property('nullable');
    expect(schema200.properties.status.anyOf).to.be.an('array');

    const permitsNull = schema200.properties.status.anyOf.some((sub) => { return sub.type === 'null'; }),
      keepsEnum = schema200.properties.status.anyOf.some((sub) => { return Array.isArray(sub.enum); });

    expect(permitsNull, 'anyOf permits null').to.be.true;
    expect(keepsEnum, 'anyOf keeps the original enum').to.be.true;
  });

  it('should drop non-standard formats but keep standard ones', function () {
    expect(schema200.properties.id).to.not.have.property('format');
    expect(schema200.properties.email.format).to.equal('email');
  });

  it('should strip OpenAPI-only keywords but keep JSON Schema `examples`', function () {
    expect(schema200).to.not.have.property('discriminator');
    expect(schema200).to.not.have.property('externalDocs');
    expect(schema200.properties.kind).to.not.have.property('example');
    expect(schema200.properties.kind.examples).to.deep.equal(['a', 'b']);
  });

  it('should produce a schema that compiles under Ajv without throwing', function () {
    const ajv = new Ajv({ strict: false, allErrors: true, logger: false });

    expect(function () { return ajv.compile(schema200); }).to.not.throw();
  });
});

describe('generateContractTests — request chaining (x-postman-variables)', function () {
  const specChaining = {
    openapi: '3.0.0',
    info: { title: 'Chaining', version: '1.0.0' },
    paths: {
      '/pets': {
        post: {
          summary: 'Create pet',
          responses: {
            201: {
              description: 'Created',
              headers: { Location: { schema: { type: 'string' } } },
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { id: { type: 'string' } } }
                }
              },
              'x-postman-variables': [
                { type: 'save', name: 'petId', path: '$.id' },
                { type: 'save', name: 'petUrl', from: 'header', header: 'Location' }
              ]
            }
          }
        }
      },
      '/pets/{petId}': {
        get: {
          summary: 'Get pet',
          parameters: [
            {
              name: 'petId', in: 'path', required: true, schema: { type: 'string', example: 'seed-123' },
              'x-postman-variables': { type: 'load', name: 'petId' }
            },
            {
              name: 'expand', in: 'query', schema: { type: 'string', example: 'owner' },
              'x-postman-variables': { type: 'load', name: 'expandVar' }
            },
            {
              name: 'X-Trace', in: 'header', schema: { type: 'string' },
              'x-postman-variables': { type: 'load', name: 'traceVar' }
            }
          ],
          responses: {
            200: {
              description: 'ok',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { id: { type: 'string' } } }
                }
              }
            }
          }
        }
      }
    }
  };

  /**
   * Finds a generated request item by HTTP method.
   *
   * @param {Object} collection - the generated collection (result.output[0].data)
   * @param {String} method - HTTP method (upper-case)
   * @returns {Object} the request item
   */
  function requestByMethod (collection, method) {
    return collectRequestItems(collection.item).find((item) => {
      return item.request.method === method;
    });
  }

  describe('with the option ON', function () {
    let collection;

    before(function (done) {
      Converter.convertV2WithTypes(
        { type: 'json', data: specChaining },
        { generateContractTests: true },
        (err, result) => {
          expect(err).to.be.null;
          expect(result.result).to.be.true;
          collection = result.output[0].data;
          done();
        }
      );
    });

    it('should append a marker-first save-block that captures declared values by status', function () {
      const event = getContractTestEvent(requestByMethod(collection, 'POST'));

      expect(event, 'producer should carry a contract-test event').to.be.an('object');
      // Marker must remain the first line so the sync-carry keeps identifying the event.
      expect(event.script.exec[0].indexOf(CONTRACT_TEST_MARKER)).to.equal(0);

      const exec = event.script.exec.join('\n');

      expect(exec).to.include('var contractSavesByStatus =');
      expect(exec).to.include('pm.collectionVariables.set(binding.name, value)');
      expect(exec).to.include("Saved '\" + binding.name + \"' from response");
      // Saves are keyed by the response status they were declared under.
      expect(exec).to.include('"201"');
      // JSONPath-style `$.id` is normalized to a lodash path; header source is preserved.
      expect(exec).to.include('"path":"id"');
      expect(exec).to.include('"source":"header"');
      expect(exec).to.include('"header":"Location"');
    });

    it('should inject {{var}} into path, query and header params that declare a load binding', function () {
      const getItem = requestByMethod(collection, 'GET'),
        pathVar = (getItem.request.url.variable || []).find((v) => { return v.key === 'petId'; }),
        queryVar = (getItem.request.url.query || []).find((q) => { return q.key === 'expand'; }),
        headerVar = (getItem.request.header || []).find((h) => { return h.key === 'X-Trace'; });

      expect(pathVar.value).to.equal('{{petId}}');
      expect(queryVar.value).to.equal('{{expandVar}}');
      expect(headerVar.value).to.equal('{{traceVar}}');
    });

    it('should seed a collection variable for each loaded variable from the parameter example', function () {
      const vars = collection.variable || [],
        petId = vars.find((v) => { return v.key === 'petId'; }),
        expandVar = vars.find((v) => { return v.key === 'expandVar'; }),
        traceVar = vars.find((v) => { return v.key === 'traceVar'; });

      expect(petId, 'petId seeded').to.be.an('object');
      expect(petId.value).to.equal('seed-123');
      expect(expandVar.value).to.equal('owner');
      // No example on the header param -> seeded empty so the variable still exists.
      expect(traceVar.value).to.equal('');
    });
  });

  describe('with the option OFF (default)', function () {
    let collection;

    before(function (done) {
      Converter.convertV2WithTypes({ type: 'json', data: specChaining }, {}, (err, result) => {
        expect(err).to.be.null;
        collection = result.output[0].data;
        done();
      });
    });

    it('should not add any save-block or contract-test event', function () {
      expect(getContractTestEvent(requestByMethod(collection, 'POST'))).to.be.undefined;
    });

    it('should not template load params and should not seed chaining variables', function () {
      const getItem = requestByMethod(collection, 'GET'),
        pathVar = (getItem.request.url.variable || []).find((v) => { return v.key === 'petId'; }),
        seeded = (collection.variable || []).find((v) => { return v.key === 'petId'; });

      expect(pathVar.value).to.not.equal('{{petId}}');
      expect(seeded).to.be.undefined;
    });
  });
});
