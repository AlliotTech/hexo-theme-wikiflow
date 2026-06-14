'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { parseMeta, renderMeta } = require('../../scripts/meta');

test('parseMeta parses escaped separators', () => {
    assert.deepEqual(parseMeta('name="description"; content="a\\;b"; data-value="x\\=y"'), {
        name: 'description',
        content: 'a;b',
        'data-value': 'x=y'
    });
});

test('renderMeta escapes generated meta attributes', () => {
    const html = renderMeta({
        meta: ['name="description"; content="<script>alert(1)</script>"']
    });

    assert.match(html, /<meta /);
    assert.match(html, /name="description"/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;&#x2F;script&gt;/);
    assert.doesNotMatch(html, /content="<script>/);
});
