/* eslint-disable max-len */
module.exports = {
  requestAdditionTest: {
    baseCollection: {
      item: [
        {
          name: 'api',
          description: '',
          item: [
            {
              name: 'auth',
              description: '',
              item: [
                {
                  name: 'introspect',
                  description: '',
                  item: [
                    {
                      id: '722149c9-9001-4dda-bb96-839441fe1bef',
                      name: 'Performs introspection of the provided Bearer JWT token',
                      request: {
                        name: 'Performs introspection of the provided Bearer JWT token',
                        description: {},
                        url: {
                          path: ['api', 'auth', 'introspect'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        method: 'GET',
                        body: {},
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          id: 'c25963d1-ef3f-4a55-bdf7-c0859a411bdb',
                          name: 'Introspection object',
                          originalRequest: {
                            url: {
                              path: ['api', 'auth', 'introspect'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Features": [\n    "itemusages",\n    "signinattempts"\n  ],\n  "IssuedAt": "2020-06-11T16:32:50-03:00",\n  "UUID": "aliqua exercitation esse"\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '7be58939-f825-44cc-a794-bbde1a604acd',
                          name: 'Unauthorized',
                          originalRequest: {
                            url: {
                              path: ['api', 'auth', 'introspect'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'Unauthorized',
                          code: 401,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ad"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '58b825bd-5c03-44f4-93d0-ce79ceab7f46',
                          name: 'Generic error',
                          originalRequest: {
                            url: {
                              path: ['api', 'auth', 'introspect'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'Internal Server Error',
                          code: 500,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ad"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        }
                      ],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            },
            {
              name: 'v1',
              description: '',
              item: [
                {
                  name: 'itemusages',
                  description: '',
                  item: [
                    {
                      id: '6c6f9d24-ac2d-44bb-8799-58a7ad7a4435',
                      name: 'Retrieves item usages',
                      request: {
                        name: 'Retrieves item usages',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *itemusages* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'itemusages'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
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
                        method: 'POST',
                        body: {
                          mode: 'raw',
                          raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                },
                {
                  name: 'signinattempts',
                  description: '',
                  item: [
                    {
                      id: 'f6e8490a-8239-4ca9-817d-8171442589b8',
                      name: 'Retrieves sign-in attempts',
                      request: {
                        name: 'Retrieves sign-in attempts',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *signinattempts* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'signinattempts'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
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
                        method: 'POST',
                        body: {
                          mode: 'raw',
                          raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          id: 'a498c0d3-3e59-4eb8-9783-f1cf4e9f73bf',
                          name: 'Continuing cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "items": [\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "cillum consequat id ullamco"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "bkDV8Mf9z8@pgYPAnzSOPDzSHzZ.gv",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    },\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "fugiat consequat mollit"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "D0jpIt2aH0cRcs@uGdpwXNZGIqQLdXPhdD.czzm",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    }\n  ],\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK",\n  "has_more": true\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: 'a4c026f2-2e2e-4179-bd2c-7cd51c5020f0',
                          name: 'Resetting cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "limit": 100,\n  "start_time": "2021-06-11T16:32:50-03:00"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "items": [\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "cillum consequat id ullamco"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "bkDV8Mf9z8@pgYPAnzSOPDzSHzZ.gv",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    },\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "fugiat consequat mollit"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "D0jpIt2aH0cRcs@uGdpwXNZGIqQLdXPhdD.czzm",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    }\n  ],\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK",\n  "has_more": true\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: 'c9c3defd-1142-460a-8805-26293a390454',
                          name: 'Resetting cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "limit": 100,\n  "start_time": "2021-06-11T16:32:50-03:00"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'Unauthorized',
                          code: 401,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ad"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: 'b521b022-aedb-434c-b92a-9447b1d44ab3',
                          name: 'Continuing cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'Internal Server Error',
                          code: 500,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ad"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        }
                      ],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      event: [],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://events.1password.com'
        }
      ],
      info: {
        _postman_id: 'b6423c2a-2593-42ed-9b50-2df223461aa2',
        name: 'Events API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: '1Password Events API Specification.',
          type: 'text/plain'
        }
      }
    },
    updatedCollection: {
      item: [
        {
          name: 'api',
          description: '',
          item: [
            {
              name: 'auth',
              description: '',
              item: [
                {
                  name: 'introspect',
                  description: '',
                  item: [
                    {
                      id: 'fb513e29-fe7b-4ce2-92cf-73cf729825c2',
                      name: 'Performs introspection of the provided Bearer JWT token',
                      request: {
                        name: 'Performs introspection of the provided Bearer JWT token',
                        description: {},
                        url: {
                          path: ['api', 'auth', 'introspect'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        method: 'GET',
                        body: {},
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            },
            {
              name: 'v1',
              description: '',
              item: [
                {
                  name: 'itemusages',
                  description: '',
                  item: [
                    {
                      id: '1620e9cd-0780-4776-978e-3e5a36e049b8',
                      name: 'Retrieves item usages',
                      request: {
                        name: 'Retrieves item usages',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *itemusages* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'itemusages'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
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
                        method: 'POST',
                        body: {
                          mode: 'raw',
                          raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                },
                {
                  name: 'signinattempts',
                  description: '',
                  item: [
                    {
                      id: '4780e197-3070-4d9c-8fae-a4e16fdfab9d',
                      name: 'Retrieves sign-in attempts',
                      request: {
                        name: 'Retrieves sign-in attempts',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *signinattempts* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'signinattempts'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        method: 'GET', // This this the new request with GET method instead of POST
                        body: {},
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          id: 'e4565056-4bb4-4b3c-ab91-ff737c7a50e6',
                          name: 'Sign-in attempts response object',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "items": [\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "pariatur proident Excepteur"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "qy5Ri@zejxZBYAeMq.deet",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    },\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "occaecat esse"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "yWPJ1ToNN@BTMUAsuoUqXrYcWQHm.sbv",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    }\n  ],\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK",\n  "has_more": true\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: 'bcf7837a-4ea8-41ae-9fb1-7aa687237a15',
                          name: 'Generic error',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'Internal Server Error',
                          code: 500,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "elit ad cupidatat"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        }
                      ],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      event: [],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://events.1password.com'
        }
      ],
      info: {
        _postman_id: 'fc1faf5e-d500-43bc-a82c-6452ec86bc5a',
        name: 'Events API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: '1Password Events API Specification.',
          type: 'text/plain'
        }
      }
    },
    addedRequestId: '4780e197-3070-4d9c-8fae-a4e16fdfab9d',
    previousRequestId: 'f6e8490a-8239-4ca9-817d-8171442589b8'
  },

  requestBodyUpdateTest: {
    collectionToBeMerged: {
      item: [
        {
          name: 'api',
          description: '',
          item: [
            {
              name: 'auth',
              description: '',
              item: [
                {
                  name: 'introspect',
                  description: '',
                  item: [
                    {
                      id: '9423cdb5-cbed-4664-acf8-5654caef8800',
                      name: 'Performs introspection of the provided Bearer JWT token',
                      request: {
                        name: 'Performs introspection of the provided Bearer JWT token',
                        description: {},
                        url: {
                          path: ['api', 'auth', 'introspect'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        method: 'GET',
                        body: {},
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            },
            {
              name: 'v1',
              description: '',
              item: [
                {
                  name: 'itemusages',
                  description: '',
                  item: [
                    {
                      id: 'f5978088-d965-474e-bd8d-2469c3bffafd',
                      name: 'Retrieves item usages',
                      request: {
                        name: 'Retrieves item usages',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *itemusages* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'itemusages'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
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
                        method: 'POST',
                        body: {
                          mode: 'raw',
                          raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                },
                {
                  name: 'signinattempts',
                  description: '',
                  item: [
                    {
                      id: '69e2efe7-0f02-4935-89e6-72e059e13eb7',
                      name: 'Retrieves sign-in attempts',
                      request: {
                        name: 'Retrieves sign-in attempts',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *signinattempts* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'signinattempts'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        method: 'GET',
                        body: {},
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          id: 'e9ba59ef-6db6-4270-99ad-9e8ae23ac54f',
                          name: 'Sign-in attempts response object',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "items": [\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "est dolor ut exercitation"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "H-fG1IFepDt@glheYeLxBPxxKiofuCaPRiOrPugtzf.zfd",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    },\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "nostrud laborum ut irure"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "Xv97WnOmg@lFCVZxQP.gkg",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    }\n  ],\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK",\n  "has_more": false\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '1d7dcc76-2ccd-43fc-8ca3-4b547968671b',
                          name: 'Generic error',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'Internal Server Error',
                          code: 500,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "anim"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        }
                      ],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      event: [],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://events.1password.com'
        }
      ],
      info: {
        _postman_id: '1ecbc13b-a25b-4d16-a84e-fbdd9bfbbe67',
        name: 'Events API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: '1Password Events API Specification.',
          type: 'text/plain'
        }
      }
    },
    collToBeSynced: {
      item: [
        {
          name: 'api',
          description: '',
          item: [
            {
              name: 'auth',
              description: '',
              item: [
                {
                  name: 'introspect',
                  description: '',
                  item: [
                    {
                      id: 'afc52273-0180-4e2a-a6d5-adac7d80643c',
                      name: 'Performs introspection of the provided Bearer JWT token',
                      request: {
                        name: 'Performs introspection of the provided Bearer JWT token',
                        description: {},
                        url: {
                          path: ['api', 'auth', 'introspect'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        method: 'GET',
                        body: {},
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          id: '3b616451-3438-4e9d-b163-7636eaf5bffd',
                          name: 'Introspection object',
                          originalRequest: {
                            url: {
                              path: ['api', 'auth', 'introspect'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Features": [\n    "itemusages",\n    "signinattempts"\n  ],\n  "IssuedAt": "2020-06-11T16:32:50-03:00",\n  "UUID": -26239717\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '1ee0b5d5-7991-45a4-a888-25dd37f35226',
                          name: 'Unauthorized',
                          originalRequest: {
                            url: {
                              path: ['api', 'auth', 'introspect'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'Unauthorized',
                          code: 401,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ex quis"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '70c21198-d40a-44ca-8724-e3002a2c3299',
                          name: 'Generic error',
                          originalRequest: {
                            url: {
                              path: ['api', 'auth', 'introspect'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'Internal Server Error',
                          code: 500,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ex quis"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        }
                      ],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            },
            {
              name: 'v1',
              description: '',
              item: [
                {
                  name: 'itemusages',
                  description: '',
                  item: [
                    {
                      id: '5b160b7c-a40d-40dd-ad0c-da879346751d',
                      name: 'Retrieves item usages', // Updated request body
                      request: {
                        name: 'Retrieves item usages',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *itemusages* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'itemusages'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
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
                        method: 'POST',
                        body: {
                          mode: 'raw',
                          raw: '{\n  "cursor": "this is updated value"\n}',
                          options: {
                            raw: {
                              headerFamily: 'json',
                              language: 'json'
                            }
                          }
                        },
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          id: 'c5ffc01d-0f7b-4f47-8bac-75f77671d1b9',
                          name: 'Continuing cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'itemusages'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "items": [\n    {\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "in non ipsum ut"\n      },\n      "item_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "used_version": -50711757,\n      "user": {\n        "email": "Q7vNydI2fv42uw@BBNNzqnnoDzDdWIsDyxqCwiiT.fe",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "vault_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    },\n    {\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "do ea elit ad"\n      },\n      "item_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "used_version": 63518247,\n      "user": {\n        "email": "V-4@NcEqCUwxrJVBVqYndgwsbIMNvByaJL.gxgp",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "vault_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    }\n  ],\n  "cursor": 64717616,\n  "has_more": false\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '4c49a355-fea0-4df4-a3a2-da39ce592864',
                          name: 'Resetting cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'itemusages'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "limit": 100,\n  "start_time": "2021-06-11T16:32:50-03:00"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "items": [\n    {\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "in non ipsum ut"\n      },\n      "item_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "used_version": -50711757,\n      "user": {\n        "email": "Q7vNydI2fv42uw@BBNNzqnnoDzDdWIsDyxqCwiiT.fe",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "vault_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    },\n    {\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "do ea elit ad"\n      },\n      "item_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "used_version": 63518247,\n      "user": {\n        "email": "V-4@NcEqCUwxrJVBVqYndgwsbIMNvByaJL.gxgp",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "vault_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    }\n  ],\n  "cursor": 64717616,\n  "has_more": false\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '4209f6d0-b633-4331-a9a7-3ee7db3569f1',
                          name: 'Resetting cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'itemusages'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "limit": 100,\n  "start_time": "2021-06-11T16:32:50-03:00"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'Unauthorized',
                          code: 401,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ex quis"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '5b86f24c-b82d-47bc-a8b5-bd43999e68ca',
                          name: 'Continuing cursor',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'itemusages'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Content-Type',
                                value: 'application/json'
                              },
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'POST',
                            body: {
                              mode: 'raw',
                              raw: '{\n  "cursor": "aGVsbG8hIGlzIGl0IG1lIHlvdSBhcmUgbG9va2luZyBmb3IK"\n}',
                              options: {
                                raw: {
                                  headerFamily: 'json',
                                  language: 'json'
                                }
                              }
                            }
                          },
                          status: 'Internal Server Error',
                          code: 500,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ex quis"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        }
                      ],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                },
                {
                  name: 'signinattempts',
                  description: '',
                  item: [
                    {
                      id: 'c36920f8-55d8-4f8a-9f36-5770bf661df6',
                      name: 'Retrieves sign-in attempts',
                      request: {
                        name: 'Retrieves sign-in attempts',
                        description: {
                          content: 'This endpoint requires your JSON Web Token to have the *signinattempts* feature.',
                          type: 'text/plain'
                        },
                        url: {
                          path: ['api', 'v1', 'signinattempts'],
                          host: ['{{baseUrl}}'],
                          query: [],
                          variable: []
                        },
                        header: [
                          {
                            key: 'Accept',
                            value: 'application/json'
                          }
                        ],
                        method: 'GET',
                        body: {},
                        auth: {
                          type: 'bearer',
                          bearer: [
                            {
                              key: 'token',
                              value: '{{bearerToken}}'
                            }
                          ]
                        }
                      },
                      response: [
                        {
                          id: '5c83e506-1430-4c75-9891-b2c0b89b1e8f',
                          name: 'Sign-in attempts response object',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'OK',
                          code: 200,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "items": [\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "consectetur mollit"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "dBt@PqAapAiOVMTVgmxDPAbJcH.xyx",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    },\n    {\n      "category": "firewall_failed",\n      "client": {\n        "app_name": "1Password Extension",\n        "app_version": "20127",\n        "ip_address": "13.227.95.22",\n        "os_name": "MacOSX",\n        "os_version": "10.15.6",\n        "platform_name": "Chrome",\n        "platform_version": "velit elit commodo dolore reprehenderit"\n      },\n      "country": "France",\n      "details": {\n        "value": "Europe"\n      },\n      "session_uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E",\n      "target_user": {\n        "email": "emyjSgV9HBp6uIr@TAiMVaAilOtWDVmWlEHgsL.oqgu",\n        "name": "Jack O\'Neill",\n        "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n      },\n      "timestamp": "2020-06-11T16:32:50-03:00",\n      "type": "continent_blocked",\n      "uuid": "56YE2TYN2VFYRLNSHKPW5NVT5E"\n    }\n  ],\n  "cursor": -65627834,\n  "has_more": false\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        },
                        {
                          id: '39f7d5ef-2e3e-45ca-80e3-d63f3c247582',
                          name: 'Generic error',
                          originalRequest: {
                            url: {
                              path: ['api', 'v1', 'signinattempts'],
                              host: ['{{baseUrl}}'],
                              query: [],
                              variable: []
                            },
                            header: [
                              {
                                key: 'Accept',
                                value: 'application/json'
                              },
                              {
                                description: {
                                  content: 'Added as a part of security scheme: bearer',
                                  type: 'text/plain'
                                },
                                key: 'Authorization',
                                value: 'Bearer <token>'
                              }
                            ],
                            method: 'GET',
                            body: {}
                          },
                          status: 'Internal Server Error',
                          code: 500,
                          header: [
                            {
                              key: 'Content-Type',
                              value: 'application/json'
                            }
                          ],
                          body: '{\n  "Error": {\n    "Message": "ex quis"\n  }\n}',
                          cookie: [],
                          _postman_previewlanguage: 'json'
                        }
                      ],
                      event: [],
                      protocolProfileBehavior: {
                        disableBodyPruning: true
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      event: [],
      variable: [
        {
          key: 'baseUrl',
          value: 'https://events.1password.com'
        }
      ],
      info: {
        _postman_id: 'a21a9336-a730-4884-aa67-c388d6aef013',
        name: 'Events API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: '1Password Events API Specification.',
          type: 'text/plain'
        }
      }
    },
    updatedRequestIdInBaseCollection: 'f5978088-d965-474e-bd8d-2469c3bffafd',
    updatedRequestIdInUpdatedCollection: '5b160b7c-a40d-40dd-ad0c-da879346751d'
  },

  requestQueryParamRemoveAndAddTest: {
    collectionToBeMerged: {
      item: [
        {
          name: 'pets',
          description: '',
          item: [
            {
              id: 'd2a97631-e04c-424b-acda-f58e58f31782',
              name: 'List all pets',
              request: {
                name: 'List all pets',
                description: {},
                url: {
                  path: ['pets'],
                  host: ['{{baseUrl}}'],
                  query: [
                    {
                      disabled: false,
                      description: {
                        content: 'How many items to return at one time (max 100)',
                        type: 'text/plain'
                      },
                      key: 'limit1',
                      value: '-67329504'
                    }
                  ],
                  variable: []
                },
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                method: 'GET',
                body: {},
                auth: null
              },
              response: [],
              event: [],
              protocolProfileBehavior: {
                disableBodyPruning: true
              }
            }
          ]
        }
      ],
      event: [],
      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1'
        }
      ],
      info: {
        _postman_id: 'b78fc20c-d9af-43d8-8faf-e9b3861a1bd5',
        name: 'Swagger Petstore',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: '',
          type: 'text/plain'
        }
      }
    },
    collectionToBeSynced: {
      item: [
        {
          name: 'pets',
          description: '',
          item: [
            {
              id: '3ed16d1f-8fec-47dd-8dc0-6ce273d71bbb',
              name: 'List all pets',
              request: {
                name: 'List all pets',
                description: {},
                url: {
                  path: ['pets'],
                  host: ['{{baseUrl}}'],
                  query: [
                    {
                      disabled: false,
                      description: {
                        content: 'How many items to return at one time (max 100)',
                        type: 'text/plain'
                      },
                      key: 'limit1',
                      value: '-67329504'
                    },
                    {
                      disabled: false,
                      description: {
                        content: 'This is new query param',
                        type: 'text/plain'
                      },
                      key: 'limit2',
                      value: 'deserunt'
                    }
                  ],
                  variable: []
                },
                header: [
                  {
                    key: 'Accept',
                    value: 'application/json'
                  }
                ],
                method: 'GET',
                body: {},
                auth: null
              },
              response: [],
              event: [],
              protocolProfileBehavior: {
                disableBodyPruning: true
              }
            }
          ]
        }
      ],
      event: [],
      variable: [
        {
          key: 'baseUrl',
          value: 'http://petstore.swagger.io/v1'
        }
      ],
      info: {
        _postman_id: '3761e805-5902-4b72-a5e7-84dcc91ad60d',
        name: 'Swagger Petstore',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        description: {
          content: '',
          type: 'text/plain'
        }
      }
    },
    updatedRequestIdInCollectionToBeMerged: 'd2a97631-e04c-424b-acda-f58e58f31782',
    updatedRequestIdInCollectionToBeSynced: '3ed16d1f-8fec-47dd-8dc0-6ce273d71bbb'
  }
};
