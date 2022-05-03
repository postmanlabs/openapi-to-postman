
const expect = require('chai').expect,
  { JsonPointerEncodeAndReplace,
    getJsonPointerRelationToRoot,
    concatJsonPointer,
    getKeyInComponents } = require('./../../lib/jsonPointer');

describe('getKeyInComponents function', function () {
  it('should return ["components", "schemas", "pet.yaml"] when is pointing the entire file', function () {
    const result = getKeyInComponents('schemas', 'pet.yaml');
    expect(result.length).to.equal(3);
    expect(result[0]).to.equal('components');
    expect(result[1]).to.equal('schemas');
    expect(result[2]).to.equal('pet.yaml');
  });

  it('should return ["components", "schemas", "pet.yaml", "definitions", "word"] when is pointing to a local ref',
    function () {
      const result = getKeyInComponents('schemas', 'pet.yaml', '/definitions/world');
      expect(result.length).to.equal(5);
      expect(result[0]).to.equal('components');
      expect(result[1]).to.equal('schemas');
      expect(result[2]).to.equal('pet.yaml');
      expect(result[3]).to.equal('definitions');
      expect(result[4]).to.equal('world');
    });

  it('should return ["components", "schemas", "folder/pet.yaml"] when there is an scaped slash', function () {
    const result = getKeyInComponents('schemas', 'folder~1pet.yaml');
    expect(result.length).to.equal(3);
    expect(result[0]).to.equal('components');
    expect(result[1]).to.equal('schemas');
    expect(result[2]).to.equal('folder/pet.yaml');
  });
});


describe('getJsonPointerRelationToRoot function', function () {
  it('should return "#/components/schemas/Pets.yaml" no local path and schema', function () {
    let res = getJsonPointerRelationToRoot(JsonPointerEncodeAndReplace, 'Pets.yaml', 'Pets.yaml', 'schemas');
    expect(res).to.equal('#/components/schemas/Pets.yaml');
  });
  it('should return "#/components/schemas/hello.yaml/definitions/world" no local path and schema', function () {
    let res = getJsonPointerRelationToRoot(JsonPointerEncodeAndReplace, 'hello.yaml', 'hello.yaml#/definitions/world',
      'schemas');
    expect(res).to.equal('#/components/schemas/hello.yaml/definitions/world');
  });
  it('should return "#/components/schemas/Error" no file path', function () {
    let res = getJsonPointerRelationToRoot(JsonPointerEncodeAndReplace, '', '#/components/schemas/Error', 'schemas');
    expect(res).to.equal('#/components/schemas/Error');
  });
});

describe('concatJsonPointer function ', function () {
  it('should return "#/components/schemas/Pets.yaml" no local path and schema', function () {
    let res = concatJsonPointer(JsonPointerEncodeAndReplace, 'Pets.yaml', 'schemas');
    expect(res).to.equal('#/components/schemas/Pets.yaml');
  });

  it('should return "#/components/schemas/other~1Pets.yaml" no local path and schema folder in filename', function () {
    let res = concatJsonPointer(JsonPointerEncodeAndReplace, 'other/Pets.yaml', 'schemas');
    expect(res).to.equal('#/components/schemas/other~1Pets.yaml');
  });
  it('should return "#/components/schemas/some~1Pet" no local path and schema folder in filename', function () {
    let res = concatJsonPointer(JsonPointerEncodeAndReplace, 'some/Pet.yaml', 'schemas');
    expect(res).to.equal('#/components/schemas/some~1Pet.yaml');
  });
  it('should return "#/components/schemas/hello.yaml/definitions/world" no local path and schema', function () {
    let res = concatJsonPointer(JsonPointerEncodeAndReplace, 'hello.yaml', 'schemas', '/definitions/world');
    expect(res).to.equal('#/components/schemas/hello.yaml/definitions/world');
  });

  it('should return "#/components/schemas/~1Pets.yaml" no local path and schema', function () {
    let res = concatJsonPointer(JsonPointerEncodeAndReplace, '/Pets.yaml', 'schemas');
    expect(res).to.equal('#/components/schemas/~1Pets.yaml');
  });

});
