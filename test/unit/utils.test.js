'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { asArray, mergeConfig, points } = require('../../scripts/events/lib/utils');

test('mergeConfig deeply merges plain objects and replaces scalars', () => {
    const target = {
        cache: { enable: true },
        vendors: { fontawesome: 'cdn' },
        widgets: ['category']
    };
    const source = {
        cache: { enable: false },
        vendors: { mathjax: false },
        widgets: ['tag']
    };

    assert.deepEqual(mergeConfig(target, source), {
        cache: { enable: false },
        vendors: { fontawesome: 'cdn', mathjax: false },
        widgets: ['tag']
    });
});

test('asArray normalizes empty, scalar and array values', () => {
    assert.deepEqual(asArray(), []);
    assert.deepEqual(asArray('source/_data/styles.styl'), ['source/_data/styles.styl']);
    assert.deepEqual(asArray(['a', '', 'b']), ['a', 'b']);
});

test('inject points include view and style extension targets', () => {
    assert(points.views.includes('head'));
    assert(points.views.includes('bodyEnd'));
    assert(points.views.includes('comment'));
    assert.deepEqual(points.styles, ['variable', 'mixin', 'style']);
});
