var yaml = require('js-yaml'),
  fs = require('fs'),
  _ = require('lodash'),
  path = require('path-browserify'),
  resolver = require('oas-resolver-browser'),
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
      let obj = yaml.safeLoad(spec);
      // yaml.safeLoad does not throw errors for most of the cases in invalid yaml
      // hence check if it returned an object
      if (typeof obj !== 'object') {
        throw new Error('');
      }
      return obj;
    }
    catch (yamlException) {
      throw new SyntaxError(`Specification is not a valid YAML. ${yamlException}`);
    }
  },

  /**
   * Validate Spec to check if some of the required fields are present.
   *
   * @param {Object} spec OpenAPI spec
   * @return {Object} Validation result
   */
  validateSpec: function (spec) {

    // Checking for the all the required properties in the specification
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
    if (!spec.info.hasOwnProperty('$ref')) {
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
    }

    // Valid specification
    return {
      result: true,
      openapi: spec
    };
  },

  /** Converts OpenAPI input to OpenAPI Object
   * @param {String} openApiSpec OpenAPI input in string
   * @returns {Object} oasObject
   */
  getOasObject: function (openApiSpec) {
    let oasObject = openApiSpec,
      detailedError = 'Invalid format. Input must be in YAML or JSON format.';
    try {
      oasObject = this.asYaml(openApiSpec);
    }
    catch (yamlException) {
      // Not valid YAML, could be a JSON as well
      try {
        oasObject = this.asJson(openApiSpec);
      }
      catch (jsonException) {
        // It's neither JSON nor YAML
        // try and determine json-ness or yaml-ness
        if (openApiSpec && openApiSpec[0] === '{') {
          // probably JSON
          detailedError += ' ' + jsonException.message;
        }
        else if (openApiSpec && openApiSpec.indexOf('openapi:') === 0) {
          // probably YAML
          detailedError += ' ' + yamlException.message;
        }
        return {
          result: false,
          reason: detailedError
        };
      }
    }

    return {
      result: true,
      oasObject
    };
  },

  /** Given an array of files returns the root OAS file if present
   *
   * @param {Array} filesPathArray Array of file paths
   * @param {Object} files Files map
   * @return {String} rootFile
   */
  getRootFiles: function (filesPathArray, files = {}) {
    let rootFilesArray = [];
    filesPathArray.forEach((filePath) => {
      let obj,
        file,
        oasObject;
      try {
        if (!_.isEmpty(files)) {
          file = files[path.resolve(filePath.fileName)];
        }
        else {
          file = fs.readFileSync(filePath.fileName, 'utf8');
        }

        obj = this.getOasObject(file);

        if (obj.result) {
          oasObject = obj.oasObject;
        }
        else {
          throw new Error(obj.reason);
        }
        if (this.validateSpec(oasObject).result) {
          rootFilesArray.push(filePath.fileName);
        }
      }
      catch (e) {
        throw new Error(e.message);
      }
    });
    return rootFilesArray;
  },

  /**
   * Resolve file references and generate single OAS Object
   *
   * @param {Object} openapi OpenAPI
   * @param {Object} options options
   * @param {Object} files Map of files path and content
   * @return {Object} Resolved content
   */
  resolveContent: function (openapi, options, files = {}) {
    return resolver.resolve(openapi, options.source, {
      options: Object.assign({}, options),
      resolve: true,
      cache: [],
      externals: [],
      externalRefs: {},
      rewriteRefs: true,
      openapi: openapi,
      files: files
    });
  },

  /** Resolves all OpenAPI file references and returns a single OAS Object
   *
   * @param {Object} source Root file path
   * @param {Object} options Configurable options as per oas-resolver module.
   * @param {Object} files Map of files path and content
   * @return {Object} Resolved OpenAPI Schema
   */
  mergeFiles: function(source, options = {}, files = {}) {
    options.source = source;
    options.origin = source;

    // Use files map if present instead of reading files.
    if (!_.isEmpty(files)) {
      let content = files[path.resolve(source)],
        unresolved;
      try {
        unresolved = yamlParse.parse(content, { prettyErrors: true });
      }
      // Used to indicate to users where is the issue with their API
      catch (err) {
        throw new Error('\nLine: ' + err.linePos.start.line + ', col: ' +
          err.linePos.start.col + ' ' + err.message);
      }
      return new Promise((resolve, reject) => {
        return this.resolveContent(unresolved, options, files)
          .then((result) => {
            return resolve(result.openapi);
          }, (err) => {
            return reject(err);
          });
      });
    }
    return this.readFileAsync(source, 'utf8')
      .then((content) => {
        try {
          return yamlParse.parse(content, { prettyErrors: true });
        }
        catch (err) {
          throw new Error('\nLine: ' + err.linePos.start.line + ', col: ' +
           err.linePos.start.col + ' ' + err.message);
        }
      }, (err) => {
        throw new Error(err.message);
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

  /** Read File asynchronously
   *
   * @param {String} filePath Path of the file.
   * @param {String} encoding encoding
   * @return {String} Contents of the file
   */
  readFileAsync: function(filePath, encoding) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, encoding, (err, data) => {
        if (err) { reject(err); }
        else { resolve(data); }
      });
    });
  }
};
