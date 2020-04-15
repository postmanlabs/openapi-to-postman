var _ = require('lodash');

/**
 * This function generates reason and reasonCodes (used in mismatch objects) using Ajv Validation Error
 *
 * @param {Object} ajvValidationErrorObj Ajv Validation Error Object (reference: https://ajv.js.org/#validation-errors)
 * @param {Object} data data needed for generation of mismatch Object
 *
 * @returns {Object} mismatchObj with reason and reasonCode properties
 */
function ajvValidationError(ajvValidationErrorObj, data) {
  var mismatchPropName = _.get(ajvValidationErrorObj, 'dataPath', '').slice(1),
    mismatchObj = {
      reason: `The ${data.humanPropName} property "${mismatchPropName}" ` +
        `${ajvValidationErrorObj.message}`,
      reasonCode: 'INVALID_TYPE'
    };

  switch (ajvValidationErrorObj.keyword) {

    // certain keywords can be grouped together
    case 'maxItems':
    case 'minItems':
    case 'maxLength':
    case 'minLength':
    case 'maxProperties':
    case 'minProperties':
      break;

    case 'additionalProperties':
      mismatchObj.reasonCode = 'MISSING_IN_SCHEMA';
      break;

    case 'dependencies':
      mismatchObj.reason = `The ${data.humanPropName} property "${mismatchPropName}" ` +
      `should have property "${_.get(ajvValidationErrorObj, 'params.missingProperty')}" when property ` +
      `"${_.get(ajvValidationErrorObj, 'params.property')}" is present`;
      break;

    case 'format':
      break;

    case 'minimum':
    case 'maximum':
      break;

    case 'multipleOf':
      break;

    case 'pattern':
      break;

    case 'required':
      mismatchObj.reasonCode = 'MISSING_IN_REQUEST';
      mismatchObj.reason = `The ${data.humanPropName} property "${mismatchPropName}" should have required ` +
        `property "${_.get(ajvValidationErrorObj, 'params.missingProperty')}"`;
      break;

    case 'propertyNames':
      mismatchObj.reason = `The ${data.humanPropName} property "${mismatchPropName}" contains invalid ` +
        `property named "${_.get(ajvValidationErrorObj, 'params.propertyName')}"`;
      break;

    case 'type':
      break;

    case 'uniqueItems':
      break;

    case 'const':
      break;

    case 'enum':
      break;

    default:
      break;
  }

  return mismatchObj;
}

module.exports = ajvValidationError;
