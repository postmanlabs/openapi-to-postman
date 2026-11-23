const fs = require('fs'),
  path = require('path'),
  { expect } = require('chai'),
  Converter = require('../../dist/index.js'),
  specValidationErrors = require('../../lib/common/specValidationErrors'),
  { SPEC_VALIDATION_ERROR_CODES, getSpecValidationErrorMessage } = specValidationErrors,
  operation = { get: { responses: { 200: { description: 'OK' } } } },
  info = { title: 'Pets', version: '1.0.0' },
  convertSpec = (input) => {
    return new Promise((resolve) => {
      Converter.convertV2WithTypes(input, {}, (err, result) => {
        resolve({ err, result });
      });
    });
  },
  bundleRoot = (rootContent, specificationVersion) => {
    return Converter.bundle({
      type: 'multiFile',
      specificationVersion,
      rootFiles: [{ path: '/root.yaml' }],
      data: [{ path: '/root.yaml', content: rootContent }],
      options: {},
      bundleFormat: 'JSON'
    });
  },
  getRootContent = (header) => {
    return header +
      'info:\n' +
      '  title: Pets\n' +
      '  version: 1.0.0\n' +
      'paths:\n' +
      '  /pets:\n' +
      '    get:\n' +
      '      responses:\n' +
      '        \'200\':\n' +
      '          description: OK\n';
  };

describe('getSpecValidationErrorMessage', function () {
  [
    { code: 'SPEC_EMPTY', message: 'The specification is empty. Add content to it and try again.' },
    {
      code: 'SPEC_INVALID_FORMAT',
      message: 'The specification isn\'t valid JSON or YAML. Fix the syntax errors and try again.'
    },
    { code: 'SPEC_INFO_MISSING', message: 'Add an "info" object to the specification.' },
    { code: 'SPEC_INFO_TITLE_MISSING', message: 'Add a "title" to the "info" object.' },
    { code: 'SPEC_INFO_VERSION_MISSING', message: 'Add a "version" to the "info" object.' },
    { code: 'SPEC_PATHS_MISSING', message: 'Add a "paths" object to the specification.' },
    { code: 'SPEC_PATHS_INVALID', message: '"paths" must be an object with path keys, for example "/pets".' },
    { code: 'SPEC_SWAGGER_VERSION_INVALID', message: 'Set the "swagger" field to "2.0" (in quotes).' }
  ].forEach(({ code, message }) => {
    it(`should return the message for ${code}`, function () {
      expect(getSpecValidationErrorMessage(code, undefined, '3.0')).to.equal(message);
    });
  });

  describe('SPEC_VERSION_MISSING', function () {
    [
      { expected: '3.0', message: 'Add the "openapi" field with a version, for example "3.0.3".' },
      { expected: '3.1', message: 'Add the "openapi" field with a version, for example "3.1.0".' },
      { expected: '3.2', message: 'Add the "openapi" field with a version, for example "3.2.0".' },
      { expected: '2.0', message: 'Add the "swagger" field with the value "2.0".' }
    ].forEach(({ expected, message }) => {
      it(`should return the message for an expected ${expected} version`, function () {
        expect(getSpecValidationErrorMessage('SPEC_VERSION_MISSING', { expected })).to.equal(message);
      });
    });

    it('should fall back to the expected version argument when meta has none', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISSING', {}, '3.1')).to.equal(
        'Add the "openapi" field with a version, for example "3.1.0".'
      );
    });

    it('should prefer the version in meta over the expected version argument', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISSING', { expected: '2.0' }, '3.1')).to.equal(
        'Add the "swagger" field with the value "2.0".'
      );
    });

    ['3.0.0', '3', ''].forEach((expected) => {
      it(`should fall back to the expected version argument when meta has the unknown version "${expected}"`,
        function () {
          expect(getSpecValidationErrorMessage('SPEC_VERSION_MISSING', { expected }, '3.0')).to.equal(
            'Add the "openapi" field with a version, for example "3.0.3".'
          );
        });
    });

    it('should return undefined for an unknown expected version', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISSING', { expected: '4.0' })).to.be.undefined;
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISSING', {})).to.be.undefined;
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISSING', {}, 'toString')).to.be.undefined;
    });
  });

  describe('SPEC_VERSION_MISMATCH', function () {
    it('should describe a version mismatch on the same key', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', {
        expected: '3.0',
        foundKey: 'openapi',
        found: '3.1.0'
      })).to.equal(
        'This spec is set up as OpenAPI 3.0, but its "openapi" field is "3.1.0". Change it to a 3.0.x version.'
      );
    });

    it('should ask for the exact "2.0" for a 2.0 spec with a different swagger version', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', {
        expected: '2.0',
        foundKey: 'swagger',
        found: '1.2'
      })).to.equal('This spec is set up as OpenAPI 2.0, but its "swagger" field is "1.2". Set it to "2.0".');
    });

    it('should describe a 3.x spec written as Swagger', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', {
        expected: '3.2',
        foundKey: 'swagger',
        found: '2.0'
      })).to.equal(
        'This spec is set up as OpenAPI 3.2, but it\'s written as Swagger 2.0. ' +
        'Use an "openapi" field with a 3.2.x version.'
      );
    });

    it('should describe a 3.x spec written with another swagger version', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', {
        expected: '3.0',
        foundKey: 'swagger',
        found: '1.2'
      })).to.equal(
        'This spec is set up as OpenAPI 3.0, but it\'s written as Swagger 1.2. ' +
        'Use an "openapi" field with a 3.0.x version.'
      );
    });

    it('should fall back to the expected version argument when meta has an unknown version', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', {
        expected: '3.0.0',
        foundKey: 'openapi',
        found: '3.1.0'
      }, '3.0')).to.equal(
        'This spec is set up as OpenAPI 3.0, but its "openapi" field is "3.1.0". Change it to a 3.0.x version.'
      );
    });

    it('should describe a 2.0 spec written as OpenAPI', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', {
        expected: '2.0',
        foundKey: 'openapi',
        found: '3.0.3'
      })).to.equal(
        'This spec is set up as OpenAPI 2.0, but it\'s written as OpenAPI 3.0.3. Use "swagger": "2.0" instead.'
      );
    });

    it('should return undefined for incomplete or unknown meta', function () {
      expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', { expected: '3.0', foundKey: 'openapi' })).to.be
        .undefined;
      [
        { expected: '3.0', foundKey: 'openapi', found: '' },
        { expected: '3.0', foundKey: 'other', found: '1' },
        { expected: '9.9', foundKey: 'openapi', found: '1' }
      ].forEach((meta) => {
        expect(getSpecValidationErrorMessage('SPEC_VERSION_MISMATCH', meta), JSON.stringify(meta)).to.be.undefined;
      });
    });
  });

  describe('SPEC_DUPLICATE_COMPONENT_NAME', function () {
    [
      { kind: 'securityScheme', label: 'security definitions' },
      { kind: 'parameter', label: 'parameters' },
      { kind: 'response', label: 'responses' }
    ].forEach(({ kind, label }) => {
      it(`should return the message for duplicate ${kind} names`, function () {
        expect(getSpecValidationErrorMessage('SPEC_DUPLICATE_COMPONENT_NAME', { kind, name: 'pet_id' })).to.equal(
          `Two ${label} resolve to the same name "pet_id". Rename one of them.`
        );
      });
    });

    it('should return undefined for an unknown kind or a missing name', function () {
      expect(getSpecValidationErrorMessage('SPEC_DUPLICATE_COMPONENT_NAME', { kind: 'schema', name: 'a' })).to.be
        .undefined;
      expect(getSpecValidationErrorMessage('SPEC_DUPLICATE_COMPONENT_NAME', { kind: 'toString', name: 'a' })).to.be
        .undefined;
      expect(getSpecValidationErrorMessage('SPEC_DUPLICATE_COMPONENT_NAME', { kind: 'parameter' })).to.be.undefined;
    });
  });

  describe('SPEC_NO_VALID_PATHS', function () {
    [
      { example: 'pets', message: 'Paths must start with "/" (found "pets").' },
      { example: 'https://example.com/pets', message: 'Paths must start with "/" (found "https://example.com/pets").' },
      { example: '', message: 'Paths must start with "/" (found "").' }
    ].forEach(({ example, message }) => {
      it(`should return the message for the example ${JSON.stringify(example)}`, function () {
        expect(getSpecValidationErrorMessage('SPEC_NO_VALID_PATHS', { example })).to.equal(message);
      });
    });

    it('should return undefined for a missing or non-string example', function () {
      expect(getSpecValidationErrorMessage('SPEC_NO_VALID_PATHS', {})).to.be.undefined;
      expect(getSpecValidationErrorMessage('SPEC_NO_VALID_PATHS', { example: 1 })).to.be.undefined;
    });
  });

  it('should have a message for every code', function () {
    const meta = {
      expected: '3.0',
      foundKey: 'openapi',
      found: '3.1.0',
      kind: 'parameter',
      name: 'a',
      example: 'pets'
    };

    Object.values(SPEC_VALIDATION_ERROR_CODES).forEach((code) => {
      expect(getSpecValidationErrorMessage(code, meta, '3.0'), code).to.be.a('string');
    });
  });

  it('should return undefined without throwing for an unknown code or invalid input', function () {
    expect(getSpecValidationErrorMessage('SPEC_UNKNOWN', {}, '3.0')).to.be.undefined;
    expect(getSpecValidationErrorMessage(undefined, undefined)).to.be.undefined;
    expect(getSpecValidationErrorMessage(42, null)).to.be.undefined;
    expect(getSpecValidationErrorMessage('toString', {})).to.be.undefined;
    expect(getSpecValidationErrorMessage('SPEC_NO_VALID_PATHS', 'not an object')).to.be.undefined;
  });
});

describe('specification validation error exports', function () {
  const getCodes = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker),
      end = source.indexOf(endMarker, start);

    expect(start, startMarker).to.be.above(-1);

    return source.slice(start + startMarker.length, end).match(/SPEC_[A-Z_]+/g).filter((code, index, codes) => {
      return codes.indexOf(code) === index;
    }).sort();
  };

  it('should export the codes and the message function from the main entry', function () {
    expect(Converter.SPEC_VALIDATION_ERROR_CODES).to.equal(SPEC_VALIDATION_ERROR_CODES);
    expect(Converter.default.SPEC_VALIDATION_ERROR_CODES).to.equal(SPEC_VALIDATION_ERROR_CODES);
    expect(Converter.getSpecValidationErrorMessage('SPEC_INFO_MISSING')).to.equal(
      'Add an "info" object to the specification.'
    );
    expect(Converter.default.getSpecValidationErrorMessage).to.equal(Converter.getSpecValidationErrorMessage);
  });

  it('should map every code to itself', function () {
    Object.keys(SPEC_VALIDATION_ERROR_CODES).forEach((code) => {
      expect(SPEC_VALIDATION_ERROR_CODES[code]).to.equal(code);
    });
  });

  it('should list the same codes in the runtime codes and both type declarations', function () {
    const runtimeCodes = Object.keys(SPEC_VALIDATION_ERROR_CODES).sort(),
      typesCodes = getCodes(fs.readFileSync(path.join(__dirname, '../../types/index.ts'), 'utf8'),
        'export type SpecValidationErrorCode', ';'),
      declarationCodes = getCodes(fs.readFileSync(path.join(__dirname, '../../lib/common/specValidationErrors.d.ts'),
        'utf8'), 'export declare const SPEC_VALIDATION_ERROR_CODES', '};');

    expect(typesCodes).to.eql(runtimeCodes);
    expect(declarationCodes).to.eql(runtimeCodes);
  });
});

describe('specification validation error messages for real conversions', function () {
  const expectConversionMessage = async (input, expectedCode, message, expectedVersion) => {
      const { err } = await convertSpec(input);

      expect(err, 'conversion error').to.exist;
      expect(err.code).to.equal(expectedCode);
      expect(getSpecValidationErrorMessage(err.code, err.meta, expectedVersion)).to.equal(message);
    },
    expectBundleMessage = async (rootContent, specificationVersion, expectedCode, message) => {
      const res = await bundleRoot(rootContent, specificationVersion);

      expect(res.result).to.be.false;
      expect(res.code).to.equal(expectedCode);
      expect(getSpecValidationErrorMessage(res.code, res.meta, specificationVersion)).to.equal(message);
    };

  it('should give a message for SPEC_EMPTY', async function () {
    await expectConversionMessage({ type: 'string', data: '' }, 'SPEC_EMPTY',
      'The specification is empty. Add content to it and try again.', '3.0');
  });

  it('should give a message for SPEC_INVALID_FORMAT', async function () {
    await expectConversionMessage({ type: 'string', data: '{ "openapi": "3.0.0", "info": ' }, 'SPEC_INVALID_FORMAT',
      'The specification isn\'t valid JSON or YAML. Fix the syntax errors and try again.', '3.0');
  });

  it('should give a message for SPEC_VERSION_MISSING with the expected version passed in', async function () {
    await expectConversionMessage({ type: 'json', data: { info, paths: { '/pets': operation } } },
      'SPEC_VERSION_MISSING', 'Add the "openapi" field with a version, for example "3.0.3".', '3.0');
  });

  it('should give a message for SPEC_VERSION_MISSING from bundle', async function () {
    await expectBundleMessage(getRootContent(''), '2.0', 'SPEC_VERSION_MISSING',
      'Add the "swagger" field with the value "2.0".');
  });

  it('should give a message for SPEC_VERSION_MISSING from bundle given an unnormalized version', async function () {
    const res = await bundleRoot(getRootContent(''), '3.0.0');

    expect(res.code).to.equal('SPEC_VERSION_MISSING');
    expect(res.meta).to.eql({ expected: '3.0.0' });
    expect(getSpecValidationErrorMessage(res.code, res.meta, '3.0')).to.equal(
      'Add the "openapi" field with a version, for example "3.0.3".'
    );
  });

  [
    {
      header: 'openapi: 3.1.0\n',
      expected: '3.0',
      message: 'This spec is set up as OpenAPI 3.0, but its "openapi" field is "3.1.0". Change it to a 3.0.x version.'
    },
    {
      header: 'swagger: \'2.0\'\n',
      expected: '3.2',
      message: 'This spec is set up as OpenAPI 3.2, but it\'s written as Swagger 2.0. ' +
        'Use an "openapi" field with a 3.2.x version.'
    },
    {
      header: 'swagger: \'1.2\'\n',
      expected: '3.0',
      message: 'This spec is set up as OpenAPI 3.0, but it\'s written as Swagger 1.2. ' +
        'Use an "openapi" field with a 3.0.x version.'
    },
    {
      header: 'openapi: 3.0.3\n',
      expected: '2.0',
      message: 'This spec is set up as OpenAPI 2.0, but it\'s written as OpenAPI 3.0.3. Use "swagger": "2.0" instead.'
    }
  ].forEach(({ header, expected, message }) => {
    it(`should give a message for SPEC_VERSION_MISMATCH (${header.trim()} when ${expected} is expected)`,
      async function () {
        await expectBundleMessage(getRootContent(header), expected, 'SPEC_VERSION_MISMATCH', message);
      });
  });

  [
    {
      code: 'SPEC_INFO_MISSING',
      spec: { openapi: '3.0.3', paths: { '/pets': operation } },
      message: 'Add an "info" object to the specification.'
    },
    {
      code: 'SPEC_INFO_TITLE_MISSING',
      spec: { openapi: '3.0.3', info: { version: '1.0.0' }, paths: { '/pets': operation } },
      message: 'Add a "title" to the "info" object.'
    },
    {
      code: 'SPEC_INFO_VERSION_MISSING',
      spec: { openapi: '3.0.3', info: { title: 'Pets' }, paths: { '/pets': operation } },
      message: 'Add a "version" to the "info" object.'
    },
    {
      code: 'SPEC_PATHS_MISSING',
      spec: { openapi: '3.0.3', info },
      message: 'Add a "paths" object to the specification.'
    },
    {
      code: 'SPEC_PATHS_INVALID',
      spec: { openapi: '3.0.3', info, paths: ['/pets'] },
      message: '"paths" must be an object with path keys, for example "/pets".'
    },
    {
      code: 'SPEC_SWAGGER_VERSION_INVALID',
      spec: { swagger: 2, info, paths: { '/pets': operation } },
      message: 'Set the "swagger" field to "2.0" (in quotes).'
    },
    {
      code: 'SPEC_DUPLICATE_COMPONENT_NAME',
      spec: {
        swagger: '2.0',
        info,
        paths: { '/pets': operation },
        parameters: {
          'pet id': { name: 'id', in: 'query', type: 'string' },
          pet_id: { name: 'id', in: 'query', type: 'string' }
        }
      },
      message: 'Two parameters resolve to the same name "pet_id". Rename one of them.'
    },
    {
      code: 'SPEC_NO_VALID_PATHS',
      spec: { openapi: '3.0.3', info, paths: { pets: operation } },
      message: 'Paths must start with "/" (found "pets").'
    }
  ].forEach(({ code, spec, message }) => {
    it(`should give a message for ${code}`, async function () {
      await expectConversionMessage({ type: 'json', data: spec }, code, message);
    });
  });
});
