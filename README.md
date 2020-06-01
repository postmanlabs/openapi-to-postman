
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

- `-c`, `--config`
  Used to supply options to the converter

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


## CLI Configuration options

These options are supported using the config file. 

| name                                                     | id                           | type    | default/0 | availableOptions/0 | availableOptions/1 | description                                                                                                                                                                                                                                                                                 | external | usage/0    |
|----------------------------------------------------------|------------------------------|---------|-----------|--------------------|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|------------|
| Naming requests                                          | requestNameSource            | enum    | Fallback  | URL                | Fallback           | Determines how the requests inside the generated collection will be named. If “Fallback” is selected, the request will be named after one of the following schema values: `description`, `operationid`, `url`.                                                                              | true     | CONVERSION |
| Set indent character                                     | indentCharacter              | enum    | Space     | Space              | Tab                | Option for setting indentation character                                                                                                                                                                                                                                                    | true     | CONVERSION |
| Collapse redundant folders                               | collapseFolders              | boolean | true      |                    |                    | Importing will collapse all folders that have only one child element and lack persistent folder-level data.                                                                                                                                                                                 | true     | CONVERSION |
| Request parameter generation                             | requestParametersResolution  | enum    | Schema    | Example            | Schema             | Select whether to generate the request parameters based on the [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject) or the [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject) in the schema.  | true     | CONVERSION |
| Response parameter generation                            | exampleParametersResolution  | enum    | Example   | Example            | Schema             | Select whether to generate the response parameters based on the [schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#schemaObject) or the [example](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#exampleObject) in the schema. | true     | CONVERSION |
| Folder organization                                      | folderStrategy               | enum    | Paths     | Paths              | Tags               | Select whether to create folders according to the spec’s paths or tags.                                                                                                                                                                                                                     | true     | CONVERSION |
| Enable Schema Faking                                     | schemaFaker                  | boolean | true      |                    |                    | Whether or not schemas should be faked.                                                                                                                                                                                                                                                     | false    | CONVERSION |
| Short error messages during request <> schema validation | shortValidationErrors        | boolean | false     |                    |                    | Whether detailed error messages are required for request <> schema validation operations.                                                                                                                                                                                                   | true     | VALIDATION |
| Properties to ignore during validation                   | validationPropertiesToIgnore | array   |           |                    |                    | Specific properties (parts of a request/response pair) to ignore during validation. Must be sent as an array of strings. Valid inputs in the array: PATHVARIABLE, QUERYPARAM, HEADER, BODY, RESPONSE_HEADER, RESPONSE_BODY                                                                  | true     | VALIDATION |
| Whether MISSING_IN_SCHEMA mismatches should be returned  | showMissingInSchemaErrors    | boolean | false     |                    |                    | MISSING_IN_SCHEMA indicates that an extra parameter was included in the request. For most use cases, this need not be considered an error.                                                                                                                                                  | true     | VALIDATION |
| Show detailed body validation messages                   | detailedBlobValidation       | boolean | false     |                    |                    | Determines whether to show detailed mismatch information for application/json content in the request/response body.                                                                                                                                                                         | true     | VALIDATION |
