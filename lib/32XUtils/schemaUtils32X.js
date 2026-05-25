// OpenAPI 3.2 schema utilities.
//
// OAS 3.2 is largely a superset of 3.1 from the converter's point of view:
//  - JSON Schema dialect is 2020-12 (same as 3.1)
//  - The document still has paths / webhooks / components carve-outs
//  - The newly introduced 3.2 features (e.g. hierarchical tags via `tags.parent`,
//    `tags.kind`, `parameter.in: querystring`, `discriminator.defaultMapping`,
//    `responses.<code>.summary`, sealed objects) are additive and unknown-keys
//    safe — the existing 3.1 conversion pipeline ignores them rather than
//    crashing on them, which yields a usable collection for the common case.
//
// To stay in lock-step with 3.1 while keeping the door open for 3.2-only
// divergence in the future, we reuse the 3.1 utilities verbatim and only
// override the reported `version` marker.
const schemaUtils31X = require('../31XUtils/schemaUtils31X'),
  inputValidation32X = require('./inputValidation32X'),
  schemaUtilsCommon = require('../common/schemaUtilsCommon');

module.exports = Object.assign({}, schemaUtils31X, {
  version: '3.2.x',

  /**
   * Parses an OAS 3.2.X string/object as a YAML or JSON
   * @param {YAML/JSON} openApiSpec - The OAS 3.2.x specification specified in either YAML or JSON
   * @param {Object} options computed process options
   * @returns {Object} - Contains the parsed JSON-version of the OAS spec, or an error
   * @no-unit-test
   */
  parseSpec: function (openApiSpec, options) {
    return schemaUtilsCommon.parseSpec(openApiSpec, inputValidation32X, options);
  },

  inputValidation: inputValidation32X
});
