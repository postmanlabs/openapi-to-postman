/**
 * Types for `openapi-to-postmanv2/lib/common/specValidationErrors`, which can be imported on its own
 * (without loading the converter). Keep in sync with specValidationErrors.js.
 */

/**
 * Codes for known specification authoring errors, attached as `code` to validation results and errors
 */
export declare const SPEC_VALIDATION_ERROR_CODES: {
  readonly SPEC_EMPTY: 'SPEC_EMPTY';
  readonly SPEC_INVALID_FORMAT: 'SPEC_INVALID_FORMAT';
  readonly SPEC_VERSION_MISSING: 'SPEC_VERSION_MISSING';
  readonly SPEC_VERSION_MISMATCH: 'SPEC_VERSION_MISMATCH';
  readonly SPEC_INFO_MISSING: 'SPEC_INFO_MISSING';
  readonly SPEC_INFO_TITLE_MISSING: 'SPEC_INFO_TITLE_MISSING';
  readonly SPEC_INFO_VERSION_MISSING: 'SPEC_INFO_VERSION_MISSING';
  readonly SPEC_PATHS_MISSING: 'SPEC_PATHS_MISSING';
  readonly SPEC_PATHS_INVALID: 'SPEC_PATHS_INVALID';
  readonly SPEC_SWAGGER_VERSION_INVALID: 'SPEC_SWAGGER_VERSION_INVALID';
  readonly SPEC_DUPLICATE_COMPONENT_NAME: 'SPEC_DUPLICATE_COMPONENT_NAME';
  readonly SPEC_NO_VALID_PATHS: 'SPEC_NO_VALID_PATHS';
};

export type SpecValidationErrorCode = keyof typeof SPEC_VALIDATION_ERROR_CODES;

/**
 * Returns the user-facing message for a specification validation error code
 *
 * @param code - Validation error code, as attached to validation results and errors
 * @param meta - Details reported along with the code
 * @param expectedVersion - Version the specification is set up as (2.0, 3.0, 3.1 or 3.2). Used when meta doesn't
 * carry it.
 * @returns The message, or undefined for an unknown code or incomplete meta
 */
export declare function getSpecValidationErrorMessage(
  code: unknown,
  meta?: unknown,
  expectedVersion?: string
): string | undefined;

/**
 * Copies `code` and `meta` from a validation result (or error) onto the target, if a code is present
 */
export declare function assignErrorCode<T>(target: T, source: unknown): T;

/**
 * Checks whether an error carries one of the specification validation error codes
 */
export declare function hasSpecValidationErrorCode(error: unknown): boolean;
