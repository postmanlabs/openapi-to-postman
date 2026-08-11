/*
  SPECHUB-2636: When updating an existing collection from a spec with "Sync Example" off, Postman
  environment variables in the JSON request/response body must be preserved regardless of how they are
  written. Previously a BARE (unquoted) variable such as `{ "customer_id": {{customer_id}} }` made the
  existing body invalid JSON, so the merge discarded the entire user body in favour of the spec-generated
  one. This fixture packs every shape of variable into a single body and asserts they all survive a sync
  while a genuinely new spec field (`note`) is still added:
    - bare (unquoted) value          -> `"customer_id": {{customer_id}}`
    - quoted value                   -> `"driver_id": "{{driver_id}}"`
    - variable embedded in a string  -> `"authorization": "Bearer {{token}}"` (the Bearer-auth case; the
                                        surrounding text must NOT be split by re-quoting the variable)
    - bare value nested in an object -> `"metadata": { "trace_id": {{trace_id}} }`
    - quoted value nested            -> `"metadata": { "source": "{{source_system}}" }`
    - multiple bare variables in one body (`customer_id` + `trace_id`)
*/
module.exports = {
  name: 'should preserve bare, quoted and in-string (Bearer) Postman variables in the request body while syncing',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    parametersResolution: 'Example',
    folderStrategy: 'Paths'
  },
  syncOptions: {
    syncExamples: false
  },
  shouldGenerateCollection: false,
  initialState: {
    collection: {
      info: {
        _postman_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        name: 'Env Var Preservation',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'customers',
          item: [
            {
              name: 'Create customer',
              protocolProfileBehavior: {
                disableBodyPruning: true
              },
              request: {
                method: 'POST',
                header: [
                  { key: 'Content-Type', value: 'application/json' },
                  { key: 'Accept', value: 'application/json' }
                ],
                body: {
                  mode: 'raw',
                  raw:
                    '{\n  "customer_id": {{customer_id}},\n  "driver_id": "{{driver_id}}",\n' +
                    '  "authorization": "Bearer {{token}}",\n  "metadata": {\n' +
                    '    "trace_id": {{trace_id}},\n    "source": "{{source_system}}"\n  }\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/customers',
                  host: ['{{baseUrl}}'],
                  path: ['customers']
                }
              },
              response: [
                {
                  name: 'Created',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      { key: 'Content-Type', value: 'application/json' },
                      { key: 'Accept', value: 'application/json' }
                    ],
                    body: {
                      mode: 'raw',
                      raw:
                        '{\n  "customer_id": {{customer_id}},\n  "driver_id": "{{driver_id}}",\n' +
                        '  "authorization": "Bearer {{token}}",\n  "metadata": {\n' +
                        '    "trace_id": {{trace_id}},\n    "source": "{{source_system}}"\n  }\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/customers',
                      host: ['{{baseUrl}}'],
                      path: ['customers']
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "status": "ok"\n}'
                }
              ]
            }
          ]
        }
      ],
      variable: [{ key: 'baseUrl', value: 'https://api.example.com' }]
    }
  },
  finalState: {
    spec: {
      openapi: '3.0.0',
      info: {
        title: 'Env Var Preservation',
        version: '1.0.0'
      },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/customers': {
          post: {
            summary: 'Create customer',
            requestBody: {
              content: {
                'application/json': {
                  // Spec-provided example values differ from the user's — they must NOT win when Sync
                  // Example is off; only the genuinely new `note` field should be added. Key order here
                  // dictates the merged body's key order (the merge iterates the spec/target keys).
                  example: {
                    customer_id: 'gen-id',
                    driver_id: 'gen-driver',
                    authorization: 'Bearer gen-token',
                    metadata: {
                      trace_id: 'gen-trace',
                      source: 'gen-source'
                    },
                    note: 'from-spec'
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'Created',
                content: {
                  'application/json': {
                    example: {
                      status: 'ok'
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
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'customers',
          item: [
            {
              name: 'Create customer',
              request: {
                method: 'POST',
                header: [
                  { key: 'Content-Type', value: 'application/json' },
                  { key: 'Accept', value: 'application/json' }
                ],
                body: {
                  mode: 'raw',
                  raw:
                    '{\n  "customer_id": {{customer_id}},\n  "driver_id": "{{driver_id}}",\n' +
                    '  "authorization": "Bearer {{token}}",\n  "metadata": {\n' +
                    '    "trace_id": {{trace_id}},\n    "source": "{{source_system}}"\n  },\n' +
                    '  "note": "from-spec"\n}',
                  options: {
                    raw: {
                      headerFamily: 'json',
                      language: 'json'
                    }
                  }
                },
                url: {
                  raw: '{{baseUrl}}/customers',
                  host: ['{{baseUrl}}'],
                  path: ['customers']
                }
              },
              response: [
                {
                  name: 'Created',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      { key: 'Content-Type', value: 'application/json' },
                      { key: 'Accept', value: 'application/json' }
                    ],
                    body: {
                      mode: 'raw',
                      raw:
                        '{\n  "customer_id": {{customer_id}},\n  "driver_id": "{{driver_id}}",\n' +
                        '  "authorization": "Bearer {{token}}",\n  "metadata": {\n' +
                        '    "trace_id": {{trace_id}},\n    "source": "{{source_system}}"\n  },\n' +
                        '  "note": "from-spec"\n}',
                      options: {
                        raw: {
                          headerFamily: 'json',
                          language: 'json'
                        }
                      }
                    },
                    url: {
                      raw: '{{baseUrl}}/customers',
                      host: ['{{baseUrl}}'],
                      path: ['customers']
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
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
          value: 'https://api.example.com',
          type: 'any'
        }
      ]
    }
  }
};
