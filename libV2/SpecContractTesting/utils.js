const _ = require('lodash'),
  crypto = require('crypto'),

  /**
   * Short, stable sha256 hex digest of a string or JSON-serialisable value.
   *
   * @param {*} value - value to hash
   * @param {Number} [length=12] - number of hex characters to keep
   * @returns {String} hex digest prefix
   */
  hash = (value, length = 12) => {
    return crypto.createHash('sha256')
      .update(typeof value === 'string' ? value : JSON.stringify(value))
      .digest('hex')
      .slice(0, length);
  },

  /**
   * All request items in a collection, folders flattened.
   *
   * @param {Object[]} items - collection items
   * @returns {Object[]} request items
   */
  flattenItems = (items) => {
    return _.flatMap(items, (item) => { return item.item ? flattenItems(item.item) : [item]; });
  },

  /**
   * Same value for any key order, so reordering a spec doesn't change its hash.
   *
   * @param {*} value - JSON-serialisable value
   * @returns {*} copy with object keys sorted
   */
  sortKeys = (value) => {
    if (_.isArray(value)) { return value.map(sortKeys); }
    if (!_.isPlainObject(value)) { return value; }

    return _.fromPairs(_.sortBy(_.keys(value)).map((key) => { return [key, sortKeys(value[key])]; }));
  },

  /**
   * `METHOD /path/:param` for an operation, matching itemKey.
   *
   * @param {String} method - upper-case HTTP method
   * @param {String} path - path template, e.g. `/pets/{petId}`
   * @returns {String} key
   */
  requestKey = (method, path) => { return `${method} ${path.replace(/\{([^}]+)\}/g, ':$1')}`; },

  /**
   * `METHOD /path/:param` for a request item, matching requestKey. The converter writes `:petId`
   * for path variables, `{{petId}}:verify` before a custom method, and keeps server-template
   * segments such as `:version` as they are, so `:` segments stay untouched.
   *
   * @param {Object} item - request item
   * @returns {String} key
   */
  itemKey = (item) => {
    const path = (item.request.url.path || []).map((segment) => { return segment.replace(/^\{\{([^}]+)\}\}/, ':$1'); });

    return `${item.request.method} /${path.join('/')}`;
  },

  /**
   * Converts a JSON pointer (`/data/0/id`) into a lodash path (`data[0].id`).
   *
   * @param {String} pointer - JSON pointer
   * @returns {String} lodash path
   */
  toLodashPath = (pointer) => {
    return pointer.split('/').filter(Boolean).map((part, index) => {
      if ((/^\d+$/).test(part)) { return `[${part}]`; }

      return index === 0 ? part : `.${part}`;
    }).join('');
  };

module.exports = { hash, sortKeys, flattenItems, requestKey, itemKey, toLodashPath };
