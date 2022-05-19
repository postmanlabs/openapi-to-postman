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
 * Takes a list of urls and downloads the content of all of them
 * @param {array} urls The urls to download
 * @param {string} origin process location (browser or node)
 * @param {Function} remoteRefsResolver User defined function used to fetch
 * @returns {array} Resolved content { filename: the url, content: actual content of the file}
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
    ).then((res) => {
      if (res.status !== 200) {
        return 'NF - ' + item.fileName;
      }
      return res.text();
    }).catch(() => {
      return 'NF - ' + item.fileName;
    });
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
