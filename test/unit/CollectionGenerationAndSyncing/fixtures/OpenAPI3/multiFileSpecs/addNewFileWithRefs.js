/*
 * Tests adding a new schema file with references.
 * Initial: Basic OpenAPI spec with Pet schema and success responses
 * Final: Adds Error schema file and references it in error responses
 */

module.exports = {
  name: 'should handle adding new file with references to existing components',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing adding new files with references',
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
                }
              ]
            },
            {
              name: 'Create a pet',
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
                  raw: '{\n  "id": "<long>",\n  "name": "<string>",\n  "tag": "<string>"\n}',
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
                  name: 'Pet created successfully',
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
                      raw: '{\n  "id": "<long>",\n  "name": "<string>",\n  "tag": "<string>"\n}',
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
                  status: 'Created',
                  code: 201,
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
              title: 'Add New File Test API',
              description: 'Testing adding new files with references'
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
                }
              }
            },
            post: {
              summary: 'Create a pet',
              operationId: 'createPet',
              tags: ['pets'],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '../components/schemas/pet.yaml'
                    }
                  }
                }
              },
              responses: {
                201: {
                  description: 'Pet created successfully',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/schemas/pet.yaml'
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
        }
      ]
    }
  },
  finalState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing adding new files with references',
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
            },
            {
              name: 'Create a pet',
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
                  raw: '{\n  "id": "<long>",\n  "name": "<string>",\n  "tag": "<string>"\n}',
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
                  name: 'Pet created successfully',
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
                      raw: '{\n  "id": "<long>",\n  "name": "<string>",\n  "tag": "<string>"\n}',
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
                  status: 'Created',
                  code: 201,
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
                      raw: '{\n  "id": "<long>",\n  "name": "<string>",\n  "tag": "<string>"\n}',
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
              title: 'Add New File Test API',
              description: 'Testing adding new files with references'
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
            },
            post: {
              summary: 'Create a pet',
              operationId: 'createPet',
              tags: ['pets'],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: '../components/schemas/pet.yaml'
                    }
                  }
                }
              },
              responses: {
                201: {
                  description: 'Pet created successfully',
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
