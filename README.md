このrepositoryは [openapi-to-postman](https://github.com/postmanlabs/openapi-to-postman)をもとにfreeeのPublic APIを叩きやすいように変更を加えたものです。


## 概要
freeeのPublic APIスキーマからPOSTMANのcollectionを作成するscriptです

[POSTMAN](https://www.postman.com/)

[freee developers site](https://developer.freee.co.jp/)

## 変換スクリプトの使い方

```
$ git clone git@github.com:zawazawazawazawa/openapi-to-postman.git
$ cd openapi-to-postman
$ node node convert.js --tag='Account items' --schema_path='swagger.yml'
```
cliから実行するときに渡す引数
- tag
  - 特定のendpointのcollectionだけ欲しいときに使います。freee APIの各endpointのtagを渡してください。
  - tagはリファレンスに載っているリソースの英語名です。勘定科目の場合は `Account items` になります。
  - 未指定の場合、全endpointのcollectionが作成されます。

- schema_path
  - collectionに変換する対象のfreee Public APIのスキーマの絶対pathを指定してください。
  - 現行版の最新スキーマは [freee developers site](https://developer.freee.co.jp/) の各種APIリファレンスを参照して下さい。

## 出力されるcollectionの使い方

tagを指定した場合は `{tag名}.json` 、未指定の場合は `collection.json` という名前のファイルが出力されます。

`--tag="Account items` と指定した場合のファイル名は `account-items.json` です。 

POSTMANからファイル指定でimportすると以下の構成のcollectionが作成されます。
```
free API/
       └ {Tag名}/
               ├ GET {リソース名} 一覧の取得
               ├ GET {リソース名} 詳細情報の取得
               ├ POST {リソース名} の作成
               ├ PUT {リソース名} の更新
               └ DELETE {リソース名} の削除

```
Tag名のcollectionの下に各種HTTPメソッドに対応したrequestが作成されます。

どのrequestも `company_id` と `accesstoken` という名前pararmeterはの環境変数を受け取るようになっています。

POSTMANのenvironmentかcollectionに環境変数を設定して利用してください。

その他のparameterは、スキーマのexampleの値がvalueに設定されています。

`partner_id` などはそのままでは動かないので適宜正しい値に変更してください。



以下元々のREADME


![postman icon](https://raw.githubusercontent.com/postmanlabs/postmanlabs.github.io/develop/global-artefacts/postman-logo%2Btext-320x132.png) 

*Supercharge your API workflow.*  
*Modern software is built on APIs. Postman helps you develop APIs faster.*

# OpenAPI 3.0 to Postman Collection v2.1.0 Converter

[![Build Status](https://travis-ci.org/postmanlabs/openapi-to-postman.svg?branch=master)](https://travis-ci.org/postmanlabs/openapi-to-postman)
<a href="https://www.npmjs.com/package/openapi-to-postmanv2" alt="Latest Stable Version">![npm](https://img.shields.io/npm/v/openapi-to-postmanv2.svg)</a> 
<a href="https://www.npmjs.com/package/openapi-to-postmanv2" alt="Total Downloads">![npm](https://img.shields.io/npm/dw/openapi-to-postmanv2.svg)</a>

#### Contents 

- [OpenAPI 3.0 to Postman Collection v2.1.0 Converter](#openapi-30-to-postman-collection-v210-converter)
      - [Contents](#contents)
  - [Getting Started](#getting-started)
  - [Using the converter as a NodeJS module](#using-the-converter-as-a-nodejs-module)
    - [Convert](#convert)
    - [Options:](#options)
    - [ConversionResult](#conversionresult)
    - [Sample Usage:](#sample-usage)
    - [Validate Function](#validate-function)
      - [Validation object schema](#validation-object-schema)
        - [Validation object explanation](#validation-object-explanation)
  - [Command Line Interface](#command-line-interface)
    - [Options](#options-1)
    - [Usage](#usage)
  - [Conversion Schema](#conversion-schema)

---

## Getting Started

To use the converter as a Node module, you need to have a copy of the NodeJS runtime. The easiest way to do this is through npm. If you have NodeJS installed you have npm installed as well.

```terminal
$ npm install openapi-to-postmanv2
```

If you want to use the converter in the CLI, install it globally with NPM:

```terminal
$ npm i -g openapi-to-postmanv2
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

Check out complete list of options and their usage at [OPTIONS.md](/OPTIONS.md)

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
- `-v`, `--version`  
  Specifies the version of the converter

- `-s <source>`, `--spec <source>`  
  Used to specify the OpenAPI specification (file path) which is to be converted

- `-o <destination>`, `--output <destination>`  
  Used to specify the destination file in which the collection is to be written

- `-t`, `--test`  
  Used to test the collection with an in-built sample specification

- `-p`, `--pretty`  
  Used to pretty print the collection object while writing to a file

- `-O`, `--options`
  Used to supply options to the converter, for complete options details see [here](/OPTIONS.md)

- `-c`, `--options-config`  
  Used to supply options to the converter through config file, for complete options details see [here](/OPTIONS.md)

- `-h`, `--help`  
  Specifies all the options along with a few usage examples on the terminal


### Usage

**Sample usage examples of the converter CLI**


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
