const Swagger2OpenAPI = require('swagger2openapi'),
  { isSwagger } = require('../common/versionUtils');

module.exports = {
  convertSwaggerToOpenapi: function(concreteUtils, parsedSwagger, convertExecution) {
    if (isSwagger(concreteUtils.version)) {
      Swagger2OpenAPI.convertObj(
        parsedSwagger,
        {
          fatal: false,
          patch: true,
          anchors: true,
          warnOnly: true
        },
        (error, newOpenapi) => {
          if (error) {
            return convertExecution(error);
          }
          return convertExecution(null, newOpenapi.openapi);
        }
      );
    }
    else {
      return convertExecution(null, parsedSwagger);
    }
  }
};
