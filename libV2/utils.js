const sdk = require('postman-collection'),
  _ = require('lodash'),
  generatePmResponseObject = (response) => {
    const requestItem = generateRequestItemObject({ // eslint-disable-line no-use-before-define
        request: response.originalRequest
      }),
      originalRequest = {
        method: response.originalRequest.method,
        url: requestItem.request.url
      },
      originalRequestQueryParams = _.get(response, 'originalRequest.params.queryParams', []);

    /**
     * Setting variable
     * overriding `originalRequest.url.variable` as the url definition expects
     * 2. Field variable to be array of objects which maps to `clonedItemURL.variables.members`
     */
    originalRequest.url.variable = _.get(requestItem, 'request.url.variables.members', []);
    originalRequest.url.query = [];

    // setting query params
    if (originalRequestQueryParams.length) {
      originalRequest.url.query = _.reduce(originalRequestQueryParams, (acc, param) => {
        acc += `${param.key}=${param.value}&`;

        return acc;
      }, '');

      // Removing the last `&`
      originalRequest.url.query = originalRequest.url.query.slice(0, -1);
    }

    // Setting headers
    originalRequest.header = _.get(response, 'originalRequest.headers', []);
    originalRequest.body = requestItem.request.body;

    // replace 'X' char with '0'
    response.code = response.code.replace(/X|x/g, '0');
    response.code = response.code === 'default' ? 500 : _.toSafeInteger(response.code);

    let sdkResponse = new sdk.Response({
      name: response.name,
      code: response.code,
      header: response.headers,
      body: response.body,
      originalRequest: originalRequest
    });

    /**
     * Adding it here because sdk converts
     * _postman_previewlanguage to {'_': {'postman_previewlanguage': ''}}
     */
    sdkResponse._postman_previewlanguage = response._postman_previewlanguage;

    return sdkResponse;
  },
  generateRequestItemObject = (requestObject) => {
    const requestItem = new sdk.Item(requestObject),
      queryParams = _.get(requestObject, 'request.params.queryParams'),
      pathParams = _.get(requestObject, 'request.params.pathParams', []),
      headers = _.get(requestObject, 'request.headers', []),
      responses = _.get(requestObject, 'request.responses', []),
      auth = _.get(requestObject, 'request.auth', []);

    _.forEach(queryParams, (param) => {
      requestItem.request.url.addQueryParams(param);
    });

    _.forEach(headers, (header) => {
      requestItem.request.addHeader(header);
    });

    requestItem.request.url.variables.assimilate(pathParams);
    requestItem.request.auth = auth;

    _.forEach(responses, (response) => {
      requestItem.responses.add(generatePmResponseObject(response, requestItem));
    });


    return requestItem;
  };

module.exports = {
  /**
   * Converts Title/Camel case to a space-separated string
   * @param {*} string - string in snake/camelCase
   * @returns {string} space-separated string
   */
  insertSpacesInName: function (string) {
    if (!string || (typeof string !== 'string')) {
      return '';
    }

    return string
      .replace(/([a-z])([A-Z])/g, '$1 $2') // convert createUser to create User
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // convert NASAMission to NASA Mission
      .replace(/(_+)([a-zA-Z0-9])/g, ' $2'); // convert create_user to create user
  },

  generatePmResponseObject,
  generateRequestItemObject
};
