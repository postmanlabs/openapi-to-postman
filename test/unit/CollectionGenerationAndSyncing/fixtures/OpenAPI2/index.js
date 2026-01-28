module.exports = {
  createNewRequestWithTags: require('./createNewRequestWithTags'),
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
  generateCollectionWithTypes: require('./shouldGenerateCollectionWithType')
};
