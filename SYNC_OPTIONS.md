# Sync Options

This document describes the available options for syncing OpenAPI specifications with existing Postman collections using the `syncCollection` functionality.

## Available Sync Options

| id | type | default | description | version |
|---|---|---|---|---|
| syncExamples | boolean | false | Whether to sync response examples from the OpenAPI specification to the collection. When enabled, response examples in the spec will be synced with existing collection responses. | v2 |

## Usage

### CLI Usage

#### Using inline sync options:
```bash
openapi2postmanv2 -s spec.yaml --sync collection.json --sync-options syncExamples=true -o synced.json
```

#### Using sync options config file:
```bash
openapi2postmanv2 -s spec.yaml --sync collection.json --sync-options-config sync-options.json -o synced.json
```

**sync-options.json:**
```json
{
  "syncExamples": true
}
```
