const _ = require('lodash'),
  utils = require('../../utils'),
  generateAuthrForCollectionFromOpenAPI = require('./generateAuthForCollectionFromOpenAPI'),
  { resolveRefFromSchema, getServerKey } = require('../../schemaUtils'),
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
  BASE_URL_VARIABLE_PATTERN = /^baseUrl(\d+)?$/,
  serverVariableName = (index) => {
    return index === 0 ? 'baseUrl' : `baseUrl${index}`;
  },
  addUniqueServers = (target, servers, seen) => {
    _.forEach(servers, (server) => {
      if (!server || typeof server.url !== 'string') {
        return;
      }

      const key = getServerKey(server);

      if (!seen.has(key)) {
        seen.add(key);
        target.push(server);
      }
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
   * Used so every distinct server becomes a collection variable (`baseUrl`, `baseUrl1`, …).
   *
   * @param {Object} context Conversion context
   * @returns {Array} Unique server objects
   */
  collectUniqueServerObjects = (context) => {
    const { openapi } = context,
      servers = [],
      seen = new Set();

    addUniqueServers(servers, openapi.servers, seen);
    _.forEach(openapi.paths, (pathItem) => {
      visitPathItemServers(context, pathItem, servers, seen);
    });
    _.forEach(openapi.webhooks, (pathItem) => {
      visitPathItemServers(context, pathItem, servers, seen);
    });

    return servers;
  },

  /**
   * Collection variables for the given servers, plus a registry (keyed by getServerKey) of the `baseUrl*`
   * variable and server variables each server uses. Server variables share one collection namespace, so a
   * name already taken with another default gets a numbered key instead (`version` -> `version1`).
   *
   * @param {Array} servers Unique server objects
   * @returns {Object} Collection variables and server registry
   */
  resolveCollectionVariablesFromServers = (servers) => {
    const collectionVariables = [],
      registry = {},
      serverVariableDefaults = new Map();

    _.forEach(servers, (serverObject, index) => {
      const key = serverVariableName(index),
        variables = [];

      let value = fixPathVariablesInUrl(serverObject.url).replace(/\/+$/, '');

      // The request path supplies the leading `/`, but keep the root `baseUrl` from becoming empty
      if (index === 0 && !value) {
        value = fixPathVariablesInUrl(serverObject.url);
      }

      _.forOwn(serverObject.variables, (variable, name) => {
        const defaultValue = _.get(variable, 'default') || '';

        // `baseUrl*` keys are the server variables themselves
        const baseKey = BASE_URL_VARIABLE_PATTERN.test(name) ? `${name}Variable` : name;

        let variableKey = baseKey,
          suffix = 0;

        while (serverVariableDefaults.has(variableKey) && serverVariableDefaults.get(variableKey) !== defaultValue) {
          suffix += 1;
          variableKey = `${baseKey}${suffix}`;
        }

        if (!serverVariableDefaults.has(variableKey)) {
          serverVariableDefaults.set(variableKey, defaultValue);
          collectionVariables.push({ key: variableKey, value: defaultValue });
        }

        if (variableKey !== name) {
          value = value.split(`{{${name}}}`).join(`{{${variableKey}}}`);
        }

        variables.push({ key: variableKey, value: defaultValue });
      });

      registry[getServerKey(serverObject)] = { key, variables };
      collectionVariables.push({ key, value });
    });

    return { collectionVariables, registry };
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

  const { collectionVariables, registry } = resolveCollectionVariablesFromServers(
    collectUniqueServerObjects(context)
  );

  openapi.serverVariableRegistry = registry;

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
