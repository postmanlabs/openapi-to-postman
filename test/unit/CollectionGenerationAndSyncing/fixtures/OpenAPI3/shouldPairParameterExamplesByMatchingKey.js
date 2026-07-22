// A query parameter whose plural `examples` keys (admin, user, …) match the response example keys
// produces one saved response per matched key, each carrying the paired parameter value in its
// originalRequest url query. This fixture asserts the multi-example parameter pairing round-trips
// AND that a spec-side edit propagates on sync: the final spec adds a third matched example (guest),
// and the collection must gain a third paired saved response without churning the existing two.

module.exports = {
  name: 'should pair response examples with matching query parameter examples and sync an added example',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    parametersResolution: 'Example',
    requestParametersResolution: 'Example'
  },
  syncOptions: {
    syncExamples: true
  },
  shouldAssertGenerationAndSyncing: true,
  initialState: {
    spec: {
      openapi: '3.0.0',
      info: { title: 'Param Multi-Example API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/users': {
          get: {
            summary: 'List users by role',
            parameters: [
              {
                name: 'role',
                in: 'query',
                required: true,
                schema: { type: 'string' },
                examples: {
                  admin: { value: 'admin' },
                  user: { value: 'user' }
                }
              }
            ],
            responses: {
              200: {
                description: 'User list',
                content: {
                  'application/json': {
                    examples: {
                      admin: { value: { role: 'admin', users: ['alice', 'bob'] } },
                      user: { value: { role: 'user', users: ['carol'] } }
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
          name: 'users',
          item: [
            {
              name: 'List users by role',
              request: {
                method: 'GET',
                header: [{ key: 'Accept', value: 'application/json' }],
                url: {
                  raw: '{{baseUrl}}/users?role=admin',
                  host: ['{{baseUrl}}'],
                  path: ['users'],
                  query: [{ key: 'role', value: 'admin' }]
                }
              },
              response: [
                {
                  name: 'User list',
                  originalRequest: {
                    method: 'GET',
                    header: [{ key: 'Accept', value: 'application/json' }],
                    url: {
                      raw: '{{baseUrl}}/users?role=admin',
                      host: ['{{baseUrl}}'],
                      path: ['users'],
                      query: [{ key: 'role', value: 'admin' }]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "admin",\n  "users": [\n    "alice",\n    "bob"\n  ]\n}'
                },
                {
                  name: 'User list',
                  originalRequest: {
                    method: 'GET',
                    header: [{ key: 'Accept', value: 'application/json' }],
                    url: {
                      raw: '{{baseUrl}}/users?role=user',
                      host: ['{{baseUrl}}'],
                      path: ['users'],
                      query: [{ key: 'role', value: 'user' }]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "user",\n  "users": [\n    "carol"\n  ]\n}'
                }
              ]
            }
          ]
        }
      ],
      variable: [{ key: 'baseUrl', value: 'https://api.example.com', type: 'any' }]
    }
  },
  finalState: {
    spec: {
      openapi: '3.0.0',
      info: { title: 'Param Multi-Example API', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/users': {
          get: {
            summary: 'List users by role',
            parameters: [
              {
                name: 'role',
                in: 'query',
                required: true,
                schema: { type: 'string' },
                examples: {
                  admin: { value: 'admin' },
                  user: { value: 'user' },
                  // New matched example added in the spec.
                  guest: { value: 'guest' }
                }
              }
            ],
            responses: {
              200: {
                description: 'User list',
                content: {
                  'application/json': {
                    examples: {
                      admin: { value: { role: 'admin', users: ['alice', 'bob'] } },
                      user: { value: { role: 'user', users: ['carol'] } },
                      guest: { value: { role: 'guest', users: ['dave'] } }
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
          name: 'users',
          item: [
            {
              name: 'List users by role',
              request: {
                method: 'GET',
                header: [{ key: 'Accept', value: 'application/json' }],
                url: {
                  raw: '{{baseUrl}}/users?role=admin',
                  host: ['{{baseUrl}}'],
                  path: ['users'],
                  query: [{ key: 'role', value: 'admin' }]
                }
              },
              response: [
                {
                  name: 'User list',
                  originalRequest: {
                    method: 'GET',
                    header: [{ key: 'Accept', value: 'application/json' }],
                    url: {
                      raw: '{{baseUrl}}/users?role=admin',
                      host: ['{{baseUrl}}'],
                      path: ['users'],
                      query: [{ key: 'role', value: 'admin' }]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "admin",\n  "users": [\n    "alice",\n    "bob"\n  ]\n}'
                },
                {
                  name: 'User list',
                  originalRequest: {
                    method: 'GET',
                    header: [{ key: 'Accept', value: 'application/json' }],
                    url: {
                      raw: '{{baseUrl}}/users?role=user',
                      host: ['{{baseUrl}}'],
                      path: ['users'],
                      query: [{ key: 'role', value: 'user' }]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "user",\n  "users": [\n    "carol"\n  ]\n}'
                },
                {
                  name: 'User list',
                  originalRequest: {
                    method: 'GET',
                    header: [{ key: 'Accept', value: 'application/json' }],
                    url: {
                      raw: '{{baseUrl}}/users?role=guest',
                      host: ['{{baseUrl}}'],
                      path: ['users'],
                      query: [{ key: 'role', value: 'guest' }]
                    }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "guest",\n  "users": [\n    "dave"\n  ]\n}'
                }
              ]
            }
          ]
        }
      ],
      variable: [{ key: 'baseUrl', value: 'https://api.example.com', type: 'any' }]
    }
  }
};
