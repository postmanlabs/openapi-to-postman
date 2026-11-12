// Producer -> consumer links by name. A value's variable is named after the parameter that needs it. It is
// filled from a response field with the same name, else from the `id` returned by the request that creates
// the resource it identifies. Values nothing fills are inputs: collection variables the caller sets.
const _ = require('lodash'),
  { ROLE_RANK } = require('./operations'),
  { isContainer, normalizeName: normalize, isIdField, isMap, unwrap } = require('./normalize'),

  // Names of values that identify something. Others, such as `type`, `name` or `status`, are never linked:
  // they'd match by accident.
  IDENTIFIER = /(id|key|uuid|ref|slug|code|handle)$/i,

  /**
   * Top-level scalar fields returned by an operation's 2xx responses, as JSON pointers. Payload wrappers
   * (`{ data }`, `{ items }`, HAL `_embedded`) are unwrapped so their fields count as top level.
   *
   * @param {Object} op - operation
   * @returns {Object[]} fields: { op, pointer, name }
   */
  producedFields = (op) => {
    return _.flatMap(_.keys(op.responses).sort().filter((code) => { return (/^2/).test(code); }), (status) => {
      const { schema, pointer } = unwrap(op.responses[status].schema);

      if (!schema || isMap(schema) || schema.type === 'array' || schema.items) { return []; }

      return _.keys(_.omitBy(schema.properties, isContainer)).map((name) => {
        return { op, pointer: `${pointer}/${name}`, name };
      });
    });
  },

  /**
   * Variable for a value: the parameter's name, with a bare `{id}` named after its resource
   * (`/specifications/{id}` -> `specificationId`) and headers in camel case (`X-Tenant-Id` -> `xTenantId`).
   *
   * @param {Object} op - operation
   * @param {String} location - path, query, header or body
   * @param {String} name - parameter name
   * @returns {String} variable name
   */
  variableName = (op, location, name) => {
    const owner = location === 'path' && normalize(name) === 'id' && op.paramResources[name];

    if (owner && normalize(owner) !== 'id') { return _.camelCase(`${owner} id`); }

    return location === 'header' ? _.camelCase(name) : name;
  },

  /**
   * Values an operation needs: path parameters, identifier-like required query and header parameters, and
   * top-level body fields ending in `id`. Other parameters keep the spec's example, and headers the caller
   * sends itself are left out.
   *
   * @param {Object} op - operation
   * @param {String[]} sentHeaders - lower-case names of the headers the caller sends
   * @returns {Object[]} consumers: { op, variable, param: { in, name } | { in: 'body', path } }
   */
  consumedValues = (op, sentHeaders) => {
    const params = op.params.filter((param) => {
        const isIdentifier = param.required && IDENTIFIER.test(param.name);

        return param.in === 'path' || (param.in === 'query' && isIdentifier) ||
          (param.in === 'header' && isIdentifier && !sentHeaders.includes(param.name.toLowerCase()));
      }).map((param) => {
        return { op, variable: variableName(op, param.in, param.name), param: { in: param.in, name: param.name } };
      }),
      bodyIds = _.keys(_.get(op.requestBodySchema, 'properties')).filter((name) => { return (/id$/i).test(name); })
        .map((name) => { return { op, variable: name, param: { in: 'body', path: `/${name}` } }; });

    return params.concat(bodyIds);
  },

  /**
   * Links every consumed value to the response field that fills it. Candidates, best first:
   *
   * 1. Same name: a top-level response field named like the variable (case and separators ignored), for
   *    identifier-like names only, from a create first, then by role and key.
   * 2. Create id: the `id` (or `<resource>Id`) returned by the create of the resource the variable
   *    identifies: the resource a path parameter belongs to, or `<resource>Id`.
   *
   * A request never fills a value it needs, directly or through the values it needs. To get there, the run is
   * simulated first: a request runs once every value it needs is available, and the requests that run fill
   * the values they return. Values no response returns are inputs from the start; when nothing can run, one
   * missing value becomes an input: one that unblocks a request on its own, preferring a value no create
   * returns, then alphabetically. Then each value takes its best candidate that doesn't need it. Deletes
   * fill nothing, and the same spec always gives the same links.
   *
   * @param {Object[]} operations - operations to run
   * @param {String[]} [sentHeaders] - lower-case names of the headers the caller sends
   * @returns {Object[]} links: { variable, producer: { operation, value } | null, consumers: [{ operation, param }] },
   *   by variable; a null producer is an input
   */
  link = (operations, sentHeaders = []) => {
    const consumers = _.flatMap(operations, (op) => { return consumedValues(op, sentHeaders); }),
      byVariable = _.groupBy(consumers, 'variable'),
      variables = _.keys(byVariable).sort(),
      fields = _.flatMap(operations.filter((op) => { return op.role !== 'delete'; }), producedFields),
      needs = _.mapValues(_.groupBy(consumers, 'op.key'), (list) => { return _.uniq(_.map(list, 'variable')); }),
      resources = new Set(_.filter(operations, { role: 'create' }).map((op) => { return op.resource; })),
      producers = {},
      available = new Set(),
      pending = operations.slice();

    // Fields that could fill `variable`, best first, and whether a create returns it.
    const candidatesOf = _.zipObject(variables, variables.map((variable) => {
        const users = byVariable[variable],
          underPath = (field) => {
            return Number(users.some((consumer) => { return consumer.op.path.startsWith(field.op.collectionPath); }));
          },
          sameName = fields.filter((field) => {
            return IDENTIFIER.test(variable) && normalize(field.name) === normalize(variable);
          }).sort((a, b) => {
            return (ROLE_RANK[a.op.role] - ROLE_RANK[b.op.role]) || (underPath(b) - underPath(a)) ||
              a.op.key.localeCompare(b.op.key) || a.pointer.localeCompare(b.pointer);
          }),
          owner = _.find(_.map(users, (consumer) => {
            return consumer.param.in === 'path' && consumer.op.paramResources[consumer.param.name];
          }), (resource) => { return resources.has(resource); }) ||
            _.find([...resources].sort(), (resource) => { return normalize(variable) === normalize(`${resource}id`); }),
          createId = fields.filter((field) => {
            return owner && field.op.role === 'create' && field.op.resource === owner &&
              isIdField(field.name, owner);
          }).sort((a, b) => {
            return (underPath(b) - underPath(a)) || a.op.key.localeCompare(b.op.key) ||
              a.pointer.localeCompare(b.pointer);
          });

        return { fields: _.uniq(sameName.concat(createId)), created: createId.length > 0 };
      })),
      missingOf = (op) => { return (needs[op.key] || []).filter((variable) => { return !available.has(variable); }); };

    variables.filter((variable) => { return !candidatesOf[variable].fields.length; })
      .forEach((variable) => { available.add(variable); });

    while (pending.length) {
      const ready = pending.filter((op) => { return !missingOf(op).length; });

      if (!ready.length) {
        const missing = _.sortBy(_.uniq(_.flatMap(pending, missingOf)), [
          (variable) => { return !pending.some((op) => { return _.isEqual(missingOf(op), [variable]); }); },
          (variable) => { return candidatesOf[variable].created; },
          _.identity
        ]);

        available.add(missing[0]);
        continue;
      }

      const ran = new Set(_.map(ready, 'key'));

      _.pullAll(pending, ready);
      variables.filter((variable) => { return !available.has(variable); }).forEach((variable) => {
        const field = _.find(candidatesOf[variable].fields, (candidate) => { return ran.has(candidate.op.key); });

        if (field) { producers[variable] = field; }
      });
      _.keys(producers).forEach((variable) => { available.add(variable); });
    }

    const needsValue = (op, variable, seen = new Set()) => {
      return (needs[op.key] || []).some((other) => {
        if (other === variable) { return true; }
        if (seen.has(other) || !producers[other]) { return false; }
        seen.add(other);

        return needsValue(producers[other].op, variable, seen);
      });
    };

    variables.forEach((variable) => {
      const best = _.find(candidatesOf[variable].fields, (field) => { return !needsValue(field.op, variable); });

      if (best) { producers[variable] = best; }
    });

    return variables.map((variable) => {
      const field = producers[variable];

      return {
        variable,
        producer: field ? { operation: field.op.key, value: `$response.body#${field.pointer}` } : null,
        consumers: _.sortBy(byVariable[variable], (consumer) => {
          return `${consumer.op.key} ${consumer.param.in}:${consumer.param.name || consumer.param.path}`;
        }).map((consumer) => { return { operation: consumer.op.key, param: consumer.param }; })
      };
    });
  };

module.exports = { link };
