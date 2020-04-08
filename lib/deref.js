const _ = require('lodash'),
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
  PARAMETER_SOURCE = {
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
   * @param {string} parameterSourceOption tells that the schema object is of request or response
   * @param {*} components components in openapi spec.
   * @param {object} schemaResolutionCache stores already resolved references
   * @param {*} resolveFor - resolve refs for validation/conversion (value to be one of VALIDATION/CONVERSION)
   * @param {*} stack counter which keeps a tab on nested schemas
   * @param {*} seenRef References that are repeated. Used to identify circular references.
   * @returns {*} schema - schema that adheres to all individual schemas in schemaArr
   */
  resolveAllOf: function (schemaArr, parameterSourceOption, components, schemaResolutionCache,
    resolveFor = 'CONVERSION', stack = 0, seenRef) {

    if (!(schemaArr instanceof Array)) {
      return null;
    }

    if (schemaArr.length === 1) {
      // for just one entry in allOf, don't need to enforce type: object restriction
      return this.resolveRefs(schemaArr[0], parameterSourceOption, components, schemaResolutionCache, resolveFor,
        stack, seenRef);
    }

    // generate one object for each schema
    let indivObjects = schemaArr.map((schema) => {
        return this.resolveRefs(schema, parameterSourceOption, components, schemaResolutionCache, resolveFor,
          stack, seenRef);
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
   * @param {string} parameterSourceOption tells that the schema object is of request or response
   * @param {*} components components in openapi spec.
   * @param {object} schemaResolutionCache stores already resolved references
   * @param {*} resolveFor - resolve refs for validation/conversion (value to be one of VALIDATION/CONVERSION)
   * @param {*} stack counter which keeps a tab on nested schemas
   * @param {*} seenRef - References that are repeated. Used to identify circular references.
   * @returns {*} schema satisfying JSON-schema-faker.
   */
  resolveRefs: function (schema, parameterSourceOption, components, schemaResolutionCache,
    resolveFor = 'CONVERSION', stack = 0, seenRef = {}) {

    var resolvedSchema, prop, splitRef;
    stack++;
    schemaResolutionCache = schemaResolutionCache || {};
    if (stack > 20) {
      return { value: '<Error: Too many levels of nesting to fake this schema>' };
    }

    if (!schema) {
      return { value: '<Error: Schema not found>' };
    }

    if (schema.anyOf) {
      return this.resolveRefs(schema.anyOf[0], parameterSourceOption, components, schemaResolutionCache, resolveFor,
        stack, _.cloneDeep(seenRef));
    }
    if (schema.oneOf) {
      return this.resolveRefs(schema.oneOf[0], parameterSourceOption, components, schemaResolutionCache, resolveFor,
        stack, _.cloneDeep(seenRef));
    }
    if (schema.allOf) {
      return this.resolveAllOf(schema.allOf, parameterSourceOption, components, schemaResolutionCache, resolveFor,
        stack, _.cloneDeep(seenRef));
    }
    if (schema.$ref && _.isFunction(schema.$ref.split)) {
      let refKey = schema.$ref;

      // if this reference is seen before, ignore and move on.
      if (seenRef[refKey]) {
        return { value: '<Circular reference to ' + refKey + ' detected>' };
      }
      // add to seen array if not encountered before.
      seenRef[refKey] = stack;

      // points to an existing location
      // .split will return [#, components, schemas, schemaName]
      splitRef = refKey.split('/');

      if (splitRef.length < 4) {
        // not throwing an error. We didn't find the reference - generate a dummy value
        return { value: 'reference ' + schema.$ref + ' not found in the OpenAPI spec' };
      }
      if (schemaResolutionCache[refKey]) {
        return schemaResolutionCache[refKey];
      }
      // something like #/components/schemas/PaginationEnvelope/properties/page
      // will be resolved - we don't care about anything after the components part
      // splitRef.slice(1) will return ['components', 'schemas', 'PaginationEnvelope', 'properties', 'page']
      // not using _.get here because that fails if there's a . in the property name (Pagination.Envelope, for example)
      resolvedSchema = this._getEscaped(components, splitRef.slice(1));

      if (resolvedSchema) {
        let refResolvedSchema = this.resolveRefs(resolvedSchema, parameterSourceOption,
          components, schemaResolutionCache, resolveFor, stack, _.cloneDeep(seenRef));
        schemaResolutionCache[refKey] = refResolvedSchema;
        return refResolvedSchema;
      }
      return { value: 'reference ' + schema.$ref + ' not found in the OpenAPI spec' };
    }
    if (schema.type === 'object' || schema.hasOwnProperty('properties')) {
      // go through all props
      schema.type = 'object';
      if (schema.hasOwnProperty('properties')) {
        // shallow cloning schema object except properties object
        let tempSchema = _.omit(schema, 'properties');
        tempSchema.properties = {};
        for (prop in schema.properties) {
          if (schema.properties.hasOwnProperty(prop)) {
            /* eslint-disable max-depth */
            // handling OAS readOnly and writeOnly properties in schema
            // Related Doc - https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject
            let property = schema.properties[prop];

            if (!property) {
              continue;
            }

            if (property.readOnly && parameterSourceOption === PARAMETER_SOURCE.REQUEST) {
              continue;
            }
            else if (property.writeOnly && parameterSourceOption === PARAMETER_SOURCE.RESPONSE) {
              continue;
            }
            /* eslint-enable */
            tempSchema.properties[prop] = this.resolveRefs(property,
              parameterSourceOption, components, schemaResolutionCache, resolveFor, stack, _.cloneDeep(seenRef));
          }
        }
        return tempSchema;
      }

      schema.type = 'string';
      schema.default = '<object>';
    }
    else if (schema.type === 'array' && schema.items) {

      // For VALIDATION - keep minItems and maxItems properties defined by user in schema as is
      // FOR CONVERSION - need to set both properties to 2 for schema faking
      if (resolveFor === 'CONVERSION') {
        // This is needed because the schemaFaker doesn't respect options.maxItems/minItems
        schema.maxItems = 2;
        schema.minItems = 2;
      }
      // have to create a shallow clone of schema object,
      // so that the original schema.items object will not change
      // without this, schemas with circular references aren't faked correctly
      let tempSchema = _.omit(schema, 'items');
      tempSchema.items = this.resolveRefs(schema.items, parameterSourceOption,
        components, schemaResolutionCache, resolveFor, stack, _.cloneDeep(seenRef));
      return tempSchema;
    }
    else if (!schema.hasOwnProperty('default')) {
      if (schema.hasOwnProperty('type')) {
        if (!schema.hasOwnProperty('format')) {
          schema.default = '<' + schema.type + '>';
        }
        else if (type.hasOwnProperty(schema.type)) {
          schema.default = type[schema.type][schema.format];

          // in case the format is a custom format (email, hostname etc.)
          // https://swagger.io/docs/specification/data-models/data-types/#string
          if (!schema.default && schema.format) {
            schema.default = '<' + schema.format + '>';
          }
        }
        else {
          schema.default = '<' + schema.type + (schema.format ? ('-' + schema.format) : '') + '>';
        }
      }
      else if (schema.enum && schema.enum.length > 0) {
        return {
          type: (typeof (schema.enum[0])),
          value: schema.enum[0]
        };
      }
      else {
        return {
          type: 'string',
          default: 'schema type not provided'
        };
      }
      if (!schema.type) {
        schema.type = 'string';
      }
      delete schema.format;
    }

    return schema;
  }
};
