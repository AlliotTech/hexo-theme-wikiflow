'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldLoadMathJax } = require('../../scripts/helpers/mathjax');

test('MathJax is disabled by default and can be enabled per page', () => {
    assert.equal(shouldLoadMathJax({}, {}), false);
    assert.equal(shouldLoadMathJax({ mathjax: false }, { mathjax: true }), true);
});

test('page configuration overrides the global MathJax setting', () => {
    assert.equal(shouldLoadMathJax({ mathjax: true }, {}), true);
    assert.equal(shouldLoadMathJax({ mathjax: true }, { mathjax: false }), false);
});
