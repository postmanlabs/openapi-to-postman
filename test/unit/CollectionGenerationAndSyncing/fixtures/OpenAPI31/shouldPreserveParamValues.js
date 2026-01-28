module.exports = {
  name: 'should preserve parameter values while syncing collection with spec',
  specificationType: 'OPENAPI:3.1',
  generationOptions: {
    folderStrategy: 'Paths'
  },
  shouldGenerateCollection: false,
  initialState: {
    collection: {
      info: {
        name: 'Preserve Param Values',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'spacecrafts',
          item: [
            {
              name: '{spacecraftId}',
              item: [
                {
                  name: 'Read a spacecraft',
                  protocolProfileBehavior: {
                    disableBodyPruning: true
                  },
                  request: {
                    method: 'GET',
                    header: [
                      {
                        key: 'header1',
                        value: 'abcd',
                        description: 'Header 1'
                      },
                      {
                        key: 'header2',
                        value: 'xyz',
                        description: 'Header 2'
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
                      raw: '{\n  "key1": "value1",\n  "key2": "value2"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam2=xyz',
                      host: ['{{baseUrl}}'],
                      path: ['spacecrafts', ':spacecraftId'],
                      query: [
                        {
                          key: 'qparam1',
                          value: 'abcd',
                          description: 'Query Parameter 1'
                        },
                        {
                          key: 'qparam2',
                          value: 'xyz',
                          description: 'Query Parameter 2'
                        }
                      ],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: 'abc1-def2',
                          description: 'The unique identifier of the spacecraft'
                        }
                      ]
                    }
                  },
                  response: [
                    {
                      name: 'The spacecraft corresponding to the provided `spacecraftId`',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'header1',
                            value: 'abcd',
                            description: 'Header 1'
                          },
                          {
                            key: 'header2',
                            value: 'xyz',
                            description: 'Header 2'
                          },
                          {
                            key: 'Content-Type',
                            value: 'application/json'
                          },
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            key: 'X-Api-Key',
                            value: '<API Key>',
                            description: 'Added as a part of security scheme: apikey'
                          }
                        ],
                        body: {
                          mode: 'raw',
                          raw: '{\n  "key1": "value1",\n  "key2": "value2"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam2=xyz',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          query: [
                            {
                              key: 'qparam1',
                              value: 'abcd',
                              description: 'Query Parameter 1'
                            },
                            {
                              key: 'qparam2',
                              value: 'xyz',
                              description: 'Query Parameter 2'
                            }
                          ],
                          variable: [
                            {
                              key: 'spacecraftId',
                              value: 'abc1-def2',
                              description: 'The unique identifier of the spacecraft'
                            }
                          ]
                        }
                      },
                      status: 'OK',
                      code: 200,
                      _postman_previewlanguage: 'Text',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        },
                        {
                          key: 'res-header1',
                          value: 'abcd',
                          description: {
                            content: 'Header 1',
                            type: 'text/plain'
                          }
                        },
                        {
                          key: 'res-header2',
                          value: 'xyz',
                          description: {
                            content: 'Header 2',
                            type: 'text/plain'
                          }
                        }
                      ],
                      cookie: [],
                      body: '{\n  "id": "abcd-1234",\n  "name": "randomName",\n  "type": "satellite",\n  "description": "Some description"\n}'
                    },
                    {
                      name: 'No spacecraft found for the provided `spacecraftId`',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'header1',
                            value: 'abcd',
                            description: 'Header 1'
                          },
                          {
                            key: 'header2',
                            value: 'xyz',
                            description: 'Header 2'
                          },
                          {
                            key: 'Content-Type',
                            value: 'application/json'
                          },
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            key: 'X-Api-Key',
                            value: '<API Key>',
                            description: 'Added as a part of security scheme: apikey'
                          }
                        ],
                        body: {
                          mode: 'raw',
                          raw: '{\n  "key1": "value1",\n  "key2": "value2"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam2=xyz',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          query: [
                            {
                              key: 'qparam1',
                              value: 'abcd',
                              description: 'Query Parameter 1'
                            },
                            {
                              key: 'qparam2',
                              value: 'xyz',
                              description: 'Query Parameter 2'
                            }
                          ],
                          variable: [
                            {
                              key: 'spacecraftId',
                              value: 'abc1-def2'
                            }
                          ]
                        }
                      },
                      status: 'Not Found',
                      code: 404,
                      _postman_previewlanguage: 'Text',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "Not Found"\n}'
                    },
                    {
                      name: 'Unexpected error',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'header1',
                            value: 'abcd',
                            description: 'Header 1'
                          },
                          {
                            key: 'header2',
                            value: 'xyz',
                            description: 'Header 2'
                          },
                          {
                            key: 'Content-Type',
                            value: 'application/json'
                          },
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            key: 'X-Api-Key',
                            value: '<API Key>',
                            description: 'Added as a part of security scheme: apikey'
                          }
                        ],
                        body: {
                          mode: 'raw',
                          raw: '{\n  "key1": "value1",\n  "key2": "value2"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam2=xyz',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          query: [
                            {
                              key: 'qparam1',
                              value: 'abcd',
                              description: 'Query Parameter 1'
                            },
                            {
                              key: 'qparam2',
                              value: 'xyz',
                              description: 'Query Parameter 2'
                            }
                          ],
                          variable: [
                            {
                              key: 'spacecraftId',
                              value: 'abc1-def2'
                            }
                          ]
                        }
                      },
                      status: 'Internal Server Error',
                      code: 500,
                      _postman_previewlanguage: 'Text',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "Something went wrong"\n}'
                    }
                  ]
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
        title: 'Preserve Param Values',
        version: '1.0.0'
      },
      paths: {
        '/spacecrafts/{spacecraftId}': {
          parameters: [
            {
              name: 'spacecraftId',
              description: 'The unique identifier of the spacecraft',
              in: 'path',
              required: true,
              schema: {
                $ref: '#/components/schemas/SpacecraftId'
              }
            }
          ],
          get: {
            summary: 'Read a spacecraft',
            responses: {
              200: {
                headers: {
                  'res-header1': {
                    description: 'Header 1',
                    schema: {
                      type: 'string'
                    }
                  },
                  'res-header3': {
                    description: 'Header 3',
                    schema: {
                      type: 'string'
                    }
                  }
                },
                description: 'The spacecraft corresponding to the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Spacecraft'
                    }
                  }
                }
              },
              404: {
                description: 'No spacecraft found for the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              },
              500: {
                description: 'Unexpected error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              }
            },
            parameters: [
              {
                name: 'qparam1',
                in: 'query',
                description: 'Query Parameter 1',
                schema: {
                  type: 'string'
                }
              },
              {
                name: 'qparam3',
                in: 'query',
                description: 'Query Parameter 3',
                schema: {
                  type: 'string'
                }
              },
              {
                name: 'header1',
                in: 'header',
                description: 'Header 1',
                schema: {
                  type: 'string'
                }
              },
              {
                name: 'header3',
                in: 'header',
                description: 'Header 3',
                schema: {
                  type: 'string'
                }
              }
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      key1: {
                        type: 'string'
                      },
                      key3: {
                        type: 'string'
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
        schemas: {
          SpacecraftId: {
            description: 'The unique identifier of a spacecraft',
            type: 'string'
          },
          Spacecraft: {
            type: 'object',
            required: ['id', 'name', 'type'],
            properties: {
              id: {
                $ref: '#/components/schemas/SpacecraftId'
              },
              name: {
                type: 'string'
              },
              type: {
                type: 'string',
                enum: ['capsule', 'probe', 'satellite', 'spaceplane', 'station']
              },
              summary: {
                type: 'string'
              }
            }
          },
          Error: {
            type: 'object',
            required: ['message'],
            properties: {
              message: {
                description: 'A human readable error message',
                type: 'string'
              }
            }
          }
        },
        securitySchemes: {
          ApiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Api-Key'
          }
        }
      },
      security: [
        {
          ApiKey: []
        }
      ]
    },
    collection: {
      info: {
        name: 'Preserve Param Values',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'spacecrafts',
          item: [
            {
              name: '{spacecraftId}',
              item: [
                {
                  name: 'Read a spacecraft',
                  protocolProfileBehavior: {
                    disableBodyPruning: true
                  },
                  request: {
                    method: 'GET',
                    header: [
                      {
                        key: 'header1',
                        value: 'abcd',
                        description: 'Header 1'
                      },
                      {
                        key: 'header3',
                        value: '<string>',
                        description: 'Header 3'
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
                      raw: '{\n  "key1": "value1",\n  "key3": "<string>"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam3=<string>',
                      host: ['{{baseUrl}}'],
                      path: ['spacecrafts', ':spacecraftId'],
                      query: [
                        {
                          key: 'qparam1',
                          value: 'abcd',
                          description: 'Query Parameter 1'
                        },
                        {
                          key: 'qparam3',
                          value: '<string>',
                          description: 'Query Parameter 3'
                        }
                      ],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: 'abc1-def2',
                          description: 'The unique identifier of the spacecraft'
                        }
                      ]
                    }
                  },
                  response: [
                    {
                      name: 'The spacecraft corresponding to the provided `spacecraftId`',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'header1',
                            value: 'abcd',
                            description: 'Header 1'
                          },
                          {
                            key: 'header3',
                            value: '<string>',
                            description: 'Header 3'
                          },
                          {
                            key: 'Content-Type',
                            value: 'application/json'
                          },
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            key: 'X-Api-Key',
                            value: '<API Key>',
                            description: 'Added as a part of security scheme: apikey'
                          }
                        ],
                        body: {
                          mode: 'raw',
                          raw: '{\n  "key1": "value1",\n  "key3": "<string>"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam3=<string>',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          query: [
                            {
                              key: 'qparam1',
                              value: 'abcd',
                              description: 'Query Parameter 1'
                            },
                            {
                              key: 'qparam3',
                              value: '<string>',
                              description: 'Query Parameter 3'
                            }
                          ],
                          variable: [
                            {
                              key: 'spacecraftId',
                              value: 'abc1-def2',
                              description: 'The unique identifier of the spacecraft'
                            }
                          ]
                        }
                      },
                      status: 'OK',
                      code: 200,
                      _postman_previewlanguage: 'Text',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        },
                        {
                          key: 'res-header1',
                          value: 'abcd',
                          description: {
                            content: 'Header 1',
                            type: 'text/plain'
                          }
                        },
                        {
                          disabled: false,
                          key: 'res-header3',
                          value: '<string>',
                          description: {
                            content: 'Header 3',
                            type: 'text/plain'
                          }
                        }
                      ],
                      cookie: [],
                      body: '{\n  "id": "abcd-1234",\n  "name": "randomName",\n  "type": "satellite",\n  "summary": "<string>"\n}'
                    },
                    {
                      name: 'No spacecraft found for the provided `spacecraftId`',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'header1',
                            value: 'abcd',
                            description: 'Header 1'
                          },
                          {
                            key: 'header3',
                            value: '<string>',
                            description: 'Header 3'
                          },
                          {
                            key: 'Content-Type',
                            value: 'application/json'
                          },
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            key: 'X-Api-Key',
                            value: '<API Key>',
                            description: 'Added as a part of security scheme: apikey'
                          }
                        ],
                        body: {
                          mode: 'raw',
                          raw: '{\n  "key1": "value1",\n  "key3": "<string>"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam3=<string>',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          query: [
                            {
                              key: 'qparam1',
                              value: 'abcd',
                              description: 'Query Parameter 1'
                            },
                            {
                              key: 'qparam3',
                              value: '<string>',
                              description: 'Query Parameter 3'
                            }
                          ],
                          variable: [
                            {
                              key: 'spacecraftId',
                              description: 'The unique identifier of the spacecraft',
                              value: 'abc1-def2'
                            }
                          ]
                        }
                      },
                      status: 'Not Found',
                      code: 404,
                      _postman_previewlanguage: 'Text',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "Not Found"\n}'
                    },
                    {
                      name: 'Unexpected error',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'header1',
                            value: 'abcd',
                            description: 'Header 1'
                          },
                          {
                            key: 'header3',
                            value: '<string>',
                            description: 'Header 3'
                          },
                          {
                            key: 'Content-Type',
                            value: 'application/json'
                          },
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            key: 'X-Api-Key',
                            value: '<API Key>',
                            description: 'Added as a part of security scheme: apikey'
                          }
                        ],
                        body: {
                          mode: 'raw',
                          raw: '{\n  "key1": "value1",\n  "key3": "<string>"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId?qparam1=abcd&qparam3=<string>',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          query: [
                            {
                              key: 'qparam1',
                              value: 'abcd',
                              description: 'Query Parameter 1'
                            },
                            {
                              key: 'qparam3',
                              value: '<string>',
                              description: 'Query Parameter 3'
                            }
                          ],
                          variable: [
                            {
                              key: 'spacecraftId',
                              description: 'The unique identifier of the spacecraft',
                              value: 'abc1-def2'
                            }
                          ]
                        }
                      },
                      status: 'Internal Server Error',
                      code: 500,
                      _postman_previewlanguage: 'Text',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "Something went wrong"\n}'
                    }
                  ]
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
          value: '{{baseUrl}}',
          type: 'any'
        }
      ]
    }
  }
};
