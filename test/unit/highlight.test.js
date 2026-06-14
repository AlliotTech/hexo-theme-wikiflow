'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    completeThemeColors,
    parseColor,
    transformHighlightCss
} = require('../../scripts/events/lib/highlight');

test('transformHighlightCss rewrites highlight.js selectors for Hexo highlight markup', () => {
    const transformed = transformHighlightCss(`
.hljs {
  color: #222;
  background: #fff;
}
.hljs-string, .hljs .hljs-title.function_ {
  color: #080;
}
pre code.hljs {
  display: block;
}
`, 'unit.css');

    assert.match(transformed, /\.highlight \.code \.string/);
    assert.match(transformed, /\.highlight \.code \.title\.function_/);
    assert.doesNotMatch(transformed, /\.hljs-string/);
    assert.doesNotMatch(transformed, /code\.hljs/);
});

test('parseColor handles hex and rgb colors', () => {
    assert.deepEqual(parseColor('#abc'), { red: 170, green: 187, blue: 204 });
    assert.deepEqual(parseColor('rgb(1, 2, 3)'), { red: 1, green: 2, blue: 3 });
    assert.equal(parseColor('var(--color)'), null);
});

test('completeThemeColors derives gutter colors', () => {
    const colors = completeThemeColors({
        background: '#ffffff',
        foreground: '#000000'
    });

    assert.equal(colors.gutter_background, '#e0e0e0');
    assert.equal(colors.gutter_foreground, '#595959');
});
