const expect = require('chai').expect,
  _ = require('lodash'),
  {
    predictConversionCost,
    predictSchemaCost,
    SchemaCostEvaluator,
    CLASSIFICATION
  } = require('./../../lib/preflight'),
  { arrayLength, SCHEMA_SIZE_OPTIMIZATION_THRESHOLD, MAX_STRING_LENGTH } =
    require('./../../lib/preflight/costModel'),
  { resolvePointer } = require('./../../lib/preflight/schemaCostEvaluator'),

  /**
   * Builds a minimal OAS 3.0 document around a set of component schemas, wiring each into a
   * GET operation whose 200 response returns that schema.
   *
   * @param {Object} schemas - map of component schema name -> schema
   * @param {Object} [extra] - extra top level keys to merge in
   * @returns {Object} an OpenAPI document
   */
  makeSpec = (schemas, extra = {}) => {
    const paths = {};

    Object.keys(schemas).forEach((name) => {
      paths['/' + _.kebabCase(name)] = {
        get: {
          operationId: 'get' + name,
          responses: {
            200: {
              description: 'ok',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/' + name } }
              }
            }
          }
        }
      };
    });

    return _.merge({
      openapi: '3.0.0',
      info: { title: 'preflight fixture', version: '1.0.0' },
      paths,
      components: { schemas }
    }, extra);
  };

describe('preflight: arrayLength', function () {
  // Reproduces assets/json-schema-faker.js `arrayType`, given the module level options
  // minItems: 1, maxItems: 20, optionalsProbability: 1.0.

  it('should use defaultMaxItems when neither minItems nor maxItems is declared', function () {
    expect(arrayLength({ type: 'array' }, 1, 1)).to.equal(1);
    expect(arrayLength({ type: 'array' }, 2, 2)).to.equal(2);
  });

  it('should collapse to defaultMinItems when only maxItems is declared', function () {
    // minItems is unset, so it is overridden to defaultMinItems, which then overwrites maxItems
    expect(arrayLength({ type: 'array', maxItems: 100 }, 1, 1)).to.equal(1);
    expect(arrayLength({ type: 'array', maxItems: 100 }, 2, 2)).to.equal(2);
  });

  it('should honour a declared maxItems when minItems is 0, capped at the faker maximum', function () {
    // minItems === 0 is not > 0, so the declared maxItems survives and is only clamped to 20.
    // This is the single biggest source of fan-out in real specs.
    expect(arrayLength({ type: 'array', minItems: 0, maxItems: 100 }, 1, 1)).to.equal(20);
    expect(arrayLength({ type: 'array', minItems: 0, maxItems: 7 }, 1, 1)).to.equal(7);
    expect(arrayLength({ type: 'array', minItems: 0, maxItems: 20 }, 1, 1)).to.equal(20);
  });

  it('should pin length to minItems when minItems > 0', function () {
    expect(arrayLength({ type: 'array', minItems: 1, maxItems: 100 }, 1, 1)).to.equal(1);
    expect(arrayLength({ type: 'array', minItems: 3, maxItems: 100 }, 1, 1)).to.equal(3);
    expect(arrayLength({ type: 'array', minItems: 5 }, 1, 1)).to.equal(5);
  });

  it('should clamp a minItems above the faker maximum down to the faker maximum', function () {
    expect(arrayLength({ type: 'array', minItems: 5000 }, 1, 1)).to.equal(20);
  });
});

describe('preflight: resolvePointer', function () {
  const spec = { components: { schemas: { 'A/B': { type: 'string' }, C: { type: 'integer' } } } };

  it('should resolve a local JSON pointer', function () {
    expect(resolvePointer(spec, '#/components/schemas/C')).to.eql({ type: 'integer' });
  });

  it('should unescape ~1 in a pointer segment', function () {
    expect(resolvePointer(spec, '#/components/schemas/A~1B')).to.eql({ type: 'string' });
  });

  it('should return undefined for a missing pointer', function () {
    expect(resolvePointer(spec, '#/components/schemas/Nope')).to.equal(undefined);
  });

  it('should return undefined for a remote ref', function () {
    expect(resolvePointer(spec, 'other.yaml#/Foo')).to.equal(undefined);
  });
});

describe('preflight: declared maxItems fan-out', function () {
  it('should multiply the item cost by the faker cap for minItems 0 / large maxItems', function () {
    const spec = makeSpec({
        Item: { type: 'object', properties: { a: { type: 'string' } } },
        Capped: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              minItems: 0,
              maxItems: 500,
              items: { $ref: '#/components/schemas/Item' }
            }
          }
        },
        Single: {
          type: 'object',
          properties: {
            list: {
              type: 'array',
              minItems: 1,
              maxItems: 500,
              items: { $ref: '#/components/schemas/Item' }
            }
          }
        }
      }),
      capped = predictSchemaCost(spec, '#/components/schemas/Capped'),
      single = predictSchemaCost(spec, '#/components/schemas/Single');

    // Capped: outer object + array + 20 * (item object + its string) = 1 + 1 + 40 = 42
    expect(capped.nodes).to.equal(42);
    // Single: outer object + array + 1 * (item object + its string) = 4
    expect(single.nodes).to.equal(4);
    expect(capped.compactBytes).to.be.above(single.compactBytes * 12);
  });

  it('should not let a declared maxItems exceed the faker maximum of 20', function () {
    const spec = makeSpec({
        Huge: {
          type: 'object',
          properties: {
            list: { type: 'array', minItems: 0, maxItems: 1e6, items: { type: 'integer' } }
          }
        }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Huge');

    // outer object + array + 20 integers
    expect(cost.nodes).to.equal(22);
  });
});

describe('preflight: recursive schemas', function () {
  it('should terminate on a directly self-referential schema and flag it circular', function () {
    const spec = makeSpec({
        Node: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            child: { $ref: '#/components/schemas/Node' }
          }
        }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Node');

    expect(cost.circular).to.equal(true);
    expect(cost.nodes).to.be.a('number');
    expect(cost.nodes).to.be.above(0);
    expect(cost.nodes).to.be.below(100);
    expect(cost.compactBytes).to.be.above(0);
    expect(Number.isFinite(cost.prettyBytes)).to.equal(true);
  });

  it('should terminate on mutual recursion', function () {
    const spec = makeSpec({
        Left: { type: 'object', properties: { right: { $ref: '#/components/schemas/Right' } } },
        Right: { type: 'object', properties: { left: { $ref: '#/components/schemas/Left' } } }
      }),
      left = predictSchemaCost(spec, '#/components/schemas/Left');

    expect(left.circular).to.equal(true);
    expect(left.nodes).to.be.below(100);
  });

  it('should terminate on recursion through an array', function () {
    const spec = makeSpec({
        Tree: {
          type: 'object',
          properties: {
            children: {
              type: 'array',
              minItems: 0,
              maxItems: 50,
              items: { $ref: '#/components/schemas/Tree' }
            }
          }
        }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Tree');

    expect(cost.circular).to.equal(true);
    expect(Number.isFinite(cost.nodes)).to.equal(true);
  });

  it('should terminate on a self-referential ref chain used as a whole spec', function () {
    const spec = makeSpec({
      Node: {
        type: 'object',
        properties: { child: { $ref: '#/components/schemas/Node' } }
      }
    });

    const report = predictConversionCost(spec);

    expect(report.operations).to.have.lengthOf(1);
    expect(report.operations[0].circular).to.equal(true);
    expect(report.operations[0].classification).to.equal(CLASSIFICATION.OK);
  });
});

describe('preflight: depth limit', function () {
  it('should truncate a ref chain deeper than the effective stack limit', function () {
    const schemas = {},
      depth = 60;

    for (let i = 0; i < depth; i++) {
      schemas['L' + i] = {
        type: 'object',
        properties: { next: { $ref: '#/components/schemas/L' + (i + 1) } }
      };
    }
    schemas['L' + depth] = { type: 'string' };

    const spec = makeSpec(schemas),
      cost = predictSchemaCost(spec, '#/components/schemas/L0');

    expect(cost.truncated).to.equal(true);
    // one `_resolveSchema` frame for the $ref plus one for its target, so the 30 frame limit
    // admits roughly 15 hops -- far fewer than 60
    expect(cost.nodes).to.be.below(depth);
  });

  it('should honour a user stackLimit above the built-in minimum', function () {
    const schemas = {},
      depth = 60;

    for (let i = 0; i < depth; i++) {
      schemas['L' + i] = {
        type: 'object',
        properties: { next: { $ref: '#/components/schemas/L' + (i + 1) } }
      };
    }
    schemas['L' + depth] = { type: 'string' };

    const spec = makeSpec(schemas),
      shallow = predictSchemaCost(spec, '#/components/schemas/L0'),
      // each hop costs two `_resolveSchema` frames (the $ref node, then its target), so a
      // 60 deep chain needs a budget north of 120
      deep = predictSchemaCost(spec, '#/components/schemas/L0', { stackLimit: 200 });

    expect(deep.nodes).to.be.above(shallow.nodes);
    expect(deep.truncated).to.equal(false);
  });

  it('should report the effective stack limit as max(stackLimit, 30)', function () {
    expect(new SchemaCostEvaluator({}, { stackLimit: 10 }).stackLimit).to.equal(30);
    expect(new SchemaCostEvaluator({}, { stackLimit: 45 }).stackLimit).to.equal(45);
    expect(new SchemaCostEvaluator({}, {}).stackLimit).to.equal(30);
  });
});

describe('preflight: restrictArrayItems threshold', function () {
  it('should report restrictArrayItems false for a schema under the 50 KB threshold', function () {
    const spec = makeSpec({
        Small: { type: 'object', properties: { a: { type: 'string' } } }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Small');

    expect(cost.restrictArrayItems).to.equal(false);
    expect(cost.schemaTextBytes).to.be.below(SCHEMA_SIZE_OPTIMIZATION_THRESHOLD);
  });

  it('should report restrictArrayItems true once the resolved schema exceeds 50 KB', function () {
    const properties = {};

    for (let i = 0; i < 400; i++) {
      properties['propertyWithAnAppreciablyLongName' + i] = {
        type: 'string',
        description: 'x'.repeat(120)
      };
    }

    const spec = makeSpec({ Big: { type: 'object', properties } }),
      cost = predictSchemaCost(spec, '#/components/schemas/Big');

    expect(cost.schemaTextBytes).to.be.above(SCHEMA_SIZE_OPTIMIZATION_THRESHOLD);
    expect(cost.restrictArrayItems).to.equal(true);
  });

  it('should generate one array item instead of two once restrictArrayItems kicks in', function () {
    const filler = {};

    for (let i = 0; i < 400; i++) {
      filler['propertyWithAnAppreciablyLongName' + i] = {
        type: 'string',
        description: 'x'.repeat(120)
      };
    }

    const spec = makeSpec({
        SmallList: {
          type: 'object',
          properties: { list: { type: 'array', items: { type: 'integer' } } }
        },
        BigList: {
          type: 'object',
          properties: _.assign({
            list: { type: 'array', items: { type: 'integer' } }
          }, filler)
        }
      }),
      small = predictSchemaCost(spec, '#/components/schemas/SmallList'),
      big = predictSchemaCost(spec, '#/components/schemas/BigList');

    expect(small.restrictArrayItems).to.equal(false);
    expect(big.restrictArrayItems).to.equal(true);
    // SmallList: object + array + 2 integers
    expect(small.nodes).to.equal(4);
    // BigList: object + array + 1 integer + 400 strings
    expect(big.nodes).to.equal(403);
  });
});

describe('preflight: byte model', function () {
  it('should compute exact compact bytes for a flat object', function () {
    // {"a":"<string>","b":"<integer>"}  with parametersResolution 'schema'
    const spec = makeSpec({
        Flat: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'integer' } } }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Flat');

    expect(cost.compactBytes).to.equal(JSON.stringify({ a: '<string>', b: '<integer>' }).length);
    expect(cost.prettyBytes).to.equal(
      JSON.stringify({ a: '<string>', b: '<integer>' }, null, '  ').length
    );
    expect(cost.nodes).to.equal(3);
  });

  it('should compute exact pretty bytes for a nested object', function () {
    const spec = makeSpec({
        Nested: {
          type: 'object',
          properties: {
            outer: { type: 'object', properties: { inner: { type: 'boolean' } } }
          }
        }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Nested'),
      sample = { outer: { inner: '<boolean>' } };

    expect(cost.compactBytes).to.equal(JSON.stringify(sample).length);
    expect(cost.prettyBytes).to.equal(JSON.stringify(sample, null, '  ').length);
  });

  it('should compute exact pretty bytes for an array of objects', function () {
    const spec = makeSpec({
        Listy: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              minItems: 0,
              maxItems: 3,
              items: { type: 'object', properties: { id: { type: 'integer' } } }
            }
          }
        }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Listy'),
      sample = { rows: [{ id: '<integer>' }, { id: '<integer>' }, { id: '<integer>' }] };

    expect(cost.compactBytes).to.equal(JSON.stringify(sample).length);
    expect(cost.prettyBytes).to.equal(JSON.stringify(sample, null, '  ').length);
  });

  it('should use the mean enum value length', function () {
    const spec = makeSpec({
        Enumy: { type: 'object', properties: { v: { type: 'string', enum: ['A', 'BBBB'] } } }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Enumy');

    // {"v":X}  ->  2 + ("v" + : = 4) + mean(3, 6) = 2 + 4 + 4.5 = 10.5 -> rounds to 11 / 10
    expect(cost.compactBytes).to.be.within(
      JSON.stringify({ v: 'A' }).length,
      JSON.stringify({ v: 'BBBB' }).length
    );
  });

  it('should differ between parametersResolution schema and example', function () {
    const spec = makeSpec({
        Dated: { type: 'object', properties: { at: { type: 'string', format: 'date-time' } } }
      }),
      asSchema = predictSchemaCost(spec, '#/components/schemas/Dated',
        { parametersResolution: 'schema' }),
      asExample = predictSchemaCost(spec, '#/components/schemas/Dated',
        { parametersResolution: 'example' });

    // '<dateTime>' is 10 chars, a faked ISO date-time is ~24
    expect(asExample.compactBytes).to.be.above(asSchema.compactBytes);
  });
});

describe('preflight: schema shapes', function () {
  it('should resolve anyOf / oneOf to the first branch, as CONVERSION does', function () {
    const spec = makeSpec({
        Composite: {
          oneOf: [
            { type: 'object', properties: { a: { type: 'string' } } },
            {
              type: 'object',
              properties: {
                b: { type: 'string' }, c: { type: 'string' }, d: { type: 'string' }
              }
            }
          ]
        }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Composite');

    // only branch 0 is materialised: object + one string
    expect(cost.nodes).to.equal(2);
  });

  it('should union properties across allOf branches', function () {
    const spec = makeSpec({
        Base: { type: 'object', properties: { a: { type: 'string' } } },
        Derived: {
          allOf: [
            { $ref: '#/components/schemas/Base' },
            { type: 'object', properties: { b: { type: 'string' } } }
          ]
        }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Derived');

    // object + two strings
    expect(cost.nodes).to.equal(3);
  });

  it('should include every optional property, since optionalsProbability is 1.0', function () {
    const properties = {};

    for (let i = 0; i < 10; i++) { properties['p' + i] = { type: 'string' }; }

    const spec = makeSpec({ Wide: { type: 'object', required: ['p0'], properties } }),
      cost = predictSchemaCost(spec, '#/components/schemas/Wide');

    expect(cost.nodes).to.equal(11);
  });

  it('should skip deprecated properties when includeDeprecated is false', function () {
    const spec = makeSpec({
        Deprecated: {
          type: 'object',
          properties: {
            kept: { type: 'string' },
            gone: { type: 'string', deprecated: true }
          }
        }
      }),
      withDeprecated = predictSchemaCost(spec, '#/components/schemas/Deprecated'),
      withoutDeprecated = predictSchemaCost(spec, '#/components/schemas/Deprecated',
        { includeDeprecated: false });

    expect(withDeprecated.nodes).to.equal(3);
    expect(withoutDeprecated.nodes).to.equal(2);
  });

  it('should treat an unresolvable ref as a cheap sentinel leaf rather than throwing', function () {
    const spec = makeSpec({
        Dangling: { type: 'object', properties: { x: { $ref: '#/components/schemas/Nope' } } }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Dangling');

    expect(cost.nodes).to.be.below(10);
    expect(cost.compactBytes).to.be.above(0);
  });

  it('should handle additionalProperties as a schema', function () {
    const spec = makeSpec({
        Map: { type: 'object', additionalProperties: { type: 'string' } }
      }),
      cost = predictSchemaCost(spec, '#/components/schemas/Map');

    expect(cost.nodes).to.be.above(1);
  });

  it('should return a zero cost for a non-object schema argument', function () {
    const evaluator = new SchemaCostEvaluator({}, {}),
      cost = evaluator.measureBody(null);

    expect(cost.nodes).to.equal(0);
    expect(cost.compactBytes).to.equal(0);
    expect(cost.projectedMs).to.equal(0);
  });
});

describe('preflight: predictConversionCost', function () {
  it('should throw a TypeError for a non-object spec', function () {
    expect(function () { predictConversionCost('not a spec'); }).to.throw(TypeError);
  });

  it('should report meta, summary and worst-first ranked operations', function () {
    const spec = makeSpec({
        Tiny: { type: 'object', properties: { a: { type: 'string' } } },
        Bigger: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              minItems: 0,
              maxItems: 20,
              items: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } }
            }
          }
        }
      }),
      report = predictConversionCost(spec);

    expect(report.meta.paths).to.equal(2);
    expect(report.meta.operations).to.equal(2);
    expect(report.meta.componentSchemas).to.equal(2);
    expect(report.meta.refStackLimit).to.equal(30);
    expect(report.meta.elapsedMs).to.be.a('number');
    expect(report.summary.total).to.equal(2);
    expect(report.summary.ok).to.equal(2);
    expect(report.summary.expensive).to.equal(0);
    expect(report.summary.willFail).to.equal(0);

    // ranked worst first
    expect(report.operations[0].projectedBytes)
      .to.be.at.least(report.operations[1].projectedBytes);
    expect(report.operations[0].operationId).to.equal('getBigger');
    expect(report.operations[0].method).to.equal('GET');
    expect(report.operations[0].largestBody.kind).to.equal('response');
    expect(report.operations[0].largestBody.code).to.equal('200');
    expect(report.operations[0].largestBody.mediaType).to.equal('application/json');
    expect(report.operations[0].largestBody.schemaRef).to.equal('#/components/schemas/Bigger');
  });

  it('should not mutate the spec it is given', function () {
    const spec = makeSpec({
        Node: {
          type: 'object',
          properties: {
            a: { type: 'string', format: 'decimal' },
            child: { $ref: '#/components/schemas/Node' },
            list: { type: 'array', minItems: 0, maxItems: 40, items: { type: 'integer' } }
          }
        }
      }),
      before = JSON.stringify(spec);

    predictConversionCost(spec);
    predictConversionCost(spec, { parametersResolution: 'example' });

    expect(JSON.stringify(spec)).to.equal(before);
  });

  it('should measure a request body as well as responses', function () {
    const spec = {
        openapi: '3.0.0',
        info: { title: 't', version: '1.0.0' },
        paths: {
          '/thing': {
            post: {
              operationId: 'createThing',
              requestBody: {
                content: {
                  'application/json': {
                    schema: { type: 'object', properties: { a: { type: 'string' } } }
                  }
                }
              },
              responses: { 204: { description: 'no content' } }
            }
          }
        }
      },
      report = predictConversionCost(spec);

    expect(report.operations).to.have.lengthOf(1);
    expect(report.operations[0].bodyCount).to.equal(1);
    expect(report.operations[0].largestBody.kind).to.equal('request');
    expect(report.operations[0].largestBody.schemaRef).to.equal('(inline)');
  });

  it('should count a repeated body ref within one operation only once', function () {
    const schema = { $ref: '#/components/schemas/Body' },
      spec = {
        openapi: '3.0.0',
        info: { title: 't', version: '1.0.0' },
        paths: {
          '/thing': {
            get: {
              operationId: 'getThing',
              responses: {
                200: { description: 'a', content: { 'application/json': { schema } } },
                201: { description: 'b', content: { 'application/json': { schema } } },
                202: { description: 'c', content: { 'application/json': { schema } } }
              }
            }
          }
        },
        components: { schemas: { Body: { type: 'object', properties: { a: { type: 'string' } } } } }
      },
      report = predictConversionCost(spec);

    expect(report.operations[0].bodyCount).to.equal(1);
  });

  it('should prefer application/json over other media types', function () {
    const spec = {
        openapi: '3.0.0',
        info: { title: 't', version: '1.0.0' },
        paths: {
          '/thing': {
            get: {
              operationId: 'getThing',
              responses: {
                200: {
                  description: 'ok',
                  content: {
                    'image/png': { schema: { type: 'string' } },
                    'application/json': {
                      type: 'object',
                      schema: { type: 'object', properties: { a: { type: 'string' } } }
                    }
                  }
                }
              }
            }
          }
        }
      },
      report = predictConversionCost(spec);

    expect(report.operations[0].largestBody.mediaType).to.equal('application/json');
  });

  it('should follow a $ref on the path item, requestBody and response objects', function () {
    const spec = {
        openapi: '3.0.0',
        info: { title: 't', version: '1.0.0' },
        paths: { '/thing': { $ref: '#/components/pathItems/Thing' } },
        components: {
          pathItems: {
            Thing: {
              get: {
                operationId: 'getThing',
                responses: { 200: { $ref: '#/components/responses/Ok' } }
              }
            }
          },
          responses: {
            Ok: {
              description: 'ok',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/Payload' } }
              }
            }
          },
          schemas: { Payload: { type: 'object', properties: { a: { type: 'string' } } } }
        }
      },
      report = predictConversionCost(spec);

    expect(report.operations).to.have.lengthOf(1);
    expect(report.operations[0].largestBody.schemaRef).to.equal('#/components/schemas/Payload');
  });

  it('should include webhooks only when asked', function () {
    const spec = _.merge(makeSpec({ A: { type: 'object', properties: { a: { type: 'string' } } } }), {
      webhooks: {
        ping: {
          post: {
            operationId: 'ping',
            requestBody: {
              content: { 'application/json': { schema: { type: 'object', properties: { a: { type: 'string' } } } } }
            },
            responses: { 200: { description: 'ok' } }
          }
        }
      }
    });

    expect(predictConversionCost(spec).summary.total).to.equal(1);

    const withWebhooks = predictConversionCost(spec, { includeWebhooks: true });

    expect(withWebhooks.summary.total).to.equal(2);
    expect(_.map(withWebhooks.operations, 'source')).to.include('webhooks');
  });

  it('should handle a spec with no paths', function () {
    const report = predictConversionCost({ openapi: '3.0.0', info: { title: 't', version: '1' } });

    expect(report.summary.total).to.equal(0);
    expect(report.operations).to.eql([]);
    expect(report.meta.paths).to.equal(0);
  });
});

describe('preflight: classification', function () {
  /**
   * Builds a pathological schema: `depth` nested levels, each an array of 20 items.
   *
   * @param {Number} depth - nesting levels
   * @returns {Object} an OpenAPI document
   */
  const makeFanoutSpec = (depth) => {
    const schemas = {};

    schemas['L' + depth] = {
      type: 'object',
      properties: { leafValueWithALongPropertyName: { type: 'string' } }
    };

    for (let i = depth - 1; i >= 0; i--) {
      schemas['L' + i] = {
        type: 'object',
        // padding so the resolved schema clears the 50 KB restrictArrayItems threshold is not
        // needed here: what matters is the fan-out
        properties: {
          childCollectionWithALongPropertyName: {
            type: 'array',
            minItems: 0,
            maxItems: 1000,
            items: { $ref: '#/components/schemas/L' + (i + 1) }
          }
        }
      };
    }

    return makeSpec(schemas);
  };

  it('should classify a small operation as ok', function () {
    const spec = makeSpec({ A: { type: 'object', properties: { a: { type: 'string' } } } }),
      report = predictConversionCost(spec);

    expect(report.operations[0].classification).to.equal(CLASSIFICATION.OK);
  });

  it('should classify an operation over the byte threshold as expensive', function () {
    const report = predictConversionCost(makeFanoutSpec(5)),
      worst = report.operations[0];

    expect(worst.projectedBytes).to.be.above(10 * 1024 * 1024);
    expect(worst.projectedBytes).to.be.below(MAX_STRING_LENGTH);
    expect(worst.classification).to.equal(CLASSIFICATION.EXPENSIVE);
  });

  it('should classify an operation past V8 max string length as will-fail', function () {
    const report = predictConversionCost(makeFanoutSpec(8)),
      worst = report.operations[0];

    expect(worst.projectedBytes).to.be.above(MAX_STRING_LENGTH);
    expect(worst.classification).to.equal(CLASSIFICATION.WILL_FAIL);
    expect(report.summary.willFail).to.be.at.least(1);
  });

  it('should honour overridden thresholds', function () {
    const spec = makeSpec({ A: { type: 'object', properties: { a: { type: 'string' } } } }),
      strict = predictConversionCost(spec, { thresholds: { expensiveBytes: 1 } }),
      lethal = predictConversionCost(spec, { thresholds: { failBytes: 1 } });

    expect(strict.operations[0].classification).to.equal(CLASSIFICATION.EXPENSIVE);
    expect(lethal.operations[0].classification).to.equal(CLASSIFICATION.WILL_FAIL);
    expect(strict.meta.thresholds.expensiveBytes).to.equal(1);
  });

  it('should rank operations monotonically by projected bytes', function () {
    const report = predictConversionCost(makeFanoutSpec(6));

    for (let i = 1; i < report.operations.length; i++) {
      expect(report.operations[i - 1].projectedBytes)
        .to.be.at.least(report.operations[i].projectedBytes);
    }
  });
});

describe('preflight: memoisation', function () {
  it('should expand each $ref at most a handful of times regardless of reuse', function () {
    const schemas = { Leaf: { type: 'object', properties: { a: { type: 'string' } } } },
      properties = {};

    for (let i = 0; i < 200; i++) {
      properties['p' + i] = { $ref: '#/components/schemas/Leaf' };
    }
    schemas.Wide = { type: 'object', properties };

    const spec = makeSpec(schemas),
      evaluator = new SchemaCostEvaluator(spec, {});

    evaluator.measureBody({ $ref: '#/components/schemas/Wide' });

    // Leaf must not be walked 200 times
    expect(evaluator.stats.refExpansions).to.be.below(10);
    expect(evaluator.stats.valueCacheHits).to.be.at.least(190);
  });

  it('should share memo tables across operations within one report', function () {
    const schemas = { Leaf: { type: 'object', properties: { a: { type: 'string' } } } };

    for (let i = 0; i < 50; i++) {
      schemas['Holder' + i] = {
        type: 'object',
        properties: { leaf: { $ref: '#/components/schemas/Leaf' } }
      };
    }

    const report = predictConversionCost(makeSpec(schemas));

    expect(report.meta.operations).to.equal(51);
    expect(report.meta.evaluatorStats.refExpansions).to.be.below(120);
  });
});

describe('preflight: agreement with the real generation path', function () {
  /*
   * These tests are the predictor's self-check: they resolve and fake a schema with the real
   * libV2 machinery (read-only -- on a deep clone, so nothing shared is mutated) and compare
   * the measured value against the projection. If the conversion path's faking rules ever
   * change, these fail and the model needs updating.
   */
  const schemaUtils = require('./../../libV2/CollectionGeneration/schemaUtils.js'),
    schemaFaker = require('./../../assets/json-schema-faker.js'),
    { getConcreteSchemaUtils } = require('./../../lib/common/versionUtils.js'),
    { getOptions } = require('./../../lib/options.js'),
    utils = require('./../../lib/utils.js'),

    /**
     * Resolves and fakes `ref` the way `fakeSchema` would, and returns the value's node count
     * and serialised sizes.
     *
     * @param {Object} inputSpec - an OpenAPI document (cloned before use)
     * @param {String} ref - a `$ref` to fake
     * @returns {Object} `{ restrict, nodes, compactBytes, prettyBytes }`
     */
    fakeForReal = (inputSpec, ref) => {
      const spec = _.cloneDeep(inputSpec),
        concreteUtils = getConcreteSchemaUtils({ type: 'json', data: spec }),
        computedOptions = utils.mergeOptions(
          _.keyBy(getOptions({ moduleVersion: 'v2' }), 'id'),
          { parametersResolution: 'Example' }
        );

      computedOptions.indentCharacter = '  ';

      const context = {
          openapi: spec,
          computedOptions,
          concreteUtils,
          specComponents: concreteUtils.getRequiredData(spec),
          schemaCache: {},
          schemaFakerCache: {},
          schemaValidationCache: new Map(),
          enableTypeFetching: false,
          readOnlyPropCache: {},
          writeOnlyPropCache: {}
        },
        resolved = schemaUtils.resolveSchema(context, { $ref: ref }, {}),
        restrict = JSON.stringify(resolved).length > SCHEMA_SIZE_OPTIMIZATION_THRESHOLD;

      schemaFaker.option({
        useExamplesValue: true,
        defaultMinItems: restrict ? 1 : 2,
        defaultMaxItems: restrict ? 1 : 2
      });

      const value = schemaFaker(_.cloneDeep(resolved), null, new Map());

      let nodes = 0;

      (function walk (node) {
        nodes++;

        if (!node || typeof node !== 'object') { return; }
        if (Array.isArray(node)) { node.forEach(walk); return; }
        Object.keys(node).forEach((key) => { walk(node[key]); });
      }(value));

      return {
        restrict,
        nodes,
        compactBytes: JSON.stringify(value).length,
        prettyBytes: JSON.stringify(value, null, '  ').length
      };
    };

  it('should match the real value node count exactly for a fanned-out nested schema', function () {
    const spec = makeSpec({
        Leaf: {
          type: 'object',
          properties: {
            identifier: { type: 'string', minLength: 1, maxLength: 64 },
            count: { type: 'integer' }
          }
        },
        Mid: {
          type: 'object',
          properties: {
            leaves: {
              type: 'array',
              minItems: 0,
              maxItems: 200,
              items: { $ref: '#/components/schemas/Leaf' }
            },
            label: { type: 'string', enum: ['ALPHA', 'BETA'] }
          }
        },
        Root: {
          type: 'object',
          properties: {
            mids: {
              type: 'array',
              minItems: 0,
              maxItems: 3,
              items: { $ref: '#/components/schemas/Mid' }
            },
            single: { $ref: '#/components/schemas/Mid' }
          }
        }
      }),
      predicted = predictSchemaCost(spec, '#/components/schemas/Root',
        { parametersResolution: 'example' }),
      actual = fakeForReal(spec, '#/components/schemas/Root');

    expect(predicted.restrictArrayItems).to.equal(actual.restrict);
    expect(predicted.nodes).to.equal(actual.nodes);
    expect(predicted.compactBytes / actual.compactBytes).to.be.within(0.7, 1.4);
    expect(predicted.prettyBytes / actual.prettyBytes).to.be.within(0.7, 1.4);
  });

  it('should match the real value node count exactly once restrictArrayItems applies', function () {
    const properties = {
      rows: {
        type: 'array',
        minItems: 0,
        maxItems: 40,
        items: { type: 'object', properties: { value: { type: 'integer' } } }
      }
    };

    for (let i = 0; i < 400; i++) {
      properties['paddingPropertyWithAnAppreciablyLongName' + i] = {
        type: 'string',
        description: 'x'.repeat(120)
      };
    }

    const spec = makeSpec({ Padded: { type: 'object', properties } }),
      predicted = predictSchemaCost(spec, '#/components/schemas/Padded',
        { parametersResolution: 'example' }),
      actual = fakeForReal(spec, '#/components/schemas/Padded');

    expect(predicted.restrictArrayItems).to.equal(true);
    expect(actual.restrict).to.equal(true);
    expect(predicted.nodes).to.equal(actual.nodes);
    expect(predicted.compactBytes / actual.compactBytes).to.be.within(0.7, 1.4);
  });

  it('should match the real value node count exactly for a recursive schema', function () {
    const spec = makeSpec({
        Node: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            child: { $ref: '#/components/schemas/Node' }
          }
        }
      }),
      predicted = predictSchemaCost(spec, '#/components/schemas/Node',
        { parametersResolution: 'example' }),
      actual = fakeForReal(spec, '#/components/schemas/Node');

    expect(predicted.nodes).to.equal(actual.nodes);
  });
});
