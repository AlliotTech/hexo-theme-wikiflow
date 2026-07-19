'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
    enhanceImageMarkup,
    enhancePostImages
} = require('../../scripts/filters/content-images');

test('enhanceImageMarkup adds native lazy loading and async decoding', () => {
    assert.equal(
        enhanceImageMarkup('<p><img src="/photo.jpg" alt="Photo"></p>'),
        '<p><img src="/photo.jpg" alt="Photo" loading="lazy" decoding="async"></p>'
    );
});

test('enhanceImageMarkup preserves explicit image loading preferences', () => {
    assert.equal(
        enhanceImageMarkup('<img src="/hero.jpg" loading="eager" decoding="sync">'),
        '<img src="/hero.jpg" loading="eager" decoding="sync">'
    );
});

test('enhancePostImages updates rendered content and excerpt without touching other fields', () => {
    const post = {
        title: 'Example',
        content: '<p><img src="/content.jpg"></p>',
        excerpt: '<p><img src="/excerpt.jpg"></p>'
    };

    assert.deepEqual(enhancePostImages(post), {
        title: 'Example',
        content: '<p><img src="/content.jpg" loading="lazy" decoding="async"></p>',
        excerpt: '<p><img src="/excerpt.jpg" loading="lazy" decoding="async"></p>'
    });
});
