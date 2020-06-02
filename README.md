
![postman icon](https://raw.githubusercontent.com/postmanlabs/postmanlabs.github.io/develop/global-artefacts/postman-logo%2Btext-320x132.png)

*Supercharge your API workflow.*
*Modern software is built on APIs. Postman helps you develop APIs faster.*

# OpenAPI 3.0 to Postman Collection v2.1.0 Converter

[![Build Status](https://travis-ci.org/postmanlabs/openapi-to-postman.svg?branch=master)](https://travis-ci.org/postmanlabs/openapi-to-postman)

#### Contents

1. [Getting Started](#getting-started)
2. [Using the converter as a NodeJS module](#using-the-converter-as-a-nodejs-module)
    1. [Convert Function](#convert)
    2. [Options](#options)
    3. [ConversionResult](#conversionresult)
    4. [Sample usage](#sample-usage)
    5. [Validate function](#validate-function)
3. [Command Line Interface](#command-line-interface)
    1. [Options](#options)
    2. [Usage](#usage)
4. [Conversion Schema](#conversion-schema)
5. [Postman test suite generation options](#postman-test-suite-generation-options)

---

## Getting Started

To use the converter as a Node module, you need to have a copy of the NodeJS runtime. The easiest way to do this is through npm. If you have NodeJS installed you have npm installed as well.

```terminal
$ npm install openapi-to-postmanv2
```


## Using the converter as a NodeJS module

In order to use the convert in your node application, you need to import the package using `require`.

```javascript
var Converter = require('openapi-to-postmanv2')
```

The converter provides the following functions:

### Convert

The convert function takes in your OpenAPI specification ( YAML / JSON ) and converts it to a Postman collection.

Signature: `convert (data, options, callback);`

**data:**

```javascript
{ type: 'file', data: 'filepath' }
OR
{ type: 'string', data: '<entire OpenAPI string - JSON or YAML>' }
OR
{ type: 'json', data: OpenAPI-JS-object }
```

**options:**
```javascript
{
  schemaFaker: true,
  requestNameSource: 'fallback',
  indentCharacter: ' '
}
/*
All three properties are optional. Check the options section below for possible values for each option.
*/
```

**callback:**
```javascript
function (err, result) {
  /*
  result = {
    result: true,
    output: [
      {
        type: 'collection',
        data: {..collection object..}
      }
    ]
  }
  */
}
```

### Options:
* `'schemaFaker'(boolean)`:  whether to use json-schema-faker for schema conversion. Default: `true`
* `'requestNameSource'(string)`: The strategy to use to generate request names. url: use the request's URL as the name, fallback: Use the summary/operationId/URL (in that order) Default: `fallback`
* `'indentCharacter' (string)`: The character to use per level of indentation for JSON/XML data. Default: `' '(space)`

### ConversionResult

- `result` - Flag responsible for providing a status whether the conversion was successful or not

- `reason` - Provides the reason for an unsuccessful conversion, defined only if result: false

- `output` - Contains an array of Postman objects, each one with a `type` and `data`. The only type currently supported is `collection`.



### Sample Usage:
```javascript
var fs = require('fs'),

Converter = require('openapi-to-postmanv2'),
openapiData = fs.readFileSync('sample-spec.yaml', {encoding: 'UTF8'});

Converter.convert({ type: 'string', data: openapiData },
  {}, (err, conversionResult) => {
    if (!conversionResult.result) {
      console.log('Could not convert', conversionResult.reason);
    }
    else {
      console.log('The collection object is: ', conversionResult.output[0].data);
    }
  }
);
```

### Validate Function

The validate function is meant to ensure that the data that is being passed to the [convert function](#convert-function) is a valid JSON object or a valid (YAML/JSON) string.

The validate function is synchronous and returns a status object which conforms to the following schema

#### Validation object schema

```javascript
{
  type: 'object',
  properties: {
    result: { type: 'boolean'},
    reason: { type: 'string' }
  },
  required: ['result']
}
```

##### Validation object explanation
- `result` - true if the data looks like OpenAPI and can be passed to the convert function

- `reason` - Provides a reason for an unsuccessful validation of the specification


## Command Line Interface

The converter can be used as a CLI tool as well. The following [command line options](#options) are available.

`openapi2postmanv2 [options]`

### Options
- `-V`, `--version`
  Specifies the version of the converter

- `-s <source>`, `--spec <source>`
  Used to specify the OpenAPI specification (file path) which is to be converted

- `-o <destination>`, `--output <destination>`
  Used to specify the destination file in which the collection is to be written

- `-t`, `--test`
  Used to test the collection with an in-built sample specification

- `-p`, `--pretty`
  Used to pretty print the collection object while writing to a file

- `-c <config>`, `--config <config>`
  Used to supply options to the converter

- `-g <generate>`, `--generate <generate>`
  Used to generate postman tests given the JSON file with test options

- `-h`, `--help`
  Specifies all the options along with a few usage examples on the terminal


### Usage

**Sample usage examples of the converter CLI**


- Takes a specification (spec.yaml) as an input and writes to a file (collection.json) with pretty printing
```terminal
$ openapi2postmanv2 -s spec.yaml -o collection.json -p
```

- Testing the converter
```terminal
$ openapi2postmanv2 --test
```

- Generating additional postman tests for the OpenAPi specification
```terminal
$ openapi2postmanv2 -s spec.yaml -o collection.json -p -g postman-testsuite.json
```

## Conversion Schema

| *postman* | *openapi* | *options* | *examples* |
| --- | --- | :---: | :--- |
| collectionName | info.title | - |  |
| description | info.description + info.contact | - |  |
| collectionVariables| server.variables + pathVariables | - |  |
| folderName | paths.path | - |  |
| requestName | operationItem(method).operationId | default(operationId)-(`requestName`)enum['operationId','summary','url'] |  |
| request.method | path.method | - |  |
| request.headers | parameter (`in = header`) | - | [link](#Header/Path-param-conversion-example) |
| request.body | operationItem(method).requestBody | - |  |
| request.url.raw | server.url (path level server >> openapi server) + path | - |  |
| request.url.variables | parameter (`in = path`) | - | [link](#Header/Path-param-conversion-example) |
| request.url.params | parameter (`in = query`) | - | {"key": param.name, "value": [link](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#style-examples)}|
| api_key in (query or header) | components.securitySchemes.api_key | - ||

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
  ]
}
```

The JSON test suite format consists out of 3 parts:
- **version** : which refers the JSON test suite version
(not relevant but might handy for future backward compatibility options).
- **generateTests** : which refers the default available generated postman tests.
The default tests are grouped per type (response, request)
  - **responseChecks** : All response basic checks. (For now we have only included response checks).
- **extendTests**:  which refers the custom additions of manual created postman tests.
The manual tests are added during generation. The tests are mapped based on the OpenApi operationId.
Anything added in `tests` array, will be added to the postman test scripts.
  - **openApiOperationId (String)** : Reference to the OpenApi operationId for which the tests will be extended
  - **tests (Array)** : Array of additional postman test scripts.
  - **responseChecks (array)** : Extends the generateTests `responseChecks` (see [Postman test suite properties](#postman-test-suite-properties)) with specifics for the openApiOperationId.
  - **overwrite (Boolean true/false)** : Resets all generateTests and overwrites them with the defined tests from the `tests` array.
  Default: false

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
