
const expect = require('chai').expect,
  { jsonPointerEncodeAndReplace,
    getJsonPointerRelationToRoot,
    concatJsonPointer,
    getKeyInComponents } = require('./../../lib/jsonPointer');

describe('getKeyInComponents function', function () {
  it('should return [] when is pointing to an element in components', function () {
    const result = getKeyInComponents(['components', 'schemas'], 'pet.yaml', '', '3.0');
    expect(result).to.be.an('array').with.length(0);
  });

  it('should return [] when is pointing to a local ref in components',
    function () {
      const result = getKeyInComponents(['components', 'schemas'], 'pet.yaml', '/definitions/world', '3.0');
      expect(result).to.be.an('array').with.length(0);
    });

  it('should return ["schemas", "folder/pet.yaml"] when there is an scaped slash', function () {
    const result = getKeyInComponents(['path', 'schemas'], 'folder~1pet.yaml', '', '3.0');
    expect(result).to.be.an('array').with.length(2);
    expect(result[0]).to.equal('schemas');
  });
});


describe('getJsonPointerRelationToRoot function', function () {
  it('should return "#/components/schemas/Pets.yaml" no local path and schema', function () {
    let res = getJsonPointerRelationToRoot(
      jsonPointerEncodeAndReplace,
      'Pets.yaml',
      ['schemas', 'Pets.yaml']
    );
    expect(res).to.equal('#/components/schemas/Pets.yaml');
  });
  it('should return "#/components/schemas/hello.yaml" no local path and schema', function () {
    let res = getJsonPointerRelationToRoot(
      jsonPointerEncodeAndReplace,
      'hello.yaml#/definitions/world',
      ['schemas', 'hello.yaml']
    );
    expect(res).to.equal('#/components/schemas/hello.yaml');
  });
  it('should return "#/components/schemas/Error" no file path', function () {
    let res = getJsonPointerRelationToRoot(
      jsonPointerEncodeAndReplace,
      '#/components/schemas/Error',
      ['components', 'schemas', 'Error']
    );
    expect(res).to.equal('#/components/schemas/Error');
  });
});

describe('concatJsonPointer function ', function () {
  it('should return "#/components/schemas/Pets.yaml" no local path and schema', function () {
    let res = concatJsonPointer(
      jsonPointerEncodeAndReplace,
      ['schemas', 'Pets.yaml'],
      '/components'
    );
    expect(res).to.equal('#/components/schemas/Pets.yaml');
  });

  it('should return "#/components/schemas/other~1Pets.yaml" no local path and schema folder in filename', function () {
    let res = concatJsonPointer(
      jsonPointerEncodeAndReplace,
      ['schemas', 'other/Pets.yaml'],
      '/components'
    );
    expect(res).to.equal('#/components/schemas/other~1Pets.yaml');
  });
  it('should return "#/components/schemas/some~1Pet" no local path and schema folder in filename', function () {
    let res = concatJsonPointer(
      jsonPointerEncodeAndReplace,
      ['schemas', 'some/Pet.yaml'],
      '/components'
    );
    expect(res).to.equal('#/components/schemas/some~1Pet.yaml');
  });
  it('should return "#/components/schemas/hello.yaml" no local path and schema', function () {
    let res = concatJsonPointer(
      jsonPointerEncodeAndReplace,
      ['schemas', 'hello.yaml'],
      '/components'
    );
    expect(res).to.equal('#/components/schemas/hello.yaml');
  });

  it('should return "#/components/schemas/~1Pets.yaml" no local path and schema', function () {
    let res = concatJsonPointer(
      jsonPointerEncodeAndReplace,
      ['schemas', '/Pets.yaml'],
      '/components'
    );
    expect(res).to.equal('#/components/schemas/~1Pets.yaml');
  });

});
