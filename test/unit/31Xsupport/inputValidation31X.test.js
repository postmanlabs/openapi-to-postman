const { expect } = require('chai'),
  {
    validateSpec
  } = require('../../../lib/31Xsupport/inputValidation31X'),
  correctMockedEntryWH = {
    openapi: '3.1.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    webhooks: {
    }
  },
  correctMockedEntryPath = {
    openapi: '3.1.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    paths: {
    }
  },
  correctMockedEntryComponent = {
    openapi: '3.1.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    components: {
    }
  },
  correctMockedEntry = {
    openapi: '3.1.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    paths: {
    },
    components: {
    },
    webhooks: {
    }
  },
  incorrectMockedEntryNoOpenapi = {
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    components: {
    }
  },
  incorrectMockedEntryNoInfo = {
    openapi: '3.1.0',
    paths: {
    },
    components: {
    },
    webhooks: {
    }
  },
  incorrectMockedEntryNOPathsComponentsWebhooks = {
    openapi: '3.1.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    }
  };

describe('validateSpec method', function () {
  it('should return true with a valid simple spec with webhooks', function () {
    const validationResult = validateSpec(correctMockedEntryWH);
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with paths', function () {
    const validationResult = validateSpec(correctMockedEntryPath);
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with components', function () {
    const validationResult = validateSpec(correctMockedEntryComponent);
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with components webhooks y paths', function () {
    const validationResult = validateSpec(correctMockedEntry);
    expect(validationResult.result).to.be.true;
  });

  it('should return false with an invalid input without openapi field', function () {
    const validationResult = validateSpec(incorrectMockedEntryNoOpenapi);
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain a semantic version number of the OAS specification');
  });

  it('should return false with an invalid input without info field', function () {
    const validationResult = validateSpec(incorrectMockedEntryNoInfo);
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

  it('should return false with an invalid input without path components and webhooks', function () {
    const validationResult = validateSpec(incorrectMockedEntryNOPathsComponentsWebhooks);
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain either Paths, Webhooks or Components sections');
  });

});
