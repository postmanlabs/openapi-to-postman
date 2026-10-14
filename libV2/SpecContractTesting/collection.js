// Builds the contract-test requests from the converter's output: one numbered list in run order,
// wired with the bindings, then no-token checks, a children-first teardown and missing-field checks.
const _ = require('lodash'),
  { hash, flattenItems, itemKey, toLodashPath } = require('./utils'),
  scripts = require('./scripts'),

  UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,

  // Values from the environment use the environment variable's name.
  variableOf = (binding) => { return _.get(binding, 'producer.environment') || binding.variable; },

  isIdParam = (op, param) => { return param.in === 'path' && param.name === op.idParam; },

  typeOf = (op, param) => {
    return param.in === 'body' ?
      _.get(op.requestBodySchema, ['properties', param.path.slice(1), 'type']) :
      _.get(_.find(op.params, { in: param.in, name: param.name }), 'schema.type');
  },

  withEvents = (item, prerequest, test) => {
    item.event = [['prerequest', prerequest], ['test', test]]
      .filter(([, exec]) => { return exec.length; })
      .map(([listen, exec]) => { return { listen, script: { type: 'text/javascript', exec } }; });

    return item;
  },

  testExec = (item) => { return [].concat(_.get(_.find(item.event, { listen: 'test' }), 'script.exec', [])); },

  setEntry = (list, key, value, ignoreCase) => {
    const entry = _.find(list, (candidate) => {
      return ignoreCase ? candidate.key.toLowerCase() === key.toLowerCase() : candidate.key === key;
    });

    if (entry) { Object.assign(entry, { value, disabled: false }); }
    else { list.push({ key, value }); }
  },

  // Points a path, query, header or top-level body parameter at `{{variable}}`.
  useVariable = (request, param, variable, type) => {
    const value = `{{${variable}}}`;

    if (param.in === 'path') {
      const entry = _.find(request.url.variable, { key: param.name }),
        inline = `{{${param.name}}}`;

      if (entry) { entry.value = value; }
      else {
        // Written inline as `{{petId}}` (before a custom method such as `:verify`).
        request.url.path = _.map(request.url.path, (segment) => { return segment.split(inline).join(value); });
        if (typeof request.url.raw === 'string') { request.url.raw = request.url.raw.split(inline).join(value); }
      }
    }
    else if (param.in === 'query' || param.in === 'header') {
      const list = param.in === 'query' ? (request.url.query = request.url.query || []) :
          (request.header = request.header || []),
        prefix = _.get((/^(.+)id$/i).exec(param.name), 1),
        // `entityId` means nothing without its `entityType` sibling, so send that too.
        siblingKey = prefix && `${prefix}type`.toLowerCase(),
        sibling = siblingKey && _.find(list, (entry) => { return entry.key.toLowerCase() === siblingKey; });

      setEntry(list, param.name, value, param.in === 'header');
      if (sibling) { sibling.disabled = false; }
    }
    else if (param.in === 'body' && _.get(request, 'body.raw')) {
      const placeholder = `__CT_VAR__${variable}__`;

      try {
        request.body.raw = JSON.stringify(_.set(JSON.parse(request.body.raw), toLodashPath(param.path), placeholder),
          null, 2).replace(`"${placeholder}"`, !type || type === 'string' ? `"${value}"` : value);
      }
      catch (e) { /* non-JSON body: keep the example value */ }
    }
  },

  removeBodyField = (request, field) => {
    try { request.body.raw = JSON.stringify(_.omit(JSON.parse(request.body.raw), field), null, 2); }
    catch (e) { /* non-JSON body: nothing to remove */ }
  },

  // Optional query and header parameters are not sent; wiring a binding re-enables one.
  disableOptionalParams = (item, op) => {
    const optional = (location) => {
      const names = _(op.params).filter({ in: location, required: false })
        .map((p) => { return p.name.toLowerCase(); }).value();

      return (entry) => { return names.includes(entry.key.toLowerCase()); };
    };

    _.filter(item.request.url.query, optional('query'))
      .concat(_.filter(item.request.header, optional('header')))
      .forEach((entry) => { entry.disabled = true; });
  },

  // Collection-level API key auth; drops same-named request headers the spec declares as placeholders.
  applyAuthHeader = (collection, authHeader) => {
    const result = _.cloneDeep(collection);

    result.auth = { type: 'apikey', apikey: [
      { key: 'key', value: authHeader.name, type: 'string' },
      { key: 'value', value: `{{${authHeader.variable}}}`, type: 'string' },
      { key: 'in', value: 'header', type: 'string' }
    ] };
    flattenItems(result.item).forEach((item) => {
      item.request.header = _.reject(item.request.header, (h) => {
        return h.key.toLowerCase() === authHeader.name.toLowerCase();
      });
      if (item.request.auth && item.request.auth.type !== 'noauth') { delete item.request.auth; }
    });

    return result;
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

  buildRequests = ({ collection, operations, bindings, flows }) => {
    const items = _.keyBy(flattenItems(collection.item), itemKey),
      opsById = _.keyBy(operations, 'operationId'),
      uses = _.groupBy(_.flatMap(bindings, (binding) => {
        return _.map(binding.consumers, (consumer) => { return Object.assign({ binding }, consumer); });
      }), 'operation'),
      // Alphabetical, like the flows, so the negative checks don't depend on spec order either.
      sortedOperations = operations.slice().sort((a, b) => { return a.key.localeCompare(b.key); }),
      skipped = [],
      requests = [];
    let step = 0;

    const usesOf = (op) => { return uses[op.key] || []; },

      // The auth the request actually sends: its own, else the collection's.
      isSecured = (op) => {
        const auth = _.get(items[op.key], 'request.auth') || collection.auth;

        return Boolean(auth && auth.type !== 'noauth');
      },

      // A request whose path ids aren't all linked would use the spec's example ids: on a shared
      // environment a write could hit someone else's data, and a read tests nothing.
      hasUnlinkedPathId = (op) => {
        const linked = usesOf(op).filter(({ param }) => { return param.in === 'path'; })
          .map(({ param }) => { return param.name; });

        return op.params.some((p) => { return p.in === 'path' && !linked.includes(p.name); });
      },

      // Numbered only once included, so skipped requests leave no gaps.
      copy = (op, stepId, label) => {
        if (hasUnlinkedPathId(op)) {
          skipped.push(op.key);

          return null;
        }
        if (!items[op.key]) { return null; }

        const item = _.cloneDeep(items[op.key]);

        disableOptionalParams(item, op);
        item.id = `ct-${hash(stepId)}`;
        item.name = `${++step}. ${label}`;
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

      savesFor = (op) => {
        return bindings.filter((binding) => { return _.get(binding, 'producer.operation') === op.key; })
          .map((binding) => {
            return { variable: binding.variable, status: String(binding.producer.status),
              path: toLodashPath(binding.producer.value.replace(/^\$response\.body#/, '')) };
          });
      },

      flowStep = (stepId) => {
        const [operationId, variant] = stepId.split(':'),
          op = opsById[operationId],
          expect404 = variant === 'expect-404',
          item = op && copy(op, stepId, `${op.method} ${op.path}${expect404 ? ' (expect 404)' : ''}`);

        if (!item) { return; }

        const needs = wire(item, op, (binding, param) => {
            return expect404 && isIdParam(op, param) ? `deleted_${variableOf(binding)}` : variableOf(binding);
          }),
          deletedIds = usesOf(op).filter(({ param }) => { return isIdParam(op, param); })
            .map(({ binding }) => { return binding.variable; });

        requests.push(withEvents(item, scripts.guard(needs), testExec(item).concat(
          scripts.save(expect404 ? [] : savesFor(op)),
          op.role === 'delete' ? scripts.markDeleted(deletedIds) : [],
          expect404 ? scripts.expectGone : []
        )));
      };

    _.flatten(_.values(_.omit(flows, 'teardown'))).forEach(flowStep);

    // No-token checks run while the resources still exist, with the real ids, so a rejection can
    // only be about the missing token.
    sortedOperations.filter((op) => { return op.method === 'GET' && isSecured(op); }).forEach((op) => {
      const item = copy(op, `${op.operationId}:no-auth`, `${op.method} ${op.path} without a token`);

      if (item) {
        item.request.auth = { type: 'noauth' };
        requests.push(withEvents(item, scripts.guard(wire(item, op, variableOf)), scripts.expectNoTokenRejected));
      }
    });

    _.forEach(flows.teardown, flowStep);

    _.filter(sortedOperations, { role: 'create' }).forEach((op) => {
      _.get(op.requestBodySchema, 'required', []).forEach((field) => {
        const item = copy(op, `${op.operationId}:missing-${field}`, `${op.method} ${op.path} without "${field}"`);

        if (!item) { return; }

        const needs = wire(item, op, (binding, param) => {
          return param.in === 'body' && param.path === `/${field}` ? null : variableOf(binding);
        });

        removeBodyField(item.request, field);
        requests.push(withEvents(item, scripts.guard(needs), scripts.expectMissingFieldRejected(field)));
      });
    });

    return { requests, skipped: _.uniq(skipped) };
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
   * @returns {Object} { collection, skipped }: skipped lists requests left out because a path id
   *   couldn't be linked
   */
  buildCollection = ({ collection, operations, bindings, flows, seed, authHeader }) => {
    const source = authHeader ? applyAuthHeader(collection, authHeader) : collection,
      { requests, skipped } = buildRequests({ collection: source, operations, bindings, flows }),
      variables = (source.variable || []).concat(bindings
        .filter((binding) => { return !_.get(binding, 'producer.environment'); })
        .map((binding) => { return { key: binding.variable, value: '' }; })),
      output = Object.assign({}, source, { item: requests, variable: _.uniqBy(variables, 'key') });

    return { collection: stabilizeIds(output, seed), skipped };
  };

module.exports = { buildCollection };
