// Spec contract testing: rearranges the collection produced by convertV2WithTypes into one that
// exercises the API in a valid order (create, read, update, child resources, teardown), keeping the
// converter's status and schema checks. Links between requests are inferred from extractedTypes and
// can be pinned with a lock. Collection generation itself is unchanged.
const _ = require('lodash'),
  { hash } = require('./utils'),
  { listOperations } = require('./operations'),
  { reconcile } = require('./lock'),
  { buildCollection } = require('./collection'),

  /**
   * Builds the contract-test collection from a convertV2WithTypes result.
   *
   * @param {Object} conversion - convertV2WithTypes result (with output and extractedTypes)
   * @param {Object} [options] - options
   * @param {Object} [options.lock] - previously saved lock; its bindings are reused
   * @param {String[]} [options.excludeOperations] - regex sources matched against "METHOD /path"
   * @param {String} [options.authHeader] - header sent on every request, valued {{camelCase(header)}}
   * @returns {Object} { result, output: [{ type: 'collection', data }], lock, summary }, or
   *   { result: false, reason } when the input is not a convertV2WithTypes result
   */
  build = (conversion, options = {}) => {
    const converted = _.get(conversion, 'output[0].data');

    if (!_.get(conversion, 'result') || !converted || _.isEmpty(conversion.extractedTypes)) {
      return { result: false, reason: 'Expected a successful convertV2WithTypes result with extractedTypes' };
    }

    const exclude = _.map(options.excludeOperations, (pattern) => { return new RegExp(pattern); }),
      isExcluded = (op) => { return exclude.some((pattern) => { return pattern.test(op.key); }); },
      specHash = `sha256:${hash(conversion.extractedTypes, 16)}`,
      allOperations = listOperations(conversion.extractedTypes),
      operations = _.reject(allOperations, isExcluded),
      { bindings, flows, lock, summary } = reconcile({
        title: _.get(converted, 'info.name'),
        specHash,
        operations,
        lock: options.lock
      }),
      { collection, skipped } = buildCollection({
        collection: converted,
        operations,
        bindings,
        flows,
        seed: specHash,
        authHeader: options.authHeader && { name: options.authHeader, variable: _.camelCase(options.authHeader) }
      });

    return {
      result: true,
      output: [{ type: 'collection', data: collection }],
      lock,
      summary: Object.assign({ excluded: allOperations.length - operations.length, skipped }, summary)
    };
  };

module.exports = { build };
