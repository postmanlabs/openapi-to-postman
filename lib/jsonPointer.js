const slashes = /\//g,
  tildes = /~/g,
  escapedSlash = /~1/g,
  escapedSlashString = '~1',
  localPointer = '#',
  escapedTilde = /~0/g,
  jsonPointerLevelSeparator = '/',
  escapedTildeString = '~0';

/**
* Encodes a filepath name so it can be a json pointer
* replaces tildes and slashes for ~0 and ~1
* @param {string} filePathName the filePathName of the file
* @returns {string} - the encoded filepath
*/
function jsonPointerEncodeAndReplace(filePathName) {
  return encodeURIComponent(filePathName.replace(tildes, escapedTildeString).replace(slashes, escapedSlashString));
}

/**
* Decodes a json pointer
* replaces ~0 and ~1 for tildes and slashes
* @param {string} filePathName the filePathName of the file
* @returns {string} - the encoded filepath
*/
function jsonPointerDecodeAndReplace(filePathName) {
  return decodeURIComponent(filePathName.replace(escapedSlash, jsonPointerLevelSeparator).replace(escapedTilde, '~'));
}

/**
* returns the key that the object in components will have could be nested
* @param {string} traceFromParent the node trace from root.
* @param {string} filePathName the filePathName of the file
* @param {string} localPath the local path that the pointer will reach
* @returns {Array} - the calculated keys in an array representing each nesting property name
*/
function getKeyInComponents(traceFromParent, filePathName, localPath) {
  const localPart = localPath ? `#${localPath}` : '';
  let res = traceFromParent;
  // .map((key) => {
  //   return key.split('#')[0];
  // });
  res.push(jsonPointerDecodeAndReplace(`${filePathName}${localPart}`));
  return res;
}

/**
* returns the local path of a pointer #/definitions/dog etc.
* @param {string} jsonPointer the complet pointer
* @returns {string} - the calculated key
*/
function getLocalPath(jsonPointer) {
  if (jsonPointer.includes(localPointer)) {
    return jsonPointer.split(localPointer)[1];
  }
  return '';
}

/**
* concats the inputs to generate the json pointer
* @constructor
* @param {Function} encodeFunction function to encode url
* @param {string} filePathName the filePathName of the file
* @param {string} traceFromParent the trace from parent.
* @param {string} localPath the local path that the pointer will reach
* @returns {string} - the concatenated json pointer
*/
function concatJsonPointer(encodeFunction, traceFromParent) {
  const traceFromParentAsString = traceFromParent.map((trace) => {
    return encodeFunction(trace);
  }).join('/');
  return localPointer + '/components' + jsonPointerLevelSeparator + traceFromParentAsString;
}

/**
* genereates the json pointer relative to the root
* @constructor
* @param {Function} encodeFunction function to encode url
* @param {string} filePathName the filePathName of the file
* @param {string} refValue the type of component e.g. schemas, parameters, etc.
* @param {string} traceFromParent the trace from the parent node.
* @returns {string} - the concatenated json pointer
*/
function getJsonPointerRelationToRoot(encodeFunction, refValue, traceFromKey) {
  if (refValue.startsWith(localPointer)) {
    return refValue;
  }
  const localPath = getLocalPath(refValue);
  return concatJsonPointer(encodeFunction, traceFromKey, localPath);
}

/**
   * Checks if the input value is a valid url
   * @param {string} stringToCheck - specified version of the process
   * @returns {object} - Detect root files result object
   */
function stringIsAValidUrl(stringToCheck) {
  try {
    let url = new URL(stringToCheck);
    if (url) {
      return true;
    }
    return false;
  }
  catch (err) {
    try {
      let urlObj = url.parse(stringToCheck);
      return urlObj.hostname !== null;
    }
    catch (parseErr) {
      return false;
    }
  }
}

/**
   * Determines if a value of a given key property of an object
   * is an external reference with key $ref and value that does not start with #
   * @param {object} obj - parent object of the $ref property
   * @param {string} key - property key to check
   * @returns {boolean} - true if the property key is $ref and the value does not start with #
   * otherwise false
   */
function isExtRef(obj, key) {
  return key === '$ref' &&
    typeof obj[key] === 'string' &&
    obj[key] !== undefined &&
    !obj[key].startsWith(localPointer) &&
    !stringIsAValidUrl(obj[key]);
}

/**
   * Removes the local pointer inside a path
   * aab.yaml#component returns aab.yaml
   * @param {string} refValue - value of the $ref property
   * @returns {string} - the calculated path only
   */
function removeLocalReferenceFromPath(refValue) {
  if (refValue.$ref.includes(localPointer)) {
    return refValue.$ref.split(localPointer)[0];
  }
  return refValue.$ref;
}

/**
   * Determines if a value of a given key property of an object
   * is a local reference with key $ref and value that starts with #
   * @param {object} obj - parent object of the $ref property
   * @param {string} key - property key to check
   * @returns {boolean} - true if the property key is $ref and the value starts with #
   * otherwise false
   */
function isLocalRef(obj, key) {
  return key === '$ref' &&
    typeof obj[key] === 'string' &&
    obj[key] !== undefined &&
    obj[key].startsWith(localPointer);
}

/**
   * Determines if a value of a given key property of an object
   * is a remote reference with key $ref and value that is a valid url
   * @param {object} obj - parent object of the $ref property
   * @param {string} key - property key to check
   * @returns {boolean} - true if the property key is $ref and the value is a valid url
   * otherwise false
   */
function isRemoteRef(obj, key) {
  return key === '$ref' &&
  typeof obj[key] === 'string' &&
  obj[key] !== undefined &&
  !obj[key].startsWith(localPointer) &&
  stringIsAValidUrl(obj[key]);
}

/**
   * Extracts the entity's name from the json pointer
   * @param {string} jsonPointer - pointer to get the name from
   * @returns {boolean} - string: the name of the entity
   */
function getEntityName(jsonPointer) {
  if (!jsonPointer) {
    return '';
  }
  let segment = jsonPointer.substring(jsonPointer.lastIndexOf(jsonPointerLevelSeparator) + 1);
  return segment;
}

module.exports = {
  jsonPointerEncodeAndReplace,
  jsonPointerDecodeAndReplace,
  getJsonPointerRelationToRoot,
  concatJsonPointer,
  getKeyInComponents,
  isExtRef,
  removeLocalReferenceFromPath,
  isLocalRef,
  getEntityName,
  isRemoteRef
};
