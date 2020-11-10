const _ = require('lodash'),
  mergeAllOfSchemas = require('json-schema-merge-allof');

/**
 * This function merges multiple Json schemas into singular Json Schema based on defined options.
 *
 * @param {Array} schemas - Array of Json Schemas to be merged
 * @param {*} options - Options
 * @returns {*} - Single Merged Json Schema
 */
function mergeJsonSchemas (schemas, options) {
  let mergedSchema;

  try {
    mergedSchema = mergeAllOfSchemas({
      allOf: schemas
    }, {
      resolvers: {
        // for keywords in OpenAPI schema that are not standard defined JSON schema keywords, use default resolver
        defaultResolver: (compacted) => { return compacted[0]; },
        // for resolving conflicts with differnt "type" of schema
        type: (compacted) => {
          // existing handling defined by json-schema-merge-all-of module for keyword 'type'
          if (compacted.some(Array.isArray)) {
            var normalized = compacted.map(function(val) {
                return Array.isArray(val) ? val : [val];
              }),
              // eslint-disable-next-line prefer-spread
              common = intersection.apply(null, normalized);

            if (common.length === 1) {
              return common[0];
            }
            else if (common.length > 1) {
              return uniq(common);
            }
          }
          // added handling for keyword 'type' when multiple of it present
          else if (compacted.length > 0) {
            let counts = {},
              maxCount = { keyword: compacted[0], count: 1 };

            // prioritize object > array > primitive data types
            if (compacted.some((element) => { return element === 'object'; })) {
              return 'object';
            }
            else if (compacted.some((element) => { return element === 'array'; })) {
              return 'array';
            }
            for (let i = 0; i < compacted.length; i++) {
              counts[compacted[i]] = 1 + (counts[compacted[i]] || 0);
              // keep track of keyword with max occurance
              if (counts[compacted[i]] > maxCount.count) {
                maxCount.count = counts[compacted[i]];
                maxCount.keyword = compacted[i];
              }
            }
            return maxCount.keyword;
          }
        },
        // for resolving proprties keyword (this is needed to apply required keyword according to options)
        properties(values, key, mergers, moduleOptions) {
          // all defined function are same from module
          let keys = (obj) => {
              if (_.isPlainObject(obj) || Array.isArray(obj)) {
                return Object.keys(obj);
              }
              return [];
            },
            withoutArr = (arr, ...rest) => { return _.without.apply(null, [arr].concat(_.flatten(rest))); },
            allUniqueKeys = (arr) => { return _.uniq(_.flattenDeep(arr.map(keys))); },
            getItemSchemas = (subSchemas, key) => {
              return subSchemas.map(function(sub) {
                if (!sub) {
                  return;
                }

                if (Array.isArray(sub.items)) {
                  var schemaAtPos = sub.items[key];
                  if (isSchema(schemaAtPos)) {
                    return schemaAtPos;
                  }
                  else if (sub.hasOwnProperty('additionalItems')) {
                    return sub.additionalItems;
                  }
                }
                else {
                  return sub.items;
                }
              });
            },
            getValues = (schemas, key) => {
              return schemas.map((schema) => { return schema && schema[key]; });
            },
            notUndefined = (val) => { return val !== undefined; },
            mergeSchemaGroup = (group, mergeSchemas, source) => {
              var allKeys = allUniqueKeys(source || group),
                extractor = source ? getItemSchemas : getValues;

              return allKeys.reduce(function(all, key) {
                var schemas = extractor(group, key),
                  compacted = _.uniqWith(schemas.filter(notUndefined), _.compare);

                all[key] = mergeSchemas(compacted, key);
                return all;
              }, source ? [] : {});
            },
            removeFalseSchemas = (target) => {
              forEach(target, function(schema, prop) {
                if (schema === false) {
                  delete target[prop];
                }
              });
            };


          // first get rid of all non permitted properties
          if (!moduleOptions.ignoreAdditionalProperties) {
            values.forEach(function(subSchema) {
              var otherSubSchemas = values.filter((s) => { return s !== subSchema; }),
                ownKeys = keys(subSchema.properties),
                ownPatternKeys = keys(subSchema.patternProperties),
                ownPatterns = ownPatternKeys.map((k) => { return new RegExp(k); });

              otherSubSchemas.forEach(function(other) {
                var allOtherKeys = keys(other.properties),
                  keysMatchingPattern = allOtherKeys.filter((k) => {
                    return ownPatterns.some((pk) => { return pk.test(k); });
                  }),
                  additionalKeys = withoutArr(allOtherKeys, ownKeys, keysMatchingPattern);

                additionalKeys.forEach(function(key) {
                  other.properties[key] = mergers.properties([
                    other.properties[key], subSchema.additionalProperties
                  ], key);
                });
              });
            });

            // remove disallowed patternProperties
            values.forEach(function(subSchema) {
              var otherSubSchemas = values.filter((s) => { return s !== subSchema; }),
                ownPatternKeys = keys(subSchema.patternProperties);
              if (subSchema.additionalProperties === false) {
                otherSubSchemas.forEach(function(other) {
                  var allOtherPatterns = keys(other.patternProperties),
                    additionalPatternKeys = withoutArr(allOtherPatterns, ownPatternKeys);
                  additionalPatternKeys.forEach((key) => { delete other.patternProperties[key]; });
                });
              }
            });
          }

          var returnObject = {
              additionalProperties: mergers.additionalProperties(values.map((s) => { return s.additionalProperties; })),
              patternProperties: mergeSchemaGroup(values.map((s) => { return s.patternProperties; }),
                mergers.patternProperties),
              properties: mergeSchemaGroup(values.map((s) => { return s.properties; }), mergers.properties)
            },
            propsMap = {},
            requiredProps;

          if (returnObject.additionalProperties === false) {
            removeFalseSchemas(returnObject.properties);
          }

          // owned logic by this module starts from here till return
          // count occurence of each props across all values
          if (options.requireCommonProps) {
            values.map((value) => {
              if (typeof value.properties === 'object') {
                let keys = Object.keys(value.properties);
                keys.map((prop) => {
                  typeof propsMap[prop] === 'undefined' && (propsMap[prop] = 0);
                  propsMap[prop] += 1;
                });
              }
            });

            // delete props which doesn't exist in all values
            keys(propsMap).map((prop) => {
              if (propsMap[prop] !== values.length) {
                delete propsMap[prop];
              }
            });
            requiredProps = Object.keys(propsMap);
            // add required property to returned object
            if (requiredProps.length && typeof returnObject.properties === 'object') {
              returnObject.required = requiredProps;
            }
          }

          return returnObject;
        }
      }
    });
  }
  catch (e) {
    console.warn('Pm2OasError: Error while merging JSON schemas', e.message);
    // return callback(e);
    return;
  }
  // return callback(null, mergedSchema);
  return mergedSchema;
}

module.exports = mergeJsonSchemas;
