/**
 * Codes for known specification authoring errors. They are attached as `code` (with an optional
 * `meta` object) to validation results and errors so that consumers can show a specific message
 * (see `getSpecValidationErrorMessage`) instead of a generic failure. The existing `reason` /
 * `message` strings are left untouched.
 *
 * This module has no dependencies, so that consumers can import it on its own
 * (`openapi-to-postmanv2/lib/common/specValidationErrors`) without loading the converter.
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

const SWAGGER_VERSION = '2.0',
  SWAGGER_KEY = 'swagger',
  OPENAPI_KEY = 'openapi',
  VERSION_LABELS = {
    '2.0': 'OpenAPI 2.0',
    '3.0': 'OpenAPI 3.0',
    '3.1': 'OpenAPI 3.1',
    '3.2': 'OpenAPI 3.2'
  },
  EXAMPLE_VERSIONS = {
    '3.0': '3.0.3',
    '3.1': '3.1.0',
    '3.2': '3.2.0'
  },
  DUPLICATE_COMPONENT_LABELS = {
    securityScheme: 'security definitions',
    parameter: 'parameters',
    response: 'responses'
  };

/**
 * Checks whether an object has its own property with the given key
 *
 * @param {Object} object - Object to check
 * @param {String} key - Property key
 * @returns {Boolean} true if the object has its own property
 */
function hasOwn (object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Returns a string property of the meta object
 *
 * @param {Object} meta - Details reported along with a code
 * @param {String} key - Property key
 * @returns {String|undefined} The value, or undefined if it isn't a string
 */
function getMetaString (meta, key) {
  return hasOwn(meta, key) && typeof meta[key] === 'string' ? meta[key] : undefined;
}

/**
 * Checks whether a value is one of the versions there are messages for
 *
 * @param {*} version - Version to check
 * @returns {Boolean} true for 2.0, 3.0, 3.1 or 3.2
 */
function isKnownVersion (version) {
  return typeof version === 'string' && hasOwn(VERSION_LABELS, version);
}

/**
 * Returns the version the specification is set up as: the one in meta if it's a known version, otherwise the one
 * passed in. bundle() reports the version it was given as is (e.g. "3.0.0"), so meta can carry an unknown one.
 *
 * @param {Object} meta - Details reported along with a code
 * @param {String} [expectedVersion] - Version the specification is set up as
 * @returns {String|undefined} The version (2.0, 3.0, 3.1 or 3.2), or undefined if neither is known
 */
function getExpectedVersion (meta, expectedVersion) {
  const metaVersion = getMetaString(meta, 'expected');

  if (isKnownVersion(metaVersion)) {
    return metaVersion;
  }

  return isKnownVersion(expectedVersion) ? expectedVersion : undefined;
}

/**
 * Builds the message for SPEC_VERSION_MISSING
 *
 * @param {Object} meta - Details reported along with the code
 * @param {String} [expectedVersion] - Version the specification is set up as
 * @returns {String|undefined} The message, or undefined if the version isn't known
 */
function getVersionMissingMessage (meta, expectedVersion) {
  const version = getExpectedVersion(meta, expectedVersion);

  if (version === SWAGGER_VERSION) {
    return 'Add the "swagger" field with the value "2.0".';
  }

  return version ? `Add the "openapi" field with a version, for example "${EXAMPLE_VERSIONS[version]}".` : undefined;
}

/**
 * Builds the message for SPEC_VERSION_MISMATCH
 *
 * @param {Object} meta - Details reported along with the code
 * @param {String} [expectedVersion] - Version the specification is set up as
 * @returns {String|undefined} The message, or undefined for incomplete or unknown meta
 */
function getVersionMismatchMessage (meta, expectedVersion) {
  const version = getExpectedVersion(meta, expectedVersion),
    foundKey = getMetaString(meta, 'foundKey'),
    found = getMetaString(meta, 'found');

  if (!version || !found) {
    return undefined;
  }

  const label = VERSION_LABELS[version],
    expectedKey = version === SWAGGER_VERSION ? SWAGGER_KEY : OPENAPI_KEY;

  // Only the exact "2.0" is accepted for Swagger, so a 2.0.x value would fail again
  if (foundKey === expectedKey && version === SWAGGER_VERSION) {
    return `This spec is set up as ${label}, but its "${foundKey}" field is "${found}". Set it to "2.0".`;
  }

  if (foundKey === expectedKey) {
    return `This spec is set up as ${label}, but its "${foundKey}" field is "${found}". ` +
      `Change it to a ${version}.x version.`;
  }

  if (foundKey === SWAGGER_KEY) {
    return `This spec is set up as ${label}, but it's written as Swagger ${found}. ` +
      `Use an "openapi" field with a ${version}.x version.`;
  }

  if (foundKey === OPENAPI_KEY) {
    return `This spec is set up as ${label}, but it's written as OpenAPI ${found}. Use "swagger": "2.0" instead.`;
  }

  return undefined;
}

/**
 * Builds the message for SPEC_DUPLICATE_COMPONENT_NAME
 *
 * @param {Object} meta - Details reported along with the code
 * @returns {String|undefined} The message, or undefined for an unknown kind or a missing name
 */
function getDuplicateComponentNameMessage (meta) {
  const kind = getMetaString(meta, 'kind'),
    componentLabel = kind !== undefined && hasOwn(DUPLICATE_COMPONENT_LABELS, kind) ?
      DUPLICATE_COMPONENT_LABELS[kind] :
      undefined,
    name = getMetaString(meta, 'name');

  return componentLabel && name ?
    `Two ${componentLabel} resolve to the same name "${name}". Rename one of them.` :
    undefined;
}

/**
 * Builds the message for SPEC_NO_VALID_PATHS
 *
 * @param {Object} meta - Details reported along with the code
 * @returns {String|undefined} The message, or undefined if the example is missing
 */
function getNoValidPathsMessage (meta) {
  const example = getMetaString(meta, 'example');

  return example === undefined ? undefined : `Paths must start with "/" (found "${example}").`;
}

const MESSAGE_BUILDERS = {
  [SPEC_VALIDATION_ERROR_CODES.SPEC_EMPTY]: () => {
    return 'The specification is empty. Add content to it and try again.';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_INVALID_FORMAT]: () => {
    return 'The specification isn\'t valid JSON or YAML. Fix the syntax errors and try again.';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_VERSION_MISSING]: getVersionMissingMessage,
  [SPEC_VALIDATION_ERROR_CODES.SPEC_VERSION_MISMATCH]: getVersionMismatchMessage,
  [SPEC_VALIDATION_ERROR_CODES.SPEC_INFO_MISSING]: () => {
    return 'Add an "info" object to the specification.';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_INFO_TITLE_MISSING]: () => {
    return 'Add a "title" to the "info" object.';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_INFO_VERSION_MISSING]: () => {
    return 'Add a "version" to the "info" object.';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_PATHS_MISSING]: () => {
    return 'Add a "paths" object to the specification.';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_PATHS_INVALID]: () => {
    return '"paths" must be an object with path keys, for example "/pets".';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_SWAGGER_VERSION_INVALID]: () => {
    return 'Set the "swagger" field to "2.0" (in quotes).';
  },
  [SPEC_VALIDATION_ERROR_CODES.SPEC_DUPLICATE_COMPONENT_NAME]: getDuplicateComponentNameMessage,
  [SPEC_VALIDATION_ERROR_CODES.SPEC_NO_VALID_PATHS]: getNoValidPathsMessage
};

/**
 * Returns the user-facing message for a specification validation error code
 *
 * @param {*} code - Validation error code, as attached to validation results and errors
 * @param {*} [meta] - Details reported along with the code
 * @param {String} [expectedVersion] - Version the specification is set up as (2.0, 3.0, 3.1 or 3.2).
 * Used when meta doesn't carry it.
 * @returns {String|undefined} The message, or undefined for an unknown code or incomplete meta
 */
function getSpecValidationErrorMessage (code, meta, expectedVersion) {
  if (typeof code !== 'string' || !hasOwn(MESSAGE_BUILDERS, code)) {
    return undefined;
  }

  return MESSAGE_BUILDERS[code](meta !== null && typeof meta === 'object' ? meta : {}, expectedVersion);
}

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
  getSpecValidationErrorMessage,
  assignErrorCode,
  hasSpecValidationErrorCode
};
