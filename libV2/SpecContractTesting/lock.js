// Bindings lock: the links between requests, and the operations not to run. A saved link is reused
// as-is instead of being inferred again, so a change elsewhere in the spec can't quietly change it.
// Reading and writing the lock file is left to the caller; this module only works on the lock object.
//
//   lockfileVersion: 1
//   exclude:  [{ operation: METHOD /path } | { pattern: regex on "METHOD /path" }]
//   bindings: [{ variable, note?, producer, consumers: [{ operation, param }] }]
//
// `producer` is one of:
//   { operation, value: $response.body#<pointer> | $response.header.<name>, pattern? }
//   { environment: <variable> }
//   null: nothing returns the value; filling in a producer resolves it.
// `pattern` keeps the first capture group of a regex (e.g. the id at the end of a Location header).
// Any producer may also have `constant`: that value is used for every consumer instead, and the
// other fields are kept for reference only.
const _ = require('lodash'),
  { typesMatch, producedFields, consumedValues, consumerParam, paramKey, consumerKey, fieldKey, describeParam,
    placeholderVariable, inferBindings } = require('./bindings'),
  { buildFlows } = require('./order'),

  LOCK_VERSION = 1,

  /**
   * Reads the lock's `exclude` section: operations the user doesn't want to run, each given exactly
   * (`operation: POST /pets/{petId}/duplicate`) or by a regex on `METHOD /path` (`pattern: '^\w+ /x/'`).
   *
   * @param {Object} [lock] - saved lock
   * @returns {Object} { isExcluded: key -> Boolean, error } where error describes an invalid entry
   */
  readExclude = (lock) => {
    const entries = _.get(lock, 'exclude') || [],
      invalid = _.isArray(entries) ? _.find(entries, (entry) => {
        return Boolean(_.get(entry, 'operation')) === Boolean(_.get(entry, 'pattern')) ||
          _.isError(_.attempt(() => { return new RegExp(entry.pattern || ''); }));
      }) : entries;

    if (invalid !== undefined) {
      return { error: `Invalid exclude entry ${JSON.stringify(invalid)}: give either an operation or a valid pattern` };
    }

    const operations = _.compact(_.map(entries, 'operation')),
      patterns = _.compact(_.map(entries, 'pattern')).map((pattern) => { return new RegExp(pattern); });

    return {
      isExcluded: (key) => {
        return operations.includes(key) || patterns.some((pattern) => { return pattern.test(key); });
      }
    };
  },

  /**
   * A lock written for another format version can't be read. A missing version counts as the current one.
   *
   * @param {Object} [lock] - saved lock
   * @returns {String|undefined} error
   */
  versionError = (lock) => {
    const version = _.get(lock, 'lockfileVersion', LOCK_VERSION);

    return version === LOCK_VERSION ? undefined :
      `Unsupported lockfileVersion ${JSON.stringify(version)}: expected ${LOCK_VERSION}`;
  },

  hasProducer = (binding) => {
    return Boolean(_.get(binding, 'producer.operation') || _.get(binding, 'producer.environment')) ||
      _.has(binding, 'producer.constant');
  },

  /**
   * A consumer listed under two saved bindings would get two values; the user has to keep one.
   *
   * @param {Object} [lock] - saved lock
   * @returns {String|undefined} error naming the consumer and both bindings
   */
  findDuplicateConsumer = (lock) => {
    const owners = {};
    let error;

    _.filter(_.get(lock, 'bindings'), hasProducer).forEach((binding) => {
      _.forEach(binding.consumers, ({ operation, param = {} }) => {
        const key = paramKey(operation, param);

        if (owners[key] && owners[key] !== binding.variable && !error) {
          error = `${key} is listed under bindings "${owners[key]}" and "${binding.variable}": keep it in one`;
        }
        owners[key] = owners[key] || binding.variable;
      });
    });

    return error;
  },

  // Returns why a saved binding no longer fits the spec, or null if it still does. Consumers that are
  // excluded are left alone, so excluding a request doesn't break the link for the others. Query,
  // header and body values may target parameters the spec doesn't declare; a path id must exist.
  staleReason = (binding, ops, fields, excluded) => {
    const producer = binding.producer,
      pointer = _.get((/^\$response\.body#(.*)$/).exec(producer.value || ''), 1),
      field = fields[fieldKey(producer.operation, pointer)];

    // Response headers aren't described by the converter's output, so only the operation is checked.
    // A constant makes the rest of the producer a reference, so it isn't checked.
    if (producer.operation && !_.has(producer, 'constant')) {
      if (excluded.has(producer.operation)) { return `producer ${producer.operation} is excluded`; }
      if (!ops[producer.operation]) { return `producer ${producer.operation} no longer exists`; }
      if (pointer === undefined && !(/^\$response\.header\.\S+$/).test(producer.value || '')) {
        return `${producer.value} is not a $response.body# or $response.header. value`;
      }
      if (pointer !== undefined && !field) { return `${producer.operation} no longer returns ${producer.value}`; }
    }

    for (const { operation, param = {} } of binding.consumers || []) {
      const declared = ops[operation] && describeParam(ops[operation], param),
        name = param.name || param.path;

      if (excluded.has(operation)) { continue; }
      if (!ops[operation]) { return `consumer ${operation} no longer exists`; }
      if (param.in === 'path' && !declared) { return `${operation} no longer has path parameter ${name}`; }
      if (field && declared && !typesMatch(field, declared)) { return `types of ${producer.value} and ${name} differ`; }
    }

    return null;
  },

  // The lock-file form of a binding: only what a user reads or edits.
  lockEntry = (binding) => {
    const producer = binding.producer;

    return _.omitBy({
      variable: binding.variable,
      note: binding.note,
      producer: producer && _.omitBy(_.pick(producer, ['operation', 'value', 'pattern', 'environment', 'constant']),
        _.isUndefined),
      consumers: _.map(binding.consumers, (consumer) => {
        return { operation: consumer.operation, param: consumer.param };
      })
    }, _.isUndefined);
  },

  // A unique variable name, adding `_2`, `_3` on clashes.
  uniqueName = (name, taken) => {
    let candidate = name,
      n = 2;

    while (taken.has(candidate)) { candidate = `${name}_${n++}`; }
    taken.add(candidate);

    return candidate;
  },

  /**
   * Summary entry for a value that couldn't be linked. A missing path id skips the request; any other
   * value is sent with the spec's example.
   *
   * @param {String} operation - operation key
   * @param {Object} param - parameter reference
   * @param {String} reason - why it couldn't be linked
   * @param {Boolean} [skipsRequest] - whether the request is left out
   * @returns {Object} { operation, param, reason, fallback: 'skip' | 'example' }
   */
  unresolvedRef = (operation, param, reason, skipsRequest = param.in === 'path') => {
    return { operation, param, reason, fallback: skipsRequest ? 'skip' : 'example' };
  },

  /**
   * Drops consumers whose producer doesn't run before them, which only happens in a dependency
   * cycle (A needs B's id and B needs A's): the guard would skip them at run time.
   *
   * @param {Object[]} bindings - active bindings
   * @param {Object} flows - run order from buildFlows
   * @param {Object} ops - operations by key
   * @returns {Object} { runnable: bindings with only satisfiable consumers, blocked: unresolved refs }
   */
  dropUnorderedConsumers = (bindings, flows, ops) => {
    const position = {},
      blocked = [];

    _.flatten(_.values(flows)).forEach((step, index) => {
      const operationId = step.split(':')[0];

      if (!_.has(position, operationId)) { position[operationId] = index; }
    });

    const at = (operation) => { return _.get(position, _.get(ops, [operation, 'operationId']), -1); },
      runnable = bindings.map((binding) => {
        const producer = _.get(binding, 'producer.operation'),
          [ok, late] = _.partition(binding.consumers, (consumer) => {
            return !producer || !ops[consumer.operation] || at(producer) < at(consumer.operation);
          });

        late.forEach((consumer) => {
          blocked.push(unresolvedRef(consumer.operation, consumer.param,
            `${producer} runs after this request (dependency cycle)`));
        });

        return late.length ? Object.assign({}, binding, { consumers: ok }) : binding;
      });

    return { runnable, blocked };
  },

  // Operations left out because a path id has no linked value.
  skippedOperations = (operations, bindings) => {
    const linked = _.flatMap(bindings, 'consumers');

    return new Set(operations.filter((op) => {
      return op.params.some((p) => {
        return p.in === 'path' &&
          !_.some(linked, (c) => { return c.operation === op.key && _.get(c, 'param.name') === p.name; });
      });
    }).map((op) => { return op.key; }));
  },

  /**
   * Drops consumers whose producer is skipped (one of its own path ids is unresolved), repeating
   * until nothing changes, so every skip is reported here rather than found at run time.
   *
   * @param {Object[]} bindings - bindings
   * @param {Object[]} operations - operations to run
   * @param {Object[]} [blocked=[]] - unresolved refs found so far
   * @returns {Object} { runnable: bindings without those consumers, blocked: unresolved refs }
   */
  dropSkippedProducers = (bindings, operations, blocked = []) => {
    const ops = _.keyBy(operations, 'key'),
      skipped = skippedOperations(operations, bindings),
      runnable = bindings.map((binding) => {
        const producer = _.get(binding, 'producer.operation');

        if (!skipped.has(producer) || !binding.consumers.length) { return binding; }
        binding.consumers.filter((c) => { return ops[c.operation]; }).forEach((c) => {
          blocked.push(unresolvedRef(c.operation, c.param, `${producer} is skipped (it needs an unresolved value)`));
        });

        return Object.assign({}, binding, { consumers: [] });
      });

    return _.isEqual(runnable, bindings) ? { runnable, blocked } : dropSkippedProducers(runnable, operations, blocked);
  },

  /**
   * Combines a saved lock with fresh inference for anything it doesn't cover.
   *
   * Saved bindings that still fit are kept; those that don't are dropped (reported in `stale`) and
   * their consumers inferred again. A new consumer whose producer is already saved joins that binding.
   * Values nothing returns are written as bindings with `producer: null`, grouped by variable name.
   *
   * @param {Object} options - options
   * @param {Object[]} options.operations - operations to run
   * @param {Set<String>} options.excluded - keys of the operations the lock excludes
   * @param {Object} [options.lock] - saved lock
   * @returns {Object} { bindings: the runnable part of the active bindings, flows, lock, summary }
   */
  reconcile = ({ operations, excluded, lock }) => {
    const ops = _.keyBy(operations, 'key'),
      fields = _.keyBy(_.flatMap(operations, producedFields), (field) => {
        return fieldKey(field.op.key, field.pointer);
      }),
      allConsumers = _.flatMap(operations, consumedValues),
      covered = new Set(),
      kept = [],
      stale = [],
      added = [],
      extended = [];

    _.cloneDeep(_.filter(_.get(lock, 'bindings'), hasProducer)).forEach((binding) => {
      const reason = staleReason(binding, ops, fields, excluded);

      if (reason) { return stale.push(Object.assign(lockEntry(binding), { staleReason: reason })); }

      kept.push(lockEntry(binding));
      binding.consumers.forEach((consumer) => { covered.add(paramKey(consumer.operation, consumer.param)); });
    });

    const { bindings: inferred, unresolved } = inferBindings(operations,
        allConsumers.filter((consumer) => { return !covered.has(consumerKey(consumer)); })),
      taken = new Set(_.map(kept, 'variable'));

    inferred.forEach((binding) => {
      const existing = _.find(kept, (candidate) => {
        return candidate.producer.operation === binding.producer.operation &&
          candidate.producer.value === binding.producer.value;
      });

      if (existing) {
        existing.consumers.push(...binding.consumers);
        binding.consumers.forEach((consumer) => { extended.push({ variable: existing.variable, consumer }); });

        return;
      }
      added.push(Object.assign({}, binding, { variable: uniqueName(binding.variable, taken) }));
    });

    const active = kept.concat(added),
      // What the run uses: a binding with a constant has no producer request to wait for or save from.
      runtime = active.map((binding) => {
        return _.has(binding.producer, 'constant') ?
          Object.assign({}, binding, { producer: { constant: binding.producer.constant } }) : binding;
      }),
      flows = buildFlows(operations, runtime),
      ordered = dropUnorderedConsumers(runtime, flows, ops),
      { runnable, blocked } = dropSkippedProducers(ordered.runnable, operations),
      // Environment and constant producers first ('~' sorts before letters), then response producers by operation.
      sortKey = (binding) => { return _.get(binding, 'producer.operation') || '~'; },
      placeholders = _(unresolved).groupBy(placeholderVariable).toPairs().sortBy(0).map(([variable, consumers]) => {
        return { variable: uniqueName(variable, taken), producer: null, consumers: consumers.map((consumer) => {
          return { operation: consumer.op.key, param: consumerParam(consumer) };
        }) };
      }).value(),
      unresolvedRefs = unresolved.map((consumer) => {
        return unresolvedRef(consumer.op.key, consumerParam(consumer), 'no response returns a matching value');
      }).concat(ordered.blocked, blocked);

    return {
      bindings: runnable,
      flows,
      lock: {
        lockfileVersion: LOCK_VERSION,
        exclude: _.cloneDeep(_.get(lock, 'exclude') || []),
        bindings: active.slice().sort((a, b) => {
          return sortKey(a).localeCompare(sortKey(b)) || a.variable.localeCompare(b.variable);
        }).map(lockEntry).concat(placeholders)
      },
      summary: { unchanged: kept.length, added, extended, stale, unresolved: unresolvedRefs }
    };
  };

module.exports = { versionError, readExclude, findDuplicateConsumer, unresolvedRef, reconcile };
