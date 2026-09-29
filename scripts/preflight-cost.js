#!/usr/bin/env node
/**
 * Prints a ranked, worst-first cost projection for every operation in an OpenAPI document,
 * without converting anything.
 *
 * Usage:
 *   node scripts/preflight-cost.js <spec.json|spec.yaml> [options]
 *
 * Options:
 *   --limit=<n>                  rows to print (default 25, `all` for everything)
 *   --parameters-resolution=<s>  'schema' (default, matches the converter default) or 'example'
 *   --stack-limit=<n>            user stack limit; effective limit is max(n, 30)
 *   --include-webhooks           also predict `webhooks` entries
 *   --no-deprecated              exclude deprecated properties
 *   --only=<class>               filter to ok | expensive | will-fail
 *   --json                       emit the raw report as JSON instead of a table
 *
 * Exit code is 1 when any operation is classified as will-exceed-512MiB-string-limit.
 */

/* eslint-disable no-console */

const fs = require('fs'),
  path = require('path'),
  { predictConversionCost, CLASSIFICATION } = require('../lib/preflight'),

  CLASS_ALIASES = {
    ok: CLASSIFICATION.OK,
    expensive: CLASSIFICATION.EXPENSIVE,
    'will-fail': CLASSIFICATION.WILL_FAIL,
    fail: CLASSIFICATION.WILL_FAIL
  },

  humanBytes = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];

    let value = bytes,
      index = 0;

    while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }

    return (index === 0 ? String(Math.round(value)) : value.toFixed(value < 10 ? 2 : 1)) + ' ' + units[index];
  },

  humanMs = (ms) => {
    if (ms < 1000) { return Math.round(ms) + ' ms'; }
    if (ms < 60000) { return (ms / 1000).toFixed(1) + ' s'; }

    return (ms / 60000).toFixed(1) + ' min';
  },

  humanCount = (n) => {
    return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : (n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n));
  },

  parseArgs = (argv) => {
    const parsed = { limit: 25, options: {} };

    argv.forEach((arg) => {
      if (arg === '--json') { parsed.json = true; }
      else if (arg === '--include-webhooks') { parsed.options.includeWebhooks = true; }
      else if (arg === '--no-deprecated') { parsed.options.includeDeprecated = false; }
      else if (arg.startsWith('--limit=')) {
        const value = arg.slice('--limit='.length);

        parsed.limit = value === 'all' ? Infinity : parseInt(value, 10);
      }
      else if (arg.startsWith('--parameters-resolution=')) {
        parsed.options.parametersResolution = arg.slice('--parameters-resolution='.length);
      }
      else if (arg.startsWith('--stack-limit=')) {
        parsed.options.stackLimit = parseInt(arg.slice('--stack-limit='.length), 10);
      }
      else if (arg.startsWith('--only=')) { parsed.only = arg.slice('--only='.length); }
      else if (!arg.startsWith('-') && !parsed.file) { parsed.file = arg; }
    });

    return parsed;
  },

  /**
   * Reads and parses a spec file. JSON is parsed directly; anything else goes through
   * `js-yaml` (a direct dependency of this package).
   *
   * @param {String} file - path to the spec
   * @returns {Object} parsed document
   */
  loadSpec = (file) => {
    const raw = fs.readFileSync(file, 'utf8'); // eslint-disable-line no-sync

    if (path.extname(file).toLowerCase() === '.json') { return JSON.parse(raw); }

    try { return JSON.parse(raw); }
    catch (e) { return require('js-yaml').load(raw); }
  };

/**
 * Entry point.
 *
 * @returns {void}
 */
function main () {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    console.error('usage: node scripts/preflight-cost.js <spec.json|spec.yaml> [--limit=n] ' +
      '[--parameters-resolution=schema|example] [--only=ok|expensive|will-fail] [--json]');
    process.exit(2);
  }

  const spec = loadSpec(args.file),
    report = predictConversionCost(spec, args.options);

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.summary.willFail > 0 ? 1 : 0);
  }

  const wanted = args.only ? CLASS_ALIASES[args.only] || args.only : null,
    rows = wanted ?
      report.operations.filter((op) => { return op.classification === wanted; }) :
      report.operations,
    shown = rows.slice(0, args.limit);

  console.log('');
  console.log('Pre-flight conversion cost -- ' + args.file);
  console.log('  ' + report.meta.paths + ' paths, ' + report.meta.operations + ' operations, ' +
    report.meta.componentSchemas + ' component schemas');
  console.log('  parametersResolution=' + report.meta.parametersResolution +
    '  refStackLimit=' + report.meta.refStackLimit +
    '  predictor wall clock=' + report.meta.elapsedMs + ' ms');
  console.log('');
  console.log('  ok: ' + report.summary.ok +
    '   expensive: ' + report.summary.expensive +
    '   ' + CLASSIFICATION.WILL_FAIL + ': ' + report.summary.willFail);
  console.log('  projected total output: ' + humanBytes(report.summary.projectedTotalBytes) +
    '   projected total generation time: ' + humanMs(report.summary.projectedTotalMs));
  console.log('');

  const header = ['#', 'CLASS', 'BYTES', 'TIME', 'NODES', 'OPERATION', 'WORST BODY'],
    widths = [4, 34, 11, 10, 9, 58, 46],
    line = (cells) => {
      return cells.map((cell, i) => {
        const text = String(cell);

        return i === 0 || i === 2 || i === 3 || i === 4 ?
          text.padStart(widths[i]) :
          text.padEnd(widths[i]);
      }).join(' ').replace(/\s+$/, '');
    };

  console.log(line(header));
  console.log('-'.repeat(widths.reduce((a, b) => { return a + b + 1; }, 0)));

  shown.forEach((op, index) => {
    const worst = op.largestBody,
      worstLabel = worst ?
        (worst.kind === 'request' ? 'req' : 'res ' + worst.code) + ' ' +
          String(worst.schemaRef).replace('#/components/schemas/', '') :
        '-';

    console.log(line([
      index + 1,
      op.classification,
      humanBytes(op.projectedBytes),
      humanMs(op.projectedMs),
      humanCount(op.projectedNodes),
      op.method + ' ' + op.path,
      worstLabel
    ]));
  });

  if (rows.length > shown.length) {
    console.log('  ... ' + (rows.length - shown.length) + ' more (use --limit=all)');
  }

  console.log('');

  if (report.summary.willFail) {
    console.log('Operations predicted to fail:');
    report.operations
      .filter((op) => { return op.classification === CLASSIFICATION.WILL_FAIL; })
      .forEach((op) => {
        console.log('  ' + op.method + ' ' + op.path + '  ->  ' +
          humanBytes(op.projectedBytes) + ' via ' + (op.largestBody ? op.largestBody.schemaRef : '?'));
      });
    console.log('');
  }

  process.exit(report.summary.willFail > 0 ? 1 : 0);
}

main();
