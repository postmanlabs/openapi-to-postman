# OpenAPI-Postman Changelog

#### v1.0.0 (Dec 31, 2019)
* New API to validate requests against a schema
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/113 - Correct description set for falsy values
* Invalid file paths return a falsy result and a reason (instead of an error)
* Invalid option values don't throw errors anymore
* Readme typo fix (courtesy https://github.com/disposedtrolley)

#### v0.2.0 (Nov 22, 2019)
* Handled cases where the URL query has no description property
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/117 - Maintaining descriptions for form-urlencoded body params
* Added various options for converting OpenAPI specs into Postman Collections, including controlling how examples are generated
* Request parameters now default to a schema-based value generation, response parameters default to example-based value generation.

#### v0.1.0 (Oct 1, 2019)
* Fix for https://github.com/postmanlabs/swagger2-postman2/issues/21 - Not creating folders at each path level unless required
* Schemas with circular object definitions are imported successfully


#### v0.0.17/v0.0.18 (Sep 3, 2019)
* Empty local server definitions not crashing the converter
* Custom JSON headers being picked up for request/response body generation
* Stringifying boolean params if present as query parameters (courtesy https://github.com/Firtzberg)
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/102 - Not crashing on undefined name/email/description properties
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/90 - respecting `server` elements defined inside paths
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/98 - respecting `readOnly` and `writeOnly` properies while faking schemas
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/88 - escaping / and ~ characters in `$ref`s  (courtesy https://github.com/bzmw)


#### v0.0.16 (July 22, 2019)
* Corrected code snippet in README (courtesy https://github.com/simonlampen)
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/44 - Prevent crashes for specs that contain a root endpoint (courtesy https://github.com/pitpit)
* Ignoring missing body propertes in schema objects

#### v0.0.14 / v0.0.15 (June 5, 2019)
* Added system tests, updated lockfiles for npm@6.4.1
* Fix for https://github.com/postmanlabs/postman-app-support/issues/6538 - parsing JSON correctly from example references

#### v0.0.13 (May 29, 2019)
* Fix for https://github.com/postmanlabs/postman-app-support/issues/6538 - handling references in request/response examples
* Fix for https://github.com/postmanlabs/postman-app-support/issues/6500 - manually stringifying number types as a workaround for SDK issues
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/23 - custom schema formats are not ignored
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/18 - consistent parsing for URL variables
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/64 - array params don't cause a crash with schemaFaker disabled (courtesy https://github.com/brpeterman)
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/52 - allowing $refs to point to paths, not just components
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/27 - support for allOf-type schemas
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/45 - trailing slashes in the path don't create empty folders
* Using a placeholder for servers.url in case the spec has a falsy value
* Support for x-postman-meta for including Postman auth in converted collections


#### v0.0.12 (Apr 17, 2019)
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/36 - Property names with a . in the name are supported during schema faking

#### v0.0.11 (Apr 17, 2019)
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/47 - Accepting application/vnd.api+json headers as JSON
* Removing unused dependencies
* Fix CLI test commands (courtesy https://github.com/aerotog)
* Fix README typos (courtesy https://github.com/T1l3 and https://github.com/evertharmeling)

#### v0.0.10 (Jan 31, 2019)
* Safe property access to empty content/authHelper objects
* Setting postman_previewLanguage while setting responses
* Not overriding non-string variable types during schema faking
* Not doubly-stringifying string headers

#### v0.0.9 (December 17, 2018)
* Removing Node v4/5 from CI
* Ignoring falsy responses in the OAS spec
* Correct error handling/output logging in the executable
* Showing detailed error messages for malformed JSON/YAML
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/5 - headers with refs to deeply nested components should work
* Fix for https://github.com/postmanlabs/openapi-to-postman/issues/4 - the cwd (not __dirname) is used to look for files specified by -s
* Adding tests for the executable

#### v0.0.8 (December 12, 2018)
* Refactoring, restucturing tests
* Adding support for xml chemas
* Enabling travis CI
* Updating README, adding a license, moving to Github

#### v0.0.7 (December 7, 2018)
* Converting all console.error to console.warn

#### v0.0.6 (December 5, 2018)
* Handling schema.enum when no other schema is specified
* Resolving parameter schemas while creating requests
* Correctly setting path variable descriptions
* Using a browserified json-schema-faker

#### v0.0.5 (November 30, 2018)
* Populating the original request in generated example responses
* Infer the response content-type header from the response body
* Generating more human-readable folder/request names from snake_case/camelCase

#### v0.0.4 (November 29, 2018)
* Handling nested schemas, correct handling for oneOf/anyOf

#### v0.0.3 (November 29, 2018)
* Prefer examples to schemas while generating example response body
* Correct handling for scheme variables in the URL
* Ignoring schema errors for invalid references
* Blocking schema nesting of >20 levels
* Correctly handling empty security sets for requests
* Removing the insecure node-uuid dependency

#### v0.0.2 (November 19, 2018)
* Adding default URLs if "server" is absent
* Better indication of lack-of-support for allOf schemas

#### v0.0.1 (October 23, 2018)
* Base release
