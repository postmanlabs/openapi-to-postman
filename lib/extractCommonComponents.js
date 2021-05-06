const _ = require('lodash'),
  utils = require('./schemaUtils'),
  mergeAllOf = require('json-schema-merge-allof'),
  primitiveTypes = ['string', 'integer', 'number', 'boolean'],
  validTypes = ['array', 'object', 'string', 'integer', 'number', 'boolean'];

/**
 *
 * @param {String} propNameType String containig property name and type separated by comma (,)
 * @returns {String} Property name from input string (first segment)
 */
function getPropName (propNameType) {
  return propNameType.split(',')[0];
}

/**
 * Fetches common properties among schemas and generates common component
 *
 * @param {Object} commonProp Common property to extract from schemas
 * @param {String} schemaKeys Schema keys of schema containing common properties
 * @param {Object} allSchemas Map containing all schemas with schema keys
 * @returns {Object} Generated common component
 */
function getCommonComponent (commonProp, schemaKeys, allSchemas) {
  let schemas = _.map(_.split(schemaKeys, ','), (schemaKey) => {
    let schema = _.cloneDeep(allSchemas[schemaKey].schema),
      target = schema.allOf ? _.last(schema.allOf) : schema;

    schema.properties = _.pick(target.properties, _.map(commonProp, getPropName));
    return schema;
  });

  // merge all schemas to retain data from all schemas
  return mergeAllOf({
    allOf: schemas
  }, {
    resolvers: {
      defaultResolver: (compacted) => { return compacted[0]; }
    }
  });
}

/**
 * Creates minified schema from OAS Schema object.
 * Also separates nested schemas from parent schema to make extraction process simpler
 *
 * @param {Object} schema Schema to be minified
 * @param {String} key Name/Key of schema to be minified
 * @param {Integer} nestingLevel Nesting level till which common components are to be ecxtracted
 * @param {Object} allSchemas Map containing all schemas with schema keys
 * @returns {*} Converted minified schema
 */
function createMinifiedSchema (schema, key, nestingLevel, allSchemas) {
  let minifiedSchema = {},
    names = [],
    types = [];

  if (!_.isObject(schema) && !schema.type) {
    return;
  }

  if (schema.type === 'object') {
    // go through all properties
    _.forEach(_.get(schema, 'properties'), (propSchema, propName) => {
      let type = _.get(propSchema, 'type', 'string'), // default is string
        schemaName;

      names.push(propName);
      if ((type === 'object' || type === 'array') && nestingLevel > 1) {
        schemaName = utils.generateSchemaName(_.camelCase(`${key} ${propName}`), allSchemas);
        type = schemaName;
        allSchemas[schemaName] = {
          schema: propSchema,
          minifiedSchema: createMinifiedSchema(propSchema, schemaName, nestingLevel - 1, allSchemas)
        };
      }
      types.push(type);
    });

    minifiedSchema.object = { names, types };
  }
  else if (schema.type === 'array') {
    let arrayType = _.get(schema, 'items.type', 'string'),
      arraySchema = _.get(schema, 'items'),
      schemaName;

    if ((arrayType === 'object' || arrayType === 'array') && nestingLevel > 1) {
      schemaName = utils.generateSchemaName(_.camelCase(`${key} Array`), allSchemas);
      arrayType = schemaName;
      allSchemas[schemaName] = {
        schema: arraySchema,
        minifiedSchema: createMinifiedSchema(arraySchema, schemaName, nestingLevel - 1, allSchemas)
      };
    }
    minifiedSchema.array = arrayType;
  }
  else {
    minifiedSchema[schema.type] = _.includes(primitiveTypes, schema.type) ? schema.type : 'string';
  }
  return minifiedSchema;
}

/**
 * Iterates over schema properties/items to resolve any unresolved nested child schemas
 *
 * @param {String} schemaKey Key/Name of schema to be resolved
 * @param {Object} components OAS defined components object
 * @param {*} allSchemas Map containing all schemas with schema keys
 * @returns {*} null
 */
function resolveSchema (schemaKey, components, allSchemas) {
  let schema = allSchemas[schemaKey].schema,
    minifiedSchema = allSchemas[schemaKey].minifiedSchema,
    subSchemas = {};

  _.forEach(_.get(minifiedSchema, 'object.types', []), (type, index) => {
    if (!_.includes(validTypes, type)) {
      subSchemas[_.get(minifiedSchema, `object.names[${index}]`)] = type;
    }
  });

  if (schema.$ref) {
    let refSchemaName = _.split(schema.$ref, '/').pop();
    resolveSchema(refSchemaName, components, allSchemas);
  }

  if (minifiedSchema.array && !_.includes(validTypes, minifiedSchema.array)) {
    resolveSchema(minifiedSchema.array, components, allSchemas);
    schema.items = allSchemas[minifiedSchema.array].schema;
  }

  if (schema.allOf && !schema.allOf[schema.allOf.length - 1].$ref) {
    schema = schema.allOf[schema.allOf.length - 1];
  }

  _.forEach(schema.properties, (prop, propName) => {
    if (subSchemas[propName]) {
      resolveSchema(subSchemas[propName], components, allSchemas);
      prop = allSchemas[subSchemas[propName]].schema;
    }
  });

  // _.forEach(subSchemas, (schemaType, schemaName) => {
  //   if (_.get(schema, 'properties.' + schemaName)) {
  //     resolveSchema(subSchemas[propName], allSchemas);
  //     _.set(schema, 'properties.' + schemaName, allSchemas[schemaType].schema);
  //   }
  //   else if (schema.$ref) {
  //     let refSchemaName = _.split(schema.$ref, '/').pop();

  //     resolveSchema(refSchemaName, allSchemas);
  //     _.set(allSchemas, 'properties.' + schemaName, allSchemas[schemaType].schema);
  //   }
  // });
}

/**
 * Extracts common components from given set of schemas and stores it in components object
 * Also uses schema inheritance to reference extracted components
 *
 * @param {Object} schemas Array of OAS schema objects
 * @param {Object} components OAS defined components object
 * @param {Object} options Options to be used while extraction
 * @returns {Object} Schema objects after extraction is done
 */
function extractCommonComponents (schemas, components, options) {
  let allSchemas = {},
    allPropsMap = {},
    commonProps = {},
    nestingLevels = options.extractionLevels || 1;

  // flatten schemas based on defined nesting levels till which extraction is to happen
  _.forEach(schemas, (schema, key) => {
    let minifiedSchema = createMinifiedSchema(schema, key, nestingLevels, allSchemas);
    allSchemas[key] = { schema, minifiedSchema };
  });

  // create property map out of all schema with type object
  _.forEach(allSchemas, (schema, key) => {
    if (schema.minifiedSchema.object) {
      // store property name and type under all properties map
      _.forEach(_.zip(schema.minifiedSchema.object.names, schema.minifiedSchema.object.types), (prop) => {
        let propNameType = _.join(prop, ',');
        allPropsMap[propNameType] = _.concat(allPropsMap[propNameType] || [], key);
      });
    }
  });

  // reverse map the common properties with all schemas they occur
  _.forEach(allPropsMap, (schemaKeysArr, propNameType) => {
    let schemaKeys = _.join(schemaKeysArr, ',');
    commonProps[schemaKeys] = _.concat(commonProps[schemaKeys] || [], propNameType);
  });

  // extract common properties into components
  _.forEach(commonProps, (commonProp, schemaKeys) => {
    let componentName,
      commonComponent,
      refObject,
      firstSchemaKey;

    // for now extract only if more than 3 properties are common
    if (commonProp.length >= 3) {
      firstSchemaKey = schemaKeys.split(',')[0];
      // generate component name from first schema name encountered
      componentName = utils.generateSchemaName(firstSchemaKey + 'SubSchema', components);

      // assign common component
      commonComponent = getCommonComponent(commonProp, schemaKeys, allSchemas);
      _.set(components, 'schemas.' + componentName, commonComponent);
      allSchemas[componentName] = commonComponent;

      refObject = { $ref: '#/components/schemas/' + componentName };
      // remove common properties from schema and use reference instead
      _.forEach(_.split(schemaKeys, ','), (schemaKey) => {
        _.forEach(commonProp, (propNameType) => {
          let target = '';
          allSchemas[schemaKey].schema.allOf && (target = `allOf[${allSchemas[schemaKey].schema.allOf.length - 1}].`);
          _.unset(allSchemas[schemaKey].schema, target + 'properties.' + getPropName(propNameType));
        });

        // insert ref object as second last element
        if (allSchemas[schemaKey].schema.allOf) {
          allSchemas[schemaKey].schema.allOf.splice(allSchemas[schemaKey].schema.allOf.length - 1, 0, refObject);

          if (_.isEmpty(_.last(allSchemas[schemaKey].schema.allOf).properties)) {
            allSchemas[schemaKey].schema.allOf.pop();
          }
        }
        // use entire schema as ref if all properties are common
        else if (_.isEmpty(allSchemas[schemaKey].schema.properties) &&
          _.keys(allSchemas[schemaKey].schema).length <= 2) {
          allSchemas[schemaKey].schema = refObject;
        }
        // use inheritance to represent extracted component in schema
        else {
          allSchemas[schemaKey].schema = { allOf: [refObject, allSchemas[schemaKey].schema] };
        }
      });
    }
  });

  // resolve schema (putting back flattened )
  _.forEach(schemas, (schema, schemaKey) => {
    resolveSchema(schemaKey, components, allSchemas);

    schema = allSchemas[schemaKey].schema;
  });

  return _.mapValues(schemas, (schema, schemaKey) => {
    return allSchemas[schemaKey].schema;
  });
}

module.exports = extractCommonComponents;
