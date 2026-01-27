/*
 * Tests handling of circular references between schema files.
 * Initial: Person schema references Address schema which references back to Person
 * Final: Verifies circular references are properly resolved without infinite loops
 */

module.exports = {
  name: 'should handle circular references between schema files',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing circular references between schema files',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'person',
          item: [
            {
              name: 'Get person',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/person/:personId',
                  host: ['{{baseUrl}}'],
                  path: ['person', ':personId'],
                  variable: [
                    {
                      key: 'personId',
                      value: '<long>',
                      description: 'The id of the person to retrieve'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'Person response',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/person/:personId',
                      host: ['{{baseUrl}}'],
                      path: ['person', ':personId'],
                      variable: [
                        {
                          key: 'personId',
                          value: '<long>',
                          description: 'The id of the person to retrieve'
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
                  body: 'null'
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
              title: 'Circular References Test API',
              description: 'Testing circular references between schema files'
            },
            paths: {
              '/person/{personId}': {
                $ref: './paths/person.yaml'
              }
            },
            components: {
              schemas: {
                Person: {
                  $ref: './components/schemas/person.yaml'
                }
              }
            }
          }
        },
        {
          path: 'paths/person.yaml',
          type: 'DEFAULT',
          content: {
            get: {
              summary: 'Get person',
              operationId: 'getPerson',
              tags: ['person'],
              parameters: [
                {
                  name: 'personId',
                  in: 'path',
                  required: true,
                  description: 'The id of the person to retrieve',
                  schema: {
                    type: 'integer',
                    format: 'int64'
                  }
                }
              ],
              responses: {
                200: {
                  description: 'Person response',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/schemas/person.yaml'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          path: 'components/schemas/person.yaml',
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
              friends: {
                type: 'array',
                items: {
                  $ref: './person.yaml'
                }
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
        _postman_id: '321321ds-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing circular references between schema files',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'person',
          item: [
            {
              name: 'Get person',
              request: {
                method: 'GET',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                url: {
                  raw: '{{baseUrl}}/person/:personId',
                  host: ['{{baseUrl}}'],
                  path: ['person', ':personId'],
                  variable: [
                    {
                      key: 'personId',
                      value: '<long>',
                      description: 'The id of the person to retrieve'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'Person response',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/person/:personId',
                      host: ['{{baseUrl}}'],
                      path: ['person', ':personId'],
                      variable: [
                        {
                          key: 'personId',
                          value: '<long>',
                          description: 'The id of the person to retrieve'
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
                  body: 'null'
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
              title: 'Circular References Test API',
              description: 'Testing circular references between schema files'
            },
            paths: {
              '/person/{personId}': {
                $ref: './paths/person.yaml'
              }
            },
            components: {
              schemas: {
                Person: {
                  $ref: './components/schemas/person.yaml'
                }
              }
            }
          }
        },
        {
          path: 'paths/person.yaml',
          type: 'DEFAULT',
          content: {
            get: {
              summary: 'Get person',
              operationId: 'getPerson',
              tags: ['person'],
              parameters: [
                {
                  name: 'personId',
                  in: 'path',
                  required: true,
                  description: 'The id of the person to retrieve',
                  schema: {
                    type: 'integer',
                    format: 'int64'
                  }
                }
              ],
              responses: {
                200: {
                  description: 'Person response',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '../components/schemas/person.yaml'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          path: 'components/schemas/person.yaml',
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
              friends: {
                type: 'array',
                items: {
                  $ref: './person.yaml'
                }
              }
            }
          }
        }
      ]
    }
  }
};
