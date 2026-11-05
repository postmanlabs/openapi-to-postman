const { Collection } = require('postman-collection/lib/collection/collection'),
  { expect } = require('chai'),
  Converter = require('../../../dist/index.js'),
  { syncCollection } = require('../../../dist/libV2/SpecificationCollectionSyncing'),
  { requestAdditionTest,
    requestBodyUpdateTest,
    requestQueryParamRemoveAndAddTest
  } = require('./fixtures/collectionSyncing.js'),
  getItemPosition = (item) => {
    let position = '';

    while (item.parent()) {
      position = `${item.parent().name}.${position}`;
      item = item.parent();
    }

    return position;
  };

describe('syncCollection', function () {
  it('should add as a new request if request path is updated', function () {
    const collToBeSynced = new Collection(requestAdditionTest.updatedCollection),
      collectionToBeMerged = new Collection(requestAdditionTest.baseCollection),
      syncedCollection = syncCollection(
        collToBeSynced,
        collectionToBeMerged
      ),
      addedRequest = collToBeSynced.oneDeep(requestAdditionTest.addedRequestId),
      syncedRequest = syncedCollection.oneDeep(requestAdditionTest.addedRequestId);

    expect(addedRequest.toJSON()).to.be.eql(syncedRequest.toJSON());
    expect(addedRequest.parent().items.count()).to.be.equal(2);

    // This request was the POST request that later updated to a GET request
    // This should remain in the collection and the GET request should be added as a new request
    const previousRequestInSyncedCollection = syncedCollection.oneDeep(requestAdditionTest.previousRequestId),
      previousRequestInBaseCollection = collectionToBeMerged.oneDeep(requestAdditionTest.previousRequestId);

    expect(previousRequestInSyncedCollection.toJSON()).to.be.eql(previousRequestInBaseCollection.toJSON());

    const syncedPosition = getItemPosition(syncedRequest),
      addedPosition = getItemPosition(addedRequest);

    // Assert the request is added to the correct folder location
    expect(syncedPosition).to.be.equal(addedPosition);
  });

  it('should update an existing request body correctly', function () {
    const collectionToBeSynced = new Collection(requestBodyUpdateTest.collToBeSynced),
      collectionToBeMerged = new Collection(requestBodyUpdateTest.collectionToBeMerged),
      oldRequest = collectionToBeMerged.oneDeep(requestBodyUpdateTest.updatedRequestIdInBaseCollection).toJSON(),
      syncedCollection = syncCollection(
        collectionToBeSynced,
        collectionToBeMerged
      ),
      updatedRequest = collectionToBeSynced.oneDeep(requestBodyUpdateTest.updatedRequestIdInUpdatedCollection),
      syncedRequest = syncedCollection.oneDeep(requestBodyUpdateTest.updatedRequestIdInBaseCollection);

    // Body is updated in the synced request, but the values used in the original request are preserved
    expect(updatedRequest.toJSON().request.body).to.not.deep.equal(syncedRequest.toJSON().request.body);

    expect(Object.keys(JSON.parse(syncedRequest.request.body.raw.toString()))).to.deep.equal(
      Object.keys(JSON.parse(oldRequest.request.body.raw.toString()))
    );

    expect(JSON.parse(syncedRequest.request.body.raw.toString())).to.deep.equal(
      JSON.parse(oldRequest.request.body.raw.toString())
    );
  });

  it('should remove a query param from request correctly', function () {
    const collectionToBeSynced = new Collection(requestQueryParamRemoveAndAddTest.collectionToBeSynced),
      collectionToBeMerged = new Collection(requestQueryParamRemoveAndAddTest.collectionToBeMerged),
      oldRequest = collectionToBeMerged
        .oneDeep(requestQueryParamRemoveAndAddTest.updatedRequestIdInCollectionToBeMerged)
        .toJSON(),
      syncedCollection = syncCollection(
        collectionToBeSynced,
        collectionToBeMerged
      ),
      syncedRequest = syncedCollection.oneDeep(
        requestQueryParamRemoveAndAddTest.updatedRequestIdInCollectionToBeMerged
      );

    // Assert the query param has been added correctly
    expect(syncedRequest.request.url.query.count()).to.be.equal(2);
    expect(syncedRequest.request.url.query.get('limit2')).to.be.equal('deserunt');

    /*
        The query param limit2 was added as part of the syncing flow
        Hence removing it from the synced request should make it equal to the old request
      */
    syncedRequest.request.url.removeQueryParams('limit2');
    expect(syncedRequest.toJSON()).to.be.eql(oldRequest);
  });

  it('should preserve _postman_previewlanguage as a flat property in synced responses', function () {
    const collectionToBeSynced = new Collection(requestBodyUpdateTest.collToBeSynced),
      collectionToBeMerged = new Collection(requestBodyUpdateTest.collectionToBeMerged),
      syncedCollection = syncCollection(
        collectionToBeSynced,
        collectionToBeMerged
      ),
      syncedRequest = syncedCollection.oneDeep(requestBodyUpdateTest.updatedRequestIdInBaseCollection);

    syncedRequest.responses.each((response) => {
      const responseJson = response.toJSON();

      // _postman_previewlanguage must be a flat property (not nested under '_')
      expect(responseJson._postman_previewlanguage).to.equal('json');
      expect(responseJson).to.not.have.property('_');
    });
  });

  it('should update auth in the collection and request body correctly', function () {
    const base = {
        info: { name: 'Auth Coll', schema: 'https://schema.postman.com/json/collection/v2.1.0/collection.json' },
        auth: {
          type: 'basic',
          basic: [
            { key: 'username', value: '{{userVar}}' },
            { key: 'password', value: '{{passVar}}' }
          ]
        },
        item: [
          {
            name: 'Folder',
            item: [
              {
                id: 'REQ1',
                name: 'Req',
                request: {
                  url: 'https://api.example.com/a',
                  method: 'GET',
                  auth: {
                    type: 'basic',
                    basic: [
                      { key: 'username', value: '{{userVarReq}}' },
                      { key: 'password', value: '{{passVarReq}}' }
                    ]
                  }
                }
              }
            ]
          }
        ]
      },
      latest = {
        info: { name: 'Auth Coll', schema: 'https://schema.postman.com/json/collection/v2.1.0/collection.json' },
        auth: { type: 'bearer' },
        item: [
          {
            name: 'Folder',
            item: [
              {
                id: 'REQ1',
                name: 'Req',
                request: {
                  url: 'https://api.example.com/a',
                  method: 'GET',
                  auth: { type: 'bearer' }
                }
              }
            ]
          }
        ]
      },
      collToBeSynced = new Collection(latest),
      collectionToBeMerged = new Collection(base),
      syncedCollection = syncCollection(
        collToBeSynced,
        collectionToBeMerged
      ),
      syncedReq = syncedCollection.oneDeep('REQ1');

    // Collection-level type switched, request-level type switched
    expect(syncedCollection.auth.type).to.equal('bearer');
    expect(syncedReq.request.auth.type).to.equal('bearer');

    // Credentials preserved at both levels (username/password still there on switch)
    const collParams = syncedCollection.auth.parameters().all(),
      reqParams = syncedReq.request.auth.parameters().all();

    expect(
      collParams.find((p) => {
        return p.key === 'username';
      }).value
    ).to.equal('{{userVar}}');

    expect(
      collParams.find((p) => {
        return p.key === 'password';
      }).value
    ).to.equal('{{passVar}}');

    expect(
      reqParams.find((p) => {
        return p.key === 'username';
      }).value
    ).to.equal('{{userVarReq}}');

    expect(
      reqParams.find((p) => {
        return p.key === 'password';
      }).value
    ).to.equal('{{passVarReq}}');
  });

  it('should add, update, and drop baseUrl* collection variables on sync', function () {
    const latest = new Collection({
        item: [],
        variable: [
          { key: 'baseUrl', value: 'https://api.example.com' },
          { key: 'baseUrl1', value: 'https://staging.example.com' }
        ]
      }),
      current = new Collection({
        item: [],
        variable: [
          { key: 'baseUrl', value: 'https://old.example.com' },
          { key: 'baseUrl2', value: 'https://gone.example.com' },
          { key: 'keepMe', value: 'user-value' }
        ]
      }),
      synced = syncCollection(latest, current);

    expect(
      synced.variables.all().map((variable) => {
        return { key: variable.key, value: variable.value };
      })
    ).to.deep.equal([
      { key: 'baseUrl', value: 'https://api.example.com' },
      { key: 'keepMe', value: 'user-value' },
      { key: 'baseUrl1', value: 'https://staging.example.com' }
    ]);
  });

  it('should add missing server variables referenced by baseUrl* without overwriting existing ones', function () {
    const latest = new Collection({
        item: [],
        variable: [
          { key: 'baseUrl', value: 'https://{{region}}.example.com' },
          { key: 'region', value: 'us' },
          { key: 'baseUrl1', value: 'https://path.example.com/{{version}}' },
          { key: 'version', value: 'v2' }
        ]
      }),
      current = new Collection({
        item: [],
        variable: [
          { key: 'baseUrl', value: 'https://{{region}}.example.com' },
          { key: 'region', value: 'eu' }
        ]
      }),
      synced = syncCollection(latest, current);

    expect(
      synced.variables.all().map((variable) => {
        return { key: variable.key, value: variable.value };
      })
    ).to.deep.equal([
      { key: 'baseUrl', value: 'https://{{region}}.example.com' },
      { key: 'region', value: 'eu' },
      { key: 'baseUrl1', value: 'https://path.example.com/{{version}}' },
      { key: 'version', value: 'v2' }
    ]);
  });

  it('should keep a removed baseUrl* variable while an orphaned request still uses it', function () {
    const latest = new Collection({
        item: [{ name: 'pets', request: { method: 'GET', url: '{{baseUrl}}/pets' } }],
        variable: [{ key: 'baseUrl', value: 'https://api.example.com' }]
      }),
      current = new Collection({
        item: [
          { name: 'pets', request: { method: 'GET', url: '{{baseUrl}}/pets' } },
          { name: 'legacy', request: { method: 'GET', url: '{{baseUrl1}}/legacy' } }
        ],
        variable: [
          { key: 'baseUrl', value: 'https://api.example.com' },
          { key: 'baseUrl1', value: 'https://legacy.example.com' },
          { key: 'baseUrl2', value: 'https://unused.example.com' }
        ]
      }),
      synced = syncCollection(latest, current);

    expect(synced.variables.all().map((variable) => { return variable.key; })).to.deep.equal(['baseUrl', 'baseUrl1']);
  });

  it('should move orphaned requests and preserved examples along when baseUrl* keys shift', function () {
    const response = (url) => {
        return {
          name: 'ok',
          code: 200,
          originalRequest: { method: 'GET', url },
          body: ''
        };
      },
      latest = new Collection({
        item: [{
          name: 'pets',
          request: { method: 'GET', url: '{{baseUrl2}}/pets' },
          response: [response('{{baseUrl2}}/pets'), response('{{baseUrl2}}/pets')]
        }],
        variable: [
          { key: 'baseUrl', value: 'https://api.example.com' },
          { key: 'baseUrl1', value: 'https://api.eu.example.com' },
          { key: 'baseUrl2', value: 'https://pets.example.com' }
        ]
      }),
      current = new Collection({
        item: [
          {
            name: 'pets',
            request: { method: 'GET', url: '{{baseUrl1}}/pets' },
            response: [response('{{baseUrl1}}/pets'), response('{{baseUrl1}}/pets?saved=1')]
          },
          { name: 'legacy', request: { method: 'GET', url: '{{baseUrl2}}/legacy' } }
        ],
        variable: [
          { key: 'baseUrl', value: 'https://api.example.com' },
          { key: 'baseUrl1', value: 'https://pets.example.com' },
          { key: 'baseUrl2', value: 'https://legacy.example.com' }
        ]
      }),
      synced = syncCollection(latest, current, { syncExamples: true }),
      requests = synced.items.all();

    expect(requests.map((item) => { return item.request.url.toString(); }))
      .to.deep.equal(['{{baseUrl2}}/pets', '{{baseUrl3}}/legacy']);
    expect(requests[0].responses.all().map((item) => { return item.originalRequest.url.toString(); }))
      .to.deep.equal(['{{baseUrl2}}/pets', '{{baseUrl2}}/pets?saved=1']);
    expect(
      synced.variables.all().map((variable) => {
        return { key: variable.key, value: variable.value };
      })
    ).to.deep.equal([
      { key: 'baseUrl', value: 'https://api.example.com' },
      { key: 'baseUrl2', value: 'https://pets.example.com' },
      { key: 'baseUrl3', value: 'https://legacy.example.com' },
      { key: 'baseUrl1', value: 'https://api.eu.example.com' }
    ]);
  });

  it('should keep baseUrl* variables when the latest collection has none', function () {
    const latest = new Collection({ item: [], variable: [] }),
      current = new Collection({
        item: [],
        variable: [
          { key: 'baseUrl', value: 'https://api.example.com' },
          { key: 'baseUrl1', value: 'https://staging.example.com' }
        ]
      }),
      synced = syncCollection(latest, current);

    expect(synced.variables.all().map((variable) => { return variable.key; }))
      .to.deep.equal(['baseUrl', 'baseUrl1']);
  });
});

describe('syncCollection (index) - specification validation error codes', function () {
  const operation = { get: { responses: { 200: { description: 'OK' } } } },
    buildSpec = (versionFields, overrides = {}) => {
      return Object.assign({
        info: { title: 'Sample API', version: '1.0.0' },
        paths: { '/pets': operation }
      }, versionFields, overrides);
    },
    sync = (spec, options = {}) => {
      return new Promise((resolve) => {
        Converter.syncCollection({ type: 'json', data: spec }, options, { item: [] }, null, (err, result) => {
          resolve({ err, result });
        });
      });
    };

  [
    { label: '2.0', fields: { swagger: '2.0' } },
    { label: '3.0', fields: { openapi: '3.0.3' } },
    { label: '3.1', fields: { openapi: '3.1.0' } },
    { label: '3.2', fields: { openapi: '3.2.0' } }
  ].forEach(({ label, fields }) => {
    describe(`OpenAPI ${label}`, function () {
      [
        { code: 'SPEC_INFO_MISSING', overrides: { info: undefined } },
        { code: 'SPEC_INFO_TITLE_MISSING', overrides: { info: { version: '1.0.0' } } },
        { code: 'SPEC_INFO_VERSION_MISSING', overrides: { info: { title: 'Sample API' } } },
        { code: 'SPEC_PATHS_MISSING', overrides: { paths: undefined } }
      ].forEach(({ code, overrides }) => {
        it(`should return the same coded UserError as convertV2WithTypes for ${code}`, async function () {
          const spec = buildSpec(fields, overrides),
            { err } = await sync(spec),
            convertErr = await new Promise((resolve) => {
              Converter.convertV2WithTypes({ type: 'json', data: spec }, {}, resolve);
            });

          expect(err.name).to.equal('UserError');
          expect(err.code).to.equal(code);
          expect(err.message).to.equal(convertErr.message);
          expect(err.code).to.equal(convertErr.code);
        });
      });

      [
        { paths: { 'pets?id=1': operation }, example: 'pets?id=1' },
        { paths: { 'https://example.com/pets': operation }, example: 'https://example.com/pets' },
        { paths: { '': operation }, example: '' }
      ].forEach(({ paths, example }) => {
        it(`should return SPEC_NO_VALID_PATHS for ${JSON.stringify(Object.keys(paths))}`, async function () {
          const { err } = await sync(buildSpec(fields, { paths }));

          expect(err.name).to.equal('UserError');
          expect(err.message).to.equal('Specification must contain at least one valid path');
          expect(err.code).to.equal('SPEC_NO_VALID_PATHS');
          expect(err.meta).to.eql({ example });
        });
      });

      it('should return SPEC_PATHS_INVALID when paths is not an object', async function () {
        const { err } = await sync(buildSpec(fields, { paths: 'pets' }));

        expect(err.name).to.equal('UserError');
        expect(err.message).to.equal('Specification "paths" must be an object');
        expect(err.code).to.equal('SPEC_PATHS_INVALID');
      });

      [
        { title: 'a partially valid spec', paths: { 'pets?id=1': operation, '/pets': operation } },
        { title: 'a spec with empty paths', paths: {} },
        { title: 'a spec with only x- path keys', paths: { 'x-internal': {} } },
        { title: 'a spec with a well-formed path without methods', paths: { '/pets': {} } },
        { title: 'a spec with an unresolved path item reference', paths: { '/pets': { $ref: './pets.yaml' } } }
      ].forEach(({ title, paths }) => {
        it(`should sync ${title}`, async function () {
          const { err, result } = await sync(buildSpec(fields, { paths }));

          expect(err).to.be.null;
          expect(result.result).to.be.true;
        });
      });

      it('should key the type data of paths with a query string or fragment by the request path', async function () {
        const { err, result } = await sync(buildSpec(fields, {
          paths: { '/pets?limit=1': operation, '/pets/{id}?x=1': operation, '/owners#top': operation }
        }));

        expect(err).to.be.null;
        expect(Object.keys(result.extractedTypes))
          .to.have.members(['get/pets', 'get/pets/{id}', 'get/owners']);
      });
    });
  });

  it('should return SPEC_SWAGGER_VERSION_INVALID for a numeric "swagger" field', async function () {
    const { err } = await sync(buildSpec({ swagger: 2 }));

    expect(err.name).to.equal('UserError');
    expect(err.code).to.equal('SPEC_SWAGGER_VERSION_INVALID');
  });

  it('should return SPEC_DUPLICATE_COMPONENT_NAME through the Swagger conversion', async function () {
    const { err } = await sync(buildSpec({ swagger: '2.0' }, {
      responses: { 'not found': { description: 'Not found' }, 'not_found': { description: 'Not found' } }
    }));

    expect(err.name).to.equal('S2OError');
    expect(err.message).to.equal('Duplicate sanitised response name not_found');
    expect(err.code).to.equal('SPEC_DUPLICATE_COMPONENT_NAME');
    expect(err.meta).to.eql({ kind: 'response', name: 'not_found' });
  });
});
