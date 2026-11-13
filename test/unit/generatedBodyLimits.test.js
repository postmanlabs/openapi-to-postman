const expect = require('chai').expect,
  _ = require('lodash'),
  {
    measureJsonLength,
    serialiseGeneratedBody,
    recordConversionIssue,
    CONVERSION_ISSUE_TYPES,
    MAX_CONVERSION_ISSUES,
    MAX_GENERATED_BODY_LENGTH,
    COMPACT_SERIALIZATION_THRESHOLD,
    ERR_BODY_TOO_LARGE
  } = require('../../libV2/CollectionGeneration/schemaUtils.js');

/**
 * Minimal stand-in for the conversion context, carrying only what the body ceiling touches.
 *
 * @returns {Object} Context object
 */
function makeContext () {
  return { conversionIssues: [], currentOperation: { method: 'post', path: '/things' } };
}

describe('measureJsonLength', function () {
  it('should return exactly the length JSON.stringify would produce, compact and indented', function () {
    const samples = [
      null,
      true,
      0,
      -12.5,
      'plain',
      [],
      {},
      [1, 2, 3],
      { a: 1, b: [true, null], c: { d: 'e' } },
      { 'key"with\tescapes': 'value\nwith\u0001controls' },
      { nested: { deeply: { nested: [{ x: [1, [2, [3]]] }] } } },
      { iso: new Date('2020-01-02T03:04:05.678Z') },
      { dropped: undefined, fn: _.noop, kept: 1 },
      { surrogates: 'pair 😀 and lone \ud800 here' }
    ];

    _.forEach(samples, function (sample) {
      expect(measureJsonLength(sample, Infinity, 0),
        'compact: ' + JSON.stringify(sample)).to.equal(JSON.stringify(sample).length);

      _.forEach(['  ', '    '], function (indent) {
        expect(measureJsonLength(sample, Infinity, indent.length),
          'indent ' + indent.length + ': ' + JSON.stringify(sample))
          .to.equal(JSON.stringify(sample, null, indent).length);
      });
    });
  });

  it('should account for JSON escaping rather than raw string length', function () {
    // A control character costs six characters as a \u00xx escape, so the escaped form is longer.
    const value = String.fromCharCode(1).repeat(1000);

    expect(measureJsonLength(value, Infinity)).to.equal(6002);
    expect(measureJsonLength(value, Infinity)).to.equal(JSON.stringify(value).length);
  });

  it('should not build the serialised string while measuring a huge leaf', function () {
    // V8 cannot hold a string longer than this, so `JSON.stringify` throws
    // `RangeError: Invalid string length` rather than returning.
    const V8_MAX_STRING_LENGTH = 536870888,
      // Legal on its own - well under the limit - but JSON escaping expands each control
      // character to six, so the serialised form could not exist. Measuring has to reach that
      // conclusion without attempting the allocation.
      value = { note: String.fromCharCode(1).repeat(95 * 1000 * 1000) },
      measured = measureJsonLength(value, MAX_GENERATED_BODY_LENGTH);

    expect(measured).to.be.above(V8_MAX_STRING_LENGTH);
    expect(measured).to.be.above(MAX_GENERATED_BODY_LENGTH);
  });

  it('should stop measuring once the running total passes the budget', function () {
    const wide = { items: _.times(50000, function (index) { return { index: index, label: 'x' }; }) };

    expect(measureJsonLength(wide, 1000)).to.be.above(1000);
    expect(measureJsonLength(wide, 1000)).to.be.below(measureJsonLength(wide, Infinity));
  });
});

describe('serialiseGeneratedBody', function () {
  it('should indent bodies below the compact threshold, leaving ordinary specs unchanged', function () {
    const context = makeContext(),
      body = { a: 1, b: { c: [1, 2] } };

    expect(serialiseGeneratedBody(context, body, '  ')).to.equal(JSON.stringify(body, null, '  '));
    expect(context.conversionIssues).to.be.empty;
  });

  it('should serialise compactly above the compact threshold', function () {
    const context = makeContext(),
      // Comfortably past COMPACT_SERIALIZATION_THRESHOLD but far below the ceiling.
      body = { items: _.times(260000, function (index) { return { index: index, label: 'padding' }; }) },
      result = serialiseGeneratedBody(context, body, '  ');

    expect(measureJsonLength(body, Infinity)).to.be.above(COMPACT_SERIALIZATION_THRESHOLD);
    expect(result).to.equal(JSON.stringify(body));
    expect(result).to.not.contain('\n');
    expect(context.conversionIssues).to.be.empty;
  });

  it('should drop a body past the ceiling and record a BODY_TOO_LARGE issue', function () {
    const context = makeContext(),
      body = { note: 'a'.repeat(MAX_GENERATED_BODY_LENGTH + 1) },
      result = serialiseGeneratedBody(context, body, '  ', { in: 'request', contentType: 'application/json' });

    expect(result).to.equal(ERR_BODY_TOO_LARGE);
    expect(context.conversionIssues).to.have.lengthOf(1);

    const issue = context.conversionIssues[0];

    expect(issue.type).to.equal(CONVERSION_ISSUE_TYPES.BODY_TOO_LARGE);
    expect(issue.in).to.equal('request');
    expect(issue.contentType).to.equal('application/json');
    expect(issue.maxBodyLength).to.equal(MAX_GENERATED_BODY_LENGTH);
    expect(issue.generatedBodyLength).to.be.above(MAX_GENERATED_BODY_LENGTH);
    // Operation context is stamped onto every issue.
    expect(issue.method).to.equal('post');
    expect(issue.path).to.equal('/things');
  });

  it('should apply the ceiling to raw string bodies, which are never serialised', function () {
    const context = makeContext(),
      xmlish = '<a>' + 'b'.repeat(MAX_GENERATED_BODY_LENGTH) + '</a>';

    expect(serialiseGeneratedBody(context, xmlish, '  ', { in: 'response' })).to.equal(ERR_BODY_TOO_LARGE);
    expect(context.conversionIssues).to.have.lengthOf(1);
    expect(context.conversionIssues[0].type).to.equal(CONVERSION_ISSUE_TYPES.BODY_TOO_LARGE);
  });

  it('should pass a raw string body below the ceiling through untouched', function () {
    const context = makeContext(),
      xmlish = '<?xml version="1.0"?><a>b</a>';

    expect(serialiseGeneratedBody(context, xmlish, '  ')).to.equal(xmlish);
    expect(context.conversionIssues).to.be.empty;
  });

  it('should fall back to compact output when indentation alone would breach the ceiling', function () {
    const context = makeContext();

    // Short scalars nested deeply: cheap compactly, but every level adds its own indent to each
    // of them. Compact stays under the compact threshold, indented passes the ceiling.
    let body = _.times(1200000, _.constant(1));

    for (let depth = 0; depth < 62; depth++) {
      body = { a: body };
    }

    const compact = measureJsonLength(body, Infinity, 0),
      indented = measureJsonLength(body, Infinity, 2);

    expect(compact).to.be.below(COMPACT_SERIALIZATION_THRESHOLD);
    expect(indented).to.be.above(MAX_GENERATED_BODY_LENGTH);

    expect(serialiseGeneratedBody(context, body, '  ')).to.equal(JSON.stringify(body));
    // The body is emitted, not dropped, so this is not a conversion issue.
    expect(context.conversionIssues).to.be.empty;
  });
});

describe('recordConversionIssue', function () {
  it('should stamp the current operation onto each issue', function () {
    const context = makeContext();

    recordConversionIssue(context, { type: CONVERSION_ISSUE_TYPES.REQUEST_GENERATION_FAILED, reason: 'boom' });

    expect(context.conversionIssues).to.have.lengthOf(1);
    expect(context.conversionIssues[0]).to.deep.include({
      type: CONVERSION_ISSUE_TYPES.REQUEST_GENERATION_FAILED,
      reason: 'boom',
      method: 'post',
      path: '/things'
    });
  });

  it('should initialise the issue list if absent', function () {
    const context = {};

    recordConversionIssue(context, { type: CONVERSION_ISSUE_TYPES.BODY_TOO_LARGE });
    expect(context.conversionIssues).to.have.lengthOf(1);
  });

  it('should cap the list and replace the last entry with an ISSUE_LIMIT_REACHED marker', function () {
    const context = makeContext();

    _.times(MAX_CONVERSION_ISSUES + 50, function () {
      recordConversionIssue(context, { type: CONVERSION_ISSUE_TYPES.BODY_TOO_LARGE, reason: 'r' });
    });

    expect(context.conversionIssues).to.have.lengthOf(MAX_CONVERSION_ISSUES);
    expect(_.last(context.conversionIssues).type).to.equal(CONVERSION_ISSUE_TYPES.ISSUE_LIMIT_REACHED);
  });
});
