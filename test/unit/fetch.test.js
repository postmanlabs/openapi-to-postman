let expect = require('chai').expect,
  { fetchURLs } = require('../../lib/fetchContentFile');


describe('fetchURLs function ', async function () {
  it('should download urls with node fetch', async function () {
    const res = await fetchURLs(['https://jsonplaceholder.typicode.com/posts',
      'https://jsonplaceholder.typicode.com/albums']);
    expect(res).to.not.be.undefined;
    expect(res.length).to.equal(2);
    expect(res[0].content).to.not.be.undefined;
    expect(res[1].content).to.not.be.undefined;
  });

  it('should download urls with custom function', async function () {
    const res = await fetchURLs(['https://jsonplaceholder.typicode.com/posts'],
      '', () => {
        return Promise.resolve({
          text: () => { return Promise.resolve('text'); }
        });
      });

    expect(res).to.not.be.undefined;
    expect(res.length).to.equal(1);
    expect(res[0].content).to.equal('text');
  });

});
