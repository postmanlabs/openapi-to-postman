const _ = require('lodash'),
  utils = require('../../utils'),
  generateAuthrForCollectionFromOpenAPI = require('./generateAuthForCollectionFromOpenAPI'),
  { resolveRefFromSchema } = require('../../schemaUtils'),
  { isOpenApi32, getPathItemOperations } = require('../../../../lib/common/oas32Utils'),

  /**
   * Returns a description that's usable at the collection-level
   * Adds the collection description and uses any relevant contact info
   *
   * @param {Object} openapi The JSON representation of the OAS spec
   * @returns {string} description
   */
  getCollectionDescription = function (openapi) {
    let description = _.get(openapi, 'info.description', '');

    if (_.get(openapi, 'info.contact')) {
      let contact = [];

      if (openapi.info.contact.name) {
        contact.push(' Name: ' + openapi.info.contact.name);
      }

      if (openapi.info.contact.email) {
        contact.push(' Email: ' + openapi.info.contact.email);
      }

      if (contact.length > 0) {
        // why to add unnecessary lines if there is no description
        if (description !== '') {
          description += '\n\n';
        }
        description += 'Contact Support:\n' + contact.join('\n');
      }
    }

    return description;
  },
  fixPathVariablesInUrl = function (url) {
    // URL should always be string so update value if non-string value is found
    if (typeof url !== 'string') {
      return '';
    }

    // All complicated logic removed
    // This simply replaces all instances of {text} with {{text}}
    // text cannot have any of these 3 chars: /{}
    // {{text}} will not be converted

    let replacer = function (match, p1, offset, string) {
      if (
        string[offset - 1] === '{' &&
        string[offset + match.length + 1] !== '}'
      ) {
        return match;
      }
      return '{' + p1 + '}';
    };
    return _.isString(url) ? url.replace(/(\{[^\/\{\}]+\})/g, replacer) : '';
  },
  // Every method a Path Item Object can carry as a fixed field (OAS 3.2 `query` and
  // `additionalOperations` are handled by getPathItemOperations).
  PATH_ITEM_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace', 'connect'],
  serverVariableName = (index) => {
    return index === 0 ? 'baseUrl' : `baseUrl${index}`;
  },

  /**
   * Value of the `baseUrl*` collection variable for a server URL. The request path always starts
   * with `/`, so a trailing slash on the server URL would produce `//` in the resolved request URL.
   *
   * @param {String} url Server URL
   * @returns {String} Collection variable value
   */
  resolveServerVariableValue = (url) => {
    const value = fixPathVariablesInUrl(url);

    return value.replace(/\/+$/, '') || value;
  },
  addUniqueServers = (target, servers, seen) => {
    _.forEach(servers, (server) => {
      if (!server || typeof server.url !== 'string') {
        return;
      }

      const value = resolveServerVariableValue(server.url);

      if (!seen.has(value)) {
        seen.set(value, []);
        target.push(server);
      }

      seen.get(value).push(server.url);
    });
  },
  visitPathItemServers = (context, pathItem, target, seen) => {
    if (pathItem && pathItem.$ref) {
      pathItem = resolveRefFromSchema(context, pathItem.$ref);
    }

    if (!pathItem || typeof pathItem !== 'object') {
      return;
    }

    addUniqueServers(target, pathItem.servers, seen);
    _.forEach(getPathItemOperations(pathItem, PATH_ITEM_METHODS, isOpenApi32(context.openapi)), ({ operation }) => {
      addUniqueServers(target, _.get(operation, 'servers'), seen);
    });
  },

  /**
   * Unique servers in first-seen order: root, then path-item, then operation.
   * Used so every distinct URL becomes a collection variable (`baseUrl`, `baseUrl1`, …).
   *
   * @param {Object} context Conversion context
   * @returns {Object} Unique server objects and, per unique server, every raw URL that maps to it
   */
  collectUniqueServerObjects = (context) => {
    const { openapi } = context,
      servers = [],
      seen = new Map();

    addUniqueServers(servers, openapi.servers, seen);
    _.forEach(openapi.paths, (pathItem) => {
      visitPathItemServers(context, pathItem, servers, seen);
    });
    _.forEach(openapi.webhooks, (pathItem) => {
      visitPathItemServers(context, pathItem, servers, seen);
    });

    return { servers, seen };
  },
  resolveCollectionVariablesFromServers = ({ servers, seen }) => {
    const collectionVariables = [],
      urlToVariable = {};

    _.forEach(servers, (serverObject, index) => {
      const key = serverVariableName(index),
        value = resolveServerVariableValue(serverObject.url);

      _.forEach(seen.get(value), (url) => {
        urlToVariable[url] = key;
      });

      _.forOwn(serverObject.variables, (variable, variableKey) => {
        collectionVariables.push({
          key: variableKey,
          value: _.get(variable, 'default') || ''
        });
      });

      collectionVariables.push({ key, value });
    });

    return { collectionVariables, urlToVariable };
  };

module.exports = function (context) {
  const { openapi } = context;

  openapi.servers = _.isEmpty(openapi.servers) ?
    [{ url: '/' }] :
    openapi.servers;

  // @todo: @sujay to check for better handling of securty schemes.
  openapi.securityDefs = _.get(openapi, 'components.securitySchemes', {});

  // @todo: @sujay to figure out adding to collection variables
  openapi.baseUrlVariables = _.get(openapi, 'servers.0.variables');

  // Fix {scheme} and {path} vars in the URL to :scheme and :path
  openapi.baseUrl = fixPathVariablesInUrl(
    _.get(openapi, 'servers.0.url', '{{baseURL}}')
  );

  const { collectionVariables, urlToVariable } = resolveCollectionVariablesFromServers(
    collectUniqueServerObjects(context)
  );

  openapi.serverUrlToVariable = urlToVariable;

  return {
    data: {
      info: {
        name: utils.getCollectionName(_.get(openapi, 'info.title')),
        description: getCollectionDescription(openapi)
      },
      auth: generateAuthrForCollectionFromOpenAPI(openapi, openapi.security)
    },
    variables: collectionVariables
  };
};
