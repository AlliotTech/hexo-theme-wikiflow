'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    getAutoExcerpt,
    getHistoryLinks,
    getPostExcerpt
} = require('../../scripts/helpers/post');

test('getAutoExcerpt returns the configured number of lines', () => {
    assert.equal(getAutoExcerpt('one\ntwo\nthree\nfour', 2), 'one\ntwo\n');
    assert.equal(getAutoExcerpt('one line only', 2), '');
});

test('getPostExcerpt prefers explicit excerpt and description', () => {
    assert.equal(getPostExcerpt({ excerpt: 'custom', description: 'fallback' }), 'custom');
    assert.equal(getPostExcerpt({ description: 'summary' }), 'summary');
});

test('getPostExcerpt falls back to auto excerpt when enabled', () => {
    const post = {
        content: 'line 1\nline 2\nline 3\n'
    };
    const theme = {
        auto_excerpt: {
            enable: true,
            lines: 2
        }
    };

    assert.equal(getPostExcerpt(post, theme), 'line 1\nline 2\n');
});

test('getHistoryLinks builds repository action links', () => {
    const theme = {
        history_control: {
            enable: true,
            server_link: 'https://github.com/',
            user: 'AlliotTech',
            repertory: 'hexo-theme-wikiflow',
            branch: 'main'
        }
    };
    const links = getHistoryLinks(theme, {
        source: '_posts/guide/first-note.md'
    });

    assert.deepEqual(links, [
        {
            label: 'Source',
            url: 'https://github.com/AlliotTech/hexo-theme-wikiflow/raw/main/source/_posts/guide/first-note.md'
        },
        {
            label: 'Edit',
            url: 'https://github.com/AlliotTech/hexo-theme-wikiflow/edit/main/source/_posts/guide/first-note.md'
        },
        {
            label: 'History',
            url: 'https://github.com/AlliotTech/hexo-theme-wikiflow/commits/main/source/_posts/guide/first-note.md'
        }
    ]);
});
