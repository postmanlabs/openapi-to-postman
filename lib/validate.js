var util = require('./util.js');

module.exports = function(jsonOrString) {
  var parseResult = util.parseSpec(jsonOrString);

  if (!parseResult.result) {
    return {
      result: false,
      reason: parseResult.reason
    };
  }

  return {
    result: true
  };
};
