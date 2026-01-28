/*
  Here a new request is being added with the path POST /pets
  And the request is being added to the collection in the correct location following `Tags`
  since the folderStrategy is set to 'Tags' and nested folder hierarchy is true
 */
module.exports = {
  name: 'should add new request to collection in correct location - organised using nested tags',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    folderStrategy: 'Tags',
    nestedFolderHierarchy: true
  },
  shouldAssertGenerationAndSyncing: true,
  initialState: {
    collection: {
      info: {
        _postman_id: 'cde601d8-7cb6-4352-87b9-9795157e5af9',
        name: 'SpaceCraft-nested',
        description: 'Buy or rent spacecrafts updated to new content\n\nContact Support:\n Name: Jon',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'spacecraft',
          item: [
            {
              name: 'Read a spacecraft -1',
              id: '002b9752-fe0a-4aa8-8b39-ceea97520e10',
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
                  raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                  host: ['{{baseUrl}}'],
                  path: ['spacecraft', ':spacecraftId'],
                  variable: [
                    {
                      id: '67b30029-1b9b-4d0b-8e03-902ee92cc06c',
                      key: 'spacecraftId',
                      value: '<string>'
                    }
                  ]
                }
              },
              response: [
                {
                  id: '801ff62a-19a0-4769-a465-415a9c332a7b',
                  name: 'The spacecraft corresponding to the provided `spacecraftId`',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecraft', ':spacecraftId'],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: '<string>'
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
                  body: '{\n  "id": "<string>",\n  "name": "<string>",\n  "type": "<string>",\n  "description": "<string>"\n}'
                },
                {
                  id: '45baf1fa-ad43-402c-9c38-9952890378c6',
                  name: 'No spacecraft found for the provided `spacecraftId`',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecraft', ':spacecraftId'],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: '<string>'
                        }
                      ]
                    }
                  },
                  status: 'Not Found',
                  code: 404,
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
                  id: 'c1b35d3f-c810-40ee-a294-826df1f8ddbe',
                  name: 'Unexpected error',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecraft', ':spacecraftId'],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: '<string>'
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
                }
              ]
            }
          ],
          id: '896527a2-b3c1-4aca-9ff7-cc066cb45926'
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: '{{baseUrl}}'
        }
      ]
    },
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'Spacecraft',
        version: '1.0.0',
        description: 'Buy or rent spacecrafts updated to new content\n\nContact Support:\n Name: Jon'
      },
      servers: [
        {
          url: '{{baseUrl}}'
        }
      ],
      paths: {
        '/spacecraft/{spacecraftId}': {
          parameters: [
            {
              name: 'spacecraftId',
              in: 'path',
              required: true,
              example: 'asdfadsfasf',
              schema: {
                deprecated: false,
                type: 'string'
              }
            }
          ],
          get: {
            summary: 'Read a spacecraft -1',
            tags: ['spacecraft'],
            parameters: [
              {
                name: 'Accept',
                in: 'header',
                required: false,
                example: 'application/json',
                schema: {
                  deprecated: false
                }
              }
            ],
            responses: {
              200: {
                description: 'The spacecraft corresponding to the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string'
                        },
                        name: {
                          type: 'string'
                        },
                        type: {
                          type: 'string'
                        },
                        description: {
                          type: 'string'
                        }
                      }
                    },
                    example: {
                      id: 'string',
                      name: 'string',
                      type: 'string',
                      description: 'string'
                    }
                  }
                }
              },
              404: {
                description: 'No spacecraft found for the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string'
                        }
                      }
                    },
                    example: {
                      message: 'string'
                    }
                  }
                }
              },
              500: {
                description: 'Unexpected error',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string'
                        }
                      }
                    },
                    example: {
                      message: 'string'
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
  finalState: {
    collection: {
      info: {
        _postman_id: 'cde601d8-7cb6-4352-87b9-9795157e5af9',
        name: 'SpaceCraft-nested',
        description: 'Buy or rent spacecrafts updated to new content\n\nContact Support:\n Name: Jon',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'spacecraft',
          item: [
            {
              name: 'create',
              item: [
                {
                  name: 'Create a spacecraft',
                  id: 'f8e70b1e-dd8e-48c1-8a12-34648f9dff60',
                  protocolProfileBehavior: {
                    disableBodyPruning: true
                  },
                  request: {
                    method: 'POST',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecraft', ':spacecraftId'],
                      variable: [
                        {
                          id: 'a3e9f8dd-0d31-490c-9361-a50465effc54',
                          key: 'spacecraftId',
                          value: '<string>'
                        }
                      ]
                    }
                  },
                  response: [
                    {
                      id: '19b1063a-3d33-4498-a131-95bef89fe516',
                      name: 'The spacecraft corresponding to the provided `spacecraftId`',
                      originalRequest: {
                        method: 'POST',
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        url: {
                          raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                          host: ['{{baseUrl}}'],
                          path: ['spacecraft', ':spacecraftId'],
                          variable: [
                            {
                              key: 'spacecraftId',
                              value: '<string>'
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
                      body: '{\n  "id": "<string>",\n  "name": "<string>",\n  "type": "<string>",\n  "description": "<string>"\n}'
                    }
                  ]
                }
              ],
              id: 'e5668ed1-2efe-4376-b9e3-065fba2aa31b'
            },
            {
              name: 'Read a spacecraft -1',
              id: '002b9752-fe0a-4aa8-8b39-ceea97520e10',
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
                  raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                  host: ['{{baseUrl}}'],
                  path: ['spacecraft', ':spacecraftId'],
                  variable: [
                    {
                      key: 'spacecraftId',
                      value: '<string>'
                    }
                  ]
                }
              },
              response: [
                {
                  id: '801ff62a-19a0-4769-a465-415a9c332a7b',
                  name: 'The spacecraft corresponding to the provided `spacecraftId`',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecraft', ':spacecraftId'],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: '<string>'
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
                  body: '{\n  "id": "<string>",\n  "name": "<string>",\n  "type": "<string>",\n  "description": "<string>"\n}'
                },
                {
                  id: '45baf1fa-ad43-402c-9c38-9952890378c6',
                  name: 'No spacecraft found for the provided `spacecraftId`',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecraft', ':spacecraftId'],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: '<string>'
                        }
                      ]
                    }
                  },
                  status: 'Not Found',
                  code: 404,
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
                  id: 'c1b35d3f-c810-40ee-a294-826df1f8ddbe',
                  name: 'Unexpected error',
                  originalRequest: {
                    method: 'GET',
                    header: [
                      {
                        key: 'Accept',
                        value: 'application/json'
                      }
                    ],
                    url: {
                      raw: '{{baseUrl}}/spacecraft/:spacecraftId',
                      host: ['{{baseUrl}}'],
                      path: ['spacecraft', ':spacecraftId'],
                      variable: [
                        {
                          key: 'spacecraftId',
                          value: '<string>'
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
                }
              ]
            }
          ],
          id: '896527a2-b3c1-4aca-9ff7-cc066cb45926'
        }
      ],
      variable: [
        {
          key: 'baseUrl',
          value: '{{baseUrl}}'
        }
      ]
    },
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'Spacecraft',
        version: '1.0.0',
        description: 'Buy or rent spacecrafts updated to new content\n\nContact Support:\n Name: Jon'
      },
      servers: [
        {
          url: '{{baseUrl}}'
        }
      ],
      paths: {
        '/spacecraft/{spacecraftId}': {
          parameters: [
            {
              name: 'spacecraftId',
              in: 'path',
              required: true,
              example: 'asdfadsfasf',
              schema: {
                deprecated: false,
                type: 'string'
              }
            }
          ],
          get: {
            summary: 'Read a spacecraft -1',
            tags: ['spacecraft'],
            parameters: [
              {
                name: 'Accept',
                in: 'header',
                required: false,
                example: 'application/json',
                schema: {
                  deprecated: false
                }
              }
            ],
            responses: {
              200: {
                description: 'The spacecraft corresponding to the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string'
                        },
                        name: {
                          type: 'string'
                        },
                        type: {
                          type: 'string'
                        },
                        description: {
                          type: 'string'
                        }
                      }
                    },
                    example: {
                      id: 'string',
                      name: 'string',
                      type: 'string',
                      description: 'string'
                    }
                  }
                }
              },
              404: {
                description: 'No spacecraft found for the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string'
                        }
                      }
                    },
                    example: {
                      message: 'string'
                    }
                  }
                }
              },
              500: {
                description: 'Unexpected error',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string'
                        }
                      }
                    },
                    example: {
                      message: 'string'
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create a spacecraft',
            tags: ['spacecraft', 'create'],
            responses: {
              200: {
                description: 'The spacecraft corresponding to the provided `spacecraftId`',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string'
                        },
                        name: {
                          type: 'string'
                        },
                        type: {
                          type: 'string'
                        },
                        description: {
                          type: 'string'
                        }
                      }
                    },
                    example: {
                      id: 'string',
                      name: 'string',
                      type: 'string',
                      description: 'string'
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
