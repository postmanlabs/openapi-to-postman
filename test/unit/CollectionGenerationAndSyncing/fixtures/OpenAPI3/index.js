module.exports = {
  createNewRequestWithTags: require('./createNewRequestWithTags'),
  createNewRequestWithNestedTags: require('./createNewRequestWithNestedTags'),
  createNewRequestWithPath: require('./createNewRequestWithPath'),
  addQueryParamsWithEnableOptionalParamsFalse: require('./addQueryParamsWithEnableOptionalParamsFalse'),
  addQueryParamsWithEnableOptionalParamsTrue: require('./addQueryParamsWithEnableOptionalParamsTrue'),
  removeQueryParam: require('./removeQueryParam'),
  renamePathParam: require('./renamePathParam'),
  moveRequestWithTags: require('./moveRequestWithTags'),
  addRequestHeader: require('./addRequestHeader'),
  removeRequestHeader: require('./removeRequestHeader'),
  renameRequestHeader: require('./renameRequestHeader'),
  addOptionalReqBodyParam: require('./addOptionalReqBodyParam'),
  addRequiredReqBodyParam: require('./addRequiredReqBodyParam'),
  removeReqBodyParam: require('./removeReqBodyParam'),
  renameReqBodyParam: require('./renameReqBodyParam'),
  validateAuthUponCollectionSyncing: require('./shouldSyncAuthUponCollectionSyncing'),
  validateBaseUrlUponCollectionSyncing: require('./shouldValidateBaseUrlUponCollectionSyncing'),
  shouldHandlePostmanVariablesInUrl: require('./shouldHandlePostmanVariablesInUrl'),
  generateCollectionWithTypes: require('./shouldGenerateCollectionWithType'),
  shouldPreserveParamValues: require('./shouldPreserveParamValues'),
  shouldPreserveAttributeValuesWhenSchemaBecomesEmptyObject:
    require('./shouldPreserveAttributeValuesWhenSchemaBecomesEmptyObject'),
  shouldUpdateValueWhenSchemaHasProperties: require('./shouldUpdateValueWhenSchemaHasProperties'),
  handle4xxand5xxAndDefaultResponseCode: require('./handle4xxand5xxAndDefaultResponseCode'),
  shouldAttachImplicitHeadersIfNotPresentInLatestCollection:
    require('./shouldAttachImplicitHeadersIfNotPresentInLatestCollection'),
  shouldSyncExamplesWhenSyncExamplesIsTrue: require('./shouldSyncExamplesWhenSyncExamplesIsTrue'),
  shouldNotSyncExamplesWhenSyncExamplesIsFalse: require('./shouldNotSyncExamplesWhenSyncExamplesIsFalse'),
  // Multi-file specification test cases
  multiFileSpecs: require('./multiFileSpecs')
};
