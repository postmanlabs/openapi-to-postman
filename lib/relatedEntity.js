const traverseUtility = require('traverse'),
  { DFS } = require('./dfs'),
  { JsonPointerDecodeAndReplace } = require('./jsonPointer'),
  deref = require('./deref.js'),
  localPointer = '#';

/**
   * Maps the output from get root files to detect root files
   * @param {object} obj - output schema
   * @param {string} key - specified version of the process
   * @returns {object} - Detect root files result object
   */
function isLocalRef(obj, key) {
  return key === '$ref' &&
    typeof obj[key] === 'string' &&
    obj[key] !== undefined &&
    obj[key].startsWith(localPointer);
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

function getLastSegmentURL(value) {
  if (!value) {
    return '';
  }
  let segment = value.substring(value.lastIndexOf('/') + 1);
  return segment;
}

/**
   * Gets all the $refs from an object
   * @param {object} currentNode - current node in process
   * @param {object} refTypeResolver - function to resolve the ref according to type (local, external, web etc)
   * @returns {object} - {path : $ref value}
   */
function getReferences (currentNode, refTypeResolver) {
  let referencesInNode = [];
  //   currentContent = currentNode.content,
  //   OASObject;
  // if (currentNode.parsed) {
  //   OASObject = currentNode.parsed;
  // }
  // else {
  //   OASObject = parse.getOasObject(currentContent);
  // }
  traverseUtility(currentNode).forEach((property) => {
    if (property) {
      let hasReferenceTypeKey;
      hasReferenceTypeKey = Object.keys(property)
        .find(
          (key) => {
            return refTypeResolver(property, key);// change the function
          }
        );
      if (hasReferenceTypeKey) {
        if (!added(property.$ref, referencesInNode)) {
          referencesInNode.push({ path: property.$ref });// change the local remover
        }
      }
    }
  });
  return referencesInNode;
}

/**
   * Locates a referenced node from the data input by path
   * @param {string} referencePath - value from the $ref property
   * @param {object} spec - parsed spec
   * @returns {object} - Detect root files result object
   */
function findNodeFromPath(referencePath, spec) {
  let found,
    splitRef = referencePath.split('/');
  splitRef = splitRef.slice(1).map((elem) => {
    return JsonPointerDecodeAndReplace(elem);
  });
  found = deref._getEscaped(spec, splitRef);// really?
  return found;
}

/**
   * Maps the output from get root files to detect root files
   * @param {object} currentNode - current { path, content} object
   * @param {object} spec - the whole parsed spec
   * @returns {object} - Detect root files result object
   */
function getAdjacentAndMissing(currentNode, spec) {
  let currentNodeReferences = getReferences(currentNode, isLocalRef),
    graphAdj = [],
    missingNodes = [];

  currentNodeReferences.forEach((reference) => {
    let referencePath = reference.path,
      adjacentNode = findNodeFromPath(referencePath, spec);
    if (adjacentNode) {
      adjacentNode.$info = { $ref: referencePath, name: getLastSegmentURL(referencePath) };
      graphAdj.push(adjacentNode);
    }
    else {
      missingNodes.push({ $ref: referencePath });
    }

  });
  return { graphAdj, missingNodes };
}

module.exports = {

  /**
   * Maps the output from get root files to detect root files
   * @param {object} entityRoot - root file information
   * @param {Array} spec -  array of { path, content} objects
   * @returns {object} - Detect root files result object
   */
  getRelatedEntities: function (entityRoot, spec) {
    let algorithm = new DFS(),
      { traverseOrder, missing } =
        algorithm.traverse(entityRoot, (currentNode) => {
          return getAdjacentAndMissing(currentNode, spec);
        });
    return { relatedEntities: traverseOrder, missingRelatedEntities: missing };
  },
  getReferences,
  getAdjacentAndMissing,
  isLocalRef,
  findNodeFromPath
};
