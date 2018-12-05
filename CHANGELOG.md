# OpenAPI-Postman Changelog

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