const _ = require('lodash'),
  expect = require('chai').expect,
  schemaFaker = require('../../assets/json-schema-faker.js'),

  // The options libV2 generation actually fakes with, minus the reuse flag each test sets.
  BASE_OPTIONS = {
    requiredOnly: false,
    optionalsProbability: 1.0,
    maxLength: 256,
    minItems: 1,
    maxItems: 20,
    useDefaultValue: true,
    useExamplesValue: true,
    ignoreMissingRefs: true,
    avoidExampleItemsLength: true,
    failOnInvalidFormat: false,
    defaultMinItems: 2,
    defaultMaxItems: 2
  };

/**
 * Fakes a schema with the generation options, toggling sub-schema value reuse.
 *
 * @param {Object} schema - Schema to fake
 * @param {Boolean} reuse - Whether identical sub-schemas should share one generated value
 * @returns {*} Faked value
 */
function fake (schema, reuse) {
  schemaFaker.option(_.assign({}, BASE_OPTIONS, { reuseIdenticalSubSchemas: reuse }));
  return schemaFaker(schema, null, new Map());
}

/**
 * Counts how many distinct values a list holds, compared structurally.
 *
 * @param {Array} values - Values to compare
 * @returns {Number} Number of distinct values
 */
function distinct (values) {
  return _.uniqBy(values, function (value) { return JSON.stringify(value); }).length;
}

describe('json-schema-faker sub-schema value reuse', function () {
  let previousOptions;

  before(function () {
    // The faker is one shared instance and its options are process wide, so remember the current
    // value of every option this file overwrites and put them all back in `after`.
    const overwritten = _.assign({}, BASE_OPTIONS, { reuseIdenticalSubSchemas: false });

    previousOptions = _.mapValues(overwritten, function (value, name) {
      return schemaFaker.option(name);
    });
  });

  afterEach(function () {
    // Never leave reuse enabled between cases in this file.
    schemaFaker.option({ reuseIdenticalSubSchemas: false });
  });

  after(function () {
    schemaFaker.option(previousOptions);
  });

  it('should be disabled by default so ordinary generation is unchanged', function () {
    schemaFaker.option(_.assign({}, BASE_OPTIONS));
    expect(schemaFaker.option('reuseIdenticalSubSchemas')).to.equal(false);
  });

  it('should generate one value per shared sub-schema when enabled', function () {
    // A single schema object referenced from four properties - the shape `_resolveSchema`
    // produces for four `$ref`s to the same component.
    const shared = { type: 'integer', minimum: 1, maximum: 1000000000 },
      schema = {
        type: 'object',
        required: ['a', 'b', 'c', 'd'],
        properties: { a: shared, b: shared, c: shared, d: shared }
      };

    const reused = fake(schema, true);

    expect(distinct([reused.a, reused.b, reused.c, reused.d])).to.equal(1);

    // Without the option each occurrence is generated independently, as before.
    const independent = fake(schema, false);

    expect(distinct([independent.a, independent.b, independent.c, independent.d])).to.be.above(1);
  });

  it('should not reuse across distinct schema objects that merely look alike', function () {
    // Reuse is keyed on object identity, not on structural equality, so two separate objects
    // with the same contents stay independent.
    const schema = {
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: { type: 'integer', minimum: 1, maximum: 1000000000 },
        b: { type: 'integer', minimum: 1, maximum: 1000000000 }
      }
    };

    expect(distinct(_.values(_.pick(fake(schema, true), ['a', 'b'])))).to.equal(2);
  });

  it('should keep the elements of a uniqueItems array distinct', function () {
    // Every element comes from the same `items` object, so reuse has to be suspended or the
    // array would collapse to a single value and break both uniqueItems and minItems.
    const schema = {
      type: 'array',
      uniqueItems: true,
      minItems: 5,
      items: { type: 'integer', minimum: 1, maximum: 100000000 }
    };

    const items = fake(schema, true);

    expect(items).to.have.lengthOf(5);
    expect(distinct(items)).to.equal(5);
  });

  it('should keep a uniqueItems tuple distinct when positions share one schema object', function () {
    // draft-04 tuple form: `items` is an array, and the same object can appear in more than one
    // position. This branch returns early, so it needs its own reuse suspension.
    const shared = { type: 'integer', minimum: 1, maximum: 100000000 },
      schema = { type: 'array', uniqueItems: true, items: [shared, shared, shared] };

    const items = fake(schema, true);

    expect(items).to.have.lengthOf(3);
    expect(distinct(items)).to.equal(3);
  });

  it('should not reuse values from stateful generators', function () {
    // `autoIncrement` and `sequentialDate` return a different value on each call by design, so
    // memoising them would hand every occurrence the same id or timestamp.
    _.forEach([
      { keyword: 'x-autoIncrement', type: 'integer' },
      { keyword: 'x-sequentialDate', type: 'string' }
    ], function (testCase) {
      const shared = { type: testCase.type };

      shared[testCase.keyword] = true;

      const schema = {
          type: 'object',
          required: ['a', 'b', 'c', 'd'],
          properties: { a: shared, b: shared, c: shared, d: shared }
        },
        faked = fake(schema, true);

      expect(distinct([faked.a, faked.b, faked.c, faked.d]), testCase.keyword).to.equal(4);
    });
  });

  it('should not reuse a shared container holding a stateful descendant', function () {
    // Checking only the shared node itself is not enough: a plain object or array looks safe to
    // reuse, so it gets cached, its child's generator runs once and every later occurrence is
    // handed that one value. Objects and arrays are built by different code, so check both.
    _.forEach(['object', 'array'], function (containerType) {
      const child = { type: 'integer', 'x-autoIncrement': true },
        container = containerType === 'object' ?
          { type: 'object', required: ['id'], properties: { id: child } } :
          { type: 'array', minItems: 1, items: child },
        schema = {
          type: 'object',
          required: ['a', 'b', 'c'],
          properties: { a: container, b: container, c: container }
        },
        faked = fake(schema, true);

      expect(distinct([faked.a, faked.b, faked.c]), containerType + ' container').to.equal(3);
    });
  });

  it('should still reuse a shared container whose descendants are all pure', function () {
    // The counterpart to the case above: refusing to cache containers outright would have given
    // up the whole optimisation, so a container with no such generator must still be reused.
    const leaf = { type: 'integer', minimum: 1, maximum: 1000000000 },
      middle = { type: 'object', required: ['n'], properties: { n: leaf } },
      container = { type: 'object', required: ['x', 'y'], properties: { x: middle, y: middle } },
      schema = {
        type: 'object',
        required: ['a', 'b', 'c'],
        properties: { a: container, b: container, c: container }
      },
      faked = fake(schema, true);

    expect(distinct([faked.a, faked.b, faked.c])).to.equal(1);
  });

  it('should still reuse values from pure generators such as pattern', function () {
    // `pattern` repeats harmlessly, so it is cached like any other leaf. Excluding every
    // generator would have cost the reuse win on specs that use `pattern` heavily.
    const shared = { type: 'string', pattern: '[a-z]{12}' },
      schema = {
        type: 'object',
        required: ['a', 'b', 'c', 'd'],
        properties: { a: shared, b: shared, c: shared, d: shared }
      };

    const reused = fake(schema, true);

    expect(distinct([reused.a, reused.b, reused.c, reused.d])).to.equal(1);
    expect(reused.a).to.match(/^[a-z]{12}$/);
  });

  it('should leave each occurrence of a shared oneOf free to pick its own branch', function () {
    // A `oneOf` node carries no concrete `type`, so it is never memoised and the branch choice
    // stays per occurrence.
    const shared = {
        oneOf: [
          { type: 'object', required: ['kind'], properties: { kind: { type: 'string', enum: ['first'] } } },
          { type: 'object', required: ['other'], properties: { other: { type: 'string', enum: ['second'] } } }
        ]
      },
      properties = {},
      required = [];

    _.times(60, function (index) {
      properties['p' + index] = shared;
      required.push('p' + index);
    });

    const faked = fake({ type: 'object', required: required, properties: properties }, true),
      branches = _.map(_.values(faked), function (value) { return _.keys(value)[0]; });

    expect(_.uniq(branches).length, 'both oneOf branches should appear across 60 occurrences')
      .to.be.above(1);
  });

  it('should produce the same structure with and without reuse', function () {
    const shared = { type: 'object', required: ['x'], properties: { x: { type: 'integer' } } },
      schema = {
        type: 'object',
        required: ['a', 'b'],
        properties: {
          a: shared,
          b: { type: 'array', minItems: 3, items: shared }
        }
      };

    /**
     * Describes a value's shape, ignoring the leaf values themselves.
     *
     * @param {*} value - Value to describe
     * @returns {*} Structural signature
     */
    function signature (value) {
      if (_.isArray(value)) {
        return _.map(value, signature);
      }
      if (_.isPlainObject(value)) {
        return _.mapValues(value, signature);
      }
      return typeof value;
    }

    expect(signature(fake(schema, true))).to.eql(signature(fake(schema, false)));
  });
});
