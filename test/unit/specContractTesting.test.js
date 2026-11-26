const expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  yaml = require('js-yaml'),
  _ = require('lodash'),
  Converter = require('../../dist/index.js'),
  scripts = require('../../libV2/SpecContractTesting/scripts'),

  FIXTURE_DIR = path.join(__dirname, '../data/specContractTesting'),
  fixture = (name) => { return yaml.load(fs.readFileSync(path.join(FIXTURE_DIR, `${name}.yaml`), 'utf8')); },
  PETSTORE = fixture('petstore'),
  NESTED = fixture('nested'),
  PATTERNS = fixture('patterns'),
  SWAGGER2 = fixture('swagger2'),
  FIXTURES = fs.readdirSync(FIXTURE_DIR).filter((file) => { return file.endsWith('.yaml'); }).sort()
    .map((file) => { return [file, fixture(path.basename(file, '.yaml'))]; }),

  idParam = (name) => { return { name, in: 'path', required: true, schema: { type: 'string' } }; },

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
  link = (result, variable) => { return _.find(result.summary.links, { variable }); },
  inputNames = (result) => { return _.map(result.summary.inputs, 'variable'); },
  labels = (result) => { return _.map(requests(result), (item) => { return item.name.replace(/^\d+\. /, ''); }); },
  created = (properties) => {
    return { 201: { description: 'ok', content: { 'application/json': {
      schema: { type: 'object', properties: _.mapValues(properties, () => { return { type: 'string' }; }) } } } } };
  },

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

    expect(link(result, 'ownerId').producer).to.eql({ operation: 'POST /owners', value: '$response.body#/id' });
    expect(link(result, 'ownerId').consumers).to.eql([
      { operation: 'GET /owners/{ownerId}', param: { in: 'path', name: 'ownerId' } },
      { operation: 'POST /pets', param: { in: 'body', path: '/ownerId' } }
    ]);
    expect(link(result, 'petId').producer.operation).to.equal('POST /pets');
    expect(_.pick(result.summary, ['inputs', 'errors', 'excluded'])).to.eql({ inputs: [], errors: [], excluded: [] });
  });

  it('orders requests, then no-token checks, missing-key checks and a children-first teardown', async function () {
    const result = await generate(PETSTORE);

    expect(_.map(requests(result), 'name')).to.eql([
      '1. POST /owners', '2. GET /owners/{ownerId}',
      '3. POST /pets', '4. GET /pets', '5. GET /pets/{petId}', '6. PUT /pets/{petId}',
      '7. GET /owners/{ownerId} without a token', '8. GET /pets without a token',
      '9. GET /pets/{petId} without a token',
      '10. POST /owners without body "name"',
      '11. POST /pets without body "name"', '12. DELETE /pets/{petId} (clean up if created)',
      '13. POST /pets without body "ownerId"', '14. DELETE /pets/{petId} (clean up if created)',
      '15. DELETE /pets/{petId}', '16. GET /pets/{petId} (expect 404)'
    ]);
  });

  it('wires saved values into later requests and guards against missing ones', async function () {
    const result = await generate(PETSTORE),
      createPet = request(result, '3. POST /pets'),
      getPet = request(result, '5. GET /pets/{petId}'),
      gone = request(result, '16. GET /pets/{petId} (expect 404)'),
      noToken = request(result, '9. GET /pets/{petId} without a token');

    expect(JSON.parse(createPet.request.body.raw).ownerId).to.equal('{{ownerId}}');
    expect(exec(createPet, 'test')).to.include('"variable":"petId"').and.include('@postman-contract-test')
      .and.include('Request | Succeeds (2xx)');
    expect(_.find(getPet.request.url.variable, { key: 'petId' }).value).to.equal('{{petId}}');
    expect(exec(getPet, 'prerequest')).to.include('{"petId":"the request that saves it did not succeed"}')
      .and.include('pm.execution.skipRequest()');
    expect(_.find(gone.request.url.variable, { key: 'petId' }).value).to.equal('{{deleted_petId}}');
    expect(exec(gone, 'test')).to.include('.to.equal(404)').and.not.include('Succeeds (2xx)');
    expect(noToken.request.auth).to.eql({ type: 'noauth' });
    expect(_.find(noToken.request.url.variable, { key: 'petId' }).value).to.equal('{{petId}}');
  });

  it('never fills a value from a request that needs it, directly or through the values it needs', async function () {
    const result = await generate(PETSTORE);

    // GET /pets/{petId} and PUT /pets/{petId} return `ownerId` too, but need `petId`, which needs `ownerId`.
    expect(link(result, 'ownerId').producer.operation).to.equal('POST /owners');
  });

  it('unwraps { meta, data } envelopes and names a bare {id} after its resource', async function () {
    const result = await generate(NESTED);

    expect(link(result, 'specificationId').producer).to.eql({ operation: 'POST /specifications',
      value: '$response.body#/data/id' });
    expect(link(result, 'specificationId').consumers).to.deep.include({ operation: 'GET /specifications/{id}',
      param: { in: 'path', name: 'id' } });
    expect(link(result, 'fileId').producer.operation).to.equal('POST /specifications/{id}/files');
    expect(_.map(requests(result), 'name').slice(-4)).to.eql([
      '9. DELETE /specifications/{id}/files/{fileId}', '10. GET /specifications/{id}/files/{fileId} (expect 404)',
      '11. DELETE /specifications/{id}', '12. GET /specifications/{id} (expect 404)'
    ]);
  });

  it('lists a value no response returns as an input, guarded with how to set it', async function () {
    const result = await generate(NESTED),
      task = request(result, '7. GET /tasks/{taskId}');

    // `/specs/{id}` is a `spec`, which nothing creates; no response returns a `taskId`.
    expect(result.summary.inputs).to.eql([
      { variable: 'specId', consumers: [{ operation: 'POST /specs/{id}/files', param: { in: 'path', name: 'id' } }] },
      { variable: 'taskId', consumers: [{ operation: 'GET /tasks/{taskId}', param: { in: 'path', name: 'taskId' } }] }
    ]);
    // Not a collection variable: the caller supplies it, e.g. from the environment.
    expect(_.map(result.output[0].data.variable, 'key')).to.not.include.members(['specId', 'taskId']);
    expect(_.find(task.request.url.variable, { key: 'taskId' }).value).to.equal('{{taskId}}');
    expect(exec(task, 'prerequest'))
      .to.include('{"taskId":"no request returns it: set it in the environment"}');
    expect(result.summary.errors).to.be.empty;
  });

  it('links by the same name before the create id, and only identifier-like names', async function () {
    const result = await generate({ openapi: '3.0.0', info: { title: 'Names', version: '1' }, paths: {
      '/imports': { post: { responses: created({ id: 'string', taskId: 'string', type: 'string' }) } },
      '/tasks': { post: { responses: created({ id: 'string' }) } },
      '/tasks/{taskId}': { get: { parameters: [idParam('taskId'),
        { name: 'type', in: 'query', required: true, schema: { type: 'string' }, example: 'import' }],
      responses: { 200: { description: 'ok' } } } }
    } });

    expect(link(result, 'taskId').producer).to.eql({ operation: 'POST /imports', value: '$response.body#/taskId' });
    // `type` is not an identifier: it keeps the spec's example instead of POST /imports' `type`.
    expect(_.map(result.summary.links, 'variable')).to.eql(['taskId']);
    expect(_.find(request(result, '3. GET /tasks/{taskId}').request.url.query, { key: 'type' }).value)
      .to.equal('import');
  });

  it('deletes a resource that a missing-key check wrongly creates', async function () {
    const result = await generate(PETSTORE),
      check = request(result, '11. POST /pets without body "name"'),
      cleanup = request(result, '12. DELETE /pets/{petId} (clean up if created)');

    expect(exec(check, 'test')).to.include('pm.collectionVariables.set("leaked_petId", created)')
      .and.include('get(pm.response.json(), "id")');
    expect(_.find(cleanup.request.url.variable, { key: 'petId' }).value).to.equal('{{leaked_petId}}');
    expect(exec(cleanup, 'prerequest')).to.include('{"leaked_petId":"nothing was created"}');
    expect(exec(cleanup, 'test')).to.equal('pm.collectionVariables.unset("leaked_petId");');
  });

  it('leaves out each required query, header and body key once, on every method but DELETE', async function () {
    const json = (schema, example) => { return { content: { 'application/json': { schema, example } } }; },
      str = { type: 'string' },
      result = await generate({ openapi: '3.0.0', info: { title: 'Keys', version: '1' }, paths: {
        '/things': {
          post: { responses: created({ id: 'string' }), parameters: [
            { name: 'containerId', in: 'query', required: true, schema: str, example: 'ws-1' },
            { name: 'limit', in: 'query', schema: { type: 'integer' }, example: 5 },
            { name: 'x-socket-id', in: 'header', required: true, schema: str, example: 's-1' },
            { name: 'X-Api-Key', in: 'header', required: true, schema: str, example: 'k' }],
          requestBody: json({ type: 'object', required: ['name', 'missing'], properties: { name: str, missing: str,
            count: { type: 'integer' },
            owner: { type: 'object', required: ['accountId'], properties: { accountId: str } },
            vet: { type: 'object', required: ['vetId'], properties: { vetId: str } },
            tags: { type: 'array', items: { type: 'object', required: ['label'], properties: { label: str } } } } },
          { name: 'Rex', count: 2, owner: { accountId: 'a-1' }, tags: [{ label: 'x' }] }) }
        },
        '/things/{thingId}': {
          get: { parameters: [idParam('thingId')], responses: { 200: { description: 'ok' } } },
          delete: { parameters: [idParam('thingId'),
            { name: 'reason', in: 'query', required: true, schema: str, example: 'test' }],
          responses: { 204: { description: 'ok' } } }
        }
      } }, { headers: [{ name: 'X-Api-Key', value: 'secret' }] }),
      checks = _.map(requests(result), 'name').filter((name) => { return name.includes(' without '); }),
      sent = (name) => {
        const item = request(result, name);

        return { query: _.map(_.reject(item.request.url.query, 'disabled'), 'key'),
          header: _.map(_.reject(item.request.header, 'disabled'), 'key'), body: JSON.parse(item.request.body.raw) };
      };

    // Path parameters can't be left out; the caller's -H header and a DELETE's query get no check; neither do a
    // field the example doesn't send (`missing`), an object it doesn't have (`vet`), or keys inside arrays.
    expect(checks.filter((name) => { return !name.endsWith('without a token'); })).to.eql([
      '4. POST /things without query "containerId"', '6. POST /things without header "x-socket-id"',
      '8. POST /things without body "name"', '10. POST /things without body "owner.accountId"'
    ]);
    expect(sent('4. POST /things without query "containerId"').query).to.eql([]);
    expect(sent('6. POST /things without header "x-socket-id"').header).to.not.include('x-socket-id');
    expect(sent('8. POST /things without body "name"').body).to.eql({ count: 2, owner: { accountId: '{{accountId}}' },
      tags: [{ label: 'x' }] });
    expect(sent('10. POST /things without body "owner.accountId"').body.owner).to.eql({});
    expect(exec(request(result, '4. POST /things without query "containerId"'), 'test'))
      .to.include('Rejects a request without query \\"containerId\\" (4xx)');
    // Each is followed by a cleanup, in case the create wrongly succeeds.
    expect(_.map(requests(result), 'name')).to.include('5. DELETE /things/{thingId} (clean up if created)');
  });

  it('leaves out a linked key and keeps the rest of the body intact around unquoted placeholders', async function () {
    const json = (schema, example) => { return { content: { 'application/json': { schema, example } } }; },
      result = await generate({ openapi: '3.0.0', info: { title: 'Linked', version: '1' }, paths: {
        '/owners': { post: { responses: { 201: { description: 'ok', content: { 'application/json': {
          schema: { type: 'object', properties: { id: { type: 'integer' } } } } } } } } },
        '/pets': { post: { responses: created({}), requestBody: json({ type: 'object', required: ['name', 'ownerId'],
          properties: { name: { type: 'string' }, ownerId: { type: 'integer' } } }, { name: 'Rex', ownerId: 1 }) } },
        '/search': { get: { responses: { 200: { description: 'ok' } }, parameters: [
          { name: 'ownerId', in: 'query', required: true, schema: { type: 'integer' }, example: 1 }] } }
      } }),
      byLabel = (suffix) => { return _.find(requests(result), (item) => { return item.name.endsWith(suffix); }); },
      withoutName = byLabel('POST /pets without body "name"'),
      withoutOwner = byLabel('POST /pets without body "ownerId"'),
      search = byLabel('GET /search without query "ownerId"');

    // The other field stays linked, written unquoted for an integer.
    expect(withoutName.request.body.raw).to.equal('{\n  "ownerId": {{ownerId}}\n}');
    expect(exec(withoutName, 'prerequest')).to.include('"ownerId"');
    // The left-out key isn't wired, so the request doesn't wait for it.
    expect(JSON.parse(withoutOwner.request.body.raw)).to.eql({ name: 'Rex' });
    expect(exec(withoutOwner, 'prerequest')).to.equal('');
    expect(_.find(search.request.url.query, { key: 'ownerId' }).disabled).to.equal(true);
  });

  it('keeps the <x>Type sibling left out when its <x>Id is wired', async function () {
    const str = { type: 'string' },
      result = await generate({ openapi: '3.0.0', info: { title: 'Siblings', version: '1' }, paths: {
        '/specs': { get: { responses: { 200: { description: 'ok' } }, parameters: [
          { name: 'containerId', in: 'query', required: true, schema: str, example: 'ws-1' },
          { name: 'containerType', in: 'query', required: true, schema: str, example: 'workspace' }] } }
      } }),
      sent = (name) => {
        return _.map(_.reject(request(result, name).request.url.query, 'disabled'), 'key');
      };

    expect(sent('2. GET /specs without query "containerId"')).to.eql(['containerType']);
    expect(sent('3. GET /specs without query "containerType"')).to.eql(['containerId']);
  });

  it('fills an id field at any depth of a body, in every array item, where the example has it', async function () {
    const json = (schema, example) => { return { content: { 'application/json': { schema, example } } }; },
      object = (properties) => { return { type: 'object', properties }; },
      str = { type: 'string' },
      result = await generate({ openapi: '3.0.0', info: { title: 'Nested', version: '1' }, paths: {
        '/owners': { post: { responses: created({ id: 'string' }) } },
        '/links': { put: { responses: { 200: { description: 'ok' } }, requestBody: json(
          { type: 'array', items: object({ ownerId: str, id: str }) },
          [{ ownerId: 'a', id: 'x' }, { ownerId: 'b' }]) } },
        '/pets': { post: { responses: created({}), requestBody: json(
          object({ name: str, owner: object({ ownerId: str }), vet: object({ ownerId: str }) }),
          { name: 'Rex', owner: { ownerId: 'a' } }) } }
      } }),
      body = (name) => { return JSON.parse(request(result, name).request.body.raw); };

    expect(link(result, 'ownerId').consumers).to.deep.include.members([
      { operation: 'PUT /links', param: { in: 'body', path: '/*/ownerId' } },
      { operation: 'POST /pets', param: { in: 'body', path: '/owner/ownerId' } },
      { operation: 'POST /pets', param: { in: 'body', path: '/vet/ownerId' } }
    ]);
    // Every item gets the value; a nested bare `id` says nothing about what it identifies, so it stays.
    expect(body('2. PUT /links')).to.eql([{ ownerId: '{{ownerId}}', id: 'x' }, { ownerId: '{{ownerId}}' }]);
    // The example has no `vet`, so nothing is added there.
    expect(body('3. POST /pets')).to.eql({ name: 'Rex', owner: { ownerId: '{{ownerId}}' } });
    expect(result.summary.errors).to.be.empty;
  });

  it('reports a linked value a request body has no place for, and leaves the request out', async function () {
    const body = (type) => {
        return { content: { [type]: { schema: { type: 'object', properties: { ownerId: { type: 'string' } } } } } };
      },
      result = await generate({ openapi: '3.0.0', info: { title: 'Bodies', version: '1' }, paths: {
        '/owners': { post: { responses: created({ id: 'string' }) } },
        '/pets': { post: { requestBody: body('application/x-www-form-urlencoded'), responses: created({}) } },
        '/toys': { post: { requestBody: body('application/xml'), responses: created({}) } }
      } });

    expect(_.find(request(result, '2. POST /pets').request.body.urlencoded, { key: 'ownerId' }).value)
      .to.equal('{{ownerId}}');
    expect(labels(result)).to.not.include('POST /toys');
    expect(result.summary.errors).to.eql(['POST /toys has no place for {{ownerId}} in its request body']);
  });

  it('saves a value from any 2xx when the spec declares several success codes', async function () {
    const result = await generate(NESTED),
      script = exec(request(result, '3. POST /specifications/{id}/files'), 'test');

    expect(script).to.include('!(pm.response.code >= 200 && pm.response.code < 300)');
  });

  it('does not send optional parameters unless a link fills them', async function () {
    const result = await generate(NESTED),
      query = (name, key) => { return _.find(request(result, name).request.url.query, { key }); };

    expect(query('2. GET /specifications/{id}', 'limit')).to.include({ value: 'pageLimit', disabled: true });
    expect(query('6. GET /tasks', 'entityId')).to.include({ disabled: true });
    expect(query('6. GET /tasks', 'type')).to.include({ value: 'collection-generation' });
  });

  it('normalises plurals, id field names, wrappers, 3.1 types, actions and composite keys', async function () {
    const result = await generate(PATTERNS),
      verify = request(result, '4. POST /people/{personId}:verify');

    // `people` -> person, `uuid` typed [string, null], `result.address_id`.
    expect(link(result, 'personId').producer).to.eql({ operation: 'POST /people', value: '$response.body#/uuid' });
    expect(link(result, 'addressId').producer.value).to.equal('$response.body#/result/address_id');

    // `/archive` and `:verify` are actions on a person, not creates of their own resources.
    // They run inside the person flow, right after its read and before the child addresses.
    expect(_.map(requests(result), 'name').slice(2, 6)).to.eql([
      '3. GET /people/{personId}', '4. POST /people/{personId}:verify',
      '5. POST /people/{personId}/archive', '6. POST /people/{personId}/addresses'
    ]);
    expect(verify.request.url.path).to.eql(['people', '{{personId}}:verify']);

    // Nothing creates an order (only a list returns them), and `/repos/{owner}/{repo}` is a composite key.
    expect(inputNames(result)).to.eql(['orderId', 'owner', 'repo']);
    expect(_.map(result.summary.links, 'producer.operation')).to.not.include('GET /stats');
  });

  it('handles Swagger 2.0 specs', async function () {
    const result = await generate(SWAGGER2),
      noToken = request(result, '3. GET /stores/{storeId} without a token');

    expect(link(result, 'storeId').producer).to.eql({ operation: 'POST /stores', value: '$response.body#/id' });
    expect(_.find(noToken.request.url.variable, { key: 'storeId' }).value).to.equal('{{storeId}}');
  });

  it('sends headers on every request and leaves credentials out of the no-token checks', async function () {
    const headers = [{ name: 'Authorization', value: 'Bearer {{token}}' }, { name: 'X-Tenant-Id', value: 't1' },
        { name: 'X-Api-Key' }],
      result = await generate(PETSTORE, { headers }),
      sent = (name) => {
        return _.map(request(result, name).request.header, (h) => { return `${h.key}: ${h.value}`; });
      };

    expect(result.output[0].data.auth).to.be.undefined;
    expect(sent('5. GET /pets/{petId}'))
      .to.include.members(['Authorization: Bearer {{token}}', 'X-Tenant-Id: t1', 'X-Api-Key: {{xApiKey}}']);
    expect(sent('9. GET /pets/{petId} without a token')).to.include('X-Tenant-Id: t1')
      .and.not.include.members(['Authorization: Bearer {{token}}', 'X-Api-Key: {{xApiKey}}']);
  });

  it('keeps the spec\'s auth when only non-credential headers are given', async function () {
    const result = await generate(PETSTORE, { headers: [{ name: 'X-Tenant-Id', value: 't1' }] });

    expect(result.output[0].data.auth).to.include({ type: 'bearer' });
    expect(_.map(requests(result), 'name')).to.include('9. GET /pets/{petId} without a token');
    expect(await generate(PETSTORE, { headers: [{ value: 'x' }] })).to.include({ result: false });
  });

  it('links a required identifier header unless the caller sends it', async function () {
    const spec = { openapi: '3.0.0', info: { title: 'Tenants', version: '1' }, paths: {
        '/pets': { get: { parameters: [{ name: 'X-Tenant-Id', in: 'header', required: true,
          schema: { type: 'string' } }], responses: { 200: { description: 'ok' } } } }
      } },
      [plain, sent] = await Promise.all([generate(spec), generate(spec, { headers: [{ name: 'x-tenant-id' }] })]);

    expect(inputNames(plain)).to.eql(['xTenantId']);
    expect(_.find(request(plain, '1. GET /pets').request.header, { key: 'X-Tenant-Id' }).value)
      .to.equal('{{xTenantId}}');
    expect(sent.summary.inputs).to.eql([]);
  });

  it('leaves out excluded operations, given exactly or with *', async function () {
    const result = await generate(PETSTORE, { exclude: ['GET /pets', 'put /pets/*'] });

    expect(result.summary.excluded).to.eql(['GET /pets', 'PUT /pets/{petId}']);
    expect(labels(result)).to.not.include.members(['GET /pets', 'PUT /pets/{petId}', 'GET /pets without a token']);
    expect(result.summary.errors).to.be.empty;
  });

  it('turns a value into an input when its producer is excluded', async function () {
    const result = await generate(PETSTORE, { exclude: ['POST /owners'] });

    expect(inputNames(result)).to.eql(['ownerId']);
    expect(JSON.parse(request(result, '2. POST /pets').request.body.raw).ownerId).to.equal('{{ownerId}}');
  });

  it('reports an exclude entry that matches no operation, and rejects one that is not a string', async function () {
    expect((await generate(PETSTORE, { exclude: ['DELETE /owners/{ownerId}'] })).summary.errors)
      .to.eql(['exclude "DELETE /owners/{ownerId}" matches no operation']);

    for (const exclude of [[''], [{ operation: 'GET /pets' }], 'GET /pets']) {
      expect(await generate(PETSTORE, { exclude })).to.eql({ result: false,
        reason: 'Each exclude entry is a string: "METHOD /path", where * matches anything' });
    }
  });

  it('asks for one value of a dependency cycle instead of guessing it', async function () {
    const create = (field) => {
        return { post: {
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: [field],
            properties: { [field]: { type: 'string' } } } } } },
          responses: created({ id: 'string' })
        } };
      },
      result = await generate({ openapi: '3.0.0', info: { title: 'Cycle', version: '1' },
        paths: { '/authors': create('editorId'), '/editors': create('authorId') } });

    // Each create needs the other's id: `authorId` comes first alphabetically, so it is the one to set.
    expect(inputNames(result)).to.eql(['authorId']);
    expect(link(result, 'editorId').producer.operation).to.equal('POST /editors');
    expect(_.map(requests(result), 'name').slice(0, 2)).to.eql(['1. POST /editors', '2. POST /authors']);
    expect(result.summary.errors).to.be.empty;
  });

  it('reports a value whose producer cannot run before the request that needs it', async function () {
    const result = await generate({ openapi: '3.0.0', info: { title: 'Order', version: '1' }, paths: {
      '/jobs': { get: { parameters: [{ name: 'runId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'ok' } } } },
      '/jobs/run': { post: { responses: created({ runId: 'string' }) } }
    } });

    // A list runs before the other requests of its resource, so GET /jobs can't wait for POST /jobs/run.
    expect(result.summary.errors).to.eql(['GET /jobs needs {{runId}} from POST /jobs/run, which cannot run before it']);
  });

  it('rejects input that is not a convertV2WithTypes result made with generateContractTests', function (done) {
    expect(Converter.buildContractTestCollection({ result: false, reason: 'Invalid format' }))
      .to.include({ result: false });
    expect(Converter.buildContractTestCollection(undefined)).to.include({ result: false });
    Converter.convertV2WithTypes({ type: 'json', data: _.cloneDeep(PETSTORE) }, {}, (err, conversion) => {
      expect(Converter.buildContractTestCollection(conversion)).to.eql({ result: false,
        reason: 'Expected a convertV2WithTypes result made with generateContractTests: true' });
      done(err);
    });
  });

  it('is part of the default export', function () {
    expect(Converter.default.buildContractTestCollection).to.equal(Converter.buildContractTestCollection);
  });

  it('keeps an operation\'s own server, spec example UUIDs and distinct paths that read alike', async function () {
    const uuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      ok = { 200: { description: 'ok' } },
      result = await generate({ openapi: '3.0.0', info: { title: 'Paths', version: '1' }, paths: {
        '/pets': { get: { responses: ok,
          servers: [{ url: 'https://api.example.com/{version}', variables: { version: { default: 'v3' } } }] } },
        '/foo-bar': { get: { responses: ok } },
        '/foo_bar': { get: { responses: ok } },
        '/things': { post: { responses: ok, requestBody: { content: { 'application/json': {
          schema: { type: 'object', properties: { ref: { type: 'string', example: uuid } } } } } } } }
      } }),
      things = requests(result)[labels(result).indexOf('POST /things')],
      pets = requests(result)[labels(result).indexOf('GET /pets')];

    expect(labels(result)).to.include.members(['GET /pets', 'GET /foo-bar', 'GET /foo_bar', 'POST /things']);
    expect(pets.request.url.host).to.eql(['{{baseUrl1}}']);
    expect(JSON.parse(things.request.body.raw).ref).to.equal(uuid);
  });

  it('skips a request whose value is missing, treating 0 as set, and fails a test for a missing input', function () {
    const sdk = require('postman-collection'),
      requestUsing = (name) => {
        return new sdk.Request({ method: 'GET', url: `https://api.example.com/pets/{{${name}}}` });
      },
      run = (guard, values, request) => {
        const outcome = { skipped: false, tests: [] };

        // eslint-disable-next-line no-new-func
        new Function('pm', 'console', guard.join('\n'))({ variables: { get: (name) => { return values[name]; } },
          request, info: { requestName: 'r' }, execution: { skipRequest: () => { outcome.skipped = true; } },
          test: (name) => { outcome.tests.push(name); } }, { warn: _.noop });

        return outcome;
      };

    expect([0, 'abc', undefined, null, ''].map((value) => {
      return run(scripts.guard({ petId: 'reason' }), { petId: value }, requestUsing('petId')).skipped;
    })).to.eql([false, false, true, true, true]);
    expect(run(scripts.guard({ petId: 'saved', tenantId: 'set it' }, ['tenantId']), {}, requestUsing('tenantId')))
      .to.eql({ skipped: true, tests: ['Request | tenantId is set'] });
    // An environment override replaced {{petId}}, so the request no longer needs it; a cleanup still does.
    expect(run(scripts.guard({ petId: 'saved' }), {}, requestUsing('other')).skipped).to.equal(false);
    expect(run(scripts.guard({ petId: 'nothing was created' }, [], true), {}, requestUsing('other')).skipped)
      .to.equal(true);
  });

  it('replaces every sent value whose exact name is set in the environment', function () {
    const sdk = require('postman-collection'),
      request = new sdk.Request({
        method: 'POST',
        url: { host: ['{{baseUrl}}'], path: ['specifications', ':id'],
          query: [{ key: 'containerId', value: '{{containerId}}' }, { key: 'limit', value: '10', disabled: true }],
          variable: [{ key: 'id', value: '{{specificationId}}' }] },
        header: [{ key: 'X-Tenant-Id', value: 'example' }, { key: 'x-tenant-id', value: 'lower' }],
        body: { mode: 'raw', options: { raw: { language: 'json' } }, raw: JSON.stringify({ name: 'Rex',
          owner: { ownerId: 'a' }, items: [{ ownerId: 'b' }], count: '__COUNT__', size: 3, other: '__OTHER__' })
          .replace('"__COUNT__"', '{{count}}').replace('"__OTHER__"', '{{other}}') }
      }),
      environment = { id: 'spec-1', containerId: 'ws-1', limit: '5', 'X-Tenant-Id': 'acme', ownerId: 'o-1',
        count: '7', size: '4', name: '' };

    // eslint-disable-next-line no-new-func
    new Function('pm', scripts.overrideFromEnvironment.join('\n'))({ request,
      environment: { get: (name) => { return environment[name]; } } });

    expect(request.url.variables.get('id')).to.equal('spec-1');
    // A disabled parameter isn't sent, so it isn't overridden; header names match exactly.
    expect(request.url.query.all().map((param) => { return [param.key, param.value]; }))
      .to.eql([['containerId', 'ws-1'], ['limit', '10']]);
    expect(request.headers.all().map((header) => { return [header.key, header.value]; }))
      .to.eql([['X-Tenant-Id', 'acme'], ['x-tenant-id', 'lower']]);
    // Types are kept, an empty value replaces nothing, and an unrelated placeholder stays.
    expect(request.body.raw).to.include('"other": {{other}}');
    expect(JSON.parse(request.body.raw.replace('{{other}}', 'null'))).to.eql({ name: 'Rex',
      owner: { ownerId: 'o-1' }, items: [{ ownerId: 'o-1' }], count: 7, size: 4, other: null });
  });

  it('applies environment overrides in the collection\'s pre-request, before request scripts', async function () {
    const collection = (await generate(PETSTORE)).output[0].data;

    expect(collection.event[0]).to.eql({ listen: 'prerequest',
      script: { type: 'text/javascript', exec: scripts.overrideFromEnvironment } });
  });
});

describe('buildContractTestCollection invariants', function () {
  const pathOf = (item) => { return item.name.split(' ')[2]; },
    linkShape = (result) => { return _.pick(result.summary, ['links', 'inputs']); },

    // Structural problems in a generated collection; an empty list means every invariant holds.
    violations = (result) => {
      const items = requests(result),
        linked = _.flatMap(result.summary.links, (l) => { return [l.variable, `deleted_${l.variable}`]; }),
        inputs = _.map(result.summary.inputs, 'variable'),
        declared = _.map(result.output[0].data.variable, 'key'),
        saved = new Set(),
        deletes = [],
        problems = [];

      items.forEach((item, index) => {
        const test = exec(item, 'test'),
          guard = exec(item, 'prerequest'),
          used = _.intersection(_.uniq((JSON.stringify(item.request).match(/\{\{\w+\}\}/g) || [])
            .map((v) => { return v.slice(2, -2); })), linked.concat(inputs)),
          deleted = (/\[([^\]]*)\]\.forEach\(function \(name\)/).exec(test);

        if (!item.name.startsWith(`${index + 1}. `)) { problems.push(`${item.name}: not numbered ${index + 1}`); }
        used.forEach((v) => {
          if (!saved.has(v) && !inputs.includes(v)) {
            problems.push(`${item.name}: uses {{${v}}} before any request saves it`);
          }
          if (inputs.includes(v) && declared.includes(v)) {
            problems.push(`${item.name}: input {{${v}}} is declared as a collection variable`);
          }
          if (!guard.includes(`"${v}"`)) { problems.push(`${item.name}: uses {{${v}}} without a guard`); }
        });
        (item.request.url.variable || []).forEach((v) => {
          if (!(/^\{\{\w+\}\}$/).test(v.value)) { problems.push(`${item.name}: path id ${v.key} is not linked`); }
        });
        if (item.name.endsWith('without a token') && _.get(item, 'request.auth.type') !== 'noauth') {
          problems.push(`${item.name}: sends auth`);
        }
        if ((item.name.endsWith('without a token') || (/ without (query|header|body) "/).test(item.name)) &&
          deletes.length) {
          problems.push(`${item.name}: runs after a teardown delete`);
        }
        if (item.name.endsWith('(expect 404)') && !_.some(deletes, { path: pathOf(item) })) {
          problems.push(`${item.name}: no earlier delete of the same resource`);
        }
        (test.match(/"variable":"\w+"/g) || []).forEach((m) => { saved.add(m.split(':')[1].replace(/"/g, '')); });
        if (deleted) { JSON.parse(`[${deleted[1]}]`).forEach((v) => { saved.add(`deleted_${v}`); }); }
        if (item.request.method === 'DELETE' && !item.name.endsWith('(clean up if created)')) {
          deletes.push({ path: pathOf(item), index });
        }
      });

      deletes.forEach((parent) => {
        deletes.filter((child) => { return child.path.startsWith(`${parent.path}/`) && child.index > parent.index; })
          .forEach((child) => { problems.push(`DELETE ${child.path} runs after its parent DELETE ${parent.path}`); });
      });

      return problems;
    };

  FIXTURES.forEach(([file, spec]) => {
    describe(file, function () {
      it('saves every linked value before using it, guards it, links every path id, tears down children first',
        async function () {
          expect(violations(await generate(spec))).to.eql([]);
        });

      it('gives the same run order and collection id however the spec is laid out', async function () {
        const shape = (result) => { return [_.map(requests(result), 'name'), result.output[0].data.info._postman_id]; },
          expected = shape(await generate(spec));

        for (const seed of [1, 2, 3, 4, 5]) {
          expect(shape(await generate(shuffled(spec, seed)))).to.eql(expected);
        }
      });

      it('keeps the same links when an unrelated endpoint is added', async function () {
        const extended = _.set(_.cloneDeep(spec), ['paths', '/zz-unrelated-health'],
          { get: { responses: { 200: { description: 'ok' } } } });

        expect(linkShape(await generate(extended))).to.eql(linkShape(await generate(spec)));
      });

      it('ignores summaries, descriptions and tags', async function () {
        const annotated = _.cloneDeep(spec);

        _.forEach(annotated.paths, (item, p) => {
          _.forEach(_.pick(item, ['get', 'post', 'put', 'patch', 'delete']), (op, method) => {
            Object.assign(op, { summary: `Do ${method} ${p}`, description: 'Changed', tags: ['changed'] });
          });
        });

        const [plain, changed] = await Promise.all([generate(spec), generate(annotated)]);

        expect(_.map(requests(changed), 'name')).to.eql(_.map(requests(plain), 'name'));
        expect(linkShape(changed)).to.eql(linkShape(plain));
      });

      // Holds because every fixture gives examples; values without one come from the converter's faker.
      it('produces identical output for identical input', async function () {
        const [a, b] = await Promise.all([generate(spec), generate(spec)]);

        expect(JSON.stringify(a.output)).to.equal(JSON.stringify(b.output));
      });
    });
  });
});
