const expect = require('chai').expect,
    Index = require('../../index.js'),
    fs = require('fs'),
    valid31xFolder = './test/data/valid_openapi31X';

describe('E2E flows to validate the convertion of OpenAPI 3.1 files', function () {
    it('Should convert a valid file into a PM Collection', function () {
        let fileContent = fs.readFileSync(valid31xFolder + '/petstore.json', 'utf8');
        Index.convert({ type: 'json', data: fileContent }, {}, (error, result) => {
            expect(error).to.be.null;
            expect(result.output[0].data.info.name).to.equal("Swagger Petstore")
            expect(result.output[0].data.item[0].name).to.equal("pets");
            expect(result.output[0].data.item[0].item.length).to.eql(3);

            //console.log(result.output[0].data.item[0].item[0].request.description);
            fs.writeFileSync(valid31xFolder + '/' + 'petstoreJson-collection.json',
                JSON.stringify(result.output[0].data));
        });
    });
});