const expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  yaml = require('js-yaml'),
  _ = require('lodash'),
  Converter = require('../../dist/index.js'),

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

  it('orders flows, then no-token checks, a children-first teardown and missing-field checks', async function () {
    const result = await generate(PETSTORE);

    expect(_.map(requests(result), 'name')).to.eql([
      '1. POST /owners', '2. GET /owners/{ownerId}',
      '3. POST /pets', '4. GET /pets', '5. GET /pets/{petId}', '6. PUT /pets/{petId}',
      '7. GET /owners/{ownerId} without a token', '8. GET /pets without a token',
      '9. GET /pets/{petId} without a token',
      '10. DELETE /pets/{petId}', '11. GET /pets/{petId} (expect 404)',
      '12. POST /owners without "name"', '13. POST /pets without "name"', '14. POST /pets without "ownerId"'
    ]);
  });

  it('wires saved values into later requests and guards against missing ones', async function () {
    const result = await generate(PETSTORE),
      createPet = request(result, '3. POST /pets'),
      getPet = request(result, '5. GET /pets/{petId}'),
      gone = request(result, '11. GET /pets/{petId} (expect 404)'),
      noToken = request(result, '9. GET /pets/{petId} without a token');

    expect(JSON.parse(createPet.request.body.raw).ownerId).to.equal('{{owner_id}}');
    expect(exec(createPet, 'test')).to.include('"variable":"pet_id"').and.include('@postman-contract-test');
    expect(_.find(getPet.request.url.variable, { key: 'petId' }).value).to.equal('{{pet_id}}');
    expect(exec(getPet, 'prerequest')).to.include('["pet_id"]').and.include('pm.execution.skipRequest()');
    expect(_.find(gone.request.url.variable, { key: 'petId' }).value).to.equal('{{deleted_pet_id}}');
    expect(exec(gone, 'test')).to.include('pm.response.to.have.status(404)');
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
  });

  it('saves a value from any 2xx when the spec declares several success codes', async function () {
    const result = await generate(NESTED),
      script = exec(request(result, '3. POST /specifications/{id}/files'), 'test');

    expect(binding(result, 'file_id').producer.status).to.equal('200');
    expect(script).to.include('pm.response.code < 200 || pm.response.code >= 300')
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
    expect(binding(result, 'type')).to.be.undefined;
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
    expect(result.lock.flows.person)
      .to.include.members(['post_people_personId_archive', 'post_people_personId_verify']);
    expect(_.keys(result.lock.flows)).to.not.include.members(['archive', 'verify']);
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
        if (item.name.endsWith('without a token') && deletes.length) {
          problems.push(`${item.name}: runs after a delete`);
        }
        if (item.name.endsWith('(expect 404)') && !_.some(deletes, { path: pathOf(item) })) {
          problems.push(`${item.name}: no earlier delete of the same resource`);
        }
        (test.match(/"variable":"\w+"/g) || []).forEach((m) => { saved.add(m.split(':')[1].replace(/"/g, '')); });
        if (deleted) { JSON.parse(`[${deleted[1]}]`).forEach((v) => { saved.add(`deleted_${v}`); }); }
        if (item.request.method === 'DELETE') { deletes.push({ path: pathOf(item), index }); }
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

      it('gives the same run order however the spec is laid out', async function () {
        const names = (result) => { return _.map(requests(result), 'name'); },
          expected = names(await generate(spec));

        for (const seed of [1, 2, 3, 4, 5]) {
          expect(names(await generate(shuffled(spec, seed)))).to.eql(expected);
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
        expect(_.pick(second.summary, ['added', 'extended', 'stale'])).to.eql({ added: [], extended: [], stale: [] });
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
