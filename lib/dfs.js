class DFS {
  traverse(node, getAdjacent) {
    let traverseOrder = [],
      stack = [],
      missing = [],
      visited = new Set();
    stack.push(node);
    while (stack.length > 0) {
      node = stack.pop();
      if (!visited.has(node)) {
        traverseOrder.push(node);
        visited.add(node);
        let { graphAdj, missingNodes } = getAdjacent(node);
        missing.push(...missingNodes);
        for (let j = 0; j < graphAdj.length; j++) {
          stack.push(graphAdj[j]);
        }
      }
    }
    missing = [
      ...new Set(
        missing.map((obj) => {
          return JSON.stringify(obj);
        })
      )
    ].map((str) => {
      return JSON.parse(str);
    });
    return { traverseOrder, missing };
  }

  traverseAndBundle(node, getAdjacentAndBundle) {
    let traverseOrder = [],
      stack = [],
      missing = [],
      visited = new Set(),
      bundleData = [];
    stack.push(node);
    while (stack.length > 0) {
      node = stack.pop();
      if (!visited.has(node)) {
        traverseOrder.push(node);
        visited.add(node);
        let { graphAdj, missingNodes, bundleDataInAdjacent } = getAdjacentAndBundle(node);
        missing.push(...missingNodes);
        bundleData.push(...bundleDataInAdjacent);
        for (let j = 0; j < graphAdj.length; j++) {
          stack.push(graphAdj[j]);
        }
      }
    }
    missing = [
      ...new Set(
        missing.map((obj) => {
          return JSON.stringify(obj);
        })
      )
    ].map((str) => {
      return JSON.parse(str);
    });
    return { traverseOrder, missing, bundleData };
  }
}

module.exports = {
  DFS
};
