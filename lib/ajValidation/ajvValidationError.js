var _ = require('lodash');
const { formatDataPath } = require('../common/schemaUtilsCommon'),
  // Mismatch severities
  SEVERITY = {
    INFO: 'info',
    LOG: 'log',
    WARNING: 'warning',
    ERROR: 'error'
  };

/**
 * This function generates reason and reasonCodes (used in mismatch objects) using Ajv Validation Error
 *
 * @param {Object} ajvValidationErrorObj Ajv Validation Error Object (reference: https://ajv.js.org/#validation-errors)
 * @param {Object} data data needed for generation of mismatch Object
 *
 * @returns {Object} mismatchObj with reason and reasonCode properties
 */
function ajvValidationError(ajvValidationErrorObj, data) {
  var mismatchPropName = formatDataPath(_.get(ajvValidationErrorObj, 'instancePath', '')),
    mismatchObj;

  // discard the leading '.' if it exists
  if (mismatchPropName[0] === '.') {
    mismatchPropName = mismatchPropName.slice(1);
  }

  mismatchObj = {
    reason: `The ${data.humanPropName} property "${mismatchPropName}" ` +
      `${ajvValidationErrorObj.message}`,
    reasonCode: 'INVALID_TYPE',
    severity: SEVERITY.ERROR
  };

  switch (ajvValidationErrorObj.keyword) {

    case 'additionalProperties':
      mismatchObj.reasonCode = 'MISSING_IN_SCHEMA';
      mismatchObj.severity = SEVERITY.WARNING;
      break;

      // currently not supported as OAS doesn't support this keyword
      // case 'dependencies':
      //   mismatchObj.reasonCode = 'MISSING_IN_REQUEST';
      //   mismatchObj.reason = `The ${data.humanPropName} property "${mismatchPropName}" ` +
      //   `should have property "${_.get(ajvValidationErrorObj, 'params.missingProperty')}" when property ` +
      //   `"${_.get(ajvValidationErrorObj, 'params.property')}" is present`;
      //   break;

    case 'required':
      mismatchObj.reasonCode = 'MISSING_IN_REQUEST';
      mismatchObj.reason = `The ${data.humanPropName} property "${mismatchPropName}" should have required ` +
        `property "${_.get(ajvValidationErrorObj, 'params.missingProperty')}"`;
      mismatchObj.severity = SEVERITY.ERROR;
      break;

      // currently not supported as OAS doesn't support this keyword
      // case 'propertyNames':
      //   mismatchObj.reason = `The ${data.humanPropName} property "${mismatchPropName}" contains invalid ` +
      //     `property named "${_.get(ajvValidationErrorObj, 'params.propertyName')}"`;
      //   break;`

    default:
      break;
  }

  return mismatchObj;
}

module.exports = ajvValidationError;
