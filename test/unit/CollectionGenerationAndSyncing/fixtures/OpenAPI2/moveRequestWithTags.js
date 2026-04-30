/*
  Here an existing request is moved to another folder when the tag value in the spec is changed.
 */
module.exports = {
  name: 'should move a request to correct folder when tag value in the spec is changed',
  specificationType: 'OPENAPI:2.0',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  shouldAssertGenerationAndSyncing: false,
  initialState: {
    collection: {
      info: {
        _postman_id: 'bf8c4627-3af4-448c-9bb1-31bf4d322e5d',
        name: 'move-req-tags',
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
                  raw: '{{baseUrl}}/pets?limit2=<boolean>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      key: 'limit2',
                      value: '<boolean>',
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
                      raw: '{{baseUrl}}/pets?limit2=<boolean>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit2',
                          value: '<boolean>',
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
            operationId: 'pets',
            tags: ['pets', 'random'],
            responses: {
              500: {
                description: 'unexpected error',
                schema: {
                  $ref: '#/definitions/Error'
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
                type: 'boolean'
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
        _postman_id: 'bf8c4627-3af4-448c-9bb1-31bf4d322e5d',
        name: 'move-req-tags',
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
                  raw: '{{baseUrl}}/pets?limit2=<boolean>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      key: 'limit2',
                      value: '<boolean>',
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
                      raw: '{{baseUrl}}/pets?limit2=<boolean>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit2',
                          value: '<boolean>',
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
        },
        {
          name: 'new-folder',
          item: [
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
                  raw: '{{baseUrl}}/pets?limit2=<boolean>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      key: 'limit2',
                      value: '<boolean>',
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
                      raw: '{{baseUrl}}/pets?limit2=<boolean>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          key: 'limit2',
                          value: '<boolean>',
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
            operationId: 'pets',
            tags: ['pets', 'random'],
            responses: {
              500: {
                description: 'unexpected error',
                schema: {
                  $ref: '#/definitions/Error'
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
            tags: ['new-folder'],
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
                type: 'boolean'
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
