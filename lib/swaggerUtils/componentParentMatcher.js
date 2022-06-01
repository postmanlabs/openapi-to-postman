const COMPONENTS_KEYS_20 = [
    'definitions',
    'parameters',
    'responses'
  ],
  SCHEMA_PARENTS = [
    'schema',
    'items',
    'allOf',
    'additionalProperties'
  ];

module.exports = {
/**
* Generates the trace to the key that will wrap de component using 3.0 version
* @param {array} traceFromParent - The trace from the parent key
* @param {string} filePathName - The filePath name from the file
* @param {string} localPart - The local path part
* @returns {array} The trace to the container key
*/
  getKeyInComponents20: function (traceFromParent, filePathName, localPart, jsonPointerDecodeAndReplace) {
    let res = traceFromParent,
      trace = [],
      traceToKey = [],
      matchFound = false,
      isRootKey = false;

    res.push(jsonPointerDecodeAndReplace(`${filePathName}${localPart}`));
    trace = [...res].reverse();

    for (let [index, item] of trace.entries()) {
      if (SCHEMA_PARENTS.includes(item)) {
        item = 'definitions';
      }
      traceToKey.push(item);
      if (COMPONENTS_KEYS_20.includes(item)) {
        matchFound = true;
        isRootKey = trace[index + 1] === undefined;
        break;
      }
    }
    return matchFound && !isRootKey ?
      traceToKey.reverse() :
      [];
  },
  COMPONENTS_KEYS_20
};
