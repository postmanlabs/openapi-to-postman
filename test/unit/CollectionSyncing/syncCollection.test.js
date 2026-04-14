const { Collection } = require('postman-collection/lib/collection/collection'),
  { expect } = require('chai'),
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
});
