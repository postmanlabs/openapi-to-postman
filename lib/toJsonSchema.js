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
    schema = toJsonSchema(data, {
      // provide post processing function as option
      postProcessFnc: (type, schema, value, defaultProcessFnc) => {
        if (type === 'null') {
          // for type:null avoid usiung null to follow OAS defined schema object
          return { type: 'string', nullable: true };
        }
        return defaultProcessFnc(type, schema, value);
      }
    });
  }
  catch (e) {
    console.warn('Pm2OasError: Error while converting to JSON schema', e.message);
    return '<Pm2OasError: Error while converting to JSON schema>';
  }
  return schema;
}

module.exports = convertToJsonSchema;
