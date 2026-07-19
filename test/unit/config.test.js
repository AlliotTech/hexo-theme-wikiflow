'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const themeRoot = path.resolve(__dirname, '../..');

function readYaml(relativePath) {
    return yaml.load(fs.readFileSync(path.join(themeRoot, relativePath), 'utf8'));
}

function flattenKeys(value, prefix = '') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return prefix ? [prefix] : [];
    }

    return Object.entries(value).flatMap(([key, child]) => {
        const next = prefix ? `${prefix}.${key}` : key;
        const nested = flattenKeys(child, next);
        return nested.length ? nested : [next];
    });
}

test('theme YAML files parse successfully', () => {
    for (const file of ['_config.yml', '_config.yml.example', '_vendors.yml']) {
        assert.doesNotThrow(() => readYaml(file), `${file} should contain valid YAML`);
    }
});

test('theme defaults use packaged assets and opt-in heavyweight integrations', () => {
    const config = readYaml('_config.yml');

    assert.equal(config.favicon, '/css/images/favicon.ico');
    assert.equal(config.logo.url, '/css/images/logo.png');
    assert.equal(config.plugins.mathjax, false);
    assert.equal(config.footer.license.enable, false);
    assert.equal(config.vendors.fontawesome, false);
});

test('language files expose the same keys as English', () => {
    const languageDir = path.join(themeRoot, 'languages');
    const files = fs.readdirSync(languageDir).filter(file => /\.ya?ml$/u.test(file)).sort();
    const expectedKeys = flattenKeys(readYaml('languages/en.yml')).sort();

    for (const file of files) {
        const actualKeys = flattenKeys(readYaml(path.join('languages', file))).sort();
        assert.deepEqual(actualKeys, expectedKeys, `${file} has missing or unexpected translation keys`);
    }
});
