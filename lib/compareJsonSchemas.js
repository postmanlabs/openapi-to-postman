const _ = require('lodash');

var normalizeArray = (val) => { return Array.isArray(val) ? val : [val]; },
  undef = (val) => { return val === undefined; },
  keys = (obj) => { return _.isPlainObject(obj) || Array.isArray(obj) ? Object.keys(obj) : []; },
  has = (obj, key) => { return obj.hasOwnProperty(key); },
  stringArray = (arr) => { return _.sortBy(_.uniq(arr)); },
  undefEmpty = (val) => { return undef(val) || (Array.isArray(val) && val.length === 0); },
  keyValEqual = (a, b, key, compare) => { return b && has(b, key) && a && has(a, key) && compare(a[key], b[key]); },
  undefAndZero = (a, b) => { return (undef(a) && b === 0) || (undef(b) && a === 0) || _.isEqual(a, b); },
  falseUndefined = (a, b) => { return (undef(a) && b === false) || (undef(b) && a === false) || _.isEqual(a, b); },
  emptySchema = (schema) => { return undef(schema) || _.isEqual(schema, {}) || schema === true; },
  emptyObjUndef = (schema) => { return undef(schema) || _.isEqual(schema, {}); },
  isSchema = (val) => { return undef(val) || _.isPlainObject(val) || val === true || val === false; },
  comparers,
  acceptsUndefined,
  schemaProps;

// eslint-disable-next-line require-jsdoc
function undefArrayEqual(a, b) {
  if (undefEmpty(a) && undefEmpty(b)) {
    return true;
  }
  return _.isEqual(stringArray(a), stringArray(b));
}

// eslint-disable-next-line require-jsdoc
function unsortedNormalizedArray(a, b) {
  a = normalizeArray(a);
  b = normalizeArray(b);
  return _.isEqual(stringArray(a), stringArray(b));
}

// eslint-disable-next-line require-jsdoc
function schemaGroup(a, b, key, compare) {
  var allProps = _.uniq(keys(a).concat(keys(b)));
  if (emptyObjUndef(a) && emptyObjUndef(b)) {
    return true;
  }
  else if (emptyObjUndef(a) && keys(b).length) {
    return false;
  }
  else if (emptyObjUndef(b) && keys(a).length) {
    return false;
  }

  return allProps.every(function(key) {
    var aVal = a[key],
      bVal = b[key];
    if (Array.isArray(aVal) && Array.isArray(bVal)) {
      return _.isEqual(stringArray(a), stringArray(b));
    }
    else if (Array.isArray(aVal) && !Array.isArray(bVal)) {
      return false;
    }
    else if (Array.isArray(bVal) && !Array.isArray(aVal)) {
      return false;
    }
    return keyValEqual(a, b, key, compare);
  });
}

// eslint-disable-next-line require-jsdoc
function items(a, b, key, compare) {
  if (_.isPlainObject(a) && _.isPlainObject(b)) {
    return compare(a, b);
  }
  else if (Array.isArray(a) && Array.isArray(b)) {
    return schemaGroup(a, b, key, compare);
  }
  return _.isEqual(a, b);
}

// eslint-disable-next-line require-jsdoc
function unsortedArray(a, b, key, compare) {
  var uniqueA = _.uniqWith(a, compare),
    uniqueB = _.uniqWith(b, compare),
    inter = _.intersectionWith(uniqueA, uniqueB, compare);
  return inter.length === Math.max(uniqueA.length, uniqueB.length);
}

comparers = {
  title: _.isEqual,
  uniqueItems: falseUndefined,
  minLength: undefAndZero,
  minItems: undefAndZero,
  minProperties: undefAndZero,
  required: undefArrayEqual,
  enum: undefArrayEqual,
  type: unsortedNormalizedArray,
  items: items,
  anyOf: unsortedArray,
  allOf: unsortedArray,
  oneOf: unsortedArray,
  properties: schemaGroup,
  patternProperties: schemaGroup,
  dependencies: schemaGroup
};

acceptsUndefined = [
  'properties',
  'patternProperties',
  'dependencies',
  'uniqueItems',
  'minLength',
  'minItems',
  'minProperties',
  'required'
];

schemaProps = ['additionalProperties', 'additionalItems', 'contains', 'propertyNames', 'not'];

// eslint-disable-next-line require-jsdoc
function compare(a, b, options) {
  options = _.defaults(options, {
    ignore: []
  });

  if (emptySchema(a) && emptySchema(b)) {
    return true;
  }

  if (!isSchema(a) || !isSchema(b)) {
    throw new Error('Either of the values are not a JSON schema.');
  }
  if (a === b) {
    return true;
  }

  if (_.isBoolean(a) && _.isBoolean(b)) {
    return a === b;
  }

  if ((a === undefined && b === false) || (b === undefined && a === false)) {
    return false;
  }

  if ((undef(a) && !undef(b)) || (!undef(a) && undef(b))) {
    return false;
  }

  var allKeys = _.uniq(Object.keys(a).concat(Object.keys(b)));

  if (options.ignore.length) {
    allKeys = allKeys.filter((k) => { return options.ignore.indexOf(k) === -1; });
  }

  if (!allKeys.length) {
    return true;
  }

  // eslint-disable-next-line require-jsdoc
  function innerCompare(a, b) {
    return compare(a, b, options);
  }

  return allKeys.every(function(key) {
    var aValue = a[key],
      bValue = b[key],
      comparer,
      result;

    if (schemaProps.indexOf(key) !== -1) {
      return compare(aValue, bValue, options);
    }

    comparer = comparers[key];
    if (!comparer) {
      comparer = _.isEqual;
    }

    // do simple lodash check first
    if (_.isEqual(aValue, bValue)) {
      return true;
    }

    if (acceptsUndefined.indexOf(key) === -1) {
      if ((!has(a, key) && has(b, key)) || (has(a, key) && !has(b, key))) {
        return aValue === bValue;
      }
    }

    result = comparer(aValue, bValue, key, innerCompare);
    if (!_.isBoolean(result)) {
      throw new Error('Comparer must return true or false');
    }
    return result;
  });
}

module.exports = compare;
