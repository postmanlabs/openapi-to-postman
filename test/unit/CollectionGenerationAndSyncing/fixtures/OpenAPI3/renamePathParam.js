/*
Here we are testing the case where the user has renamed 'limit1' path parameter to 'limit2' in the spec.
Requests for 'limit2' path parameter are added to the collection with 'limit1' path parameter requests.
'limit1' path parameter requests are not deleted/removed from the collection.
*/
module.exports = {
  name: 'should rename path param from request',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {},
  shouldAssertGenerationAndSyncing: false,
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        name: 'query-remove',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'pets',
          item: [
            {
              name: '{limit1}',
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
                      raw: '{{baseUrl}}/pets/:limit1',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':limit1'],
                      variable: [
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
                          raw: '{{baseUrl}}/pets/:limit1',
                          host: ['{{baseUrl}}'],
                          path: ['pets', ':limit1'],
                          variable: [
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
                      raw: '{{baseUrl}}/pets/:limit1',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':limit1'],
                      variable: [
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
                          raw: '{{baseUrl}}/pets/:limit1',
                          host: ['{{baseUrl}}'],
                          path: ['pets', ':limit1'],
                          variable: [
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
        '/pets/{limit1}': {
          get: {
            summary: 'List all pets',
            operationId: 'pets - updated',
            tags: ['pets', 'random'],
            parameters: [
              {
                name: 'limit1',
                in: 'path',
                required: true,
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
                in: 'path',
                required: true,
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
  },
  finalState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        name: 'query-remove',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'pets',
          item: [
            {
              name: '{limit1}',
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
                      raw: '{{baseUrl}}/pets/:limit1',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':limit1'],
                      variable: [
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
                          raw: '{{baseUrl}}/pets/:limit1',
                          host: ['{{baseUrl}}'],
                          path: ['pets', ':limit1'],
                          variable: [
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
                      raw: '{{baseUrl}}/pets/:limit1',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':limit1'],
                      variable: [
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
                          raw: '{{baseUrl}}/pets/:limit1',
                          host: ['{{baseUrl}}'],
                          path: ['pets', ':limit1'],
                          variable: [
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
              name: '{limit2}',
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
                      raw: '{{baseUrl}}/pets/:limit2',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':limit2'],
                      variable: [
                        {
                          key: 'limit2',
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
                          raw: '{{baseUrl}}/pets/:limit2',
                          host: ['{{baseUrl}}'],
                          path: ['pets', ':limit2'],
                          variable: [
                            {
                              key: 'limit2',
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
                      raw: '{{baseUrl}}/pets/:limit2',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':limit2'],
                      variable: [
                        {
                          key: 'limit2',
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
                          raw: '{{baseUrl}}/pets/:limit2',
                          host: ['{{baseUrl}}'],
                          path: ['pets', ':limit2'],
                          variable: [
                            {
                              key: 'limit2',
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
        '/pets/{limit2}': {
          get: {
            summary: 'List all pets',
            operationId: 'pets - updated',
            tags: ['pets', 'random'],
            parameters: [
              {
                name: 'limit2',
                in: 'path',
                required: true,
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
                in: 'path',
                required: true,
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
