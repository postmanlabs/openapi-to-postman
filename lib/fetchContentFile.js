/* eslint-disable block-scoped-var */

/**
 * Takes a list of arguments and resolve them acording its content
 * @param {string} origin The arguments that will be resolved
 * @param {string} remoteRefsResolver The arguments that will be resolved
 * @returns {array} The list of arguments after have been resolved
 */
function resolveFetchFunction(origin, remoteRefsResolver) {
  if (remoteRefsResolver) {
    return remoteRefsResolver;
  }
  if (origin !== 'browser') {
    return require('node-fetch');
  }
}

/**
 * Takes a list of arguments and resolve them acording its content
 * @param {array} urls The arguments that will be resolved
 * @param {string} origin The arguments that will be resolved
 * @param {string} remoteRefsResolver The arguments that will be resolved
 * @returns {array} The list of arguments after have been resolved
 */
async function fetchURLs(urls, origin, remoteRefsResolver) {
  let toSolve = [],
    localPromises = [];
  if (remoteRefsResolver || origin !== 'browser') {
    var fetch = resolveFetchFunction(origin, remoteRefsResolver);
  }

  toSolve = urls.map((url) => {
    return { fileName: url, content: '' };
  });
  toSolve.forEach((item) => {
    let promiseToSolve = fetch(
      item.fileName
    ).then((res) => { return res.text(); });
    localPromises.push(promiseToSolve);
  });
  const alData = await Promise.all(localPromises);
  alData.forEach((content, index) => {
    toSolve[index].content = content;
  });
  return toSolve;
}


module.exports = {
  fetchURLs
};
