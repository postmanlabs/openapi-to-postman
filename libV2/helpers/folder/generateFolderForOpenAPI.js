const sdk = require('postman-collection');

module.exports = function (openapi, nodeIdentified) {
  return {
    data: new sdk.ItemGroup({
      name: nodeIdentified
    })
  };
};
