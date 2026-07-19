'use strict';

const STYLE_PACKAGES = {
    solid: '@fortawesome/free-solid-svg-icons',
    regular: '@fortawesome/free-regular-svg-icons',
    brands: '@fortawesome/free-brands-svg-icons'
};

const BRAND_SOCIAL_ICONS = new Set([
    'apple', 'behance', 'discord', 'dribbble', 'facebook', 'github', 'gitlab',
    'instagram', 'linkedin', 'mastodon', 'medium', 'pinterest', 'qq', 'reddit',
    'skype', 'slack', 'stack-overflow', 'telegram', 'threads', 'tumblr',
    'twitch', 'twitter', 'weibo', 'weixin', 'whatsapp', 'x-twitter', 'youtube',
    'zhihu'
]);

const CORE_ICONS = {
    solid: [
        'angle-left', 'angle-right', 'angle-up', 'angles-down', 'angles-up',
        'arrows-rotate', 'bars', 'calendar', 'caret-down', 'circle-check',
        'circle-xmark', 'copy', 'file', 'folder', 'folder-open', 'link', 'location-dot',
        'magnifying-glass', 'rss', 'share', 'tag', 'xmark'
    ],
    regular: ['calendar'],
    brands: ['facebook', 'pinterest', 'x-twitter']
};
const FONT_AWESOME_NOTICE = 'Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com | License: https://fontawesome.com/license/free | Copyright Fonticons, Inc.';

const definitionCache = new Map();

function iconDescriptor(name, style = 'solid') {
    return {
        name: String(name || '').trim().toLowerCase(),
        style: Object.prototype.hasOwnProperty.call(STYLE_PACKAGES, style) ? style : 'solid'
    };
}

function socialIconDescriptor(name) {
    const normalized = name === 'x' || name === 'twitter' ? 'x-twitter' : String(name || '').trim().toLowerCase();
    return iconDescriptor(normalized, BRAND_SOCIAL_ICONS.has(normalized) ? 'brands' : 'solid');
}

function spriteId(style, name) {
    return `wikiflow-icon-${String(style).replace(/[^a-z0-9_-]/giu, '-')}-${String(name).replace(/[^a-z0-9_-]/giu, '-')}`;
}

function descriptorKey(descriptor) {
    return `${descriptor.style}:${descriptor.name}`;
}

function collectDescriptors(themeConfig = {}) {
    const descriptors = new Map();

    Object.entries(CORE_ICONS).forEach(([style, names]) => {
        names.forEach(name => {
            const descriptor = iconDescriptor(name, style);
            descriptors.set(descriptorKey(descriptor), descriptor);
        });
    });

    Object.entries(themeConfig.social || {}).forEach(([name, url]) => {
        if (!url) return;
        const descriptor = socialIconDescriptor(name);
        descriptors.set(descriptorKey(descriptor), descriptor);
    });

    return Array.from(descriptors.values()).sort((left, right) => descriptorKey(left).localeCompare(descriptorKey(right)));
}

function resolveDefinition(descriptor) {
    const key = descriptorKey(descriptor);
    if (definitionCache.has(key)) return definitionCache.get(key);

    const exportName = `fa${descriptor.name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('')}`;
    let definition;

    try {
        definition = require(`${STYLE_PACKAGES[descriptor.style]}/${exportName}`).definition;
    } catch {
        definition = require('@fortawesome/free-solid-svg-icons/faLink').definition;
    }

    definitionCache.set(key, definition);
    return definition;
}

function symbolMarkup(descriptor) {
    const definition = resolveDefinition(descriptor);
    const [width, height, , , pathData] = definition.icon;
    const paths = (Array.isArray(pathData) ? pathData : [pathData])
        .map(data => `<path d="${data}"></path>`)
        .join('');

    return `<symbol id="${spriteId(descriptor.style, descriptor.name)}" viewBox="0 0 ${width} ${height}">${paths}</symbol>`;
}

function createSprite(themeConfig = {}) {
    const symbols = collectDescriptors(themeConfig).map(symbolMarkup).join('');
    return `<!-- ${FONT_AWESOME_NOTICE} --><svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>\n`;
}

function escapeAttribute(value) {
    return String(value || '')
        .replace(/&/gu, '&amp;')
        .replace(/</gu, '&lt;')
        .replace(/>/gu, '&gt;')
        .replace(/"/gu, '&quot;')
        .replace(/'/gu, '&#39;');
}

function renderIcon(spriteUrl, descriptor) {
    const safeUrl = escapeAttribute(spriteUrl);
    const safeName = escapeAttribute(descriptor.name);
    const safeStyle = escapeAttribute(descriptor.style);
    const reference = `${safeUrl}#${spriteId(descriptor.style, descriptor.name)}`;

    return `<svg class="wikiflow-icon fa-${safeStyle} fa-${safeName}" aria-hidden="true" focusable="false"><use href="${reference}"></use></svg>`;
}

module.exports = {
    BRAND_SOCIAL_ICONS,
    CORE_ICONS,
    collectDescriptors,
    createSprite,
    iconDescriptor,
    renderIcon,
    resolveDefinition,
    socialIconDescriptor,
    spriteId
};
