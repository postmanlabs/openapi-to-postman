const _ = require('lodash');

module.exports = function (openapi, node) {
  return {
    data: {
      name: node.type === 'webhook~folder' ? 'WEBHOOKS' : _.get(node, 'meta.path', 'FOLDER'),
      item: []
    }
  };
};
