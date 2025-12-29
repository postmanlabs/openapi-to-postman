/**
 * Collection Finding Utilities
 * Functions for finding and locating items within Postman collections
 */

import { Item, ItemGroup } from 'postman-collection';

import { getRequestIdentifier } from '../../shared';
import { matchIdentifiers } from '../path';

/**
 * Find a folder item by name.
 * @param {ItemGroup<Item>} item - The item group to search within
 * @param {string} name - The name of the folder item to find
 * @returns {ItemGroup<Item> | undefined} The found folder item, or undefined if not found
 */
export function findFolderItemByName(item: ItemGroup<Item>, name: string): ItemGroup<Item> | undefined {
  let foundFolder;

  item.items.each((item) => {
    if (item.name === name && ItemGroup.isItemGroup(item)) {
      foundFolder = item;

      return false;
    }

    return true;
  });

  return foundFolder;
}

/**
 * Finds a request item in the given array of items by its path + method combo.
 * @param {ItemGroup<Item>} item - The item group to search within
 * @param {string} identifier - The method + path of the request item to find
 * @returns {Item | undefined} The found request item, or undefined if not found
 */
export function findRequestItemByPathAndMethod(item: ItemGroup<Item>, identifier: string): Item | undefined {
  let foundItem;

  item.items.each((item) => {
    if (item instanceof ItemGroup) {
      return true;
    }

    const currentItemIdentifier = getRequestIdentifier(item);

    if (matchIdentifiers(currentItemIdentifier, identifier)) {
      foundItem = item;

      return false;
    }

    return true;
  });

  return foundItem;
}
