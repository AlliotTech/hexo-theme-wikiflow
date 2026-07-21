'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const yaml = require('js-yaml');
const { patchArchiveMonthCountsConfig } = require('../../tools/verify-hexo8-site');

test('archive pagination fixture patch supports LF and CRLF configs', () => {
    const config = [
        'archive_generator:',
        '  per_page: 10',
        '  yearly: true'
    ].join('\n');

    for (const lineEnding of ['\n', '\r\n']) {
        const source = config.replaceAll('\n', lineEnding);
        const patched = patchArchiveMonthCountsConfig(source);

        assert.equal(yaml.load(patched).archive_generator.per_page, 5);
    }
});
