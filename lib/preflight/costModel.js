/**
 * @fileOverview Static cost model for OpenAPI schema faking.
 *
 * This module answers one question without ever running the converter:
 *
 *   "If `libV2/CollectionGeneration/schemaUtils.js` were asked to resolve and fake this schema,
 *    how many value nodes would json-schema-faker produce, and how many bytes would
 *    `JSON.stringify(value, null, indentCharacter)` be?"
 *
 * It is a read-only walk of the raw `$ref` graph. It never mutates the spec and never calls
 * into the conversion path.
 *
 * The rules mirrored here (all from libV2/CollectionGeneration/schemaUtils.js unless noted):
 *
 *  1. `optionalsProbability: 1.0` module option -> every declared property materialises.
 *  2. `getRefStackLimit` -> `max(stackLimit, REF_STACK_LIMIT=30)` frames of `_resolveSchema`;
 *     beyond that the subtree collapses to `{ value: ERR_TOO_MANY_LEVELS }`.
 *  3. Cycle breaking: a `$ref` already on the current resolution path collapses to
 *     `{ value: '<Circular reference to ... detected>' }`.
 *  4. `fakeSchema` stringifies the *resolved* schema and, when that exceeds
 *     `SCHEMA_SIZE_OPTIMIZATION_THRESHOLD` (50 KB), sets `defaultMinItems = defaultMaxItems = 1`
 *     (`restrictArrayItems`). Otherwise both are 2.
 *  5. Array length is decided by json-schema-faker's `arrayType` (assets/json-schema-faker.js),
 *     which is reproduced exactly in `arrayLength()` below. Notably a declared `maxItems` is
 *     *not* bounded by `defaultMaxItems`, but it *is* bounded by the module's `maxItems: 20`.
 *  6. `anyOf`/`oneOf` resolve to element 0 for CONVERSION.
 *  7. `parametersResolution: 'schema'` makes `_resolveSchema` stamp `default: '<type>'` on
 *     scalar leaves, which json-schema-faker then returns verbatim (`useDefaultValue`).
 *
 * @module lib/preflight/costModel
 */

const _ = require('lodash'),

  /** Matches REF_STACK_LIMIT in libV2/CollectionGeneration/schemaUtils.js */
  REF_STACK_LIMIT = 30,

  /** Matches SCHEMA_SIZE_OPTIMIZATION_THRESHOLD in libV2/CollectionGeneration/schemaUtils.js */
  SCHEMA_SIZE_OPTIMIZATION_THRESHOLD = 50 * 1024,

  /** Matches the module level `schemaFaker.option({ maxItems: 20 })` block */
  FAKER_MAX_ITEMS = 20,

  /** Matches the module level `schemaFaker.option({ minItems: 1 })` block */
  FAKER_MIN_ITEMS = 1,

  ERR_TOO_MANY_LEVELS = '<Error: Too many levels of nesting to fake this schema>',

  /**
   * json-schema-faker's `thunkGenerator` falls back to the literal word "string" (its
   * `wordsGenerator` is patched to return `['string']`), padded up to `minLength`.
   */
  FAKED_WORD_LENGTH = 6,

  /**
   * Byte cost of a faked value for each `format`, measured against
   * assets/json-schema-faker.js `generateFormat`. Includes the two JSON quotes.
   */
  FORMAT_BYTES = {
    'date-time': 26,
    date: 12,
    time: 10,
    uuid: 38,
    uid: 38,
    email: 22,
    hostname: 16,
    uri: 30,
    url: 30,
    'uri-reference': 30,
    'uri-template': 30,
    ipv4: 17,
    ipv6: 41,
    byte: 10,
    binary: 10,
    password: 10,
    regex: 10,
    int64: 12,
    int32: 8,
    'json-pointer': 12,
    base64: 14,
    'http-status-code': 5
  },

  /** A `pattern` is expanded by randexp; measured mean over this corpus is ~10 chars. */
  PATTERN_BYTES = 12,

  INTEGER_BYTES = 11,
  NUMBER_BYTES = 18,
  BOOLEAN_BYTES = 4.5,
  NULL_BYTES = 4,

  /**
   * `<integer>`, `<string>` etc. stamped by `_resolveSchema` when
   * `parametersResolution === 'schema'`. Mirrors that module's `typesMap`.
   */
  TYPES_MAP = {
    integer: { int32: '<integer>', int64: '<long>' },
    number: { float: '<float>', double: '<double>' },
    string: {
      byte: '<byte>',
      binary: '<binary>',
      date: '<date>',
      'date-time': '<dateTime>',
      password: '<password>'
    },
    boolean: '<boolean>',
    array: '<array>',
    object: '<object>'
  },

  /**
   * Formats that `_resolveSchema` deletes off a property before faking, so they never reach
   * json-schema-faker.
   */
  DROPPED_PROPERTY_FORMATS = ['decimal', 'byte', 'password', 'unix-time'],

  /** Formats supported by both ajv and json-schema-faker; anything else is deleted. */
  SUPPORTED_FORMATS = [
    'date', 'time', 'date-time', 'uri', 'uri-reference', 'uri-template', 'email', 'hostname',
    'ipv4', 'ipv6', 'regex', 'uuid', 'uid', 'binary', 'json-pointer', 'base64', 'int64', 'int32',
    'float', 'double', 'url', 'http-status-code', 'byte', 'password'
  ],

  /**
   * When a schema only allows additional properties, json-schema-faker's `objectType` fills
   * `random.number(1, random.number(1, 5))` synthetic `key_N` properties. Mean ~2.
   */
  ADDITIONAL_PROPS_KEYS = 2,
  ADDITIONAL_PROPS_KEY_LENGTH = 5,

  /*
   * ------------------------------------------------------------------------------------------
   * Time model.
   *
   *   projectedMs = MS_PER_VALUE_NODE      * nodes
   *               + MS_PER_STRUCTURAL_NODE * structuralNodes
   *               + MS_PER_OUTPUT_BYTE     * prettyBytes
   *
   * A flat cost-per-node model is wrong by ~40x across this corpus (1.1 us/node for an
   * array-fan-out-dominated body, 43 us/node for a small broad one): a `traverse()` call over
   * a *distinct* subschema is far dearer than the 2nd..20th repeat of an identical array item,
   * because `objectType` shuffles, filters and rebuilds the property list every time it meets
   * a new object shape. Splitting the two, plus a serialisation term, brings the worst
   * over/under-prediction over twelve measured points down to 1.43x.
   *
   * Fitted (minimax over log error) on this machine against:
   *   - resolve + fake + stringify of one component schema: KPIVisual 93 ms,
   *     PivotTableVisual 69 ms, InsightVisual 386 ms, Visual 1963 ms
   *   - end-to-end `convertV2` on single paths / operations, minus the ~21 ms spec
   *     parse+validate floor: 13, 17, 19, 421, 449, 468, 525 and 9581 ms
   * spanning 13 ms to 9.6 s. MS_PER_OUTPUT_BYTE was constrained to the directly measured
   * `JSON.stringify(v, null, '  ')` throughput (25.6 MB in 70-77 ms, i.e. ~350 MB/s).
   * ------------------------------------------------------------------------------------------
   */

  /** Marginal cost of one json-schema-faker `traverse()` call, in milliseconds. */
  MS_PER_VALUE_NODE = 0.00125,

  /**
   * Extra cost of a `traverse()` call over a subschema that is *not* just an array repeat,
   * in milliseconds. `structuralNodes` counts the schema tree with every array length forced
   * to 1, so this term isolates distinct-shape work from fan-out.
   */
  MS_PER_STRUCTURAL_NODE = 0.0445,

  /**
   * Cost of serialising one byte of the faked value with `JSON.stringify(v, null, '  ')`,
   * in milliseconds.
   */
  MS_PER_OUTPUT_BYTE = 0.0000035,

  /** V8's maximum string length on 64-bit builds; `JSON.stringify` throws past this. */
  MAX_STRING_LENGTH = 0x1fffffe8,

  /**
   * Reproduces the array length decision in assets/json-schema-faker.js `arrayType`,
   * given the module level options (`minItems: 1`, `maxItems: 20`, `optionalsProbability: 1.0`)
   * and the per-call `defaultMinItems` / `defaultMaxItems` set by `fakeSchema`.
   *
   * @param {Object} schema - the array schema (raw, as authored)
   * @param {Number} defaultMinItems - 1 when restrictArrayItems, else 2
   * @param {Number} defaultMaxItems - 1 when restrictArrayItems, else 2
   * @returns {Number} number of items json-schema-faker will generate
   */
  arrayLength = (schema, defaultMinItems, defaultMaxItems) => {
    let minItems = schema.minItems,
      maxItems = schema.maxItems;

    // Override minItems to defaultMinItems if no minItems present
    if (typeof minItems !== 'number' && maxItems && maxItems >= defaultMinItems) {
      minItems = defaultMinItems;
    }

    // Override maxItems to minItems if minItems is available
    if (typeof minItems === 'number' && minItems > 0) {
      maxItems = minItems;
    }

    // If no maxItems is defined then override with defaultMaxItems
    if (typeof maxItems !== 'number') {
      maxItems = defaultMaxItems;
    }

    if (minItems === undefined) {
      minItems = maxItems ? Math.min(FAKER_MIN_ITEMS, maxItems) : FAKER_MIN_ITEMS;
    }

    // Don't allow max items above the module maximum
    if (maxItems && maxItems > FAKER_MAX_ITEMS) {
      maxItems = FAKER_MAX_ITEMS;
    }

    // length = Math.round(maxItems * optionalsProbability), optionalsProbability === 1.0
    return Math.max(0, Math.round(maxItems));
  };

/**
 * A value-cost record describes the faked value for one resolved subschema.
 *
 * `prettyBytes` is depth dependent, so it is stored decomposed:
 *   bytes at depth d  =  compactBytes + prettyExtra + INDENT_WIDTH * d * indentSlots
 *
 * which lets a record be memoised once and reused at any depth.
 *
 * @typedef {Object} ValueCost
 * @property {Number} nodes - json-schema-faker `traverse()` calls (the time proxy)
 * @property {Number} compactBytes - `JSON.stringify(value).length`
 * @property {Number} prettyExtra - extra bytes of pretty printing, with this node at depth 0
 * @property {Number} indentSlots - number of indented lines, with this node at depth 0
 */

const LEAF = (bytes) => {
    return { nodes: 1, structuralNodes: 1, compactBytes: bytes, prettyExtra: 0, indentSlots: 0 };
  },

  /**
   * Cost of a `{ value: '<...>' }` sentinel leaf (circular reference / too many levels).
   * json-schema-faker has no `type` to act on and returns the object verbatim.
   *
   * @param {String} message - the sentinel string
   * @returns {ValueCost} cost record
   */
  SENTINEL = (message) => {
    const compactBytes = 2 + ('value'.length + 3) + (message.length + 2);

    return {
      nodes: 2,
      structuralNodes: 2,
      compactBytes,
      // one child line (+1 for the space after ':') plus the closing brace line
      prettyExtra: (1 + 2 + 1) + 1,
      indentSlots: 2
    };
  };

module.exports = {
  REF_STACK_LIMIT,
  SCHEMA_SIZE_OPTIMIZATION_THRESHOLD,
  FAKER_MAX_ITEMS,
  FAKER_MIN_ITEMS,
  ERR_TOO_MANY_LEVELS,
  FAKED_WORD_LENGTH,
  FORMAT_BYTES,
  PATTERN_BYTES,
  INTEGER_BYTES,
  NUMBER_BYTES,
  BOOLEAN_BYTES,
  NULL_BYTES,
  TYPES_MAP,
  DROPPED_PROPERTY_FORMATS,
  SUPPORTED_FORMATS,
  ADDITIONAL_PROPS_KEYS,
  ADDITIONAL_PROPS_KEY_LENGTH,
  MS_PER_VALUE_NODE,
  MS_PER_STRUCTURAL_NODE,
  MS_PER_OUTPUT_BYTE,
  MAX_STRING_LENGTH,
  arrayLength,
  LEAF,
  SENTINEL,
  isPlainObject: (value) => { return _.isPlainObject(value); }
};
