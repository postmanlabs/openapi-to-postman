
![postman icon](https://raw.githubusercontent.com/postmanlabs/postmanlabs.github.io/develop/global-artefacts/postman-logo%2Btext-320x132.png) 

*Supercharge your API workflow.*  
*Modern software is built on APIs. Postman helps you develop APIs faster.*

# OpenAPI 3.0 to Postman Collection v2.1.0 Converter

Using this converter one can effortlessly convert a given OPENAPI 3.0.0 specification to a POSTMAN collection v2.1.0


---

# Contents 

1. [Getting Started](#getting-started)
    1. [Installation](#installation)
    2. [Using the converter as a NodeJS module](#using-converter-as-a-nodejs-module)
        1. [Convert Function](#convert-function)
            1. [Status Object schema](#status-object-schema)
            2. [Status Object explanation](#status-object-explanation)
            3. [Example Usage](#example-usage)
        2. [Validate Function](#validate-function)

2. [Command Line Interface](#command-line-interface)
    1. [Options](#options)
    2. [Usage](#usage)

---

# Getting Started

## Installation
To use the converter as a Node module, you need to have a copy of the NodeJS installable

The easiest way is to get the installable through npm. If you have NodeJS installed you have npm installed as well.

```terminal
$ npm install openapi3-to-postman
```

### Using the converter as a NodeJS module

In order to use the convert in your node application, you need to import the package through native JS require

```javascript
var openapi-converter = require('openapi3-to-postman')
```

The converter provides the following functions at your disposal

### Convert function

The convert function takes in your OPENAPI specification ( YAML / JSON ) and converts it to a POSTMAN collection.

The following points should be kept in mind while using the convert function:

1. The [convert function](#convert-function) is asynchronous in nature and takes a callback as an argument in which the resultant collection object is provided

2. The [convert function](#convert-function) provides the collection in an object which conforms to the following schema

#### Status object schema
```javascript
{
  type: object,
  properties:
    result:
      type: boolean
    reason:
      type: string
    collection:
      type: object
  required:
    result
}
```

#### Status object explanation

- `result` - Flag responsible for providing a status whether the conversion was successful or not 

- `reason` - Provides the reason for an unsuccessful conversion, defined only for an unsuccessful conversion

- `collection` - Contains the POSTMAN collection object, defined for a successful conversion

#### Example Usage

```javascript
var fs = require('fs),
  Converter = require('openapi3-to-postman),
  openapiData = fs.readFileSync('sample-spec.yaml');

Converter.convert(openapiData, (status) => {
  if(!status.result){
    console.log(status.reason);
  } 
  else {
    console.log(status.collection);
  }
});
```

### Validate Function

The validate function is mainly provided in order to ensure that the data that is being passed to the [convert function](#convert-function) is a valid JSON object or a valid (YAML/JSON) string.

The validate function is completely synchronous and returns a status object which conforms to the following schema

#### Validation object schema

```javascript
{
  type: object,
  properties:
    result:
      type: boolean
    reason:
      type: string
  required:
    result
}
```

##### Validation object explanation
- `result` - Flag responsible for providing a status on the validation of the specification data

- `reason` - Provides a reason for an unsuccessful validation of the specification


# Command Line Interface

The converter can be used as a command line interface as well. The following [command line options](#options) are available.

### `openapi2postmanv2 [options]`

## Options
- `-V`, `--version`  
  Specifies the version of the converter.

- `-s <source>`, `--spec <source>`  
  Used to specify the OPENAPI specification which is to be converted.

- `-o <destination>`, `--output <destination>`  
  Used to specify the destination file in which the collection is to be written.

- `-t`, `--test`  
  Used to test the collection with an in-built sample specification.

- `-p`, `--pretty`  
  Used to pretty print the collection object while writing to a file.

- `-h`, `--help`  
  Specifies all the options along with a few sample usage examples on the terminal.


## Usage

**Sample usage examples of the converter CLI**


- Takes a specification (spec.yaml) as an input and writes to a file (collection.json) with pretty printing
```terminal
$ openapi2postmanv2 -s spec.yaml -o collection.json -p
```

- Testing the converter
```terminal
$ openapi2postmanv2 --test
```

# Conversion Schema

| *postman* | *openapi* | *options* | *examples* |
| --- | --- | :---: | :--- |
| collectionName | info.title | - |  |
| descrition | info.description + info.contact | - |  |
| collectionVariables| server.variables + pathVariables | - |  |
| folderName | paths.path | - |  |
| requestName | operationItem(method).operationId | default(operationId)-(`requestName`)enum['operationId','summary','url'] |  |
| request.method | path.method | - |  |
| request.headers | parameter (`in = header`) | - | [here](#Header/Path-param-conversion-example) |
| request.body | operationItem(method).requestBody | - |  |
| request.url.raw | server.url (path level server >> openapi server) + path | - |  |
| requser.url.variables | parameter (`in = path`) | - | [here](#Header/Path-param-conversion-example) |
| request.url.params | parameter (`in = query`) | - | {"key": param.name, "value": [here](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#style-examples)}|
| api_key in (query or header) | components.securitySchemes.api_key | - ||


>`option : 'schemaFaker'(boolean) whether to use json-schema-faker for schema conversion`
>`option : 'requestNameSource'(string) The strategy to use to generate request names. url: use the request's URL as the name, fallback: Use the summary/operationId/URL (in that order) Default: fallback`

### Header/Path param conversion example

| *openapi* | *postman* |
| --- | --- |
|  |  |