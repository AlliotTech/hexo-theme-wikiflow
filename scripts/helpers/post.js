/* global hexo */

'use strict';

const HISTORY_ACTIONS = [
    { path: 'raw', label: 'Source' },
    { path: 'edit', label: 'Edit' },
    { path: 'commits', label: 'History' }
];

function trimUrlPart(value) {
    return String(value).replace(/^\/+|\/+$/g, '');
}

function joinUrlParts(base, ...parts) {
    return [
        String(base).replace(/\/+$/g, ''),
        ...parts.map(trimUrlPart)
    ].join('/');
}

function getAutoExcerpt(content, lines) {
    const source = String(content || '');
    const lineCount = Number(lines) || 0;
    let position = 0;

    for (let count = 0; count < lineCount; count++) {
        position = source.indexOf('\n', position + 1);
        if (position < 0) return '';
    }

    return position > 0 ? source.substring(0, position + 1) : '';
}

function getPostExcerpt(post, themeConfig = {}) {
    if (!post) return '';
    if (post.excerpt || post.description) return post.excerpt || post.description;

    const autoExcerpt = themeConfig.auto_excerpt || {};
    if (!autoExcerpt.enable) return '';

    return getAutoExcerpt(post.content, autoExcerpt.lines);
}

function getHistoryLinks(themeConfig = {}, post = {}) {
    const historyControl = themeConfig.history_control || {};
    if (!historyControl.enable ||
        !historyControl.server_link ||
        !historyControl.user ||
        !historyControl.repertory ||
        !historyControl.branch ||
        !post.source) {
        return [];
    }

    const repositoryUrl = joinUrlParts(
        historyControl.server_link,
        historyControl.user,
        historyControl.repertory
    );
    const filePath = joinUrlParts(historyControl.branch, 'source', post.source);

    return HISTORY_ACTIONS.map(action => ({
        label: action.label,
        url: joinUrlParts(repositoryUrl, action.path, filePath)
    }));
}

function register(hexoInstance) {
    hexoInstance.extend.helper.register('wikiflow_post_excerpt', function(post) {
        return getPostExcerpt(post, this.theme);
    });

    hexoInstance.extend.helper.register('wikiflow_history_links', function(post) {
        return getHistoryLinks(this.theme, post);
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    getAutoExcerpt,
    getHistoryLinks,
    getPostExcerpt,
    register
};
