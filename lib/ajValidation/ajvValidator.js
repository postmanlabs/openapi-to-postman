const Ajv = require('ajv'),
  addFormats = require('ajv-formats');

/**
 * Used to validate schema against a value.
 * NOTE: Used in assets/json-schema-faker.js to validate schema example
 *
 * @param {*} schema - schema to validate
 * @param {*} valueToUse - value to validate schema against
 * @param {*} options - a standard list of options that's globally passed around. Check options.js for more.
 * @returns {*} - Found Validation Errors
 */
function validateSchemaAJV (schema, valueToUse) {
  let ajv,
    validate,
    filteredValidationError;

  try {
    // add Ajv options to support validation of OpenAPI schema.
    // For more details see https://ajv.js.org/#options
    ajv = new Ajv({
      // check all rules collecting all errors. instead returning after the first error.
      allErrors: true,
      strict: false
    });
    addFormats(ajv);
    validate = ajv.compile(schema);
    validate(valueToUse);
  }
  catch (e) {
    // something went wrong validating the schema
    // input was invalid. Don't throw mismatch
    return { filteredValidationError };
  }
  return { filteredValidationError, validate };
}

module.exports = {
  validateSchemaAJV
};
