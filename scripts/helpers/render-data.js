/* global hexo */

'use strict';

const { toArray } = require('./category-tree');

function buildArchiveMonthCounts(posts) {
    const counts = {};

    toArray(posts).forEach(post => {
        if (!post || !post.date || typeof post.date.format !== 'function') return;
        const month = post.date.format('YYYY-MM');
        counts[month] = (counts[month] || 0) + 1;
    });

    return counts;
}

function createTocCache() {
    let cache = new WeakMap();

    return {
        clear() {
            cache = new WeakMap();
        },
        render(post, renderToc) {
            if (!post || typeof post !== 'object' || !post.content || typeof renderToc !== 'function') return '';

            const content = String(post.content);
            const cached = cache.get(post);
            if (cached && cached.content === content) return cached.result;

            const result = renderToc(content);
            cache.set(post, { content, result });
            return result;
        }
    };
}

function register(hexoInstance) {
    let archiveMonthCounts = null;
    const tocCache = createTocCache();

    hexoInstance.extend.filter.register('before_generate', () => {
        archiveMonthCounts = buildArchiveMonthCounts(hexoInstance.locals.get('posts'));
        tocCache.clear();
    }, 10);

    hexoInstance.extend.helper.register('wikiflow_archive_month_counts', function() {
        if (!archiveMonthCounts) archiveMonthCounts = buildArchiveMonthCounts(this.site.posts);
        return archiveMonthCounts;
    });

    hexoInstance.extend.helper.register('wikiflow_toc', function(post) {
        return tocCache.render(post, content => this.toc(content));
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    buildArchiveMonthCounts,
    createTocCache,
    register
};
