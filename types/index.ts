/**
 * Shared type definitions for openapi-to-postmanv2
 */
// ============================================================================
// Core Types
// ============================================================================

export interface SpecificationInput {
  type: 'string' | 'json' | 'file' | 'folder' | 'multiFile';
  data: string | object | { fileName: string; path?: string; content?: string }[];
  origin?: string;
  specificationVersion?: string;
  rootFiles?: { path: string }[];
  bundleFormat?: 'JSON' | 'YAML';
  remoteRefResolver?: (url: string) => Promise<string>;
}

// ============================================================================
// Result Types
// ============================================================================

// Base result fields
interface BaseResult {
  result: boolean;
  reason?: string;
  error?: Error;
}

export interface CollectionResult extends BaseResult {
  output?: { type: string; data: object; name?: string }[];
  analytics?: Record<string, number>;
  extractedTypes?: Record<string, object>;
  name?: string;
}

export interface ContractTestResult extends CollectionResult {

  /**
   * Updated bindings lock: `{ lockfileVersion, exclude, bindings: [{ variable, note?, producer, consumers }] }`.
   * Saved entries are kept as written and in order; new links and values nothing returns
   * (`producer: null`) are appended.
   */
  lock?: object;
  summary?: {

    /** Operations left out by the lock's `exclude` section. */
    excluded: string[];

    /** Operations left out because a value they need is unresolved (see `unresolved`). */
    skipped: string[];

    /** Number of saved bindings, placeholders included. */
    unchanged: number;

    /** Bindings appended to the lock: new links (with `rule` and `score`) and new placeholders. */
    added: object[];

    /** `{ variable, consumer }` for consumers appended to a saved binding. */
    extended: object[];

    /** `{ variable, reason }` for problems with saved bindings, e.g. a request no longer in the spec. */
    warnings: object[];

    /** `{ variable, consumer, producer }` for placeholder values a response can now provide. */
    suggestions: object[];

    /** `{ operation, param, reason, fallback }` for every value that isn't linked. */
    unresolved: object[];
  };
}

export interface BundleResult extends BaseResult {
  output?: {
    type: string;
    data: Array<{
      rootFile: { path: string };
      bundledContent: string;
      referenceMap?: object;
    }>;
    specification?: {
      type: string;
      version: string;
    };
  };
  specificationVersion?: string;
}

export interface FilesResult extends BaseResult {
  output?: {
    type: string;
    data: Array<{ path: string }>;
    specification?: {
      type: string;
      version: string;
    };
  };
}

export interface ValidationResult extends BaseResult {
  specificationVersion?: string;
}

export type Callback<T extends BaseResult = CollectionResult> = (
  err: { message: string; name?: string } | null,
  result?: T
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

  /** Add a contract test (status-code + response-schema assertions) to each generated request */
  generateContractTests?: boolean;

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
/**
 * Options for generating the spec contract-test collection
 */
export interface ContractTestOptions {

  /**
   * Bindings lock from a previous run: its links are reused instead of being inferred again, and the
   * operations in its `exclude` section ({ operation } or { pattern } on "METHOD /path") are left out.
   */
  lock?: object | null;

  /** Header sent on every request (e.g. "x-access-token"), valued {{camelCase(header)}}. */
  authHeader?: string;
}

export interface SyncOptions {

  /** Whether to sync response examples from the OpenAPI specification */
  syncExamples?: boolean;

  /**
   * Whether to delete requests and folders that exist in the collection but no longer exist in the
   * OpenAPI specification. Defaults to false, which preserves such orphans.
   */
  deleteOrphanedRequests?: boolean;
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

