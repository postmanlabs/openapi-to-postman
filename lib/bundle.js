const {
    isExtRef,
    getKeyInComponents,
    getJsonPointerRelationToRoot,
    jsonPointerEncodeAndReplace
  } = require('./jsonPointer'),
  traverseUtility = require('traverse'),
  parse = require('./parse.js');

let path = require('path'),
  pathBrowserify = require('path-browserify'),
  BROWSER = 'browser',
  { DFS } = require('./dfs');


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
   * Removes the local pointer inside a path
   * aab.yaml#component returns aab.yaml
   * @param {string} refValue - value of the $ref property
   * @returns {string} - the calculated path only
   */
function removeLocalReferenceFromPath(refValue) {
  if (refValue.$ref.includes('#')) {
    return refValue.$ref.split('#')[0];
  }
  return refValue.$ref;
}

/**
  * Calculates the path relative to parent
  * @param {string} parentFileName - parent file name of the current node
  * @param {string} referencePath - value of the $ref property
  * @returns {object} - Detect root files result object
  */
function calculatePath(parentFileName, referencePath) {
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
  const partialComponents = referencePath.split('#');
  let isPartial = partialComponents.length > 1,
    node = allData.find((node) => {
      if (isPartial) {
        referencePath = partialComponents[0];
      }
      return comparePaths(node.fileName, referencePath);
    });
  if (node) {
    node.isPartial = isPartial;
    node.partialCalled = partialComponents[1];
  }

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
 * Generates a trace from the root to the current item
 * @param {array} nodeTrace - The trace from the current file to the current element
 * @param {*} connector - The trace from the root's document context to the current file context
 * @returns {array} The merged trace from the current item to the root's context
 */
function getTraceFromParent(nodeTrace, connector) {
  return connector.concat(nodeTrace);
}

/**
   * Gets all the $refs from an object
   * @param {object} currentNode - current node in process
   * @param {Function} refTypeResolver - function to resolve the ref according to type (local, external, web etc)
   * @param {Function} pathSolver - function to resolve the Path
   * @param {string} parentFilename - The parent's filename
   * @param {object} globalComponentsContext - The global context from root file
   * @returns {object} - {path : $ref value}
   */
function getReferences (currentNode, refTypeResolver, pathSolver, parentFilename, globalComponentsContext) {
  let referencesInNode = [];

  traverseUtility(currentNode).forEach(function (property) {
    if (property) {
      let hasReferenceTypeKey;
      hasReferenceTypeKey = Object.keys(property)
        .find(
          (key) => {
            return refTypeResolver(property, key);
          }
        );
      if (hasReferenceTypeKey) {
        const parents = [...this.parents].reverse(),
          key = this.key,
          nodeParentsKey = [key, ...parents.map((parent) => {
            return parent.key;
          })],
          nodeTrace = getRootFileTrace(nodeParentsKey),
          connectorFromParent = globalComponentsContext[parentFilename] ?
            globalComponentsContext[parentFilename].connector :
            [],
          traceFromParent = getTraceFromParent(nodeTrace, connectorFromParent),
          cleanFileName = (filename) => {
            const [file, local] = filename.split('#');
            return [calculatePath(parentFilename, file), local];
          },
          [file, local] = cleanFileName(property.$ref),
          newValue = Object.assign({}, this.node),
          keyInComponents = getKeyInComponents(traceFromParent, file, local, connectorFromParent),
          referenceInDocument = getJsonPointerRelationToRoot(
            jsonPointerEncodeAndReplace,
            file,
            property.$ref,
            traceFromParent
          );

        newValue.$ref = referenceInDocument;
        this.update(newValue);

        if (globalComponentsContext[file]) {
          globalComponentsContext[file].isFull =
            globalComponentsContext[file].isFull && !local;
          if (local) {
            globalComponentsContext[file].partialCalled.push(local);
          }
        }
        else {
          globalComponentsContext[file] = {
            calledFrom: parentFilename,
            connector: keyInComponents,
            isFull: !local,
            partialsCalled: local ? [local] : [],
            referenceInDocument,
            content: this.node
          };
        }
        if (!added(property.$ref, referencesInNode)) {
          referencesInNode.push({ path: pathSolver(property), keyInComponents });
        }
      }
    }
  });
  if (globalComponentsContext[parentFilename]) {
    globalComponentsContext[parentFilename].content = currentNode.oasObject;
  }
  else {
    globalComponentsContext[parentFilename] = {
      isRoot: true,
      filename: parentFilename,
      content: currentNode.oasObject
    };
  }
  return referencesInNode;
}

/**
   * Maps the output from get root files to detect root files
   * @param {object} currentNode - current { path, content} object
   * @param {Array} allData -  array of { path, content} objects
   * @param {object} specRoot - root file information
   * @param {string} globalComponentsContext - the context from the global level
   * @returns {object} - Detect root files result object
   */
function getAdjacentAndMissingToBundle (currentNode, allData, specRoot, globalComponentsContext) {
  let currentNodeReferences,
    currentContent = currentNode.content,
    graphAdj = [],
    missingNodes = [],
    bundleDataInAdjacent = [],
    OASObject;

  if (currentContent.parsed) {
    OASObject = currentNode.parsed;
  }
  else {
    OASObject = parse.getOasObject(currentContent);
  }

  currentNodeReferences = getReferences(
    OASObject,
    isExtRef,
    removeLocalReferenceFromPath,
    currentNode.fileName,
    globalComponentsContext
  );

  currentNodeReferences.forEach((reference) => {
    let referencePath = reference.path,
      adjacentNode = findNodeFromPath(calculatePath(currentNode.fileName, referencePath), allData);
    if (adjacentNode) {
      bundleDataInAdjacent.push({ reference, adjacentNode, currentNode });
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
  if (missingNodes.length > 0) {
    throw new Error('Some files are missing, run detectRelatedFiles to get more detail');
  }
  return { graphAdj, missingNodes, bundleDataInAdjacent, currentNode };
}

// function fillExistentComponents(components, componentsObject) {
//   Object.keys(components).forEach((key) => {
//     componentsObject[key] = components[key];
//   });
//   return componentsObject;
// }

/**
 * Convert the current key data in document context to an item in components object
 * @param {array} namesArray - The conector from root related with the current item
 * @param {object} target - The components global object where the result will be added
 * @param {string} dataKey - The current key in the document context
 * @param {object} documentContext - The document context data necesary to generate the component's items
 * @returns {object} The object related with the current key in document context
 */
function convert(namesArray, target, dataKey, documentContext) {
  let result = target,
    nestedObj = result;
  for (let [index, name] of namesArray.entries()) {
    let nextName = namesArray[index + 1];
    if (documentContext[name]) {
      continue;
    }
    else if (documentContext[nextName]) {
      nestedObj[name] = documentContext[nextName].content;
    }
    else if (!nestedObj[name]) {
      nestedObj[name] = {};
    }
    nestedObj = nestedObj[name];
  }

  return result;
}

/**
 * Generates the components object from the documentContext data
 * @param {object} documentContext The document context from root
 * @param {string} rootFilename - The root's filename
 * @returns {object} The components object related to the file
 */
function generateComponentsObject (documentContext, rootFilename) {
  let components = {};
  Object.keys(documentContext).forEach((dataKey) => {
    if (dataKey === rootFilename) {
      return;
    }
    convert(documentContext[dataKey].connector, components, dataKey, documentContext);
  });
  return components;
}

module.exports = {
  /**
   * Maps the output from get root files to detect root files
   * @param {object} specRoot - root file information
   * @param {Array} allData -  array of { path, content} objects
   * @param {Array} origin - process origin (BROWSER or node)
   * @returns {object} - Detect root files result object
   */
  getRelatedFilesAndBundleData: function (specRoot, allData, origin) {
    if (origin === BROWSER) {
      path = pathBrowserify;
    }
    let algorithm = new DFS(),
      globalComponentsContext = {};

    algorithm.traverseAndBundle(specRoot, (currentNode) => {
      return getAdjacentAndMissingToBundle(currentNode, allData, specRoot, globalComponentsContext);
    });

    return generateComponentsObject(globalComponentsContext, specRoot.fileName);
  },

  bundleFiles: function(data) {
    let { bundleData, missingRelatedFiles } = data[0],
      components = {},
      componentsFromFile = false;
    if (missingRelatedFiles.length > 0) {
      throw new Error(`There are ${missingRelatedFiles.length} missing files in yopur spec`);
    }
    Object.keys(bundleData).forEach((key) => {
      if (bundleData[key].hasOwnProperty('components')) {
        if (componentsFromFile) {
          throw new Error('Muyltiple components definition through your files');
        }
        components = fillExistentComponents(bundleData.key.components, components);
        componentsFromFile = true;
      }
      else {
        components[key] = bundleData[key].content;
      }
    });
    return components;
  }
};

