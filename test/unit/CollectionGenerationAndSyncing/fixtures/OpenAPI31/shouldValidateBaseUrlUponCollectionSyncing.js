module.exports = {
  name: 'should sync base url from spec upon collection syncing',
  specificationType: 'OPENAPI:3.1',
  test: true,
  generationOptions: {
    folderStrategy: 'Tags'
  },
  shouldAssertGenerationAndSyncing: false,
  initialState: {
    collection: {
      item: [
        {
          name: 'spacecrafts',
          item: [
            {
              name: '{spacecraftId}',
              item: [
                {
                  name: 'Read a spacecraft',
                  request: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecrafts/:spacecraftId?uuid={{test-uuid}}',
                      host: ['{{baseUrl}}'],
                      path: ['spacecrafts', ':spacecraftId'],
                      query: [
                        {
                          key: 'uuid',
                          value: '{{test-uuid}}'
                        }
                      ],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: '<string>',
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
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            key: 'X-Api-Key',
                            value: '<API Key>',
                            description: 'Added as a part of security scheme: apikey'
                          }
                        ],
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          query: [
                            {
                              key: 'uuid',
                              value: '',
                              disabled: true
                            }
                          ],
                          variable: [
                            {
                              key: 'spacecraftId',
                              value: '<string>',
                              description: 'The unique identifier of the spacecraft'
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
                      body: '{\n  "id": "string",\n  "name": "string",\n  "type": "capsule",\n  "description": "strin"\n}'
                    },
                    {
                      name: 'Unexpected error',
                      originalRequest: {
                        method: 'GET',
                        header: [
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
                        url: {
                          raw: '{{baseUrl}}/spacecrafts/:spacecraftId',
                          host: ['{{baseUrl}}'],
                          path: ['spacecrafts', ':spacecraftId'],
                          variable: [
                            {
                              key: 'spacecraftId',
                              value: '<string>',
                              description: 'The unique identifier of the spacecraft'
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
                      body: '{\n  "message": "string"\n}'
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
      event: [],
      variable: [
        {
          key: 'baseUrl',
          value: 'example.com/v1'
        },
        {
          key: 'test-uuid',
          value: '1a2b3c-4d5e-6f7g8h',
          type: 'string'
        }
      ]
    },
    spec: {
      openapi: '3.1.0',
      servers: [
        {
          url: 'example.com/v2'
        }
      ],
      info: {
        contact: {
          name: 'Ayush'
        },
        version: '1.0.0',
        title: 'Sample API',
        description: 'Buy or rent spacecrafts'
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
                description: 'The spacecraft corresponding to the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Spacecraft'
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
                enum: ['probe']
              },
              description: {
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
    }
  },
  finalState: {
    collection: {
      item: [
        {
          id: 'afb3ce63-d13b-461e-8a67-f4df25f59613',
          name: 'spacecrafts',
          item: [
            {
              id: '586597ea-950e-4a25-9374-6c1d86d8287c',
              name: '{spacecraftId}',
              item: [
                {
                  id: 'c307659b-065f-4409-b4dd-8074e768914c',
                  name: 'Read a spacecraft',
                  request: {
                    url: {
                      path: ['spacecrafts', ':spacecraftId'],
                      host: ['{{baseUrl}}'],
                      query: [
                        {
                          key: 'uuid',
                          value: '{{test-uuid}}'
                        }
                      ],
                      variable: [
                        {
                          description: {
                            content: 'The unique identifier of the spacecraft',
                            type: 'text/plain'
                          },
                          type: 'any',
                          value: '<string>',
                          key: 'spacecraftId'
                        }
                      ]
                    },
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    method: 'GET',
                    body: {}
                  },
                  response: [
                    {
                      _: {
                        postman_previewlanguage: 'json',
                        postman_previewtype: 'html'
                      },
                      id: 'e74d1804-1437-4595-a562-da29ef7193ef',
                      name: 'The spacecraft corresponding to the provided `spacecraftId`',
                      originalRequest: {
                        url: {
                          path: ['spacecrafts', ':spacecraftId'],
                          host: ['{{baseUrl}}'],
                          query: [
                            {
                              disabled: true,
                              key: 'uuid',
                              value: ''
                            }
                          ],
                          variable: [
                            {
                              type: 'any',
                              value: '<string>',
                              description: 'The unique identifier of the spacecraft',
                              key: 'spacecraftId'
                            }
                          ]
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: {
                              content: 'Added as a part of security scheme: apikey',
                              type: 'text/plain'
                            },
                            key: 'X-Api-Key',
                            value: '<API Key>'
                          }
                        ],
                        method: 'GET',
                        body: {}
                      },
                      status: 'OK',
                      code: 200,
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      body: '{\n  "id": "string",\n  "name": "string",\n  "type": "capsule",\n  "description": "strin"\n}',
                      cookie: []
                    },
                    {
                      _: {
                        postman_previewlanguage: 'json',
                        postman_previewtype: 'html'
                      },
                      id: '17cb186a-7ccb-4b91-83ea-1ebc5cf53152',
                      name: 'Unexpected error',
                      originalRequest: {
                        url: {
                          path: ['spacecrafts', ':spacecraftId'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: [
                            {
                              type: 'any',
                              key: 'spacecraftId',
                              value: '<string>',
                              description: 'The unique identifier of the spacecraft'
                            }
                          ]
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: {
                              content: 'Added as a part of security scheme: apikey',
                              type: 'text/plain'
                            },
                            key: 'X-Api-Key',
                            value: '<API Key>'
                          }
                        ],
                        method: 'GET',
                        body: {}
                      },
                      status: 'Internal Server Error',
                      code: 500,
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      body: '{\n  "message": "string"\n}',
                      cookie: []
                    }
                  ],
                  event: []
                }
              ],
              event: []
            }
          ],
          event: []
        },
        {
          id: 'c83f39f3-50a2-46b4-9acb-539554d52762',
          name: 'Read a spacecraft',
          request: {
            name: 'Read a spacecraft',
            description: {
              type: 'text/plain'
            },
            url: {
              path: ['spacecrafts', ':spacecraftId'],
              host: ['{{baseUrl}}'],
              query: [],
              variable: [
                {
                  disabled: false,
                  description: {
                    content: 'The unique identifier of the spacecraft',
                    type: 'text/plain'
                  },
                  type: 'any',
                  value: '<string>',
                  key: 'spacecraftId'
                }
              ]
            },
            header: [
              {
                key: 'Accept',
                value: 'application/json'
              }
            ],
            method: 'GET',
            body: {}
          },
          response: [
            {
              _: {
                postman_previewlanguage: 'json'
              },
              id: '81daeee7-783f-4d5b-abe4-d0de9c0538ed',
              name: 'The spacecraft corresponding to the provided `spacecraftId`',
              originalRequest: {
                url: {
                  path: ['spacecrafts', ':spacecraftId'],
                  host: ['{{baseUrl}}'],
                  query: [],
                  variable: [
                    {
                      key: 'spacecraftId',
                      value: '<string>',
                      description: 'The unique identifier of the spacecraft'
                    }
                  ]
                },
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  },
                  {
                    description: {
                      content: 'Added as a part of security scheme: apikey',
                      type: 'text/plain'
                    },
                    key: 'X-Api-Key',
                    value: '<API Key>'
                  }
                ],
                method: 'GET',
                body: {}
              },
              status: 'OK',
              code: 200,
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: '{\n  "id": "<string>",\n  "name": "<string>",\n  "type": "probe",\n  "description": "<string>"\n}',
              cookie: []
            },
            {
              _: {
                postman_previewlanguage: 'json'
              },
              id: '4a7f2271-06e6-44a4-94fe-77513770b1ef',
              name: 'Unexpected error',
              originalRequest: {
                url: {
                  path: ['spacecrafts', ':spacecraftId'],
                  host: ['{{baseUrl}}'],
                  query: [],
                  variable: [
                    {
                      key: 'spacecraftId',
                      value: '<string>',
                      description: 'The unique identifier of the spacecraft'
                    }
                  ]
                },
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  },
                  {
                    description: {
                      content: 'Added as a part of security scheme: apikey',
                      type: 'text/plain'
                    },
                    key: 'X-Api-Key',
                    value: '<API Key>'
                  }
                ],
                method: 'GET',
                body: {}
              },
              status: 'Internal Server Error',
              code: 500,
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: '{\n  "message": "<string>"\n}',
              cookie: []
            }
          ],
          event: [],
          protocolProfileBehavior: {
            disableBodyPruning: true
          }
        }
      ],
      auth: {
        type: 'apikey',
        apikey: [
          {
            type: 'string',
            value: 'X-Api-Key',
            key: 'key'
          },
          {
            type: 'string',
            value: '{{apiKey}}',
            key: 'value'
          },
          {
            type: 'string',
            value: 'header',
            key: 'in'
          }
        ]
      },
      event: [],
      variable: [
        {
          type: 'any',
          value: 'example.com/v2',
          key: 'baseUrl'
        },
        {
          type: 'string',
          value: '1a2b3c-4d5e-6f7g8h',
          key: 'test-uuid'
        }
      ],
      info: {
        _postman_id: 'b03de137-5d19-4f70-9a6b-a376c2ffe287',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: 'Buy or rent spacecrafts\n\nContact Support:\n Name: Ayush',
          type: 'text/plain'
        }
      }
    },
    spec: {
      openapi: '3.1.0',
      servers: [
        {
          url: 'example.com/v2'
        }
      ],
      info: {
        contact: {
          name: 'Ayush'
        },
        version: '1.0.0',
        title: 'Sample API',
        description: 'Buy or rent spacecrafts'
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
                description: 'The spacecraft corresponding to the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Spacecraft'
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
                enum: ['probe']
              },
              description: {
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
    }
  }
};
