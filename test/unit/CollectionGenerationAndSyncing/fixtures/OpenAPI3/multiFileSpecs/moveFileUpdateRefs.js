/*
 * Tests moving files and updating their references.
 * Initial: Files in deep folder structure with relative refs
 * Final: Files moved to new locations, all references updated accordingly
 */

module.exports = {
  name: 'should handle moving files and updating references',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing moving files and updating references',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'pets',
          item: [
            {
              name: 'Get pet by ID',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/pets/:petId',
                  host: ['{{baseUrl}}'],
                  path: ['pets', ':petId'],
                  variable: [
                    {
                      key: 'petId',
                      value: '<long>',
                      description: 'The id of the pet to retrieve'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'Pet response',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets/:petId',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':petId'],
                      variable: [
                        {
                          key: 'petId',
                          value: '<long>',
                          description: 'The id of the pet to retrieve'
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
              title: 'Move File Test API',
              description: 'Testing moving files and updating references'
            },
            paths: {
              '/pets/{petId}': {
                $ref: './paths/pets/pet.yaml'
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
          path: 'paths/pets/pet.yaml',
          type: 'DEFAULT',
          content: {
            get: {
              summary: 'Get pet by ID',
              operationId: 'getPetById',
              tags: ['pets'],
              parameters: [
                {
                  name: 'petId',
                  in: 'path',
                  required: true,
                  description: 'The id of the pet to retrieve',
                  schema: {
                    type: 'integer',
                    format: 'int64'
                  }
                }
              ],
              responses: {
                200: {
                  description: 'Pet response',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../../components/schemas/pet.yaml'
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
        description: 'Testing moving files and updating references',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'pets',
          item: [
            {
              name: 'Get pet by ID',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/pets/:petId',
                  host: ['{{baseUrl}}'],
                  path: ['pets', ':petId'],
                  variable: [
                    {
                      key: 'petId',
                      value: '<long>',
                      description: 'The id of the pet to retrieve'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'Pet response',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/pets/:petId',
                      host: ['{{baseUrl}}'],
                      path: ['pets', ':petId'],
                      variable: [
                        {
                          key: 'petId',
                          value: '<long>',
                          description: 'The id of the pet to retrieve'
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
              title: 'Move File Test API',
              description: 'Testing moving files and updating references'
            },
            paths: {
              '/pets/{petId}': {
                $ref: './paths/pet.yaml'
              }
            },
            components: {
              schemas: {
                Pet: {
                  $ref: './components/pet.yaml'
                }
              }
            }
          }
        },
        {
          path: 'paths/pet.yaml',
          type: 'DEFAULT',
          content: {
            get: {
              summary: 'Get pet by ID',
              operationId: 'getPetById',
              tags: ['pets'],
              parameters: [
                {
                  name: 'petId',
                  in: 'path',
                  required: true,
                  description: 'The id of the pet to retrieve',
                  schema: {
                    type: 'integer',
                    format: 'int64'
                  }
                }
              ],
              responses: {
                200: {
                  description: 'Pet response',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/pet.yaml'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          path: 'components/pet.yaml',
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
  }
};
