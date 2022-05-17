const { isRemoteRef, removeLocalReferenceFromPath } = require('./jsonPointer'),
  { getReferences } = require('./relatedEntities'),
  { fetchURLs } = require('./fetchContentFile'),
  { DFS } = require('./dfs'),
  parse = require('./parse.js');

/**
 * Downloads the content of the references
 * @param {array} urls The arguments that will be resolved
 * @param {string} origin process location (broser or node)
 * @param {Function} remoteRefsResolver User defined function used to fetch
 * @returns {array} The list of arguments after have been resolved
 */
async function resolveFileRemoteReferences(urls, origin, remoteRefsResolver) {
  const rawURLs = urls.map((item) => { return item.path; }),
    set = new Set(rawURLs);
  return fetchURLs([...set], origin, remoteRefsResolver);
}

/**
 * Separate adjacent nodes to the current file and the missing ones
 * if there was an error downloading the content or the response was different to 200
 * is considered missing
 * @param {array} downloadedNodes list of downloaded files { fileName, content}
 * @returns {object} The missing and found files { graphAdj, missingNodes }
 */
function filterResult(downloadedNodes) {
  let missingNodes = [],
    graphAdj = [];

  downloadedNodes.forEach((item) => {
    if (item.content.startsWith('NF')) {
      missingNodes.push(item);
    }
    else {
      graphAdj.push(item);
    }
  });
  return { graphAdj, missingNodes };
}

/**
   * Gets the adjacent and missing nodes of the current node in the traversal
   * @param {object} currentNode - current { fileName, content} object
   * @param {string} origin process location (broser or node)
   * @param {Function} remoteRefsResolver User defined function used to fetch
   * @returns {object} - Detect root files result object
   */
async function getAdjacentAndMissing (currentNode, origin, remoteRefsResolver) {
  let currentNodeReferences,
    downloadedNodes = [],
    OASObject;
  if (currentNode.parsed) {
    OASObject = currentNode.parsed;
  }
  else {
    OASObject = parse.getOasObject(currentNode.content);
  }
  currentNodeReferences = getReferences(OASObject, isRemoteRef, removeLocalReferenceFromPath);
  downloadedNodes = await resolveFileRemoteReferences(currentNodeReferences, origin, remoteRefsResolver);
  return filterResult(downloadedNodes);
}

/**
 * Find and downloads the remote references from the specRoot
 * @param {object} specRoot - root file information
 * @param {string} origin process location (broser or node)
 * @param {Function} remoteRefsResolver User defined function used to fetch
 * @returns {object} - Remote references result object
 */
async function getRemoteReferences(specRoot, origin, remoteRefsResolver) {
  let algorithm = new DFS(),
    { traverseOrder, missing } =
      await algorithm.traverseAsync(specRoot, async (currentNode) => {
        return await getAdjacentAndMissing(currentNode, origin, remoteRefsResolver);
      }),
    outputRelatedFiles = traverseOrder.slice(1).map((relatedFile) => {
      return {
        path: relatedFile.fileName
      };
    });
  return { remoteRefs: outputRelatedFiles, missingRemoteRefs: missing };
}


module.exports = {
  getAdjacentAndMissing,
  getRemoteReferences
};
