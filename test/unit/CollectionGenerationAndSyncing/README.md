# Test and Fixture Structure

In this folder, the tests and fixtures are structured in a specific way to ensure organization and maintainability. Here's an overview of the structure:

## Tests
This folder contains tests for the **Collection generation and Syncing flow**

## Fixtures

Fixtures are used to provide sample data for the tests. They are located in the `fixtures` subfolder within this directory. The fixtures should be organized based on the specific functionality they are related to.

### Fixture index
The `index.js` file is used to export all fixtures and organise them based on the type of test they are used for.

### Individual fixture files

Each fixture file should have a descriptive name that reflects the purpose of the fixture. For example, if you have a fixture for testing the addition of queryparam, the fixture file could be named `addQueryParams.js`.

Each fixture file contains an object with 5 top level attributes:
1. `name`: This is the name that shows up when the test is running in the pipeline or terminal
2. `generationOptions`: This contains the options that needs to be used for converting and syncing the spec
3. `shouldAssertGenerationAndSyncing`: This option dictates whether the test should assert that the generated collection from the final state of the specification is same as the synced collection using the final state of the specification. Or just assert the synced collection matches the final state collection.
4. `initialState`: This contains two attributes
    1. `spec`: This contains the state of the specification before doing any modification for the test case. E.g For the `addQueryParams` test, this will contain the state of the specification before the query param is added to it.
    2. `collection`: This contains the state of the collection that is generated using the spec mentioned above. 

        **Note**: This generation can be done using the Postman app and then the collection can be exported to be used here.

5. `finalState`: This contains two attributes
    1. `spec`: This contains the state of the specification before doing any modification for the test case. E.g For the `addQueryParams` test, this will contain the state of the specification after the query param is added to it.
    2. `collection`: This contains the state of the collection that we get after syncing the `initialState.collection` with the `finalState.spec`.
        
        **Note**: This syncing can be done using the Postman app and then the collection can be exported to be used here.

