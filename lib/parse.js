var yaml = require('js-yaml'),
  fetch = require('node-fetch'),
  fs = require('fs'),
  resolver = require('oas-resolver'),
  yamlParse = require('yaml');

module.exports = {

  asJson: function (spec) {
    try {
      return JSON.parse(spec);
    }
    catch (jsonException) {
      throw new SyntaxError(`Specification is not a valid JSON. ${jsonException}`);
    }
  },

  asYaml: function (spec) {
    try {
      return yaml.safeLoad(spec);
    }
    catch (yamlException) {
      throw new SyntaxError(`Specification is not a valid YAML. ${yamlException}`);
    }
  },

  validateSpec: function (spec) {

    // Checking for the all the required properties in the specification
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
  },

  validateRoot: function (spec) {

    // Checking for the all the required properties needed in a root file
    if (!spec.hasOwnProperty('openapi')) {
      return {
        result: false,
        reason: 'Specification must contain a semantic version number of the OAS specification'
      };
    }

    if (!spec.hasOwnProperty('paths')) {
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


    // Valid specification
    return {
      result: true
    };
  },

  getOasObject: function (file) {
    let oasObj = file;
    try {
      oasObj = JSON.parse(oasObj);
    }
    catch (jsonEx) {
      // Not direct JSON. Could be YAML
      try {
        oasObj = yaml.safeLoad(oasObj);
      }
      catch (yamlEx) {
        // Not JSON or YAML
        return {
          result: false,
          reason: 'The input must be valid JSON or YAML'
        };
      }
      // valid YAML
    }

    return oasObj;
  },

  getRootFiles: function (filesPathArray) {
    let rootFilesArray = [];

    filesPathArray.forEach((filePath) => {
      try {
        let file = fs.readFileSync(filePath.fileName, 'utf8'),
          oasObject = this.getOasObject(file);

        if (this.validateRoot(oasObject).result) {
          rootFilesArray.push(filePath.fileName);
        }
      }
      catch (e) {
        throw new Error(e);
      }
    });
    return rootFilesArray;
  },

  resolveContent: function (openapi, options) {
    return resolver.resolve(openapi, options.source, {
      options: Object.assign({}, options),
      resolve: true,
      cache: [],
      externals: [],
      externalRefs: {},
      rewriteRefs: true,
      openapi: openapi
    });
  },

  mergeFiles: function(source, options = {}) {
    options.source = source;
    options.origin = source;
    return this.readSpecFile(source)
      .then((content) => {
        try {
          return yamlParse.parse(content, { prettyErrors: true });
        }
        catch (err) {
          throw new ReadError('\nLine: ' + err.linePos.start.line + ', col: ' +
           err.linePos.start.col + ' ' + err.message);
        }
      }, (err) => {
        throw new OpenError(err.message);
      })
      .then((unresolved) => {
        if (options.resolve === true) {
          return this.resolveContent(unresolved, options);
        }
      }, (err) => {
        throw err;
      })
      .then((result) => {
        return result.openapi;
      }, (err) => {
        throw err;
      });
  },

  readSpecFile: function (file) {
    if (file.startsWith('http') || file.startsWith('https')) {
      // remote file
      return fetch(file).then((res) => {
        if (res.status !== 200) {
          return `Received status code ${res.status}`;
        }
        return res.text();
      });
    }
    return this.readFileAsync(file, 'utf8');

  },

  readFileAsync: function(filename, encoding) {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, encoding, (err, data) => {
        if (err) { reject(err); }
        else { resolve(data); }
      });
    });
  }
};
