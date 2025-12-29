import { Response, ResponseDefinition } from 'postman-collection';

import { mergeRequestAndResponseBodyRaw } from './BodyMerger';
import { mergeRequestAndResponseHeaders } from './HeaderMerger';
import { mergeRequestData } from './RequestMerger';

import { SyncOptions } from '../../shared';
import { attachImplicitHeaders } from '../header';

/**
 * Merges a single response from target with a corresponding response from current.
 * Returns the merged response definition.
 * @param {Response} targetResponse - Response from the target request
 * @param {Response } sourceResponse - Response from the source request
 * @param {SyncOptions} syncOptions - Options to control what should be synced
 * @returns {ResponseDefinition} Merged response definition
 */
export function mergeResponseData(
  targetResponse: Response,
  sourceResponse: Response,
  syncOptions: SyncOptions
): ResponseDefinition {
  const targetRes: ResponseDefinition = targetResponse.toJSON(),
    sourceRes: ResponseDefinition = sourceResponse.toJSON();

  if (targetRes?.originalRequest && sourceRes?.originalRequest) {
    targetRes.originalRequest = mergeRequestData(targetRes.originalRequest, sourceRes.originalRequest, syncOptions);
  }
  // Attach implicit headers from the source response to the target response if they are not present in the target response
  // Required because the response body and implicit headers are not generated during collection to spec conversion for non json responses.
  attachImplicitHeaders(sourceRes.header, targetRes.header);

  const shouldSyncExamples = syncOptions?.syncExamples;

  if (targetRes?.header) {
    targetRes.header = shouldSyncExamples
      ? targetRes.header
      : mergeRequestAndResponseHeaders(targetRes.header, sourceRes.header);
  }

  targetRes.body = shouldSyncExamples ? targetRes.body : mergeRequestAndResponseBodyRaw(targetRes.body, sourceRes.body);

  return targetRes;
}
