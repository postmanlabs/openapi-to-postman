/**
 * This file is meant for debugging purposes only. It is excluded from `npm test`
 * Add any openapi file to ../data/.temp before running this
 */

var expect = require('chai').expect,
  Converter = require('../../index.js'),
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/.temp/specs/spec-to-validate-against.json';

describe('The converter must validate a history request against the schema', function () {
  var openapi = JSON.parse(fs.readFileSync(path.join(__dirname, VALID_OPENAPI_PATH), 'utf8')),
    historyRequest = {
      'request': {
        'url': 'https://google.com/petsa/string',
        'method': 'GET',
        'headers': [
          {
            'key': 'Content-Type',
            'value': 'application/json'
          },
          {
            'key': 'limit',
            'value': 'application/json'
          }
        ],
        'body': {
          'mode': 'raw',
          'raw': '{"username": "abhijitkane"}'
        }
      },
      'response': {
        'code': 200,
        'headers': [
          {
            'key': 'Set-Cookie',
            'value': 'a=b'
          },
          {
            'key': 'Content-Type',
            'value': 'application/text'
          }
        ],
        'text': 'json'
      }
    };

  it('correctly', function(done) {
    Converter.validateTransaction(historyRequest, openapi, {}, console.log);
    done();
  });
});
