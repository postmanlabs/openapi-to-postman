module.exports = {
  name: 'should handle postman variables in collection request url',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags',
    nestedFolderHierarchy: true
  },
  shouldGenerateCollection: false,
  initialState: {
    collection: {
      info: {
        _postman_id: '77f47de9-a797-44fa-8b21-e931301f0e1f',
        name: 'URL variable resolution',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Get space craft',
          id: '5a8ca801-c4c3-43cb-8ba3-b2f3656c9eb1',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/spacecrafts/{{spaceCraft}}',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', '{{spaceCraft}}']
            }
          },
          response: []
        },
        {
          name: 'Create spacecraft - updated',
          id: '49c69b3a-1c76-4011-a1b6-ab351f689770',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            method: 'POST',
            header: [],
            url: {
              raw: '{{baseUrl}}/spacecrafts/{{spacecraft1}}',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', '{{spacecraft1}}']
            }
          },
          response: []
        },
        {
          name: 'Update spacecraft - 1',
          id: 'c3ce2a60-2670-430e-9b39-2787f92a6bdd',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            auth: {
              type: 'apikey',
              apikey: [
                {
                  key: 'key',
                  value: 'X-Api-Key',
                  type: 'string'
                },
                {
                  key: 'value',
                  value: '{{apiKey}}',
                  type: 'string'
                },
                {
                  key: 'in',
                  value: 'header',
                  type: 'string'
                }
              ]
            },
            method: 'PUT',
            header: [
              {
                key: 'Accept',
                value: 'application/json'
              }
            ],
            url: {
              raw: '{{baseUrl}}/spacecrafts/:id',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', ':id'],
              variable: [
                {
                  key: 'id',
                  value: '<string>',
                  description: 'The unique identifier of the spacecraft'
                }
              ]
            }
          },
          response: []
        },
        {
          name: 'Update partial spacecraft',
          id: 'c69da761-bf50-4167-9928-648a2ba1863e',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            auth: {
              type: 'apikey',
              apikey: [
                {
                  key: 'key',
                  value: 'X-Api-Key',
                  type: 'string'
                },
                {
                  key: 'value',
                  value: '{{apiKey}}',
                  type: 'string'
                },
                {
                  key: 'in',
                  value: 'header',
                  type: 'string'
                }
              ]
            },
            method: 'PATCH',
            header: [
              {
                key: 'Accept',
                value: 'application/json'
              }
            ],
            url: {
              raw: '{{baseUrl}}/spacecrafts/:sid',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', ':sid'],
              variable: [
                {
                  key: 'sid',
                  value: '<string>',
                  description: 'The unique identifier of the spacecraft'
                }
              ]
            }
          },
          response: []
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: '{{baseUrl}}',
          type: 'any'
        }
      ]
    }
  },
  finalState: {
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'URL variable resolution',
        version: '1.0.0',
        description: ''
      },
      servers: [
        {
          url: '{{baseUrl}}'
        }
      ],
      paths: {
        '/spacecrafts/{spaceCraft}': {
          get: {
            summary: 'Get space craft',
            tags: [],
            responses: {}
          },
          parameters: [
            {
              name: 'spaceCraft',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          post: {
            summary: 'Create spacecraft - updated',
            tags: [],
            responses: {}
          },
          put: {
            summary: 'Update spacecraft - 1',
            tags: [],
            responses: {},
            security: [
              {
                ApiKeyAuth: []
              }
            ]
          },
          patch: {
            summary: 'Update partial spacecraft',
            tags: [],
            responses: {
              200: {
                description: 'success'
              }
            },
            security: [
              {
                ApiKeyAuth: []
              }
            ]
          }
        }
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Api-Key'
          }
        }
      }
    },
    collection: {
      info: {
        _postman_id: '77f47de9-a797-44fa-8b21-e931301f0e1f',
        name: 'URL variable resolution',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'Get space craft',
          id: '5a8ca801-c4c3-43cb-8ba3-b2f3656c9eb1',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/spacecrafts/:spaceCraft',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', ':spaceCraft'],
              variable: [
                {
                  key: 'spaceCraft',
                  value: '{{spaceCraft}}'
                }
              ]
            }
          },
          response: []
        },
        {
          name: 'Create spacecraft - updated',
          id: '49c69b3a-1c76-4011-a1b6-ab351f689770',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            method: 'POST',
            header: [],
            url: {
              raw: '{{baseUrl}}/spacecrafts/:spaceCraft',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', ':spaceCraft'],
              variable: [
                {
                  key: 'spaceCraft',
                  value: '{{spacecraft1}}'
                }
              ]
            }
          },
          response: []
        },
        {
          name: 'Update spacecraft - 1',
          id: 'c3ce2a60-2670-430e-9b39-2787f92a6bdd',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            auth: {
              type: 'apikey',
              apikey: [
                {
                  key: 'key',
                  value: 'X-Api-Key',
                  type: 'string'
                },
                {
                  key: 'value',
                  value: '{{apiKey}}',
                  type: 'string'
                },
                {
                  key: 'in',
                  value: 'header',
                  type: 'string'
                }
              ]
            },
            method: 'PUT',
            header: [
              {
                key: 'Accept',
                value: 'application/json'
              }
            ],
            url: {
              raw: '{{baseUrl}}/spacecrafts/:spaceCraft',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', ':spaceCraft'],
              variable: [
                {
                  key: 'spaceCraft',
                  value: '<string>'
                }
              ]
            }
          },
          response: []
        },
        {
          name: 'Update partial spacecraft',
          id: 'c69da761-bf50-4167-9928-648a2ba1863e',
          protocolProfileBehavior: {
            disableBodyPruning: true
          },
          request: {
            auth: {
              type: 'apikey',
              apikey: [
                {
                  key: 'key',
                  value: 'X-Api-Key',
                  type: 'string'
                },
                {
                  key: 'value',
                  value: '{{apiKey}}',
                  type: 'string'
                },
                {
                  key: 'in',
                  value: 'header',
                  type: 'string'
                }
              ]
            },
            method: 'PATCH',
            header: [
              {
                key: 'Accept',
                value: 'application/json'
              }
            ],
            url: {
              raw: '{{baseUrl}}/spacecrafts/:spaceCraft',
              host: ['{{baseUrl}}'],
              path: ['spacecrafts', ':spaceCraft'],
              variable: [
                {
                  key: 'spaceCraft',
                  value: '<string>'
                }
              ]
            }
          },
          response: [
            {
              id: '96d2246f-42af-4fe1-8230-9f6658ac3e88',
              name: 'success',
              originalRequest: {
                method: 'PATCH',
                header: [
                  {
                    description: 'Added as a part of security scheme: apikey',
                    key: 'X-Api-Key',
                    value: '<API Key>'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/spacecrafts/:spaceCraft',
                  host: ['{{baseUrl}}'],
                  path: ['spacecrafts', ':spaceCraft'],
                  variable: [
                    {
                      key: 'spaceCraft',
                      value: '<string>'
                    }
                  ]
                }
              },
              status: 'OK',
              code: 200,
              _postman_previewlanguage: 'text',
              header: [],
              cookie: []
            }
          ]
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: '{{baseUrl}}',
          type: 'any'
        }
      ]
    }
  }
};
