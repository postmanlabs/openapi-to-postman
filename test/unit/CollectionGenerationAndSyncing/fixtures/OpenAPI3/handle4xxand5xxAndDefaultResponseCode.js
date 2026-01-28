module.exports = {
  name: 'should handle 4xx and 5xx and default response codes',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {},
  shouldAssertGenerationAndSyncing: true,
  initialState: {
    collection: {
      info: {
        _postman_id: 'af335548-3d7f-4cfd-9d2d-31abf1c8f8d0',
        name: 'Sample API',
        description: 'Buy or rent spacecrafts\n\nContact Support:\n Name: Jon',
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
                  id: 'f191fcf9-4dd2-4e7a-9117-5861ec1fdf53',
                  protocolProfileBehavior: {
                    disableBodyPruning: true
                  },
                  request: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecrafts/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecrafts', ':spacecraftId'],
                      variable: [
                        {
                          id: '1677e1d1-6ac1-42c4-8bae-7fb93375e842',
                          key: 'spacecraftId',
                          value: '<string>',
                          description: 'The unique identifier of the spacecraft'
                        }
                      ]
                    }
                  },
                  response: [
                    {
                      id: '3b45fac5-e572-49b9-bbef-dd0380385820',
                      name: 'The spacecraft corresponding to the provided `spacecraftId` another name',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      body: '{\n  "id": "<string>",\n  "name": "<string>",\n  "type": "station",\n  "description": "<string>"\n}'
                    },
                    {
                      id: 'f0c08793-686c-48ec-abdf-a57b9fd81803',
                      name: 'No spacecraft found for the provided `spacecraftId` - 1',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      status: 'Bad Request',
                      code: 400,
                      _postman_previewlanguage: 'json',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "<string>"\n}'
                    },
                    {
                      id: '350a3d5d-ae09-40b6-9db2-217891f8532f',
                      name: 'Unexpected error - 2',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      body: '{\n  "message": "<string>"\n}'
                    },
                    {
                      id: '7812db69-76f9-4868-a1b9-d8a561a38049',
                      name: 'default',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      _postman_previewlanguage: 'json',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "<string>"\n}'
                    }
                  ]
                }
              ],
              id: '374e9f9a-0e50-4688-a086-d86aa7570aed'
            }
          ],
          id: 'e7ea9487-a91b-437e-b97f-4ba9efdcb945'
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
          value: 'example.com'
        }
      ]
    },
    spec: {
      openapi: '3.0.0',
      servers: [
        {
          url: 'example.com'
        }
      ],
      info: {
        contact: {
          name: 'Jon'
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
                description: 'The spacecraft corresponding to the provided `spacecraftId` another name',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Spacecraft'
                    }
                  }
                }
              },
              '4XX': {
                description: 'No spacecraft found for the provided `spacecraftId` - 1',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              },
              '5XX': {
                description: 'Unexpected error - 2',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              },
              default: {
                description: 'default',
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
                enum: ['station']
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
      info: {
        _postman_id: 'af335548-3d7f-4cfd-9d2d-31abf1c8f8d0',
        name: 'Sample API',
        description: 'Buy or rent spacecrafts\n\nContact Support:\n Name: Jon',
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
                  id: 'f191fcf9-4dd2-4e7a-9117-5861ec1fdf53',
                  protocolProfileBehavior: {
                    disableBodyPruning: true
                  },
                  request: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
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
                  response: [
                    {
                      id: '3b45fac5-e572-49b9-bbef-dd0380385820',
                      name: 'The spacecraft corresponding to the provided `spacecraftId` another name',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      body: '{\n  "id": "<string>",\n  "name": "<string>",\n  "type": "station",\n  "description": "<string>"\n}'
                    },
                    {
                      id: 'f0c08793-686c-48ec-abdf-a57b9fd81803',
                      name: 'No spacecraft found for the provided `spacecraftId`',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      status: 'Bad Request',
                      code: 400,
                      _postman_previewlanguage: 'json',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "<string>"\n}'
                    },
                    {
                      id: '350a3d5d-ae09-40b6-9db2-217891f8532f',
                      name: 'Unexpected error',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      body: '{\n  "message": "<string>"\n}'
                    },
                    {
                      id: '7812db69-76f9-4868-a1b9-d8a561a38049',
                      name: 'default - updated',
                      originalRequest: {
                        method: 'GET',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          },
                          {
                            description: 'Added as a part of security scheme: apikey',
                            key: 'X-Api-Key',
                            value: '<API Key>'
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
                      _postman_previewlanguage: 'json',
                      header: [
                        {
                          key: 'Content-Type',
                          value: 'application/json'
                        }
                      ],
                      cookie: [],
                      body: '{\n  "message": "<string>"\n}'
                    }
                  ]
                }
              ],
              id: '374e9f9a-0e50-4688-a086-d86aa7570aed'
            }
          ],
          id: 'e7ea9487-a91b-437e-b97f-4ba9efdcb945'
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
          value: 'example.com',
          type: 'any'
        }
      ]
    },
    spec: {
      openapi: '3.0.0',
      servers: [
        {
          url: 'example.com'
        }
      ],
      info: {
        contact: {
          name: 'Jon'
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
                description: 'The spacecraft corresponding to the provided `spacecraftId` another name',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Spacecraft'
                    }
                  }
                }
              },
              '4XX': {
                description: 'No spacecraft found for the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              },
              '5XX': {
                description: 'Unexpected error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Error'
                    }
                  }
                }
              },
              default: {
                description: 'default - updated',
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
                enum: ['station']
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
