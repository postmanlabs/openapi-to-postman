/**
 * Helpers for OpenAPI 3.2 features that are shared between the v1 (lib) and
 * v2 (libV2) conversion flows.
 *
 * See https://spec.openapis.org/oas/v3.2.0.html
 */
const _ = require('lodash'),

  OAS_32_VERSION_REGEX = /^3\.2(?:\.|$)/,

  // Path Item fields that hold an operation in OAS 3.2 (in addition to the
  // standard methods every version supports).
  QUERY_METHOD = 'query',

  // SSE field names that have a dedicated line in the event stream framing.
  // See https://html.spec.whatwg.org/multipage/server-sent-events.html
  SSE_FIELDS = ['event', 'id', 'retry', 'data'];

/**
 * Checks whether the given spec (or `openapi` version string) is OAS 3.2.x
 *
 * @param {Object|String} spec - OpenAPI spec object or the `openapi` field value
 * @returns {Boolean} true if the spec is OAS 3.2.x
 */
function isOpenApi32 (spec) {
  const version = _.isString(spec) ? spec : _.get(spec, 'openapi', '');

  return _.isString(version) && OAS_32_VERSION_REGEX.test(version);
}

/**
 * OAS 3.2 `discriminator.defaultMapping` may be a bare component name or a
 * reference. Converts a bare component name into a local schema reference.
 *
 * @param {String} ref - defaultMapping value
 * @returns {String} reference that can be resolved as `$ref`
 */
function normalizeDefaultMappingRef (ref) {
  if (ref.startsWith('#') || (/^[a-z][a-z\d+.-]*:/i).test(ref) || ref.includes('/')) {
    return ref;
  }

  return '#/components/schemas/' + ref.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Returns the reference to use in place of a discriminated oneOf/anyOf schema
 * when faking data, based on OAS 3.2 `discriminator.defaultMapping`. Returns
 * null when no redirect should happen, including when the target is already
 * being resolved (seenRef), so that circular redirects fall back to the first
 * union member.
 *
 * See https://spec.openapis.org/oas/v3.2.0.html (Discriminator Object, `defaultMapping` field).
 *
 * @param {Object} schema - schema that may hold oneOf/anyOf with discriminator
 * @param {Boolean} is32 - whether the spec is OAS 3.2.x
 * @param {Object} seenRef - map of references being resolved in current chain
 * @returns {String|null} normalized reference to redirect to
 */
function getDefaultMappingRedirect (schema, is32, seenRef = {}) {
  if (!is32 || !_.isObject(schema) || !(Array.isArray(schema.oneOf) || Array.isArray(schema.anyOf))) {
    return null;
  }

  const defaultMappingRef = _.get(schema, 'discriminator.defaultMapping');

  if (!_.isString(defaultMappingRef) || defaultMappingRef.length === 0) {
    return null;
  }

  const normalizedRef = normalizeDefaultMappingRef(defaultMappingRef);

  return seenRef[normalizedRef] ? null : normalizedRef;
}

/**
 * Lists all operations defined on a Path Item Object without modifying it.
 *
 * Standard methods are read from their fixed fields. For OAS 3.2, `query` is also
 * a fixed field and `additionalOperations` entries are listed with the map key as
 * both the identifier and the outbound request method, since HTTP methods are case
 * sensitive (e.g. `Purge` and `PURGE` are two different operations). An
 * `additionalOperations` entry is skipped only when it duplicates a fixed-field
 * operation defined on the same Path Item (spec forbids such entries).
 *
 * See https://spec.openapis.org/oas/v3.2.0.html (Path Item Object, `additionalOperations` field).
 *
 * @param {Object} pathItem - The resolved Path Item Object
 * @param {Array<String>} standardMethods - lowercase standard methods supported by the caller
 * @param {Boolean} is32 - whether the spec is OAS 3.2.x
 * @returns {Array<Object>} list of { method, requestMethod, operation }. `method` identifies
 *  the operation within the path item, `requestMethod` is set only for additionalOperations.
 */
function getPathItemOperations (pathItem, standardMethods, is32) {
  const operations = [],
    fixedMethods = is32 ? _.concat(standardMethods, QUERY_METHOD) : standardMethods;

  if (!_.isObject(pathItem)) {
    return operations;
  }

  _.forEach(_.keys(pathItem), (key) => {
    if (fixedMethods.includes(key)) {
      operations.push({ method: key, requestMethod: undefined, operation: pathItem[key] });
    }
  });

  if (!is32 || !_.isPlainObject(pathItem.additionalOperations)) {
    return operations;
  }

  _.forEach(pathItem.additionalOperations, (operation, method) => {
    const methodLower = method.toLowerCase();

    if (method.length === 0 || !_.isObject(operation) ||
      (fixedMethods.includes(methodLower) && _.has(pathItem, methodLower))) {
      return;
    }

    operations.push({ method, requestMethod: method, operation });
  });

  return operations;
}

/**
 * Finds a single operation on a Path Item Object. Operations from OAS 3.2
 * `additionalOperations` are identified by `requestMethod` (the exact map key).
 *
 * @param {Object} pathItem - The resolved Path Item Object
 * @param {String} method - operation identifier (as returned by getPathItemOperations)
 * @param {String} [requestMethod] - outbound method for additionalOperations entries
 * @returns {Object|undefined} operation object
 */
function getPathItemOperation (pathItem, method, requestMethod) {
  if (requestMethod) {
    return _.get(pathItem, ['additionalOperations', requestMethod]);
  }

  return _.get(pathItem, method);
}

/**
 * Walks an OAS 3.2 tag's `parent` chain and returns [root, ..., leaf].
 * A dangling parent ends the chain at the deepest valid ancestor. A cycle
 * anywhere in the chain makes the tag fall back to a flat layout ([tagName]).
 *
 * See https://spec.openapis.org/oas/v3.2.0.html (Tag Object, `parent` field).
 *
 * @param {String} tagName - leaf tag name
 * @param {Function} getParent - returns the parent tag name of given tag, or undefined
 *  when it has no (valid) parent
 * @returns {Array<String>} ordered ancestor chain
 */
function resolveTagParentChain (tagName, getParent) {
  const chain = [],
    seen = new Set();
  let cursor = tagName;

  while (_.isString(cursor) && cursor.length > 0) {
    if (seen.has(cursor)) {
      return [tagName];
    }

    seen.add(cursor);
    chain.unshift(cursor);
    cursor = getParent(cursor);
  }

  return chain;
}

/**
 * Formats a single generated item of an OAS 3.2 `text/event-stream` itemSchema
 * into SSE framing. `event`, `id`, `retry` and `data` map to their SSE fields.
 * When `data` is absent, the remaining (non SSE) properties are sent as compact
 * JSON in the `data` field, so that the event is never empty.
 *
 * @param {*} value - generated item value
 * @returns {String} SSE framed event
 */
function formatServerSentEvent (value) {
  const fields = _.isPlainObject(value) ? value : { data: value },
    lines = [];
  let data = fields.data;

  if (fields.event !== undefined) {
    lines.push('event: ' + String(fields.event).replace(/[\r\n]/g, ' '));
  }
  if (fields.id !== undefined && !String(fields.id).includes('\0')) {
    lines.push('id: ' + String(fields.id).replace(/[\r\n]/g, ' '));
  }
  if (fields.retry !== undefined && Number.isInteger(Number(fields.retry)) && Number(fields.retry) >= 0) {
    lines.push('retry: ' + String(fields.retry));
  }

  if (data === undefined) {
    const payload = _.omit(fields, SSE_FIELDS);

    if (!_.isEmpty(payload) || lines.length === 0) {
      data = _.isEmpty(payload) ? fields : payload;
    }
  }

  if (data !== undefined) {
    data = _.isObject(data) ? JSON.stringify(data) : String(data);
    data.split(/\r\n|\r|\n/).forEach((line) => { return lines.push('data: ' + line); });
  }

  return lines.join('\n') + '\n\n';
}

module.exports = {
  isOpenApi32,
  normalizeDefaultMappingRef,
  getDefaultMappingRedirect,
  getPathItemOperations,
  getPathItemOperation,
  resolveTagParentChain,
  formatServerSentEvent
};
