/**
 * Strict validation of the "paths" object, run only when the `strictPathsValidation` option is enabled.
 * It rejects a specification only when none of its paths can be used, so partially valid specs still convert.
 */
const _ = require('lodash'),
  { SPEC_VALIDATION_ERROR_CODES } = require('./specValidationErrors'),
  EXTENSION_PREFIX = 'x-',
  LOCAL_REF_PREFIX = '#',
  MAX_EXAMPLE_LENGTH = 100,
  INVALID_PATH_REASONS = {
    QUERY_OR_FRAGMENT: 'QUERY_OR_FRAGMENT',
    MISSING_LEADING_SLASH: 'MISSING_LEADING_SLASH',
    UNRESOLVED_REF: 'UNRESOLVED_REF',
    MIXED: 'MIXED'
  };

/**
 * Checks whether a local reference (e.g. "#/components/pathItems/Pets") points to an existing value in the spec
 *
 * @param {Object} spec - Parsed specification
 * @param {String} ref - Value of the $ref
 * @returns {Boolean} true if the reference is local and resolvable
 */
function isResolvableLocalRef (spec, ref) {
  if (!ref.startsWith(LOCAL_REF_PREFIX)) {
    return false;
  }

  try {
    const pathSegments = ref.slice(LOCAL_REF_PREFIX.length).split('/').slice(1).map((segment) => {
      return decodeURIComponent(segment.replace(/~1/g, '/').replace(/~0/g, '~'));
    });

    return _.has(spec, pathSegments);
  }
  catch (error) {
    // Malformed URI encoding in the pointer, so it can't be resolved
    return false;
  }
}

/**
 * Determines why a path entry can't be used, if at all
 *
 * @param {Object} spec - Parsed specification
 * @param {String} pathKey - Key of the entry in the paths object
 * @param {*} pathItem - Value of the entry in the paths object
 * @returns {Object|null} { reason, example } for an unusable entry, null for a usable one
 */
function getInvalidPathEntry (spec, pathKey, pathItem) {
  if (pathKey.includes('?') || pathKey.includes('#')) {
    return { reason: INVALID_PATH_REASONS.QUERY_OR_FRAGMENT, example: pathKey };
  }

  if (!pathKey.startsWith('/')) {
    return { reason: INVALID_PATH_REASONS.MISSING_LEADING_SLASH, example: pathKey };
  }

  if (_.isPlainObject(pathItem) && _.isString(pathItem.$ref) && !isResolvableLocalRef(spec, pathItem.$ref)) {
    return { reason: INVALID_PATH_REASONS.UNRESOLVED_REF, example: pathItem.$ref };
  }

  return null;
}

/**
 * Validates that the "paths" object is an object and that at least one of its (non-extension) entries is usable.
 * Missing "paths" is not handled here, the version specific validators already take care of that.
 *
 * @param {Object} spec - Parsed specification
 * @returns {Object} Validation result, with `code` and `meta` when the paths are rejected
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

  const pathKeys = _.filter(Object.keys(paths), (pathKey) => { return !pathKey.startsWith(EXTENSION_PREFIX); }),
    invalidEntries = [];

  for (const pathKey of pathKeys) {
    const invalidEntry = getInvalidPathEntry(spec, pathKey, paths[pathKey]);

    if (!invalidEntry) {
      return { result: true };
    }

    invalidEntries.push(invalidEntry);
  }

  if (_.isEmpty(invalidEntries)) {
    return { result: true };
  }

  const reasons = _.uniq(_.map(invalidEntries, 'reason'));

  return {
    result: false,
    reason: 'Specification must contain at least one valid path',
    code: SPEC_VALIDATION_ERROR_CODES.SPEC_NO_VALID_PATHS,
    meta: {
      reason: reasons.length === 1 ? reasons[0] : INVALID_PATH_REASONS.MIXED,
      example: String(invalidEntries[0].example).slice(0, MAX_EXAMPLE_LENGTH)
    }
  };
}

module.exports = {
  validatePaths,
  INVALID_PATH_REASONS
};
