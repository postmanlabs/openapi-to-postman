/*
 * Tests handling of external references in OpenAPI specs.
 * Initial: All schemas are local files that get resolved
 * Final: Schemas are changed to external URLs (https://...)
 */

module.exports = {
  name: 'should handle external references to other OpenAPI files',
  specificationType: 'OPENAPI:3.1',
  generationOptions: {
    folderStrategy: 'Tags'
  },
  initialState: {
    collection: {
      info: {
        _postman_id: '398bd1df-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing external references to other OpenAPI files',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'store',
          item: [
            {
              name: 'Create order',
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
                  raw: '{\n  "id": "<long>",\n  "petId": "<long>",\n  "quantity": "<integer>",\n  "shipDate": "<dateTime>",\n  "status": "placed",\n  "complete": false\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/store/order',
                  host: ['{{baseUrl}}'],
                  path: ['store', 'order']
                }
              },
              response: [
                {
                  name: 'Order created',
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
                      raw: '{\n  "id": "<long>",\n  "petId": "<long>",\n  "quantity": "<integer>",\n  "shipDate": "<dateTime>",\n  "status": "placed",\n  "complete": false\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/store/order',
                      host: ['{{baseUrl}}'],
                      path: ['store', 'order']
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
                  body: '{\n  "id": "<long>",\n  "petId": "<long>",\n  "quantity": "<integer>",\n  "shipDate": "<dateTime>",\n  "status": "placed",\n  "complete": false\n}'
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
            openapi: '3.1.0',
            info: {
              version: '1.0.0',
              title: 'External References Test API',
              description: 'Testing external references to other OpenAPI files'
            },
            paths: {
              '/store/order': {
                post: {
                  summary: 'Create order',
                  operationId: 'createOrder',
                  tags: ['store'],
                  requestBody: {
                    required: true,
                    content: {
                      'application/json': {
                        schema: {
                          $ref: './components/schemas/order.yaml'
                        }
                      }
                    }
                  },
                  responses: {
                    200: {
                      description: 'Order created',
                      content: {
                        'application/json': {
                          schema: {
                            $ref: './components/schemas/order.yaml'
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
                Order: {
                  $ref: './components/schemas/order.yaml'
                },
                Pet: {
                  $ref: './components/schemas/pet.yaml'
                }
              }
            }
          }
        },
        {
          path: 'components/schemas/order.yaml',
          type: 'DEFAULT',
          content: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                format: 'int64'
              },
              petId: {
                type: 'integer',
                format: 'int64'
              },
              quantity: {
                type: 'integer',
                format: 'int32'
              },
              shipDate: {
                type: 'string',
                format: 'date-time'
              },
              status: {
                type: 'string',
                description: 'Order Status',
                enum: ['placed']
              },
              complete: {
                type: 'boolean',
                default: false
              }
            }
          }
        },
        {
          path: 'components/schemas/pet.yaml',
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
              },
              status: {
                type: 'string',
                enum: ['available']
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
        _postman_id: '3213ds3-02ff-4c2e-9c29-f4296bf2d3b3',
        description: 'Testing external references to other OpenAPI files',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '6294718'
      },
      item: [
        {
          name: 'store',
          item: [
            {
              name: 'Create order',
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
                  raw: '{\n  "id": "<long>",\n  "petId": "<long>",\n  "quantity": "<integer>",\n  "shipDate": "<dateTime>",\n  "status": "placed",\n  "complete": false\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/store/order',
                  host: ['{{baseUrl}}'],
                  path: ['store', 'order']
                }
              },
              response: [
                {
                  name: 'Order created',
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
                      raw: '{\n  "id": "<long>",\n  "petId": "<long>",\n  "quantity": "<integer>",\n  "shipDate": "<dateTime>",\n  "status": "placed",\n  "complete": false\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/store/order',
                      host: ['{{baseUrl}}'],
                      path: ['store', 'order']
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
                  body: '{\n  "id": "<long>",\n  "petId": "<long>",\n  "quantity": "<integer>",\n  "shipDate": "<dateTime>",\n  "status": "placed",\n  "complete": false\n}'
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
            openapi: '3.1.0',
            info: {
              version: '1.0.0',
              title: 'External References Test API',
              description: 'Testing external references to other OpenAPI files'
            },
            paths: {
              '/store/order': {
                $ref: 'https://petstore3.swagger.io/api/v3/openapi.json#/paths/~1store~1order'
              }
            },
            components: {
              schemas: {
                Order: {
                  $ref: 'https://petstore3.swagger.io/api/v3/openapi.json#/components/schemas/Order'
                },
                Pet: {
                  $ref: 'https://petstore3.swagger.io/api/v3/openapi.json#/components/schemas/Pet'
                }
              }
            }
          }
        }
      ]
    }
  }
};
