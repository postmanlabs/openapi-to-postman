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
 * @param {boolean} preserveOriginalRequestBody - When true (and example syncing is enabled), keep
 *   the existing response's `originalRequest.body` instead of overwriting it with the spec's request.
 *   The spec carries a single request example (the live body) that maps to the first saved response;
 *   set this for every response after the first so a request change in the spec doesn't overwrite
 *   every response's originalRequest. Defaults to false (first response takes the spec request).
 * @returns {ResponseDefinition} Merged response definition
 */
export function mergeResponseData(
  targetResponse: Response,
  sourceResponse: Response,
  syncOptions: SyncOptions,
  preserveOriginalRequestBody = false
): ResponseDefinition {
  const targetRes: ResponseDefinition = targetResponse.toJSON(),
    sourceRes: ResponseDefinition = sourceResponse.toJSON(),
    shouldSyncExamples = syncOptions?.syncExamples;

  if (targetRes?.originalRequest && sourceRes?.originalRequest) {
    targetRes.originalRequest = mergeRequestData(targetRes.originalRequest, sourceRes.originalRequest, syncOptions);

    /*
     * The spec carries a single request example (the live request body), which maps to the first
     * saved response. For the remaining responses, preserve their existing request body so that
     * editing the request in the spec doesn't overwrite every response's originalRequest on sync-back.
     * Only applies when example syncing is enabled (the multi-example flow).
     */
if (preserveOriginalRequestBody && shouldSyncExamples) {
  if (sourceRes.originalRequest.body === undefined) { delete targetRes.originalRequest.body; }
  else { targetRes.originalRequest.body = sourceRes.originalRequest.body; }
}
  }
  // Attach implicit headers from the source response to the target response
  // if they are not present in the target response
  // Required because the response body and implicit headers are not generated
  // during collection to spec conversion for non json responses.
  attachImplicitHeaders(sourceRes.header, targetRes.header);

  if (targetRes?.header) {
    targetRes.header = shouldSyncExamples ?
      targetRes.header :
      mergeRequestAndResponseHeaders(targetRes.header, sourceRes.header);
  }

  targetRes.body = shouldSyncExamples ? targetRes.body : mergeRequestAndResponseBodyRaw(targetRes.body, sourceRes.body);

  return targetRes;
}
