// Import types from @types/postman-collection
import type { CollectionDefinition } from 'postman-collection';

// Re-export only the types that are actually used
export type { CollectionDefinition as PostmanCollectionDefinition };

/**
 * Input types for the OpenAPI to Postman converter
 */
export interface StringInput {
  type: 'string';
  data: string;
}

export interface JsonInput {
  type: 'json';
  data: object;
}

export interface FileInput {
  type: 'file';
  data: string; // file path
}

export interface FolderFileData {
  fileName: string;
  content?: string;
}

export interface FolderInput {
  type: 'folder';
  data: FolderFileData[];
  origin?: 'browser' | 'node';
  rootFiles?: FolderFileData[];
  specificationVersion?: string;
}

export type ConverterInput = StringInput | JsonInput | FileInput | FolderInput;

/**
 * Conversion options
 */
export interface ConversionOptions {
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
 * Conversion result types
 */
export interface ConversionOutput {
  type: 'collection';
  data: CollectionDefinition;
}

export interface ConversionSuccessResult {
  result: true;
  output: ConversionOutput[];
  analytics?: {
    actualStack?: number;
    numberOfRequests?: number;
    assignedStack?: number;
    complexityScore?: number;
  };
  extractedTypes?: Record<string, unknown>;
}

export interface ConversionErrorResult {
  result: false;
  reason: string;
}

export type ConversionResult = ConversionSuccessResult | ConversionErrorResult;

/**
 * Validation result types
 */
export interface ValidationSuccessResult {
  result: true;
  specificationVersion?: string;
}

export interface ValidationErrorResult {
  result: false;
  reason: string;
}

export type ValidationResult = ValidationSuccessResult | ValidationErrorResult;

/**
 * Callback type for async operations
 */
export type ConversionCallback = (error: Error | null, result?: ConversionResult) => void;

/**
 * Option definition for documentation
 */
export interface OptionDefinition {
  name: string;
  id: string;
  type: 'boolean' | 'enum' | 'integer' | 'array';
  default: unknown;
  availableOptions?: string[];
  description: string;
  external: boolean;
  usage: string[];
  supportedIn: string[];
  supportedModuleVersion: string[];
}

/**
 * Module version
 */
export type ModuleVersion = 'v1' | 'v2';
