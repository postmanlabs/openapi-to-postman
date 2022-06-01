const COMPONENTS_KEYS_30 = [
    'schemas',
    'responses',
    'parameters',
    'examples',
    'requestBodies',
    'headers',
    'securitySchemes',
    'links',
    'callbacks'
  ],
  SCHEMA_CONTAINERS = [
    'allOf',
    'oneOf',
    'anyOf',
    'not',
    'additionalProperties',
    'items',
    'schema'
  ];

module.exports = {
/**
 * Generates the trace to the key that will wrap de component using 3.0 version
 * @param {array} traceFromParent - The trace from the parent key
 * @param {string} filePathName - The filePath name from the file
 * @param {string} localPart - The local path part
 * @returns {array} The trace to the container key
 */
  getKeyInComponents30: function (traceFromParent, filePathName, localPart, jsonPointerDecodeAndReplace) {
    let res = traceFromParent,
      trace = [],
      traceToKey = [],
      matchFound = false,
      isInComponents = traceFromParent[0] === 'components';

    if (isInComponents) {
      return [];
    }

    res.push(jsonPointerDecodeAndReplace(`${filePathName}${localPart}`));
    trace = [...res].reverse();

    for (let item of trace) {
      if (SCHEMA_CONTAINERS.includes(item)) {
        item = 'schemas';
      }
      traceToKey.push(item);
      if (COMPONENTS_KEYS_30.includes(item)) {
        matchFound = true;
        break;
      }
    }
    return matchFound ?
      traceToKey.reverse() :
      [];
  },
  COMPONENTS_KEYS_30
};
