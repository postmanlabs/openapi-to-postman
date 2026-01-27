module.exports = {
  name: 'should not sync examples when syncExamples option is false',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    parametersResolution: 'Example'
  },
  syncOptions: {
    syncExamples: false
  },
  shouldGenerateCollection: false,
  initialState: {
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'SyncOptions Test API',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'https://api.example.com'
        }
      ],
      paths: {
        '/users/{id}': {
          post: {
            summary: 'Get user by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                  type: 'string'
                },
                example: 'user123'
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  example: {
                    requestId: 'req-1',
                    info: 'Initial request body example'
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'User found',
                content: {
                  'application/json': {
                    example: {
                      id: 'user123',
                      name: 'John Doe'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    collection: {
      info: {
        _postman_id: '44bed90c-e3f1-45c6-a908-3fdcee92ff8f',
        name: 'Sync options test',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: '{id}',
              item: [
                {
                  name: 'Get user by ID',
                  id: 'dfba2353-7788-4cb2-8a41-06af5416cdbe',
                  protocolProfileBehavior: {
                    disableBodyPruning: true
                  },
                  request: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/users/:id',
                      host: ['{{baseUrl}}'],
                      path: ['users', ':id'],
                      variable: [
                        {
                          id: '47d45f58-fbf2-40f3-9fa0-85af03d5f87b',
                          key: 'id',
                          value: 'user123'
                        }
                      ]
                    },
                    body: {
                      mode: 'raw',
                      raw: '{\n  "requestId": "req-1",\n  "info": "Initial request body example"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    }
                  },
                  response: [
                    {
                      id: '4244ec56-8671-4a75-b839-6ea1822e60df',
                      name: 'User found',
                      originalRequest: {
                        method: 'POST',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        url: {
                          raw: '{{baseUrl}}/users/:id',
                          host: ['{{baseUrl}}'],
                          path: ['users', ':id'],
                          variable: [
                            {
                              key: 'id',
                              value: 'user123'
                            }
                          ]
                        },
                        body: {
                          mode: 'raw',
                          raw: '{\n  "requestId": "req-1",\n  "info": "Initial request body example"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        }
                      },
                      status: 'OK',
                      code: 200,
                      _postman_previewlanguage: 'json',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      responseTime: null,
                      body: '{\n  "id": "user123",\n  "name": "John Doe"\n}'
                    }
                  ]
                }
              ],
              id: 'b3cf64c3-2f5c-4775-903c-d76e6e07ee2e'
            }
          ],
          id: 'e4f4c657-d786-4660-9217-8257866dd9b3'
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://api.example.com'
        }
      ]
    }
  },
  finalState: {
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'SyncOptions Test API',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'https://api.example.com'
        }
      ],
      paths: {
        '/users/{id}': {
          post: {
            summary: 'Get user by ID',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: {
                  type: 'string'
                },
                example: 'newuser456'
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  example: {
                    requestId: 'req-1',
                    info: 'final request body example'
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'User found',
                content: {
                  'application/json': {
                    example: {
                      id: 'newuser456',
                      name: 'Alice Smith'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    collection: {
      info: {
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: '{id}',
              item: [
                {
                  name: 'Get user by ID',
                  event: undefined,
                  request: {
                    auth: undefined,
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
                      raw: '{\n  "requestId": "req-1",\n  "info": "Initial request body example"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/users/:id',
                      protocol: undefined,
                      auth: undefined,
                      host: ['{{baseUrl}}'],
                      port: undefined,
                      path: ['users', ':id'],
                      query: undefined,
                      hash: undefined,
                      variable: [
                        {
                          key: 'id',
                          value: 'user123'
                        }
                      ]
                    }
                  },
                  response: [
                    {
                      name: 'User found',
                      originalRequest: {
                        auth: undefined,
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
                          raw: '{\n  "requestId": "req-1",\n  "info": "Initial request body example"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/users/:id',
                          protocol: undefined,
                          auth: undefined,
                          host: ['{{baseUrl}}'],
                          port: undefined,
                          path: ['users', ':id'],
                          query: undefined,
                          hash: undefined,
                          variable: [
                            {
                              key: 'id',
                              value: 'user123'
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
                      responseTime: null,
                      body: `{
  "id": "user123",
  "name": "John Doe"
}`
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
          value: 'https://api.example.com',
          type: 'any'
        }
      ]
    }
  }
};
