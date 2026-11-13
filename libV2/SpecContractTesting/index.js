// Spec contract testing: rearranges the collection produced by convertV2WithTypes into one that
// exercises the API in a valid order (create, read, update, child resources, teardown), keeping the
// converter's status and schema checks. Values are passed between requests by name (see links.js); values
// no response returns become empty collection variables for the caller to set. Every operation runs unless
// it is excluded. Collection generation itself is unchanged.
const _ = require('lodash'),
  { hash, sortKeys, flattenItems } = require('./utils'),
  { CONTRACT_TEST_MARKER } = require('../CollectionGeneration/contractTests'),
  { listOperations } = require('./operations'),
  { link } = require('./links'),
  { buildFlows, dropUnorderedConsumers } = require('./order'),
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

  // `METHOD /path`, where `*` matches anything: `DELETE /pets/{petId}`, `* /internal/*`.
  toMatcher = (pattern) => {
    return new RegExp(`^${_.escapeRegExp(pattern.trim()).replace(/\\\*/g, '.*')}$`, 'i');
  },

  /**
   * Builds the contract-test collection from a convertV2WithTypes result.
   *
   * @param {Object} conversion - convertV2WithTypes result (with output and extractedTypes)
   * @param {Object} [options] - options
   * @param {String[]} [options.exclude] - operations not to run, as `METHOD /path`, where `*` matches anything
   * @param {Object[]} [options.headers] - { name, value } sent on every request; without a value, the value is
   *   {{camelCase(name)}}. Credential headers (Authorization, Cookie, names with token, key, secret, session or
   *   auth) are left out of the no-token checks and replace the spec's own auth
   * @returns {Object} { result, output: [{ type: 'collection', data }], summary }, or { result: false, reason }
   *   when the input is not a convertV2WithTypes result made with `generateContractTests: true`, or `headers`
   *   or `exclude` is invalid. summary: { excluded, links, inputs, errors }: `inputs` are the values no
   *   response returns, `errors` what keeps the collection from running as generated
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

    const headers = _.map(options.headers, normalizeHeader),
      exclude = options.exclude || [];

    if (!_.every(headers)) { return { result: false, reason: 'Each header needs a name: { name, value }' }; }
    if (!_.isArray(exclude) || !_.every(exclude, (pattern) => { return _.isString(pattern) && pattern.trim(); })) {
      return { result: false, reason: 'Each exclude entry is a string: "METHOD /path", where * matches anything' };
    }

    const matchers = exclude.map(toMatcher),
      allOperations = listOperations(conversion.extractedTypes, converted),
      isExcluded = (op) => { return matchers.some((matcher) => { return matcher.test(op.key); }); },
      [excluded, operations] = _.partition(allOperations, isExcluded),
      links = link(operations, headers.map((header) => { return header.name.toLowerCase(); })),
      flows = buildFlows(operations, links),
      { runnable, errors: orderErrors } = dropUnorderedConsumers(links, flows, operations),
      { collection, unapplied } = buildCollection({
        collection: converted,
        operations,
        links: runnable,
        flows,
        seed: `sha256:${hash(sortKeys(conversion.extractedTypes), 16)}`,
        headers
      }),
      [produced, inputs] = _.partition(links, 'producer'),
      errors = exclude.filter((pattern, index) => {
        return !allOperations.some((op) => { return matchers[index].test(op.key); });
      }).map((pattern) => { return `exclude "${pattern}" matches no operation`; })
        .concat(orderErrors, unapplied.map(({ operation, variable }) => {
          return `${operation} has no place for {{${variable}}} in its request body`;
        }));

    return {
      result: true,
      output: [{ type: 'collection', data: collection }],
      summary: {
        excluded: _.map(excluded, 'key').sort(),
        links: produced,
        inputs: inputs.map((input) => { return _.pick(input, ['variable', 'consumers']); }),
        errors
      }
    };
  };

module.exports = { build };
