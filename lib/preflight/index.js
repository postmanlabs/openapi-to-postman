/**
 * @fileOverview Static pre-flight cost predictor.
 *
 * Identifies, before any generation work, which operations in an OpenAPI document will be
 * pathologically expensive to convert or will fail outright.
 *
 * Purely additive and read-only: nothing here is used by the conversion path, and nothing
 * here mutates the document it is given.
 *
 * @example
 * const { predictConversionCost } = require('openapi-to-postmanv2/lib/preflight');
 * const report = predictConversionCost(specObject);
 *
 * report.summary;             // { ok, expensive, willFail, ... }
 * report.operations[0];       // ranked worst-first
 *
 * @module lib/preflight
 */

const _ = require('lodash'),
  { SchemaCostEvaluator } = require('./schemaCostEvaluator.js'),
  model = require('./costModel.js'),

  CLASSIFICATION = {
    OK: 'ok',
    EXPENSIVE: 'expensive',
    WILL_FAIL: 'will-exceed-512MiB-string-limit'
  },

  METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'],

  /*
   * failBytes:      a single body whose serialised form would exceed V8's max string length
   * expensiveBytes: an operation projected to emit more than this is flagged expensive
   * expensiveMs:    an operation projected to take longer than this (ms) is flagged expensive
   */
  DEFAULT_THRESHOLDS = {
    failBytes: model.MAX_STRING_LENGTH,
    expensiveBytes: 10 * 1024 * 1024,
    expensiveMs: 1000
  },

  /** Mirrors `getRawBodyType` in libV2/CollectionGeneration/schemaUtils.js */
  RAW_BODY_PREFERENCE = [
    'application/javascript',
    'application/json',
    'text/html',
    'text/plain',
    'application/xml',
    'text/xml'
  ],

  /**
   * Picks the single media type the converter will actually fake for a `content` object.
   *
   * @param {Object} content - an OpenAPI `content` map
   * @returns {String|undefined} the chosen media type
   */
  pickRawBodyType = (content) => {
    if (!_.isPlainObject(content)) { return undefined; }

    for (let i = 0; i < RAW_BODY_PREFERENCE.length; i++) {
      if (Object.prototype.hasOwnProperty.call(content, RAW_BODY_PREFERENCE[i])) {
        return RAW_BODY_PREFERENCE[i];
      }
    }

    const jsonish = _.findKey(content, (value, key) => { return (/json/).test(_.toLower(key)); });

    if (jsonish) { return jsonish; }

    return Object.keys(content)[0];
  },

  /**
   * Follows `$ref`s on a requestBody / response object so its `content` becomes visible.
   *
   * @param {Object} spec - spec root
   * @param {Object} node - requestBody or response object
   * @param {Function} resolvePointer - pointer resolver
   * @returns {Object} the dereferenced node (or the input when not a ref)
   */
  derefContainer = (spec, node, resolvePointer) => {
    let current = node,
      hops = 0;

    while (_.isPlainObject(current) && typeof current.$ref === 'string' && hops < 32) {
      const target = resolvePointer(spec, current.$ref);

      if (target === undefined) { return {}; }
      current = target;
      hops++;
    }

    return _.isPlainObject(current) ? current : {};
  };

/**
 * Measures one operation: its request body plus every response body.
 *
 * @param {Object} args - see call site
 * @returns {Object} operation prediction record
 */
function measureOperation (args) {
  /*
   * The converter memoises faked schemas by hash (`context.schemaFakerCache`), so a body
   * schema repeated within the same operation is only paid for once -- hence `seenSchemaKeys`.
   */
  const { evaluator, spec, resolvePointer, thresholds, source, pathName, method, operation } = args,
    bodies = [],
    seenSchemaKeys = new Set(),

    addBody = (kind, code, schemaContainer) => {
      const mediaType = pickRawBodyType(schemaContainer.content);

      if (!mediaType) { return; }

      const media = schemaContainer.content[mediaType];

      if (!_.isPlainObject(media) || !_.isPlainObject(media.schema)) { return; }

      const schema = media.schema,
        dedupeKey = typeof schema.$ref === 'string' ? schema.$ref : null;

      if (dedupeKey && seenSchemaKeys.has(dedupeKey)) { return; }
      if (dedupeKey) { seenSchemaKeys.add(dedupeKey); }

      const measured = evaluator.measureBody(schema);

      bodies.push(_.assign({
        kind,
        code,
        mediaType,
        schemaRef: dedupeKey || '(inline)'
      }, measured));
    };

  if (_.isPlainObject(operation.requestBody)) {
    addBody('request', null, derefContainer(spec, operation.requestBody, resolvePointer));
  }

  if (_.isPlainObject(operation.responses)) {
    _.forOwn(operation.responses, (responseRaw, code) => {
      addBody('response', code, derefContainer(spec, responseRaw, resolvePointer));
    });
  }

  let projectedBytes = 0,
    projectedNodes = 0,
    projectedStructuralNodes = 0,
    projectedMs = 0,
    largestBody = null,
    truncated = false,
    circular = false;

  bodies.forEach((body) => {
    projectedBytes += body.prettyBytes;
    projectedNodes += body.nodes;
    projectedStructuralNodes += body.structuralNodes;
    projectedMs += body.projectedMs;
    truncated = truncated || body.truncated;
    circular = circular || body.circular;

    if (!largestBody || body.prettyBytes > largestBody.prettyBytes) { largestBody = body; }
  });

  let classification = CLASSIFICATION.OK;

  if (largestBody && largestBody.prettyBytes > thresholds.failBytes) {
    classification = CLASSIFICATION.WILL_FAIL;
  }
  else if (projectedBytes > thresholds.expensiveBytes || projectedMs > thresholds.expensiveMs) {
    classification = CLASSIFICATION.EXPENSIVE;
  }

  return {
    source,
    method: _.toUpper(method),
    path: pathName,
    operationId: operation.operationId,
    classification,
    projectedBytes,
    projectedNodes,
    projectedStructuralNodes,
    projectedMs: Math.round(projectedMs),
    bodyCount: bodies.length,
    truncated,
    circular,
    largestBody: largestBody ? {
      kind: largestBody.kind,
      code: largestBody.code,
      mediaType: largestBody.mediaType,
      schemaRef: largestBody.schemaRef,
      bytes: largestBody.prettyBytes,
      nodes: largestBody.nodes,
      restrictArrayItems: largestBody.restrictArrayItems,
      schemaTextBytes: largestBody.schemaTextBytes
    } : null,
    bodies
  };
}

/**
 * Projects the conversion cost of every operation in an OpenAPI document.
 *
 * @param {Object} spec - a parsed OpenAPI document (JS object, already parsed from JSON/YAML)
 * @param {Object} [options] - options
 * @param {String} [options.parametersResolution='schema'] - 'schema' or 'example'
 * @param {Boolean} [options.includeDeprecated=true] - include deprecated properties
 * @param {Boolean} [options.includeWebhooks=false] - also predict `webhooks` entries
 * @param {Number} [options.stackLimit] - effective ref stack limit is `max(stackLimit, 30)`
 * @param {Object} [options.thresholds] - override `failBytes` / `expensiveBytes` / `expensiveMs`
 * @returns {Object} the prediction report
 */
function predictConversionCost (spec, options = {}) {
  const startedAt = Date.now();

  if (!_.isPlainObject(spec)) {
    throw new TypeError('predictConversionCost expects a parsed OpenAPI document object');
  }

  const thresholds = _.assign({}, DEFAULT_THRESHOLDS, options.thresholds),
    evaluator = new SchemaCostEvaluator(spec, options),
    { resolvePointer } = require('./schemaCostEvaluator.js'),
    operations = [],
    containers = [{ source: 'paths', map: spec.paths }];

  if (options.includeWebhooks && _.isPlainObject(spec.webhooks)) {
    containers.push({ source: 'webhooks', map: spec.webhooks });
  }

  containers.forEach(({ source, map }) => {
    if (!_.isPlainObject(map)) { return; }

    _.forOwn(map, (pathItemRaw, pathName) => {
      const pathItem = derefContainer(spec, pathItemRaw, resolvePointer);

      METHODS.forEach((method) => {
        const operation = pathItem[method];

        if (!_.isPlainObject(operation)) { return; }

        operations.push(measureOperation({
          evaluator, spec, resolvePointer, thresholds, source, pathName, method, operation
        }));
      });
    });
  });

  operations.sort((a, b) => {
    return b.projectedBytes - a.projectedBytes || b.projectedNodes - a.projectedNodes;
  });

  const summary = {
    total: operations.length,
    ok: 0,
    expensive: 0,
    willFail: 0,
    projectedTotalBytes: 0,
    projectedTotalMs: 0
  };

  operations.forEach((op) => {
    if (op.classification === CLASSIFICATION.WILL_FAIL) { summary.willFail++; }
    else if (op.classification === CLASSIFICATION.EXPENSIVE) { summary.expensive++; }
    else { summary.ok++; }

    summary.projectedTotalBytes += op.projectedBytes;
    summary.projectedTotalMs += op.projectedMs;
  });

  return {
    meta: {
      paths: _.isPlainObject(spec.paths) ? Object.keys(spec.paths).length : 0,
      operations: operations.length,
      componentSchemas: Object.keys(_.get(spec, 'components.schemas') || {}).length,
      elapsedMs: Date.now() - startedAt,
      refStackLimit: evaluator.stackLimit,
      parametersResolution: evaluator.useTypePlaceholders ? 'schema' : 'example',
      thresholds,
      evaluatorStats: evaluator.stats
    },
    summary,
    operations
  };
}

/**
 * Convenience wrapper that measures a single named component schema, which is what the
 * `jsfscale.js` style harnesses exercise.
 *
 * @param {Object} spec - parsed OpenAPI document
 * @param {String} ref - a `$ref` string, e.g. `#/components/schemas/Visual`
 * @param {Object} [options] - same options as `predictConversionCost`
 * @returns {Object} the measurement for that schema
 */
function predictSchemaCost (spec, ref, options = {}) {
  const evaluator = new SchemaCostEvaluator(spec, options);

  return evaluator.measureBody({ $ref: ref });
}

module.exports = {
  predictConversionCost,
  predictSchemaCost,
  SchemaCostEvaluator,
  CLASSIFICATION,
  DEFAULT_THRESHOLDS
};
