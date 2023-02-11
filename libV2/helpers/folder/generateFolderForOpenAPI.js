const _ = require('lodash');

module.exports = function (openapi, node) {
  return {
    data: {
      name: _.get(node, 'meta.path', 'FOLDER')
    }
  };
};
