/*
  Here a new request is being added with the path POST /pets
  And the request is being added to the collection in the correct location following `Tags`
  since the folderStrategy is set to 'Tags'
 */
module.exports = {
  name: 'should add new request to collection in correct location - organised using tags',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  shouldAssertGenerationAndSyncing: true,
  initialState: {
    collection: {
      info: {
        name: 'add-req',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
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
                      key: 'limit1',
                      value: '<integer>',
                      enabled: true,
                      description: 'How many items to return at one time (max 100)'
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
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets?limit1=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit1',
                          value: '<integer>',
                          enabled: true,
                          description: 'How many items to return at one time (max 100)'
                        }
                      ]
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
        },
        {
          name: 'random',
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
                      key: 'limit1',
                      value: '<integer>',
                      enabled: true,
                      description: 'How many items to return at one time (max 100)'
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
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets?limit1=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit1',
                          value: '<integer>',
                          enabled: true,
                          description: 'How many items to return at one time (max 100)'
                        }
                      ]
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
      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1'
        }
      ]
    },
    spec: {
      openapi: '3.0.0',
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
    }
  },
  finalState: {
    collection: {
      info: {
        _postman_id: '10c5688b-4d99-484b-896f-0a2c60c62034',
        name: 'add-req',
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
                      key: 'limit1',
                      value: '<integer>',
                      description: 'How many items to return at one time (max 100)'
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
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets?limit1=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit1',
                          value: '<integer>',
                          description: 'How many items to return at one time (max 100)'
                        }
                      ]
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
                  raw: '{{baseUrl}}/pets?limit1=<integer>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      key: 'limit1',
                      value: '<integer>',
                      description: 'How many items to return at one time (max 100)'
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
                      raw: '{{baseUrl}}/pets?limit1=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit1',
                          value: '<integer>',
                          description: 'How many items to return at one time (max 100)'
                        }
                      ]
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
        },
        {
          name: 'random',
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
                      key: 'limit1',
                      value: '<integer>',
                      description: 'How many items to return at one time (max 100)'
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
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets?limit1=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit1',
                          value: '<integer>',
                          description: 'How many items to return at one time (max 100)'
                        }
                      ]
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
      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1',
          type: 'any'
        }
      ]
    },
    spec: {
      openapi: '3.0.0',
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
                name: 'limit1',
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
        }
      }
    }
  }
};
