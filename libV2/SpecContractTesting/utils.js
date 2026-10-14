const crypto = require('crypto'),

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

module.exports = { hash, toLodashPath };
