const deref = require('../../lib/deref');

var expect = require('chai').expect,
  fs = require('fs'),
  path = require('path'),
  VALID_OPENAPI_PATH = '../data/valid_openapi',
  VALID_OPENAPI_PATH_31 = '../data/valid_openapi31X',
  { getConcreteSchemaUtils } = require('./../../lib/common/versionUtils');

describe('[Github #309 - Should convert a path when is referenced ' +
  'from a different place than components]', function() {

  it('Should dereference root 3.0 file', function() {
    let referencedFromOutOfComponents =
        path.join(__dirname, VALID_OPENAPI_PATH + '/referencedFromOutOfComponents.yaml'),
      fileData = fs.readFileSync(referencedFromOutOfComponents, 'utf-8'),
      concreteUtils = getConcreteSchemaUtils(fileData),
      parsedContent = concreteUtils.parseSpec(fileData, {});
    const dereferencedSpec = deref.dereferenceRoot(parsedContent.openapi, {}),
      referencedPathContent = JSON.stringify(parsedContent.openapi['x-operations'].getAPet),
      referencedSchemaContent = JSON.stringify(parsedContent.openapi.placeOut.theSchema);

    expect(JSON.stringify(dereferencedSpec.paths['/pets/{petId}'])).to.equal(referencedPathContent);
    expect(JSON.stringify(dereferencedSpec.components.schemas.other)).to.equal(referencedSchemaContent);
  });

  it('Should dereference root 3.1 file using pathItems', function() {
    let referencedFromOutOfComponents =
        path.join(__dirname, VALID_OPENAPI_PATH_31 + '/yaml/referencedFromOutOfComponents.yaml'),
      fileData = fs.readFileSync(referencedFromOutOfComponents, 'utf-8'),
      concreteUtils = getConcreteSchemaUtils(fileData),
      parsedContent = concreteUtils.parseSpec(fileData, {});
    const dereferencedSpec = deref.dereferenceRoot(parsedContent.openapi, {}),
      referencedPathContent = JSON.stringify(parsedContent.openapi['x-operations'].getAPet),
      referencedSchemaContent = JSON.stringify(parsedContent.openapi.placeOut.theSchema);

    expect(JSON.stringify(dereferencedSpec.paths['/pets/{petId}'])).to.equal(referencedPathContent);
    expect(JSON.stringify(dereferencedSpec.components.schemas.other)).to.equal(referencedSchemaContent);
  });
});
