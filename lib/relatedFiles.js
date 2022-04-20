const { DFS } = require('./dfs');

/**
   * Maps the output from get root files to detect root files
   * @param {object} output - output schema
   * @param {string} version - specified version of the process
   * @returns {object} - Detect root files result object
   */
function getReferences () {
  // obtener los refs => '../common/Error.yaml' //relative to root path
  // obtener el file de data por path (puede que aqui sea absoluto)
  //                   si no existe agregarlo a missing
  // obtener el objeto
  // agregarlo a un array (de nodos adjacentes)
  //
  return { graphAdj: [], missingNodes: [] };
}

module.exports = {

  getRelatedFiles: function (specRoot) {
    let algorithm = new DFS(),
      orderTraversed = algorithm.traverse(specRoot, getReferences);
    return orderTraversed;
  }
};
