/**
 * Validation of the "paths" object. It rejects a specification only when none of its paths can be used,
 * so partially valid specs still convert.
 */
const _ = require('lodash'),
  { SPEC_VALIDATION_ERROR_CODES } = require('./specValidationErrors'),
  EXTENSION_PREFIX = 'x-',
  MAX_EXAMPLE_LENGTH = 100;

/**
 * Validates that the "paths" object is an object and that at least one of its (non-extension) keys
 * starts with "/". Missing "paths" is not handled here, the version specific validators already take care of that.
 *
 * @param {Object} spec - Parsed specification
 * @returns {Object} Validation result, with `code` (and `meta` when available) when the paths are rejected
 */
function validatePaths (spec) {
  const paths = spec.paths;

  if (_.isNil(paths)) {
    return { result: true };
  }

  if (!_.isPlainObject(paths)) {
    return {
      result: false,
      reason: 'Specification "paths" must be an object',
      code: SPEC_VALIDATION_ERROR_CODES.SPEC_PATHS_INVALID
    };
  }

  const pathKeys = _.filter(Object.keys(paths), (pathKey) => { return !pathKey.startsWith(EXTENSION_PREFIX); });

  if (_.isEmpty(pathKeys) || _.some(pathKeys, (pathKey) => { return pathKey.startsWith('/'); })) {
    return { result: true };
  }

  return {
    result: false,
    reason: 'Specification must contain at least one valid path',
    code: SPEC_VALIDATION_ERROR_CODES.SPEC_NO_VALID_PATHS,
    meta: {
      example: pathKeys[0].slice(0, MAX_EXAMPLE_LENGTH)
    }
  };
}

module.exports = {
  validatePaths
};
