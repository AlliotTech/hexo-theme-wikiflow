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
    const article = fs.readFileSync(path.join(layoutRoot, '_partials/post/article.ejs'), 'utf8');
    const scripts = fs.readFileSync(path.join(layoutRoot, '_scripts/index.ejs'), 'utf8');
    const sidebar = fs.readFileSync(path.join(layoutRoot, '_partials/sidebar.ejs'), 'utf8');
    const category = fs.readFileSync(path.join(layoutRoot, '_partials/widgets/category.ejs'), 'utf8');

    assert.match(share, /^<button[^\n]*class="article-share-link"/u);
    assert.doesNotMatch(share, /<a[^>]*class="article-share-link"/u);
    assert.doesNotMatch(share, /<script/u);
    assert.match(article, /partial\('_third-party\/share\/index'/u);
    assert.match(scripts, /js\('js\/share'\)/u);
    assert.match(sidebar, /<button[^>]*id="toTop"/u);
    assert.match(category, /<button[^>]*id="allExpand"/u);
    assert.match(category, /<button[^>]*data-role="directory"/u);
    assert.doesNotMatch(category, /<a[^>]*data-role="directory"/u);
});

test('insight search loads its engine before the DOM controller', () => {
    const insight = fs.readFileSync(path.join(layoutRoot, '_partials/search/insight.ejs'), 'utf8');
    const main = fs.readFileSync(path.join(themeRoot, 'source/js/main.js'), 'utf8');

    assert.match(insight, /ENGINE_URL/u);
    assert.match(main, /config\.ENGINE_URL/u);
    assert.match(main, /config\.SCRIPT_URL/u);
});

test('browser runtime does not rewrite highlight token classes', () => {
    const main = fs.readFileSync(path.join(themeRoot, 'source/js/main.js'), 'utf8');

    assert.doesNotMatch(main, /setupHighlightClasses/u);
    assert.doesNotMatch(main, /classList\.add\('hljs-'/u);
});

test('links widget depends on configured links instead of posts', () => {
    const links = fs.readFileSync(path.join(layoutRoot, '_partials/widgets/links.ejs'), 'utf8');

    assert.doesNotMatch(links, /site\.posts/u);
    assert.match(links, /theme\.links/u);
});

test('archive and toc templates use precomputed render helpers', () => {
    const archive = fs.readFileSync(path.join(layoutRoot, 'archive.ejs'), 'utf8');
    const sidebar = fs.readFileSync(path.join(layoutRoot, '_partials/sidebar.ejs'), 'utf8');
    const toc = fs.readFileSync(path.join(layoutRoot, '_partials/post/toc.ejs'), 'utf8');

    assert.match(archive, /wikiflow_archive_month_counts\(\)/u);
    assert.doesNotMatch(archive, /site\.posts\.each/u);
    assert.match(sidebar, /wikiflow_toc\(page\)/u);
    assert.match(toc, /wikiflow_toc\(post\)/u);
    assert.doesNotMatch(sidebar, /toc\(page\.content\)/u);
    assert.doesNotMatch(toc, /toc\(post\.content\)/u);
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
    const commentScripts = fs.readFileSync(path.join(layoutRoot, '_third-party/comments/scripts.ejs'), 'utf8');

    assert.match(analytics, /googletagmanager\.com\/gtag\/js/u);
    assert.match(analytics, /js\/analytics\.js/u);
    assert.doesNotMatch(analytics, /google-analytics\.com\/analytics\.js/u);
    assert.match(disqus, /js\/disqus\.js/u);
    assert.doesNotMatch(disqus, /this\.page\.(?:url|identifier)\s*=\s*'/u);
    assert.match(commentScripts, /page\.comments/u);
});
