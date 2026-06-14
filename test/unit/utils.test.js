'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const runConfig = require('../../scripts/events/lib/config');
const { asArray, mergeConfig, points } = require('../../scripts/events/lib/utils');

test('mergeConfig deeply merges plain objects and replaces scalars', () => {
    const target = {
        profile: { enabled: true },
        vendors: { fontawesome: 'cdn' },
        widgets: ['category']
    };
    const source = {
        profile: { avatar: '/avatar.png' },
        vendors: { mathjax: false },
        widgets: ['tag']
    };

    assert.deepEqual(mergeConfig(target, source), {
        profile: { enabled: true, avatar: '/avatar.png' },
        vendors: { fontawesome: 'cdn', mathjax: false },
        widgets: ['tag']
    });
});

test('runConfig replaces menu instead of merging default links', () => {
    const hexo = {
        theme: {
            config: {
                menu: {
                    Home: '/',
                    Archives: '/archives',
                    Categories: '/categories'
                }
            }
        },
        config: {
            theme_config: {
                menu: {
                    Docs: '/docs'
                }
            }
        }
    };

    assert.deepEqual(runConfig(hexo).menu, {
        Docs: '/docs'
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
