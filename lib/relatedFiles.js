const traverseUtility = require('traverse'),
  parse = require('./parse.js'),
  { DFS } = require('./dfs');

/**
   * Maps the output from get root files to detect root files
   * @param {object} obj - output schema
   * @param {string} key - specified version of the process
   * @returns {object} - Detect root files result object
   */
function isRef(obj, key) {
  return key === '$ref' && typeof obj[key] === 'string' && obj[key] !== undefined;
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
      let hasReferenceTypeKey;
      hasReferenceTypeKey = Object.keys(property)
        .find(
          (key) => {
            return isRef(property, key);
          }
        );
      if (hasReferenceTypeKey) {
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
   * @param {string} referencePath - value from the $ref property
   * @param {Array} allData -  array of { path, content} objects
   * @returns {object} - Detect root files result object
   */
function findNodeFromPath(referencePath, allData) {
  return allData.find((node) => {
    return node.path === referencePath; // todo change this comparision
  });
}

/**
   * Maps the output from get root files to detect root files
   * @param {object} currentNode - current { path, content} object
   * @param {Array} allData -  array of { path, content} objects
   * @returns {object} - Detect root files result object
   */
function getReferencesNodes (currentNode, allData) {
  let currentNodeReferences = getReferences(currentNode),
    graphAdj = [],
    missingNodes = [];

  currentNodeReferences.forEach((reference) => {
    let referencePath = reference.path,
      adjacentNode = findNodeFromPath(referencePath, allData);
    if (adjacentNode) {
      graphAdj.push(adjacentNode);
    }
    else {
      missingNodes.push({ relativeToRootPath: path });
    }
  });
  return { graphAdj, missingNodes };
}

module.exports = {

  getRelatedFiles: function (specRoot, allData) {
    let algorithm = new DFS(),
      { traverseOrder, missing } =
        algorithm.traverse(specRoot, (currentNode) => { return getReferencesNodes(currentNode, allData); });
    return { traverseOrder, missing };
  },
  getReferences,
  getReferencesNodes
};
