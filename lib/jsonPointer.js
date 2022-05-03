const slashes = /\//g,
  tildes = /~/g,
  escapedSlash = /~1/g,
  componentsKey = 'components',
  localPointer = '#',
  escapedTilde = /~0/g;

/**
* Encodes a filepath name so it can be a json pointer
* replaces tildes and slashes for ~0 and ~1
* @param {string} filePathName the filePathName of the file
* @returns {string} - the encoded filepath
*/
function JsonPointerEncodeAndReplace(filePathName) {
  return encodeURIComponent(filePathName.replace(tildes, '~0').replace(slashes, '~1'));
}

/**
* returns the key that the object in components will have could be nested
* @param {string} componentName the type of component e.g. schemas, parameters, etc.
* @param {string} filePathName the filePathName of the file
* @param {string} localPath the local path that the pointer will reach
* @returns {Array} - the calculated keys in an array representing each nesting property name
*/
function getKeyInComponents(componentName, filePathName, localPath) {
  let res = [componentsKey],
    pointer,
    localPathToCheck = localPath;
  res.push(componentName);
  res.push(decodeURIComponent(filePathName.replace(escapedSlash, '/').replace(escapedTilde, '~')));
  if (localPath) {
    if (localPath.startsWith('/')) {
      localPathToCheck = localPath.substring(1);
    }
    pointer = localPathToCheck.split('/');
    for (let i = 0; i < pointer.length; i++) {
      pointer[i] = decodeURIComponent(pointer[i].replace(escapedSlash, '/').replace(escapedTilde, '~'));
    }
    res.push(...pointer);
  }
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
* @param {string} componentName the type of component e.g. schemas, parameters, etc.
* @param {string} localPath the local path that the pointer will reach
* @returns {string} - the concatenated json pointer
*/
function concatJsonPointer(encodeFunction, filePathName, componentName, localPath) {
  let base = '',
    local = '';
  base = '/' + encodeFunction(filePathName);
  if (localPath) {
    local = localPath;
  }
  return localPointer + '/' + componentsKey + '/' + componentName + base + local;
}

/**
* genereates the json pointer relative to the root
* @constructor
* @param {Function} encodeFunction function to encode url
* @param {string} filePathName the filePathName of the file
* @param {string} refValue the type of component e.g. schemas, parameters, etc.
* @param {string} componentName the type of component e.g. schemas, parameters, etc.
* @returns {string} - the concatenated json pointer
*/
function getJsonPointerRelationToRoot(encodeFunction, filePathName, refValue, componentName) {
  if (refValue.startsWith(localPointer)) {
    return refValue;
  }
  const localPath = getLocalPath(refValue);
  return concatJsonPointer(encodeFunction, filePathName, componentName, localPath);
}

module.exports = {
  JsonPointerEncodeAndReplace,
  getJsonPointerRelationToRoot,
  concatJsonPointer,
  getKeyInComponents
};
