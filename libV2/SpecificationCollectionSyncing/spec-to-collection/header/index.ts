import { Header, HeaderDefinition } from 'postman-collection';

/**
 * Update the implicit headers from the current collection if the latest collection does not have the implicit headers.
 * @param {HeaderDefinition[] | undefined} currentHeaders - The headers from the current collection
 * @param {HeaderDefinition[] | undefined} latestHeaders - The headers from the latest collection
 */
export function attachImplicitHeaders(
  currentHeaders: HeaderDefinition[] | undefined,
  latestHeaders: HeaderDefinition[] | undefined
) {
  const implicitHeaders = ['Accept', 'Content-Type'];

  if (!currentHeaders || !latestHeaders) return;

  currentHeaders.forEach((currentHeader) => {
    if (!currentHeader.key || !implicitHeaders.includes(currentHeader.key)) {
      return;
    }

    const hasSameKeyInLatestHeaders = latestHeaders.some((header) => {
      return header.key === currentHeader.key;
    });

    if (!hasSameKeyInLatestHeaders) {
      latestHeaders.push(new Header(currentHeader));
    }
  });
}
