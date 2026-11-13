// Builds the contract-test requests from the converter's output: one numbered list in run order,
// wired with the links, then no-token checks, missing-field checks and a children-first teardown.
const _ = require('lodash'),
  { hash, flattenItems, requestKey, itemKey, toLodashPath } = require('./utils'),
  scripts = require('./scripts'),

  SAVED_REASON = 'the request that saves it did not succeed',
  INPUT_REASON = 'no request returns it: set it as a collection variable',

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

  // Points a path, query, header or top-level body parameter at `{{variable}}`. Returns false when
  // the request has no place for it (e.g. an XML body), so the example value would be sent instead.
  useVariable = (request, param, variable, type) => {
    const value = `{{${variable}}}`;

    if (param.in === 'path') {
      const entry = _.find(request.url.variable, { key: param.name }),
        inline = `{{${param.name}}}`;

      if (entry) {
        entry.value = value;

        return true;
      }
      if (!_.some(request.url.path, (segment) => { return segment.includes(inline); })) { return false; }

      // Written inline as `{{petId}}` (before a custom method such as `:verify`).
      request.url.path = _.map(request.url.path, (segment) => { return segment.split(inline).join(value); });
      if (typeof request.url.raw === 'string') { request.url.raw = request.url.raw.split(inline).join(value); }

      return true;
    }
    if (param.in === 'query' || param.in === 'header') {
      const list = param.in === 'query' ? (request.url.query = request.url.query || []) :
          (request.header = request.header || []),
        prefix = _.get((/^(.+)id$/i).exec(param.name), 1),
        // `entityId` means nothing without its `entityType` sibling, so send that too.
        siblingKey = prefix && `${prefix}type`.toLowerCase(),
        sibling = siblingKey && _.find(list, (entry) => { return entry.key.toLowerCase() === siblingKey; });

      setEntry(list, param.name, value, param.in === 'header');
      if (sibling) { sibling.disabled = false; }

      return true;
    }

    const mode = _.get(request, 'body.mode');

    if (mode === 'urlencoded' || mode === 'formdata') {
      setEntry(request.body[mode] = request.body[mode] || [], param.path.slice(1), value);

      return true;
    }
    if (mode !== 'raw') { return false; }

    const placeholder = `__CT_VAR__${variable}__`;

    try {
      request.body.raw = JSON.stringify(_.set(JSON.parse(request.body.raw), toLodashPath(param.path), placeholder),
        null, 2).replace(`"${placeholder}"`, !type || type === 'string' ? `"${value}"` : value);

      return true;
    }
    catch (e) { return false; }
  },

  removeBodyField = (request, field) => {
    try { request.body.raw = JSON.stringify(_.omit(JSON.parse(request.body.raw), field), null, 2); }
    catch (e) { /* non-JSON body: nothing to remove */ }
  },

  // Optional query and header parameters are not sent; wiring a link re-enables one. Headers the
  // caller asked for (`keepHeaders`, lower case) are always sent.
  disableOptionalParams = (item, op, keepHeaders) => {
    const optional = (location) => {
      const names = _(op.params).filter({ in: location, required: false })
        .map((p) => { return p.name.toLowerCase(); })
        .filter((name) => { return location !== 'header' || !keepHeaders.includes(name); }).value();

      return (entry) => { return names.includes(entry.key.toLowerCase()); };
    };

    _.filter(item.request.url.query, optional('query'))
      .concat(_.filter(item.request.header, optional('header')))
      .forEach((entry) => { entry.disabled = true; });
  },

  // Sends the caller's headers on every request, replacing same-named headers from the spec. Credential
  // headers also replace the spec's own auth.
  applyHeaders = (collection, headers) => {
    const result = _.cloneDeep(collection),
      names = headers.map((header) => { return header.name.toLowerCase(); }),
      hasCredential = _.some(headers, 'credential');

    if (hasCredential) { delete result.auth; }
    flattenItems(result.item).forEach((item) => {
      item.request.header = _.reject(item.request.header, (entry) => {
        return names.includes(entry.key.toLowerCase());
      }).concat(headers.map((header) => { return { key: header.name, value: header.value }; }));
      if (hasCredential && item.request.auth && item.request.auth.type !== 'noauth') { delete item.request.auth; }
    });

    return result;
  },

  // Fixed collection id for a spec, so regenerating gives the same collection.
  uuidFrom = (seed) => {
    const h = hash(seed, 32);

    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20)}`;
  },

  buildRequests = ({ collection, operations, links, flows, headers }) => {
    const items = _.keyBy(flattenItems(collection.item), itemKey),
      opsById = _.keyBy(operations, 'operationId'),
      uses = _.groupBy(_.flatMap(links, (link) => {
        return _.map(link.consumers, (consumer) => { return Object.assign({ link }, consumer); });
      }), 'operation'),
      inputs = new Set(_.map(_.filter(links, { producer: null }), 'variable')),
      // Alphabetical, like the flows, so the negative checks don't depend on spec order either.
      sortedOperations = operations.slice().sort((a, b) => { return a.key.localeCompare(b.key); }),
      unapplied = [],
      requests = [];

    const usesOf = (op) => { return uses[op.key] || []; },

      itemOf = (op) => { return items[requestKey(op.method, op.path)]; },

      // Lodash path of a `$response.body#` value.
      savePath = (link) => { return toLodashPath(link.producer.value.replace(/^\$response\.body#/, '')); },

      headerNames = headers.map((header) => { return header.name.toLowerCase(); }),
      credentialNames = _.filter(headers, 'credential').map((header) => { return header.name.toLowerCase(); }),

      // The auth the request actually sends: its own, else the collection's, or a credential header.
      isSecured = (op) => {
        const auth = _.get(itemOf(op), 'request.auth') || collection.auth;

        return Boolean(auth && auth.type !== 'noauth') || credentialNames.length > 0;
      },

      // A copy of the operation's request wired to the variables `variableFor` picks (null leaves a
      // parameter alone). Null when a linked value can't be put into the request (reported in `unapplied`).
      prepare = (op, variableFor) => {
        if (!itemOf(op)) { return null; }

        const item = _.cloneDeep(itemOf(op));

        disableOptionalParams(item, op, headerNames);
        delete item.response;

        const wired = usesOf(op).map(({ link, param }) => {
          const variable = variableFor(link, param);

          if (!variable) { return null; }
          if (useVariable(item.request, param, variable, typeOf(op, param))) { return variable; }
          unapplied.push({ operation: op.key, param, variable });

          return false;
        });

        return wired.includes(false) ? null : { item, needs: _.compact(wired) };
      },

      // Numbered only once included, so left-out requests leave no gaps.
      add = ({ item, needs }, stepId, label, test, skipReason) => {
        item.id = `ct-${hash(stepId)}`;
        item.name = `${requests.length + 1}. ${label}`;
        requests.push(withEvents(item, scripts.guard(_.zipObject(needs, needs.map((variable) => {
          return skipReason || (inputs.has(variable) ? INPUT_REASON : SAVED_REASON);
        })), needs.filter((variable) => { return inputs.has(variable); })), test));
      },

      savesFor = (op) => {
        return links.filter((link) => { return _.get(link, 'producer.operation') === op.key; })
          .map((link) => { return { variable: link.variable, path: savePath(link) }; });
      },

      // The delete that removes what `op` creates, and where its id is in the create response.
      cleanupFor = (op) => {
        const del = _.find(operations, (other) => {
            return other.role === 'delete' && other.resource === op.resource && other.collectionPath === op.path;
          }),
          use = del && _.find(usesOf(del), ({ link, param }) => {
            return isIdParam(del, param) && _.get(link, 'producer.operation') === op.key;
          });

        return use ? { op: del, variable: `leaked_${use.link.variable}`, path: savePath(use.link) } : null;
      },

      flowStep = (stepId) => {
        const [operationId, variant] = stepId.split(':'),
          op = opsById[operationId],
          expect404 = variant === 'expect-404',
          prepared = op && prepare(op, (link, param) => {
            return expect404 && isIdParam(op, param) ? `deleted_${link.variable}` : link.variable;
          });

        if (!prepared) { return; }

        const deletedIds = usesOf(op).filter(({ param }) => { return isIdParam(op, param); })
          .map(({ link }) => { return link.variable; });

        add(prepared, stepId, `${op.method} ${op.path}${expect404 ? ' (expect 404)' : ''}`, testExec(prepared.item)
          .concat(
            expect404 ? scripts.expectGone : scripts.expectSuccess,
            scripts.save(expect404 ? [] : savesFor(op)),
            op.role === 'delete' ? scripts.markDeleted(deletedIds) : []
          ));
      },

      // While the resources still exist, with the real ids, so a rejection can only be about the token.
      noTokenCheck = (op) => {
        const prepared = prepare(op, (link) => { return link.variable; });

        if (!prepared) { return; }

        prepared.item.request.auth = { type: 'noauth' };
        prepared.item.request.header = _.reject(prepared.item.request.header, (entry) => {
          return credentialNames.includes(entry.key.toLowerCase());
        });
        add(prepared, `${op.operationId}:no-auth`, `${op.method} ${op.path} without a token`,
          scripts.expectNoTokenRejected);
      },

      // Before the teardown, so parent ids still exist. If the API wrongly creates the resource,
      // the next request deletes it.
      missingFieldChecks = (op) => {
        const cleanup = cleanupFor(op);

        _.get(op.requestBodySchema, 'required', []).forEach((field) => {
          const stepId = `${op.operationId}:missing-${field}`,
            prepared = prepare(op, (link, param) => {
              return param.in === 'body' && param.path === `/${field}` ? null : link.variable;
            }),
            deletion = prepared && cleanup && prepare(cleanup.op, (link, param) => {
              return isIdParam(cleanup.op, param) ? cleanup.variable : link.variable;
            });

          if (!prepared) { return; }

          removeBodyField(prepared.item.request, field);
          add(prepared, stepId, `${op.method} ${op.path} without "${field}"`, scripts.expectMissingFieldRejected(field)
            .concat(deletion ? scripts.captureCreated(cleanup.variable, cleanup.path) : []));
          if (deletion) {
            add(deletion, `${stepId}:cleanup`, `${cleanup.op.method} ${cleanup.op.path} (clean up if created)`,
              scripts.clear(cleanup.variable), 'nothing was created');
          }
        });
      };

    _.flatten(_.values(_.omit(flows, 'teardown'))).forEach(flowStep);
    sortedOperations.filter((op) => { return op.method === 'GET' && isSecured(op); }).forEach(noTokenCheck);
    _.filter(sortedOperations, { role: 'create' }).forEach(missingFieldChecks);
    _.forEach(flows.teardown, flowStep);

    return { requests, unapplied: _.uniqWith(unapplied, _.isEqual) };
  },

  /**
   * Builds the output collection.
   *
   * @param {Object} options - options
   * @param {Object} options.collection - converter output
   * @param {Object[]} options.operations - operations
   * @param {Object[]} options.links - links; one with a null producer is an input, declared as an empty
   *   collection variable
   * @param {Object} options.flows - run order from buildFlows
   * @param {String} options.seed - seed for the collection id (the spec hash)
   * @param {Object[]} [options.headers] - { name, value, credential }: sent on every request; credential
   *   headers are left out of the no-token checks
   * @returns {Object} { collection, unapplied }: unapplied lists linked values a request has no place for
   *   ({ operation, param, variable }); those requests are left out
   */
  buildCollection = ({ collection, operations, links, flows, seed, headers = [] }) => {
    const source = headers.length ? applyHeaders(collection, headers) : collection,
      { requests, unapplied } = buildRequests({ collection: source, operations, links, flows, headers }),
      variables = (source.variable || []).concat(_.filter(links, { producer: null })
        .map((link) => { return { key: link.variable, value: '' }; })),
      info = Object.assign({}, source.info, { _postman_id: uuidFrom(seed) });

    return { collection: Object.assign({}, source, { info, item: requests, variable: _.uniqBy(variables, 'key') }),
      unapplied };
  };

module.exports = { buildCollection };
