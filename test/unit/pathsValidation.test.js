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
  convertSpec = (spec, options = {}) => {
    return new Promise((resolve) => {
      Converter.convertV2WithTypes({ type: 'json', data: spec }, options, (err, result) => {
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
    {
      reason: 'QUERY_OR_FRAGMENT',
      paths: { '/pets?limit=1': operation, '/pets#top': operation },
      example: '/pets?limit=1'
    },
    { reason: 'QUERY_OR_FRAGMENT', paths: { 'pets?limit=1': operation }, example: 'pets?limit=1' },
    { reason: 'MISSING_LEADING_SLASH', paths: { pets: operation, 'pets/{id}': operation }, example: 'pets' },
    {
      reason: 'UNRESOLVED_REF',
      paths: { '/pets': { $ref: './pets.yaml' }, '/owners': { $ref: '#/components/pathItems/Missing' } },
      example: './pets.yaml'
    },
    { reason: 'UNRESOLVED_REF', paths: { '/pets': { $ref: 'https://example.com/pets.yaml' } },
      example: 'https://example.com/pets.yaml' },
    { reason: 'MIXED', paths: { pets: operation, '/owners?id=1': operation, '/toys': { $ref: './toys.yaml' } },
      example: 'pets' }
  ].forEach(({ reason, paths, example }) => {
    it(`should return SPEC_NO_VALID_PATHS with reason ${reason} for ${Object.keys(paths).join(', ')}`, function () {
      expect(validatePaths(buildSpec(paths))).to.eql({
        result: false,
        reason: 'Specification must contain at least one valid path',
        code: 'SPEC_NO_VALID_PATHS',
        meta: { reason, example }
      });
    });
  });

  it('should truncate the example to 100 characters', function () {
    const longKey = 'p'.repeat(150),
      validationResult = validatePaths(buildSpec({ [longKey]: operation }));

    expect(validationResult.meta).to.eql({ reason: 'MISSING_LEADING_SLASH', example: 'p'.repeat(100) });
  });

  it('should ignore x- keys when looking for invalid paths', function () {
    const validationResult = validatePaths(buildSpec({ 'x-internal': {}, pets: operation }));

    expect(validationResult.code).to.equal('SPEC_NO_VALID_PATHS');
    expect(validationResult.meta).to.eql({ reason: 'MISSING_LEADING_SLASH', example: 'pets' });
  });

  [
    { title: 'paths is empty', paths: {} },
    { title: 'paths only has x- keys', paths: { 'x-internal': { foo: 'bar' } } },
    { title: 'at least one path is valid', paths: { pets: operation, '/owners': operation } },
    { title: 'a well-formed path has no methods', paths: { pets: operation, '/owners': {} } },
    { title: 'a well-formed path item is null', paths: { pets: operation, '/owners': null } },
    { title: 'a path item references an existing local pointer',
      paths: { pets: operation, '/owners': { $ref: '#/components/pathItems/Owners' } } },
    { title: 'a path item references an escaped local pointer',
      paths: { pets: operation, '/owners': { $ref: '#/x-paths/~1owners~0all' } } }
  ].forEach(({ title, paths }) => {
    it(`should pass when ${title}`, function () {
      const spec = buildSpec(paths);

      spec.components = { pathItems: { Owners: operation } };
      spec['x-paths'] = { '/owners~all': operation };

      expect(validatePaths(spec)).to.eql({ result: true });
    });
  });

  it('should treat a local pointer with malformed URI encoding as unresolved', function () {
    expect(validatePaths(buildSpec({ '/pets': { $ref: '#/components/%E0%A4%A' } })).meta)
      .to.eql({ reason: 'UNRESOLVED_REF', example: '#/components/%E0%A4%A' });
  });
});

describe('strictPathsValidation option', function () {
  [
    { label: '2.0', versionFields: { swagger: '2.0' } },
    { label: '3.0', versionFields: { openapi: '3.0.3' } },
    { label: '3.1', versionFields: { openapi: '3.1.0' } },
    { label: '3.2', versionFields: { openapi: '3.2.0' } }
  ].forEach(({ label, versionFields }) => {
    describe(`OpenAPI ${label}`, function () {
      it('should return SPEC_NO_VALID_PATHS when enabled and no path is valid', async function () {
        const { err } = await convertSpec(buildSpec({ pets: operation }, versionFields),
          { strictPathsValidation: true });

        expect(err.name).to.equal('UserError');
        expect(err.message).to.equal('Specification must contain at least one valid path');
        expect(err.code).to.equal('SPEC_NO_VALID_PATHS');
        expect(err.meta).to.eql({ reason: 'MISSING_LEADING_SLASH', example: 'pets' });
      });

      it('should return SPEC_PATHS_INVALID when enabled and paths is an array', async function () {
        const { err } = await convertSpec(buildSpec(['/pets'], versionFields), { strictPathsValidation: true });

        expect(err.name).to.equal('UserError');
        expect(err.message).to.equal('Specification "paths" must be an object');
        expect(err.code).to.equal('SPEC_PATHS_INVALID');
        expect(err).to.not.have.property('meta');
      });

      it('should convert the same spec as before when disabled', async function () {
        const spec = buildSpec({ pets: operation }, versionFields),
          withoutOption = await convertSpec(spec),
          withOptionDisabled = await convertSpec(spec, { strictPathsValidation: false });

        expect(withoutOption.err).to.be.null;
        expect(withoutOption.result.result).to.be.true;
        expect(withOptionDisabled.err).to.be.null;
        expect(withOptionDisabled.result.output[0].data.item.length)
          .to.equal(withoutOption.result.output[0].data.item.length);
      });

      it('should convert a partially valid spec when enabled', async function () {
        const { err, result } = await convertSpec(buildSpec({ pets: operation, '/owners': operation }, versionFields),
          { strictPathsValidation: true });

        expect(err).to.be.null;
        expect(result.result).to.be.true;
      });
    });
  });

  it('should convert a spec with empty paths when enabled', async function () {
    const { err, result } = await convertSpec(buildSpec({}), { strictPathsValidation: true });

    expect(err).to.be.null;
    expect(result.result).to.be.true;
  });

  it('should be ignored by the v1 convert API', function (done) {
    Converter.convert({ type: 'json', data: buildSpec({ pets: operation }) }, { strictPathsValidation: true },
      (err, result) => {
        expect(err).to.be.null;
        expect(result.result).to.be.true;
        done();
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

    it(`${title} should return a UserError without a code for uncoded failures`, function (done) {
      invoke({ type: 'string', data: '' }, {}, (err) => {
        expect(err.name).to.equal('UserError');
        expect(err.message).to.equal('Empty input schema provided.');
        expect(err).to.not.have.any.keys('code', 'meta');
        done();
      });
    });

    if (title !== 'convert') {
      it(`${title} should return the validation meta`, function (done) {
        invoke({ type: 'json', data: noValidPathsSpec }, { strictPathsValidation: true }, (err) => {
          expect(err.name).to.equal('UserError');
          expect(err.code).to.equal('SPEC_NO_VALID_PATHS');
          expect(err.meta).to.eql({ reason: 'MISSING_LEADING_SLASH', example: 'pets' });
          done();
        });
      });
    }
  });
});

describe('generateError with coded errors', function () {
  const invalidDefinition = { openapi: '3.0.3', info: {}, paths: [] };

  it('should return a coded error unchanged instead of wrapping it', function () {
    const error = new Error('Duplicate sanitised parameter name pet_id');

    error.code = 'SPEC_DUPLICATE_COMPONENT_NAME';
    error.meta = { kind: 'parameter', name: 'pet_id' };

    expect(generateError(invalidDefinition, '3.0.x', error)).to.equal(error);
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
