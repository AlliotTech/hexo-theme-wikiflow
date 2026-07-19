'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { getEmbedOptions } = require('../../scripts/helpers/embed');

test('getEmbedOptions applies safe theme defaults', () => {
    assert.deepEqual(getEmbedOptions({ embed: {} }, {
        title: 'Demo'
    }, 'Site title'), {
        src: './embed_page/',
        title: 'Demo',
        loading: 'lazy',
        referrerpolicy: 'strict-origin-when-cross-origin',
        sandbox: null,
        allow: '',
        allowfullscreen: false
    });
});

test('getEmbedOptions lets front matter override iframe attributes', () => {
    assert.deepEqual(getEmbedOptions({
        embed: {
            loading: 'lazy',
            referrerpolicy: 'no-referrer',
            sandbox: ['allow-scripts'],
            allow: 'clipboard-read',
            allowfullscreen: false
        }
    }, {
        iframe_url: 'https://example.com/demo',
        iframe_title: 'Interactive demo',
        iframe_loading: 'eager',
        iframe_referrerpolicy: 'origin',
        iframe_sandbox: ['allow-scripts', 'allow-same-origin'],
        iframe_allow: 'fullscreen',
        iframe_allowfullscreen: true
    }, 'Site title'), {
        src: 'https://example.com/demo',
        title: 'Interactive demo',
        loading: 'eager',
        referrerpolicy: 'origin',
        sandbox: 'allow-scripts allow-same-origin',
        allow: 'fullscreen',
        allowfullscreen: true
    });
});

test('getEmbedOptions rejects unsupported loading and referrer policy values', () => {
    const options = getEmbedOptions({
        embed: {
            loading: 'instant',
            referrerpolicy: 'unsafe-policy'
        }
    }, {}, 'Site title');

    assert.equal(options.loading, 'lazy');
    assert.equal(options.referrerpolicy, 'strict-origin-when-cross-origin');
    assert.equal(getEmbedOptions({ embed: { sandbox: 'off' } }, {}).sandbox, null);
    assert.equal(getEmbedOptions({ embed: { sandbox: true } }, {}).sandbox, '');
});
