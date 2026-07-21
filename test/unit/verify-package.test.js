'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { parsePackResult } = require('../../tools/verify-package');

test('package verifier accepts array and object npm pack results', () => {
    const pack = {
        files: [
            { path: 'package.json' }
        ]
    };

    assert.deepEqual(parsePackResult(JSON.stringify([pack])), pack);
    assert.deepEqual(parsePackResult(JSON.stringify(pack)), pack);
});
