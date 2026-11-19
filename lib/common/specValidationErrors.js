/**
 * Codes for known specification authoring errors. They are attached as `code` (with an optional
 * `meta` object) to validation results and errors so that consumers can show a specific message
 * instead of a generic failure. The existing `reason` / `message` strings are left untouched.
 */
const SPEC_VALIDATION_ERROR_CODES = {
  SPEC_EMPTY: 'SPEC_EMPTY',
  SPEC_INVALID_FORMAT: 'SPEC_INVALID_FORMAT',
  SPEC_VERSION_MISSING: 'SPEC_VERSION_MISSING',
  SPEC_VERSION_MISMATCH: 'SPEC_VERSION_MISMATCH',
  SPEC_INFO_MISSING: 'SPEC_INFO_MISSING',
  SPEC_INFO_TITLE_MISSING: 'SPEC_INFO_TITLE_MISSING',
  SPEC_INFO_VERSION_MISSING: 'SPEC_INFO_VERSION_MISSING',
  SPEC_PATHS_MISSING: 'SPEC_PATHS_MISSING',
  SPEC_PATHS_INVALID: 'SPEC_PATHS_INVALID',
  SPEC_SWAGGER_VERSION_INVALID: 'SPEC_SWAGGER_VERSION_INVALID',
  SPEC_DUPLICATE_COMPONENT_NAME: 'SPEC_DUPLICATE_COMPONENT_NAME',
  SPEC_NO_VALID_PATHS: 'SPEC_NO_VALID_PATHS'
};

/**
 * Copies `code` and `meta` from a validation result (or error) onto the target, if a code is present.
 * Targets without a code on the source are left untouched so uncoded failures keep their current shape.
 *
 * @param {Object} target - Error or result object to receive the code
 * @param {Object} source - Validation result or error that may carry a code
 * @returns {Object} The target
 */
function assignErrorCode (target, source) {
  if (source && source.code) {
    target.code = source.code;

    if (source.meta) {
      target.meta = source.meta;
    }
  }

  return target;
}

/**
 * Checks whether an error carries one of the specification validation error codes
 *
 * @param {*} error - Error to check
 * @returns {Boolean} true if the error has a known specification validation code
 */
function hasSpecValidationErrorCode (error) {
  return Boolean(error) && Object.values(SPEC_VALIDATION_ERROR_CODES).includes(error.code);
}

module.exports = {
  SPEC_VALIDATION_ERROR_CODES,
  assignErrorCode,
  hasSpecValidationErrorCode
};
