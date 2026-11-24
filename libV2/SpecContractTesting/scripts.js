// Postman script bodies (`exec` line arrays) used by the contract flows.

// Assertion message with what came back: "received 422 Unprocessable Entity: {"error":...}".
const RECEIVED = '"received " + pm.response.code + " " + pm.response.status + ": " + ' +
  'pm.response.text().replace(/\\s+/g, " ").slice(0, 300)';

module.exports = {
  /**
   * Collection-level pre-request, so it runs before each request's own scripts: a value set in the
   * environment replaces every value the request sends whose name is exactly the variable's: path
   * variables, enabled query parameters and headers, form fields, and JSON body fields at any depth (keeping
   * numbers, booleans and JSON values typed). Empty environment values replace nothing.
   */
  overrideFromEnvironment: [
    '// Contract tests: a value set in the environment replaces every value with exactly that name.',
    'var contractOverride = function (name) {',
    '  var value = pm.environment.get(name);',
    '',
    '  return value === undefined || value === null || value === "" ? undefined : String(value);',
    '};',
    'var contractReplace = function (entry) {',
    '  var value = entry.disabled ? undefined : contractOverride(entry.key);',
    '',
    '  if (value !== undefined) { entry.value = value; }',
    '};',
    'pm.request.url.variables.each(function (variable) {',
    '  var value = contractOverride(variable.key);',
    '',
    '  if (value !== undefined) { variable.set(value); }',
    '});',
    'pm.request.url.query.each(contractReplace);',
    'pm.request.headers.each(contractReplace);',
    'var contractBody = pm.request.body;',
    '',
    'if (contractBody && (contractBody.mode === "urlencoded" || contractBody.mode === "formdata")) {',
    '  contractBody[contractBody.mode].each(contractReplace);',
    '}',
    'if (contractBody && contractBody.mode === "raw" && contractBody.raw) {',
    '  var contractReplaced = false,',
    '    contractJson;',
    '  // Placeholders for non-string values are unquoted: quote them so the body parses.',
    '  var contractRaw = contractBody.raw.replace(/([:\\[,]\\s*)\\{\\{([^{}]+)\\}\\}/g, function (match, before, name) {',
    '    return before + JSON.stringify("__contract_var__" + name);',
    '  });',
    '  var contractTyped = function (current, value) {',
    '    var unquoted = typeof current === "string" && current.indexOf("__contract_var__") === 0;',
    '',
    '    if (unquoted || (current !== null && typeof current === "object")) {',
    '      try { return JSON.parse(value); } catch (e) { return value; }',
    '    }',
    '    if (typeof current === "number" && value.trim() !== "" && !isNaN(Number(value))) { return Number(value); }',
    '    if (typeof current === "boolean" && (value === "true" || value === "false")) { return value === "true"; }',
    '',
    '    return value;',
    '  };',
    '  var contractWalk = function (node) {',
    '    if (Array.isArray(node)) { return node.forEach(contractWalk); }',
    '    if (node === null || typeof node !== "object") { return; }',
    '    Object.keys(node).forEach(function (key) {',
    '      var value = contractOverride(key);',
    '',
    '      if (value === undefined) { return contractWalk(node[key]); }',
    '      node[key] = contractTyped(node[key], value);',
    '      contractReplaced = true;',
    '    });',
    '  };',
    '',
    '  try { contractJson = JSON.parse(contractRaw); } catch (e) { contractJson = undefined; }',
    '  contractWalk(contractJson);',
    '  if (contractReplaced) {',
    '    contractBody.update({ mode: "raw", options: contractBody.options,',
    '      raw: JSON.stringify(contractJson, null, 2).replace(/"__contract_var__([^"]+)"/g, "{{$1}}") });',
    '  }',
    '}'
  ],

  /**
   * Pre-request: skip the request when a variable it still uses is empty, e.g. because the request
   * that saves it failed, instead of sending a bogus value. A missing input also fails a test: no
   * earlier failure explains it.
   *
   * @param {Object} needs - variable the request uses -> why it would be empty, shown in the skip message
   * @param {String[]} [inputs] - the variables in `needs` that the caller sets
   * @param {Boolean} [strict] - check every variable in `needs`, even one an environment override replaced
   *   (a cleanup that must only run when its variable was set)
   * @returns {String[]} exec lines
   */
  guard: (needs, inputs = [], strict = false) => {
    if (!Object.keys(needs).length) { return []; }

    const isMissing = strict ?
        ['  return value === undefined || value === null || value === "";'] :
        ['  return (value === undefined || value === null || value === "") &&',
          '    contractRequest.indexOf("{{" + name + "}}") !== -1;'],
      failInputs = inputs.length ? [
        `  ${JSON.stringify(inputs)}.filter(function (name) { return contractMissing.indexOf(name) !== -1; })`,
        '    .forEach(function (name) {',
        '      pm.test("Request | " + name + " is set", function () {',
        '        pm.expect.fail(name + " is empty: " + contractNeeds[name]);',
        '      });',
        '    });'
      ] : [];

    return [`var contractNeeds = ${JSON.stringify(needs)};`].concat(
      strict ? [] : [
        '// An environment override may have replaced a variable; only the ones still in the request matter.',
        'var contractRequest = JSON.stringify(pm.request.toJSON());'
      ],
      ['var contractMissing = Object.keys(contractNeeds).filter(function (name) {', '  var value = pm.variables.get(name);',
        ''],
      isMissing,
      [
        '});',
        'if (contractMissing.length) {',
        '  console.warn("Skipping " + pm.info.requestName + ": missing " + contractMissing.map(function (name) {',
        '    return name + " (" + contractNeeds[name] + ")";',
        '  }).join(", "));'
      ],
      failInputs,
      ['  pm.execution.skipRequest();', '}']
    );
  },

  expectSuccess: ['', 'pm.test("Request | Succeeds (2xx)", function () {',
    `  pm.expect(pm.response.code, ${RECEIVED}).to.be.within(200, 299);`, '});'],

  /**
   * Post-response: on any 2xx (a spec may declare several success codes with the same body), save
   * each value from the response body into its collection variable.
   *
   * @param {Object[]} saves - { variable, path }: path is a lodash path into the body
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
      '  var value = require("lodash").get(contractBody, save.path);',
      '',
      '  pm.test("Request | Saved " + save.variable + " from the response", function () {',
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

  expectGone: ['', 'pm.test("Request | Deleted resource is gone (404)", function () {',
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
