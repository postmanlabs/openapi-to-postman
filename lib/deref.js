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
  };

module.exports = {
  /**
   * Resolves references to components for a given schema.
   * @param {*} schema (openapi) to resolve references.
   * @param {*} components components in openapi spec.
   * @returns {*} schema satisfying JSON-schema-faker.
   */
  // stack is a counter which keeps a tab on nested schemas
  resolveRefs: function (schema, components, stack = 0) {
    var resolvedSchema, prop, splitRef;
    stack++;

    if (stack > 20) {
      return { value: '<Error: Too many levels of nesting to fake this schema>' };
    }

    if (schema.anyOf) {
      return this.resolveRefs(schema.anyOf[0], components, stack);
    }
    if (schema.oneOf) {
      return this.resolveRefs(schema.oneOf[0], components, stack);
    }
    if (schema.$ref) {
      // points to an existing location
      // .split will return [#, components, schemas, schemaName]
      splitRef = schema.$ref.split('/');

      if (splitRef.length < 4) {
        throw new openApiErr(`Invalid schema reference: ${schema.$ref}`);
      }

      // something like #/components/schemas/PaginationEnvelope/properties/page
      // will be resolved - we don't care about anything after the components part
      // splitRef.slice(2).join('.') will return 'schemas.PaginationEnvelope.properties.page'
      resolvedSchema = _.get(components, splitRef.slice(2).join('.'));
      if (resolvedSchema) {
        return this.resolveRefs(resolvedSchema, components, stack);
      }
      return { value: 'reference ' + schema.$ref + ' not found in the api spec' };
    }
    if (schema.type === 'object' || schema.hasOwnProperty('properties')) {
      // go through all props
      schema.type = 'object';
      if (schema.hasOwnProperty('properties')) {
        for (prop in schema.properties) {
          if (schema.properties.hasOwnProperty(prop)) {
            schema.properties[prop] = this.resolveRefs(schema.properties[prop], components, stack);
          }
        }
      }
      else {
        schema.type = 'string';
        schema.default = '<object>';
      }
    }
    else if (schema.type === 'array' && schema.items) {

      // This nonsense is needed because the schemaFaker doesn't respect options.maxItems/minItems
      schema.maxItems = 2;
      schema.minItems = 2;
      schema.items = this.resolveRefs(schema.items, components, stack);
    }
    else if (!schema.default) {
      if (schema.hasOwnProperty('type')) {
        if (!schema.hasOwnProperty('format')) {
          schema.default = '<' + schema.type + '>';
        }
        else if (type.hasOwnProperty(schema.type)) {
          schema.default = type[schema.type][schema.format];
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
        // @TODO - schema with property allOf.
        // following is tmp solution.
        return {
          type: 'string',
          default: 'schema type not provided'
        };
      }
      schema.type = 'string';
      delete schema.format;
    }

    return schema;
  }
};
