// OpenAPI 3.2 root-level validation.
// 3.2 is a near-superset of 3.1: the document validity rules are identical
// (openapi + info required; at least one of paths / webhooks / components must
// be present when webhooks are enabled). We delegate to the 3.1 validator so
// the rules stay in lock-step until 3.2 introduces a divergence that needs a
// dedicated implementation.
const inputValidation31X = require('../31XUtils/inputValidation31X');

module.exports = {

  /**
   * Validate Spec to check if some of the required fields are present.
   * OpenAPI 3.2 only openapi and info are always required,
   * but the document must also contain at least one of paths or webhooks or components.
   * @param {Object} spec OpenAPI spec
   * @param {Object} options computed process options
   * @return {Object} Validation result
   */
  validateSpec: function (spec, options) {
    return inputValidation31X.validateSpec(spec, options);
  }
};
