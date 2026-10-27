// Spec contract testing: rearranges the collection produced by convertV2WithTypes into one that
// exercises the API in a valid order (create, read, update, child resources, teardown), keeping the
// converter's status and schema checks. Links between requests are inferred from extractedTypes and
// can be pinned with a lock. Every operation runs unless the lock excludes it or a value it needs
// can't be resolved (listed under `unresolved`). Collection generation itself is unchanged.
const _ = require('lodash'),
  { hash, sortKeys, flattenItems } = require('./utils'),
  { CONTRACT_TEST_MARKER } = require('../CollectionGeneration/contractTests'),
  { listOperations } = require('./operations'),
  { versionError, readExclude, findDuplicateConsumer, unresolvedRef, reconcile } = require('./lock'),
  { buildCollection } = require('./collection'),

  /**
   * Builds the contract-test collection from a convertV2WithTypes result.
   *
   * @param {Object} conversion - convertV2WithTypes result (with output and extractedTypes)
   * @param {Object} [options] - options
   * @param {Object} [options.lock] - previously saved lock; its bindings are reused and its `exclude`
   *   entries ({ operation } or { pattern } matched against "METHOD /path") are left out
   * @param {String} [options.authHeader] - header sent on every request, valued {{camelCase(header)}}
   * @returns {Object} { result, output: [{ type: 'collection', data }], lock, summary }, or
   *   { result: false, reason } when the input is not a convertV2WithTypes result made with
   *   `generateContractTests: true`, or the lock has an unsupported `lockfileVersion`, an invalid
   *   `exclude` entry, or a consumer listed under two bindings
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

    const { isExcluded, error } = readExclude(options.lock),
      lockError = versionError(options.lock) || error || findDuplicateConsumer(options.lock);

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
        authHeader: options.authHeader && { name: options.authHeader, variable: _.camelCase(options.authHeader) }
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
