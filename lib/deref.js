var type = {
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
  resolveRefs: function (schema, components) {
    var savedSchemaName, prop;

    if (schema.anyOf) {
      return this.resolveRefs(schema.anyOf[0], components);
    }
    if (schema.$ref) {
      // points to an existing location
      // .split will return [#, components, schemas, schemaName]
      savedSchemaName = schema.$ref.split('/').slice(3)[0];
      if (components.schemas[savedSchemaName]) {
        return this.resolveRefs(components.schemas[savedSchemaName], components);
      }
      return { value: 'reference ' + schema.$ref + ' not found in the api spec' };
    }
    if (schema.type === 'object' || schema.hasOwnProperty('properties')) {
      // go through all props
      schema.type = 'object';
      if (schema.hasOwnProperty('properties')) {
        for (prop in schema.properties) {
          if (schema.properties.hasOwnProperty(prop)) {
            schema.properties[prop] = this.resolveRefs(schema.properties[prop], components);
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
      schema.items = this.resolveRefs(schema.items, components);
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
      else {
        schema.default = 'schema type not provided';
      }
      schema.type = 'string';
      delete schema.format;
    }

    return schema;
  }
};
