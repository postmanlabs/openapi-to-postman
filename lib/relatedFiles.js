const traverseUtility = require('traverse'),
  parse = require('./parse.js'),
  { DFS } = require('./dfs');

/**
   * Maps the output from get root files to detect root files
   * @param {object} obj - output schema
   * @param {string} key - specified version of the process
   * @returns {object} - Detect root files result object
   */
function isExtRef(obj, key) {
  return key === '$ref' &&
    typeof obj[key] === 'string' &&
    obj[key] !== undefined &&
    !obj[key].startsWith('#');
}

/**
   * verifies if the path has been added to the result
   * @param {string} path - path to find
   * @param {Array} referencesInNode - Array with the already added paths
   * @returns {boolean} - wheter a node with the same path has been added
   */
function added(path, referencesInNode) {
  return referencesInNode.find((reference) => { return reference.path === path; }) !== undefined;
}

/**
   * Gets all the $refs from an object
   * @param {object} currentNode - current node in data array input
   * @returns {object} - {path : $ref value}
   */
function getReferences (currentNode) {
  let referencesInNode = [],
    currentContent = currentNode.content;
  const OASObject = parse.getOasObject(currentContent);
  traverseUtility(OASObject).forEach((property) => {
    if (property) {
      let isExtRef;
      isExtRef = Object.keys(property)
        .find(
          (key) => {
            return isExtRef(property, key);
          }
        );
      if (isExtRef) {
        if (!added(property.$ref, referencesInNode)) {
          referencesInNode.push({ path: property.$ref });
        }
      }
    }
  });
  return referencesInNode;
}

/**
   * Locates a referenced node from the data input by path
   * @param {string} path1 - path1 to compare
   * @param {string} path2 - path2 to compare
   * @returns {boolean} - wheter is the same path
   */
function comparePaths(path1, path2) {
  return path1 === path2; // todo change this comparision
}

/**
   * Locates a referenced node from the data input by path
   * @param {string} referencePath - value from the $ref property
   * @param {Array} allData -  array of { path, content} objects
   * @returns {object} - Detect root files result object
   */
function findNodeFromPath(referencePath, allData) {
  return allData.find((node) => {
    return comparePaths(node.fileName, referencePath);
  });
}

/**
   * Maps the output from get root files to detect root files
   * @param {object} currentNode - current { path, content} object
   * @param {Array} allData -  array of { path, content} objects
   * @param {object} specRoot - root file information
   * @returns {object} - Detect root files result object
   */
function getAdjacentAndMissing (currentNode, allData, specRoot) {
  let currentNodeReferences = getReferences(currentNode),
    graphAdj = [],
    missingNodes = [];

  currentNodeReferences.forEach((reference) => {
    let referencePath = reference.path,
      adjacentNode = findNodeFromPath(referencePath, allData);
    if (adjacentNode) {
      adjacentNode.relativeToRootPath = referencePath;
      graphAdj.push(adjacentNode);
    }
    else if (!comparePaths(referencePath, specRoot.path)) {
      missingNodes.push({ relativeToRootPath: referencePath });
    }
  });
  return { graphAdj, missingNodes };
}

module.exports = {

  /**
   * Maps the output from get root files to detect root files
   * @param {object} specRoot - root file information
   * @param {Array} allData -  array of { path, content} objects
   * @returns {object} - Detect root files result object
   */
  getRelatedFiles: function (specRoot, allData) {
    let algorithm = new DFS(),
      { traverseOrder, missing } =
        algorithm.traverse(specRoot, (currentNode) => {
          return getAdjacentAndMissing(currentNode, allData, specRoot);
        }),
      outputRelatedFiles = traverseOrder.slice(1).map((relatedFile) => {
        return {
          relativeToRootPath: relatedFile.relativeToRootPath,
          path: relatedFile.fileName
        };
      });
    return { relatedFiles: outputRelatedFiles, missingRelatedFiles: missing };
  },
  getReferences,
  getAdjacentAndMissing
};
