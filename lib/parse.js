var yaml = require('js-yaml');

module.exports = {

  asJson: function(spec) {
    try {
      return JSON.parse(spec);
    }
    catch (jsonException) {
      throw new SyntaxError(`Specification is not a valid JSON. ${jsonException}`);
    }
  },

  asYaml: function(spec) {
    try {
      return yaml.safeLoad(spec);
    }
    catch (yamlException) {
      throw new SyntaxError(`Specification is not a valid YAML. ${yamlException}`);
    }
  },

  validateRoot: function(spec) {

    // Checking for the all the required properties in the specificatio
    if (!spec.hasOwnProperty('openapi')) {
      return {
        result: false,
        reason: 'Specification must contain a semantic version number of the OAS specification'
      };
    }

    if (!spec.paths) {
      return {
        result: false,
        reason: 'Specification must contain Paths Object for the available operational paths'
      };
    }

    if (!spec.hasOwnProperty('info')) {
      return {
        result: false,
        reason: 'Specification must contain an Info Object for the meta-data of the API'
      };
    }
    if (!spec.info.hasOwnProperty('title')) {
      return {
        result: false,
        reason: 'Specification must contain a title in order to generate a collection'
      };
    }

    if (!spec.info.hasOwnProperty('version')) {
      return {
        result: false,
        reason: 'Specification must contain a semantic version number of the API in the Info Object'
      };
    }


    // Valid specification
    return {
      result: true,
      openapi: spec
    };
  }
};
