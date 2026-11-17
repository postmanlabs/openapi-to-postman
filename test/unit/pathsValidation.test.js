const { expect } = require('chai'),
  Converter = require('../../dist/index.js'),
  { validatePaths } = require('../../lib/common/pathsValidation'),
  { generateError } = require('../../lib/common/generateValidationError'),
  UserError = require('../../lib/common/UserError'),
  { ParseError } = require('../../lib/common/ParseError'),
  operation = { get: { responses: { 200: { description: 'OK' } } } },
  buildSpec = (paths, versionFields = { openapi: '3.0.3' }) => {
    return Object.assign({ info: { title: 'Sample API', version: '1.0.0' }, paths }, versionFields);
  },
  convertSpec = (spec) => {
    return new Promise((resolve) => {
      Converter.convertV2WithTypes({ type: 'json', data: spec }, {}, (err, result) => {
        resolve({ err, result });
      });
    });
  };

describe('validatePaths', function () {
  it('should pass when paths is missing', function () {
    expect(validatePaths({ openapi: '3.0.3' })).to.eql({ result: true });
  });

  [
    { title: 'an array', paths: ['/pets'] },
    { title: 'a string', paths: '/pets' },
    { title: 'a number', paths: 1 },
    { title: 'a boolean', paths: true }
  ].forEach(({ title, paths }) => {
    it(`should return SPEC_PATHS_INVALID when paths is ${title}`, function () {
      expect(validatePaths(buildSpec(paths))).to.eql({
        result: false,
        reason: 'Specification "paths" must be an object',
        code: 'SPEC_PATHS_INVALID'
      });
    });
  });

  [
    { paths: { pets: operation, 'pets/{id}': operation }, example: 'pets' },
    { paths: { 'pets?x=1': operation }, example: 'pets?x=1' },
    { paths: { 'https://example.com/pets': operation }, example: 'https://example.com/pets' },
    { paths: { '': operation }, example: '' }
  ].forEach(({ paths, example }) => {
    it(`should return SPEC_NO_VALID_PATHS for ${JSON.stringify(Object.keys(paths))}`, function () {
      expect(validatePaths(buildSpec(paths))).to.eql({
        result: false,
        reason: 'Specification must contain at least one valid path',
        code: 'SPEC_NO_VALID_PATHS',
        meta: { example }
      });
    });
  });

  it('should truncate the example to 100 characters', function () {
    const longKey = 'p'.repeat(150),
      validationResult = validatePaths(buildSpec({ [longKey]: operation }));

    expect(validationResult.meta).to.eql({ example: 'p'.repeat(100) });
  });

  it('should ignore x- keys when looking for invalid paths', function () {
    const validationResult = validatePaths(buildSpec({ 'x-internal': {}, pets: operation }));

    expect(validationResult.code).to.equal('SPEC_NO_VALID_PATHS');
    expect(validationResult.meta).to.eql({ example: 'pets' });
  });

  [
    { title: 'paths is empty', paths: {} },
    { title: 'paths only has x- keys', paths: { 'x-internal': { foo: 'bar' } } },
    { title: 'at least one path is valid', paths: { pets: operation, '/owners': operation } },
    { title: 'a well-formed path has no methods', paths: { pets: operation, '/owners': {} } },
    { title: 'a well-formed path item is null', paths: { pets: operation, '/owners': null } },
    { title: 'path keys have a query string or fragment',
      paths: { '/pets?limit=1': operation, '/pets#top': operation } },
    { title: 'path items have unresolved references',
      paths: { '/pets': { $ref: './pets.yaml' }, '/owners': { $ref: '#/components/pathItems/Missing' } } }
  ].forEach(({ title, paths }) => {
    it(`should pass when ${title}`, function () {
      expect(validatePaths(buildSpec(paths))).to.eql({ result: true });
    });
  });
});

describe('paths validation during conversion', function () {
  [
    { label: '2.0', versionFields: { swagger: '2.0' } },
    { label: '3.0', versionFields: { openapi: '3.0.3' } },
    { label: '3.1', versionFields: { openapi: '3.1.0' } },
    { label: '3.2', versionFields: { openapi: '3.2.0' } }
  ].forEach(({ label, versionFields }) => {
    describe(`OpenAPI ${label}`, function () {
      [
        { paths: { pets: operation }, example: 'pets' },
        { paths: { 'pets?x=1': operation }, example: 'pets?x=1' },
        { paths: { 'https://example.com/pets': operation }, example: 'https://example.com/pets' },
        { paths: { '': operation }, example: '' }
      ].forEach(({ paths, example }) => {
        it(`should return SPEC_NO_VALID_PATHS for ${JSON.stringify(Object.keys(paths))}`, async function () {
          const { err } = await convertSpec(buildSpec(paths, versionFields));

          expect(err.name).to.equal('UserError');
          expect(err.message).to.equal('Specification must contain at least one valid path');
          expect(err.code).to.equal('SPEC_NO_VALID_PATHS');
          expect(err.meta).to.eql({ example });
        });
      });

      [
        { title: 'an array', paths: ['/pets'] },
        { title: 'a string', paths: '/pets' },
        { title: 'a number', paths: 1 },
        { title: 'a boolean', paths: true }
      ].forEach(({ title, paths }) => {
        it(`should return SPEC_PATHS_INVALID when paths is ${title}`, async function () {
          const { err } = await convertSpec(buildSpec(paths, versionFields));

          expect(err.name).to.equal('UserError');
          expect(err.message).to.equal('Specification "paths" must be an object');
          expect(err.code).to.equal('SPEC_PATHS_INVALID');
          expect(err).to.not.have.property('meta');
        });
      });

      [
        { title: 'a partially valid spec', paths: { pets: operation, '/owners': operation } },
        { title: 'a spec with empty paths', paths: {} },
        { title: 'a spec with only x- path keys', paths: { 'x-internal': { foo: 'bar' } } },
        { title: 'a spec with a well-formed path without methods', paths: { '/owners': {} } },
        { title: 'a spec with query strings and fragments in path keys',
          paths: { '/pets?limit=1': operation, '/owners#top': operation } },
        { title: 'a spec with an unresolved path item reference', paths: { '/pets': { $ref: './pets.yaml' } } }
      ].forEach(({ title, paths }) => {
        it(`should convert ${title}`, async function () {
          const { err, result } = await convertSpec(buildSpec(paths, versionFields));

          expect(err).to.be.null;
          expect(result.result).to.be.true;
        });
      });
    });
  });
});

// Inputs that fail before the spec can be read. Bundle reports the same codes for them.
const unreadableInputs = [
  { input: 'an empty string', data: '', code: 'SPEC_EMPTY', reason: 'Empty input schema provided.' },
  {
    input: 'whitespace only',
    data: '   \n',
    code: 'SPEC_EMPTY',
    reason: 'Invalid format. Input must be in YAML or JSON format.'
  },
  { input: 'only a comment', data: '# hi\n', code: 'SPEC_EMPTY', reason: 'The Specification is null or undefined' },
  { input: 'only "~"', data: '~\n', code: 'SPEC_EMPTY', reason: 'The Specification is null or undefined' },
  {
    input: 'broken YAML',
    data: 'openapi: 3.0.3\ninfo: [\n',
    code: 'SPEC_INVALID_FORMAT',
    reason: 'Invalid format. Input must be in YAML or JSON format.'
  },
  {
    input: 'broken JSON',
    data: '{"openapi": "3.0.3",',
    code: 'SPEC_INVALID_FORMAT',
    reason: 'Invalid format. Input must be in YAML or JSON format.'
  },
  {
    input: 'a spec without an "openapi" field',
    data: 'info:\n  title: Pets\n  version: 1.0.0\npaths: {}\n',
    code: 'SPEC_VERSION_MISSING',
    reason: 'Specification must contain a semantic version number of the OAS specification'
  }
];

describe('validate returns validation error codes', function () {
  unreadableInputs.forEach(({ input, data, code, reason }) => {
    it(`should return ${code} for ${input}`, function () {
      const result = Converter.validate({ type: 'string', data });

      expect(result.result).to.be.false;
      expect(result.reason).to.include(reason);
      expect(result.code).to.equal(code);
      expect(result).to.not.have.property('meta');
    });
  });
});

describe('path validation runs on conversion only', function () {
  [
    { title: 'path keys without a leading slash', spec: buildSpec({ pets: operation }), code: 'SPEC_NO_VALID_PATHS' },
    { title: 'paths that is not an object', spec: buildSpec([operation]), code: 'SPEC_PATHS_INVALID' }
  ].forEach(({ title, spec, code }) => {
    it(`validate should accept a spec with ${title}, so it is still detected as OpenAPI`, function () {
      const result = Converter.validate({ type: 'json', data: spec });

      expect(result.result).to.be.true;
      expect(result).to.not.have.property('code');
    });

    it(`convertV2WithTypes should reject the same spec with ${code}`, function (done) {
      Converter.convertV2WithTypes({ type: 'json', data: spec }, {}, (err) => {
        expect(err.name).to.equal('UserError');
        expect(err.code).to.equal(code);
        done();
      });
    });
  });
});

describe('index wrappers copy validation error codes', function () {
  const invalidSpec = buildSpec({ pets: operation }, { openapi: '3.0.3', info: undefined }),
    noValidPathsSpec = buildSpec({ pets: operation });

  [
    { title: 'convert', invoke: (spec, options, cb) => { return Converter.convert(spec, options, cb); } },
    { title: 'convertV2', invoke: (spec, options, cb) => { return Converter.convertV2(spec, options, cb); } },
    {
      title: 'convertV2WithTypes',
      invoke: (spec, options, cb) => { return Converter.convertV2WithTypes(spec, options, cb); }
    },
    {
      title: 'syncCollection',
      invoke: (spec, options, cb) => { return Converter.syncCollection(spec, options, { item: [] }, null, cb); }
    }
  ].forEach(({ title, invoke }) => {
    it(`${title} should return a UserError with the validation code`, function (done) {
      invoke({ type: 'json', data: invalidSpec }, {}, (err) => {
        expect(err.name).to.equal('UserError');
        expect(err.message).to.equal('Specification must contain an Info Object for the meta-data of the API');
        expect(err.code).to.equal('SPEC_INFO_MISSING');
        done();
      });
    });

    unreadableInputs.forEach(({ input, data, code, reason }) => {
      it(`${title} should return a UserError with ${code} for ${input}`, function (done) {
        invoke({ type: 'string', data }, {}, (err) => {
          expect(err.name).to.equal('UserError');
          expect(err.message).to.include(reason);
          expect(err.code).to.equal(code);
          expect(err).to.not.have.property('meta');
          done();
        });
      });
    });

    it(`${title} should return a UserError without a code for uncoded failures`, function (done) {
      invoke({ type: 'unsupported', data: 'openapi: 3.0.3' }, {}, (err) => {
        expect(err.name).to.equal('UserError');
        expect(err.message).to.equal('Invalid input type (unsupported). type must be one of file/json/string.');
        expect(err).to.not.have.any.keys('code', 'meta');
        done();
      });
    });

    it(`${title} should return the validation meta`, function (done) {
      invoke({ type: 'json', data: noValidPathsSpec }, {}, (err) => {
        expect(err.name).to.equal('UserError');
        expect(err.code).to.equal('SPEC_NO_VALID_PATHS');
        expect(err.meta).to.eql({ example: 'pets' });
        done();
      });
    });
  });
});

describe('generateError with coded errors', function () {
  const invalidDefinition = { openapi: '3.0.3', info: {}, paths: [] };

  [
    { title: 'an invalid definition', definition: invalidDefinition },
    { title: 'a valid definition', definition: { openapi: '3.0.3', info: { title: 't', version: '1' }, paths: {} } }
  ].forEach(({ title, definition }) => {
    it(`should return a coded error of another class as a UserError for ${title}`, function () {
      const error = new Error('Duplicate sanitised parameter name pet_id');

      error.name = 'S2OError';
      error.options = { resolver: () => { return null; } };
      error.code = 'SPEC_DUPLICATE_COMPONENT_NAME';
      error.meta = { kind: 'parameter', name: 'pet_id' };

      const generatedError = generateError(definition, '3.0.x', error);

      expect(generatedError).to.be.instanceOf(UserError);
      expect(generatedError.message).to.equal('Duplicate sanitised parameter name pet_id');
      expect(generatedError.code).to.equal('SPEC_DUPLICATE_COMPONENT_NAME');
      expect(generatedError.meta).to.eql({ kind: 'parameter', name: 'pet_id' });
      // The original error, with the converter's options, is not attached
      expect(generatedError.data).to.eql({});
    });
  });

  it('should return coded UserError and ParseError unchanged', function () {
    const userError = new UserError('Specification must contain at least one valid path'),
      parseError = new ParseError('Empty input schema provided.', 'SPEC_EMPTY');

    userError.code = 'SPEC_NO_VALID_PATHS';

    expect(generateError(invalidDefinition, '3.0.x', userError)).to.equal(userError);
    expect(generateError(invalidDefinition, '3.0.x', parseError)).to.equal(parseError);
  });

  it('should still wrap uncoded errors for an invalid definition', function () {
    const error = new Error('Something failed'),
      generatedError = generateError(invalidDefinition, '3.0.x', error);

    expect(generatedError).to.not.equal(error);
    expect(generatedError.name).to.equal('UserError');
    expect(generatedError.message).to.have.string('Provided API Specification is invalid.');
  });

  it('should still wrap errors with an unrelated code for an invalid definition', function () {
    const error = new Error('Something failed');

    error.code = 'ERR_SOMETHING';

    expect(generateError(invalidDefinition, '3.0.x', error).name).to.equal('UserError');
  });
});
