// Spec contract testing: rearranges the collection produced by convertV2WithTypes into one that
// exercises the API in a valid order (create, read, update, child resources, teardown), keeping the
// converter's status and schema checks. Links between requests are inferred from extractedTypes and
// can be pinned with a lock. Every operation runs unless the lock excludes it or a value it needs
// can't be resolved (listed under `unresolved`). Collection generation itself is unchanged.
const _ = require('lodash'),
  { hash, sortKeys, flattenItems } = require('./utils'),
  { CONTRACT_TEST_MARKER } = require('../CollectionGeneration/contractTests'),
  { listOperations } = require('./operations'),
  { versionError, readExclude, findBindingsError, unresolvedRef, reconcile } = require('./lock'),
  { buildCollection } = require('./collection'),

  // Headers that carry credentials; the no-token checks leave them out.
  CREDENTIAL_HEADER = /^(authorization|proxy-authorization|cookie)$|token|key|secret|session|auth/i,

  // A caller's `{ name, value }`, with the default value and whether it carries a credential; null when invalid.
  normalizeHeader = (header) => {
    const name = _.isString(_.get(header, 'name')) ? header.name.trim() : '';

    if (!name) { return null; }

    return {
      name,
      value: _.isNil(header.value) || header.value === '' ? `{{${_.camelCase(name)}}}` : String(header.value),
      credential: CREDENTIAL_HEADER.test(name)
    };
  },

  /**
   * Builds the contract-test collection from a convertV2WithTypes result.
   *
   * @param {Object} conversion - convertV2WithTypes result (with output and extractedTypes)
   * @param {Object} [options] - options
   * @param {Object} [options.lock] - previously saved lock; its bindings are reused and its `exclude`
   *   entries ({ operation } or { pattern } matched against "METHOD /path") are left out
   * @param {Object[]} [options.headers] - { name, value } sent on every request; without a value, the value is
   *   {{camelCase(name)}}. Credential headers (Authorization, Cookie, names with token, key, secret, session or
   *   auth) are left out of the no-token checks and replace the spec's own auth
   * @returns {Object} { result, output: [{ type: 'collection', data }], lock, summary }, or
   *   { result: false, reason } when the input is not a convertV2WithTypes result made with
   *   `generateContractTests: true`, `headers` is invalid, or the lock has an unsupported `lockfileVersion`
   *   or an invalid `exclude` or `bindings` entry
   */
  build = (conversion, options = {}) => {
    const converted = _.get(conversion, 'output[0].data');

    if (!_.get(conversion, 'result') || !converted || _.isEmpty(conversion.extractedTypes)) {
      return { result: false, reason: 'Expected a successful convertV2WithTypes result with extractedTypes' };
    }

    const hasContractTests = flattenItems(converted.item).some((item) => {
      return _.some(item.event, (e) => { return _.includes(_.get(e, 'script.exec'), CONTRACT_TEST_MARKER); });
    });

    if (!hasContractTests) {
      return { result: false, reason: 'Expected a convertV2WithTypes result made with generateContractTests: true' };
    }

    const headers = _.map(options.headers, normalizeHeader);

    if (!_.every(headers)) { return { result: false, reason: 'Each header needs a name: { name, value }' }; }

    const { isExcluded, error } = readExclude(options.lock),
      lockError = versionError(options.lock) || error || findBindingsError(options.lock);

    if (lockError) { return { result: false, reason: lockError }; }

    const specHash = `sha256:${hash(sortKeys(conversion.extractedTypes), 16)}`,
      [excluded, operations] = _.partition(listOperations(conversion.extractedTypes, converted),
        (op) => { return isExcluded(op.key); }),
      { bindings, flows, lock, summary } = reconcile({
        operations,
        excluded: new Set(_.map(excluded, 'key')),
        lock: options.lock
      }),
      { collection, skipped, unapplied } = buildCollection({
        collection: converted,
        operations,
        bindings,
        flows,
        seed: specHash,
        headers
      });

    // A linked value the request has no place for (e.g. an XML body) is as unresolved as one with no source.
    const unresolved = summary.unresolved.concat(unapplied.map(({ operation, param }) => {
      return unresolvedRef(operation, param, 'the request body format cannot take a linked value', true);
    }));

    return {
      result: true,
      output: [{ type: 'collection', data: collection }],
      lock,
      summary: Object.assign({}, summary,
        { excluded: _.map(excluded, 'key').sort(), skipped, unresolved })
    };
  };

module.exports = { build };
