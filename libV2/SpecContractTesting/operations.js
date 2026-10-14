const _ = require('lodash'),
  { flattenItems, itemKey } = require('./utils'),
  { singular, isCollection, resourceFromParam, splitCustomMethod } = require('./normalize'),

  ROLE_RANK = { create: 0, list: 1, read: 2, update: 3, other: 4, delete: 5 },
  PARAM_LOCATIONS = { pathParam: 'path', queryParam: 'query', headers: 'header' },

  isParamSegment = (segment) => { return (/^\{.+\}$/).test(segment); },

  // extractedTypes stores schemas and parameter lists as JSON strings.
  parseJson = (text) => {
    const parsed = typeof text === 'string' && text ? _.attempt(JSON.parse, text) : undefined;

    return _.isError(parsed) ? undefined : parsed;
  },

  /**
   * Classifies an operation by the shape of its path.
   *
   *   POST /pets -> create, GET /pets -> list, GET /pets/{petId} -> read,
   *   PUT|PATCH /pets/{petId} -> update, DELETE /pets/{petId} -> delete
   *
   * Each path parameter belongs to the resource named by the segment before it
   * (/specifications/{id}/files/{fileId} -> { id: 'specification', fileId: 'file' }), or by its own
   * name in a composite key (/repos/{owner}/{repo} -> { owner: 'owner', repo: 'repo' }).
   *
   * A trailing segment that is not a plural noun after an item or collection (/orders/{id}/cancel,
   * /users/{id}/avatar, /users/search), or a custom method (/orders/{id}:cancel), is an action or
   * singleton of the resource before it, with role `other`.
   *
   * @param {String} method - upper-case HTTP method
   * @param {String} path - path template
   * @returns {Object} resource, role, idParam, paramResources and collectionPath
   */
  classify = (method, path) => {
    const raw = path.split('/').filter(Boolean),
      { segment: lastRaw, action } = splitCustomMethod(_.last(raw) || ''),
      segments = raw.slice(0, -1).concat(lastRaw ? [lastRaw] : []),
      last = _.last(segments) || '',
      previous = segments[segments.length - 2],
      isTrailingAction = Boolean(previous) && !isParamSegment(last) && !isCollection(last) &&
        (isParamSegment(previous) || isCollection(previous)),
      owner = isTrailingAction ? segments.slice(0, -1) : segments,
      isItem = isParamSegment(_.last(owner) || ''),
      paramResources = {};
    let role = 'other';

    segments.forEach((segment, index) => {
      const before = segments[index - 1],
        after = segments[index + 1],
        isComposite = !before || isParamSegment(before) || (after && isParamSegment(after));

      if (isParamSegment(segment)) {
        paramResources[segment.slice(1, -1)] = isComposite ? resourceFromParam(segment.slice(1, -1)) : singular(before);
      }
    });

    if (!action && !isTrailingAction) {
      if (!isItem && method === 'POST') { role = 'create'; }
      else if (!isItem && method === 'GET') { role = 'list'; }
      else if (isItem && method === 'GET') { role = 'read'; }
      else if (isItem && (method === 'PUT' || method === 'PATCH')) { role = 'update'; }
      else if (isItem && method === 'DELETE') { role = 'delete'; }
    }

    return {
      resource: singular(_.last(owner.filter((segment) => { return !isParamSegment(segment); })) || 'root'),
      role,
      idParam: isItem ? _.last(owner).slice(1, -1) : null,
      paramResources,
      collectionPath: `/${(isItem ? owner.slice(0, -1) : owner).join('/')}`
    };
  },

  /**
   * Lists every operation from the `extractedTypes` returned by convertV2WithTypes, keyed as
   * `method/path`, with its parameters, request body schema, response schemas and classification.
   * Query and header parameters carry the example value the converter put on the request.
   *
   * @param {Object} extractedTypes - convertV2WithTypes result.extractedTypes
   * @param {Object} collection - convertV2WithTypes collection
   * @returns {Object[]} operations
   */
  listOperations = (extractedTypes, collection) => {
    const items = _.keyBy(flattenItems(collection.item), itemKey),
      exampleOf = (item, location, name) => {
        const entries = location === 'query' ? _.get(item, 'request.url.query') : _.get(item, 'request.header');

        return _.get(_.find(entries, { key: name }), 'value');
      };

    return _.map(extractedTypes, (types, typeKey) => {
      const separator = typeKey.indexOf('/'),
        method = typeKey.slice(0, separator).toUpperCase(),
        path = typeKey.slice(separator),
        item = items[`${method} ${path}`],
        params = _.flatMap(PARAM_LOCATIONS, (location, field) => {
          return _.map(parseJson(_.get(types, ['request', field])), (param) => {
            return { in: location, name: param.keyName, required: Boolean(_.get(param, 'properties.required')),
              schema: _.pick(param.properties, ['type', 'format']), example: exampleOf(item, location, param.keyName) };
          });
        });

      return Object.assign({
        key: `${method} ${path}`,
        method,
        path,
        operationId: `${method.toLowerCase()}${path.replace(/[^a-zA-Z0-9]+/g, '_')}`,
        params,
        requestBodySchema: parseJson(_.get(types, 'request.body')),
        responses: _.mapValues(types.response, (response) => { return { schema: parseJson(response.body) }; })
      }, classify(method, path));
    });
  };

module.exports = { ROLE_RANK, singular, listOperations };
