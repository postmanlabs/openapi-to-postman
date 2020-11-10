const toJsonSchema = require('to-json-schema');

/**
 * Generates JSON schema from given data
 *
 * @param {*} data - Data to be converted into JSON schema
 * @param {*} options - Options
 * @returns {Object} - Corresponding JSON schema
 */
function convertToJsonSchema (data, options) { // eslint-disable-line no-unused-vars
  let schema;

  try {
    schema = toJsonSchema(data);
  }
  catch (e) {
    console.warn('Pm2OasError: Error while converting to JSON schema', e.message);
    return;
  }
  return schema;
}

module.exports = convertToJsonSchema;
