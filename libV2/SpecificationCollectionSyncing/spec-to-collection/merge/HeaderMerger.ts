import { HeaderDefinition } from 'postman-collection';

/**
 * Merges headers from target request into source request.
 * Preserves existing header values and only adds new headers or removes headers not in latest.
 * @param {HeaderDefinition[] | undefined} targetHeaders - Headers from the target request
 * @param {HeaderDefinition[] | undefined} sourceHeaders - Headers from the source request
 * @returns {HeaderDefinition[]} Merged headers array
 */
export function mergeRequestAndResponseHeaders(
  targetHeaders: HeaderDefinition[] | undefined,
  sourceHeaders: HeaderDefinition[] | undefined
): HeaderDefinition[] {
  if (!targetHeaders || targetHeaders.length === 0) {
    return [];
  }

  if (!sourceHeaders || sourceHeaders.length === 0) {
    return targetHeaders;
  }

  const sourceHeadersMap = new Map<string, HeaderDefinition>();

  sourceHeaders.forEach((header) => {
    if (header?.key) {
      sourceHeadersMap.set(header.key.toLowerCase(), header);
    }
  });

  const mergedHeaders: HeaderDefinition[] = [];

  targetHeaders.forEach((targetHeader) => {
    if (!targetHeader.key) {
      return;
    }

    const existingHeader = sourceHeadersMap.get(targetHeader.key?.toLowerCase());

    if (existingHeader) {
      mergedHeaders.push({
        ...targetHeader,
        value: existingHeader.value,
        disabled: existingHeader.disabled
      });
    } else {
      mergedHeaders.push(targetHeader);
    }
  });

  return mergedHeaders;
}
