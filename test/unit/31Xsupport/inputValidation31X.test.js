const { expect } = require('chai'),
  {
    validateSpec
  } = require('../../../lib/31XUtils/inputValidation31X'),
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
    const validationResult = validateSpec(correctMockedEntryWH, { includeWebhooks: true });
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with paths', function () {
    const validationResult = validateSpec(correctMockedEntryPath, { includeWebhooks: true });
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with components', function () {
    const validationResult = validateSpec(correctMockedEntryComponent, { includeWebhooks: true });
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with components webhooks y paths', function () {
    const validationResult = validateSpec(correctMockedEntry, { includeWebhooks: true });
    expect(validationResult.result).to.be.true;
  });

  it('should return false with an invalid input without openapi field', function () {
    const validationResult = validateSpec(incorrectMockedEntryNoOpenapi, { includeWebhooks: true });
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain a semantic version number of the OAS specification');
  });

  it('should return false with an invalid input without info field', function () {
    const validationResult = validateSpec(incorrectMockedEntryNoInfo, { includeWebhooks: true });
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain an Info Object for the meta-data of the API');
  });

  it('should return false with an invalid input without path components and webhooks', function () {
    const validationResult = validateSpec(incorrectMockedEntryNOPathsComponentsWebhooks, { includeWebhooks: true });
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain either Paths, Webhooks or Components sections');
  });

  it('should return false with a valid simple spec with only webhooks but include webhooks is false', function () {
    const validationResult = validateSpec(correctMockedEntryWH, { includeWebhooks: false });
    expect(validationResult.result).to.be.false;
  });

  it('should return true with a valid simple spec with paths and webhooks include webhooks is false', function () {
    const validationResult = validateSpec(correctMockedEntryPath, { includeWebhooks: false });
    expect(validationResult.result).to.be.true;
  });

  it('should return false with a valid simple spec with only components and include webhooks is false', function () {
    const validationResult = validateSpec(correctMockedEntryComponent, { includeWebhooks: false });
    expect(validationResult.result).to.be.false;
  });

  it('should return false with input without path components or webhooks include webhooks is false', function () {
    const validationResult = validateSpec(incorrectMockedEntryNOPathsComponentsWebhooks, { includeWebhooks: false });
    expect(validationResult.result).to.be.false;
  });

});
