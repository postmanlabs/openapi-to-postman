const expect = require('chai').expect,
  _ = require('lodash'),
  Converter = require('../../dist/index.js'),
  {
    getPathItemOperations,
    resolveTagParentChain,
    formatServerSentEvent,
    getDefaultMappingRedirect,
    isOpenApi32
  } = require('../../lib/common/oas32Utils.js'),
  OK_RESPONSES = { '200': { description: 'ok' } },
  CONVERTERS = [['v1', 'convert'], ['v2', 'convertV2']];

/**
 * Converts the spec with given converter and returns the generated collection
 *
 * @param {String} converterFn - convert / convertV2
 * @param {Object} spec - OpenAPI spec
 * @param {Object} options - conversion options
 * @returns {Promise<Object>} collection JSON
 */
function convert (converterFn, spec, options = {}) {
  return new Promise((resolve, reject) => {
    Converter[converterFn]({ type: 'json', data: spec }, options, (err, result) => {
      if (err) { return reject(err); }
      if (!result.result) { return reject(new Error(result.reason)); }

      resolve(result.output[0].data);
    });
  });
}

/**
 * Lists all requests of a collection as `folder/path/[METHOD]` strings
 *
 * @param {Array} items - collection items
 * @param {String} prefix - folder path prefix
 * @returns {Array<String>} request descriptors
 */
function listRequests (items, prefix = '') {
  return _.flatMap(items, (item) => {
    return item.item ? listRequests(item.item, prefix + item.name + '/') : [`${prefix}[${item.request.method}]`];
  });
}

/**
 * Lists all requests of a collection
 *
 * @param {Array} items - collection items
 * @returns {Array<Object>} request items
 */
function flattenItems (items) {
  return _.flatMap(items, (item) => { return item.item ? flattenItems(item.item) : [item]; });
}

/**
 * Generates a minimal OAS 3.2 spec
 *
 * @param {Object} props - properties to be added to spec
 * @returns {Object} spec
 */
function spec32 (props) {
  return Object.assign({ openapi: '3.2.0', info: { title: 'OAS 3.2', version: '1.0.0' } }, props);
}

describe('OAS 3.2 helpers', function () {
  it('isOpenApi32 should only match 3.2.x versions', function () {
    expect(isOpenApi32({ openapi: '3.2.0' })).to.be.true;
    expect(isOpenApi32('3.2')).to.be.true;
    expect(isOpenApi32({ openapi: '3.1.0' })).to.be.false;
    expect(isOpenApi32({ openapi: '3.20.0' })).to.be.false;
    expect(isOpenApi32({})).to.be.false;
  });

  it('getPathItemOperations should list additionalOperations without mutating the path item', function () {
    const pathItem = {
        parameters: [],
        get: { responses: OK_RESPONSES },
        additionalOperations: {
          Parameters: { responses: OK_RESPONSES },
          Purge: { responses: OK_RESPONSES },
          PURGE: { responses: OK_RESPONSES },
          GET: { responses: OK_RESPONSES }
        }
      },
      snapshot = _.cloneDeep(pathItem),
      operations = getPathItemOperations(pathItem, ['get'], true);

    expect(operations.map(({ method, requestMethod }) => { return [method, requestMethod]; })).to.eql([
      ['get', undefined],
      ['Parameters', 'Parameters'],
      ['Purge', 'Purge'],
      ['PURGE', 'PURGE']
    ]);
    expect(pathItem).to.eql(snapshot);
    expect(getPathItemOperations(pathItem, ['get'], false).map(({ method }) => { return method; })).to.eql(['get']);
  });

  it('resolveTagParentChain should fall back to flat layout for cycles', function () {
    const parents = { A: 'B', B: 'A', C: 'A', D: 'E', E: 'F' },
      getParent = (tag) => { return parents[tag]; };

    expect(resolveTagParentChain('A', getParent)).to.eql(['A']);
    expect(resolveTagParentChain('C', getParent)).to.eql(['C']);
    expect(resolveTagParentChain('D', getParent)).to.eql(['F', 'E', 'D']);
  });

  it('formatServerSentEvent should never produce an empty event', function () {
    expect(formatServerSentEvent({ message: 'hi' })).to.equal('data: {"message":"hi"}\n\n');
    expect(formatServerSentEvent({ event: 'update', message: 'hi' }))
      .to.equal('event: update\ndata: {"message":"hi"}\n\n');
    expect(formatServerSentEvent({ event: 'ping', retry: 10 })).to.equal('event: ping\nretry: 10\n\n');
    expect(formatServerSentEvent({})).to.equal('data: {}\n\n');
    expect(formatServerSentEvent([1, 2])).to.equal('data: [1,2]\n\n');
    expect(formatServerSentEvent({ id: 7, data: 'a\nb' })).to.equal('id: 7\ndata: a\ndata: b\n\n');
  });

  it('getDefaultMappingRedirect should skip refs that are already being resolved', function () {
    const schema = { oneOf: [{ $ref: '#/components/schemas/A' }], discriminator: { defaultMapping: 'Other' } };

    expect(getDefaultMappingRedirect(schema, true, {})).to.equal('#/components/schemas/Other');
    expect(getDefaultMappingRedirect(schema, true, { '#/components/schemas/Other': true })).to.be.null;
    expect(getDefaultMappingRedirect(schema, false, {})).to.be.null;
    expect(getDefaultMappingRedirect({ discriminator: { defaultMapping: 'Other' } }, true, {})).to.be.null;
  });
});

describe('OAS 3.2 conversion', function () {
  CONVERTERS.forEach(([version, converterFn]) => {
    describe(version, function () {
      it('should not treat additionalOperations named like Path Item fields as fixed fields', async function () {
        const spec = spec32({
            paths: {
              '/a': {
                parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
                get: { responses: OK_RESPONSES },
                additionalOperations: {
                  Parameters: { responses: OK_RESPONSES },
                  Servers: { responses: OK_RESPONSES }
                }
              }
            }
          }),
          collection = await convert(converterFn, spec),
          requests = flattenItems(collection.item);

        expect(requests.map((item) => { return item.request.method; }))
          .to.have.members(['GET', 'Parameters', 'Servers']);
        // custom operations still inherit path level parameters
        requests.forEach((item) => {
          expect(_.map(item.request.url.query, 'key')).to.eql(['q']);
        });
      });

      it('should keep case variants of custom methods as separate requests', async function () {
        const spec = spec32({
            paths: {
              '/a': {
                additionalOperations: {
                  Purge: { summary: 'mixed case', responses: OK_RESPONSES },
                  PURGE: { summary: 'upper case', responses: OK_RESPONSES }
                }
              }
            }
          }),
          requests = flattenItems((await convert(converterFn, spec)).item);

        expect(requests.map((item) => { return [item.request.method, item.name]; })).to.have.deep.members([
          ['Purge', 'mixed case'],
          ['PURGE', 'upper case']
        ]);
      });

      it('should not modify the input spec', async function () {
        const spec = spec32({
          paths: { '/a': { additionalOperations: { PURGE: { responses: OK_RESPONSES } } } }
        });

        await convert(converterFn, spec);
        expect(_.keys(spec.paths['/a'])).to.eql(['additionalOperations']);
        expect(spec.paths['/a'].additionalOperations.PURGE).to.not.have.property('__postmanMethod');
      });

      it('should frame itemSchema without SSE fields as a data event', async function () {
        const spec = spec32({
            paths: {
              '/a': {
                get: {
                  responses: {
                    '200': {
                      description: 'ok',
                      content: {
                        'text/event-stream': {
                          itemSchema: {
                            type: 'object',
                            properties: { message: { type: 'string', example: 'hi' } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }),
          [request] = flattenItems((await convert(converterFn, spec, { parametersResolution: 'Example' })).item);

        expect(request.response[0].body).to.equal('data: {"message":"hi"}\n\n');
      });

      it('should place tags with cyclic parents at the root', async function () {
        const spec = spec32({
            tags: [{ name: 'A', parent: 'B' }, { name: 'B', parent: 'A' }],
            paths: {
              '/a': { get: { tags: ['A'], responses: OK_RESPONSES } },
              '/b': { get: { tags: ['B'], responses: OK_RESPONSES } }
            }
          }),
          collection = await convert(converterFn, spec, { folderStrategy: 'Tags' });

        expect(listRequests(collection.item)).to.have.members(['A/[GET]', 'B/[GET]']);
      });

      it('should not merge a nested tag chain with a tag whose name contains separators', async function () {
        const spec = spec32({
            tags: [{ name: 'a:b' }, { name: 'a::b' }, { name: 'a' }, { name: 'b', parent: 'a' }],
            paths: {
              '/x': { get: { tags: ['a:b'], responses: OK_RESPONSES } },
              '/y': { get: { tags: ['b'], responses: OK_RESPONSES } },
              '/z': { get: { tags: ['a::b'], responses: OK_RESPONSES } }
            }
          }),
          collection = await convert(converterFn, spec, { folderStrategy: 'Tags' });

        expect(listRequests(collection.item)).to.have.members(['a:b/[GET]', 'a::b/[GET]', 'a/b/[GET]']);
      });

      it('should use response summary as example name only for OAS 3.2', async function () {
        const paths = {
            '/a': { get: { responses: { '200': { summary: 'Short', description: 'Long desc' } } } }
          },
          [request32] = flattenItems((await convert(converterFn, spec32({ paths: _.cloneDeep(paths) }))).item),
          [request31] = flattenItems((await convert(converterFn, {
            openapi: '3.1.0', info: { title: 'OAS 3.1', version: '1.0.0' }, paths: _.cloneDeep(paths)
          })).item);

        expect(request32.response[0].name).to.equal('Short');
        expect(request31.response[0].name).to.equal('Long desc');
      });

      it('should only convert operations of 3.1 webhooks', async function () {
        const spec = {
            openapi: '3.1.0',
            info: { title: 'OAS 3.1', version: '1.0.0' },
            paths: {},
            webhooks: {
              newPet: {
                summary: 'New pet',
                description: 'Sent when a pet is added',
                post: { responses: OK_RESPONSES }
              }
            }
          },
          requests = flattenItems((await convert(converterFn, spec, { includeWebhooks: true })).item);

        expect(requests.map((item) => { return item.request.method; })).to.eql(['POST']);
      });

      it('should mark querystring rows required only from the schema required list', async function () {
        const getSpec = (schemaRequired) => {
            return spec32({
              paths: {
                '/search': {
                  get: {
                    parameters: [{
                      name: 'q',
                      in: 'querystring',
                      // only means the query string has to be present
                      required: true,
                      content: {
                        'application/x-www-form-urlencoded': {
                          schema: Object.assign({
                            type: 'object',
                            properties: {
                              term: { type: 'string', description: 'search term' },
                              page: { type: 'integer', description: 'page number' }
                            }
                          }, schemaRequired ? { required: schemaRequired } : {})
                        }
                      }
                    }],
                    responses: OK_RESPONSES
                  }
                }
              }
            });
          },
          getDescriptions = async (spec) => {
            const [request] = flattenItems((await convert(converterFn, spec)).item);

            return _.map(request.request.url.query, (queryParam) => {
              return _.get(queryParam, 'description.content', queryParam.description);
            });
          };

        expect(await getDescriptions(getSpec())).to.eql(['search term', 'page number']);
        expect(await getDescriptions(getSpec(['term']))).to.eql(['(Required) search term', 'page number']);
      });
    });
  });

  it('v2 should pair querystring examples defined on the parameter with response examples', async function () {
    const examples = { cats: { value: { term: 'cats' } }, dogs: { value: { term: 'dogs' } } },
      getSpec = (examplesOnParameter) => {
        const mediaType = { schema: { type: 'object', properties: { term: { type: 'string' } } } },
          param = { name: 'q', in: 'querystring', content: { 'application/x-www-form-urlencoded': mediaType } };

        examplesOnParameter ? (param.examples = examples) : (mediaType.examples = examples);

        return spec32({
          paths: {
            '/search': {
              get: {
                parameters: [param],
                responses: {
                  '200': {
                    description: 'ok',
                    content: {
                      'application/json': {
                        schema: { type: 'object' },
                        examples: { cats: { value: { pet: 'cat' } }, dogs: { value: { pet: 'dog' } } }
                      }
                    }
                  }
                }
              }
            }
          }
        });
      },
      getExampleQueries = async (spec) => {
        const [request] = flattenItems((await convert('convertV2', spec, { parametersResolution: 'Example' })).item);

        return request.response.map((response) => {
          return response.originalRequest.url.query.map(({ key, value }) => { return `${key}=${value}`; }).join('&');
        });
      };

    expect(await getExampleQueries(getSpec(false))).to.eql(['term=cats', 'term=dogs']);
    expect(await getExampleQueries(getSpec(true))).to.eql(['term=cats', 'term=dogs']);
  });
});
