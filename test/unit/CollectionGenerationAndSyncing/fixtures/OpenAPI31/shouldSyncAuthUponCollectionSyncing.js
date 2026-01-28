/*
  Tests the scenario where a Spec has a security scheme defined.
  When the Auth in the Spec is updated, syncing the Spec should update
  the Auth in the associated Collection accordingly.
*/
module.exports = {
  name: 'should Sync Auth in Collection upon Syncing from Spec',
  specificationType: 'OPENAPI:3.1',
  generationOptions: { enableOptionalParameters: true },
  shouldAssertGenerationAndSyncing: true,
  initialState: {
    collection: {
      info: {
        _postman_id: 'b31cdbc6-02a4-4a9e-9d8b-29579fad9a75',
        name: 'query-true',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'pets',
          item: [
            {
              name: 'List all pets',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/pets',
                  host: ['{{baseUrl}}'],
                  path: ['pets']
                }
              },
              response: [
                {
                  name: 'unexpected error',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      },
                      {
                        description: 'Added as a part of security scheme: apikey',
                        key: 'X-Api-Key',
                        value: '<API Key>'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets',
                      host: ['{{baseUrl}}'],
                      path: ['pets']
                    }
                  },
                  status: 'Internal Server Error',
                  code: 500,
                  _postman_previewlanguage: 'json',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/json'
                    }
                  ],
                  cookie: [],
                  body: '{\n  "code": "<integer>",\n  "message": "<string>"\n}'
                }
              ]
            },
            {
              name: 'Create Pet record',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json'
                  },
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                body: {
                  mode: 'raw',
                  raw: '{\n  "message": "<string>",\n  "statusCode": "<integer>"\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/pets',
                  host: ['{{baseUrl}}'],
                  path: ['pets']
                }
              },
              response: [
                {
                  name: 'unexpected error',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Content-Type',
                        value: 'application/json'
                      },
                      {
                        key: 'Accept',
                        value: 'application/json'
                      },
                      {
                        description: 'Added as a part of security scheme: apikey',
                        key: 'X-Api-Key',
                        value: '<API Key>'
                      }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "message": "<string>",\n  "statusCode": "<integer>"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/pets',
                      host: ['{{baseUrl}}'],
                      path: ['pets']
                    }
                  },
                  status: 'Internal Server Error',
                  code: 500,
                  _postman_previewlanguage: 'json',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/json'
                    }
                  ],
                  cookie: [],
                  body: '{\n  "code": "<integer>",\n  "message": "<string>"\n}'
                }
              ]
            }
          ]
        }
      ],
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
      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1'
        }
      ]
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
            operationId: 'pets - updated',
            tags: ['pets', 'random'],
            responses: {
              500: {
                description: 'unexpected error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    },
                    example: {
                      message: 'Not Found'
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create Pet record',
            operationId: 'pets - updated',
            tags: ['pets'],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    required: ['code', 'message'],
                    properties: {
                      statusCode: {
                        type: 'integer',
                        format: 'int32',
                        example: 'errno:2213'
                      },
                      message: {
                        type: 'string',
                        example: 'Failed to insert record to db'
                      }
                    },
                    example: {
                      statusCode: 'errno:234',
                      message: 'Failed to insert record to db - outer'
                    }
                  }
                }
              }
            },
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
        },
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Api-Key'
          }
        }
      },
      security: [
        {
          ApiKeyAuth: []
        }
      ]
    }
  },
  finalState: {
    collection: {
      info: {
        _postman_id: 'b31cdbc6-02a4-4a9e-9d8b-29579fad9a75',
        name: 'query-true',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'pets',
          item: [
            {
              name: 'List all pets',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/pets?limit1=<integer>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      description: 'How many items to return at one time (max 100)',
                      key: 'limit1',
                      value: '<integer>'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'unexpected error',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      },
                      {
                        description: 'Added as a part of security scheme: apikey',
                        key: 'X-Api-Key-Updated',
                        value: '<API Key>'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets?limit1=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          description: 'How many items to return at one time (max 100)',
                          key: 'limit1',
                          value: '<integer>'
                        }
                      ]
                    }
                  },
                  status: 'Internal Server Error',
                  code: 500,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/json'
                    }
                  ],
                  cookie: [],
                  body: '{\n  "code": "<integer>",\n  "message": "<string>"\n}'
                }
              ]
            },
            {
              name: 'Create Pet record',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json'
                  },
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                body: {
                  mode: 'raw',
                  raw: '{\n  "message": "<string>",\n  "statusCode": "<integer>"\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/pets?limit2=<integer>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      description: 'How many items to return at one time (max 100)',
                      key: 'limit2',
                      value: '<integer>'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'unexpected error',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Content-Type',
                        value: 'application/json'
                      },
                      {
                        key: 'Accept',
                        value: 'application/json'
                      },
                      {
                        description: 'Added as a part of security scheme: apikey',
                        key: 'X-Api-Key-Updated',
                        value: '<API Key>'
                      }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "message": "<string>",\n  "statusCode": "<integer>"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/pets?limit2=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          description: 'How many items to return at one time (max 100)',
                          key: 'limit2',
                          value: '<integer>'
                        }
                      ]
                    }
                  },
                  status: 'Internal Server Error',
                  code: 500,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/json'
                    }
                  ],
                  cookie: [],
                  body: '{\n  "code": "<integer>",\n  "message": "<string>"\n}'
                }
              ]
            }
          ]
        }
      ],
      auth: {
        type: 'apikey',
        apikey: [
          {
            key: 'key',
            value: 'X-Api-Key-Updated',
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
      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1'
        }
      ]
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
            operationId: 'pets - updated',
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
                    },
                    example: {
                      message: 'Not Found'
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create Pet record',
            operationId: 'pets - updated',
            tags: ['pets'],
            parameters: [
              {
                name: 'limit2',
                in: 'query',
                description: 'How many items to return at one time (max 100)',
                schema: {
                  type: 'integer',
                  format: 'int32'
                }
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    required: ['code', 'message'],
                    properties: {
                      statusCode: {
                        type: 'integer',
                        format: 'int32',
                        example: 'errno:2213'
                      },
                      message: {
                        type: 'string',
                        example: 'Failed to insert record to db'
                      }
                    },
                    example: {
                      statusCode: 'errno:234',
                      message: 'Failed to insert record to db - outer'
                    }
                  }
                }
              }
            },
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
        },
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Api-Key-Updated'
          }
        }
      },
      security: [
        {
          ApiKeyAuth: []
        }
      ]
    }
  }
};
