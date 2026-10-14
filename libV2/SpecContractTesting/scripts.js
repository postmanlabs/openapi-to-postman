// Postman script bodies (`exec` line arrays) used by the contract flows.
module.exports = {
  /**
   * Pre-request: skip the request when a variable it needs is empty, e.g. because the request
   * that saves it failed, instead of sending a bogus value.
   *
   * @param {String[]} variables - variables the request uses
   * @returns {String[]} exec lines
   */
  guard: (variables) => {
    return variables.length ? [
      `var contractNeeds = ${JSON.stringify(variables)};`,
      'var contractMissing = contractNeeds.filter(function (name) { return !pm.variables.get(name); });',
      'if (contractMissing.length) {',
      '  console.warn("Skipping " + pm.info.requestName + ": missing " + contractMissing.join(", ") +',
      '    " (the request that saves it did not succeed)");',
      '  pm.execution.skipRequest();',
      '}'
    ] : [];
  },

  /**
   * Post-response: on the producer's status, save each value into its collection variable.
   *
   * @param {Object[]} saves - { variable, status, path }
   * @returns {String[]} exec lines
   */
  save: (saves) => {
    return saves.length ? [
      '',
      '// Contract flow: save values that later requests need.',
      `var contractSaves = ${JSON.stringify(saves)};`,
      'var contractBody;',
      'try { contractBody = pm.response.json(); } catch (e) { contractBody = undefined; }',
      'contractSaves.forEach(function (save) {',
      '  if (String(pm.response.code) !== save.status) { return; }',
      '  var value = require("lodash").get(contractBody, save.path);',
      '  pm.test("Flow | Saved " + save.variable + " from the response", function () {',
      '    pm.expect(value, save.path + " not found in response").to.not.be.undefined;',
      '  });',
      '  if (value !== undefined && value !== null) { pm.collectionVariables.set(save.variable, value); }',
      '});'
    ] : [];
  },

  /**
   * Post-response on a delete: keep the deleted ids as `deleted_<name>` and clear the originals.
   *
   * @param {String[]} variables - id variables the delete used
   * @returns {String[]} exec lines
   */
  markDeleted: (variables) => {
    return variables.length ? [
      '',
      '// Contract flow: remember deleted ids so the next request can check they are gone.',
      'if (pm.response.code >= 200 && pm.response.code < 300) {',
      `  ${JSON.stringify(variables)}.forEach(function (name) {`,
      '    pm.collectionVariables.set("deleted_" + name, pm.collectionVariables.get(name));',
      '    pm.collectionVariables.unset(name);',
      '  });',
      '}'
    ] : [];
  },

  expectGone: ['', 'pm.test("Flow | Deleted resource is gone (404)", function () {',
    '  pm.response.to.have.status(404);', '});'],

  expectNoTokenRejected: ['pm.test("Rejects requests without a token (401/403)", function () {',
    '  pm.expect(pm.response.code).to.be.oneOf([401, 403]);', '});'],

  /**
   * Test that a request missing a required body field is rejected.
   *
   * @param {String} field - removed field
   * @returns {String[]} exec lines
   */
  expectMissingFieldRejected: (field) => {
    return [`pm.test("Rejects a request without \\"${field}\\" (4xx)", function () {`,
      '  pm.expect(pm.response.code).to.be.within(400, 499);', '});'];
  }
};
