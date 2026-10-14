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
   * `METHOD /path/{param}` for a request item, matching the operation keys.
   *
   * @param {Object} item - request item
   * @returns {String} key
   */
  itemKey = (item) => {
    // The converter writes `:petId` for path variables, and `{{petId}}:verify` before a custom method.
    const path = (item.request.url.path || []).map((segment) => {
      return segment.replace(/^:([^:]+)/, '{$1}').replace(/^\{\{([^}]+)\}\}/, '{$1}');
    });

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

module.exports = { hash, flattenItems, itemKey, toLodashPath };
