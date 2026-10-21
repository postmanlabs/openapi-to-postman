const _ = require('lodash'),
  utils = require('../../utils'),
  generateAuthrForCollectionFromOpenAPI = require('./generateAuthForCollectionFromOpenAPI'),

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
  PATH_ITEM_OPERATIONS = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
    'query'
  ],
  serverVariableName = (index) => {
    return index === 0 ? 'baseUrl' : `baseUrl${index}`;
  },
  addUniqueServers = (target, servers, seen) => {
    _.forEach(servers, (server) => {
      if (!server || typeof server.url !== 'string' || seen.has(server.url)) {
        return;
      }

      seen.add(server.url);
      target.push(server);
    });
  },
  visitPathItemServers = (pathItem, target, seen) => {
    if (!pathItem || typeof pathItem !== 'object') {
      return;
    }

    addUniqueServers(target, pathItem.servers, seen);
    _.forEach(PATH_ITEM_OPERATIONS, (method) => {
      addUniqueServers(target, _.get(pathItem, [method, 'servers']), seen);
    });
  },

  /**
   * Unique servers in first-seen order: root, then path-item, then operation.
   * Used so every distinct URL becomes a collection variable (`baseUrl`, `baseUrl1`, …).
   *
   * @param {Object} openapi OpenAPI document
   * @returns {Array} Unique server objects
   */
  collectUniqueServerObjects = (openapi) => {
    const servers = [],
      seen = new Set();

    addUniqueServers(servers, openapi.servers, seen);
    _.forEach(openapi.paths, (pathItem) => {
      visitPathItemServers(pathItem, servers, seen);
    });
    _.forEach(openapi.webhooks, (pathItem) => {
      visitPathItemServers(pathItem, servers, seen);
    });

    return servers;
  },
  resolveCollectionVariablesFromServers = (serverObjects) => {
    const collectionVariables = [],
      urlToVariable = {};

    _.forEach(serverObjects, (serverObject, index) => {
      const key = serverVariableName(index);

      urlToVariable[serverObject.url] = key;

      _.forOwn(serverObject.variables, (value, variableKey) => {
        collectionVariables.push({
          key: variableKey,
          value: value.default || ''
        });
      });

      collectionVariables.push({
        key,
        value: fixPathVariablesInUrl(serverObject.url)
      });
    });

    return { collectionVariables, urlToVariable };
  };

module.exports = function ({ openapi }) {
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

  const uniqueServers = collectUniqueServerObjects(openapi),
    { collectionVariables, urlToVariable } =
      resolveCollectionVariablesFromServers(uniqueServers);

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
