/* global hexo */

'use strict';

const yaml = require('js-yaml');
const { stripHTML } = require('hexo-util');

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
    const lineCount = Math.max(0, Number(lines) || 0);
    if (!lineCount) return '';

    return stripHTML(String(content || ''))
        .split(/\r?\n/u)
        .map(line => line.trim())
        .filter(Boolean)
        .slice(0, lineCount)
        .join(' ');
}

function getPostExcerpt(post, themeConfig = {}) {
    if (!post) return { content: '', html: false };
    if (post.excerpt) return { content: post.excerpt, html: true };
    if (post.description) return { content: post.description, html: false };

    const autoExcerpt = themeConfig.auto_excerpt || {};
    if (!autoExcerpt.enable) return { content: '', html: false };

    return {
        content: getAutoExcerpt(post.content, autoExcerpt.lines),
        html: false
    };
}

function parseFrontMatter(raw) {
    const source = String(raw || '').replace(/\r\n/g, '\n');
    let match = source.match(/^(-{3,}|;{3,})\n([\s\S]+?)\n\1(?:\n|$)/);
    let separator;
    let frontMatter;

    if (match) {
        separator = match[1];
        frontMatter = match[2];
    } else {
        if (/^(-{3,}|;{3,})/.test(source)) return {};

        match = source.match(/^([\s\S]+?)\n(-{3,}|;{3,})\n?/);
        if (!match) return {};

        frontMatter = match[1];
        separator = match[2];
    }

    try {
        if (separator.startsWith(';')) return JSON.parse(`{${frontMatter}}`) || {};
        return yaml.load(frontMatter) || {};
    } catch {
        return {};
    }
}

function hasExplicitUpdatedFrontMatter(post = {}) {
    const frontMatter = parseFrontMatter(post.raw);
    if (!Object.prototype.hasOwnProperty.call(frontMatter, 'updated')) return false;

    const updated = frontMatter.updated;
    return updated !== null && updated !== undefined && String(updated).trim() !== '';
}

function dateValueOf(value) {
    if (!value) return NaN;
    if (typeof value.valueOf === 'function') {
        const primitive = value.valueOf();
        if (typeof primitive === 'number') return primitive;
        return new Date(primitive).getTime();
    }
    return new Date(value).getTime();
}

function getPostUpdatedTime(themeConfig = {}, post = {}) {
    const postMeta = themeConfig.post_meta || {};
    const updatedAt = postMeta.updated_at;
    const updatedEnabled = updatedAt !== false && (!updatedAt || updatedAt.enable !== false);
    const dateValue = dateValueOf(post.date);
    const updatedValue = dateValueOf(post.updated);

    if (!updatedEnabled ||
        !hasExplicitUpdatedFrontMatter(post) ||
        Number.isNaN(dateValue) ||
        Number.isNaN(updatedValue) ||
        updatedValue <= dateValue) {
        return null;
    }

    return post.updated;
}

function getHistoryLinks(themeConfig = {}, post = {}) {
    const postHistory = themeConfig.post_history || {};
    if (!postHistory.enable ||
        !postHistory.server_url ||
        !postHistory.owner ||
        !postHistory.repository ||
        !postHistory.branch ||
        !post.source) {
        return [];
    }

    const repositoryUrl = joinUrlParts(
        postHistory.server_url,
        postHistory.owner,
        postHistory.repository
    );
    const filePath = joinUrlParts(postHistory.branch, 'source', post.source);

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

    hexoInstance.extend.helper.register('wikiflow_post_updated_time', function(post) {
        return getPostUpdatedTime(this.theme, post);
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    getPostUpdatedTime,
    getAutoExcerpt,
    getHistoryLinks,
    getPostExcerpt,
    hasExplicitUpdatedFrontMatter,
    parseFrontMatter,
    register
};
