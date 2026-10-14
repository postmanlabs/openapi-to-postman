// Bindings lock: accepted producer -> consumer links. A saved link is reused as-is instead of being
// inferred again, so a change elsewhere in the spec can't quietly change it. Reading and writing
// the lock file is left to the caller; this module only works on the lock object.
const _ = require('lodash'),
  { producedFields, consumedValues, consumerParam, paramKey, consumerKey, fieldKey, fingerprintOf, inferBindings } =
    require('./bindings'),
  { buildFlows } = require('./order'),

  LOCK_VERSION = 1,

  // Returns why a saved binding no longer fits the spec, or null if it still does.
  staleReason = (binding, ops, fields, consumers) => {
    const producer = binding.producer || {},
      pointer = _.get((/^\$response\.body#(.*)$/).exec(producer.value || ''), 1),
      field = fields[fieldKey(producer.operation, producer.status, pointer)];

    if (!producer.environment && !ops[producer.operation]) { return `producer ${producer.operation} no longer exists`; }
    if (!producer.environment && !field) { return `${producer.operation} no longer returns ${producer.value}`; }

    for (const consumer of binding.consumers || []) {
      const current = consumers[paramKey(consumer.operation, consumer.param)];

      if (!current) { return `consumer ${paramKey(consumer.operation, consumer.param)} no longer exists`; }
      if (field && binding.source !== 'user' && consumer.fingerprint &&
          fingerprintOf(field, current) !== consumer.fingerprint) {
        return `type of ${producer.value} or ${consumer.param.name || consumer.param.path} changed`;
      }
    }

    return null;
  },

  unresolvedRef = (operation, param, reason) => { return { operation, param, reason, fallback: 'example' }; },

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
            return !producer || at(producer) < at(consumer.operation);
          });

        late.forEach((consumer) => {
          blocked.push(unresolvedRef(consumer.operation, consumer.param,
            `${producer} runs after this request (dependency cycle)`));
        });

        return late.length ? Object.assign({}, binding, { consumers: ok }) : binding;
      });

    return { runnable, blocked };
  },

  /**
   * Combines a saved lock with fresh inference for anything it doesn't cover.
   *
   * Saved bindings that still fit are kept; those that don't are marked stale and their consumers
   * are inferred again. A new consumer whose producer is already saved joins that binding.
   *
   * @param {Object} options - options
   * @param {String} options.title - API title, recorded in the lock
   * @param {String} options.specHash - hash of the operations, recorded in the lock
   * @param {Object[]} options.operations - operations
   * @param {Object} [options.lock] - saved lock
   * @returns {Object} { bindings: the runnable part of the active bindings, flows, lock, summary }
   */
  reconcile = ({ title, specHash, operations, lock }) => {
    if (lock && lock.lockfileVersion !== LOCK_VERSION) {
      throw new Error(`Unsupported lockfileVersion ${lock.lockfileVersion}`);
    }

    const ops = _.keyBy(operations, 'key'),
      fields = _.keyBy(_.flatMap(operations, producedFields), (field) => {
        return fieldKey(field.op.key, field.status, field.pointer);
      }),
      allConsumers = _.flatMap(operations, consumedValues),
      consumers = _.keyBy(allConsumers, consumerKey),
      covered = new Set(),
      kept = [],
      stale = [],
      added = [],
      extended = [];

    _.cloneDeep(_.get(lock, 'bindings') || []).forEach((binding) => {
      if (binding.status === 'stale') { return stale.push(binding); }

      const reason = staleReason(binding, ops, fields, consumers);

      if (reason) { return stale.push(Object.assign({}, binding, { status: 'stale', staleReason: reason })); }

      kept.push(binding);
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
        return binding.consumers.forEach((consumer) => {
          existing.consumers.push(Object.assign({}, consumer, { pending: true }));
          extended.push({ variable: existing.variable, consumer });
        });
      }

      let name = binding.variable,
        n = 2;

      while (taken.has(name)) { name = `${binding.variable}_${n++}`; }
      taken.add(name);
      added.push(Object.assign({ id: name }, binding, { variable: name }));
    });

    const active = kept.concat(added),
      flows = buildFlows(operations, active),
      { runnable, blocked } = dropUnorderedConsumers(active, flows, ops),
      sortKey = (binding) => {
        return _.get(binding, 'producer.operation') || `~env ${_.get(binding, 'producer.environment', '')}`;
      },
      unresolvedRefs = unresolved.map((consumer) => {
        return unresolvedRef(consumer.op.key, consumerParam(consumer), 'no response returns a matching value');
      }).concat(blocked);

    return {
      bindings: runnable,
      flows,
      lock: {
        lockfileVersion: LOCK_VERSION,
        spec: { title, hash: specHash },
        bindings: active.concat(stale).sort((a, b) => {
          return sortKey(a).localeCompare(sortKey(b)) || a.variable.localeCompare(b.variable);
        }),
        flows,
        unresolved: unresolvedRefs
      },
      summary: { unchanged: kept.length, added, extended, stale, unresolved: unresolvedRefs }
    };
  };

module.exports = { reconcile };
