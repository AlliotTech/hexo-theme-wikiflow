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
    assert.match(banner, /fetchpriority=/u);
    assert.match(gallery, /<img[\s\S]*?alt=/u);
    assert.match(thumbnail, /<img[\s\S]*?alt=/u);
    assert.doesNotMatch(thumbnail, /<span[\s\S]*?alt=/u);
    assert.match(iframe, /<iframe[\s\S]*?title=/u);
});

test('clickable theme actions use native buttons', () => {
    const share = fs.readFileSync(path.join(layoutRoot, '_third-party/share/default.ejs'), 'utf8');
    const sidebar = fs.readFileSync(path.join(layoutRoot, '_partials/sidebar.ejs'), 'utf8');
    const category = fs.readFileSync(path.join(layoutRoot, '_partials/widgets/category.ejs'), 'utf8');

    assert.match(share, /^<button[^\n]*class="article-share-link"/u);
    assert.doesNotMatch(share, /<a[^>]*class="article-share-link"/u);
    assert.match(sidebar, /<button[^>]*id="toTop"/u);
    assert.match(category, /<button[^>]*id="allExpand"/u);
    assert.match(category, /<button[^>]*data-role="directory"/u);
    assert.doesNotMatch(category, /<a[^>]*data-role="directory"/u);
});

test('theme respects reduced-motion preferences', () => {
    const baseStyles = fs.readFileSync(path.join(themeRoot, 'source/css/_common/scaffolding/base.styl'), 'utf8');

    assert.match(baseStyles, /prefers-reduced-motion:\s*reduce/u);
});

test('footer does not hardcode a content license', () => {
    const footer = fs.readFileSync(path.join(layoutRoot, '_partials/footer.ejs'), 'utf8');

    assert.doesNotMatch(footer, /creativecommons\.org\/licenses\/by-nc-nd/u);
    assert.doesNotMatch(footer, /i\.creativecommons\.org/u);
});

test('document head includes canonical metadata without restricting zoom', () => {
    const head = fs.readFileSync(path.join(layoutRoot, '_partials/head/head.ejs'), 'utf8');

    assert.match(head, /rel="canonical"/u);
    assert.match(head, /name="description"/u);
    assert.match(head, /application\/ld\+json/u);
    assert.doesNotMatch(head, /maximum-scale/u);
});

test('third-party integrations use external scripts and current Google Analytics', () => {
    const analytics = fs.readFileSync(path.join(layoutRoot, '_third-party/analytics/google-analytics.ejs'), 'utf8');
    const disqus = fs.readFileSync(path.join(layoutRoot, '_third-party/comments/disqus.ejs'), 'utf8');

    assert.match(analytics, /googletagmanager\.com\/gtag\/js/u);
    assert.match(analytics, /js\/analytics\.js/u);
    assert.doesNotMatch(analytics, /google-analytics\.com\/analytics\.js/u);
    assert.match(disqus, /js\/disqus\.js/u);
    assert.doesNotMatch(disqus, /this\.page\.(?:url|identifier)\s*=\s*'/u);
});
