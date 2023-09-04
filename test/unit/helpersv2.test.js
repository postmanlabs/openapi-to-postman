var expect = require('chai').expect,
  generateAuthForCollectionFromOpenAPI = require('../../libV2/helpers/collection/generateAuthForCollectionFromOpenAPI');

describe('Helper function tests', function () {
  describe('getAuthHelper method - Multiple API keys', function() {
    it('Should include extra API keys if they are present and we ask for them', function() {
      const openAPISpec = {
          'securityDefs': {
            'EmptyAuth': {},
            'PostmanApiKeyAuth': {
              'type': 'apiKey',
              'in': 'header',
              'name': 'x-api-key',
              'description': 'Needs a valid and active user accessToken.'
            },
            'PostmanAccessTokenAuth': {
              'type': 'apiKey',
              'in': 'header',
              'name': 'x-access-token',
              'description': 'Needs a valid and active user accessToken.'
            },
            'ServiceBasicAuth': {
              'type': 'http',
              'scheme': 'basic',
              'description': 'Need basic-auth credential for a service'
            }
          }
        },
        securitySet = [{ PostmanAccessTokenAuth: [] }, { PostmanApiKeyAuth: [] }],
        helperData = generateAuthForCollectionFromOpenAPI(openAPISpec, securitySet, true);

      expect(helperData.type).to.be.equal('apikey');
      expect(helperData).to.have.property('apikey').with.lengthOf(3);
      expect(helperData.apikey[0]).to.be.an('object');
      expect(helperData).to.deep.equal({
        'type': 'apikey',
        'apikey': [
          {
            'key': 'key',
            'value': 'x-access-token'
          },
          {
            'key': 'value',
            'value': '{{apiKey}}'
          },
          {
            'key': 'in',
            'value': 'header'
          }
        ],
        'extraAPIKeys': [
          {
            'type': 'apikey',
            'apikey': [
              {
                'key': 'key',
                'value': 'x-api-key'
              },
              {
                'key': 'value',
                'value': '{{apiKey}}'
              },
              {
                'key': 'in',
                'value': 'header'
              }
            ]
          }
        ]
      });

    });
  });
});
