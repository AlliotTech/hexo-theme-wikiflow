'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const themeRoot = path.resolve(__dirname, '../..');
const layoutRoot = path.join(themeRoot, 'layout');

function layoutFiles(directory = layoutRoot) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? layoutFiles(target) : [target];
    }).filter(file => file.endsWith('.ejs'));
}

test('dynamic attribute values use escaped EJS output', () => {
    const unsafeAttribute = /(?:href|src|integrity|data-url)="[^"]*<%-/u;

    for (const file of layoutFiles()) {
        const template = fs.readFileSync(file, 'utf8');
        assert.doesNotMatch(
            template,
            unsafeAttribute,
            `${path.relative(themeRoot, file)} contains unescaped output in an HTML attribute`
        );
    }
});

test('media templates provide accessible image and iframe text alternatives', () => {
    const banner = fs.readFileSync(path.join(layoutRoot, '_partials/post/banner.ejs'), 'utf8');
    const gallery = fs.readFileSync(path.join(layoutRoot, '_partials/post/gallery.ejs'), 'utf8');
    const thumbnail = fs.readFileSync(path.join(layoutRoot, '_partials/post/thumbnail.ejs'), 'utf8');
    const iframe = fs.readFileSync(path.join(layoutRoot, '_partials/page/iframe.ejs'), 'utf8');

    assert.match(banner, /<img[\s\S]*?alt=/u);
    assert.match(gallery, /<img[\s\S]*?alt=/u);
    assert.match(thumbnail, /<img[\s\S]*?alt=/u);
    assert.doesNotMatch(thumbnail, /<span[\s\S]*?alt=/u);
    assert.match(iframe, /<iframe[\s\S]*?title=/u);
});
