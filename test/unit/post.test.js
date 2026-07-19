'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    getAutoExcerpt,
    getHistoryLinks,
    getPostExcerpt,
    getPostUpdatedTime,
    hasExplicitUpdatedFrontMatter,
    parseFrontMatter
} = require('../../scripts/helpers/post');

test('getAutoExcerpt returns safe plain text from complete rendered lines', () => {
    assert.equal(getAutoExcerpt('<p>one</p>\n<p>two <strong>bold</strong></p>\n<p>three</p>', 2), 'one two bold');
    assert.equal(getAutoExcerpt('<p>one line only</p>', 2), 'one line only');
});

test('getPostExcerpt prefers explicit excerpt and description', () => {
    assert.deepEqual(getPostExcerpt({ excerpt: '<p>custom</p>', description: 'fallback' }), {
        content: '<p>custom</p>',
        html: true
    });
    assert.deepEqual(getPostExcerpt({ description: '<unsafe>' }), {
        content: '<unsafe>',
        html: false
    });
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

    assert.deepEqual(getPostExcerpt(post, theme), {
        content: 'line 1 line 2',
        html: false
    });
});

test('parseFrontMatter detects explicit non-empty updated values', () => {
    assert.equal(hasExplicitUpdatedFrontMatter({
        raw: [
            '---',
            'title: First Note',
            'updated: 2026-01-03 10:00:00',
            '---',
            ''
        ].join('\n')
    }), true);
    assert.equal(hasExplicitUpdatedFrontMatter({
        raw: [
            '---',
            'title: Empty Updated',
            'updated:',
            '---',
            ''
        ].join('\n')
    }), false);
    assert.equal(hasExplicitUpdatedFrontMatter({
        raw: [
            ';;;',
            '"title": "JSON Note",',
            '"updated": "2026-01-03 10:00:00"',
            ';;;',
            ''
        ].join('\n')
    }), true);
    assert.equal(parseFrontMatter('No front matter').updated, undefined);
});

test('getPostUpdatedTime requires enabled config, explicit front-matter and newer updated date', () => {
    const raw = [
        '---',
        'title: First Note',
        'date: 2026-01-02 10:00:00',
        'updated: 2026-01-03 10:00:00',
        '---',
        ''
    ].join('\n');
    const post = {
        date: new Date('2026-01-02T10:00:00Z'),
        updated: new Date('2026-01-03T10:00:00Z'),
        raw
    };

    assert.equal(getPostUpdatedTime({}, post), post.updated);
    assert.equal(getPostUpdatedTime({ post_meta: { updated_at: { enable: false } } }, post), null);
    assert.equal(getPostUpdatedTime({ post_meta: { updated_at: false } }, post), null);
    assert.equal(getPostUpdatedTime({}, { ...post, updated: new Date('2026-01-01T10:00:00Z') }), null);
    assert.equal(getPostUpdatedTime({}, { ...post, raw: raw.replace('updated: 2026-01-03 10:00:00\n', '') }), null);
});

test('getHistoryLinks builds repository action links', () => {
    const theme = {
        post_history: {
            enable: true,
            server_url: 'https://github.com/',
            owner: 'AlliotTech',
            repository: 'hexo-theme-wikiflow',
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
