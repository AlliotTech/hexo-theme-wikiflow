'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { buildCategoryGroups, buildCategoryTree, toArray } = require('../../scripts/helpers/category-tree');

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
    assert.equal(tree.length, 2);
    assert.equal(devBranch.length, 1);
    assert.equal(devBranch.selected, true);
    assert.equal(jsBranch.selected, true);
    assert.equal(jsBranch.path, '');
    assert.deepEqual(jsBranch.articles.map(post => post.title), ['JS Note']);
    assert.equal(tree.children[0]._id, 'dev');
    assert.equal(tree.children[1]._id, 'ops');
});

test('buildCategoryGroups returns top-level browsing groups', () => {
    const dev = { _id: 'dev', name: 'Dev', length: 2, path: 'categories/dev/' };
    const js = { _id: 'js', name: 'JavaScript', parent: 'dev', length: 1, path: 'categories/dev/js/' };
    const css = { _id: 'css', name: 'CSS', parent: 'dev', length: 1, path: 'categories/dev/css/' };
    const postA = { _id: 'post-a', title: 'A', date: '2020-01-01', path: 'a/' };
    const postB = { _id: 'post-b', title: 'B', date: '2020-01-03', path: 'b/' };
    dev.posts = [postA, postB];

    const groups = buildCategoryGroups([js, dev, css], { childLimit: 1, postLimit: 1 });

    assert.equal(groups.length, 1);
    assert.equal(groups[0].name, 'Dev');
    assert.deepEqual(groups[0].children.map(category => category.name), ['CSS']);
    assert.deepEqual(groups[0].posts.map(post => post.title), ['B']);
});
