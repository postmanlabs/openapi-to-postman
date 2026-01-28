/**
 * Shared type definitions for openapi-to-postmanv2
 */
// ============================================================================
// Core Types
// ============================================================================

export interface SpecificationInput {
  type: 'string' | 'json' | 'file' | 'folder' | 'multiFile';
  data: string | object | { fileName: string; path?: string; content?: string }[];
  origin?: 'browser';
  specificationVersion?: string;
  rootFiles?: { path: string }[];
  bundleFormat?: 'JSON' | 'YAML';
  remoteRefResolver?: (url: string) => Promise<string>;
}

// ============================================================================
// Result Types
// ============================================================================

// Failure result type
export interface FailureResult {
  result: false;
  reason: string;
  error?: Error;
}

// Generic success result with output array
export interface SuccessResult {
  result: true;
  output: { type: string; data: unknown }[];
  analytics?: Record<string, unknown>;
  extractedTypes?: Record<string, unknown>;
  specificationVersion?: string;
}

// Base Result type
export type Result = SuccessResult | FailureResult;

export type Callback = (
  err: { message: string; name?: string } | null,
  result?: Result
) => void;

// ============================================================================
// Options Types
// ============================================================================

export type SpecVersion = '2.0' | '3.0' | '3.1';
export type ModuleVersion = 'v1' | 'v2';
export type UsageType = 'CONVERSION' | 'VALIDATION' | 'BUNDLE' | 'SYNC';

export type OptionsRecord = Record<string, boolean | string | number | string[]>;


/**
 * Conversion options for OpenAPI to Postman conversion
 */
export interface Options {

  /** Determines how the requests inside the generated collection will be named */
  requestNameSource?: 'URL' | 'Fallback';

  /** Option for setting indentation character */
  indentCharacter?: 'Space' | 'Tab';

  /** Importing will collapse all folders that have only one child element (V1 only) */
  collapseFolders?: boolean;

  /** Optimizes conversion for large specification (V1 only) */
  optimizeConversion?: boolean;

  /** Request parameter generation based on schema or example (V1 only) */
  requestParametersResolution?: 'Example' | 'Schema';

  /** Response parameter generation based on schema or example (V1 only) */
  exampleParametersResolution?: 'Example' | 'Schema';

  /** Whether disabled parameters of collection should be validated */
  disabledParametersValidation?: boolean;

  /** Parameter generation based on schema or example */
  parametersResolution?: 'Example' | 'Schema';

  /** Folder organization strategy */
  folderStrategy?: 'Paths' | 'Tags';

  /** Enable nested folder hierarchy using tags */
  nestedFolderHierarchy?: boolean;

  /** Whether or not schemas should be faked */
  schemaFaker?: boolean;

  /** Schema resolution nesting limit */
  stackLimit?: number;

  /** Include auth info in example requests */
  includeAuthInfoInExample?: boolean;

  /** Short error messages during validation */
  shortValidationErrors?: boolean;

  /** Properties to ignore during validation */
  validationPropertiesToIgnore?: string[];

  /** Whether MISSING_IN_SCHEMA mismatches should be returned */
  showMissingInSchemaErrors?: boolean;

  /** Show detailed body validation messages */
  detailedBlobValidation?: boolean;

  /** Suggest fixes if available */
  suggestAvailableFixes?: boolean;

  /** Show metadata validation messages */
  validateMetadata?: boolean;

  /** Ignore mismatch for unresolved postman variables */
  ignoreUnresolvedVariables?: boolean;

  /** Enable strict request matching */
  strictRequestMatching?: boolean;

  /** Allow matching of path variables present in URL */
  allowUrlPathVarMatching?: boolean;

  /** Enable optional parameters */
  enableOptionalParameters?: boolean;

  /** Keep implicit headers from OpenAPI specification */
  keepImplicitHeaders?: boolean;

  /** Include webhooks in generated collection (3.1 only) */
  includeWebhooks?: boolean;

  /** Include reference map in output */
  includeReferenceMap?: boolean;

  /** Include deprecated properties */
  includeDeprecated?: boolean;

  /** Always inherit authentication from collection */
  alwaysInheritAuthentication?: boolean;

  /** Preferred request body type when multiple content-types exist */
  preferredRequestBodyType?: 'x-www-form-urlencoded' | 'form-data' | 'raw' | 'first-listed';
}

/**
 * Sync options for collection synchronization
 */
export interface SyncOptions {

  /** Whether to sync response examples from the OpenAPI specification */
  syncExamples?: boolean;
}

export interface OptionDefinition {
  name: string;
  id: string;
  type: 'boolean' | 'enum' | 'integer' | 'array';
  default: boolean | string | number | string[];
  availableOptions?: string[];
  description: string;
  external: boolean;
  usage: UsageType[];
  supportedIn: SpecVersion[];
  supportedModuleVersion: ModuleVersion[];
  disabled?: boolean;
}

export interface OptionsCriteria {
  version?: SpecVersion;
  moduleVersion?: ModuleVersion;
  usage?: UsageType[];
  external?: boolean;
}

