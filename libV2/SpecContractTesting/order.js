const _ = require('lodash'),
  { ROLE_RANK } = require('./operations'),

  /**
   * Builds the run order.
   *
   * 1. Resources linked to another resource run first, in dependency order (Kahn's algorithm,
   *    alphabetical among those ready). Unlinked resources follow, alphabetically.
   * 2. Within a resource: create, list, read, update, other; then path and method.
   * 3. Deletes move to a final `teardown`, children before parents, each followed by a read that
   *    expects 404.
   *
   * Spec order is never used, so the same API always gives the same order.
   *
   * @param {Object[]} operations - operations
   * @param {Object[]} bindings - links
   * @returns {Object} resource -> step ids (`operationId` or `operationId:expect-404`), plus `teardown`
   */
  buildFlows = (operations, bindings) => {
    const byKey = _.keyBy(operations, 'key'),
      resources = _.uniq(operations.map((op) => { return op.resource; })),
      deps = _.zipObject(resources, resources.map(() => { return new Set(); })),
      ordered = [],
      flows = {},
      teardown = [];

    bindings.forEach((binding) => {
      const producer = byKey[_.get(binding, 'producer.operation')];

      binding.consumers.forEach((consumer) => {
        const op = byKey[consumer.operation];

        if (producer && op && op.resource !== producer.resource) { deps[op.resource].add(producer.resource); }
      });
    });

    const linked = new Set(_.flatMap(resources, (resource) => {
        return deps[resource].size ? [resource, ...deps[resource]] : [];
      })),
      remaining = resources.filter((resource) => { return linked.has(resource); }).sort();

    while (remaining.length) {
      // First ready resource; on a cycle, the first remaining one (dropUnorderedConsumers reports the links
      // this breaks).
      const next = remaining.find((resource) => {
        return [...deps[resource]].every((dep) => { return ordered.includes(dep); });
      }) || remaining[0];

      ordered.push(next);
      _.pull(remaining, next);
    }
    ordered.push(...resources.filter((resource) => { return !linked.has(resource); }).sort());

    ordered.forEach((resource) => {
      const ops = operations.filter((op) => { return op.resource === resource; }).sort((a, b) => {
          return (ROLE_RANK[a.role] - ROLE_RANK[b.role]) || a.path.localeCompare(b.path) ||
            a.method.localeCompare(b.method);
        }),
        [deletes, others] = _.partition(ops, { role: 'delete' }),
        read = _.find(ops, { role: 'read' });

      flows[resource] = _.map(others, 'operationId');
      teardown.unshift(..._.map(deletes, 'operationId'),
        ...(read && deletes.length ? [`${read.operationId}:expect-404`] : []));
    });

    if (teardown.length) { flows.teardown = teardown; }

    return flows;
  },

  /**
   * Drops consumers whose producer doesn't run before them, which only happens in a dependency cycle
   * (A needs B's id and B needs A's), and reports each as an error.
   *
   * @param {Object[]} links - links
   * @param {Object} flows - run order from buildFlows
   * @param {Object[]} operations - operations
   * @returns {Object} { runnable: links with only satisfiable consumers, errors: String[] }
   */
  dropUnorderedConsumers = (links, flows, operations) => {
    const ops = _.keyBy(operations, 'key'),
      position = {},
      errors = [];

    _.flatten(_.values(flows)).forEach((step, index) => {
      const operationId = step.split(':')[0];

      if (!_.has(position, operationId)) { position[operationId] = index; }
    });

    const at = (operation) => { return _.get(position, _.get(ops, [operation, 'operationId']), -1); },
      runnable = links.map((link) => {
        const producer = _.get(link, 'producer.operation'),
          [ok, late] = _.partition(link.consumers, (consumer) => {
            return !producer || at(producer) < at(consumer.operation);
          });

        late.forEach((consumer) => {
          errors.push(`${consumer.operation} needs {{${link.variable}}} from ${producer}, which cannot run before it`);
        });

        return late.length ? Object.assign({}, link, { consumers: ok }) : link;
      });

    return { runnable, errors };
  };

module.exports = { buildFlows, dropUnorderedConsumers };
