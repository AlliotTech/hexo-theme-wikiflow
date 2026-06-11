'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { resolveVendor } = require('../../scripts/events/lib/vendors');

function fakeHexo(themeDir) {
    const warnings = [];

    return {
        config: { root: '/', url: 'https://example.com' },
        theme_dir: themeDir,
        log: {
            warn(message) {
                warnings.push(message);
            }
        },
        warnings
    };
}

const definition = {
    type: 'style',
    default: 'cdn',
    cdn: 'https://cdn.example.com/font.css',
    local: 'libs/font/font.css',
    integrity: 'sha256-test'
};

test('resolveVendor returns CDN config by default', () => {
    const hexo = fakeHexo('/missing');

    assert.deepEqual(resolveVendor(hexo, 'font', definition), {
        type: 'style',
        url: 'https://cdn.example.com/font.css',
        integrity: 'sha256-test'
    });
});

test('resolveVendor disables false-like values', () => {
    const hexo = fakeHexo('/missing');

    assert.equal(resolveVendor(hexo, 'font', definition, false), false);
    assert.equal(resolveVendor(hexo, 'font', definition, 'off'), false);
});

test('resolveVendor falls back to CDN when local asset is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wikiflow-vendor-'));
    const hexo = fakeHexo(tmp);

    assert.deepEqual(resolveVendor(hexo, 'font', definition, 'local'), {
        type: 'style',
        url: 'https://cdn.example.com/font.css',
        integrity: 'sha256-test'
    });
    assert.equal(hexo.warnings.length, 1);
});

test('resolveVendor uses local asset when it exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wikiflow-vendor-'));
    const asset = path.join(tmp, 'source', 'libs', 'font');
    const hexo = fakeHexo(tmp);

    fs.mkdirSync(asset, { recursive: true });
    fs.writeFileSync(path.join(asset, 'font.css'), '');

    assert.deepEqual(resolveVendor(hexo, 'font', definition, 'local'), {
        type: 'style',
        url: '/libs/font/font.css',
        integrity: 'sha256-test'
    });
    assert.equal(hexo.warnings.length, 0);
});
