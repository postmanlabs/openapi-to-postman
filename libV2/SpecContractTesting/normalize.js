// Normalisation: makes different spellings of the same API shape look alike to the linking rules,
// e.g. `people` and `person`, `{ items: [...] }` and `[...]`, `type: [string, null]` and `string`.
const _ = require('lodash'),

  IRREGULAR_PLURALS = {
    people: 'person', children: 'child', men: 'man', women: 'woman', mice: 'mouse', geese: 'goose',
    feet: 'foot', teeth: 'tooth', indices: 'index', matrices: 'matrix', vertices: 'vertex',
    criteria: 'criterion', statuses: 'status', aliases: 'alias', buses: 'bus', quizzes: 'quiz'
  },

  // Properties that wrap the real payload: `{ data: ... }`, `{ items: [...] }`, HAL `_embedded`.
  WRAPPER_KEYS = ['data', 'items', 'results', 'result', 'records', 'payload', 'content', '_embedded'],

  isContainer = (schema) => {
    return Boolean(schema) &&
      (schema.type === 'object' || schema.type === 'array' || Boolean(schema.properties) || Boolean(schema.items));
  },

  /**
   * Lower-case alphanumerics only, so `petId`, `pet_id` and `PetID` compare equal.
   *
   * @param {String} name - name
   * @returns {String} normalised name
   */
  normalizeName = (name) => { return String(name).toLowerCase().replace(/[^a-z0-9]/g, ''); },

  /**
   * English singular of a path segment: `people` -> `person`, `addresses` -> `address`.
   *
   * @param {String} word - word
   * @returns {String} singular
   */
  singular = (word) => {
    const irregular = IRREGULAR_PLURALS[String(word).toLowerCase()];

    if (irregular) { return irregular; }
    if ((/ies$/i).test(word)) { return word.replace(/ies$/i, 'y'); }
    if ((/yses$/i).test(word)) { return word.replace(/yses$/i, 'ysis'); }
    if ((/(ss|us|is)$/i).test(word)) { return word; }
    if ((/(sses|xes|ches|shes|zzes)$/i).test(word)) { return word.replace(/es$/i, ''); }

    return word.replace(/s$/i, '');
  },

  /**
   * Whether a path segment names a collection (a plural noun).
   *
   * @param {String} segment - static path segment
   * @returns {Boolean} true for collections like `files`, false for `publish`, `avatar`, `me`
   */
  isCollection = (segment) => { return singular(segment).toLowerCase() !== String(segment).toLowerCase(); },

  /**
   * Resource named by a parameter itself: `{repoId}` -> `repo`, `{owner}` -> `owner`.
   *
   * @param {String} name - parameter name
   * @returns {String} resource
   */
  resourceFromParam = (name) => { return singular(String(name).replace(/[-_]?(id|uuid)$/i, '') || name); },

  /**
   * Whether a field identifies an instance of `resource`: `id`, `uuid`, `<resource>Id`, `<resource>_id`.
   *
   * @param {String} name - field name
   * @param {String} resource - resource name
   * @returns {Boolean} true for identifier fields
   */
  isIdField = (name, resource) => {
    const field = normalizeName(name);

    return field === 'id' || field === 'uuid' || field === normalizeName(`${resource}id`);
  },

  /**
   * One JSON Schema type: OpenAPI 3.1 `[string, null]` -> `string`.
   *
   * @param {String|String[]} type - schema type
   * @returns {String|undefined} type
   */
  normalizeType = (type) => {
    return _.isArray(type) ? _.find(type, (t) => { return t !== 'null'; }) : type;
  },

  /**
   * Whether an object schema is a map rather than a record: `additionalProperties` without
   * properties, or example-derived keys such as `task_id`, `task_id1`, `task_id2`.
   *
   * @param {Object} schema - object schema
   * @returns {Boolean} true for maps
   */
  isMap = (schema) => {
    const names = _.keys(_.get(schema, 'properties'));

    if (!names.length) { return isContainer(schema) && Boolean(_.get(schema, 'additionalProperties')); }

    return names.some((name) => {
      const numbered = names.filter((other) => {
        return other !== name && other.startsWith(name) && (/^\d+$/).test(other.slice(name.length));
      });

      return numbered.length >= 2;
    });
  },

  // The wrapper property inside `schema`, if any: `data`, `items`, ... or the single entry of `_embedded`.
  wrapperKey = (schema, keys) => {
    return _.find(keys, (key) => { return isContainer(_.get(schema, ['properties', key])); });
  },

  /**
   * Unwraps payload wrappers (`{ data }`, `{ items }`, HAL `{ _embedded: { pets } }`) up to two levels.
   *
   * @param {Object} schema - response body schema
   * @param {Number} [level=0] - wrappers unwrapped so far
   * @returns {Object} { schema, pointer } of the payload
   */
  unwrap = (schema, level = 0) => {
    const key = level < 2 && wrapperKey(schema, WRAPPER_KEYS),
      inner = key && schema.properties[key],
      embedded = key === '_embedded' && _.keys(_.pickBy(_.get(inner, 'properties'), isContainer));

    if (!key || (embedded && embedded.length !== 1)) { return { schema, pointer: '' }; }

    const payload = embedded ? inner.properties[embedded[0]] : inner,
      rest = embedded ? { schema: payload, pointer: '' } : unwrap(payload, level + 1);

    return { schema: rest.schema, pointer: `/${key}${embedded ? `/${embedded[0]}` : ''}${rest.pointer}` };
  },

  /**
   * Splits a Google-style custom method off a path segment: `{id}:cancel` -> `{id}` + `cancel`.
   *
   * @param {String} segment - path segment
   * @returns {Object} { segment, action }
   */
  splitCustomMethod = (segment) => {
    const match = (/^(.*[^:]):([A-Za-z][\w-]*)$/).exec(segment);

    return match ? { segment: match[1], action: match[2] } : { segment, action: null };
  };

module.exports = {
  isContainer, normalizeName, singular, isCollection, resourceFromParam, isIdField, normalizeType, isMap,
  unwrap, splitCustomMethod
};
