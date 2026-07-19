'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const engine = require('../../source/js/insight-engine');

test('search keeps only the highest ranked document results', () => {
    const posts = Array.from({ length: 100 }, (_, index) => ({
        title: index < 5 ? `Needle ${index}` : `Post ${index}`,
        text: `Needle body ${index}`,
        path: `post-${index}/`
    }));
    const index = engine.createSearchIndex({ pages: [], posts });
    const result = engine.search(index, engine.parseKeywords('needle'), {
        documents: 10,
        taxonomies: 5
    });

    assert.equal(result.posts.length, 10);
    assert.deepEqual(
        result.posts.slice(0, 5).map(entry => entry.item.title),
        ['Needle 0', 'Needle 1', 'Needle 2', 'Needle 3', 'Needle 4']
    );
});

test('search does not mutate source entries with normalization caches', () => {
    const post = { title: 'Example', text: 'Searchable body', path: 'example/' };
    const index = engine.createSearchIndex({ pages: [], posts: [post] });

    engine.search(index, engine.parseKeywords('searchable'));

    assert.deepEqual(Object.keys(post).sort(), ['path', 'text', 'title']);
});

test('taxonomy extraction safely supports object-like names', () => {
    const index = engine.createSearchIndex({
        pages: [],
        posts: [{
            title: 'Example',
            text: '',
            path: 'example/',
            tags: [
                { name: '__proto__', slug: 'prototype', permalink: '/tags/prototype/' },
                { name: 'normal', slug: 'normal', permalink: '/tags/normal/' }
            ]
        }]
    });

    assert.deepEqual(index.tags.map(tag => tag.name), ['__proto__', 'normal']);
});
