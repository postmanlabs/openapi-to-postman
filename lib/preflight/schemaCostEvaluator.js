/**
 * @fileOverview Memoised walker over a spec's raw `$ref` graph that projects the cost of
 * resolving + faking any schema, without resolving or faking anything.
 *
 * See lib/preflight/costModel.js for the runtime rules being mirrored.
 *
 * @module lib/preflight/schemaCostEvaluator
 */

const _ = require('lodash'),
  model = require('./costModel.js'),

  INDENT_WIDTH = 2,

  /**
   * Resolves a JSON pointer style local `$ref` against the spec root.
   *
   * @param {Object} root - spec root
   * @param {String} ref - e.g. `#/components/schemas/Foo`
   * @returns {Object|undefined} the referenced node, or undefined when unresolvable
   */
  resolvePointer = (root, ref) => {
    if (typeof ref !== 'string' || ref.charAt(0) !== '#') {
      // remote / file refs are not resolvable statically; treated as unresolved leaves
      return undefined;
    }

    const segments = ref.slice(1).split('/').filter((segment) => { return segment !== ''; });

    let node = root;

    for (let i = 0; i < segments.length; i++) {
      const key = decodeURIComponent(segments[i].replace(/~1/g, '/').replace(/~0/g, '~'));

      if (!node || typeof node !== 'object' || !Object.prototype.hasOwnProperty.call(node, key)) {
        return undefined;
      }

      node = node[key];
    }

    return node;
  },

  /**
   * Byte cost of the faked scalar for a leaf schema.
   *
   * @param {Object} schema - leaf schema
   * @param {Boolean} useTypePlaceholders - true when `parametersResolution === 'schema'`
   * @param {Boolean} isProperty - true when the schema sits under a parent's `properties`
   * @returns {Number} bytes, including JSON quoting
   */
  leafBytes = (schema, useTypePlaceholders, isProperty) => {
    if (Object.prototype.hasOwnProperty.call(schema, 'default') && !_.isPlainObject(schema.default)) {
      // json-schema-faker's `useDefaultValue` returns it verbatim
      return JSON.stringify(schema.default === undefined ? null : schema.default).length;
    }

    if (Array.isArray(schema.enum) && schema.enum.length) {
      // json-schema-faker picks one at random; use the mean
      let total = 0;

      schema.enum.forEach((entry) => {
        total += JSON.stringify(entry === undefined ? null : entry).length;
      });

      return total / schema.enum.length;
    }

    let format = schema.format;

    // `_resolveSchema` deletes these outright on a property, and any unsupported format anywhere
    if (isProperty && _.includes(model.DROPPED_PROPERTY_FORMATS, format)) {
      format = undefined;
    }

    if (!_.includes(model.SUPPORTED_FORMATS, format) || (schema.pattern && format)) {
      format = undefined;
    }

    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

    if (!type) {
      return model.NULL_BYTES;
    }

    // `parametersResolution === 'schema'` stamps `default: '<type>'` unless default/enum/pattern
    // is already present. enum/default were handled above, so only `pattern` can block it.
    if (useTypePlaceholders && !schema.pattern) {
      let placeholder;

      if (!format) {
        placeholder = '<' + type + '>';
      }
      else if (Object.prototype.hasOwnProperty.call(model.TYPES_MAP, type)) {
        placeholder = _.get(model.TYPES_MAP, [type, format]);

        if (!placeholder) {
          placeholder = '<' + (type === 'string' ? format : type) + '>';
        }
      }
      else {
        placeholder = '<' + type + '-' + format + '>';
      }

      return placeholder.length + 2;
    }

    if (type === 'string') {
      if (format) {
        return model.FORMAT_BYTES[format] || 10;
      }

      if (schema.pattern) {
        return model.PATTERN_BYTES;
      }

      return Math.max(model.FAKED_WORD_LENGTH, schema.minLength || 0) + 2;
    }

    if (type === 'integer') { return model.INTEGER_BYTES; }
    if (type === 'number') { return model.NUMBER_BYTES; }
    if (type === 'boolean') { return model.BOOLEAN_BYTES; }

    return model.NULL_BYTES;
  },

  /**
   * Combines child value-cost records into an object record.
   *
   * @param {Array} children - `[{ keyLength, cost }]`
   * @returns {Object} cost record
   */
  objectCost = (children) => {
    const count = children.length;

    if (!count) {
      return model.LEAF(2);
    }

    let compactBytes = 2 + (count - 1),
      // each child contributes a newline, one indent unit, and the space after ':'
      prettyExtra = count * (1 + INDENT_WIDTH + 1) + 1,
      indentSlots = count + 1,
      nodes = 1,
      structuralNodes = 1;

    children.forEach(({ keyLength, cost }) => {
      compactBytes += keyLength + 3 + cost.compactBytes;
      prettyExtra += cost.prettyExtra + INDENT_WIDTH * cost.indentSlots;
      indentSlots += cost.indentSlots;
      nodes += cost.nodes;
      structuralNodes += cost.structuralNodes;
    });

    return { nodes, structuralNodes, compactBytes, prettyExtra, indentSlots };
  },

  /**
   * Combines an item record into an array record of `length` copies.
   *
   * @param {Object} itemCost - cost record for one item
   * @param {Number} length - number of generated items
   * @returns {Object} cost record
   */
  arrayCost = (itemCost, length) => {
    if (length <= 0) {
      return model.LEAF(2);
    }

    return {
      nodes: 1 + length * itemCost.nodes,
      // structural nodes deliberately ignore fan-out: repeats of an identical item schema
      // are much cheaper per node than distinct subschemas
      structuralNodes: 1 + itemCost.structuralNodes,
      compactBytes: 2 + (length - 1) + length * itemCost.compactBytes,
      prettyExtra: length * (1 + INDENT_WIDTH) + length * (itemCost.prettyExtra +
        INDENT_WIDTH * itemCost.indentSlots) + 1,
      indentSlots: length + 1 + length * itemCost.indentSlots
    };
  },

  /**
   * Total pretty-printed bytes of a cost record placed at `depth`.
   *
   * @param {Object} cost - cost record
   * @param {Number} depth - nesting depth of the record's root (0 for a body root)
   * @returns {Number} bytes
   */
  prettyBytes = (cost, depth) => {
    return cost.compactBytes + cost.prettyExtra + INDENT_WIDTH * depth * cost.indentSlots;
  };

/**
 * Builds an evaluator bound to one spec. All memo tables live on the instance, so a single
 * evaluator amortises shared `$ref`s across every operation in the spec (exactly as the
 * converter's `context.schemaCache` does).
 */
class SchemaCostEvaluator {
  /**
   * @param {Object} spec - a parsed OpenAPI document (already a JS object)
   * @param {Object} [options] - conversion options that affect cost
   * @param {String} [options.parametersResolution='schema'] - 'schema' or 'example'
   * @param {Boolean} [options.includeDeprecated=true] - include deprecated properties
   * @param {Number} [options.stackLimit] - user stack limit; effective limit is max(this, 30)
   */
  constructor (spec, options = {}) {
    this.spec = spec;
    this.useTypePlaceholders = _.toLower(options.parametersResolution || 'schema') === 'schema';
    this.includeDeprecated = options.includeDeprecated !== false;
    this.stackLimit = Math.max(
      typeof options.stackLimit === 'number' ? options.stackLimit : 0,
      model.REF_STACK_LIMIT
    );

    // memo: ref -> resolved-schema text bytes
    this.textCache = new Map();
    // memo: `${ref}|${restrict}|${depthKey}` -> { cost, depthUsed }
    this.valueCache = new Map();
    // counters, useful for asserting the walk stays cheap
    this.stats = { refExpansions: 0, textExpansions: 0, valueCacheHits: 0, textCacheHits: 0 };
  }

  /**
   * Projected byte length of `JSON.stringify(resolvedSchema)` -- the exact quantity
   * `fakeSchema` measures against SCHEMA_SIZE_OPTIMIZATION_THRESHOLD.
   *
   * @param {Object} schema - raw schema node
   * @returns {Number} bytes
   */
  schemaTextBytes (schema) {
    return this._textBytes(schema, 0, Object.create(null));
  }

  /**
   * Full cost projection for one request/response body schema.
   *
   * @param {Object} schema - raw schema node as authored in the spec
   * @returns {Object} `{ nodes, compactBytes, prettyBytes, schemaTextBytes, restrictArrayItems,
   *                      projectedMs, truncated, circular }`
   */
  measureBody (schema) {
    if (!_.isPlainObject(schema)) {
      return {
        nodes: 0,
        structuralNodes: 0,
        compactBytes: 0,
        prettyBytes: 0,
        schemaTextBytes: 0,
        restrictArrayItems: false,
        projectedMs: 0,
        truncated: false,
        circular: false
      };
    }

    const schemaTextBytes = this.schemaTextBytes(schema),
      restrictArrayItems = schemaTextBytes > model.SCHEMA_SIZE_OPTIMIZATION_THRESHOLD;

    this._flags = { truncated: false, circular: false };

    const result = this._valueCost(schema, 0, Object.create(null), restrictArrayItems, false),
      bytes = prettyBytes(result.cost, 0),
      structuralNodes = Math.min(result.cost.structuralNodes, result.cost.nodes),
      projectedMs = result.cost.nodes * model.MS_PER_VALUE_NODE +
        structuralNodes * model.MS_PER_STRUCTURAL_NODE +
        bytes * model.MS_PER_OUTPUT_BYTE;

    return {
      nodes: result.cost.nodes,
      structuralNodes,
      compactBytes: Math.round(result.cost.compactBytes),
      prettyBytes: Math.round(bytes),
      schemaTextBytes,
      restrictArrayItems,
      projectedMs,
      truncated: this._flags.truncated,
      circular: this._flags.circular
    };
  }

  /* ------------------------------------------------------------------ *
   *  resolved-schema text size                                          *
   * ------------------------------------------------------------------ */

  /**
   * @private
   * @param {*} node - any JSON node inside a schema
   * @param {Number} stack - current `_resolveSchema` frame count
   * @param {Object} seenRef - refs on the current resolution path
   * @returns {Number} bytes of the node once `$ref`s are expanded
   */
  _textBytes (node, stack, seenRef) {
    if (stack >= this.stackLimit) {
      return 13 + model.ERR_TOO_MANY_LEVELS.length;
    }

    if (node === null || typeof node !== 'object') {
      return JSON.stringify(node === undefined ? null : node).length;
    }

    if (Array.isArray(node)) {
      let bytes = 2 + Math.max(0, node.length - 1);

      node.forEach((entry) => { bytes += this._textBytes(entry, stack + 1, seenRef); });

      return bytes;
    }

    if (typeof node.$ref === 'string') {
      const ref = node.$ref;

      if (seenRef[ref]) {
        return 13 + ('<Circular reference to ' + ref + ' detected>').length;
      }

      const cached = this.textCache.get(ref);

      if (cached !== undefined) {
        this.stats.textCacheHits++;

        return cached;
      }

      const target = resolvePointer(this.spec, ref);

      if (target === undefined) {
        return 13 + ('reference ' + ref + ' not found in the OpenAPI spec').length;
      }

      this.stats.textExpansions++;

      const nextSeen = Object.create(seenRef);

      nextSeen[ref] = true;

      const bytes = this._textBytes(target, stack + 1, nextSeen);

      this.textCache.set(ref, bytes);

      return bytes;
    }

    const composite = node.anyOf || node.oneOf;

    if (Array.isArray(composite) && composite.length) {
      // CONVERSION resolves to element 0 only
      return this._textBytes(composite[0], stack + 1, seenRef);
    }

    const keys = Object.keys(node);

    let bytes = 2 + Math.max(0, keys.length - 1);

    keys.forEach((key) => {
      bytes += key.length + 3 + this._textBytes(node[key], stack + 1, seenRef);
    });

    return bytes;
  }

  /* ------------------------------------------------------------------ *
   *  faked-value cost                                                   *
   * ------------------------------------------------------------------ */

  /**
   * @private
   * @param {Object} schema - raw schema node
   * @param {Number} stack - current `_resolveSchema` frame count
   * @param {Object} seenRef - refs on the current resolution path
   * @param {Boolean} restrict - restrictArrayItems for the enclosing body
   * @param {Boolean} isProperty - whether this node sits under a parent's `properties`
   * @returns {Object} `{ cost, depthUsed }` where depthUsed is frames consumed below `stack`
   */
  _valueCost (schema, stack, seenRef, restrict, isProperty) {
    if (stack >= this.stackLimit) {
      this._flags.truncated = true;

      return { cost: model.SENTINEL(model.ERR_TOO_MANY_LEVELS), depthUsed: 0 };
    }

    if (!_.isPlainObject(schema)) {
      return { cost: model.LEAF(model.NULL_BYTES), depthUsed: 1 };
    }

    const frame = stack + 1,
      remaining = this.stackLimit - frame;

    /* --- anyOf / oneOf : CONVERSION takes element 0 --- */
    const composite = schema.anyOf || schema.oneOf;

    if (Array.isArray(composite) && composite.length) {
      const inner = this._valueCost(composite[0], frame, seenRef, restrict, isProperty);

      return { cost: inner.cost, depthUsed: inner.depthUsed + 1 };
    }

    /* --- allOf : merged into a single object --- */
    if (Array.isArray(schema.allOf) && schema.allOf.length) {
      const merged = this._mergeAllOf(schema, frame, seenRef),
        inner = this._valueCost(merged, frame, seenRef, restrict, isProperty);

      return { cost: inner.cost, depthUsed: inner.depthUsed + 1 };
    }

    /* --- $ref --- */
    if (typeof schema.$ref === 'string') {
      return this._refCost(schema.$ref, frame, seenRef, restrict, isProperty, remaining);
    }

    /* --- inline node --- */
    return this._inlineCost(schema, frame, seenRef, restrict, isProperty);
  }

  /**
   * @private
   * @param {String} ref - the `$ref` string
   * @param {Number} frame - frame count after entering the `$ref` node
   * @param {Object} seenRef - refs on the current resolution path
   * @param {Boolean} restrict - restrictArrayItems for the enclosing body
   * @param {Boolean} isProperty - whether this node sits under a parent's `properties`
   * @param {Number} remaining - frames left before the stack limit
   * @returns {Object} `{ cost, depthUsed }`
   */
  _refCost (ref, frame, seenRef, restrict, isProperty, remaining) {
    if (seenRef[ref]) {
      this._flags.circular = true;

      return {
        cost: model.SENTINEL('<Circular reference to ' + ref + ' detected>'),
        depthUsed: 0
      };
    }

    const depthIndependentKey = ref + '|' + (restrict ? 1 : 0) + '|inf',
      depthIndependent = this.valueCache.get(depthIndependentKey);

    if (depthIndependent !== undefined && depthIndependent.depthUsed <= remaining) {
      this.stats.valueCacheHits++;
      this._mergeFlags(depthIndependent);

      return { cost: depthIndependent.cost, depthUsed: depthIndependent.depthUsed + 1 };
    }

    const exactKey = ref + '|' + (restrict ? 1 : 0) + '|' + remaining,
      exact = this.valueCache.get(exactKey);

    if (exact !== undefined) {
      this.stats.valueCacheHits++;
      this._mergeFlags(exact);

      return { cost: exact.cost, depthUsed: exact.depthUsed + 1 };
    }

    const target = resolvePointer(this.spec, ref);

    if (target === undefined) {
      return {
        cost: model.SENTINEL('reference ' + ref + ' not found in the OpenAPI spec'),
        depthUsed: 0
      };
    }

    this.stats.refExpansions++;

    const nextSeen = Object.create(seenRef);

    nextSeen[ref] = true;

    const outerFlags = this._flags;

    this._flags = { truncated: false, circular: false };

    const inner = this._valueCost(target, frame, nextSeen, restrict, isProperty),
      innerFlags = this._flags;

    this._flags = outerFlags;
    this._flags.truncated = this._flags.truncated || innerFlags.truncated;
    this._flags.circular = this._flags.circular || innerFlags.circular;

    const record = {
      cost: inner.cost,
      depthUsed: inner.depthUsed,
      truncated: innerFlags.truncated,
      circular: innerFlags.circular
    };

    /*
     * Cache under 'inf' when the subtree never came close to the stack limit, so it can be
     * reused at any depth. Otherwise cache against this exact remaining budget only.
     */
    this.valueCache.set(record.depthUsed < remaining ? depthIndependentKey : exactKey, record);

    return { cost: record.cost, depthUsed: record.depthUsed + 1 };
  }

  /**
   * @private
   * @param {Object} record - a cached record
   * @returns {void}
   */
  _mergeFlags (record) {
    if (record.truncated) { this._flags.truncated = true; }
    if (record.circular) { this._flags.circular = true; }
  }

  /**
   * @private
   * @param {Object} schema - inline (non-ref, non-composite) schema node
   * @param {Number} frame - frame count after entering this node
   * @param {Object} seenRef - refs on the current resolution path
   * @param {Boolean} restrict - restrictArrayItems for the enclosing body
   * @param {Boolean} isProperty - whether this node sits under a parent's `properties`
   * @returns {Object} `{ cost, depthUsed }`
   */
  _inlineCost (schema, frame, seenRef, restrict, isProperty) {
    const type = Array.isArray(schema.type) ? schema.type[0] : schema.type,
      hasProperties = _.isPlainObject(schema.properties),
      isObject = type === 'object' || hasProperties ||
        (_.isPlainObject(schema.additionalProperties) && !_.isEmpty(schema.additionalProperties));

    if (isObject) {
      const children = [];

      let depthUsed = 1;

      if (hasProperties) {
        _.forOwn(schema.properties, (property, name) => {
          if (!_.isPlainObject(property)) { return; }
          if (!this.includeDeprecated && property.deprecated) { return; }

          const child = this._valueCost(property, frame, seenRef, restrict, true);

          depthUsed = Math.max(depthUsed, child.depthUsed + 1);
          children.push({ keyLength: name.length, cost: child.cost });
        });
      }

      if (_.isPlainObject(schema.additionalProperties) && !_.isEmpty(schema.additionalProperties) &&
        !children.length) {
        const child = this._valueCost(schema.additionalProperties, frame, seenRef, restrict, false);

        depthUsed = Math.max(depthUsed, child.depthUsed + 1);

        for (let i = 0; i < model.ADDITIONAL_PROPS_KEYS; i++) {
          children.push({ keyLength: model.ADDITIONAL_PROPS_KEY_LENGTH, cost: child.cost });
        }
      }

      if (!children.length) {
        // json-schema-faker's objectType yields `{}` / null for a propertyless object
        return { cost: model.LEAF(2), depthUsed: 1 };
      }

      return { cost: objectCost(children), depthUsed };
    }

    if (type === 'array' && _.isPlainObject(schema.items)) {
      const defaultItems = restrict ? 1 : 2,
        length = model.arrayLength(schema, defaultItems, defaultItems),
        item = this._valueCost(schema.items, frame, seenRef, restrict, false);

      return { cost: arrayCost(item.cost, length), depthUsed: item.depthUsed + 1 };
    }

    return {
      cost: model.LEAF(leafBytes(schema, this.useTypePlaceholders, isProperty)),
      depthUsed: 1
    };
  }

  /**
   * Shallow `allOf` merge, sufficient for cost purposes: union the branches' `properties`
   * and carry over `type` / `items` / `additionalProperties` from the first branch that has them.
   *
   * @private
   * @param {Object} schema - schema with an `allOf`
   * @param {Number} frame - frame count
   * @param {Object} seenRef - refs on the current resolution path
   * @returns {Object} a merged schema node
   */
  _mergeAllOf (schema, frame, seenRef) {
    const merged = _.omit(schema, ['allOf']),
      properties = _.isPlainObject(merged.properties) ? _.assign({}, merged.properties) : {};

    schema.allOf.forEach((branch) => {
      let resolved = branch,
        hops = 0;

      // follow ref chains so the branch's own properties are visible
      while (_.isPlainObject(resolved) && typeof resolved.$ref === 'string' &&
        !seenRef[resolved.$ref] && hops < this.stackLimit) {
        const target = resolvePointer(this.spec, resolved.$ref);

        if (target === undefined) { break; }
        resolved = target;
        hops++;
      }

      if (!_.isPlainObject(resolved)) { return; }

      if (_.isPlainObject(resolved.properties)) {
        _.forOwn(resolved.properties, (value, key) => {
          if (!Object.prototype.hasOwnProperty.call(properties, key)) { properties[key] = value; }
        });
      }

      ['type', 'items', 'additionalProperties', 'minItems', 'maxItems', 'enum', 'format'].forEach((key) => {
        if (merged[key] === undefined && resolved[key] !== undefined) { merged[key] = resolved[key]; }
      });
    });

    if (!_.isEmpty(properties)) {
      merged.properties = properties;
      merged.type = merged.type || 'object';
    }

    return merged;
  }
}

module.exports = {
  SchemaCostEvaluator,
  resolvePointer,
  leafBytes,
  objectCost,
  arrayCost,
  prettyBytes,
  INDENT_WIDTH
};
