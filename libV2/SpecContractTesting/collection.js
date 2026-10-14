// Builds the "Contract Tests" folder from the converter's requests: ordered flows wired with the
// bindings, a children-first teardown, and negative checks.
const _ = require('lodash'),
  { hash, toLodashPath } = require('./utils'),
  scripts = require('./scripts'),

  CONTRACT_FOLDER = 'Contract Tests',
  UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,

  flattenItems = (items) => {
    return _.flatMap(items, (item) => { return item.item ? flattenItems(item.item) : [item]; });
  },

  itemKey = (item) => {
    const path = (item.request.url.path || []).map((segment) => {
      return segment.startsWith(':') ? `{${segment.slice(1)}}` : segment;
    });

    return `${item.request.method} /${path.join('/')}`;
  },

  event = (listen, exec) => { return { listen, script: { type: 'text/javascript', exec } }; },

  // Values from the environment use the environment variable's name.
  variableOf = (binding) => { return _.get(binding, 'producer.environment') || binding.variable; },

  setEntry = (list, key, value, ignoreCase) => {
    const entry = _.find(list, (candidate) => {
      return ignoreCase ? candidate.key.toLowerCase() === key.toLowerCase() : candidate.key === key;
    });

    if (entry) { entry.value = value; }
    else { list.push({ key, value }); }
  },

  // Points a path, query, header or top-level body parameter at `{{variable}}`.
  useVariable = (request, param, variable, type) => {
    const value = `{{${variable}}}`,
      placeholder = `__CT_VAR__${variable}__`;

    if (param.in === 'path') {
      const entry = _.find(request.url.variable, { key: param.name });

      if (entry) { entry.value = value; }
    }
    else if (param.in === 'query') { setEntry(request.url.query = request.url.query || [], param.name, value); }
    else if (param.in === 'header') { setEntry(request.header = request.header || [], param.name, value, true); }
    else if (param.in === 'body' && _.get(request, 'body.raw')) {
      try {
        const body = _.set(JSON.parse(request.body.raw), toLodashPath(param.path), placeholder);

        request.body.raw = JSON.stringify(body, null, 2)
          .replace(`"${placeholder}"`, !type || type === 'string' ? `"${value}"` : value);
      }
      catch (e) { /* non-JSON body: keep the example value */ }
    }
  },

  removeBodyField = (request, field) => {
    try { request.body.raw = JSON.stringify(_.omit(JSON.parse(request.body.raw), field), null, 2); }
    catch (e) { /* non-JSON body: nothing to remove */ }
  },

  testExec = (item) => {
    return [].concat(_.get(_.find(item.event, { listen: 'test' }), 'script.exec', []));
  },

  // Replaces every UUID with one derived from the seed and its order of appearance, so the
  // converter's random ids and example values come out the same on every run.
  stabilizeIds = (collection, seed) => {
    const seen = new Map();

    return JSON.parse(JSON.stringify(collection).replace(UUID, (uuid) => {
      if (!seen.has(uuid)) {
        const h = hash(`${seed}:${seen.size}`, 32);

        seen.set(uuid, `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20)}`);
      }

      return seen.get(uuid);
    }));
  },

  buildContractFolder = ({ collection, operations, bindings, flows }) => {
    const items = _.keyBy(flattenItems(collection.item), itemKey),
      opsById = _.keyBy(operations, 'operationId'),
      uses = {},
      skipped = [],
      folders = [],
      negatives = [];
    let step = 0;

    bindings.forEach((binding) => {
      (binding.consumers || []).forEach((consumer) => {
        (uses[consumer.operation] = uses[consumer.operation] || []).push({ binding, param: consumer.param });
      });
    });

    const usesOf = (op) => { return uses[op.key] || []; },

      // The auth the request actually sends: its own, else the collection's.
      isSecured = (op) => {
        const auth = _.get(items[op.key], 'request.auth') || collection.auth;

        return Boolean(auth && auth.type !== 'noauth');
      },
      isIdParam = (op, param) => { return param.in === 'path' && param.name === op.idParam; },

      typeOf = (op, param) => {
        return param.in === 'body' ?
          _.get(op.requestBodySchema, ['properties', param.path.slice(1), 'type']) :
          _.get(_.find(op.params, { in: param.in, name: param.name }), 'schema.type');
      },

      // A write whose path ids aren't all linked would hit the spec's example ids, which on a
      // shared environment can be someone else's data.
      isUnsafeWrite = (op) => {
        const linked = usesOf(op).filter(({ param }) => { return param.in === 'path'; })
          .map(({ param }) => { return param.name; });

        return op.method !== 'GET' && op.params.some((p) => { return p.in === 'path' && !linked.includes(p.name); });
      },

      savesFor = (op) => {
        return bindings.filter((binding) => { return _.get(binding, 'producer.operation') === op.key; })
          .map((binding) => {
            return { variable: binding.variable, status: String(binding.producer.status),
              path: toLodashPath(binding.producer.value.replace(/^\$response\.body#/, '')) };
          });
      },

      copy = (op, stepId, name) => {
        if (isUnsafeWrite(op)) {
          if (!skipped.includes(op.key)) { skipped.push(op.key); }

          return null;
        }
        if (!items[op.key]) { return null; }

        const item = _.cloneDeep(items[op.key]);

        item.id = `ct-${hash(stepId)}`;
        item.name = name;
        delete item.response;

        return item;
      },

      // Wires each consumed parameter to the variable `variableFor` returns (null skips it).
      wire = (item, op, variableFor) => {
        return usesOf(op).map(({ binding, param }) => {
          const variable = variableFor(binding, param);

          if (variable) { useVariable(item.request, param, variable, typeOf(op, param)); }

          return variable;
        }).filter(Boolean);
      },

      withEvents = (item, prerequest, test) => {
        item.event = [event('prerequest', prerequest), event('test', test)]
          .filter((e) => { return e.script.exec.length; });

        return item;
      };

    _.forEach(flows, (stepIds, resource) => {
      const flowItems = [];

      stepIds.forEach((stepId) => {
        const [operationId, variant] = stepId.split(':'),
          op = opsById[operationId],
          expect404 = variant === 'expect-404',
          item = op && copy(op, stepId, `${++step}. ${op.method} ${op.path}${expect404 ? ' (expect 404)' : ''}`);

        if (!item) { return; }

        const needs = wire(item, op, (binding, param) => {
            return expect404 && isIdParam(op, param) ? `deleted_${variableOf(binding)}` : variableOf(binding);
          }),
          deletedIds = usesOf(op).filter(({ param }) => { return isIdParam(op, param); })
            .map(({ binding }) => { return binding.variable; });

        flowItems.push(withEvents(item, scripts.guard(needs), testExec(item).concat(
          scripts.save(expect404 ? [] : savesFor(op)),
          op.role === 'delete' ? scripts.markDeleted(deletedIds) : [],
          expect404 ? scripts.expectGone : []
        )));
      });

      if (flowItems.length) { folders.push({ name: resource, item: flowItems }); }
    });

    // Alphabetical, like the flows, so the negative checks don't depend on spec order either.
    operations.slice().sort((a, b) => { return a.key.localeCompare(b.key); }).forEach((op) => {
      if (isSecured(op) && (op.role === 'read' || op.role === 'list')) {
        const item = copy(op, `${op.operationId}:no-auth`, `${op.method} ${op.path} without a token`);

        if (item) {
          item.request.auth = { type: 'noauth' };
          negatives.push(withEvents(item, [], scripts.expectNoTokenRejected));
        }
      }

      if (op.role === 'create') {
        _.get(op.requestBodySchema, 'required', []).forEach((field) => {
          const item = copy(op, `${op.operationId}:missing-${field}`, `${op.method} ${op.path} without "${field}"`);

          if (!item) { return; }

          const needs = wire(item, op, (binding, param) => {
            return param.in === 'body' && param.path === `/${field}` ? null : variableOf(binding);
          });

          removeBodyField(item.request, field);
          negatives.push(withEvents(item, scripts.guard(needs), scripts.expectMissingFieldRejected(field)));
        });
      }
    });

    if (negatives.length) { folders.push({ name: 'negative checks', item: negatives }); }

    return { folder: { name: CONTRACT_FOLDER, item: folders }, skipped };
  },

  /**
   * Builds the output collection.
   *
   * @param {Object} options - options
   * @param {Object} options.collection - converter output
   * @param {Object[]} options.operations - operations
   * @param {Object[]} options.bindings - active bindings
   * @param {Object} options.flows - run order from buildFlows
   * @param {String} options.seed - seed for stable ids (the spec hash)
   * @param {Object} [options.authHeader] - { name, variable }: send this header on every request
   * @returns {Object} { collection, skipped }: skipped lists writes left out for safety
   */
  buildCollection = ({ collection, operations, bindings, flows, seed, authHeader }) => {
    if (authHeader) {
      // Collection-level API key auth; drop same-named request headers the spec declares as placeholders.
      collection = _.cloneDeep(collection);
      collection.auth = { type: 'apikey', apikey: [
        { key: 'key', value: authHeader.name, type: 'string' },
        { key: 'value', value: `{{${authHeader.variable}}}`, type: 'string' },
        { key: 'in', value: 'header', type: 'string' }
      ] };
      flattenItems(collection.item).forEach((item) => {
        item.request.header = _.reject(item.request.header, (h) => {
          return h.key.toLowerCase() === authHeader.name.toLowerCase();
        });
        if (item.request.auth && item.request.auth.type !== 'noauth') { delete item.request.auth; }
      });
    }

    const { folder, skipped } = buildContractFolder({ collection, operations, bindings, flows }),
      variables = (collection.variable || []).concat(bindings
        .filter((binding) => { return !_.get(binding, 'producer.environment'); })
        .map((binding) => { return { key: binding.variable, value: '' }; }));

    return {
      collection: stabilizeIds(Object.assign({}, collection, {
        item: [folder],
        variable: _.uniqBy(variables, 'key')
      }), seed),
      skipped
    };
  };

module.exports = { CONTRACT_FOLDER, buildCollection };
