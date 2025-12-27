import { Collection, ItemGroup, Item, Variable, Response, HeaderList, Header } from 'postman-collection';

import { mergeAuth, mergeAuthParams } from './auth';
import { findFolderItemByName, findRequestItemByPathAndMethod } from './collection';
import { mergeRequestData, mergeResponseData } from './merge';
import { extractPostmanVariablesFromPathComponents } from './path';

import { DEFAULT_SYNC_OPTIONS, getRequestIdentifier, SyncOptions } from '../shared';
import _ from 'lodash';

/**
 * Update the implicit headers from the current collection if the latest collection does not have the implicit headers.
 * @param {HeaderList} initial - The headers from the current collection
 * @param {HeaderList} final - The headers from the latest collection
 */
function attachImplicitHeaders(initial: HeaderList, final: HeaderList) {
  const implicitHeaders = ['Accept', 'Content-Type'];

  initial.each((header) => {
    if (header.key && implicitHeaders.includes(header.key) && !final.has(header.key)) {
      final.add(new Header(header.toJSON()));
    }
  });
}

/**
 * Syncs the state between two item groups / Collections.
 *
 * Warning: This mutates the current collection
 * @param {ItemGroup} latestCollectionState - The item group to be synced.
 * @param {ItemGroup} currentCollectionState - The current item group.
 * @param {SyncOptions} options - Options to control what should be synced.
 */
export function syncCollection(
  latestCollectionState: Collection | ItemGroup<Item>,
  currentCollectionState: Collection | ItemGroup<Item>,
  options: SyncOptions | null
): ItemGroup<Item> {
  const mergedOptions = { ...DEFAULT_SYNC_OPTIONS, ...(options ?? {}) };

  // Sync the state of the collection to be synced with the current collection
  latestCollectionState.items.each((item: Item | ItemGroup<Item>) => {
    if (item instanceof ItemGroup) {
      // Recursively sync the state of the folder
      const currentFolder = findFolderItemByName(currentCollectionState, item.name);

      if (currentFolder) {
        syncCollection(item, currentFolder, mergedOptions);
      } else {
        currentCollectionState.items.add(item);
      }

      return;
    }

    const path = getRequestIdentifier(item),
      currentRequest = findRequestItemByPathAndMethod(currentCollectionState, path);

    if (currentRequest) {
      attachImplicitHeaders(currentRequest.request.headers, item.request.headers);

      const existingRequestAuth = _.cloneDeep(currentRequest.request?.auth?.toJSON?.()) ?? {},
        currentRequestPath = currentRequest.request.url.path,
        latestRequestPath = item.request.url.path,
        variablesToAdd = extractPostmanVariablesFromPathComponents(latestRequestPath || [], currentRequestPath || []),
        // Preserve current request data before update
        currentRequestJSON = currentRequest.request.toJSON(),
        latestRequestJSON = item.request.toJSON(),
        mergedRequestJSON = mergeRequestData(latestRequestJSON, currentRequestJSON, mergedOptions);

      currentRequest.request.update(mergedRequestJSON);

      currentRequest.request.url.variables.assimilate(variablesToAdd, false);

      currentRequest.name = item.name;
      currentRequest.request.name = item.request.name;
      currentRequest.request.description = item.request.description;

      const mergedRequestAuth = mergeAuth(item.request.auth?.toJSON?.() ?? {}, existingRequestAuth),
        authToApply = mergeAuthParams(mergedRequestAuth, existingRequestAuth);

      if (!authToApply) {
        // No auth to apply, skip
      } else if (currentRequest.request.auth && authToApply.params) {
        const paramsArray = authToApply.params.all().map((v) => {
          return { key: v.key ?? '', value: v.value };
        });

        currentRequest.request.auth.use(authToApply.type, paramsArray);
      } else {
        currentRequest.request.authorizeUsing(authToApply.type, authToApply.params);
      }

      const currentResponses: Record<number, Response> = {};

      currentRequest.responses.each((response) => {
        currentResponses[response.code] = response;
      });

      item.responses.each((response) => {
        if (currentResponses[response.code]) {
          const mergedResponseData = mergeResponseData(response, currentResponses[response.code], mergedOptions);

          currentResponses[response.code].update(mergedResponseData);
          currentResponses[response.code].name = response.name;
        } else {
          currentRequest.responses.add(response.toJSON());
        }
      });
    } else {
      currentCollectionState.items.add(item);
    }
  });

  currentCollectionState.description = latestCollectionState.description;

  const existingCollectionAuth = _.cloneDeep(currentCollectionState?.auth?.toJSON()) ?? {},
    mergedCollectionAuth = mergeAuth(latestCollectionState?.auth?.toJSON() ?? {}, existingCollectionAuth),
    collectionAuthToApply = mergeAuthParams(mergedCollectionAuth, existingCollectionAuth);

  if (!collectionAuthToApply) {
    // No collection auth to apply, skip
  } else if (currentCollectionState.auth && collectionAuthToApply.params) {
    const paramsArray = collectionAuthToApply.params.all().map((v) => {
      return { key: v.key ?? '', value: v.value };
    });

    currentCollectionState.auth.use(collectionAuthToApply.type, paramsArray);
  } else {
    currentCollectionState.authorizeRequestsUsing(collectionAuthToApply.type, collectionAuthToApply.params);
  }

  if (latestCollectionState instanceof Collection && currentCollectionState instanceof Collection) {
    const latestCollectionBaseUrlVar = latestCollectionState.variables.one('baseUrl'),
      currentCollectionBaseUrlVar = currentCollectionState.variables.one('baseUrl');

    if (latestCollectionBaseUrlVar) {
      if (currentCollectionBaseUrlVar) {
        currentCollectionBaseUrlVar.value = latestCollectionBaseUrlVar.value;
      } else {
        currentCollectionState.variables.add(
          new Variable({
            key: 'baseUrl',
            value: latestCollectionBaseUrlVar.value
          })
        );
      }
    }
  }

  return currentCollectionState;
}

