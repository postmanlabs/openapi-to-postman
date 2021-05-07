const _ = require('lodash'),
  deref = require('./deref.js'),
  defaultOptions = require('../lib/options.js').getOptions('use'),
  APP_JSON = 'application/json',
  // Specifies types of processing Refs
  PROCESSING_TYPE = {
    VALIDATION: 'VALIDATION',
    CONVERSION: 'CONVERSION'
  };

module.exports = {
  /**
   * function to convert an openapi reponse object to object of postman tests
   * @param {*} operation openapi operation object
   * @param {*} operationItem - The operation item to get relevant information for the test generation
   * @param {object} components - components defined in the OAS spec. These are used to
   * resolve references while generating params.
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @param {object} schemaCache - object storing schemaFaker and schemeResolution caches
   * @returns {*} array of all query params
   */
  convertResponsesToPmTest: function (operation, operationItem, components, options, schemaCache) {
    options = _.merge({}, defaultOptions, options);
    let testEvent = {},
      testSuite = {},
      testSuiteSettings = {},
      testSuiteLimits = [],
      testSuiteExtensions = [],
      requestsTests = [],
      swagResponse = {};

    // Check for test suite flag, abort early
    if (!options.testSuite) {
      return testEvent;
    }

    // Check test suite for later usage, potentially convert object
    if (options.testSuite && options.testSuiteSettings) {
      testSuite = options.testSuiteSettings;
      if (testSuite.generateTests) {
        testSuiteSettings = options.testSuiteSettings.generateTests;
      }

      // Limit the test generation to the following operations
      if (testSuiteSettings.limitOperations) {
        testSuiteLimits = testSuiteSettings.limitOperations;
      }

      // Extend the generated test with additional operations
      if (testSuite.extendTests) {
        testSuiteExtensions = options.testSuiteSettings.extendTests;

        testSuiteExtensions.forEach((testExtension) => {
          if (operation.operationId && testExtension.openApiOperationId &&
            operation.operationId === testExtension.openApiOperationId &&
            testExtension && testExtension.responseChecks) {
            // Extend testSuiteSettings with testExtension settings
            testSuiteSettings.responseChecks = _.merge(
              {}, testSuiteSettings.responseChecks, testExtension.responseChecks
            );
          }
        });
      }

    }

    _.forOwn(operation.responses, (response, code) => {
      // Skip the operations, if there are limits defined
      if (operation.operationId && testSuiteLimits.length > 0 &&
        testSuiteLimits.indexOf(operation.operationId) === -1) {
        return; // skip this response
      }

      // Only support 2xx response checks
      // TODO Investigate how to support other response codes like validation response 4xx or 5xx
      if (!_.inRange(code, 200, 299)) {
        return; // skip this response
      }

      // Format response
      swagResponse = response;
      if (response.$ref) {
        swagResponse = this.getRefObject(response.$ref, components, options);
      }

      // Add status code check
      // TODO Validate other request codes
      // if (operationItem.method.toUpperCase() === 'GET') {
      //   requestsTests.push(
      //     '// Validate status code \n'+
      //     'pm.test("Status code should be '+code+'", function () {\n' +
      //     '    pm.response.to.have.status('+code+');\n' +
      //     '});\n'
      //   )
      // }

      // Add status success check
      if (_.get(testSuiteSettings, 'responseChecks.StatusSuccess.enabled')) {
        requestsTests.push(
          '// Validate status 2xx \n' +
          'pm.test("[' + operationItem.method.toUpperCase() + '] /' + operationItem.path +
          ' - Status code is 2xx", function () {\n' +
          '   pm.response.to.be.success;\n' +
          '});\n'
        );
      }

      // Add response timer check
      if (_.get(testSuiteSettings, 'responseChecks.responseTime.enabled')) {
        let maxMs = _.get(testSuiteSettings, 'responseChecks.responseTime.maxMs');
        requestsTests.push(
          '// Validate response time \n' +
          'pm.test("[' + operationItem.method.toUpperCase() + '] /' + operationItem.path +
          ' - Response time is less than ' + maxMs + 'ms", function () {\n' +
          '    pm.expect(pm.response.responseTime).to.be.below(' + maxMs + ');\n' +
          '});\n'
        );
      }

      // Process the response content
      _.forOwn(swagResponse.content, (content, contentType) => {
        if (contentType) {
          // Add content-type check
          if (_.get(testSuiteSettings, 'responseChecks.contentType.enabled')) {
            requestsTests.push(
              '// Validate content-type \n' +
              'pm.test("[' + operationItem.method.toUpperCase() + '] /' + operationItem.path +
              ' - Content-Type is ' + contentType + '", function () {\n' +
              '   pm.expect(pm.response.headers.get("Content-Type")).to.include("' + contentType + '");\n' +
              '});\n'
            );
          }

          if (contentType === APP_JSON) {
            let resolvedSchema,
              assignPmVariablesCounter = 0;

            // Add JSON body check
            if (_.get(testSuiteSettings, 'responseChecks.jsonBody.enabled')) {
              requestsTests.push(
                '// Response should have JSON Body\n' +
                'pm.test("[' + operationItem.method.toUpperCase() + '] /' + operationItem.path +
                ' - Response has JSON Body", function () {\n' +
                '    pm.response.to.have.jsonBody();\n' +
                '});\n');
            }

            // Add JSON schema check
            if (_.get(testSuiteSettings, 'responseChecks.schemaValidation.enabled') && content.schema) {
              let schemaContent = content.schema;
              // if (content.schema.$ref) {
              //   schemaContent = this.getRefObject(content.schema.$ref, components, options);
              // }

              try {
                // When processing a reference, schema.type could also be undefined
                resolvedSchema = deref.resolveRefs(_.cloneDeep(schemaContent), 'response', components,
                  schemaCache, 'VALIDATION', 'example', 0, {}, 999);

                // deletes nullable and adds "null" to type array if nullable is true
                let jsonSchema = this.convertUnsupportedJsonSchemaProperties(resolvedSchema);

                requestsTests.push(
                  '// Response Validation\n' +
                  'const schema = ' + JSON.stringify(jsonSchema) + '\n' +
                  '\n' +
                  '// Test whether the response matches the schema\n' +
                  'pm.test("[' + operationItem.method.toUpperCase() + '] /' + operationItem.path +
                  ' - Schema is valid", function() {\n' +
                  '   pm.response.to.have.jsonSchema(schema,{unknownFormats: ["int32", "int64"]});\n' +
                  '});\n'
                );
              } catch (e) {
                console.warn('JSON schema check failed', e);
                console.warn('invalid schemaValidation for ', content);
              }
            }

            // Automatic set the response.id as an environment variable for chaining option
            if (operationItem.method.toUpperCase() === 'POST' && resolvedSchema !== undefined &&
              resolvedSchema.properties && resolvedSchema.properties.id) {
              // Only set the jsonData once
              if (assignPmVariablesCounter === 0) {
                requestsTests.push('// Set response object as internal variable\n' +
                  'let jsonData = pm.response.json();\n');
              }
              requestsTests.push(
                '// pm.environment - Set ' + operation.operationId + '.id as environment variable \n' +
                'if (jsonData.id) {\n' +
                '   pm.environment.set("' + operation.operationId + '.id",jsonData.id);\n' +
                '   console.log("pm.environment - use {{' + operation.operationId + '.id}} ' +
                'as variable for value", jsonData.id);\n' +
                '};\n');
              console.log('- pm.environment for "' + operation.operationId + '.id" - use {{' +
                operation.operationId + '.id}} as variable for "reponse.id');
              assignPmVariablesCounter++;
            }

            // Assign defined PmVariables for JSON response
            if (testSuite.assignPmVariables) {
              let testSuiteAssignPmVariables = testSuite.assignPmVariables,
                // Get the environmentVariables settings for the current operationId
                assignPmVariablesForOperation = testSuiteAssignPmVariables.find((or) => {
                  return or.openApiOperationId === operation.operationId;
                });

              if (assignPmVariablesForOperation && assignPmVariablesForOperation.environmentVariables) {
                let assignEnvironmentVariables = assignPmVariablesForOperation.environmentVariables;

                assignEnvironmentVariables.forEach((environmentVariable) => {
                  // Set response body property as variable
                  if (environmentVariable.responseProp || environmentVariable.responseBodyProp) {
                    let responseProp = (environmentVariable.responseProp) ?
                      environmentVariable.responseProp : environmentVariable.responseBodyProp;
                    // Set variable name
                    let varName = operation.operationId + '.' + responseProp;
                    if (environmentVariable.name) {
                      varName = environmentVariable.name;
                    }
                    // Only set the jsonData once
                    if (assignPmVariablesCounter === 0) {
                      requestsTests.push('// Set response object as internal variable\n' +
                        'let jsonData = pm.response.json();\n');
                    }
                    requestsTests.push(
                      '// pm.environment - Set ' + varName + ' as environment variable \n' +
                      'if (jsonData.' + responseProp + ') {\n' +
                      '   pm.environment.set("' + varName + '",jsonData.' + responseProp + ');\n' +
                      '   console.log("pm.environment - use {{' + varName + '}} as variable for value", ' +
                      'jsonData.' + responseProp + ');\n' +
                      '};\n');
                    console.log('- pm.environment for "' + operation.operationId + '" - use {{' + varName + '}} ' +
                      'as variable for "reponse.' + responseProp + '"');
                    assignPmVariablesCounter++;
                  }
                });
              }
            }

          }
        }

      });

      // Process the response header
      _.forOwn(swagResponse.headers, (header, headerKey) => {

        if (headerKey && header.name) {
          // Add content-type check
          if (_.get(testSuiteSettings, 'responseChecks.headersPresent.enabled')) {
            requestsTests.push(
              '// Validate header \n' +
              'pm.test("[' + operationItem.method.toUpperCase() + '] /' + operationItem.path +
              ' - Response header ' + header.name + ' is present", function () {\n' +
              '   pm.response.to.have.header("' + header.name + '");\n' +
              '});\n'
            );
          }
        }

      });

      // Assign defined PmVariables for response headers
      if (testSuite.assignPmVariables) {
        let testSuiteAssignPmVariables = testSuite.assignPmVariables,
          // Get the environmentVariables settings for the current operationId
          assignPmVariablesForOperation = testSuiteAssignPmVariables.find((or) => {
            return or.openApiOperationId === operation.operationId;
          });

        if (assignPmVariablesForOperation && assignPmVariablesForOperation.environmentVariables) {
          let assignEnvironmentVariables = assignPmVariablesForOperation.environmentVariables;

          assignEnvironmentVariables.forEach((environmentVariable) => {
            // Set response header property as variable
            if (environmentVariable.responseHeaderProp) {
              let headerProp = environmentVariable.responseHeaderProp;
              // Set variable name
              let varName = operation.operationId + '.' + headerProp;
              if (environmentVariable.name) {
                varName = environmentVariable.name;
              }

              // Safe variable name
              let safeVarName = varName.replace(/-/g, '')
                .replace(/_/g, '').replace(/ /g, '')
                .replace(/\./g, '');

              requestsTests.push(
                '// pm.environment - Set ' + varName + ' as environment variable \n' +
                'let ' + safeVarName + ' = pm.response.headers.get("' + headerProp + '"); \n' +
                'if (' + safeVarName + ' !== undefined) {\n' +
                '   pm.environment.set("' + varName + '",' + safeVarName + ');\n' +
                '   console.log("pm.environment - use {{' + varName + '}} as variable for value", ' +
                '' + safeVarName + ');\n' +
                '};\n');
              console.log('- pm.environment for "' + operation.operationId + '" - use {{' + varName + '}} ' +
                'as variable for "header.' + headerProp + '"');
            }

          });
        }
      }

    });

    // Add test extensions that are defined in the test suite file
    if (testSuiteExtensions.length > 0) {
      testSuiteExtensions.forEach((testExtension) => {
        if (operation.operationId && testExtension.openApiOperationId &&
          operation.operationId === testExtension.openApiOperationId) {

          if (testExtension && testExtension.overwrite && testExtension.overwrite === true) {
            // Reset generated tests
            requestsTests = [];
          }

          // Add test extensions
          if (testExtension.tests && testExtension.tests.length > 0) {
            testExtension.tests.forEach((postmanTest) => {
              try {
                // Extend the generated tests, with the test extension scripts
                requestsTests.push(postmanTest);
              } catch (e) {
                console.warn('invalid extendTests for ' + testExtension.openApiOperationI);
              }
            });
          }
        }
      });
    }

    // Add tests to postman item
    if (requestsTests.length > 0) {
      testEvent = {
        listen: 'test',
        script: requestsTests
      };
    }
    return testEvent;
  },

  /**
   * function to overwrite a request body with values defined by the postman testsuite
   * @param {*} requestBody object
   * @param {*} operation openapi operation object
   * @param {*} operationItem - The operation item to get relevant information for the test generation
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @returns {*} Modified requestBody object
   */
  overwriteRequestBodyByTests: function (requestBody, operation, operationItem, options) {
    options = _.merge({}, defaultOptions, options);
    let testRequestBody = Object.assign({}, requestBody), // clone requestBody before manipulation
      bodyString,
      find,
      replace,
      testSuite = {},
      overwriteValues = [],
      testSuiteOverwriteRequest = {},
      testSuiteOverwriteRequests = [];

    // Check for test suite flag and if there is RAW requestBody, abort early
    if (!options.testSuite && !requestBody.raw) {
      return requestBody;
    }

    if (options.testSuite && options.testSuiteSettings) {
      testSuite = options.testSuiteSettings;
    }

    if (testSuite.overwriteRequests) {
      testSuiteOverwriteRequests = options.testSuiteSettings.overwriteRequests;
      // Get the overwrite setting for the operationId
      testSuiteOverwriteRequest = testSuiteOverwriteRequests.find((or) => {
        return or.openApiOperationId === operation.operationId;
      });

      if (testSuiteOverwriteRequest && testSuiteOverwriteRequest.overwriteRequestBody) {
        overwriteValues = testSuiteOverwriteRequest.overwriteRequestBody;

        // Overwrite values for Keys
        let bodyData = JSON.parse(testRequestBody.raw);
        overwriteValues.forEach((overwriteValue) => {
          if (overwriteValue.key && overwriteValue.hasOwnProperty('value')) {
            let orgValue = _.get(bodyData, overwriteValue.key),
              newValue = overwriteValue.value;

            if (overwriteValue.overwrite === false) {
              newValue = orgValue + newValue;
            }

            bodyData = _.set(bodyData, overwriteValue.key, newValue);

            if (overwriteValue.remove === true) {
              bodyData = _.omit(bodyData, overwriteValue.key);
            }
          }
        });
        bodyString = JSON.stringify(bodyData, null, 4);

        // Handle {{$randomInt}},{{$randomCreditCardMask}} conversion from string to number
        find = ['"{{$randomInt}}"', '"{{$randomCreditCardMask}}"', '"{{$randomBankAccount}}"'];
        replace = ['{{$randomInt}}', '{{$randomCreditCardMask}}', '{{$randomBankAccount}}'];
        find.forEach(function (item, index) {
          let escapedFind = item.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
          bodyString = bodyString.replace(new RegExp(escapedFind, 'g'), replace[index]);
        });

        // Set testRequestBody.raw with stringified body
        testRequestBody.raw = bodyString;
      }
    }

    return testRequestBody;
  },

  /**
   * function to overwrite a request path variables with values defined by the postman testsuite
   * @param {*} requestPathVariables request Path Variables object
   * @param {*} operation openapi operation object
   * @param {*} operationItem - The operation item to get relevant information for the test generation
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @returns {*} Modified requestBody object
   */
  overwriteRequestPathByTests: function (requestPathVariables, operation, operationItem, options) {
    options = _.merge({}, defaultOptions, options);
    let testRequestPathVariables = JSON.parse(JSON.stringify(requestPathVariables)), // clone requestPathVariables
      testSuite = {},
      overwriteValues = [],
      testSuiteOverwriteRequest = {},
      testSuiteOverwriteRequests = [];

    // Check for test suite flag and if there is no requestPathVariables, abort early
    if (!options.testSuite && requestPathVariables.length > 0) {
      return requestPathVariables;
    }

    if (options.testSuite && options.testSuiteSettings) {
      testSuite = options.testSuiteSettings;
    }

    if (testSuite.overwriteRequests) {
      testSuiteOverwriteRequests = options.testSuiteSettings.overwriteRequests;
      // Get the overwrite setting for the operationId
      testSuiteOverwriteRequest = testSuiteOverwriteRequests.find((or) => {
        return or.openApiOperationId === operation.operationId;
      });

      if (testSuiteOverwriteRequest && testSuiteOverwriteRequest.overwriteRequestPathVariables) {
        overwriteValues = testSuiteOverwriteRequest.overwriteRequestPathVariables;

        // Overwrite value for path variable name
        testRequestPathVariables.forEach((pathVar, index) => {
          overwriteValues.forEach((overwriteValue) => {
            if (overwriteValue.key && pathVar.name && overwriteValue.key === pathVar.name &&
              overwriteValue.hasOwnProperty('value') && pathVar.schema) {
              let orgValue = (pathVar.schema.example ? pathVar.schema.example : null),
                newValue = overwriteValue.value;

              if (overwriteValue.overwrite === false) {
                newValue = orgValue + newValue;
              }
              pathVar.schema.type = 'string'; // Set schema as type string dynamic variable
              pathVar.schema.example = newValue;

              if (overwriteValue.remove === true) {
                testRequestPathVariables.splice(index, 1);
              }
            }
          });
        });
      }
    }
    return testRequestPathVariables;
  },

  /**
   * function to overwrite a request query params with values defined by the postman testsuite
   * @param {*} requestQueryParam request Query Param object
   * @param {*} operation openapi operation object
   * @param {*} operationItem - The operation item to get relevant information for the test generation
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @returns {*} Modified requestBody object
   */
  overwriteRequestQueryParamByTests: function (requestQueryParam, operation, operationItem, options) {
    options = _.merge({}, defaultOptions, options);
    let testRequestQueryParam = Object.assign({}, requestQueryParam), // clone requestQueryParam
      testSuite = {},
      overwriteValues = [],
      testSuiteOverwriteRequest = {},
      testSuiteOverwriteRequests = [];

    // Check for test suite flag and if there is no requestQueryParam.key, abort early
    if (!options.testSuite && !requestQueryParam.key) {
      return requestQueryParam;
    }

    if (options.testSuite && options.testSuiteSettings) {
      testSuite = options.testSuiteSettings;
    }

    if (testSuite.overwriteRequests) {
      testSuiteOverwriteRequests = options.testSuiteSettings.overwriteRequests;
      // Get the overwrite setting for the operationId
      testSuiteOverwriteRequest = testSuiteOverwriteRequests.find((or) => {
        return or.openApiOperationId === operation.operationId;
      });

      if (testSuiteOverwriteRequest && testSuiteOverwriteRequest.overwriteRequestQueryParams) {
        overwriteValues = testSuiteOverwriteRequest.overwriteRequestQueryParams;

        // Overwrite value for query param key
        overwriteValues.forEach((overwriteValue) => {
          if (overwriteValue.key && testRequestQueryParam.key && overwriteValue.key === testRequestQueryParam.key &&
            overwriteValue.hasOwnProperty('value') && testRequestQueryParam.hasOwnProperty('value')) {
            let orgValue = testRequestQueryParam.value,
              newValue = overwriteValue.value;

            if (overwriteValue.overwrite === false) {
              newValue = orgValue + newValue;
            }
            testRequestQueryParam.value = newValue;

            if (overwriteValue.remove === true) {
              testRequestQueryParam = {};
            }
          }
        });
      }
    }
    return testRequestQueryParam;
  },

  /**
   * function to overwrite a request header with values defined by the postman testsuite
   * @param {*} requestHeader request Header object
   * @param {*} operation openapi operation object
   * @param {*} operationItem - The operation item to get relevant information for the test generation
   * @param {object} options - a standard list of options that's globally passed around. Check options.js for more.
   * @returns {*} Modified requestBody object
   */
  overwriteRequestHeaderByTests: function (requestHeader, operation, operationItem, options) {
    options = _.merge({}, defaultOptions, options);
    let testRequestHeader = Object.assign({}, requestHeader), // clone requestHeader
      testSuite = {},
      overwriteValues = [],
      testSuiteOverwriteRequest = {},
      testSuiteOverwriteRequests = [];

    // Check for test suite flag and if there is no requestHeader.schema, abort early
    if (!options.testSuite && !requestHeader.schema) {
      return requestHeader;
    }

    if (options.testSuite && options.testSuiteSettings) {
      testSuite = options.testSuiteSettings;
    }

    if (testSuite.overwriteRequests) {
      testSuiteOverwriteRequests = options.testSuiteSettings.overwriteRequests;
      // Get the overwrite setting for the operationId
      testSuiteOverwriteRequest = testSuiteOverwriteRequests.find((or) => {
        return or.openApiOperationId === operation.operationId;
      });

      if (testSuiteOverwriteRequest && testSuiteOverwriteRequest.overwriteRequestHeaders) {
        overwriteValues = testSuiteOverwriteRequest.overwriteRequestHeaders;
        // Overwrite value for header name
        overwriteValues.forEach((overwriteValue) => {
          if (overwriteValue.key && testRequestHeader.name && overwriteValue.key === testRequestHeader.name &&
            overwriteValue.hasOwnProperty('value') && testRequestHeader.schema) {
            let orgValue = (testRequestHeader.schema.example ? testRequestHeader.schema.example : null),
              newValue = overwriteValue.value;

            if (overwriteValue.overwrite === false) {
              newValue = orgValue + newValue;
            }
            testRequestHeader.schema.example = newValue;

            if (overwriteValue.remove === true) {
              testRequestHeader = {};
            }
          }
        });
      }
    }
    return testRequestHeader;
  },

  /**
   * function to convert unsupported OpenAPI(3.0) properties to valid JSON schema properties
   * @param {*} oaSchema openAPI schema
   * @returns {*} Modified openAPI schema object that is compatible with JSON schema validation
   */
  convertUnsupportedJsonSchemaProperties: function (oaSchema) {
    let jsonSchema = JSON.parse(JSON.stringify(oaSchema)); // Deep copy of the schema object

    // Convert unsupported OpenAPI(3.0) properties to valid JSON schema properties
    // let jsonSchemaNotSupported = ['nullable', 'discriminator', 'readOnly', 'writeOnly', 'xml',
    //   'externalDocs', 'example', 'deprecated'];

    // Recurse through OpenAPI Schema
    const traverse = (obj) => {
      for (let k in obj) {
        if (obj.hasOwnProperty(k) && obj[k] && typeof obj[k] === 'object') {
          if (obj[k].nullable && obj[k].nullable === true) {
            // deletes nullable and adds "null" to type array if nullable is true
            let jsonTypes = [];
            jsonTypes.push(obj[k].type);
            jsonTypes.push('null');
            obj[k].type = jsonTypes;
            delete obj[k].nullable;
          }
          if (obj[k].maxItems && obj[k].maxItems === 2 && obj[k].type === 'array') {
            // deletes maxItems, which is added unwanted by resolveRefs() in combination with resolveFor CONVERSION
            // TODO find another way to respect the maxItems that might be passed by OpenAPI
            // Asked for assistance https://github.com/postmanlabs/openapi-to-postman/issues/367
            delete obj[k].maxItems;
          }
          traverse(obj[k]);
        }
      }
    };
    traverse(jsonSchema);
    return jsonSchema;
  },

  // TODO remove this function, use a reference to schemaUtils instead
  /**
   * @param {*} $ref reference object
   * @returns {Object} reference object from the saved components
   * @no-unit-tests
   */
  getRefObject: function($ref, components, options) {
    options = _.merge({}, defaultOptions, options);
    var refObj, savedSchema;

    savedSchema = $ref.split('/').slice(1).map((elem) => {
      // https://swagger.io/docs/specification/using-ref#escape
      // since / is the default delimiter, slashes are escaped with ~1
      return decodeURIComponent(
        elem
          .replace(/~1/g, '/')
          .replace(/~0/g, '~')
      );
    });
    // at this stage, savedSchema is [components, part1, parts]
    // must have min. 2 segments after "#/components"
    if (savedSchema.length < 3) {
      console.warn(`ref ${$ref} not found.`);
      return { value: `reference ${$ref} not found in the given specification` };
    }

    if (savedSchema[0] !== 'components' && savedSchema[0] !== 'paths') {
      console.warn(`Error reading ${$ref}. Can only use references from components and paths`);
      return { value: `Error reading ${$ref}. Can only use references from components and paths` };
    }

    // at this point, savedSchema is similar to ['components', 'schemas','Address']
    // components is actually components and paths (an object with components + paths as 1st-level-props)
    refObj = _.get(components, savedSchema);

    if (!refObj) {
      console.warn(`ref ${$ref} not found.`);
      return { value: `reference ${$ref} not found in the given specification` };
    }

    if (refObj.$ref) {
      return this.getRefObject(refObj.$ref, components, options);
    }

    return refObj;
  },

};
