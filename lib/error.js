/**
 * constructor openApiErr
 * @constructor
 * @param {*} message errorMessage
 */
function openApiErr(message) {
  this.message = message || '';
}

openApiErr.prototype = Error();

module.exports = openApiErr;
