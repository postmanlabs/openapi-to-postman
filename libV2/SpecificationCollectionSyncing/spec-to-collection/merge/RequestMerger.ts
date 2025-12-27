import { RequestDefinition } from 'postman-collection';

import { mergeRequestBodyData } from './BodyMerger';
import { mergeRequestAndResponseHeaders } from './HeaderMerger';
import { mergeRequestUrlData } from './UrlMerger';

import { SyncOptions } from '../../shared';
import { attachImplicitHeaders } from '../header';

/**
 * Merges request data from source request to target request.
 * @param {RequestDefinition} targetRequest - Target request
 * @param {RequestDefinition} sourceRequest - Source request
 * @param {SyncOptions} syncOptions - Options to control what should be synced
 * @returns {RequestDefinition} Merged request
 */
export function mergeRequestData(
  targetRequest: RequestDefinition,
  sourceRequest: RequestDefinition,
  syncOptions: SyncOptions
): RequestDefinition {
  // Attach implicit headers from the source request to the target request if they are not present in the target request
  // Required because the request body and implicit headers are not generated during collection to spec conversion for non json requests.
  attachImplicitHeaders(sourceRequest.header, targetRequest.header);

  const shouldSyncExamples = syncOptions?.syncExamples;

  if (targetRequest.header) {
    targetRequest.header = shouldSyncExamples
      ? targetRequest.header
      : mergeRequestAndResponseHeaders(targetRequest.header, sourceRequest?.header);
  }

  if (targetRequest.body) {
    targetRequest.body = shouldSyncExamples
      ? targetRequest.body
      : mergeRequestBodyData(targetRequest.body, sourceRequest?.body);
  }

  targetRequest.url = shouldSyncExamples
    ? targetRequest.url
    : mergeRequestUrlData(targetRequest.url, sourceRequest.url);

  return targetRequest;
}
