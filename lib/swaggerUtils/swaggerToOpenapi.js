const Swagger2OpenAPI = require('swagger2openapi');

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
      throw error;
    }

  }
};
