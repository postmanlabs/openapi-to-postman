const inputValidation31X = require('./inputValidation31X'),
  schemaUtilsCommon = require('../common/schemaUtilsCommon');


module.exports = {

  parseSpec: function (openApiSpec) {
    return schemaUtilsCommon.parseSpec(openApiSpec, inputValidation31X);
  }

};
