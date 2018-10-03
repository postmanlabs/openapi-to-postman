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
      for (prop in schema.properties) {
        if (schema.properties.hasOwnProperty(prop)) {
          schema.properties[prop] = this.resolveRefs(schema.properties[prop], components);
        }
      }
    }
    if (schema.type === 'array' && schema.items) {

      // This nonsense is needed because the schemaFaker doesn't respect options.maxItems/minItems
      schema.maxItems = 2;
      schema.minItems = 2;
      schema.items = this.resolveRefs(schema.items, components);
    }
    if (schema.type === 'string') {
      if (!schema.default) {
        schema.default = '<string>';
      }
    }

    return schema;
  }
};
