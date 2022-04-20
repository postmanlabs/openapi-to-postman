let expect = require('chai').expect,
  { DFS } = require('./../../lib/dfs');

describe('DFS Algorithm ', function () {
  it('should return non repeated nodes', function () {
    let algorithm = new DFS(),
      d = {
        name: 'd',
        children: []
      },
      c = {
        name: 'c',
        children: []
      },
      b = {
        name: 'b',
        children: [c]
      },
      root = {
        name: 'a',
        children: [d, c, b]
      },
      { traverseOrder, missing } = algorithm.traverse(root, (node) => {
        return { graphAdj: node.children, missingNodes: [] };
      });
    expect(traverseOrder.length).to.equal(4);
    expect(traverseOrder[0].name).to.equal('a');
    expect(traverseOrder[1].name).to.equal('b');
    expect(traverseOrder[2].name).to.equal('c');
    expect(traverseOrder[3].name).to.equal('d');
    expect(missing.length).to.equal(0);

  });

  it('should return non repeated nodes and missing nodes', function () {
    let algorithm = new DFS(),
      d = {
        name: 'd',
        children: []
      },
      c = {
        name: 'c',
        children: []
      },
      b = {
        name: 'b',
        children: ['c']
      },
      root = {
        name: 'a',
        children: ['d', 'c', 'b', 'e']
      },
      allData = [root, b, c, d],
      { traverseOrder, missing } = algorithm.traverse(root, (node) => {
        let missing = [],
          foundArray = [];
        node.children.forEach((child) => {
          let found = allData.find((item) => {
            return child === item.name;
          });
          if (found) {
            foundArray.push(found);
          }
          else {
            missing.push(child);
          }
        });
        return { graphAdj: foundArray, missingNodes: missing };
      });
    expect(traverseOrder.length).to.equal(4);
    expect(traverseOrder[0].name).to.equal('a');
    expect(traverseOrder[1].name).to.equal('b');
    expect(traverseOrder[2].name).to.equal('c');
    expect(traverseOrder[3].name).to.equal('d');
    expect(missing.length).to.equal(1);
    expect(missing[0]).to.equal('e');

  });

});
