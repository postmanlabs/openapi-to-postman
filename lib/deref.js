const openApiErr = require('./error.js'),
  _ = require('lodash'),
  type = {
    integer: {
      int32: '<integer>',
      int64: '<long>'
    },
    number: {
      float: '<float>',
      double: '<double>'
    },
    string: {
      byte: '<byte>',
      binary: '<binary>',
      date: '<date>',
      'date-time': '<dateTime>',
      password: '<password>'
    },
    boolean: '<boolean>'
  },
  BODY_TYPE = {
    REQUEST: 'REQUEST',
    RESPONSE: 'RESPONSE'
  };

module.exports = {
  /**
   * @param {*} rootObject - the object from which you're trying to read a property
   * @param {*} pathArray - each element in this array a property of the previous object
   * @param {*} defValue - what to return if the required path is not found
   * @returns {*} - required property value
   * @description - this is similar to _.get(rootObject, pathArray.join('.')), but also works for cases where
   * there's a . in the property name
   */
  _getEscaped: function (rootObject, pathArray, defValue) {
    if (!(pathArray instanceof Array)) {
      return null;
    }

    if (!rootObject) {
      return defValue;
    }

    if (_.isEmpty(pathArray)) {
      return rootObject;
    }

    return this._getEscaped(rootObject[pathArray.shift()], pathArray, defValue);
  },

  /**
   * Creates a schema that's a union of all input schemas (only type: object is supported)
   *
   * @param {array} schemaArr - array of schemas, all of which must be valid in the returned object
   * @param {string} bodyType tells that the schema object is of request or response
   * @param {*} components components in openapi spec.
   * @param {*} stack counter which keeps a tab on nested schemas
   * @returns {*} schema - schema that adheres to all individual schemas in schemaArr
   */
  resolveAllOf: function (schemaArr, bodyType, components, stack = 0) {
    if (!(schemaArr instanceof Array)) {
      return null;
    }

    if (schemaArr.length === 1) {
      // for just one entry in allOf, don't need to enforce type: object restriction
      return this.resolveRefs(schemaArr[0], bodyType, components, stack);
    }

    // generate one object for each schema
    let indivObjects = schemaArr.map((schema) => {
        return this.resolveRefs(schema, bodyType, components, stack);
      }).filter((schema) => {
        return schema.type === 'object';
      }),

      // generated object with properties from all allOf entries which we return
      finalObject = {
        type: 'object',
        properties: {}
      },

      // set of properties which we've already handled, to avoid repitition
      handledProps = {},
      i,
      j;

    for (i = 0; i < indivObjects.length; i++) {
      // go through the indiv props, and add to finalObject if not in handledProps
      for (j in indivObjects[i].properties) {
        if (indivObjects[i].properties.hasOwnProperty(j) && !handledProps[j]) {
          handledProps[j] = true;
          finalObject.properties[j] = indivObjects[i].properties[j];
        }
      }

      finalObject.description = finalObject.description || indivObjects[i].description;
    }

    return finalObject;
  },

  /**
   * Resolves references to components for a given schema.
   * @param {*} schema (openapi) to resolve references.
   * @param {string} bodyType tells that the schema object is of request or response
   * @param {*} components components in openapi spec.
   * @param {*} stack counter which keeps a tab on nested schemas
   * @returns {*} schema satisfying JSON-schema-faker.
   */
  resolveRefs: function (schema, bodyType, components, stack = 0) {
    var resolvedSchema, prop, splitRef,
      localSchema = _.cloneDeep(schema);
    stack++;

    if (stack > 20) {
      return { value: '<Error: Too many levels of nesting to fake this schema>' };
    }

    if (localSchema.anyOf) {
      return this.resolveRefs(localSchema.anyOf[0], bodyType, components, stack);
    }
    if (localSchema.oneOf) {
      return this.resolveRefs(localSchema.oneOf[0], bodyType, components, stack);
    }
    if (localSchema.allOf) {
      return this.resolveAllOf(localSchema.allOf, bodyType, components, stack);
    }
    if (localSchema.$ref) {
      // points to an existing location
      // .split will return [#, components, schemas, schemaName]
      splitRef = localSchema.$ref.split('/');

      if (splitRef.length < 4) {
        throw new openApiErr(`Invalid schema reference: ${localSchema.$ref}`);
      }

      // something like #/components/schemas/PaginationEnvelope/properties/page
      // will be resolved - we don't care about anything after the components part
      // splitRef.slice(2) will return ['schemas', 'PaginationEnvelope', 'properties', 'page']
      // not using _.get here because that fails if there's a . in the property name (Pagination.Envelope, for example)
      resolvedSchema = this._getEscaped(components, splitRef.slice(2));
      if (resolvedSchema) {
        return this.resolveRefs(resolvedSchema, bodyType, components, stack);
      }
      return { value: 'reference ' + localSchema.$ref + ' not found in the api spec' };
    }
    if (localSchema.type === 'object' || localSchema.hasOwnProperty('properties')) {
      // go through all props
      localSchema.type = 'object';
      if (localSchema.hasOwnProperty('properties')) {
        for (prop in localSchema.properties) {
          if (localSchema.properties.hasOwnProperty(prop)) {
            localSchema.properties[prop] = this.resolveRefs(localSchema.properties[prop], bodyType, components, stack);
            // handling OAS readOnly and writeOnly properties in schema
            let property = localSchema.properties[prop];
            /* eslint-disable max-depth*/
            if (property.readOnly && bodyType === BODY_TYPE.REQUEST) {
              delete localSchema.properties[prop];
            }
            else if (property.writeOnly && bodyType === BODY_TYPE.RESPONSE) {
              delete localSchema.properties[prop];
            }
            /* eslint-enable*/
          }
        }
      }
      else {
        localSchema.type = 'string';
        localSchema.default = '<object>';
      }
    }
    else if (localSchema.type === 'array' && localSchema.items) {

      // This nonsense is needed because the schemaFaker doesn't respect options.maxItems/minItems
      localSchema.maxItems = 2;
      localSchema.minItems = 2;
      localSchema.items = this.resolveRefs(localSchema.items, bodyType, components, stack);
    }
    else if (!localSchema.default) {
      if (localSchema.hasOwnProperty('type')) {
        if (!localSchema.hasOwnProperty('format')) {
          localSchema.default = '<' + localSchema.type + '>';
        }
        else if (type.hasOwnProperty(localSchema.type)) {
          localSchema.default = type[localSchema.type][localSchema.format];

          // in case the format is a custom format (email, hostname etc.)
          // https://swagger.io/docs/specification/data-models/data-types/#string
          if (!localSchema.default && localSchema.format) {
            localSchema.default = '<' + localSchema.format + '>';
          }
        }
        else {
          localSchema.default = '<' + localSchema.type + (localSchema.format ? ('-' + localSchema.format) : '') + '>';
        }
      }
      else if (localSchema.enum && localSchema.enum.length > 0) {
        return {
          type: (typeof (localSchema.enum[0])),
          value: localSchema.enum[0]
        };
      }
      else {
        return {
          type: 'string',
          default: 'schema type not provided'
        };
      }
      if (!localSchema.type) {
        localSchema.type = 'string';
      }
      delete localSchema.format;
    }

    return localSchema;
  }
};
