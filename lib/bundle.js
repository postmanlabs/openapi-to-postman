const {
    isExtRef,
    getKeyInComponents,
    getJsonPointerRelationToRoot,
    jsonPointerEncodeAndReplace,
    removeLocalReferenceFromPath,
    localPointer,
    jsonPointerLevelSeparator,
    isLocalRef
  } = require('./jsonPointer'),
  traverseUtility = require('traverse'),
  parse = require('./parse.js');

let path = require('path'),
  pathBrowserify = require('path-browserify'),
  BROWSER = 'browser',
  { DFS } = require('./dfs'),
  COMPONENTS_KEYS = [
    'schemas',
    'schema',
    'responses',
    'parameters',
    'examples',
    'requestBodies',
    'headers',
    'securitySchemes',
    'links',
    'callbacks'
  ];


/**
  * Locates a referenced node from the data input by path
  * @param {string} path1 - path1 to compare
  * @param {string} path2 - path2 to compare
  * @returns {boolean} - wheter is the same path
  */
function comparePaths(path1, path2) {
  return path1 === path2;
}


/**
  * Calculates the path relative to parent
  * @param {string} parentFileName - parent file name of the current node
  * @param {string} referencePath - value of the $ref property
  * @returns {object} - Detect root files result object
  */
function calculatePath(parentFileName, referencePath) {
  if (path.isAbsolute(referencePath)) {
    return referencePath;
  }
  if (referencePath[0] === localPointer) {
    return `${parentFileName}${referencePath}`;
  }
  let currentDirName = path.dirname(parentFileName),
    refDirName = path.join(currentDirName, referencePath);
  return refDirName;
}

/**
   * Locates a referenced node from the data input by path
   * @param {string} referencePath - value from the $ref property
   * @param {Array} allData -  array of { path, content} objects
   * @returns {object} - Detect root files result object
   */
function findNodeFromPath(referencePath, allData) {
  const partialComponents = referencePath.split(localPointer);
  let isPartial = partialComponents.length > 1,
    node = allData.find((node) => {
      if (isPartial) {
        referencePath = partialComponents[0];
      }
      return comparePaths(node.fileName, referencePath);
    });

  return node;
}

/**
   * Calculates the path relative to parent
   * @param {string} parentFileName - parent file name of the current node
   * @param {string} referencePath - value of the $ref property
   * @returns {object} - Detect root files result object
   */
function calculatePathMissing(parentFileName, referencePath) {
  let currentDirName = path.dirname(parentFileName),
    refDirName = path.join(currentDirName, referencePath);
  if (refDirName.startsWith('..' + path.sep)) {
    return { path: undefined, $ref: referencePath };
  }
  else if (path.isAbsolute(parentFileName) && !path.isAbsolute(referencePath)) {
    let relativeToRoot = path.join(currentDirName.replace(path.sep, ''), referencePath);
    if (relativeToRoot.startsWith('..' + path.sep)) {
      return { path: undefined, $ref: referencePath };
    }
  }
  return { path: refDirName, $ref: undefined };
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
 * Return a trace from the first parent node name attachable in components object
 * @param {array} nodeParents - The parent node's name from the current node
 * @returns {array} A trace from the first node name attachable in components object
 */
function getRootFileTrace(nodeParents) {
  let trace = [];
  for (let parentKey of nodeParents) {
    if ([undefined, 'oasObject'].includes(parentKey)) {
      break;
    }
    trace.push(parentKey);
  }
  return trace.reverse();
}

/**
 * Get partial content from file content
 * @param {object} content - The content in related node
 * @param {string} partial - The partial part from reference
 * @returns {object} The related content to the trace
 */
function getContentFromTrace(content, partial) {
  if (!partial) {
    return content;
  }
  partial = partial[0] === jsonPointerLevelSeparator ? partial.substring(1) : partial;
  const trace = partial.split(jsonPointerLevelSeparator);
  let currentValue = content;
  for (let place of trace) {
    currentValue = currentValue[place];
  }
  return currentValue;
}

/**
  * Set a value in the global components object following the provided trace
  * @param {array} keyInComponents - The trace to the key in components
  * @param {object} components - A global components object
  * @param {object} value - The value from node matched with data
  * @returns {null} It modifies components global context
*/
function setValueInComponents(keyInComponents, components, value) {
  let currentPlace = components,
    target = keyInComponents[keyInComponents.length - 2],
    key = keyInComponents.length === 2 && COMPONENTS_KEYS.includes(keyInComponents[0]) ?
      keyInComponents[1] :
      null;
  if (COMPONENTS_KEYS.includes(keyInComponents[0])) {
    if (keyInComponents[0] === 'schema') {
      keyInComponents[0] = 'schemas';
    }
    target = key;
  }

  for (let place of keyInComponents) {
    if (place === target) {
      currentPlace[place] = value;
      break;
    }
    else if (currentPlace[place]) {
      currentPlace = currentPlace[place];
    }
    else {
      currentPlace[place] = {};
      currentPlace = currentPlace[place];
    }
  }
}

/**
 * Return a trace from the current node's root to the place where we find a $ref
 * @param {object} nodeContext - The current node we are processing
 * @param {object} property - The current property that contains the $ref
 * @returns {array} The trace to the place where the $ref appears
 */
function getTraceFromParentKeyInComponents(nodeContext, property) {
  const parents = [...nodeContext.parents].reverse(),
    isArrayKeyRegexp = new RegExp('^\\d$', 'g'),
    key = nodeContext.key,
    keyIsAnArrayItem = key.match(isArrayKeyRegexp),
    parentKeys = [...parents.map((parent) => {
      return parent.key;
    })],
    nodeParentsKey = keyIsAnArrayItem ?
      parentKeys :
      [key, ...parentKeys],
    nodeTrace = getRootFileTrace(nodeParentsKey),
    [file, local] = property.split(localPointer),
    [keyTraceInComponents, inComponents] = getKeyInComponents(nodeTrace, file, local);
  return [keyTraceInComponents, inComponents];
}

/**
   * Gets all the $refs from an object
   * @param {object} currentNode - current node in process
   * @param {Function} isOutOfRoot - A filter to know if the current components was called from root or not
   * @param {Function} pathSolver - function to resolve the Path
   * @param {string} parentFilename - The parent's filename
   * @param {object} globalComponentsContext - The global context from root file
   * @param {array} allData The data from files provided in the input
   * @returns {object} - {path : $ref value}
   */
function getReferences (currentNode, isOutOfRoot, pathSolver, parentFilename) {
  let referencesInNode = [],
    nodeReferenceDirectory = {};
  traverseUtility(currentNode).forEach(function (property) {
    if (property) {
      let hasReferenceTypeKey;
      hasReferenceTypeKey = Object.keys(property)
        .find(
          (key) => {
            const isLocalOutOfRoot = isOutOfRoot && isLocalRef(property, key),
              isExternal = isExtRef(property, key),
              isReferenciable = isLocalOutOfRoot || isExternal;
            return isReferenciable;
          }
        );
      if (hasReferenceTypeKey) {
        const tempRef = calculatePath(parentFilename, property.$ref),
          [nodeTrace] = getTraceFromParentKeyInComponents(this, tempRef),
          referenceInDocument = getJsonPointerRelationToRoot(
            jsonPointerEncodeAndReplace,
            tempRef,
            nodeTrace
          ),
          traceToParent = [...this.parents.map((item) => {
            return item.key;
          }).filter((item) => {
            return item !== undefined;
          }), this.key];
        let newValue,
          [, local] = tempRef.split(localPointer);

        newValue = Object.assign({}, this.node);
        newValue.$ref = referenceInDocument;

        this.update({ $ref: tempRef });

        nodeReferenceDirectory[tempRef] = {
          local,
          keyInComponents: nodeTrace,
          node: newValue,
          reference: referenceInDocument,
          traceToParent,
          parentNodeKey: parentFilename
        };

        if (!added(property.$ref, referencesInNode)) {
          referencesInNode.push({ path: pathSolver(property), keyInComponents: nodeTrace, newValue: this.node });
        }
      }
    }
  });

  return { referencesInNode, nodeReferenceDirectory };
}

/**
   * Maps the output from get root files to detect root files
   * @param {object} currentNode - current { path, content} object
   * @param {Array} allData -  array of { path, content} objects
   * @param {object} specRoot - root file information
   * @returns {object} - Detect root files result object
   */
function getNodeContentAndReferences (currentNode, allData, specRoot) {
  let graphAdj = [],
    missingNodes = [],
    nodeContent;

  if (currentNode.parsed) {
    nodeContent = currentNode.parsed.oasObject;
  }
  else {
    nodeContent = parse.getOasObject(currentNode.content).oasObject;
  }

  const { referencesInNode, nodeReferenceDirectory } = getReferences(
    nodeContent,
    currentNode.fileName !== specRoot.fileName,
    removeLocalReferenceFromPath,
    currentNode.fileName
  );

  referencesInNode.forEach((reference) => {
    let referencePath = reference.path,
      adjacentNode = findNodeFromPath(calculatePath(currentNode.fileName, referencePath), allData);

    if (adjacentNode) {
      graphAdj.push(adjacentNode);
    }
    else if (!comparePaths(referencePath, specRoot.fileName)) {
      let calculatedPathForMissing = calculatePathMissing(currentNode.fileName, referencePath);
      if (!calculatedPathForMissing.$ref) {
        missingNodes.push({ path: calculatedPathForMissing.path });
      }
      else {
        missingNodes.push({ $ref: calculatedPathForMissing.$ref, path: null });
      }
    }
  });

  return { graphAdj, missingNodes, nodeContent, nodeReferenceDirectory, nodeName: currentNode.fileName };
}

/**
 * Generates the components object from the documentContext data
 * @param {object} documentContext The document context from root
 * @param {object} rootContent - The root's parsed content
 * @param {function} refTypeResolver - The resolver function to test if node has a reference
 * @param {object} components - The global components object
 * @returns {object} The components object related to the file
 */
function generateComponentsObject (documentContext, rootContent, refTypeResolver, components) {
  [rootContent, components].forEach((contentData) => {
    traverseUtility(contentData).forEach(function (property) {
      if (property) {
        let hasReferenceTypeKey;
        hasReferenceTypeKey = Object.keys(property)
          .find(
            (key) => {
              return refTypeResolver(property, key);
            }
          );
        if (hasReferenceTypeKey) {
          let tempRef = property.$ref,
            [nodeRef, local] = tempRef.split(localPointer),
            refData = documentContext.globalReferences[tempRef],
            isMissingNode = documentContext.missing.find((missingNode) => {
              return missingNode.path === nodeRef;
            });
          if (isMissingNode) {
            refData.nodeContent = {
              [tempRef]: 'This related node was not found in provided data'
            };
            refData.inline = true;
            refData.local = false;
          }
          else {
            refData.nodeContent = documentContext.nodeContents[nodeRef];
            refData.inline = refData.keyInComponents.length === 0;
          }
          if (local) {
            refData.nodeContent = getContentFromTrace(refData.nodeContent, local);
          }
          if (refData.inline) {
            refData.node = refData.nodeContent;
          }
          this.update(refData.node);
          if (!refData.inline) {
            setValueInComponents(
              refData.keyInComponents,
              components,
              refData.nodeContent
            );
          }
        }
      }
    });
  });
}

module.exports = {
  /**
   * Takes in an spec root file and an array of data files
   * Bundles the content of the files into one single file according to the
   * json pointers ($ref)
   * @param {object} specRoot - root file information
   * @param {Array} allData -  array of { path, content} objects
   * @param {Array} origin - process origin (BROWSER or node)
   * @returns {object} - Detect root files result object
   */
  getBundleContentAndComponents: function (specRoot, allData, origin) {
    if (origin === BROWSER) {
      path = pathBrowserify;
    }
    let algorithm = new DFS(),
      components = {},
      rootContextData;

    rootContextData = algorithm.traverseAndBundle(specRoot, (currentNode) => {
      return getNodeContentAndReferences(currentNode, allData, specRoot);
    });
    if (specRoot.parsed.oasObject.hasOwnProperty('components')) {
      components = specRoot.parsed.oasObject.components;
    }
    generateComponentsObject(rootContextData, rootContextData.nodeContents[specRoot.fileName], isExtRef, components);
    return {
      fileContent: rootContextData.nodeContents[specRoot.fileName],
      components
    };
  },
  getReferences
};
