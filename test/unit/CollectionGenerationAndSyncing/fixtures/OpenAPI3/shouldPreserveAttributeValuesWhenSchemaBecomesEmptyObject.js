module.exports = {
  name: 'should preserve values of keys when schema becomes empty object during collection syncing',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {},
  shouldGenerateCollection: false,
  initialState: {
    collection: {
      info: {
        name: 'Preference Values Test',
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
                  name: 'preferences',
                  item: [
                    {
                      name: 'Update user preferences',
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
                          raw: '{\n  "preference": "dark-mode"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/users/:userId/preferences',
                          host: ['{{baseUrl}}'],
                          path: ['users', ':userId', 'preferences'],
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
                          name: 'User preferences updated successfully',
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
                              raw: '{\n  "preference": "dark-mode"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            },
                            url: {
                              raw: '{{baseUrl}}/users/:userId/preferences',
                              host: ['{{baseUrl}}'],
                              path: ['users', ':userId', 'preferences'],
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
                          body: '{\n  "preference": "dark-mode",\n  "message": "Preferences updated successfully"\n}'
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
      openapi: '3.0.0',
      servers: [
        {
          url: '{{baseUrl}}'
        }
      ],
      info: {
        title: 'Preference Values Test',
        version: '1.0.0'
      },
      paths: {
        '/users/{userId}/preferences': {
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
            summary: 'Update user preferences',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      preference: {
                        type: 'object'
                      }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'User preferences updated successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        preference: {
                          type: 'object'
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
        name: 'Preference Values Test',
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
                  name: 'preferences',
                  item: [
                    {
                      name: 'Update user preferences',
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
                          raw: '{\n  "preference": "dark-mode"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/users/:userId/preferences',
                          host: ['{{baseUrl}}'],
                          path: ['users', ':userId', 'preferences'],
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
                          name: 'User preferences updated successfully',
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
                              raw: '{\n  "preference": "dark-mode"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            },
                            url: {
                              raw: '{{baseUrl}}/users/:userId/preferences',
                              host: ['{{baseUrl}}'],
                              path: ['users', ':userId', 'preferences'],
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
                          body: '{\n  "preference": "dark-mode",\n  "message": "Preferences updated successfully"\n}'
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
