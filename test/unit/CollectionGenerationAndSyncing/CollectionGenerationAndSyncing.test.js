const { promisify } = require('util'),
  { expect } = require('chai'),
  Converter = require('../../../dist/index.js'),
  transformer = require('postman-collection-transformer'),
  testCases = require('./fixtures/index.js');


const getSpecificationVersion = (specificationType) => {
  const specVersionMap = {
    'OPENAPI:3.0': '3.0',
    'OPENAPI:3.1': '3.1',
    'OPENAPI:2.0': '2.0'
  };

  return specVersionMap[specificationType] || '3.0';
};

/**
 * Omit the following fields from collection items that are not required for comparison
 *   - _postman_id
 *   - name (since we don't sync collection name)
 *   - id
 *   - protocolProfileBehavior (this is added by the SDK and not part of the exported data)
 * @param {object} collection - The collection object to modify
 * @returns {void}
 */
const omitFieldsFromCollectionItems = (collection) => {
    if (collection.info) {
      delete collection.info._postman_id;
      delete collection.info.name;
    }

    /**
     * We need to add default type for all the collection variables, since
     * export flow removes `any` key from the json. But the syncing and generation flow
     * expects the `type` key to be present in the collection variables. Because the sdk adds
     * the `any` key by default.
     */
    if (collection.variable) {
      collection.variable.forEach((variable) => {
        if (!variable.type) {
          variable.type = 'any';
        }
      });
    }

    collection.item.forEach((item) => {
      item.id && delete item.id;
      item.protocolProfileBehavior && delete item.protocolProfileBehavior;

      if (item.item) {
        omitFieldsFromCollectionItems(item);
      }

      if (item.response) {
        item.response.forEach((response) => {
          response.id && delete response.id;
        });
      }
    });
  },

  /**
   * Sanitise the collection by converting it to v1 and back to v2.1
   * This helps in normalizing the collection structure for comparison.
   * @param {object} collection - The collection object to sanitize
   * @returns {Promise<object>} - The sanitized collection
   */
  sanitiseCollection = async (collection) => {
    const initialTransformation = await promisify(transformer.convert)(collection, {
        inputVersion: '2.1.0',
        outputVersion: '1.0.0'
      }),
      transformedCollection = await promisify(transformer.convert)(initialTransformation, {
        inputVersion: '1.0.0',
        outputVersion: '2.1.0'
      });

    omitFieldsFromCollectionItems(transformedCollection);

    return transformedCollection;
  },

  /**
   * Asserts that the collection generation works as expected
   * @param {object} generationOptions - The generation options
   * @param {object} initialState - The initial state with spec and collection
   * @param {string} specificationVersion - The specification version (e.g., '3.0', '3.1')
   * @returns {Promise<void>} Promise that resolves when assertion is complete
   */
  assertGeneration = async (generationOptions, initialState, specificationVersion) => {
    const bundledSpec = await Converter.bundle({
        type: 'multiFile',
        specificationVersion: specificationVersion,
        data: [{ path: 'index.json', content: JSON.stringify(initialState.spec) }]
      }),
      conversionResult = await promisify(Converter.convertV2WithTypes)(
        { type: 'string', data: bundledSpec.output.data[0].bundledContent },
        generationOptions
      ),
      collectionJson = JSON.parse(JSON.stringify(conversionResult.output[0].data)),
      sanitisedGeneratedCollectionJson = await sanitiseCollection(collectionJson),
      sanitisedFixtureCollectionInitialState = await sanitiseCollection(initialState.collection);

    // Assert the generated collection state with the initial state of the collection in fixture
    expect(sanitisedGeneratedCollectionJson).to.deep.equal(sanitisedFixtureCollectionInitialState);
  },

  /**
   * Asserts that the collection syncing works as expected
   * @param {object} generationOptions - The generation options
   * @param {object} syncOptions - The sync options
   * @param {object} initialState - The initial state with spec and collection
   * @param {object} finalState - The final state with spec and collection
   * @param {string} specificationVersion - The specification version (e.g., '3.0', '3.1')
   * @returns {Promise<object>} - The synced collection state
   */
  assertSyncing = async (generationOptions, syncOptions, initialState, finalState, specificationVersion) => {
    const bundledSpec = await Converter.bundle({
        type: 'multiFile',
        specificationVersion: specificationVersion,
        data: [{ path: 'index.json', content: JSON.stringify(finalState.spec) }]
      }),
      sanitisedFixtureCollectionFinalState = await sanitiseCollection(finalState.collection);

    /**
     * Sync the collection with the final state of the spec in fixture
     * and assert that the synced state is same as the final state of the collection in fixture
     */
    const syncResult = await promisify(Converter.syncCollection)(
        { type: 'string', data: bundledSpec.output.data[0].bundledContent },
        generationOptions,
        initialState.collection,
        syncOptions
      ),
      collectionJson = JSON.parse(JSON.stringify(syncResult.output[0].data)),
      syncedCollectionState = await sanitiseCollection(collectionJson);

    expect(syncedCollectionState).to.deep.equal(sanitisedFixtureCollectionFinalState);

    return syncedCollectionState;
  },

  /**
   * Asserts both generation and syncing work correctly
   * @param {object} generationOptions - The generation options
   * @param {object} syncOptions - The sync options
   * @param {object} initialState - The initial state with spec and collection
   * @param {object} finalState - The final state with spec and collection
   * @param {string} specificationVersion - The specification version (e.g., '3.0', '3.1')
   * @returns {Promise<void>} Promise that resolves when assertion is complete
   */
  assertGenerationAndSyncing = async (
    generationOptions,
    syncOptions,
    initialState,
    finalState,
    specificationVersion
  ) => {
    await assertGeneration(generationOptions, initialState, specificationVersion);

    const sanitisedSyncedCollectionState = await assertSyncing(
      generationOptions,
      syncOptions,
      initialState,
      finalState,
      specificationVersion
    );

    /**
     * Generate a collection from the final state of the spec in fixture and assert
     * that the generated state is same as the synced state
     */
    const finalBundledSpec = await Converter.bundle({
        type: 'multiFile',
        specificationVersion: specificationVersion,
        data: [{ path: 'index.json', content: JSON.stringify(finalState.spec) }]
      }),
      finalConversionResult = await promisify(Converter.convertV2WithTypes)(
        { type: 'string', data: finalBundledSpec.output.data[0].bundledContent },
        generationOptions
      ),
      finalCollection = finalConversionResult.output[0].data,
      sanitisedFinalCollection = await sanitiseCollection(finalCollection);

    expect(sanitisedSyncedCollectionState).to.deep.equal(sanitisedFinalCollection);
  },

  /**
   * Asserts generation with types works correctly
   * @param {object} generationOptions - The generation options
   * @param {object} fixture - The fixture with spec and collection
   * @param {string} specificationVersion - The specification version (e.g., '3.0', '3.1')
   * @returns {Promise<void>} Promise that resolves when assertion is complete
   */
  assertGenerationWithTypes = async (generationOptions, fixture, specificationVersion) => {
    const bundledSpec = await Converter.bundle({
        type: 'multiFile',
        specificationVersion: specificationVersion,
        data: [{ path: 'index.json', content: JSON.stringify(fixture.spec) }]
      }),
      conversionResult = await promisify(Converter.convertV2WithTypes)(
        { type: 'string', data: bundledSpec.output.data[0].bundledContent },
        generationOptions
      ),
      collection = conversionResult.output[0].data,
      collectionTypeData = conversionResult.extractedTypes,
      finalCollection = await sanitiseCollection(collection),
      sanitisedFixtureCollection = await sanitiseCollection(fixture.collection);

    expect(JSON.parse(JSON.stringify(finalCollection))).to.deep.equal(
      JSON.parse(JSON.stringify(sanitisedFixtureCollection))
    );

    expect(JSON.parse(JSON.stringify(collectionTypeData))).to.deep.equal(
      JSON.parse(JSON.stringify(fixture.collectionTypeData))
    );
  },

  /**
   * Asserts the generation and syncing of multi-file OpenAPI specifications
   * @param {object} generationOptions - The generation options
   * @param {object} initialState - The initial state with multi-file spec and collection
   * @param {object} finalState - The final state with multi-file spec and collection
   * @param {string} specificationVersion - The specification version (e.g., '3.0', '3.1')
   * @returns {Promise<void>} Promise that resolves when assertion is complete
   */
  assertMultiFileGenerationAndSyncing = async (
    generationOptions,
    initialState,
    finalState,
    specificationVersion
  ) => {
    // Bundle the initial multi-file spec
    const bundledInitialSpec = await Converter.bundle({
        type: 'multiFile',
        specificationVersion: specificationVersion,
        data: initialState.spec.files.map((file) => {
          return {
            path: file.path,
            content: JSON.stringify(file.content)
          };
        })
      }),
      initialConversionResult = await promisify(Converter.convertV2WithTypes)(
        { type: 'string', data: bundledInitialSpec.output.data[0].bundledContent },
        generationOptions
      ),
      collectionJson = JSON.parse(JSON.stringify(initialConversionResult.output[0].data)),
      sanitisedGeneratedCollectionJson = await sanitiseCollection(collectionJson),
      sanitisedFixtureCollectionInitialState = await sanitiseCollection(initialState.collection);

    expect(sanitisedGeneratedCollectionJson).to.deep.equal(sanitisedFixtureCollectionInitialState);

    // Bundle the final multi-file spec
    const bundledFinalSpec = await Converter.bundle({
        type: 'multiFile',
        specificationVersion: specificationVersion,
        data: finalState.spec.files.map((file) => {
          return {
            path: file.path,
            content: JSON.stringify(file.content)
          };
        })
      }),
      syncResult = await promisify(Converter.syncCollection)(
        { type: 'json', data: bundledFinalSpec.output.data[0].bundledContent },
        generationOptions,
        sanitisedFixtureCollectionInitialState,
        {}
      ),
      syncedCollectionJson = JSON.parse(JSON.stringify(syncResult.output[0].data)),
      syncedCollectionState = await sanitiseCollection(syncedCollectionJson),
      sanitisedFixtureCollectionFinalState = await sanitiseCollection(finalState.collection);

    expect(syncedCollectionState).to.deep.equal(sanitisedFixtureCollectionFinalState);
  };

describe('Collection Generation and Syncing Tests', function () {
  // Iterate over each specification type (OpenAPI2, OpenAPI3, OpenAPI31)
  Object.entries(testCases).forEach(([specType, specTestCases]) => {
    describe(`${specType} Tests`, function () {
      describe('Single File Tests', function () {
        Object.entries(specTestCases).forEach(([testName, testCase]) => {
          // Skip multi-file specs as they're handled separately
          if (testName === 'multiFileSpecs' || testName === 'generateCollectionWithTypes') {
            return;
          }

          const specificationVersion = getSpecificationVersion(testCase.specificationType);

          if (testCase.shouldAssertGenerationAndSyncing) {
            it(`[${testCase.specificationType}] ${testCase.name}`, async function () {
              await assertGenerationAndSyncing(
                testCase.generationOptions,
                testCase.syncOptions || {},
                testCase.initialState,
                testCase.finalState,
                specificationVersion
              );
            });
          }
          else if (!testCase.shouldGenerateCollection) {
            it(`[${testCase.specificationType}] ${testCase.name}`, async function () {
              await assertSyncing(
                testCase.generationOptions,
                testCase.syncOptions || {},
                testCase.initialState,
                testCase.finalState,
                specificationVersion
              );
            });
          }
        });
      });

      describe('Multi-file Tests', function () {
        if (specTestCases && specTestCases.multiFileSpecs) {
          Object.entries(specTestCases.multiFileSpecs).forEach(([testName, testCase]) => {
            it(`[${testCase.specificationType}] ${testName}: ${testCase.name}`, async function () {
              const specificationVersion = getSpecificationVersion(testCase.specificationType);
              await assertMultiFileGenerationAndSyncing(
                testCase.generationOptions,
                testCase.initialState,
                testCase.finalState,
                specificationVersion
              );
            });
          });
        }
      });

      describe('Collection generation with types', function () {
        if (specTestCases && specTestCases.generateCollectionWithTypes) {
          const testCase = specTestCases.generateCollectionWithTypes;

          it(`[${testCase.specificationType}] ${testCase.name}`, async function () {
            const { fixture, generationOptions, specificationType } = testCase;

            const specificationVersion = getSpecificationVersion(specificationType);
            await assertGenerationWithTypes(generationOptions, fixture, specificationVersion);
          });
        }
      });
    });
  });
});
