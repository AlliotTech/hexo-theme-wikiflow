'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
    buildArchiveMonthCounts,
    createTocCache
} = require('../../scripts/helpers/render-data');

test('buildArchiveMonthCounts groups the site collection once by month', () => {
    const posts = {
        toArray() {
            return [
                { date: { format: () => '2026-01' } },
                { date: { format: () => '2026-01' } },
                { date: { format: () => '2026-02' } }
            ];
        }
    };

    assert.deepEqual(buildArchiveMonthCounts(posts), {
        '2026-01': 2,
        '2026-02': 1
    });
});

test('createTocCache reuses rendered toc until post content changes', () => {
    const cache = createTocCache();
    const post = { content: '<h2>First</h2>' };
    let renderCount = 0;
    const render = content => {
        renderCount += 1;
        return `toc:${content}`;
    };

    assert.equal(cache.render(post, render), 'toc:<h2>First</h2>');
    assert.equal(cache.render(post, render), 'toc:<h2>First</h2>');
    assert.equal(renderCount, 1);

    post.content = '<h2>Changed</h2>';
    assert.equal(cache.render(post, render), 'toc:<h2>Changed</h2>');
    assert.equal(renderCount, 2);
});
