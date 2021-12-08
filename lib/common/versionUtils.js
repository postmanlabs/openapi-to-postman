const VERSION_30 = { key: 'openapi', version: '3.0' },
  VERSION_31 = { key: 'openapi', version: '3.1' },
  VERSION_20 = { key: 'swagger', version: '2.0' },
  DEFAULT_SPEC_VERSION = VERSION_30.version;


/**
 * Return the version of the provided specification
 * @param {string} spec Data from input file
 * @returns {string} version of specification
 */
function getSpecVersion({ type, data }) {
  if (!data || ['folder'].includes(type)) { // It's pending to resolve version when input is a folder
    return DEFAULT_SPEC_VERSION;
  }

  if (type === 'json') {
    data = JSON.stringify(data);
  }
  const getVersionRegexp = ({ key, version }) => {
      return new RegExp(`${key}['|"]?:\\s?[\\\]?['|"]?${version}`);
    },
    openapi30 = getVersionRegexp(VERSION_30),
    openapi31 = getVersionRegexp(VERSION_31),
    openapi20 = getVersionRegexp(VERSION_20),
    is30 = data.match(openapi30),
    is31 = data.match(openapi31),
    is20 = data.match(openapi20);
  let version = DEFAULT_SPEC_VERSION;

  if (is30) {
    version = VERSION_30.version;
  }
  else if (is31) {
    version = VERSION_31.version;
  }
  else if (is20) {
    version = VERSION_20.version;
  }
  return version;
}

/**
 *
 * @param {string} specVersion - the OAS specification version
 * @returns {NodeRequire} the schema utils according to version
 */
function getConcreteSchemaUtils({ type, data }) {
  const specVersion = getSpecVersion({ type, data });
  let concreteUtils = {};
  if (specVersion === DEFAULT_SPEC_VERSION) {
    concreteUtils = require('../30XUtils/schemaUtils30X');
  }
  else {
    concreteUtils = require('../31XUtils/schemaUtils31X');
  }
  return concreteUtils;
}

module.exports = {
  getSpecVersion,
  getConcreteSchemaUtils
};
