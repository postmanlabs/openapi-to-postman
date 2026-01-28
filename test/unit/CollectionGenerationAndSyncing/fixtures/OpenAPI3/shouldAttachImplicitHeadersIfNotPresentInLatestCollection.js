/*
  Tests the scenario where implicit headers (Accept, Content-Type) exist in the current collection.
  When syncing with a spec that doesn't have these implicit headers, they should be preserved in:
  1. Base request headers
  2. Example request headers (response.originalRequest.headers)
  3. Example response headers
  
  Test Flow:
  - Initial collection has a form urlencoded request body → generates collection with Content-Type: application/x-www-form-urlencoded
  - Final spec removes the request body → syncing should preserve the Content-Type and Accept headers via attachImplicitHeaders
*/
module.exports = {
  name: 'should attach implicit headers if not present in latest collection',
  specificationType: 'OPENAPI:3.0',
  generationOptions: { parametersResolution: 'Example' },
  shouldAssertGenerationAndSyncing: false,
  initialState: {
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'test-collection-new',
        version: '1.0.0',
        description: 'some-desc-updated'
      },
      servers: [
        {
          url: 'https://testing1.com'
        }
      ],
      paths: {
        '/req1/': {
          post: {
            summary: 'req1',
            responses: {
              200: {
                description: '200 request',
                content: {
                  'application/x-www-form-urlencoded': {
                    schema: {
                      type: 'string'
                    }
                  }
                }
              }
            },
            tags: [],
            parameters: [
              {
                name: 'qp1',
                in: 'query',
                description: 'desc1',
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
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/req2/': {
          post: {
            summary: 'req2',
            tags: [],
            requestBody: {
              content: {
                'application/x-www-form-urlencoded': {
                  schema: {
                    properties: {
                      ayush: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            },
            parameters: [
              {
                name: 'qp2',
                in: 'query',
                description: 'desc2',
                schema: {
                  type: 'string'
                }
              },
              {
                name: 'x-header-value',
                in: 'header',
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              200: {
                description: 'a desc is here for urlEncoded',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'success'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/req3/': {
          post: {
            summary: 'req3',
            tags: [],
            requestBody: {
              content: {
                'application/x-www-form-urlencoded': {
                  schema: {
                    type: 'object',
                    properties: {
                      foo: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'a desc is here for formUrlEncoded without params',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'ok'
                        }
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
    collection: {
      info: {
        _postman_id: 'df0efaa7-2723-4c30-9c02-8f06f5198c67',
        name: 'testing urlEncoded coll',
        description: 'some-desc-updated',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '22876097'
      },
      item: [
        {
          name: 'req1',
          item: [
            {
              name: 'req1',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json'
                  },
                  {
                    key: 'Accept',
                    value: 'application/x-www-form-urlencoded'
                  }
                ],
                body: {
                  mode: 'raw',
                  raw: '{\n  "key1": "string"\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/req1/?qp1=string',
                  host: ['{{baseUrl}}'],
                  path: ['req1', ''],
                  query: [
                    {
                      key: 'qp1',
                      value: 'string',
                      description: 'desc1'
                    }
                  ]
                }
              },
              response: [
                {
                  name: '200 request',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Content-Type',
                        value: 'application/json'
                      },
                      {
                        key: 'Accept',
                        value: 'application/x-www-form-urlencoded'
                      }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "key1": "string"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/req1/?qp1=string',
                      host: ['{{baseUrl}}'],
                      path: ['req1', ''],
                      query: [
                        {
                          key: 'qp1',
                          value: 'string',
                          description: 'desc1'
                        }
                      ]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'text',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/x-www-form-urlencoded'
                    }
                  ],
                  cookie: [],
                  body: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'req2',
          item: [
            {
              name: 'req2',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'x-header-value',
                    value: 'string'
                  },
                  {
                    key: 'Content-Type',
                    value: 'application/x-www-form-urlencoded'
                  },
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                body: {
                  mode: 'urlencoded',
                  urlencoded: [
                    {
                      key: 'ayush',
                      value: 'string'
                    }
                  ]
                },
                url: {
                  raw: '{{baseUrl}}/req2/?qp2=string',
                  host: ['{{baseUrl}}'],
                  path: ['req2', ''],
                  query: [
                    {
                      key: 'qp2',
                      value: 'string',
                      description: 'desc2'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'a desc is here for urlEncoded',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'x-header-value',
                        value: 'string'
                      },
                      {
                        key: 'Content-Type',
                        value: 'application/x-www-form-urlencoded'
                      },
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    body: {
                      mode: 'urlencoded',
                      urlencoded: [
                        {
                          key: 'ayush',
                          value: 'string'
                        }
                      ]
                    },
                    url: {
                      raw: '{{baseUrl}}/req2/?qp2=string',
                      host: ['{{baseUrl}}'],
                      path: ['req2', ''],
                      query: [
                        {
                          key: 'qp2',
                          value: 'string',
                          description: 'desc2'
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
                  body: '{\n  "status": "success"\n}'
                }
              ]
            }
          ]
        },
        {
          name: 'req3',
          item: [
            {
              name: 'req3',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/x-www-form-urlencoded'
                  }
                ],
                body: {
                  mode: 'urlencoded',
                  urlencoded: [
                    {
                      key: 'foo',
                      value: 'string'
                    }
                  ]
                },
                url: {
                  raw: '{{baseUrl}}/req3/',
                  host: ['{{baseUrl}}'],
                  path: ['req3', '']
                }
              },
              response: [
                {
                  name: 'a desc is here for req3 formUrlEncoded without params',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Content-Type',
                        value: 'application/x-www-form-urlencoded'
                      }
                    ],
                    body: {
                      mode: 'urlencoded',
                      urlencoded: [
                        {
                          key: 'foo',
                          value: 'string'
                        }
                      ]
                    },
                    url: {
                      raw: '{{baseUrl}}/req3/',
                      host: ['{{baseUrl}}'],
                      path: ['req3', '']
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
                  body: '{\n  "status": "ok"\n}'
                }
              ]
            }
          ]
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://testing1.com'
        }
      ]
    }
  },
  finalState: {
    collection: {
      info: {
        _postman_id: 'df0efaa7-2723-4c30-9c02-8f06f5198c67',
        name: 'testing urlEncoded coll',
        description: 'some-desc-updated-again',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        _exporter_id: '22876097'
      },
      item: [
        {
          name: 'req1',
          item: [
            {
              name: 'req1',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Content-Type',
                    value: 'application/json'
                  },
                  {
                    key: 'Accept',
                    value: 'application/x-www-form-urlencoded'
                  }
                ],
                body: {
                  mode: 'raw',
                  raw: '{\n  "key1": "string"\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/req1/?qp1=string',
                  host: ['{{baseUrl}}'],
                  path: ['req1', ''],
                  query: [
                    {
                      key: 'qp1',
                      value: 'string',
                      description: 'desc1'
                    }
                  ]
                }
              },
              response: [
                {
                  name: '200 request',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Content-Type',
                        value: 'application/json'
                      },
                      {
                        key: 'Accept',
                        value: 'application/x-www-form-urlencoded'
                      }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "key1": "string"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/req1/?qp1=string',
                      host: ['{{baseUrl}}'],
                      path: ['req1', ''],
                      query: [
                        {
                          key: 'qp1',
                          value: 'string',
                          description: 'desc1'
                        }
                      ]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'text',
                  header: [
                    {
                      key: 'Content-Type',
                      value: 'application/x-www-form-urlencoded'
                    }
                  ],
                  cookie: [],
                  body: 'string'
                }
              ]
            }
          ]
        },
        {
          name: 'req2',
          item: [
            {
              name: 'req2',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'x-header-value',
                    value: 'string'
                  },
                  {
                    key: 'Accept',
                    value: 'application/json'
                  },
                  {
                    key: 'Content-Type',
                    value: 'application/x-www-form-urlencoded'
                  }
                ],
                body: {
                  mode: 'urlencoded',
                  urlencoded: [
                    {
                      key: 'ayush',
                      value: 'string'
                    }
                  ]
                },
                url: {
                  raw: '{{baseUrl}}/req2/?qp2=string',
                  host: ['{{baseUrl}}'],
                  path: ['req2', ''],
                  query: [
                    {
                      key: 'qp2',
                      value: 'string',
                      description: 'desc2'
                    }
                  ]
                }
              },
              response: [
                {
                  name: 'a desc is here for urlEncoded',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'x-header-value',
                        value: 'string'
                      },
                      {
                        key: 'Accept',
                        value: 'application/json'
                      },
                      {
                        key: 'Content-Type',
                        value: 'application/x-www-form-urlencoded'
                      }
                    ],
                    body: {
                      mode: 'urlencoded',
                      urlencoded: [
                        {
                          key: 'ayush',
                          value: 'string'
                        }
                      ]
                    },
                    url: {
                      raw: '{{baseUrl}}/req2/?qp2=string',
                      host: ['{{baseUrl}}'],
                      path: ['req2', ''],
                      query: [
                        {
                          key: 'qp2',
                          value: 'string',
                          description: 'desc2'
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
                  body: '{\n  "status": "success"\n}'
                }
              ]
            }
          ]
        },
        {
          name: 'req3',
          item: [
            {
              name: 'req3',
              request: {
                method: 'POST',
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  },
                  {
                    key: 'Content-Type',
                    value: 'application/x-www-form-urlencoded'
                  }
                ],
                body: {
                  mode: 'urlencoded',
                  urlencoded: [
                    {
                      key: 'foo',
                      value: 'string'
                    }
                  ]
                },
                url: {
                  raw: '{{baseUrl}}/req3/',
                  host: ['{{baseUrl}}'],
                  path: ['req3', '']
                }
              },
              response: [
                {
                  name: 'a desc is here for formUrlEncoded without params',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      },
                      {
                        key: 'Content-Type',
                        value: 'application/x-www-form-urlencoded'
                      }
                    ],
                    body: {
                      mode: 'urlencoded',
                      urlencoded: [
                        {
                          key: 'foo',
                          value: 'string'
                        }
                      ]
                    },
                    url: {
                      raw: '{{baseUrl}}/req3/',
                      host: ['{{baseUrl}}'],
                      path: ['req3', '']
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
                  body: '{\n  "status": "ok"\n}'
                }
              ]
            }
          ]
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://testing1.com'
        }
      ]
    },
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'test-collection-new',
        version: '1.0.0',
        description: 'some-desc-updated-again'
      },
      servers: [
        {
          url: 'https://testing1.com'
        }
      ],
      paths: {
        '/req1/': {
          post: {
            summary: 'req1',
            responses: {
              200: {
                description: '200 request'
              }
            },
            tags: [],
            parameters: [
              {
                name: 'qp1',
                in: 'query',
                description: 'desc1',
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
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/req2/': {
          post: {
            summary: 'req2',
            tags: [],
            parameters: [
              {
                name: 'qp2',
                in: 'query',
                description: 'desc2',
                schema: {
                  type: 'string'
                }
              },
              {
                name: 'x-header-value',
                in: 'header',
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              200: {
                description: 'a desc is here for urlEncoded',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'success'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/req3/': {
          post: {
            summary: 'req3',
            tags: [],
            // requestBody removed in final spec to simulate the deletion of form body
            responses: {
              200: {
                description: 'a desc is here for formUrlEncoded without params',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: {
                          type: 'string',
                          example: 'ok'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
