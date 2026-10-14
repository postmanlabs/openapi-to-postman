const expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  yaml = require('js-yaml'),
  _ = require('lodash'),
  Converter = require('../../dist/index.js'),

  PETSTORE = yaml.load(fs.readFileSync(path.join(__dirname, '../data/specContractTesting/petstore.yaml'), 'utf8')),

  ok = (description, schema) => {
    return { description, content: { 'application/json': { schema } } };
  },
  idParam = (name) => { return { name, in: 'path', required: true, schema: { type: 'string' } }; },
  wrapped = { type: 'object', properties: { meta: { type: 'object' }, data: { type: 'object',
    properties: { id: { type: 'string' }, type: { type: 'string' } } } } },

  // Nested resources behind a `{ meta, data }` envelope, plus a write whose id can't be linked.
  NESTED = {
    openapi: '3.0.0',
    info: { title: 'Nested', version: '1' },
    paths: {
      '/specifications': { post: { responses: { 201: ok('created', wrapped) } } },
      '/specifications/{id}': {
        parameters: [idParam('id')],
        get: {
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'string' }, example: 'pageLimit' }],
          responses: { 200: ok('ok', wrapped) }
        },
        delete: { responses: { 200: { description: 'deleted' } } }
      },
      '/tasks': {
        get: {
          parameters: [
            { name: 'entityId', in: 'query', schema: { type: 'string' }, example: '{{entityId}}' },
            { name: 'entityType', in: 'query', schema: { type: 'string' }, example: 'specification' },
            { name: 'type', in: 'query', required: true, schema: { type: 'string' }, example: 'collection-generation' }
          ],
          responses: { 200: ok('ok', wrapped) }
        }
      },
      '/tasks/{taskId}': {
        get: {
          parameters: [idParam('taskId')],
          responses: { 200: ok('ok', { type: 'object', properties: { data: { type: 'object',
            properties: { type: { type: 'string' } } } } }) }
        }
      },
      '/specifications/{id}/files': {
        parameters: [idParam('id')],
        post: { responses: { 201: ok('created', wrapped) } }
      },
      '/specifications/{id}/files/{fileId}': {
        parameters: [idParam('id'), idParam('fileId')],
        get: { responses: { 200: ok('ok', wrapped) } },
        delete: { responses: { 200: { description: 'deleted' } } }
      },
      '/specs/{id}/files': {
        parameters: [idParam('id')],
        post: { responses: { 201: ok('created', wrapped) } }
      }
    }
  },

  // What a caller such as postman-cli does: convert, then rearrange for contract testing.
  generate = (spec, options = {}) => {
    return new Promise((resolve, reject) => {
      Converter.convertV2WithTypes({ type: 'json', data: _.cloneDeep(spec) },
        { generateContractTests: true, parametersResolution: 'Example' }, (err, conversion) => {
          return err ? reject(err) : resolve(Converter.buildContractTestCollection(conversion, options));
        });
    });
  },

  requests = (result) => { return result.output[0].data.item; },
  request = (result, name) => { return _.find(requests(result), { name }); },
  exec = (item, listen) => { return _.get(_.find(item.event, { listen }), 'script.exec', []).join('\n'); },
  binding = (result, variable) => { return _.find(result.lock.bindings, { variable }); },

  // Seeded shuffle of path order and of the methods inside each path.
  shuffled = (spec, seed) => {
    let s = seed;
    const next = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s; },
      shuffle = (list) => { return _.sortBy(list, () => { return next(); }); };

    return Object.assign({}, spec, { paths: _.fromPairs(shuffle(_.keys(spec.paths)).map((p) => {
      return [p, _.fromPairs(shuffle(_.toPairs(spec.paths[p])))];
    })) });
  };

describe('buildContractTestCollection', function () {
  it('links each id to the request that creates it', async function () {
    const result = await generate(PETSTORE);

    expect(_.pick(binding(result, 'owner_id'), ['rule', 'status', 'source'])).to.eql({
      rule: 'same-resource-create', status: 'pending', source: 'inferred' });
    expect(binding(result, 'owner_id').producer).to.include({ operation: 'POST /owners', value: '$response.body#/id' });
    expect(_.map(binding(result, 'owner_id').consumers, 'operation')).to.eql(['GET /owners/{ownerId}', 'POST /pets']);
    expect(binding(result, 'pet_id').producer.operation).to.equal('POST /pets');
    expect(result.summary.unresolved).to.be.empty;
  });

  it('lists requests in dependency order, then a children-first teardown and negative checks', async function () {
    const result = await generate(PETSTORE);

    expect(_.map(requests(result), 'name')).to.eql([
      '1. POST /owners', '2. GET /owners/{ownerId}',
      '3. POST /pets', '4. GET /pets', '5. GET /pets/{petId}', '6. PUT /pets/{petId}',
      '7. DELETE /pets/{petId}', '8. GET /pets/{petId} (expect 404)',
      '9. GET /owners/{ownerId} without a token', '10. GET /pets without a token',
      '11. GET /pets/{petId} without a token', '12. POST /owners without "name"',
      '13. POST /pets without "name"', '14. POST /pets without "ownerId"'
    ]);
  });

  it('wires saved values into later requests and guards against missing ones', async function () {
    const result = await generate(PETSTORE),
      createPet = request(result, '3. POST /pets'),
      getPet = request(result, '5. GET /pets/{petId}'),
      gone = request(result, '8. GET /pets/{petId} (expect 404)');

    expect(JSON.parse(createPet.request.body.raw).ownerId).to.equal('{{owner_id}}');
    expect(exec(createPet, 'test')).to.include('"variable":"pet_id"').and.include('@postman-contract-test');
    expect(_.find(getPet.request.url.variable, { key: 'petId' }).value).to.equal('{{pet_id}}');
    expect(exec(getPet, 'prerequest')).to.include('["pet_id"]').and.include('pm.execution.skipRequest()');
    expect(_.find(gone.request.url.variable, { key: 'petId' }).value).to.equal('{{deleted_pet_id}}');
    expect(exec(gone, 'test')).to.include('pm.response.to.have.status(404)');
  });

  it('unwraps { meta, data } envelopes, resolves parent ids and skips unlinked writes', async function () {
    const result = await generate(NESTED),
      names = _.map(requests(result), 'name');

    expect(binding(result, 'specification_id').producer.value).to.equal('$response.body#/data/id');
    expect(_.map(binding(result, 'file_id').consumers, 'param')).to.deep.include({ in: 'path', name: 'fileId' });
    expect(names.slice(-4)).to.eql([
      '7. DELETE /specifications/{id}/files/{fileId}', '8. GET /specifications/{id}/files/{fileId} (expect 404)',
      '9. DELETE /specifications/{id}', '10. GET /specifications/{id} (expect 404)'
    ]);
    expect(result.summary.skipped).to.eql(['POST /specs/{id}/files']);
  });

  it('does not send optional parameters unless a binding fills them', async function () {
    const result = await generate(NESTED),
      query = (name, key) => { return _.find(_.find(requests(result), { name }).request.url.query, { key }); };

    expect(query('2. GET /specifications/{id}', 'limit')).to.include({ value: 'pageLimit', disabled: true });
    expect(query('5. GET /tasks', 'entityId')).to.include({ value: '{{specification_id}}', disabled: false });
    expect(query('5. GET /tasks', 'entityType')).to.include({ value: 'specification', disabled: false });
  });

  it('links <x>Id to the resource named by its <x>Type sibling', async function () {
    const result = await generate(NESTED),
      entity = _.find(binding(result, 'specification_id').consumers, { operation: 'GET /tasks' });

    expect(entity.param).to.eql({ in: 'query', name: 'entityId' });
    expect(binding(result, 'specification_id').rule).to.equal('same-resource-create');
    expect(_.map(requests(result), 'name')).to.include('5. GET /tasks');
  });

  it('never links by a non-identifier name or from a request that needs the consumer\'s resource', async function () {
    const result = await generate(NESTED);

    // GET /tasks needs `type`. POST /specifications returns an unrelated `type`, and GET /tasks/{taskId}
    // returns one but needs a task id first; neither may be linked.
    expect(binding(result, 'type')).to.be.undefined;
    expect(result.summary.unresolved).to.deep.include({ operation: 'GET /tasks', param: { in: 'query', name: 'type' },
      reason: 'no response returns a matching value', fallback: 'example' });
  });

  it('gives the same run order however the spec is laid out', async function () {
    const names = (result) => { return _.map(requests(result), 'name'); },
      expected = names(await generate(PETSTORE));

    for (const seed of [1, 2, 3, 4, 5]) {
      expect(names(await generate(shuffled(PETSTORE, seed)))).to.eql(expected);
    }
  });

  // Values the spec gives no example for are generated by the converter and can vary between runs.
  it('produces identical output for the same spec when it has examples', async function () {
    const [a, b] = await Promise.all([generate(PETSTORE), generate(PETSTORE)]);

    expect(JSON.stringify(a.output)).to.equal(JSON.stringify(b.output));
  });

  it('reuses a saved lock, extends it with new consumers and marks broken links stale', async function () {
    const lock = (await generate(PETSTORE)).lock,
      withPhotos = _.set(_.cloneDeep(PETSTORE), ['paths', '/pets/{petId}/photos'], { get: {
        parameters: [idParam('petId')], responses: { 200: { description: 'ok' } } } }),
      reused = await generate(withPhotos, { lock }),
      withoutOwners = await generate(_.omit(PETSTORE, ['paths./owners']), { lock });

    expect(reused.summary).to.include({ unchanged: 2 });
    expect(reused.summary.added).to.be.empty;
    expect(reused.summary.extended).to.have.length(1);
    expect(reused.summary.extended[0].variable).to.equal('pet_id');
    expect(_.map(withoutOwners.summary.stale, 'staleReason')).to.eql(['producer POST /owners no longer exists']);
  });

  it('excludes operations and adds header auth when asked', async function () {
    const result = await generate(PETSTORE, { excludeOperations: ['^GET /pets$'], authHeader: 'x-access-token' }),
      auth = _.fromPairs(_.map(result.output[0].data.auth.apikey, (e) => { return [e.key, e.value]; }));

    expect(result.summary.excluded).to.equal(1);
    expect(_.map(requests(result), 'name').join()).to.not.include('GET /pets,');
    expect(auth).to.eql({ key: 'x-access-token', value: '{{xAccessToken}}', in: 'header' });
  });

  it('rejects input that is not a convertV2WithTypes result', function () {
    expect(Converter.buildContractTestCollection({ result: false, reason: 'Invalid format' }))
      .to.include({ result: false });
    expect(Converter.buildContractTestCollection(undefined)).to.include({ result: false });
  });
});
