/*
 * Tests deeply nested folder structures in OpenAPI specs.
 * Initial: Components and paths in deeply nested directories
 * Final: Verifies all nested references resolve correctly
 */

module.exports = {
  name: 'should handle deeply nested folder structures with references',
  specificationType: 'OPENAPI:3.1',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing deeply nested folder structures with references',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: 'Get user profile',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/users/:userId/profile',
                  host: ['{{baseUrl}}'],
                  path: ['users', ':userId', 'profile'],
                  variable: [
                    {
                      key: 'userId',
                      value: '<long>',
                      description: 'The id of the user'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'User profile response',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/users/:userId/profile',
                      host: ['{{baseUrl}}'],
                      path: ['users', ':userId', 'profile'],
                      variable: [
                        {
                          key: 'userId',
                          value: '<long>',
                          description: 'The id of the user'
                        }
                      ]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/json'
                    }
                  ],
                  cookie: [],
                  body: '{\n  "id": "<long>",\n  "username": "<string>",\n  "address": {\n    "street": "<string>",\n    "city": "<string>",\n    "country": "<string>"\n  }\n}'
                }
              ]
            }
          ]
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: '/',
          type: 'any'
        }
      ]
    },
    spec: {
      files: [
        {
          path: 'openapi.yaml',
          type: 'ROOT',
          content: {
            openapi: '3.1.0',
            info: {
              version: '1.0.0',
              title: 'Nested Structure Test API',
              description: 'Testing deeply nested folder structures with references'
            },
            paths: {
              '/users/{userId}/profile': {
                get: {
                  summary: 'Get user profile',
                  operationId: 'getUserProfile',
                  tags: ['users'],
                  parameters: [
                    {
                      name: 'userId',
                      in: 'path',
                      required: true,
                      description: 'The id of the user',
                      schema: {
                        type: 'integer',
                        format: 'int64'
                      }
                    }
                  ],
                  responses: {
                    200: {
                      description: 'User profile response',
                      content: {
                        'application/json': {
                          schema: {
                            $ref: './components/schemas/users/user.yaml'
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
                User: {
                  $ref: './components/schemas/users/user.yaml'
                },
                Address: {
                  $ref: './components/schemas/common/address.yaml'
                }
              }
            }
          }
        },
        {
          path: 'components/schemas/users/user.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            required: ['id', 'username'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              username: {
                type: 'string'
              },
              address: {
                $ref: '../common/address.yaml'
              }
            }
          }
        },
        {
          path: 'components/schemas/common/address.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            properties: {
              street: {
                type: 'string'
              },
              city: {
                type: 'string'
              },
              country: {
                type: 'string'
              }
            }
          }
        }
      ]
    }
  },
  finalState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing deeply nested folder structures with references',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: 'Get user profile',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/users/:userId/profile',
                  host: ['{{baseUrl}}'],
                  path: ['users', ':userId', 'profile'],
                  variable: [
                    {
                      key: 'userId',
                      value: '<long>',
                      description: 'The id of the user'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'User profile response',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/users/:userId/profile',
                      host: ['{{baseUrl}}'],
                      path: ['users', ':userId', 'profile'],
                      variable: [
                        {
                          key: 'userId',
                          value: '<long>',
                          description: 'The id of the user'
                        }
                      ]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/json'
                    }
                  ],
                  cookie: [],
                  body: '{\n  "id": "<long>",\n  "username": "<string>",\n  "address": {\n    "street": "<string>",\n    "city": "<string>",\n    "country": "<string>"\n  }\n}'
                }
              ]
            }
          ]
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: '/',
          type: 'any'
        }
      ]
    },
    spec: {
      files: [
        {
          path: 'openapi.yaml',
          type: 'ROOT',
          content: {
            openapi: '3.1.0',
            info: {
              version: '1.0.0',
              title: 'Nested Structure Test API',
              description: 'Testing deeply nested folder structures with references'
            },
            paths: {
              '/users/{userId}/profile': {
                get: {
                  summary: 'Get user profile',
                  operationId: 'getUserProfile',
                  tags: ['users'],
                  parameters: [
                    {
                      name: 'userId',
                      in: 'path',
                      required: true,
                      description: 'The id of the user',
                      schema: {
                        type: 'integer',
                        format: 'int64'
                      }
                    }
                  ],
                  responses: {
                    200: {
                      description: 'User profile response',
                      content: {
                        'application/json': {
                          schema: {
                            $ref: './components/schemas/users/user.yaml'
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
                User: {
                  $ref: './components/schemas/users/user.yaml'
                },
                Address: {
                  $ref: './components/schemas/common/address.yaml'
                }
              }
            }
          }
        },
        {
          path: 'components/schemas/users/user.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            required: ['id', 'username'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              username: {
                type: 'string'
              },
              address: {
                $ref: '../common/address.yaml'
              }
            }
          }
        },
        {
          path: 'components/schemas/common/address.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            properties: {
              street: {
                type: 'string'
              },
              city: {
                type: 'string'
              },
              country: {
                type: 'string'
              }
            }
          }
        }
      ]
    }
  }
};
