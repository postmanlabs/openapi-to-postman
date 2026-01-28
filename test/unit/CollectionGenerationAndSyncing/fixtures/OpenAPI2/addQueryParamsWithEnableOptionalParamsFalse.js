/*
  Here we are testing the case where the user has used the `enableOptionalParams` flag as `false` and has added query parameters to the request.
  The query parameters should be added to the request in the collection but should be disabled.
*/
module.exports = {
  name: 'should add query params to multiple requests - enableOptionalParameters -> false',
  specificationType: 'OPENAPI:2.0',
  generationOptions: {
    enableOptionalParameters: false
  },
  shouldAssertGenerationAndSyncing: true,
  initialState: {
    spec: {
      swagger: '2.0',
      info: {
        version: '1.0.0',
        title: 'Swagger Petstore',
        license: {
          name: 'MI'
        }
      },
      host: 'petstore.swagger.io',
      basePath: '/v1',
      schemes: ['http'],
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            operationId: 'pets - updated',
            tags: ['pets', 'random'],
            responses: {
              500: {
                description: 'unexpected error',
                schema: {
                  $ref: '#/definitions/Error'
                },
                examples: {
                  'application/json': {
                    message: 'Not Found'
                  }
                }
              }
            },
            produces: ['application/json']
          },
          post: {
            summary: 'Create Pet record',
            operationId: 'pets - updated',
            tags: ['pets'],
            responses: {
              500: {
                description: 'unexpected error',
                schema: {
                  $ref: '#/definitions/Error'
                }
              }
            },
            produces: ['application/json'],
            consumes: ['application/json'],
            parameters: [
              {
                in: 'body',
                name: 'body',
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
            ]
          }
        }
      },
      definitions: {
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
    },
    collection: {
      info: {
        _postman_id: 'f9fed7ee-e36a-4c9e-b3e1-7458124acbaa',
        name: 'query',
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
      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1'
        }
      ]
    }
  },
  finalState: {
    spec: {
      swagger: '2.0',
      info: {
        version: '1.0.0',
        title: 'Swagger Petstore',
        license: {
          name: 'MI'
        }
      },
      host: 'petstore.swagger.io',
      basePath: '/v1',
      schemes: ['http'],
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            operationId: 'pets - updated',
            tags: ['pets', 'random'],
            responses: {
              500: {
                description: 'unexpected error',
                schema: {
                  $ref: '#/definitions/Error'
                },
                examples: {
                  'application/json': {
                    message: 'Not Found'
                  }
                }
              }
            },
            produces: ['application/json'],
            parameters: [
              {
                name: 'limit1',
                in: 'query',
                description: 'How many items to return at one time (max 100)',
                type: 'integer',
                format: 'int32'
              }
            ]
          },
          post: {
            summary: 'Create Pet record',
            operationId: 'pets - updated',
            tags: ['pets'],
            responses: {
              500: {
                description: 'unexpected error',
                schema: {
                  $ref: '#/definitions/Error'
                }
              }
            },
            produces: ['application/json'],
            consumes: ['application/json'],
            parameters: [
              {
                name: 'limit2',
                in: 'query',
                description: 'How many items to return at one time (max 100)',
                type: 'integer',
                format: 'int32'
              },
              {
                in: 'body',
                name: 'body',
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
            ]
          }
        }
      },
      definitions: {
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
    },
    collection: {
      info: {
        _postman_id: '62b54f87-eb90-49f7-960e-585a328bbef6',
        name: 'query',
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
                  path: ['pets'],
                  query: [
                    {
                      key: 'limit1',
                      value: '<integer>',
                      description: 'How many items to return at one time (max 100)',
                      disabled: true
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
                      raw: '{{baseUrl}}/pets',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit1',
                          value: '<integer>',
                          description: 'How many items to return at one time (max 100)',
                          disabled: true
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
                  raw: '{{baseUrl}}/pets',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      key: 'limit2',
                      value: '<integer>',
                      description: 'How many items to return at one time (max 100)',
                      disabled: true
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
                      raw: '{{baseUrl}}/pets',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit2',
                          value: '<integer>',
                          description: 'How many items to return at one time (max 100)',
                          disabled: true
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
    }
  }
};
