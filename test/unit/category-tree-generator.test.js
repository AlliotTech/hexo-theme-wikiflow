'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { slimCategoryTree } = require('../../scripts/generators/category-tree');

test('external category tree payload only exposes fields used by the browser', () => {
    const tree = slimCategoryTree({
        _id: '_root',
        name: '_root',
        path: '',
        length: 1,
        children: [{
            _id: 'category-id',
            name: 'Guide',
            path: 'categories/guide/',
            length: 1,
            children: [],
            articles: [{
                _id: 'post-id',
                title: 'First Note',
                date: '2026-01-02T00:00:00.000Z',
                path: 'wiki/first-note/'
            }]
        }],
        articles: []
    });

    assert.deepEqual(tree, {
        children: [{
            name: 'Guide',
            path: 'categories/guide/',
            children: [],
            articles: [{ title: 'First Note', path: 'wiki/first-note/' }]
        }],
        articles: []
    });
});
