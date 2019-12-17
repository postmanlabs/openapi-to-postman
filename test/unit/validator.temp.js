/**
 * This file is meant for debugging purposes only. It is excluded from `npm test`
 * Add any openapi file to ../data/.temp before running this
 */

var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/.temp/specs/spec-to-validate-against.json',
  HISTORY_PATH = '../data/.temp/specs/history_obj.json';

describe('The converter must validate a history request against the schema', function () {
  var openapi = JSON.parse(fs.readFileSync(path.join(__dirname, VALID_OPENAPI_PATH), 'utf8')),
    historyRequest = JSON.parse(fs.readFileSync(path.join(__dirname, HISTORY_PATH), 'utf8'));

  it('correctly', function(done) {
    let schemaPack = new Converter.SchemaPack({ type: 'json', data: openapi }, {});
    schemaPack.validateTransaction(historyRequest, (err, result) => {
      console.log('Final result: ', JSON.stringify(result, null, 2));
      done();
    });
  });
});
