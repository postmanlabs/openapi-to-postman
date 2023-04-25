const _ = require('lodash'),
  {
    isExtRef,
    getKeyInComponents,
    getJsonPointerRelationToRoot,
    removeLocalReferenceFromPath,
    localPointer,
    jsonPointerLevelSeparator,
    isLocalRef,
    jsonPointerDecodeAndReplace,
    generateObjectName
  } = require('./jsonPointer'),
  traverseUtility = require('traverse'),
  parse = require('./parse.js'),
  { ParseError } = require('./common/ParseError'),
  Utils = require('./utils'),
  crypto = require('crypto'),
  { isCircularReference } = require('./utils');

let path = require('path'),
  pathBrowserify = require('path-browserify'),
  BROWSER = 'browser',
  { DFS } = require('./dfs'),
  deref = require('./deref.js'),
  { isSwagger, getBundleRulesDataByVersion } = require('./common/versionUtils'),
  CIRCULAR_OR_REF_EXT_PROP = 'x-orRef';


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
 * Parses a node content or throw ParseError if there's any error
 * @param {string} fileContent The content from the current node
 * @returns {object} The parsed content
 */
function parseFileOrThrow(fileContent) {
  const result = parse.getOasObject(fileContent);
  if (result.result === false) {
    throw new ParseError(result.reason);
  }
  return result;
}

/**
 * Parses a node content or throw ParseError if there's any error
 * @param {string} fileContent The content from the current node
 * @returns {object} The parsed content
 */
function parseFile(fileContent) {
  const result = parse.getOasObject(fileContent);
  return result;
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
  const trace = partial.split(jsonPointerLevelSeparator).map((item) => {
    return jsonPointerDecodeAndReplace(item);
  });
  let currentValue = content;
  currentValue = deref._getEscaped(content, trace, undefined);
  return currentValue;
}

/**
  * Set a value in the global components object following the provided trace
  * @param {array} keyInComponents - The trace to the key in components
  * @param {object} components - A global components object
  * @param {object} value - The value from node matched with data
  * @param {array} componentsKeys - The keys of the reusable component
  * @returns {null} It modifies components global context
*/
function setValueInComponents(keyInComponents, components, value, componentsKeys) {
  let currentPlace = components,
    target = keyInComponents[keyInComponents.length - 2],
    key = keyInComponents.length === 2 && componentsKeys.includes(keyInComponents[0]) ?
      keyInComponents[1] :
      null;
  if (componentsKeys.includes(keyInComponents[0])) {
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
 * Calculates the has of a provided key and join its first 4 numbers at the end of the current key by a _
 * @param {string} currentKey The key we will hash
 * @returns {string} A key with a hashed part joined by _
 */
function createComponentHashedKey(currentKey) {
  let hashPart = crypto.createHash('sha1')
      .update(currentKey)
      .digest('base64')
      .substring(0, 4),
    newKey = generateObjectName(currentKey, hashPart);
  return newKey;
}

/**
 * Generates a not repeated mainKey for the component
 * @param {string} tempRef - The reference to the node we are processing
 * @param {array} mainKeys - A list of previous generated mainKeys
 * @returns {string} A generated mainKey from the provided tempRef
 */
function createComponentMainKey(tempRef, mainKeys) {
  let newKey = generateObjectName(tempRef),
    mainKey = mainKeys[newKey];
  if (mainKey && mainKey !== tempRef) {
    newKey = createComponentHashedKey(tempRef);
  }
  return newKey;
}

/**
 * Return a trace from the current node's root to the place where we find a $ref
 * @param {object} nodeContext - The current node we are processing
 * @param {object} tempRef - The tempRef from the $ref
 * @param {object} mainKeys - The dictionary of the previous keys generated
 * @param {string} version - The current version of the spec
 * @param {string} commonPathFromData - The common path in the file's paths
 * @returns {array} The trace to the place where the $ref appears
 */
function getTraceFromParentKeyInComponents(nodeContext, tempRef, mainKeys, version, commonPathFromData) {
  const parents = [...nodeContext.parents].reverse(),
    isArrayKeyRegexp = new RegExp('^\\d+$', 'g'),
    key = nodeContext.key,
    keyIsAnArrayItem = key.match(isArrayKeyRegexp),
    parentKeys = [...parents.map((parent) => {
      return parent.key;
    })],
    nodeParentsKey = keyIsAnArrayItem ?
      parentKeys :
      [key, ...parentKeys],
    nodeTrace = getRootFileTrace(nodeParentsKey),
    componentKey = createComponentMainKey(tempRef, mainKeys),
    parentNodeKey = nodeContext.parent.key,
    keyTraceInComponents = getKeyInComponents(
      nodeTrace,
      componentKey,
      version,
      commonPathFromData,
      parentNodeKey
    );
  return keyTraceInComponents;
}

/**
 * Modifies the generated trace if there is a collision with a key that exists in root components object
 * @param {array} trace The generated trace
 * @param {object} initialMainKeys the main keys in local components object if it exists
 * @returns {array} A modified trace if there is any collision with local reusable objects
 */
function handleLocalCollisions(trace, initialMainKeys) {
  if (trace.length === 0) {
    return trace;
  }
  const componentType = trace[trace.length - 2],
    initialKeysOfType = initialMainKeys[componentType],
    generatedKeyIndex = trace.length - 1;

  if (initialKeysOfType && initialKeysOfType.includes(trace[generatedKeyIndex])) {
    trace[generatedKeyIndex] = createComponentHashedKey(trace[generatedKeyIndex]);
  }
  return trace;
}

/**
   * Gets all the $refs from an object
   * @param {object} currentNode - current node in process
   * @param {Function} isOutOfRoot - A filter to know if the current components was called from root or not
   * @param {Function} pathSolver - function to resolve the Path
   * @param {string} parentFilename - The parent's filename
   * @param {object} version - The version of the spec we are bundling
   * @param {object} rootMainKeys - A dictionary with the component keys in local components object and its mainKeys
   * @param {string} commonPathFromData - The common path in the file's paths
   * @param {Array} allData -  array of { path, content} objects
   * @param {object} globalReferences - The accumulated global references from all nodes
   * @returns {object} - The references in current node and the new content from the node
   */
function getReferences (currentNode, isOutOfRoot, pathSolver, parentFilename, version, rootMainKeys,
  commonPathFromData, allData, globalReferences) {
  let referencesInNode = [],
    nodeReferenceDirectory = {},
    mainKeys = {};

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
          nodeTrace = handleLocalCollisions(
            getTraceFromParentKeyInComponents(this, tempRef, mainKeys, version, commonPathFromData),
            rootMainKeys
          ),
          componentKey = nodeTrace[nodeTrace.length - 1],
          referenceInDocument = getJsonPointerRelationToRoot(
            tempRef,
            nodeTrace,
            version
          ),
          traceToParent = [...this.parents.map((item) => {
            return item.key;
          }).filter((item) => {
            return item !== undefined;
          }), this.key];
        let newValue,
          [, local] = tempRef.split(localPointer),
          nodeFromData,
          refHasContent = false,
          parseResult,
          newRefInDoc,
          inline;

        newValue = Object.assign({}, this.node);
        nodeFromData = findNodeFromPath(tempRef, allData);
        if (nodeFromData && nodeFromData.content) {
          parseResult = parseFile(nodeFromData.content);
          if (parseResult.result) {
            newValue.$ref = referenceInDocument;
            refHasContent = true;
            nodeFromData.parsed = parseResult;
          }
        }
        this.update({ $ref: tempRef });

        if (nodeTrace.length === 0) {
          inline = true;
        }

        if (_.isNil(globalReferences[tempRef])) {
          nodeReferenceDirectory[tempRef] = {
            local,
            keyInComponents: nodeTrace,
            node: newValue,
            reference: inline ? newRefInDoc : referenceInDocument,
            traceToParent,
            parentNodeKey: parentFilename,
            mainKeyInTrace: nodeTrace[nodeTrace.length - 1],
            refHasContent,
            inline
          };
        }

        mainKeys[componentKey] = tempRef;

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
   * @param {string} version - The current version
   * @param {object} rootMainKeys - A dictionary with the component keys in local components object and its mainKeys
   * @param {string} commonPathFromData - The common path in the file's paths
   * @param {object} globalReferences - The accumulated global refernces from all nodes
   * @returns {object} - Detect root files result object
   */
function getNodeContentAndReferences (currentNode, allData, specRoot, version, rootMainKeys,
  commonPathFromData, globalReferences) {
  let graphAdj = [],
    missingNodes = [],
    nodeContent,
    parseResult;

  if (currentNode.parsed) {
    nodeContent = currentNode.parsed.oasObject;
  }
  else {
    parseResult = parseFile(currentNode.content);
    if (parseResult.result === false) {
      return { graphAdj, missingNodes, undefined, nodeReferenceDirectory: {}, nodeName: currentNode.fileName };
    }
    nodeContent = parseResult.oasObject;
  }

  const { referencesInNode, nodeReferenceDirectory } = getReferences(
    nodeContent,
    currentNode.fileName !== specRoot.fileName,
    removeLocalReferenceFromPath,
    currentNode.fileName,
    version,
    rootMainKeys,
    commonPathFromData,
    allData,
    globalReferences
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
   * Maps the output from get root files to detect root files
   * @param {array} parents - current { path, content} object
   * @param {string} key -  array of { path, content} objects
   * @returns {object} - Detect root files result object
   */
function resolveJsonPointerInlineNodes(parents, key) {
  let pointer = parents.filter((parent) => {
    return parent !== undefined;
  }).map((parent) => {
    return parent.key;
  }).join(jsonPointerLevelSeparator);
  if (pointer) {
    pointer = localPointer + pointer;
  }
  else {
    pointer += localPointer;
  }
  pointer += jsonPointerLevelSeparator + key;

  return pointer;
}

/**
 * Finds the reference in the document context
 * @param {object} documentContext The document context from root
 * @param {object} mainKeyInTrace - The key to find
 * @returns {string} The reference value
 */
function findReferenceByMainKeyInTraceFromContext(documentContext, mainKeyInTrace) {
  let relatedRef = '',
    globalRef;
  globalRef = Object.values(documentContext.globalReferences).find((item) => {
    return item.mainKeyInTrace === mainKeyInTrace;
  });
  if (globalRef) {
    relatedRef = globalRef.reference;
  }
  return relatedRef;
}

/**
 * Modifies content of a node if it is circular reference.
 *
 * @param {function} traverseContext - The context of the traverse function
 * @param {object} documentContext The document context from root
 * @returns {undefined}  nothing
 */
function handleCircularReference(traverseContext, documentContext) {
  let relatedRef = '';
  if (traverseContext.circular) {
    relatedRef = findReferenceByMainKeyInTraceFromContext(documentContext, traverseContext.circular.key);
    traverseContext.update({ $ref: relatedRef });
  }
  if (traverseContext.keys && traverseContext.keys.includes(CIRCULAR_OR_REF_EXT_PROP)) {
    traverseContext.update({ $ref: traverseContext.node[CIRCULAR_OR_REF_EXT_PROP] });
  }
}

/**
 * Generates the components object from the documentContext data
 * @param {object} documentContext The document context from root
 * @param {object} rootContent - The root's parsed content
 * @param {function} refTypeResolver - The resolver function to test if node has a reference
 * @param {object} components - The global components object
 * @param {string} version - The current version
 * @returns {object} The components object related to the file
 */
function generateComponentsObject (documentContext, rootContent, refTypeResolver, components, version) {
  let notInLine = Object.entries(documentContext.globalReferences).filter(([, value]) => {
      return value.keyInComponents.length !== 0;
    }),
    circularRefsSet = new Set();
  const { COMPONENTS_KEYS } = getBundleRulesDataByVersion(version);
  notInLine.forEach(([key, value]) => {
    let [, partial] = key.split(localPointer);
    if (documentContext.globalReferences[key].refHasContent) {
      setValueInComponents(
        value.keyInComponents,
        components,
        getContentFromTrace(documentContext.nodeContents[key], partial),
        COMPONENTS_KEYS
      );
    }
  });
  [rootContent, components].forEach((contentData, index) => {
    if (index === 1 && contentData.hasOwnProperty('$ref')) {
      delete contentData.$ref;
    }
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
            refData.nodeContent = refData.node;
            refData.local = false;
          }
          else if (!refData) {
            return;
          }
          else {
            refData.nodeContent = documentContext.nodeContents[nodeRef];
          }
          if (local) {
            let contentFromTrace = getContentFromTrace(refData.nodeContent, local);
            if (!contentFromTrace) {
              refData.nodeContent = { $ref: `${localPointer + local}` };
            }
            else if (isCircularReference(this, contentFromTrace)) {
              if (refData.inline) {
                refData.nodeContent = { [CIRCULAR_OR_REF_EXT_PROP]: tempRef };
                circularRefsSet.add(tempRef);
              }
              else {
                refData.node = { [CIRCULAR_OR_REF_EXT_PROP]: refData.reference };
                refData.nodeContent = contentFromTrace;
                circularRefsSet.add(refData.reference);
              }
            }
            else {
              refData.nodeContent = contentFromTrace;
            }
          }
          if (refData.inline) {
            let referenceSiblings = _.omit(property, ['$ref']),
              hasSiblings = !_.isEmpty(referenceSiblings);
            refData.node = hasSiblings ?
              _.merge(referenceSiblings, refData.nodeContent) :
              refData.nodeContent;
            documentContext.globalReferences[tempRef].reference =
              resolveJsonPointerInlineNodes(this.parents, this.key);
          }
          else if (refData.refHasContent) {
            setValueInComponents(
              refData.keyInComponents,
              components,
              refData.nodeContent,
              COMPONENTS_KEYS
            );
          }
          this.update(refData.node);
        }
      }
    });
  });
  return {
    resRoot: traverseUtility(rootContent).map(function () {
      handleCircularReference(this, documentContext);
    }),
    newComponents: traverseUtility(components).map(function () {
      handleCircularReference(this, documentContext);
    }),
    circularRefs: [...circularRefsSet]
  };
}

/**
 * Generates the components object wrapper
 * @param {object} parsedOasObject The parsed root
 * @param {string} version - The current version
 * @param {object} nodesContent - The nodes content
 * @returns {object} The components object wrapper
 */
function generateComponentsWrapper(parsedOasObject, version, nodesContent = {}) {
  let components = _.isNil(parsedOasObject.components) ?
      {} :
      parsedOasObject.components,
    componentsAreReferenced = components.$ref !== undefined && !_.isEmpty(nodesContent);

  if (isSwagger(version)) {
    getBundleRulesDataByVersion(version).COMPONENTS_KEYS.forEach((property) => {
      if (parsedOasObject.hasOwnProperty(property)) {
        components[property] = parsedOasObject[property];
      }
    });
  }
  else if (parsedOasObject.hasOwnProperty('components')) {
    if (componentsAreReferenced) {
      components = _.merge(parsedOasObject.components, nodesContent[components.$ref]);
      delete components.$ref;
    }
  }

  return components;
}

/**
 * Generates a map of generated reference to the original reference
 *
 * @param {object} globalReferences - Global references present at each root file context
 * @returns {object} reference map
 */
function getReferenceMap(globalReferences) {
  const output = {};

  _.forEach(globalReferences, (globalReference, refKey) => {
    if (_.isString(refKey) && _.isString(globalReference.reference)) {
      output[globalReference.reference] = {
        path: refKey,
        type: globalReference.inline ? 'inline' : 'component'
      };
    }
  });

  return output;
}

/**
 * Returns a dictionary with the resusable component keys and their mainKeys in document before the bundle
 * @param {object} components - The wrapper with the root reusable components before the bundle
 * @param {string} version - The spec version
 * @returns {object} - A directory with the local components keys related with their mainKeys
 */
function getMainKeysFromComponents(components, version) {
  const {
    COMPONENTS_KEYS
  } = getBundleRulesDataByVersion(version);
  let componentsDictionary = {};
  COMPONENTS_KEYS.forEach((key) => {
    if (components[key]) {
      componentsDictionary[key] = Object.keys(components[key]);
    }
  });
  return componentsDictionary;
}

module.exports = {
  /**
   * Takes in an spec root file and an array of data files
   * Bundles the content of the files into one single file according to the
   * json pointers ($ref)
   * @param {object} specRoot - root file information
   * @param {Array} allData -  array of { path, content} objects
   * @param {Array} origin - process origin (BROWSER or node)
   * @param {string} version - The version we are using
   * @returns {object} - Detect root files result object
   */
  getBundleContentAndComponents: function (specRoot, allData, origin, version) {
    if (origin === BROWSER) {
      path = pathBrowserify;
    }
    const initialComponents = generateComponentsWrapper(
        specRoot.parsed.oasObject,
        version
      ),
      initialMainKeys = getMainKeysFromComponents(initialComponents, version);
    let algorithm = new DFS(),
      components = {},
      commonPathFromData = '',
      finalElements = {},
      rootContextData;
    commonPathFromData = Utils.findCommonSubpath(allData.map((fileData) => {
      return fileData.fileName;
    }));
    rootContextData = algorithm.traverseAndBundle(specRoot, (currentNode, globalReferences) => {
      return getNodeContentAndReferences(
        currentNode,
        allData,
        specRoot,
        version,
        initialMainKeys,
        commonPathFromData,
        globalReferences
      );
    });
    components = generateComponentsWrapper(
      specRoot.parsed.oasObject,
      version,
      rootContextData.nodeContents
    );
    finalElements = generateComponentsObject(
      rootContextData,
      rootContextData.nodeContents[specRoot.fileName],
      isExtRef,
      components,
      version
    );
    return {
      fileContent: finalElements.resRoot,
      components: finalElements.newComponents,
      fileName: specRoot.fileName,
      referenceMap: getReferenceMap(rootContextData.globalReferences),
      circularRefs: finalElements.circularRefs
    };
  },
  getReferences,
  parseFileOrThrow
};
