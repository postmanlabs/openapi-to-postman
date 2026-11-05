const { expect } = require('chai'),
  {
    validateSpec
  } = require('../../../lib/32XUtils/inputValidation32X'),
  correctMockedEntryWH = {
    openapi: '3.2.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    webhooks: {
    }
  },
  correctMockedEntryPath = {
    openapi: '3.2.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    paths: {
    }
  },
  correctMockedEntryComponent = {
    openapi: '3.2.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    },
    components: {
    }
  },
  correctMockedEntry = {
    openapi: '3.2.0',
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
    openapi: '3.2.0',
    paths: {
    },
    components: {
    },
    webhooks: {
    }
  },
  incorrectMockedEntryNOPathsComponentsWebhooks = {
    openapi: '3.2.0',
    info: {
      title: 'Webhook Example',
      version: '1.0.0'
    }
  };

describe('validateSpec method (3.2)', function () {
  it('should return true with a valid simple spec with webhooks', function () {
    const validationResult = validateSpec(correctMockedEntryWH, { includeWebhooks: true });
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with paths', function () {
    const validationResult = validateSpec(correctMockedEntryPath, { includeWebhooks: true });
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid simple spec with components only', function () {
    const validationResult = validateSpec(correctMockedEntryComponent, { includeWebhooks: true });
    expect(validationResult.result).to.be.true;
  });

  it('should return true with a valid spec containing paths, components and webhooks', function () {
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
    expect(validationResult.code).to.equal('SPEC_INFO_MISSING');
  });

  it('should return false with an invalid input without path components and webhooks', function () {
    const validationResult = validateSpec(incorrectMockedEntryNOPathsComponentsWebhooks, { includeWebhooks: true });
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain either Paths, Webhooks or Components sections');
    expect(validationResult.code).to.equal('SPEC_PATHS_MISSING');
  });

  it('should return false with a valid simple spec with only webhooks but include webhooks is false', function () {
    const validationResult = validateSpec(correctMockedEntryWH, { includeWebhooks: false });
    expect(validationResult.result).to.be.false;
  });

  it('should return true with a valid simple spec with paths and include webhooks is false', function () {
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

  it('should return false with info title missing code when info title is missing', function () {
    const validationResult = validateSpec({ openapi: '3.2.0', info: { version: '1' }, paths: {} }, {});
    expect(validationResult.result).to.be.false;
    expect(validationResult.code).to.equal('SPEC_INFO_TITLE_MISSING');
  });

  it('should return false with info version missing code when info version is missing', function () {
    const validationResult = validateSpec({ openapi: '3.2.0', info: { title: 'a' }, paths: {} }, {});
    expect(validationResult.result).to.be.false;
    expect(validationResult.code).to.equal('SPEC_INFO_VERSION_MISSING');
  });

  it('should return false with paths missing code when paths is missing and webhooks are not included', function () {
    const validationResult = validateSpec(incorrectMockedEntryNOPathsComponentsWebhooks, { includeWebhooks: false });
    expect(validationResult.result).to.be.false;
    expect(validationResult.reason)
      .to.equal('Specification must contain Paths Object for the available operational paths');
    expect(validationResult.code).to.equal('SPEC_PATHS_MISSING');
  });

  it('should return false with swagger version invalid code when openapi is missing and swagger is present',
    function () {
      const validationResult = validateSpec({ swagger: 2, info: { title: 'a', version: '1' }, paths: {} }, {});
      expect(validationResult.result).to.be.false;
      expect(validationResult.reason)
        .to.equal('Specification must contain a semantic version number of the OAS specification');
      expect(validationResult.code).to.equal('SPEC_SWAGGER_VERSION_INVALID');
    });

  it('should return false without a code when openapi and swagger are missing', function () {
    const validationResult = validateSpec(incorrectMockedEntryNoOpenapi, { includeWebhooks: true });
    expect(validationResult.result).to.be.false;
    expect(validationResult).to.not.have.property('code');
  });
});
