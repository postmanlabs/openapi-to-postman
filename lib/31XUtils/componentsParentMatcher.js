const COMPONENTS_KEYS_31 = [
    'schemas',
    'responses',
    'parameters',
    'examples',
    'requestBodies',
    'headers',
    'securitySchemes',
    'links',
    'callbacks',
    'pathItems'
  ],
  SCHEMA_CONTAINERS = [
    'allOf',
    'oneOf',
    'anyOf',
    'not',
    'additionalProperties',
    'items',
    'schema'
  ],
  EXAMPLE_CONTAINERS = [
    'example'
  ],
  PROPERTY_DEFINITION = [
    'properties'
  ],
  RESPONSE_DEFINITION = [
    'responses'
  ],
  REQUEST_BODY_CONTAINER = [
    'requestBody'
  ],
  LINKS_CONTAINER = [
    'links'
  ],
  HEADER_DEFINITION = [
    'headers'
  ],
  CALLBACK_DEFINITION = [
    'callbacks'
  ],
  PATH_ITEM_CONTAINER = [
    'paths'
  ];

module.exports = {
  /**
  * Generates the trace to the key that will wrap de component using 3.0 version
  * @param {array} traceFromParent - The trace from the parent key
  * @param {string} filePathName - The filePath name from the file
  * @param {string} localPart - The local path part
  * @param {function} jsonPointerDecodeAndReplace - Function to decode a json pointer
  * @returns {array} The trace to the container key
  */
  getKeyInComponents31: function (traceFromParent, filePathName, localPart, jsonPointerDecodeAndReplace) {
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

    for (let [index, item] of trace.entries()) {
      if (SCHEMA_CONTAINERS.includes(item)) {
        item = 'schemas';
      }
      if (EXAMPLE_CONTAINERS.includes(item)) {
        item = 'examples';
      }
      if (REQUEST_BODY_CONTAINER.includes(item)) {
        item = 'requestBodies';
      }
      if (LINKS_CONTAINER.includes(trace[index + 2])) {
        trace[index + 1] = 'links';
      }
      if (PATH_ITEM_CONTAINER.includes(trace[index + 2])) {
        trace[index + 1] = 'pathItems';
      }
      if (PROPERTY_DEFINITION.includes(trace[index + 2])) {
        trace[index + 1] = 'schemas';
      }
      traceToKey.push(item);
      if (COMPONENTS_KEYS_31.includes(item)) {
        matchFound = true;
        break;
      }
      if (RESPONSE_DEFINITION.includes(trace[index + 2])) {
        trace[index + 1] = 'responses';
      }
      if (HEADER_DEFINITION.includes(trace[index + 2])) {
        trace[index + 1] = 'headers';
      }
      if (CALLBACK_DEFINITION.includes(trace[index + 2])) {
        trace[index + 1] = 'callbacks';
      }
    }
    return matchFound ?
      traceToKey.reverse() :
      [];
  },
  COMPONENTS_KEYS_31
};
