/*
  Regression test for the same-code response "collapse" bug.

  When a spec has multiple examples under one status code (here two `200` examples, `admin` and `user`),
  generation produces two saved responses sharing code 200. Previously the spec -> collection sync indexed
  existing responses by status code into a SINGLE slot, so both incoming responses merged into the first
  saved response (last-wins): `admin`'s edit was lost and the second saved response went stale.

  With per-code positional pairing, each incoming response maps to its own saved response, so editing both
  `200` examples in the spec correctly updates both saved responses.
*/
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Collapse Repro',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'https://api.example.com'
    }
  ],
  paths: {
    '/users': {
      post: {
        summary: 'List users',
        requestBody: {
          content: {
            'application/json': {
              examples: {
                admin: { value: { q: 'admin' } },
                user: { value: { q: 'user' } }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                examples: {
                  admin: { value: { role: 'ADMIN-EDITED' } },
                  user: { value: { role: 'USER-EDITED' } }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Same spec shape but with the original (pre-edit) response example values.
const initialSpec = JSON.parse(JSON.stringify(spec));

initialSpec.paths['/users'].post.responses[200].content['application/json'].examples.admin.value.role = 'old-admin';
initialSpec.paths['/users'].post.responses[200].content['application/json'].examples.user.value.role = 'old-user';

module.exports = {
  name: 'should pair multiple same-code response examples positionally instead of collapsing them on sync',
  specificationType: 'OPENAPI:3.0',
  generationOptions: {
    parametersResolution: 'Example'
  },
  syncOptions: {
    syncExamples: true
  },
  shouldGenerateCollection: false,
  initialState: {
    spec: initialSpec,
    collection: {
      info: {
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: 'List users',
              request: {
                method: 'POST',
                header: [
                  { key: 'Content-Type', value: 'application/json' },
                  { key: 'Accept', value: 'application/json' }
                ],
                body: {
                  mode: 'raw',
                  raw: '{\n  "q": "admin"\n}',
                  options: { raw: { headerFamily: 'json', language: 'json' } }
                },
                url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] }
              },
              response: [
                {
                  name: 'OK',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      { key: 'Content-Type', value: 'application/json' },
                      { key: 'Accept', value: 'application/json' }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "q": "admin"\n}',
                      options: { raw: { headerFamily: 'json', language: 'json' } }
                    },
                    url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "old-admin"\n}'
                },
                {
                  name: 'OK',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      { key: 'Content-Type', value: 'application/json' },
                      { key: 'Accept', value: 'application/json' }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "q": "user"\n}',
                      options: { raw: { headerFamily: 'json', language: 'json' } }
                    },
                    url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "old-user"\n}'
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
    spec,
    collection: {
      info: {
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: [
        {
          name: 'users',
          item: [
            {
              name: 'List users',
              request: {
                method: 'POST',
                header: [
                  { key: 'Content-Type', value: 'application/json' },
                  { key: 'Accept', value: 'application/json' }
                ],
                body: {
                  mode: 'raw',
                  raw: '{\n  "q": "admin"\n}',
                  options: { raw: { headerFamily: 'json', language: 'json' } }
                },
                url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] }
              },
              response: [
                {
                  name: 'OK',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      { key: 'Content-Type', value: 'application/json' },
                      { key: 'Accept', value: 'application/json' }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "q": "admin"\n}',
                      options: { raw: { headerFamily: 'json', language: 'json' } }
                    },
                    url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "ADMIN-EDITED"\n}'
                },
                {
                  name: 'OK',
                  originalRequest: {
                    method: 'POST',
                    header: [
                      { key: 'Content-Type', value: 'application/json' },
                      { key: 'Accept', value: 'application/json' }
                    ],
                    body: {
                      mode: 'raw',
                      raw: '{\n  "q": "user"\n}',
                      options: { raw: { headerFamily: 'json', language: 'json' } }
                    },
                    url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] }
                  },
                  status: 'OK',
                  code: 200,
                  _postman_previewlanguage: 'json',
                  _postman_previewtype: 'html',
                  header: [{ key: 'Content-Type', value: 'application/json' }],
                  cookie: [],
                  body: '{\n  "role": "USER-EDITED"\n}'
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
