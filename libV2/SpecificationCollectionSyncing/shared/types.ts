/**
 * Shared type definitions for SpecificationCollection modules
 */

import { OpenAPIV3 } from 'openapi-types';
import {
  Collection,
  CollectionDefinition,
  Item,
  ItemGroup,
  QueryParamDefinition,
  RequestBodyDefinition,
  RequestDefinition,
  RequestAuthDefinition,
  Response,
  ResponseDefinition,
  UrlDefinition,
  Variable,
  VariableDefinition,
  VariableList,
  HeaderDefinition
} from 'postman-collection';

import { AUTH_TYPES } from './constants';

// Re-export commonly used types for convenience
export type {
  Collection,
  CollectionDefinition,
  Item,
  ItemGroup,
  QueryParamDefinition,
  RequestBodyDefinition,
  RequestDefinition,
  RequestAuthDefinition,
  Response,
  ResponseDefinition,
  UrlDefinition,
  Variable,
  VariableDefinition,
  VariableList,
  HeaderDefinition
};

// Re-export OpenAPI types
export type { OpenAPIV3 };

// Custom types used across the modules

/**
 * Type definition for authentication types
 */
export type AuthType = (typeof AUTH_TYPES)[keyof typeof AUTH_TYPES];

export interface ResponseDetails {
  [key: string]: unknown;
}

export interface CollectionTypeItem {
  request: unknown;
  response: ResponseDetails;
}

export interface CollectionTypeData {
  [key: string]: CollectionTypeItem;
}

// Path matching result type
export interface MatchingSpecPath {
  matchingKey: string;
  matchingPath: OpenAPIV3.PathItemObject;
}

// Security scheme mapping type
export interface SecuritySchemeMapping {
  [oldName: string]: string;
}

// Auth parameter merge result type
export interface AuthMergeResult {
  type: string;
  params: VariableList | undefined;
}

export type SyncOptions = {
  syncExamples: boolean;
};
