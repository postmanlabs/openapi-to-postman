const _ = require('lodash'),
  generateAuthrForCollectionFromOpenAPI = require('./generateAuthForCollectionFromOpenAPI'),
  COLLECTION_NAME = 'Imported from OpenAPI 3.0',

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
      if (string[offset - 1] === '{' && string[offset + match.length + 1] !== '}') {
        return match;
      }
      return '{' + p1 + '}';
    };
    return _.isString(url) ? url.replace(/(\{[^\/\{\}]+\})/g, replacer) : '';
  };


module.exports = function ({ openapi }) {
  openapi.servers = _.isEmpty(openapi.servers) ? [{ url: '/' }] : openapi.servers;

  // @todo: @sujay to check for better handling of securty schemes.
  openapi.securityDefs = _.get(openapi, 'components.securitySchemes', {});

  // @todo: @sujay to figure out adding to collection variables
  openapi.baseUrlVariables = _.get(openapi, 'servers.0.variables');

  // Fix {scheme} and {path} vars in the URL to :scheme and :path
  openapi.baseUrl = fixPathVariablesInUrl(_.get(openapi, 'servers.0.url', '{{baseURL}}'));

  return {
    data: {
      info: {
        name: _.get(openapi, 'info.title', COLLECTION_NAME),
        description: getCollectionDescription(openapi)
      },
      auth: generateAuthrForCollectionFromOpenAPI(openapi, openapi.security)
    }
  };
};
