# OpenAPI-Postman Changelog


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