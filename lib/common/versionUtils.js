const VERSION_30 = { key: 'openapi', version: '3.0' },
  VERSION_31 = { key: 'openapi', version: '3.1' },
  VERSION_20 = { key: 'swagger', version: '2.0' },
  GENERIC_VERSION2 = { key: 'swagger', version: '2.' },
  GENERIC_VERSION3 = { key: 'openapi', version: '3.' },
  DEFAULT_SPEC_VERSION = VERSION_30.version,
  fs = require('fs');

/**
 * gets the version key and the version and generates a regular expression that
 * could be used to match with any content
 * @param {*} key could be 'openapi' or 'swagger' depending on the version of
 * provided spec
 * @param {*} version could be 2. or 3. depending on the provided spec
 * @returns {object} the resultant regular expresion using the provided data
 */
function getVersionRegexp({ key, version }) {
  return new RegExp(`${key}['|"]?:\\s?[\\\]?['|"]?${version}`);
}

/**
 * When the array of files is provided as a list of parsed objects
 * it returns the content from file that contains the version data
 * @param {array} data An array of the provided file's content parsed
 * @returns {string} The content of the file that contains the version data
 */
function getFileByContent(data) {
  const version2RegExp = getVersionRegexp(GENERIC_VERSION2),
    version3RegExp = getVersionRegexp(GENERIC_VERSION3),
    file = data.find((element) => {
      return element.content.match(version2RegExp) || element.content.match(version3RegExp);
    });
  return file.content;
}

/**
 * When the array of files is provided as a list of file's paths it returns the
 * content of the file that contains the version data
 * @param {array} data The array of files in the folder provided by the user
 * @returns {string} the content of the file that contains the version data
 */
function getFileByFileName(data) {
  const version2RegExp = getVersionRegexp(GENERIC_VERSION2),
    version3RegExp = getVersionRegexp(GENERIC_VERSION3);
  let file = data.map((element) => {
    return fs.readFileSync(element.fileName, 'utf8');
  }).find((content) => {
    return content.match(version2RegExp) || content.match(version3RegExp);
  });
  return file;
}

/** When the user provides a folder, this function returns the file
 * that contains the version data
 * @param {array} data An array of file's paths
 * @returns {string} The content of file with version data
 */
function getFileWithVersion(data) {
  let file;

  if (data[0].hasOwnProperty('content')) {
    file = getFileByContent(data);
  }
  else if (data[0].hasOwnProperty('fileName')) {
    file = getFileByFileName(data);
  }
  return file;
}

/**
 * Return the version of the provided specification
 * @param {string} spec Data from input file
 * @returns {string} version of specification
 */
function getSpecVersion({ type, data }) {
  if (!data) {
    return DEFAULT_SPEC_VERSION;
  }

  if (['folder'].includes(type)) {
    data = getFileWithVersion(data);
  }
  else if (['file'].includes(type)) {
    try {
      data = fs.readFileSync(data, 'utf8');
    }
    catch (error) {
      return DEFAULT_SPEC_VERSION; // If path is invalid it will follow the OAS 3.0 way
    }
  }

  if (type === 'json') {
    data = JSON.stringify(data);
  }
  const openapi30 = getVersionRegexp(VERSION_30),
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
