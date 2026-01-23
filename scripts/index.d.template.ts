/* eslint-disable no-redeclare */
/**
 * OpenAPI to Postman Collection Converter
 * Type definitions for the module exports
 */

import type {
  Input,
  Options,
  Result,
  Callback,
  SyncOptions,
  OptionsCriteria,
  OptionDefinition
} from '../index.d';

export {
  Input,
  Options,
  Result,
  Callback,
  SyncOptions,
  OptionsCriteria,
  OptionDefinition,
  SpecVersion,
  ModuleVersion,
  UsageType
} from '../index.d';

export class SchemaPack {
  constructor(
    input: Input,
    options?: Options,
    moduleVersion?: 'v1' | 'v2',
    enableTypeFetching?: boolean
  );

  validated: boolean;
  openapi: object | null;
  validationResult: Result | null;
  analytics: object;

  validate(): Result;
  convert(callback: Callback): void;
  convertV2(callback: Callback): void;
  getMetaData(callback: Callback): void;
  mergeAndValidate(callback: Callback): void;
  validateTransaction(transactions: object[], callback: Callback): void;
  validateTransactionV2(transactions: object[], callback: Callback): void;
  syncCollection(currentCollection: object, syncOptions: SyncOptions | null, callback: Callback): void;
  detectRootFiles(): Promise<Result>;
  detectRelatedFiles(): Promise<Result>;
  bundle(): Promise<Result>;

  static getOptions(mode?: 'document', criteria?: OptionsCriteria): OptionDefinition[];
  static getOptions(mode: 'use', criteria?: OptionsCriteria): Record<string, boolean | string | number | string[]>;
  static getOptions(mode?: string, criteria?: OptionsCriteria): OptionDefinition[] | Record<string, boolean | string | number | string[]>;

  static getSyncOptions(mode?: 'document'): OptionDefinition[];
  static getSyncOptions(mode: 'use'): Record<string, boolean | string | number | string[]>;
  static getSyncOptions(mode?: string): OptionDefinition[] | Record<string, boolean | string | number | string[]>;
}

export function convert(input: Input, options: Options, callback: Callback): void;
export function convertV2(input: Input, options: Options, callback: Callback): void;
export function convertV2WithTypes(input: Input, options: Options, callback: Callback): void;
export function validate(input: Input): Result;
export function getMetaData(input: Input, callback: Callback): void;
export function mergeAndValidate(input: Input, callback: Callback): void;

export function getOptions(mode?: 'document', criteria?: OptionsCriteria): OptionDefinition[];
export function getOptions(mode: 'use', criteria?: OptionsCriteria): Record<string, boolean | string | number | string[]>;
export function getOptions(mode?: string, criteria?: OptionsCriteria): OptionDefinition[] | Record<string, boolean | string | number | string[]>;

export function getSyncOptions(mode?: 'document'): OptionDefinition[];
export function getSyncOptions(mode: 'use'): Record<string, boolean | string | number | string[]>;
export function getSyncOptions(mode?: string): OptionDefinition[] | Record<string, boolean | string | number | string[]>;

export function detectRootFiles(input: Input): Promise<Result>;
export function detectRelatedFiles(input: Input): Promise<Result>;
export function bundle(input: Input & { options?: Options }): Promise<Result>;
export function syncCollection(
  input: Input,
  options: Options,
  currentCollection: object,
  syncOptions: SyncOptions | null,
  callback: Callback
): void;

