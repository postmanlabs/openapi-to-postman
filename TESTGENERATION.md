## Postman test suite generation options

This CLI option will provide the option to add basic Postman test and/or add manual defined Postman tests.
The goal is to allow easy usage of OpenApi based generated Postman collections with integrated tests, ready to be used
by the Newman test runner.

To generate the tests, define a JSON file like the example (postman-testsuite.json) below and run the CLI with the --generate option.

```terminal
$ openapi2postmanv2 -s spec.yaml -o collection.json -p -g postman-testsuite.json
```

Current postman-testsuite JSON properties

```JSON
{
  "version": 1.0,
  "generateTests": {
    "responseChecks": {
      "StatusSuccess": {
        "enabled": true
      },
      "responseTime": {
        "enabled": true,
        "maxMs": 300
      },
      "contentType": {
        "enabled": true
      },
      "jsonBody": {
        "enabled": true
      },
      "schemaValidation": {
        "enabled": true
      }
    }
  },
  "extendTests": [
    {
      "openApiOperationId": "get-lists",
      "tests": [
        "pm.test('200 ok', function(){pm.response.to.have.status(200);});",
        "pm.test('check userId after create', function(){Number.isInteger(responseBody);});"
      ]
    }
  ],
  "overwriteRequests": [
    {
      "openApiOperationId": "post-accounts",
      "overwriteRequestBody": [
        {
          "key": "name",
          "value": "--{{$randomInt}}",
          "overwrite": false
        },
        {
          "key": "clientId",
          "value": "{{$guid}}",
          "overwrite": true
        }
      ]
    }
  ]
}

```

The JSON test suite format consists out of 3 parts:
- **version** : which refers the JSON test suite version
(not relevant but might handy for future backward compatibility options).
- **generateTests** : which refers the default available generated postman tests.
The default tests are grouped per type (response, request)
  - **responseChecks** : All response basic checks. (For now we have only included response checks).
  - **limitOperations**: refers to a list of operation IDs for which tests will be generated. (Default not set, so test will be generated for **all** operations).
- **extendTests**:  which refers the custom additions of manual created postman tests. (see [Postman test suite extendTests](#postman-test-suite-extendtests))
- **overwriteRequests**:  which refers the custom additions/modifications of the OpenAPI request body. (see [Postman test suite overwriteRequests](#postman-test-suite-overwriterequests))

See "postman-testsuite-advanced.json" file for an advanced example of the setting options.

## Postman test suite properties

Version 1.0

| name                                | id                  | type    | default/0 | availableOptions/0 | availableOptions/1 | description                                                                                                                                                  | external | usage/0         |
|-------------------------------------|---------------------|---------|-----------|--------------------|--------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|-----------------|
| Response status success (2xx) check | StatusSuccess       | boolean | false     | enabled            |                    | Adds the check if the response of the postman request return a 2xx                                                                                           | true     | TEST GENERATION |
| Response time check                 | responseTime        | boolean | false     | enabled            | maxMs 300          | Adds the check if the response of the postman request is within a number of ms.                                                                              | true     | TEST GENERATION |
| Response content-type check         | contentType         | boolean | false     | enabled            |                    | Adds the check if the postman response header is matching the expected content-type defined in the OpenApi spec.                                             | true     | TEST GENERATION |
| Response JSON body format check     | jsonBody            | boolean | false     | enabled            |                    | Adds the check if the postman response body is matching the expected content-type defined in the OpenApi spec.                                               | true     | TEST GENERATION |
| Response Schema validation check    | schemaValidation    | boolean | false     | enabled            |                    | Adds the check if the postman response body is matching the JSON schema defined in the OpenApi spec. The JSON schema is inserted inline in the postman test. | true     | TEST GENERATION |
| Response Header presence check      | headersPresent      | boolean | false     | enabled            |                    | Adds the check if the postman response header has the header names present, like defined in the OpenApi spec.                                                | true     | TEST GENERATION |

## Postman test suite extendTests

The manual tests are added during generation. The tests are mapped based on the OpenApi operationId.
Anything added in `tests` array, will be added to the postman test scripts.
- **openApiOperationId (String)** : Reference to the OpenApi operationId for which the tests will be extended
- **tests (Array)** : Array of additional postman test scripts.
- **responseChecks (array)** : Extends the generateTests `responseChecks` (see [Postman test suite properties](#postman-test-suite-properties)) with specifics for the openApiOperationId.
- **overwrite (Boolean true/false)** : Resets all generateTests and overwrites them with the defined tests from the `tests` array.
  Default: false

## Postman test suite overwriteRequests

To facilitate automation, you might want to modify property values with "randomized" or specific values.
The overwrites are mapped based on the OpenApi operationId.
Anything added in `overwriteRequestBody` array, will be used to modify to the postman request body.

Properties explained:
- **openApiOperationId (String)** : Reference to the OpenApi operationId for which the Postman Request Body will be extended
- **overwriteRequestQueryParams (Array)** : Array of key/value pairs to overwrite in the Postman Request Query params.
  - **key (string)** : The key that will be targeted in the request Query Param to overwrite/extend.
  - **value (string)** : The value that will be used to overwrite/extend the value in the request Query Param OR use the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request body value OR attach the value to the original request Path variable value.
- **overwriteRequestPathVariables (Array)** : Array of key/value pairs to overwrite in the Postman Request Path Variables.
  - **key (string)** : The key that will be targeted in the request Path variables to overwrite/extend.
  - **value (string)** : The value that will be used to overwrite/extend the value in the request path variable OR use the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request body value OR attach the value to the original request Path variable value.
- **overwriteRequestBody (Array)** : Array of key/value pairs to overwrite in the Postman Request Body.
  - **key (string)** : The key that will be targeted in the request body to overwrite/extend.
  - **value (string)** : The value that will be used to overwrite/extend the key in the request body OR use the [Postman Dynamic variables](https://learning.postman.com/docs/writing-scripts/script-references/variables-list/) to use dynamic values like `{{$guid}}` or `{{randomInt}}`.
  - **overwrite (Boolean true/false | Default: true)** : Overwrites the request body value OR attach the value to the original request body value.

Postman request body before:

```JSON
{
  "name": "account0-test",
  "clientGuid": "ABC-123-DEF-456"
}
```

OpenAPI to Postman Testsuite Configuration:

```JSON
{
  "version": 1.0,
  "generateTests": {
    "responseChecks": {
      "StatusSuccess": {
        "enabled": true
      },
      "responseTime": {
        "enabled": true,
        "maxMs": 300
      },
      "contentType": {
        "enabled": true
      },
      "jsonBody": {
        "enabled": true
      },
      "schemaValidation": {
        "enabled": true
      }
    }
  },
  "extendTests": [
    {
      "openApiOperationId": "get-lists",
      "tests": [
        "pm.test('200 ok', function(){pm.response.to.have.status(200);});",
        "pm.test('check userId after create', function(){Number.isInteger(responseBody);});"
      ]
    }
  ],
  "overwriteRequests": [
    {
      "openApiOperationId": "get-accounts",
      "overwriteRequestQueryParams": [
        {
          "key": "$count",
          "value": true,
          "overwrite": true
        },
        {
          "key": "$filter",
          "value": "{{$randomInt}}",
          "overwrite": false
        }
      ]
    },
    {
      "openApiOperationId": "post-accounts",
      "overwriteRequestBody": [
        {
          "key": "name",
          "value": "--{{$randomInt}}",
          "overwrite": false
        },
        {
          "key": "clientGuid",
          "value": "{{$guid}}",
          "overwrite": true
        }
      ]
    },
    {
      "openApiOperationId": "delete-account",
      "overwriteRequestPathVariables": [
        {
          "key": "id",
          "value": "99",
          "overwrite": true
        }
      ]
    }
  ]
}

```
The `overwriteRequestQueryParams` example will overwrite the "$count" query param value with the boolean "true" and the
"$filter" with dynamic value for "$randomInt", for the "get-accounts" OpenAPI operationId.

The `overwriteRequestBody` example will extend the "name" value with the "--{{$randomInt}}" and overwrite the
"clientGuid" with the "{{$guid}}".
This will only be applied on the OpenAPI operationId

Postman request body after:
```JSON
{
  "name": "account0-test--{{$randomInt}}",
  "clientGuid": "{{$guid}}"
}
```

This is an example where we leverage the Postman Dynamic variables, but also static values can be used to overwrite/extend.

The `overwriteRequestPathVariables` example will overwrite the "id" path variable value with the "99", for the
"delete-account" OpenAPI operationId.
