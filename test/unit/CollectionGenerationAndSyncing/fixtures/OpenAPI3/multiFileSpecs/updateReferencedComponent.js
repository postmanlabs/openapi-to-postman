/*
 * Tests updating a referenced component schema.
 * Initial: Basic schema with properties
 * Final: Updated schema with new properties, verifies all references update
 */

module.exports = {
  name: 'should handle updating referenced component and propagate changes',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing updating referenced components',
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
                  raw: '{{baseUrl}}/pets',
                  host: ['{{baseUrl}}'],
                  path: ['pets']
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
                      raw: '{{baseUrl}}/pets',
                      host: ['{{baseUrl}}'],
                      path: ['pets']
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
                  body: '{\n  "id": "<long>",\n  "name": "<string>"\n}'
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
              title: 'Update Referenced Component Test API',
              description: 'Testing updating referenced components'
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
        description: 'Testing updating referenced components',
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
                  raw: '{{baseUrl}}/pets',
                  host: ['{{baseUrl}}'],
                  path: ['pets']
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
                      raw: '{{baseUrl}}/pets',
                      host: ['{{baseUrl}}'],
                      path: ['pets']
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
                  body: '{\n  "id": "<long>",\n  "name": "<string>",\n  "status": "available",\n  "category": {\n    "id": "<long>",\n    "name": "<string>"\n  }\n}'
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
              title: 'Update Referenced Component Test API',
              description: 'Testing updating referenced components'
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
                Category: {
                  $ref: './components/schemas/category.yaml'
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
              status: {
                type: 'string',
                enum: ['available']
              },
              category: {
                $ref: './category.yaml'
              }
            }
          }
        },
        {
          path: 'components/schemas/category.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              name: {
                type: 'string'
              }
            }
          }
        }
      ]
    }
  }
};
