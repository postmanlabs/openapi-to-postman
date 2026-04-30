/*
 * Tests basic multi-file OpenAPI spec handling.
 * Initial: Simple spec split across multiple files with basic references
 * Final: Same structure, verifies references are maintained and resolved correctly
 */

module.exports = {
  name: 'should handle basic multi-file OpenAPI 3.0 specification',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        name: 'Basic Multi-file Test API',
        description: 'A basic multi-file OpenAPI spec test',
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
                  raw: '{{baseUrl}}/pets?limit=<integer>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      description: 'How many items to return at one time (max 100)',
                      key: 'limit',
                      value: '<integer>'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'A paged array of pets',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets?limit=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          description: 'How many items to return at one time (max 100)',
                          key: 'limit',
                          value: '<integer>'
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
                  body: '{\n  "id": "<long>",\n  "name": "<string>",\n  "tag": "<string>"\n}'
                },
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
                      raw: '{{baseUrl}}/pets?limit=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          description: 'How many items to return at one time (max 100)',
                          key: 'limit',
                          value: '<integer>'
                        }
                      ]
                    }
                  },
                  status: 'Internal Server Error',
                  code: 500,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
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
            openapi: '3.0.0',
            info: {
              version: '1.0.0',
              title: 'Basic Multi-file Test API',
              description: 'A basic multi-file OpenAPI spec test'
            },
            paths: {
              '/pets': {
                $ref: './paths/pets.yaml'
              }
            },
            components: {
              schemas: {
                Pet: {
                  $ref: './components/schemas/pet.yaml'
                },
                Error: {
                  $ref: './components/schemas/error.yaml'
                }
              }
            }
          }
        },
        {
          path: 'paths/pets.yaml',
          type: 'DEFAULT',
          content: {
            get: {
              summary: 'List all pets',
              operationId: 'listPets',
              tags: ['pets'],
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  description: 'How many items to return at one time (max 100)',
                  schema: {
                    type: 'integer',
                    format: 'int32'
                  }
                }
              ],
              responses: {
                200: {
                  description: 'A paged array of pets',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/schemas/pet.yaml'
                      }
                    }
                  }
                },
                500: {
                  description: 'unexpected error',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/schemas/error.yaml'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          path: 'components/schemas/pet.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'string'
              },
              tag: {
                type: 'string'
              }
            }
          }
        },
        {
          path: 'components/schemas/error.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
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
      ]
    }
  },
  finalState: {
    collection: {
      info: {
        _postman_id: 'd7c6434b-cd79-446a-9158-530a23969024',
        name: 'Basic Multi-file Test API',
        description: 'A basic multi-file OpenAPI spec test with changed description',
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
                  raw: '{{baseUrl}}/pets?limit=<integer>',
                  host: ['{{baseUrl}}'],
                  path: ['pets'],
                  query: [
                    {
                      description: 'How many items to return at one time (max 100)',
                      key: 'limit',
                      value: '<integer>'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'A paged array of pets',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets?limit=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          description: 'How many items to return at one time (max 100)',
                          key: 'limit',
                          value: '<integer>'
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
                  body: '{\n  "id": "<long>",\n  "name": "<string>",\n  "tag": "<string>"\n}'
                },
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
                      raw: '{{baseUrl}}/pets?limit=<integer>',
                      host: ['{{baseUrl}}'],
                      path: ['pets'],
                      query: [
                        {
                          description: 'How many items to return at one time (max 100)',
                          key: 'limit',
                          value: '<integer>'
                        }
                      ]
                    }
                  },
                  status: 'Internal Server Error',
                  code: 500,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
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
            openapi: '3.0.0',
            info: {
              version: '1.0.0',
              title: 'Basic Multi-file Test API',
              description: 'A basic multi-file OpenAPI spec test with changed description'
            },
            paths: {
              '/pets': {
                $ref: './paths/pets.yaml'
              }
            },
            components: {
              schemas: {
                Pet: {
                  $ref: './components/schemas/pet.yaml'
                },
                Error: {
                  $ref: './components/schemas/error.yaml'
                }
              }
            }
          }
        },
        {
          path: 'paths/pets.yaml',
          type: 'DEFAULT',
          content: {
            get: {
              summary: 'List all pets',
              operationId: 'listPets',
              tags: ['pets'],
              parameters: [
                {
                  name: 'limit',
                  in: 'query',
                  description: 'How many items to return at one time (max 100)',
                  schema: {
                    type: 'integer',
                    format: 'int32'
                  }
                }
              ],
              responses: {
                200: {
                  description: 'A paged array of pets',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/schemas/pet.yaml'
                      }
                    }
                  }
                },
                500: {
                  description: 'unexpected error',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/schemas/error.yaml'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          path: 'components/schemas/pet.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'string'
              },
              tag: {
                type: 'string'
              }
            }
          }
        },
        {
          path: 'components/schemas/error.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
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
      ]
    }
  }
};
