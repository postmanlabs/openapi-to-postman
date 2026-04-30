
<img src="https://voyager.postman.com/logo/postman-logo-orange.svg" width="320" alt="The Postman Logo">

*Supercharge your API workflow.*
*Modern software is built on APIs. Postman helps you develop APIs faster.*

# OpenAPI 3.0, 3.1 and Swagger 2.0 to Postman Collection

![Build Status](https://github.com/postmanlabs/openapi-to-postman/actions/workflows/integration.yml/badge.svg)

<a href="https://www.npmjs.com/package/openapi-to-postmanv2" alt="Latest Stable Version">![npm](https://img.shields.io/npm/v/openapi-to-postmanv2.svg)</a>
<a href="https://www.npmjs.com/package/openapi-to-postmanv2" alt="Total Downloads">![npm](https://img.shields.io/npm/dw/openapi-to-postmanv2.svg)</a>

#### Contents

1. [Getting Started](#getting-started)
2. [Command Line Interface](#command-line-interface)
    1. [Options](#options)
    2. [Usage](#usage)
    3. [Syncing Collections](#syncing-collections)
3. [Using the converter as a NodeJS module](#using-the-converter-as-a-nodejs-module)
    1. [Convert Function](#convert)
    2. [Sync Collection Function](#sync-collection)
    3. [Options](#options)
    4. [ConversionResult](#conversionresult)
    5. [Sample usage](#sample-usage)
    6. [Validate function](#validate-function)
4. [Conversion Schema](#conversion-schema)

---

---

### 🚀 We now also support OpenAPI 3.1 and Swagger 2.0 along with OpenAPI 3.0.
---
---

<h2 id="getting-started">💭 Getting Started</h2>

To use the converter as a Node module, you need to have a copy of the NodeJS runtime. The easiest way to do this is through npm. If you have NodeJS installed you have npm installed as well.

```terminal
$ npm install openapi-to-postmanv2
```

If you want to use the converter in the CLI, install it globally with NPM:

```terminal
$ npm i -g openapi-to-postmanv2
```


<h2 id="command-line-interface">📖 Command Line Interface</h2>

The converter can be used as a CLI tool as well. The following [command line options](#options) are available.

`openapi2postmanv2 [options]`

### Options

- `-s <source>`, `--spec <source>`
  Used to specify the OpenAPI specification (file path) which is to be converted

- `-o <destination>`, `--output <destination>`
  Used to specify the destination file in which the collection is to be written

- `-p`, `--pretty`
  Used to pretty print the collection object while writing to a file

- `-i`, `--interface-version`
  Specifies the interface version of the converter to be used. Value can be 'v2' or 'v1'. Default is 'v2'.

- `-O`, `--options`
  Used to supply options to the converter, for complete options details see [here](/OPTIONS.md)

- `-c`, `--options-config`
  Used to supply options to the converter through config file, for complete options details see [here](/OPTIONS.md)

- `-t`, `--test`
  Used to test the collection with an in-built sample specification

- `-v`, `--version`
  Specifies the version of the converter

- `-h`, `--help`
  Specifies all the options along with a few usage examples on the terminal

- `--sync <collectionFile>`
  Sync spec changes with an existing Postman Collection file

- `--sync-options <syncOptions>`
  Comma-separated list of sync options (e.g., `syncExamples=true`)

- `--sync-options-config <syncOptionsConfig>`
  JSON file containing sync options


###  Usage

- Takes a specification (spec.yaml) as an input and writes to a file (collection.json) with pretty printing and using provided options
```terminal
$ openapi2postmanv2 -s spec.yaml -o collection.json -p -O folderStrategy=Tags,includeAuthInfoInExample=false
```

- Takes a specification (spec.yaml) as an input and writes to a file (collection.json) with pretty printing and using provided options via config file
```terminal
$ openapi2postmanv2 -s spec.yaml -o collection.json -p  -c ./examples/cli-options-config.json
```

- Takes a specification (spec.yaml) as an input and writes to a file (collection.json) with pretty printing and using provided options (Also avoids any `"<Error: Too many levels of nesting to fake this schema>"` kind of errors present in converted collection)
```terminal
$ openapi2postmanv2 -s spec.yaml -o collection.json -p -O folderStrategy=Tags,requestParametersResolution=Example,optimizeConversion=false,stackLimit=50
```

- Testing the converter
```terminal
$ openapi2postmanv2 --test
```

### Syncing Collections

The sync functionality allows you to update an existing Postman collection with changes from your OpenAPI specification.

#### Basic Sync

```terminal
$ openapi2postmanv2 -s spec.yaml --sync collection.json -o synced-collection.json
```

#### Sync with Options

```terminal
$ openapi2postmanv2 -s spec.yaml --sync collection.json --sync-options syncExamples=true -o synced-collection.json
```

#### Sync with Config File

```terminal
$ openapi2postmanv2 -s spec.yaml --sync collection.json --sync-options-config sync-options.json -o synced-collection.json
```

**sync-options.json:**
```json
{
  "syncExamples": true
}
```

For a complete list of sync options and their usage, see [SYNC_OPTIONS.md](/SYNC_OPTIONS.md)


<h2 id="using-the-converter-as-a-nodejs-module">🛠 Using the converter as a NodeJS module</h2>

In order to use the convert in your node application, you need to import the package using `require`.

```javascript
var Converter = require('openapi-to-postmanv2')
```

The converter provides the following functions:

### Convert

The convert function takes in your OpenAPI 3.0, 3.1 and Swagger 2.0 specification (YAML / JSON) and converts it to a Postman collection.

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
Note: All possible values of options and their usage can be found over here: [OPTIONS.md](/OPTIONS.md)

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

### Sync Collection

The syncCollection function syncs changes from an OpenAPI specification with an existing Postman collection.

Signature: `syncCollection (data, options, collection, syncOptions, callback);`

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
  parametersResolution: 'Example',
  folderStrategy: 'Tags'
}
/*
Regular conversion options. Check the options section below for possible values.
*/
```

**collection:**
```javascript
// Existing Postman collection object (JSON)
const collection = {
  info: { name: 'My API', schema: '...' },
  item: [...]
}
```

**syncOptions:**
```javascript
{
  syncExamples: true
}
/*
Sync-specific options that control the merge behavior.
All sync options are optional. Check SYNC_OPTIONS.md for details.
*/
```
Note: All possible values of sync options can be found here: [SYNC_OPTIONS.md](/SYNC_OPTIONS.md)

**callback:**
```javascript
function (err, result) {
  /*
  result = {
    result: true,
    output: [
      {
        type: 'collection',
        data: {..synced collection object..}
      }
    ]
  }
  */
}
```

### Options

Check out complete list of options and their usage at [OPTIONS.md](/OPTIONS.md)

### ConversionResult

- `result` - Flag responsible for providing a status whether the conversion was successful or not.

- `reason` - Provides the reason for an unsuccessful conversion, defined only if result if `false`.

- `output` - Contains an array of Postman objects, each one with a `type` and `data`. The only type currently supported is `collection`.



### Sample Usage

#### Converting a specification

```javascript
const fs = require('fs'),
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

#### Syncing a specification with an existing collection

```javascript
const fs = require('fs'),
  Converter = require('openapi-to-postmanv2'),
  openapiData = fs.readFileSync('sample-spec.yaml', {encoding: 'UTF8'}),
  existingCollection = JSON.parse(fs.readFileSync('collection.json', {encoding: 'UTF8'}));

const syncOptions = {
  syncExamples: true
};

Converter.syncCollection(
  { type: 'string', data: openapiData },
  {}, // conversion options
  existingCollection,
  syncOptions,
  (err, syncResult) => {
    if (!syncResult.result) {
      console.log('Could not sync', syncResult.reason);
    }
    else {
      console.log('The collection object is: ', syncResult.output[0].data);
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

<h2 id="conversion-schema">🧭 Conversion Schema</h2>

| *postman* | *openapi* | *related options* |
| --- | --- | :---: |
| collectionName | info.title | - |
| description | info.description + info.contact | - |
| collectionVariables| server.variables + pathVariables | - |
| folderName | paths.path / tags.name | folderStrategy |
| requestName | operationItem(method).summary / operationItem(method).operationId / url | requestNameSource |
| request.method | path.method | - |
| request.headers | parameter (`in = header`) | - | [link](#Header/Path-param-conversion-example) |
| request.body | operationItem(method).requestBody | requestParametersResolution, exampleParametersResolution |
| request.url.raw | server.url (path level server >> openapi server) + path | - |
| request.url.variables | parameter (`in = path`) | - |
| request.url.params | parameter (`in = query`) | - |
| api_key in (query or header) | components.securitySchemes.api_key | includeAuthInfoInExample |
