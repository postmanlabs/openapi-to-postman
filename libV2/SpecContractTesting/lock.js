// Bindings lock: the links between requests, and the operations not to run. Everything already in the
// lock belongs to the user and is kept as written; a run only appends links for values no entry covers.
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

  isValidParam = (param) => {
    return ['path', 'query', 'header'].includes(_.get(param, 'in')) ?
      _.isString(param.name) && Boolean(param.name) :
      _.get(param, 'in') === 'body' && (/^\//).test(_.get(param, 'path'));
  },

  /**
   * Checks what a user may have edited in `bindings`. Each binding needs its own `variable`; a producer
   * is null, a response value, an environment variable or a constant; each consumer is
   * { operation, param: { in: path|query|header, name } | { in: body, path } } and belongs to one binding.
   *
   * @param {Object} [lock] - saved lock
   * @returns {String|undefined} error describing the first problem
   */
  findBindingsError = (lock) => {
    const bindings = _.get(lock, 'bindings') || [],
      variables = new Set(),
      owners = {};

    if (!_.isArray(bindings)) { return 'bindings must be a list'; }

    for (const binding of bindings) {
      const variable = _.get(binding, 'variable'),
        producer = _.get(binding, 'producer');

      if (!_.isString(variable) || !variable) {
        return `Every binding needs a variable: ${JSON.stringify(binding)}`;
      }
      if (variables.has(variable)) { return `Two bindings use the variable "${variable}": rename one`; }
      variables.add(variable);

      if (!_.isNil(producer) && !hasProducer(binding)) {
        return `Binding "${variable}" has an invalid producer: use operation and value, environment, constant or null`;
      }
      if (_.get(producer, 'operation') && !_.has(producer, 'constant') && !_.get(producer, 'value')) {
        return `Binding "${variable}" has a producer operation without a value`;
      }

      for (const consumer of _.get(binding, 'consumers') || []) {
        const key = _.isString(_.get(consumer, 'operation')) && isValidParam(consumer.param) &&
          paramKey(consumer.operation, consumer.param);

        if (!key) {
          return `Binding "${variable}" has an invalid consumer ${JSON.stringify(consumer)}: use operation and ` +
            'param { in: path|query|header, name } or { in: body, path }';
        }
        if (owners[key] && owners[key] !== variable) {
          return `${key} is listed under bindings "${owners[key]}" and "${variable}": keep it in one`;
        }
        owners[key] = variable;
      }
    }
  },

  /**
   * Problems with a saved binding, reported as warnings; the binding stays in the lock. A producer
   * problem means its consumers get no value this run. Excluded consumers are left alone, and query,
   * header and body values may target parameters the spec doesn't declare; a path id must exist.
   *
   * @param {Object} binding - saved binding
   * @param {Object} ops - operations by key
   * @param {Object} fields - response fields by fieldKey
   * @param {Set<String>} excluded - excluded operation keys
   * @returns {Object} { producerProblem: String|null, problems: String[] }
   */
  bindingProblems = (binding, ops, fields, excluded) => {
    const producer = binding.producer || {},
      pointer = _.get((/^\$response\.body#(.*)$/).exec(producer.value || ''), 1),
      field = fields[fieldKey(producer.operation, pointer)];
    let producerProblem = null;

    // A constant makes the rest of the producer a reference, so it isn't checked. Response headers
    // aren't described by the converter's output, so for them only the operation is checked.
    if (producer.operation && !_.has(producer, 'constant')) {
      if (excluded.has(producer.operation)) { producerProblem = `producer ${producer.operation} is excluded`; }
      else if (!ops[producer.operation]) { producerProblem = `producer ${producer.operation} is not in the spec`; }
      else if (pointer === undefined && !(/^\$response\.header\.\S+$/).test(producer.value)) {
        producerProblem = `${producer.value} is not a $response.body# or $response.header. value`;
      }
      else if (pointer !== undefined && !field) {
        producerProblem = `${producer.operation} does not return ${producer.value}`;
      }
    }

    const consumerProblems = binding.consumers.filter(({ operation }) => { return !excluded.has(operation); })
      .map(({ operation, param }) => {
        const declared = ops[operation] && describeParam(ops[operation], param),
          name = param.name || param.path;

        if (!ops[operation]) { return `consumer ${operation} is not in the spec`; }
        if (param.in === 'path' && !declared) { return `${operation} has no path parameter ${name}`; }
        if (field && declared && !typesMatch(field, declared)) {
          return `types of ${producer.value} and ${name} differ`;
        }

        return null;
      });

    return { producerProblem, problems: _.compact([producerProblem].concat(consumerProblems)) };
  },

  // The lock-file form of a binding: only what a user reads or edits.
  lockEntry = (binding) => {
    return _.omitBy({
      variable: binding.variable,
      note: binding.note,
      producer: hasProducer(binding) ?
        _.omitBy(_.pick(binding.producer, ['operation', 'value', 'pattern', 'environment', 'constant']),
          _.isUndefined) :
        null,
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
   * Combines a saved lock with fresh inference for values no saved entry covers.
   *
   * Saved bindings, placeholders included, are kept as written and in their order; problems with them
   * are reported in `warnings`. A new consumer whose producer is already saved joins that binding, other
   * new links are appended, and new values nothing returns join the placeholder of the same name or a
   * new one. Consumers listed anywhere in the lock are never inferred again.
   *
   * @param {Object} options - options
   * @param {Object[]} options.operations - operations to run
   * @param {Set<String>} options.excluded - keys of the operations the lock excludes
   * @param {Object} [options.lock] - saved lock, already checked by findBindingsError
   * @returns {Object} { bindings: what the run uses, flows, lock, summary }
   */
  reconcile = ({ operations, excluded, lock }) => {
    const ops = _.keyBy(operations, 'key'),
      fields = _.keyBy(_.flatMap(operations, producedFields), (field) => {
        return fieldKey(field.op.key, field.pointer);
      }),
      allConsumers = _.flatMap(operations, consumedValues),
      saved = _.map(_.cloneDeep(_.get(lock, 'bindings') || []), lockEntry),
      [linked, placeholders] = _.partition(saved, hasProducer),
      listed = new Set(_.flatMap(saved, (binding) => {
        return binding.consumers.map((consumer) => { return paramKey(consumer.operation, consumer.param); });
      })),
      taken = new Set(_.map(saved, 'variable')),
      warnings = [],
      brokenProducers = {},
      added = [],
      extended = [],
      unresolvedRefs = [];

    saved.forEach((binding) => {
      const { producerProblem, problems } = bindingProblems(binding, ops, fields, excluded);

      problems.forEach((reason) => { warnings.push({ variable: binding.variable, reason }); });
      if (producerProblem) { brokenProducers[binding.variable] = producerProblem; }
    });

    // Placeholder values a response can now provide: the user decides, so only suggest the producer.
    const placeholderOf = _.fromPairs(_.flatMap(placeholders, (binding) => {
        return binding.consumers.map((ref) => { return [paramKey(ref.operation, ref.param), binding.variable]; });
      })),
      suggestions = inferBindings(operations, allConsumers.filter((consumer) => {
        return placeholderOf[consumerKey(consumer)];
      })).bindings.flatMap((binding) => {
        return binding.consumers.map((consumer) => {
          return { variable: placeholderOf[paramKey(consumer.operation, consumer.param)], consumer,
            producer: binding.producer };
        });
      }),
      { bindings: inferred, unresolved } = inferBindings(operations,
        allConsumers.filter((consumer) => { return !listed.has(consumerKey(consumer)); }));

    placeholders.forEach((binding) => {
      binding.consumers.filter((ref) => { return ops[ref.operation]; }).forEach((ref) => {
        unresolvedRefs.push(unresolvedRef(ref.operation, ref.param, 'no producer is set for this value'));
      });
    });

    inferred.forEach((binding) => {
      const existing = _.find(linked, (candidate) => {
        return candidate.producer.operation === binding.producer.operation &&
          candidate.producer.value === binding.producer.value;
      });

      if (!existing) {
        return added.push(Object.assign({}, binding, { variable: uniqueName(binding.variable, taken) }));
      }

      existing.consumers.push(...binding.consumers);
      binding.consumers.forEach((consumer) => { extended.push({ variable: existing.variable, consumer }); });
    });

    const sortKey = (binding) => { return _.get(binding, 'producer.operation') || '~'; },
      newLinks = added.slice().sort((a, b) => {
        return sortKey(a).localeCompare(sortKey(b)) || a.variable.localeCompare(b.variable);
      }),
      newPlaceholders = [];

    _(unresolved).groupBy(placeholderVariable).toPairs().sortBy(0).forEach(([variable, consumers]) => {
      const refs = consumers.map((consumer) => {
          return { operation: consumer.op.key, param: consumerParam(consumer) };
        }),
        existing = _.find(placeholders, { variable });

      refs.forEach((ref) => {
        unresolvedRefs.push(unresolvedRef(ref.operation, ref.param, 'no response returns a matching value'));
      });
      if (existing) {
        existing.consumers.push(...refs);
        refs.forEach((consumer) => { extended.push({ variable, consumer }); });

        return;
      }

      const placeholder = { variable: uniqueName(variable, taken), producer: null, consumers: refs };

      newPlaceholders.push(placeholder);
      added.push(placeholder);
    });

    const active = linked.concat(newLinks),
      // What the run uses: a constant needs no producer request; a broken producer gives its consumers nothing.
      runtime = active.map((binding) => {
        if (_.has(binding.producer, 'constant')) {
          return Object.assign({}, binding, { producer: { constant: binding.producer.constant } });
        }
        if (!brokenProducers[binding.variable]) { return binding; }
        binding.consumers.filter((ref) => { return ops[ref.operation]; }).forEach((ref) => {
          unresolvedRefs.push(unresolvedRef(ref.operation, ref.param,
            `binding ${binding.variable}: ${brokenProducers[binding.variable]}`));
        });

        return Object.assign({}, binding, { consumers: [] });
      }),
      flows = buildFlows(operations, runtime),
      ordered = dropUnorderedConsumers(runtime, flows, ops),
      { runnable, blocked } = dropSkippedProducers(ordered.runnable, operations);

    return {
      bindings: runnable,
      flows,
      lock: {
        lockfileVersion: LOCK_VERSION,
        exclude: _.cloneDeep(_.get(lock, 'exclude') || []),
        bindings: saved.concat(newLinks.map(lockEntry), newPlaceholders)
      },
      summary: {
        unchanged: saved.length,
        added,
        extended,
        warnings,
        suggestions,
        unresolved: unresolvedRefs.concat(ordered.blocked, blocked)
      }
    };
  };

module.exports = { versionError, readExclude, findBindingsError, unresolvedRef, reconcile };
