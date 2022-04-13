const Swagger2OpenAPI = require('swagger2openapi'),
  _ = require('lodash');

module.exports = {
  convertSwaggerToOpenapi: function(parsedSwagger) {
    try {
      return Swagger2OpenAPI.convertObj(
        parsedSwagger,
        {
          fatal: false,
          patch: true,
          anchors: true,
          warnOnly: true
        }
      );
    }
    catch (error) {
      return error;
    }

  }
};
