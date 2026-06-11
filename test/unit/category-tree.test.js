'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCategoryTree, toArray } = require('../../scripts/helpers/category-tree');

test('toArray supports Hexo-style query objects', () => {
    assert.deepEqual(toArray({ toArray: () => ['a', 'b'] }), ['a', 'b']);
});

test('buildCategoryTree groups posts under their deepest category', () => {
    const dev = { _id: 'dev', name: 'Dev', length: 1 };
    const js = { _id: 'js', name: 'JavaScript', parent: 'dev', length: 1 };
    const ops = { _id: 'ops', name: 'Ops', length: 1 };
    const posts = [
        {
            _id: 'post-js',
            title: 'JS Note',
            date: '2020-01-02',
            path: 'dev/js-note/',
            categories: [dev, js]
        },
        {
            _id: 'post-root',
            title: 'Root Note',
            date: '2020-01-01',
            path: 'root-note/',
            categories: []
        }
    ];

    const tree = buildCategoryTree([ops, js, dev], posts, 'post-js');
    const devBranch = tree.children.find(category => category._id === 'dev');
    const jsBranch = devBranch.children.find(category => category._id === 'js');

    assert.equal(tree.articles[0].title, 'Root Note');
    assert.equal(devBranch.selected, true);
    assert.equal(jsBranch.selected, true);
    assert.deepEqual(jsBranch.articles.map(post => post.title), ['JS Note']);
    assert.equal(tree.children[0]._id, 'dev');
    assert.equal(tree.children[1]._id, 'ops');
});
