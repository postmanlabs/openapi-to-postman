const sdk = require('postman-collection');

module.exports = function (openapi, nodeIdentified) {
  return new sdk.ItemGroup({
    name: nodeIdentified
  });
};
