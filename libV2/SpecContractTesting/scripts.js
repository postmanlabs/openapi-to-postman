// Postman script bodies (`exec` line arrays) used by the contract flows.

// Assertion message with what came back: "received 422 Unprocessable Entity: {"error":...}".
const RECEIVED = '"received " + pm.response.code + " " + pm.response.status + ": " + ' +
  'pm.response.text().replace(/\\s+/g, " ").slice(0, 300)';

module.exports = {
  /**
   * Pre-request: skip the request when a variable it needs is empty, e.g. because the request
   * that saves it failed, instead of sending a bogus value.
   *
   * @param {String[]} variables - variables the request uses
   * @param {String} [reason] - why a variable would be empty, shown in the skip message
   * @returns {String[]} exec lines
   */
  guard: (variables, reason = 'the request that saves it did not succeed') => {
    return variables.length ? [
      `var contractNeeds = ${JSON.stringify(variables)};`,
      'var contractMissing = contractNeeds.filter(function (name) {',
      '  var value = pm.variables.get(name);',
      '',
      '  return value === undefined || value === null || value === "";',
      '});',
      'if (contractMissing.length) {',
      `  console.warn("Skipping " + pm.info.requestName + ": missing " + contractMissing.join(", ") + ${
        JSON.stringify(` (${reason})`)});`,
      '  pm.execution.skipRequest();',
      '}'
    ] : [];
  },

  expectSuccess: ['', 'pm.test("Flow | Succeeds (2xx)", function () {',
    `  pm.expect(pm.response.code, ${RECEIVED}).to.be.within(200, 299);`, '});'],

  /**
   * Post-response: on any 2xx (a spec may declare several success codes with the same body), save
   * each value into its collection variable: a body field (`path`) or a header (`header`), optionally
   * narrowed by `pattern` to its first capture group.
   *
   * @param {Object[]} saves - { variable, path | header, pattern? }
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
      '  if (!(pm.response.code >= 200 && pm.response.code < 300)) { return; }',
      '  var value = save.header ? pm.response.headers.get(save.header) :',
      '    require("lodash").get(contractBody, save.path);',
      '  if (save.pattern && value !== undefined && value !== null) {',
      '    var match = new RegExp(save.pattern).exec(String(value));',
      '',
      '    value = match ? (match[1] !== undefined ? match[1] : match[0]) : undefined;',
      '  }',
      '  pm.test("Flow | Saved " + save.variable + " from the response", function () {',
      '    pm.expect(value, (save.header ? "header " + save.header : save.path) + " not found in response")',
      '      .to.not.be.undefined;',
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
    `  pm.expect(pm.response.code, ${RECEIVED}).to.equal(404);`, '});'],

  expectNoTokenRejected: ['pm.test("Rejects requests without a token (401/403)", function () {',
    `  pm.expect(pm.response.code, ${RECEIVED}).to.be.oneOf([401, 403]);`, '});'],

  /**
   * Test that a request missing a required body field is rejected.
   *
   * @param {String} field - removed field
   * @returns {String[]} exec lines
   */
  expectMissingFieldRejected: (field) => {
    return [`pm.test("Rejects a request without \\"${field}\\" (4xx)", function () {`,
      `  pm.expect(pm.response.code, ${RECEIVED}).to.be.within(400, 499);`, '});'];
  },

  /**
   * Post-response on a negative create: if the API wrongly accepted it, keep the new id so the
   * next request can delete it.
   *
   * @param {String} variable - variable to keep the id in
   * @param {String} path - lodash path of the id in the response body
   * @returns {String[]} exec lines
   */
  captureCreated: (variable, path) => {
    return [
      '',
      '// Contract flow: if this was wrongly accepted, keep the new id so the next request deletes it.',
      'if (pm.response.code >= 200 && pm.response.code < 300) {',
      '  var created;',
      `  try { created = require("lodash").get(pm.response.json(), ${JSON.stringify(path)}); } catch (e) {}`,
      '  if (created !== undefined && created !== null) {',
      `    pm.collectionVariables.set(${JSON.stringify(variable)}, created);`,
      '  }',
      '}'
    ];
  },

  /**
   * Post-response: clear a variable once used.
   *
   * @param {String} variable - variable
   * @returns {String[]} exec lines
   */
  clear: (variable) => { return [`pm.collectionVariables.unset(${JSON.stringify(variable)});`]; }
};
