
const expect = require('chai').expect,
  {
    getJsonPointerRelationToRoot,
    concatJsonPointer,
    getKeyInComponents
  } = require('./../../lib/jsonPointer');

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

  it('should return ["schemas", "_folder_pet.yaml"] when the filename _folder_pet.yaml', function () {
    const result = getKeyInComponents(['path', 'schemas'], '_folder_pet.yaml', '3.0', '');
    expect(result).to.be.an('array').with.length(2);
    expect(result[0]).to.equal('schemas');
    expect(result[1]).to.equal('_folder_pet.yaml');
  });
});

describe('getJsonPointerRelationToRoot function', function () {
  it('should return "#/components/schemas/Pets.yaml" no local path and schema', function () {
    let res = getJsonPointerRelationToRoot(
      'Pets.yaml',
      ['schemas', 'Pets.yaml']
    );

    expect(res).to.equal('#/components/schemas/Pets.yaml');
  });

  it('should return "#/components/schemas/hello.yaml" no local path and schema', function () {
    let res = getJsonPointerRelationToRoot(
      'hello.yaml#/definitions/world',
      ['schemas', 'hello.yaml']
    );

    expect(res).to.equal('#/components/schemas/hello.yaml');
  });

  it('should return "#/components/schemas/Error" no file path', function () {
    let res = getJsonPointerRelationToRoot(
      '#/components/schemas/Error',
      ['components', 'schemas', 'Error']
    );

    expect(res).to.equal('#/components/schemas/Error');
  });
});

describe('concatJsonPointer function ', function () {
  it('should return "#/components/schemas/Pets.yaml" no local path and schema', function () {
    let res = concatJsonPointer(
      ['schemas', 'Pets.yaml'],
      '/components'
    );

    expect(res).to.equal('#/components/schemas/Pets.yaml');
  });

  it('should return "#/components/schemas/other_Pets.yaml" no local path and schema folder in filename', function () {
    let res = concatJsonPointer(
      ['schemas', 'other_Pets.yaml'],
      '/components'
    );

    expect(res).to.equal('#/components/schemas/other_Pets.yaml');
  });

  it('should return "#/components/schemas/some_Pet" no local path and schema folder in filename', function () {
    let res = concatJsonPointer(
      ['schemas', 'some_Pet.yaml'],
      '/components'
    );
    expect(res).to.equal('#/components/schemas/some_Pet.yaml');
  });

  it('should return "#/components/schemas/hello.yaml" no local path and schema', function () {
    let res = concatJsonPointer(
      ['schemas', 'hello.yaml'],
      '/components'
    );

    expect(res).to.equal('#/components/schemas/hello.yaml');
  });

  it('should return "#/components/schemas/_Pets.yaml" no local path and schema', function () {
    let res = concatJsonPointer(
      ['schemas', '_Pets.yaml'],
      '/components'
    );
    expect(res).to.equal('#/components/schemas/_Pets.yaml');
  });

});
