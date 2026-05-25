// Bundle rules for OpenAPI 3.2.
//
// 3.2 keeps the same component containers introduced in 3.1 (notably
// `pathItems` and the JSON Schema 2020-12 keywords). New 3.2-only top-level
// containers (e.g. `additionalOperations`-style fields) are forward-compatible
// with the 3.1 rules — referencing them does not require new container
// definitions for the bundler to work.
//
// Rules are mirrored here (rather than re-exported) so future 3.2-only
// containers can be added without touching the 3.1 rules.
const SCHEMA_CONTAINERS = [
    'allOf',
    'oneOf',
    'anyOf',
    'not',
    'additionalProperties',
    'items',
    'schema'
  ],
  EXAMPLE_CONTAINERS = [
  ],
  REQUEST_BODY_CONTAINER = [
    'requestBody'
  ],
  CONTAINERS = {
    schemas: SCHEMA_CONTAINERS,
    examples: EXAMPLE_CONTAINERS,
    requestBodies: REQUEST_BODY_CONTAINER
  },
  DEFINITIONS = {
    headers: 'headers',
    responses: 'responses',
    callbacks: 'callbacks',
    properties: 'schemas',
    links: 'links',
    paths: 'pathItems',
    examples: 'examples'
  },
  INLINE = [
    'properties',
    'value',
    'example'
  ],
  ROOT_CONTAINERS_KEYS = [
    'components'
  ],
  COMPONENTS_KEYS = [
    'schemas',
    'responses',
    'parameters',
    'examples',
    'requestBodies',
    'headers',
    'securitySchemes',
    'links',
    'callbacks',
    'pathItems'
  ];

module.exports = {
  RULES_32: {
    CONTAINERS,
    DEFINITIONS,
    COMPONENTS_KEYS,
    INLINE,
    ROOT_CONTAINERS_KEYS
  }
};
