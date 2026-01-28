module.exports = {
  name: 'should update values when schema changes from string to object with properties during collection syncing',
  specificationType: 'OPENAPI:3.1',
  generationOptions: {},
  shouldGenerateCollection: false,
  initialState: {
    collection: {
      info: {
        name: 'Schema Update Test',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: '{userId}',
              item: [
                {
                  name: 'settings',
                  item: [
                    {
                      name: 'Update user settings',
                      request: {
                        method: 'PUT',
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
                          raw: '{\n  "theme": "dark-mode"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/users/:userId/settings',
                          host: ['{{baseUrl}}'],
                          path: ['users', ':userId', 'settings'],
                          variable: [
                            {
                              key: 'userId',
                              value: 'user123',
                              description: 'The unique identifier of the user'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          name: 'User settings updated successfully',
                          originalRequest: {
                            method: 'PUT',
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
                              raw: '{\n  "theme": "dark-mode"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            },
                            url: {
                              raw: '{{baseUrl}}/users/:userId/settings',
                              host: ['{{baseUrl}}'],
                              path: ['users', ':userId', 'settings'],
                              variable: [
                                {
                                  key: 'userId',
                                  value: 'user123'
                                }
                              ]
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
                          body: '{\n  "theme": "dark-mode",\n  "message": "Settings updated successfully"\n}'
                        }
                      ]
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
          value: '{{baseUrl}}',
          type: 'any'
        }
      ]
    }
  },
  finalState: {
    spec: {
      openapi: '3.1.0',
      servers: [
        {
          url: '{{baseUrl}}'
        }
      ],
      info: {
        title: 'Schema Update Test',
        version: '1.0.0'
      },
      paths: {
        '/users/{userId}/settings': {
          parameters: [
            {
              name: 'userId',
              description: 'The unique identifier of the user',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          put: {
            summary: 'Update user settings',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      theme: {
                        type: 'object',
                        properties: {
                          mode: {
                            type: 'string',
                            enum: ['light', 'dark'],
                            default: 'light'
                          },
                          accent: {
                            type: 'string',
                            default: 'blue'
                          }
                        },
                        required: ['mode']
                      }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'User settings updated successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        theme: {
                          type: 'object',
                          properties: {
                            mode: {
                              type: 'string',
                              enum: ['light', 'dark'],
                              default: 'light'
                            },
                            accent: {
                              type: 'string',
                              default: 'blue'
                            }
                          },
                          required: ['mode']
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
          }
        }
      },
      components: {
        schemas: {}
      }
    },
    collection: {
      info: {
        name: 'Schema Update Test',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: '{userId}',
              item: [
                {
                  name: 'settings',
                  item: [
                    {
                      name: 'Update user settings',
                      request: {
                        method: 'PUT',
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
                          raw: '{\n  "theme": {\n    "mode": "light",\n    "accent": "blue"\n  }\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/users/:userId/settings',
                          host: ['{{baseUrl}}'],
                          path: ['users', ':userId', 'settings'],
                          variable: [
                            {
                              key: 'userId',
                              value: 'user123',
                              description: 'The unique identifier of the user'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          name: 'User settings updated successfully',
                          originalRequest: {
                            method: 'PUT',
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
                              raw: '{\n  "theme": {\n    "mode": "light",\n    "accent": "blue"\n  }\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            },
                            url: {
                              raw: '{{baseUrl}}/users/:userId/settings',
                              host: ['{{baseUrl}}'],
                              path: ['users', ':userId', 'settings'],
                              variable: [
                                {
                                  key: 'userId',
                                  value: 'user123',
                                  description: 'The unique identifier of the user'
                                }
                              ]
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
                          body: '{\n  "theme": {\n    "mode": "light",\n    "accent": "blue"\n  },\n  "message": "Settings updated successfully"\n}'
                        }
                      ]
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
          value: '{{baseUrl}}',
          type: 'any'
        }
      ]
    }
  }
};
