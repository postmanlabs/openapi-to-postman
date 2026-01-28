/*
  Here we are testing the case where the user has renamed 'limit1' request header to 'limit2' in the spec.
  The request header should be renamed in the request in the collection.
*/
module.exports = {
  name: 'should rename request header',
  specificationType: 'OPENAPI:2.0',
  generationOptions: {},
  shouldAssertGenerationAndSyncing: true,
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
              name: 'List all pets',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'limit1',
                    value: '<integer>',
                    description: 'How many items to return at one time (max 100)'
                  },
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
                        key: 'limit1',
                        value: '<integer>',
                        description: 'How many items to return at one time (max 100)'
                      },
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
                    key: 'limit1',
                    value: '<integer>',
                    description: 'How many items to return at one time (max 100)'
                  },
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
                        key: 'limit1',
                        value: '<integer>',
                        description: 'How many items to return at one time (max 100)'
                      },
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
    },
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
                in: 'header',
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
                name: 'limit1',
                in: 'header',
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
              name: 'List all pets',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'limit2',
                    value: '<integer>',
                    description: 'How many items to return at one time (max 100)'
                  },
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
                        key: 'limit2',
                        value: '<integer>',
                        description: 'How many items to return at one time (max 100)'
                      },
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
                    key: 'limit2',
                    value: '<integer>',
                    description: 'How many items to return at one time (max 100)'
                  },
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
                        key: 'limit2',
                        value: '<integer>',
                        description: 'How many items to return at one time (max 100)'
                      },
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
    },
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
                name: 'limit2',
                in: 'header',
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
                in: 'header',
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
    }
  }
};
