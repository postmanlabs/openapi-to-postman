module.exports = {
  name: 'should generate collection with types',
  specificationType: 'OPENAPI:3.1',
  generationOptions: {
    folderStrategy: 'Paths'
  },
  shouldGenerateCollection: true,
  fixture: {
    collection: {
      info: {
        _postman_id: '66e36a5e-5027-4be5-85bc-b9a978fa18db',
        name: 'Swagger Petstore',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: '',
          type: 'text/plain'
        }
      },

      item: [
        {
          name: 'pets',
          description: '',
          item: [
            {
              id: '3a552836-17eb-4762-84c5-b231724c0d2d',
              name: 'List all pets',
              request: {
                name: 'List all pets',
                description: {},
                url: {
                  path: ['pets'],
                  host: ['{{baseUrl}}'],
                  query: [
                    {
                      disabled: false,
                      description: {
                        content: 'How many items to return at one time (max 100)',
                        type: 'text/plain'
                      },
                      key: 'limit1',
                      value: '<integer>'
                    }
                  ],
                  variable: []
                },
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                method: 'GET',
                body: {},
                auth: null
              },
              response: [
                {
                  id: '283f1461-0203-4f28-9c09-c373c31a2770',
                  name: 'unexpected error',
                  originalRequest: {
                    url: {
                      path: ['pets'],
                      host: ['{{baseUrl}}'],
                      query: [
                        {
                          disabled: false,
                          description: {
                            content: 'How many items to return at one time (max 100)',
                            type: 'text/plain'
                          },
                          key: 'limit1',
                          value: '<integer>'
                        }
                      ],
                      variable: []
                    },
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    method: 'GET',
                    body: {}
                  },
                  status: 'Internal Server Error',
                  code: 500,
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/json'
                    }
                  ],
                  body: '{\n  "code": "<integer>",\n  "message": "<string>"\n}',
                  cookie: [],
                  _postman_previewlanguage: 'json'
                }
              ],
              event: [],
              protocolProfileBehavior: {
                disableBodyPruning: true
              }
            }
          ]
        }
      ],

      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1'
        }
      ]
    },
    collectionTypeData: {
      'get/pets': {
        request: {
          headers: '[]',
          pathParam: '[]',
          queryParam:
            '[\n  {\n    "keyName": "limit1",\n    "properties": {\n      "type": "integer",\n      "format": "int32",\n      "default": "<integer>"\n    }\n  }\n]'
        },
        response: {
          500: {
            body: '{\n  "type": "object",\n  "properties": {\n    "code": {\n      "type": "integer",\n      "format": "int32"\n    },\n    "message": {\n      "type": "string"\n    }\n  },\n  "required": [\n    "code",\n    "message"\n  ]\n}',
            headers: '[]'
          }
        }
      }
    },
    spec: {
      openapi: '3.1.0',
      info: {
        version: '1.0.0',
        title: 'Swagger Petstore',
        license: {
          name: 'MI'
        }
      },
      servers: [
        {
          url: 'http://petstore.swagger.io/v1'
        }
      ],
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            operationId: 'pets',
            tags: ['pets', 'random'],
            parameters: [
              {
                name: 'limit1',
                in: 'query',
                description: 'How many items to return at one time (max 100)',
                schema: {
                  type: 'integer',
                  format: 'int32'
                }
              }
            ],
            responses: {
              500: {
                description: 'unexpected error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Error: {
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'integer',
                format: 'int32'
              },
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    generatedTypedata: {
      '3a552836-17eb-4762-84c5-b231724c0d2d': {
        request: {
          headers: [],
          pathParam: [],
          queryParam: [
            {
              keyName: 'limit1',
              properties: {
                type: 'integer',
                default: '<integer>'
              }
            }
          ]
        },
        response: {
          '283f1461-0203-4f28-9c09-c373c31a2770': {
            body: {
              type: 'object',
              properties: {
                code: { type: 'integer' },
                message: { type: 'string' }
              },
              required: ['code', 'message']
            },
            headers: []
          }
        }
      }
    }
  }
};
