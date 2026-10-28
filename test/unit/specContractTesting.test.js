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
  // A new binding as the summary reports it (with rule and score), else the lock-file entry.
  binding = (result, variable) => {
    return _.find(result.summary.added, { variable }) || _.find(result.lock.bindings, { variable });
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

    expect(_.pick(binding(result, 'owner_id'), ['rule', 'score'])).to.eql({ rule: 'same-resource-create', score: 90 });
    expect(binding(result, 'owner_id').producer).to.include({ operation: 'POST /owners', value: '$response.body#/id' });
    expect(_.map(binding(result, 'owner_id').consumers, 'operation')).to.eql(['GET /owners/{ownerId}', 'POST /pets']);
    expect(binding(result, 'pet_id').producer.operation).to.equal('POST /pets');
    expect(result.summary.unresolved).to.be.empty;
  });

  it('orders flows, then no-token checks, missing-field checks and a children-first teardown', async function () {
    const result = await generate(PETSTORE);

    expect(_.map(requests(result), 'name')).to.eql([
      '1. POST /owners', '2. GET /owners/{ownerId}',
      '3. POST /pets', '4. GET /pets', '5. GET /pets/{petId}', '6. PUT /pets/{petId}',
      '7. GET /owners/{ownerId} without a token', '8. GET /pets without a token',
      '9. GET /pets/{petId} without a token',
      '10. POST /owners without "name"',
      '11. POST /pets without "name"', '12. DELETE /pets/{petId} (clean up if created)',
      '13. POST /pets without "ownerId"', '14. DELETE /pets/{petId} (clean up if created)',
      '15. DELETE /pets/{petId}', '16. GET /pets/{petId} (expect 404)'
    ]);
  });

  it('wires saved values into later requests and guards against missing ones', async function () {
    const result = await generate(PETSTORE),
      createPet = request(result, '3. POST /pets'),
      getPet = request(result, '5. GET /pets/{petId}'),
      gone = request(result, '16. GET /pets/{petId} (expect 404)'),
      noToken = request(result, '9. GET /pets/{petId} without a token');

    expect(JSON.parse(createPet.request.body.raw).ownerId).to.equal('{{owner_id}}');
    expect(exec(createPet, 'test')).to.include('"variable":"pet_id"').and.include('@postman-contract-test');
    expect(_.find(getPet.request.url.variable, { key: 'petId' }).value).to.equal('{{pet_id}}');
    expect(exec(getPet, 'prerequest')).to.include('["pet_id"]').and.include('pm.execution.skipRequest()');
    expect(_.find(gone.request.url.variable, { key: 'petId' }).value).to.equal('{{deleted_pet_id}}');
    expect(exec(gone, 'test')).to.include('pm.response.to.have.status(404)').and.not.include('Succeeds (2xx)');
    expect(exec(createPet, 'test')).to.include('Flow | Succeeds (2xx)');
    expect(noToken.request.auth).to.eql({ type: 'noauth' });
    expect(_.find(noToken.request.url.variable, { key: 'petId' }).value).to.equal('{{pet_id}}');
  });

  it('unwraps { meta, data } envelopes, resolves parent ids and skips requests with unlinked ids', async function () {
    const result = await generate(NESTED),
      names = _.map(requests(result), 'name');

    expect(binding(result, 'specification_id').producer.value).to.equal('$response.body#/data/id');
    expect(_.map(binding(result, 'file_id').consumers, 'param')).to.deep.include({ in: 'path', name: 'fileId' });
    expect(names.slice(-4)).to.eql([
      '6. DELETE /specifications/{id}/files/{fileId}', '7. GET /specifications/{id}/files/{fileId} (expect 404)',
      '8. DELETE /specifications/{id}', '9. GET /specifications/{id} (expect 404)'
    ]);
    expect(result.summary.skipped).to.eql(['POST /specs/{id}/files', 'GET /tasks/{taskId}']);
    // Every skipped request has a path id listed as unresolved with `fallback: skip`.
    expect(_(result.summary.unresolved).filter({ fallback: 'skip' }).map('operation').uniq().value())
      .to.have.members(result.summary.skipped);
  });

  it('deletes a resource that a missing-field check wrongly creates', async function () {
    const result = await generate(PETSTORE),
      check = request(result, '11. POST /pets without "name"'),
      cleanup = request(result, '12. DELETE /pets/{petId} (clean up if created)');

    expect(exec(check, 'test')).to.include('pm.collectionVariables.set("leaked_pet_id", created)')
      .and.include('get(pm.response.json(), "id")');
    expect(_.find(cleanup.request.url.variable, { key: 'petId' }).value).to.equal('{{leaked_pet_id}}');
    expect(exec(cleanup, 'prerequest')).to.include('["leaked_pet_id"]').and.include('nothing was created');
    expect(exec(cleanup, 'test')).to.equal('pm.collectionVariables.unset("leaked_pet_id");');
  });

  it('skips a request whose linked value cannot be put into its body', async function () {
    const body = (type) => {
        return { content: { [type]: { schema: { type: 'object', properties: { ownerId: { type: 'string' } } } } } };
      },
      created = { 201: { description: 'ok' } },
      result = await generate({ openapi: '3.0.0', info: { title: 'Bodies', version: '1' }, paths: {
        '/owners': { post: { responses: { 201: { description: 'ok', content: { 'application/json': {
          schema: { type: 'object', properties: { id: { type: 'string' } } } } } } } } },
        '/pets': { post: { requestBody: body('application/x-www-form-urlencoded'), responses: created } },
        '/toys': { post: { requestBody: body('application/xml'), responses: created } }
      } });

    expect(_.find(request(result, '2. POST /pets').request.body.urlencoded, { key: 'ownerId' }).value)
      .to.equal('{{owner_id}}');
    expect(result.summary.skipped).to.eql(['POST /toys']);
    expect(result.summary.unresolved).to.deep.include({ operation: 'POST /toys',
      param: { in: 'body', path: '/ownerId' }, fallback: 'skip',
      reason: 'the request body format cannot take a linked value' });
  });

  it('saves a value from any 2xx when the spec declares several success codes', async function () {
    const result = await generate(NESTED),
      script = exec(request(result, '3. POST /specifications/{id}/files'), 'test');

    expect(script).to.include('!(pm.response.code >= 200 && pm.response.code < 300)')
      .and.not.include('String(pm.response.code) !== save.status');
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
    expect(binding(result, 'type').producer).to.be.null;
    expect(result.summary.unresolved).to.deep.include({ operation: 'GET /tasks', param: { in: 'query', name: 'type' },
      reason: 'no response returns a matching value', fallback: 'example' });
  });

  it('normalises plurals, id field names, wrappers, 3.1 types, actions and composite keys', async function () {
    const result = await generate(PATTERNS),
      verify = request(result, '4. POST /people/{personId}:verify');

    // `people` -> person, `uuid` typed [string, null], `result.address_id`, HAL `_embedded.orders`.
    expect(binding(result, 'person_id').producer)
      .to.include({ operation: 'POST /people', value: '$response.body#/uuid' });
    expect(binding(result, 'address_id').producer.value).to.equal('$response.body#/result/address_id');
    expect(_.pick(binding(result, 'order_id'), ['rule'])).to.eql({ rule: 'same-resource-list' });
    expect(binding(result, 'order_id').producer.value).to.equal('$response.body#/_embedded/orders/0/id');

    // `/archive` and `:verify` are actions on a person, not creates of their own resources.
    // They run inside the person flow, right after its read and before the child addresses.
    expect(_.map(requests(result), 'name').slice(2, 6)).to.eql([
      '3. GET /people/{personId}', '4. POST /people/{personId}:verify',
      '5. POST /people/{personId}/archive', '6. POST /people/{personId}/addresses'
    ]);
    expect(verify.request.url.path).to.eql(['people', '{{person_id}}:verify']);

    // `/repos/{owner}/{repo}` has no producer; the `/stats` map produces nothing.
    expect(result.summary.skipped).to.eql(['GET /repos/{owner}/{repo}']);
    expect(_.map(result.lock.bindings, 'producer.operation')).to.not.include('GET /stats');
  });

  it('handles Swagger 2.0 specs', async function () {
    const result = await generate(SWAGGER2),
      noToken = request(result, '3. GET /stores/{storeId} without a token');

    expect(binding(result, 'store_id').producer).to.include({ operation: 'POST /stores', value: '$response.body#/id' });
    expect(_.find(noToken.request.url.variable, { key: 'storeId' }).value).to.equal('{{store_id}}');
  });

  it('writes a minimal lock: links, and values nothing returns as bindings without a producer', async function () {
    const result = await generate(NESTED);

    expect(_.keys(result.lock)).to.eql(['lockfileVersion', 'exclude', 'bindings']);
    result.lock.bindings.forEach((entry) => {
      expect(_.keys(entry)).to.eql(['variable', 'producer', 'consumers']);
      entry.consumers.forEach((consumer) => { expect(_.keys(consumer)).to.eql(['operation', 'param']); });
    });
    expect(binding(result, 'specification_id')).to.include({ rule: 'same-resource-create', score: 90 });
    expect(_.find(result.lock.bindings, { variable: 'task_id' })).to.eql({ variable: 'task_id', producer: null,
      consumers: [{ operation: 'GET /tasks/{taskId}', param: { in: 'path', name: 'taskId' } }] });
  });

  it('uses a written binding for any header, query or body field, and resolves a placeholder once filled in',
    async function () {
      const first = await generate(PETSTORE),
        lock = _.cloneDeep(first.lock);

      lock.bindings.push({ variable: 'traceId', producer: { environment: 'traceId' }, consumers: [
        { operation: 'POST /pets', param: { in: 'header', name: 'x-trace-id' } },
        { operation: 'GET /pets', param: { in: 'query', name: 'tag' } },
        { operation: 'PUT /pets/{petId}', param: { in: 'body', path: '/meta/traceId' } }
      ] });

      const result = await generate(PETSTORE, { lock }),
        createPet = request(result, '3. POST /pets'),
        listPets = request(result, '4. GET /pets'),
        updatePet = request(result, '6. PUT /pets/{petId}');

      expect(result.summary.warnings).to.be.empty;
      expect(_.find(createPet.request.header, { key: 'x-trace-id' }).value).to.equal('{{traceId}}');
      expect(_.find(listPets.request.url.query, { key: 'tag' })).to.include({ value: '{{traceId}}' })
        .and.not.include({ disabled: true });
      expect(JSON.parse(updatePet.request.body.raw).meta.traceId).to.equal('{{traceId}}');
    });

  it('fills a placeholder from the environment once its producer is set', async function () {
    const first = await generate(NESTED),
      lock = _.cloneDeep(first.lock);

    _.find(lock.bindings, { variable: 'type' }).producer = { environment: 'taskType' };

    const result = await generate(NESTED, { lock }),
      tasks = request(result, '5. GET /tasks');

    expect(_.find(tasks.request.url.query, { key: 'type' })).to.include({ value: '{{taskType}}', disabled: false });
    expect(_.map(result.summary.unresolved, 'param.name')).to.not.include('type');
    expect(_.find(result.lock.bindings, { variable: 'type' }).producer).to.eql({ environment: 'taskType' });
  });

  it('fills a value from a constant, keeps notes, and rejects a consumer listed under two bindings', async function () {
    const lock = _.cloneDeep((await generate(NESTED)).lock),
      type = _.find(lock.bindings, { variable: 'type' });

    Object.assign(type, { note: 'tasks of this kind only', producer: { constant: 'collection-generation' } });

    const result = await generate(NESTED, { lock }),
      tasks = request(result, '5. GET /tasks'),
      duplicated = _.cloneDeep(result.lock);

    expect(_.find(tasks.request.url.query, { key: 'type' })).to.include({ value: '{{type}}', disabled: false });
    expect(_.find(result.output[0].data.variable, { key: 'type' }).value).to.equal('collection-generation');
    expect(_.find(result.lock.bindings, { variable: 'type' })).to.eql({ variable: 'type',
      note: 'tasks of this kind only', producer: { constant: 'collection-generation' },
      consumers: [{ operation: 'GET /tasks', param: { in: 'query', name: 'type' } }] });

    _.find(duplicated.bindings, { variable: 'specification_id' }).consumers.push(type.consumers[0]);
    expect(await generate(NESTED, { lock: duplicated })).to.eql({ result: false, reason:
      'GET /tasks query:type is listed under bindings "specification_id" and "type": keep it in one' });
  });

  it('uses a producer\'s constant for every consumer, keeping the rest of the producer as a reference',
    async function () {
      const id = 'e43483a8-8e79-4f7f-b710-762ff4f7b4d0',
        lock = _.cloneDeep((await generate(PETSTORE)).lock);

      _.find(lock.bindings, { variable: 'pet_id' }).producer.constant = id;

      const result = await generate(PETSTORE, { lock }),
        withPhotos = await generate(_.set(_.cloneDeep(PETSTORE), ['paths', '/pets/{petId}/photos'], { get: {
          parameters: [idParam('petId')], responses: { 200: { description: 'ok' } } } }), { lock }),
        withoutCreate = await generate(_.omit(PETSTORE, ['paths./pets.post']), { lock });

      expect(_.find(result.output[0].data.variable, { key: 'pet_id' }).value).to.equal(id);
      expect(_.find(request(result, '5. GET /pets/{petId}').request.url.variable, { key: 'petId' }).value)
        .to.equal('{{pet_id}}');
      expect(exec(request(result, '3. POST /pets'), 'test')).to.not.include('"variable":"pet_id"');
      expect(_.find(result.lock.bindings, { variable: 'pet_id' }).producer)
        .to.eql({ operation: 'POST /pets', value: '$response.body#/id', constant: id });
      expect(withPhotos.summary.extended).to.have.length(1);
      expect(_.map(withoutCreate.summary.warnings, 'variable')).to.not.include('pet_id');
    });

  it('saves a value from a response header, narrowed by a pattern', async function () {
    const lock = _.cloneDeep((await generate(PETSTORE)).lock);

    _.find(lock.bindings, { variable: 'pet_id' }).producer =
      { operation: 'POST /pets', value: '$response.header.Location', pattern: '([^/]+)$' };

    const result = await generate(PETSTORE, { lock }),
      script = exec(request(result, '3. POST /pets'), 'test'),
      saved = {};

    expect(result.summary.warnings).to.be.empty;
    expect(script).to.include('"header":"Location","pattern":"([^/]+)$"');

    // Run the save part of the generated script against a 201 with `Location: /pets/42`.
    // eslint-disable-next-line no-new-func
    new Function('pm', 'require', scripts.save(JSON.parse((/var contractSaves = (.*);/).exec(script)[1])).join('\n'))({
      response: { code: 201, json: () => { return {}; }, headers: { get: () => { return '/pets/42'; } } },
      expect: () => { return { to: { not: { be: { undefined: _.noop } } } }; },
      test: (name, fn) => { fn(); },
      collectionVariables: { set: (key, value) => { saved[key] = value; } }
    }, () => { return _; });

    expect(saved.pet_id).to.equal('42');
  });

  it('reuses a saved lock and extends it with new consumers', async function () {
    const lock = (await generate(PETSTORE)).lock,
      withPhotos = _.set(_.cloneDeep(PETSTORE), ['paths', '/pets/{petId}/photos'], { get: {
        parameters: [idParam('petId')], responses: { 200: { description: 'ok' } } } }),
      reused = await generate(withPhotos, { lock });

    expect(reused.summary).to.include({ unchanged: 2 });
    expect(reused.summary.added).to.be.empty;
    expect(reused.summary.extended).to.have.length(1);
    expect(reused.summary.extended[0].variable).to.equal('pet_id');
    expect(_.last(_.find(reused.lock.bindings, { variable: 'pet_id' }).consumers).operation)
      .to.equal('GET /pets/{petId}/photos');
  });

  it('keeps a binding whose requests left the spec, warns, and gives its consumers no value', async function () {
    const lock = (await generate(PETSTORE)).lock,
      withoutOwners = await generate(_.omit(PETSTORE, ['paths./owners', 'paths./owners/{ownerId}']), { lock });

    expect(withoutOwners.lock.bindings).to.eql(lock.bindings);
    expect(withoutOwners.summary.warnings).to.eql([
      { variable: 'owner_id', reason: 'producer POST /owners is not in the spec' },
      { variable: 'owner_id', reason: 'consumer GET /owners/{ownerId} is not in the spec' }
    ]);
    expect(withoutOwners.summary.unresolved).to.deep.include({ operation: 'POST /pets',
      param: { in: 'body', path: '/ownerId' }, reason: 'binding owner_id: producer POST /owners is not in the spec',
      fallback: 'example' });
  });

  it('keeps everything a user edited: entries, order, constants, notes and placeholders', async function () {
    const first = await generate(NESTED),
      lock = _.cloneDeep(first.lock),
      edited = _.find(lock.bindings, { variable: 'type' }),
      withTask = _.set(_.cloneDeep(NESTED), ['paths', '/tasks', 'post'], { responses: { 201: { description: 'ok',
        content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' } } } } } } } });

    lock.bindings.reverse();
    edited.note = 'still unresolved on purpose';
    _.find(lock.bindings, { variable: 'specification_id' }).producer.constant = 'spec-1';

    const second = await generate(withTask, { lock });

    expect(second.lock.bindings.slice(0, lock.bindings.length)).to.eql(lock.bindings);
    expect(_.find(second.lock.bindings, { variable: 'task_id' })).to.include({ producer: null });
    expect(second.summary.suggestions).to.deep.include({ variable: 'task_id',
      consumer: { operation: 'GET /tasks/{taskId}', param: { in: 'path', name: 'taskId' } },
      producer: { operation: 'POST /tasks', value: '$response.body#/id' } });
  });

  it('rejects bindings that would clash or that it cannot read', async function () {
    const lock = (await generate(PETSTORE)).lock,
      withBindings = (change) => { const copy = _.cloneDeep(lock); change(copy.bindings); return copy; },
      cases = [
        [(bindings) => { bindings[1].variable = bindings[0].variable; },
          'Two bindings use the variable "owner_id": rename one'],
        [(bindings) => { delete bindings[0].variable; }, 'Every binding needs a variable'],
        [(bindings) => { bindings[0].producer = { pattern: 'x' }; }, 'has an invalid producer'],
        [(bindings) => { bindings[0].producer = { operation: 'POST /owners' }; }, 'producer operation without a value'],
        [(bindings) => { bindings[0].consumers[0].param = { in: 'cookie', name: 'id' }; }, 'has an invalid consumer'],
        [(bindings) => { bindings[0].consumers[0].param = { in: 'body', name: 'id' }; }, 'has an invalid consumer']
      ];

    for (const [change, message] of cases) {
      const result = await generate(PETSTORE, { lock: withBindings(change) });

      expect(result.result).to.equal(false);
      expect(result.reason).to.include(message);
    }
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

  it('leaves out the operations in the lock\'s exclude section, exactly or by pattern', async function () {
    const exclude = [{ operation: 'GET /pets', reason: 'slow' }, { pattern: '^PUT ' }],
      result = await generate(PETSTORE, { lock: { lockfileVersion: 1, exclude } }),
      labels = _.map(requests(result), (item) => { return item.name.replace(/^\d+\. /, ''); });

    expect(result.summary.excluded).to.eql(['GET /pets', 'PUT /pets/{petId}']);
    expect(labels).to.not.include.members(['GET /pets', 'PUT /pets/{petId}', 'GET /pets without a token']);
    expect(result.lock.exclude).to.eql(exclude);
  });

  it('keeps a link when one of its requests is excluded, and warns when its producer is', async function () {
    const lock = (await generate(PETSTORE)).lock,
      withExclude = (operation) => { return Object.assign({}, lock, { exclude: [{ operation }] }); },
      consumerExcluded = await generate(PETSTORE, { lock: withExclude('GET /pets/{petId}') }),
      producerExcluded = await generate(PETSTORE, { lock: withExclude('POST /owners') });

    expect(consumerExcluded.summary).to.include({ unchanged: 2 });
    expect(consumerExcluded.summary.warnings).to.be.empty;
    expect(_.map(binding(consumerExcluded, 'pet_id').consumers, 'operation')).to.include('GET /pets/{petId}');
    expect(producerExcluded.summary.warnings)
      .to.eql([{ variable: 'owner_id', reason: 'producer POST /owners is excluded' }]);
    expect(producerExcluded.lock.bindings).to.eql(lock.bindings);
  });

  it('reads a lock without lockfileVersion as version 1 and rejects any other version', async function () {
    const lock = _.omit((await generate(PETSTORE)).lock, 'lockfileVersion');

    expect(await generate(PETSTORE, { lock })).to.nested.include({ result: true, 'summary.unchanged': 2 });
    expect(await generate(PETSTORE, { lock: Object.assign({}, lock, { lockfileVersion: 2 }) }))
      .to.eql({ result: false, reason: 'Unsupported lockfileVersion 2: expected 1' });
  });

  it('rejects an invalid exclude entry', async function () {
    const invalid = [{ operation: 'GET /pets', pattern: '^GET' }, { pattern: '(' }, {}];

    for (const entry of invalid) {
      expect(await generate(PETSTORE, { lock: { lockfileVersion: 1, exclude: [entry] } }))
        .to.include({ result: false });
    }
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

  it('keeps server-template segments, spec example UUIDs and distinct paths that read alike', async function () {
    const uuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      ok = { 200: { description: 'ok' } },
      result = await generate({ openapi: '3.0.0', info: { title: 'Paths', version: '1' }, paths: {
        '/pets': { get: { responses: ok,
          servers: [{ url: 'https://api.example.com/{version}', variables: { version: { default: 'v3' } } }] } },
        '/foo-bar': { get: { responses: ok } },
        '/foo_bar': { get: { responses: ok } },
        '/things': { post: { responses: ok, requestBody: { content: { 'application/json': {
          schema: { type: 'object', properties: { ref: { type: 'string', example: uuid } } } } } } } }
      } });

    const labels = _.map(requests(result), (item) => { return item.name.replace(/^\d+\. /, ''); }),
      things = requests(result)[labels.indexOf('POST /things')];

    expect(labels).to.include.members(['GET /:version/pets', 'GET /foo-bar', 'GET /foo_bar', 'POST /things']);
    expect(JSON.parse(things.request.body.raw).ref).to.equal(uuid);
  });

  it('reports values whose producer is itself skipped, so nothing is skipped only at run time', async function () {
    const ok = { 200: { description: 'ok' } },
      result = await generate({ openapi: '3.0.0', info: { title: 'Cascade', version: '1' }, paths: {
        '/groups/{groupId}/items': { post: { parameters: [idParam('groupId')], responses: { 201: {
          description: 'ok', content: { 'application/json': {
            schema: { type: 'object', properties: { id: { type: 'string' } } } } } } } } },
        '/items/{itemId}': { get: { parameters: [idParam('itemId')], responses: ok } }
      } });

    expect(result.summary.skipped).to.have.members(['POST /groups/{groupId}/items', 'GET /items/{itemId}']);
    expect(result.summary.unresolved).to.deep.include({ operation: 'GET /items/{itemId}',
      param: { in: 'path', name: 'itemId' }, fallback: 'skip',
      reason: 'POST /groups/{groupId}/items is skipped (it needs an unresolved value)' });
  });

  it('reports links that a dependency cycle makes unusable', async function () {
    const create = (field) => {
        return { post: {
          requestBody: { content: { 'application/json': { schema: { type: 'object', required: [field],
            properties: { [field]: { type: 'string' } } } } } },
          responses: { 201: { description: 'ok', content: { 'application/json': {
            schema: { type: 'object', properties: { id: { type: 'string' } } } } } } }
        } };
      },
      result = await generate({ openapi: '3.0.0', info: { title: 'Cycle', version: '1' },
        paths: { '/authors': create('editorId'), '/editors': create('authorId') } });

    expect(result.summary.unresolved).to.eql([{ operation: 'POST /authors', param: { in: 'body', path: '/editorId' },
      reason: 'POST /editors runs after this request (dependency cycle)', fallback: 'example' }]);
    expect(request(result, '1. POST /authors').request.body.raw).to.not.include('{{');
    expect(JSON.parse(request(result, '2. POST /editors').request.body.raw).authorId).to.equal('{{author_id}}');
  });

  it('keeps a saved binding whose consumers carry different type details', async function () {
    const spec = { openapi: '3.0.0', info: { title: 'Formats', version: '1' }, paths: {
        '/things': { post: { responses: { 201: { description: 'ok', content: { 'application/json': {
          schema: { type: 'object', properties: { id: { type: 'string' } } } } } } } } },
        '/things/{thingId}': { get: { parameters: [idParam('thingId')], responses: { 200: { description: 'ok' } } } },
        '/things/{thingId}/parts': { get: { responses: { 200: { description: 'ok' } }, parameters: [
          { name: 'thingId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }] } }
      } },
      first = await generate(spec),
      second = await generate(spec, { lock: first.lock });

    expect(binding(first, 'thing_id').consumers).to.have.length(2);
    expect(second.summary.warnings).to.be.empty;
  });

  it('treats 0 as a saved value in the guard', function () {
    const guard = scripts.guard(['pet_id']).join('\n'),
      run = (value) => {
        let skipped = false;

        // eslint-disable-next-line no-new-func
        new Function('pm', 'console', guard)({ variables: { get: () => { return value; } }, info: { requestName: 'r' },
          execution: { skipRequest: () => { skipped = true; } } }, { warn: _.noop });

        return skipped;
      };

    expect([0, 'abc', undefined, null, ''].map(run)).to.eql([false, false, true, true, true]);
  });
});

// Properties that must hold for every spec. Each fixture in test/data/specContractTesting is checked.
describe('buildContractTestCollection invariants', function () {
  const pathOf = (item) => { return item.name.split(' ')[2]; },
    bindingShape = (result) => {
      return _.sortBy(result.lock.bindings.map((b) => {
        return { variable: b.variable, producer: b.producer, consumers: _.sortBy(_.map(b.consumers, 'operation')) };
      }), 'variable');
    },

    // Structural problems in a generated collection; an empty list means every invariant holds.
    violations = (result) => {
      const items = requests(result),
        linked = _.flatMap(result.lock.bindings, (b) => { return [b.variable, `deleted_${b.variable}`]; }),
        saved = new Set(),
        deletes = [],
        problems = [];

      items.forEach((item, index) => {
        const test = exec(item, 'test'),
          guard = exec(item, 'prerequest'),
          used = _.intersection(_.uniq((JSON.stringify(item.request).match(/\{\{\w+\}\}/g) || [])
            .map((v) => { return v.slice(2, -2); })), linked),
          deleted = (/\[([^\]]*)\]\.forEach\(function \(name\)/).exec(test);

        if (!item.name.startsWith(`${index + 1}. `)) { problems.push(`${item.name}: not numbered ${index + 1}`); }
        used.forEach((v) => {
          if (!saved.has(v)) { problems.push(`${item.name}: uses {{${v}}} before any request saves it`); }
          if (!guard.includes(`"${v}"`)) { problems.push(`${item.name}: uses {{${v}}} without a guard`); }
        });
        (item.request.url.variable || []).forEach((v) => {
          if (!(/^\{\{\w+\}\}$/).test(v.value)) { problems.push(`${item.name}: path id ${v.key} is not linked`); }
        });
        if (item.name.endsWith('without a token') && _.get(item, 'request.auth.type') !== 'noauth') {
          problems.push(`${item.name}: sends auth`);
        }
        if ((item.name.endsWith('without a token') || item.name.includes(' without "')) && deletes.length) {
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
      it('saves every linked value before using it, guards it, links every path id and tears down children first',
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

      it('keeps existing bindings when an unrelated endpoint is added', async function () {
        const extended = _.set(_.cloneDeep(spec), ['paths', '/zz-unrelated-health'],
          { get: { responses: { 200: { description: 'ok' } } } });

        expect(bindingShape(await generate(extended))).to.eql(bindingShape(await generate(spec)));
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
        expect(bindingShape(changed)).to.eql(bindingShape(plain));
      });

      it('changes nothing when its own lock is fed back', async function () {
        const first = await generate(spec),
          second = await generate(spec, { lock: first.lock });

        expect(second.summary).to.include({ unchanged: first.lock.bindings.length });
        expect(_.pick(second.summary, ['added', 'extended', 'warnings']))
          .to.eql({ added: [], extended: [], warnings: [] });
        expect(second.lock).to.eql(first.lock);
        expect(_.map(requests(second), 'name')).to.eql(_.map(requests(first), 'name'));
      });

      // Holds because every fixture gives examples; values without one come from the converter's faker.
      it('produces identical output for identical input', async function () {
        const [a, b] = await Promise.all([generate(spec), generate(spec)]);

        expect(JSON.stringify(a.output)).to.equal(JSON.stringify(b.output));
      });
    });
  });
});
