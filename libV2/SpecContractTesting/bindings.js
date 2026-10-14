// Producer -> consumer inference: which response field fills which parameter. Fixed, ranked rules
// and alphabetical tie-breaks, so the same spec always gives the same bindings.
const _ = require('lodash'),
  { hash } = require('./utils'),
  { ROLE_RANK, singular } = require('./operations'),

  // Ranked by evidence: rules that tie the value to the right resource beat a bare name match.
  RULES = {
    'same-resource-create': 90,
    'typed-reference': 85,
    'other-resource-create': 80,
    'same-resource-list': 70,
    'exact-name': 60
  },
  MIN_SCORE = 60,

  normalize = (name) => { return String(name).toLowerCase().replace(/[^a-z0-9]/g, ''); },

  snake = (name) => {
    return String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
  },

  typesMatch = (a, b) => {
    return (!a.type || !b.type || a.type === b.type) && (!a.format || !b.format || a.format === b.format);
  },

  /**
   * Scalar fields returned by an operation's 2xx responses, as JSON pointers. Arrays contribute
   * their first item (`/0`); a `{ meta, data }` envelope is unwrapped so `data.id` counts as top level.
   *
   * @param {Object} op - operation
   * @returns {Object[]} fields: { op, status, pointer, name, type, format, depth }
   */
  producedFields = (op) => {
    const fields = [];

    _.keys(op.responses).sort().filter((code) => { return (/^2/).test(code); }).forEach((status) => {
      const isContainer = (schema) => {
          return schema && (schema.type === 'object' || schema.type === 'array' || schema.properties || schema.items);
        },
        walk = (schema, pointer, depth) => {
          if (!schema || depth > 3) { return; }
          if (schema.type === 'array' || schema.items) { return walk(schema.items, `${pointer}/0`, depth + 1); }

          _.forEach(schema.properties, (child, name) => {
            if (isContainer(child)) { return walk(child, `${pointer}/${name}`, depth + 1); }
            fields.push({ op, status, pointer: `${pointer}/${name}`, name, type: _.get(child, 'type'),
              format: _.get(child, 'format'), depth: depth + 1 });
          });
        },
        schema = op.responses[status].schema,
        envelope = _.get(schema, 'properties.data');

      if (isContainer(envelope)) { walk(envelope, '/data', 0); }
      else { walk(schema, '', 0); }
    });

    return fields;
  },

  // `entityId` next to `entityType=specification` refers to a specification: returns 'specification'.
  referencedType = (op, param) => {
    const prefix = _.get((/^(.+)id$/i).exec(param.name), 1),
      sibling = prefix && _.find(op.params, (other) => {
        return other !== param && normalize(other.name) === normalize(`${prefix}type`);
      });

    return sibling && typeof sibling.example === 'string' && sibling.example ? singular(sibling.example) : undefined;
  },

  /**
   * Values an operation needs: path parameters, required query/header parameters, query/header
   * parameters typed by a sibling `<x>Type` (even when optional), and top-level body fields ending in `id`.
   *
   * @param {Object} op - operation
   * @returns {Object[]} consumers: { op, in, name, path?, type, format, refType? }
   */
  consumedValues = (op) => {
    const params = op.params.map((param) => {
        return { param, refType: param.in === 'path' ? undefined : referencedType(op, param) };
      }).filter(({ param, refType }) => {
        return param.in === 'path' || ((param.in === 'query' || param.in === 'header') && (param.required || refType));
      }).map(({ param, refType }) => {
        return _.omitBy({ op, in: param.in, name: param.name, type: _.get(param, 'schema.type'),
          format: _.get(param, 'schema.format'), refType }, _.isUndefined);
      }),
      bodyIds = _.keys(_.get(op.requestBodySchema, 'properties')).filter((name) => { return (/id$/i).test(name); })
        .map((name) => {
          const schema = op.requestBodySchema.properties[name];

          return { op, in: 'body', name, path: `/${name}`, type: schema.type, format: schema.format };
        });

    return params.concat(bodyIds);
  },

  /**
   * Stable key for a consumer: `METHOD /path in:name` (body fields use their pointer).
   *
   * @param {Object} consumer - consumer from consumedValues
   * @returns {String} key
   */
  consumerKey = (consumer) => { return `${consumer.op.key} ${consumer.in}:${consumer.path || consumer.name}`; },

  /**
   * Lock-file form of a consumer's parameter: `{ in, name }`, or `{ in: 'body', path }`.
   *
   * @param {Object} consumer - consumer from consumedValues
   * @returns {Object} parameter reference
   */
  consumerParam = (consumer) => {
    return consumer.in === 'body' ? { in: 'body', path: consumer.path } : { in: consumer.in, name: consumer.name };
  },

  /**
   * Hash of the producer and consumer types, used to notice when a saved binding no longer fits.
   *
   * @param {Object} field - producer field
   * @param {Object} consumer - consumer
   * @returns {String} fingerprint
   */
  fingerprintOf = (field, consumer) => {
    return `sha256:${hash({ p: [field.type, field.format], c: [consumer.type, consumer.format] })}`;
  },

  ruleFor = (field, consumer, resourcesWithCreate) => {
    const producer = field.op,
      name = normalize(consumer.name),
      fieldName = normalize(field.name),
      isId = fieldName === 'id',
      owner = consumer.in === 'path' ? consumer.op.paramResources[consumer.name] : null,
      ownsParam = owner && producer.resource === owner,
      // `ownerId` names a resource with a create; an `ownerId` field elsewhere is only a reference to it.
      isReference = [...resourcesWithCreate].some((resource) => { return normalize(`${resource}id`) === name; });

    if (ownsParam && producer.role === 'create' && (isId || fieldName === name) && field.depth === 1) {
      return 'same-resource-create';
    }
    if (consumer.refType && normalize(consumer.refType) === normalize(producer.resource) &&
        producer.role === 'create' && isId && field.depth === 1) {
      return 'typed-reference';
    }
    if (isId && field.depth === 1 && producer.role === 'create' && normalize(`${producer.resource}id`) === name) {
      return 'other-resource-create';
    }
    if (ownsParam && producer.role === 'list' && isId && field.depth === 2 && (/\/0\/id$/).test(field.pointer)) {
      return 'same-resource-list';
    }
    if (!isReference && !isId && fieldName === name && field.depth === 1 && producer.role !== 'delete') {
      return 'exact-name';
    }

    return null;
  },

  // Highest score wins; ties: producer path is a prefix of the consumer path, create before list,
  // shallower field, then producer key and pointer alphabetically.
  bestMatch = (consumer, fields, resourcesWithCreate) => {
    const candidates = fields
      .filter((field) => { return field.op.key !== consumer.op.key && typesMatch(field, consumer); })
      .map((field) => {
        const rule = ruleFor(field, consumer, resourcesWithCreate);

        return rule && { field, rule, score: RULES[rule] };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const underPath = (c) => { return Number(consumer.op.path.startsWith(c.field.op.collectionPath)); };

        return (b.score - a.score) || (underPath(b) - underPath(a)) ||
          (ROLE_RANK[a.field.op.role] - ROLE_RANK[b.field.op.role]) || (a.field.depth - b.field.depth) ||
          a.field.op.key.localeCompare(b.field.op.key) || a.field.pointer.localeCompare(b.field.pointer);
      });

    return candidates.length && candidates[0].score >= MIN_SCORE ? candidates[0] : null;
  },

  /**
   * Infers bindings for the given consumers. Consumers matched to the same producer field share one
   * binding, i.e. one collection variable.
   *
   * @param {Object[]} operations - all operations
   * @param {Object[]} consumers - consumers to resolve
   * @returns {Object} { bindings, unresolved }
   */
  inferBindings = (operations, consumers) => {
    const fields = _.flatMap(operations, producedFields),
      resourcesWithCreate = new Set(operations.filter((op) => { return op.role === 'create'; })
        .map((op) => { return op.resource; })),
      bindings = new Map(),
      unresolved = [],
      used = new Set();

    consumers.slice().sort((a, b) => { return consumerKey(a).localeCompare(consumerKey(b)); }).forEach((consumer) => {
      const match = bestMatch(consumer, fields, resourcesWithCreate);

      if (!match) { return unresolved.push(consumer); }

      const { field } = match,
        key = `${field.op.key} ${field.status} ${field.pointer}`;

      if (!bindings.has(key)) {
        bindings.set(key, {
          id: null,
          variable: normalize(field.name) === 'id' ? `${snake(field.op.resource)}_id` : snake(field.name),
          producer: { operation: field.op.key, operationId: field.op.operationId, status: field.status,
            value: `$response.body#${field.pointer}` },
          consumers: [],
          source: 'inferred',
          rule: match.rule,
          score: match.score,
          status: 'pending',
          fingerprint: fingerprintOf(field, consumer)
        });
      }
      bindings.get(key).consumers.push({ operation: consumer.op.key, param: consumerParam(consumer) });
    });

    bindings.forEach((binding) => {
      let name = binding.variable,
        n = 2;

      while (used.has(name)) { name = `${binding.variable}_${n++}`; }
      used.add(name);
      binding.id = binding.variable = name;
    });

    return { bindings: [...bindings.values()], unresolved };
  };

module.exports = { producedFields, consumedValues, consumerKey, consumerParam, fingerprintOf, inferBindings };
