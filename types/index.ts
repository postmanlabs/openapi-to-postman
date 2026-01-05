/**
 * Conversion options
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

export type SpecInput =
  | { type: 'string'; data: string }
  | { type: 'json'; data: string | object }
  | { type: 'file'; data: string };
interface FileData {
  fileName: string;
  path?: string;
  content?: string;
}
export interface FolderInput {
  type: 'folder';
  data: FileData[];
  origin?: 'browser';
}

export interface MultiFileSpecInput {
  type: 'multiFile';
  data: FileData[];
  origin?: 'browser';
  specificationVersion?: string;
  rootFiles?: { path: string }[];
  bundleFormat?: 'JSON' | 'YAML';
  remoteRefResolver?: (url: string) => Promise<string>;
}

export type ValidationResult =
  | { result: true; specificationVersion?: string }
  | { result: false; reason: string; error?: Error };

export interface ConversionResult {
  result: true;
  output: { type: 'collection'; data: object }[];
  analytics?: {
    actualStack?: number;
    numberOfRequests?: number;
    assignedStack?: number;
    complexityScore?: number;
  };
  extractedTypes?: Record<string, string>;
}

export type ConversionCallback = (
  err: { message: string; name?: string } | null,
  result?: ConversionResult
) => void;

interface MetadataResult {
  result: true;
  name: string;
  output: { type: 'collection'; name: string }[];
}

export type MetadataCallback = (
  err: Error | null,
  result?: MetadataResult | ValidationResult
) => void;

export type MergeAndValidateCallback = (
  err: Error | null,
  result?: ValidationResult
) => void;

export interface SyncOptions {
  syncExamples: boolean;
}

export interface OptionDefinition {
  name: string;
  id: string;
  type: 'boolean' | 'enum' | 'integer' | 'array';
  default: boolean | string | number | string[];
  availableOptions?: string[];
  description: string;
  external: boolean;
  usage: ('CONVERSION' | 'VALIDATION' | 'BUNDLE')[];
  supportedIn: ('2.0' | '3.0' | '3.1')[];
  supportedModuleVersion: ('v1' | 'v2')[];
  disabled?: boolean;
}

export interface OptionsCriteria {
  version?: '2.0' | '3.0' | '3.1';
  moduleVersion?: 'v1' | 'v2';
  usage?: ('CONVERSION' | 'VALIDATION' | 'BUNDLE')[];
  external?: boolean;
}

export type OptionsUseMode = Record<string, boolean | string | number | string[]>;

interface SpecificationInfo {
  type: 'OpenAPI';
  version: string;
}

export interface RootFiles {
  result: true;
  output: {
    type: 'rootFiles';
    specification: SpecificationInfo;
    data: { path: string }[];
  };
}

export interface RelatedFiles {
  result: true;
  output: {
    type: 'relatedFiles';
    specification: SpecificationInfo;
    data: {
      rootFile: { path: string };
      relatedFiles: { path: string }[];
      missingRelatedFiles: { path: string | null }[];
    }[];
  };
}

export interface BundledContent {
  result: true;
  output: {
    type: 'bundledContent';
    specification: SpecificationInfo;
    data: {
      rootFile: { path: string };
      bundledContent: string | object;
      referenceMap?: Record<string, string>;
    }[];
  };
}
