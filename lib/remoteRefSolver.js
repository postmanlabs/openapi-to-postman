const { isRemoteRef } = require('./jsonPointer'),
  { getReferences } = require('./relatedEntities'),
  { fetchURLs } = require('./fetchContentFile'),
  { DFS } = require('./dfs'),
  parse = require('./parse.js');


/**
 * Takes a list of arguments and resolve them acording its content
 * @param {array} urls The arguments that will be resolved
 * @param {string} origin The arguments that will be resolved
 * @param {string} remoteRefsResolver The arguments that will be resolved
 * @returns {array} The list of arguments after have been resolved
 */
async function resolveFileRemoteReferences(urls, origin, remoteRefsResolver) {
  const rawURLs = urls.map((item) => { return item.path; });
  return fetchURLs(rawURLs, origin, remoteRefsResolver);
}

/**
   * Gets the path from a referenced entity
   * @param {object} property - current node in process
   * @returns {string} -  $ref value
   */
function pathSolver(property) {
  return property.$ref;
}

/**
   * Maps the output from get root files to detect root files
   * @param {object} currentNode - current { path, content} object
   * @param {Array} allData -  array of { path, content} objects
   * @param {object} specRoot - root file information
   * @returns {object} - Detect root files result object
   */
async function getAdjacentAndMissing (currentNode, origin, remoteRefsResolver) {
  let currentNodeReferences,
    graphAdj = [],
    missingNodes = [],
    OASObject;
  if (currentNode.parsed) {
    OASObject = currentNode.parsed;
  }
  else {
    OASObject = parse.getOasObject(currentNode.content);
  }
  currentNodeReferences = getReferences(OASObject, isRemoteRef, pathSolver);
  graphAdj = await resolveFileRemoteReferences(currentNodeReferences, origin, remoteRefsResolver);

  return { graphAdj, missingNodes };
}

/**
 * Maps the output from get root files to detect root files
 * @param {object} specRoot - root file information
 * @param {Array} allData -  array of { path, content} objects
 * @param {Array} origin - process origin (BROWSER or node)
 * @returns {object} - Detect root files result object
 */
function getRemoteReferences(specRoot, origin, remoteRefsResolver) {
  let algorithm = new DFS(),
    { traverseOrder, missing } =
      algorithm.traverse(specRoot, (currentNode) => {
        return getAdjacentAndMissing(currentNode, origin, remoteRefsResolver);
      }),
    outputRelatedFiles = traverseOrder.map((relatedFile) => {
      return {
        path: relatedFile.fileName
      };
    });
  return { relatedFiles: outputRelatedFiles, missingRelatedFiles: missing };
}


module.exports = {
  getAdjacentAndMissing,
  getRemoteReferences
};
