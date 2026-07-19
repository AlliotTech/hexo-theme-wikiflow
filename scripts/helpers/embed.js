/* global hexo */

'use strict';

const LOADING_VALUES = new Set(['eager', 'lazy']);
const REFERRER_POLICY_VALUES = new Set([
    'no-referrer',
    'no-referrer-when-downgrade',
    'origin',
    'origin-when-cross-origin',
    'same-origin',
    'strict-origin',
    'strict-origin-when-cross-origin',
    'unsafe-url'
]);

function configuredValue(post, postKey, config, configKey) {
    if (post && Object.prototype.hasOwnProperty.call(post, postKey)) return post[postKey];
    return config ? config[configKey] : undefined;
}

function enumValue(value, allowed, fallback) {
    const normalized = String(value || '').trim().toLowerCase();
    return allowed.has(normalized) ? normalized : fallback;
}

function sandboxValue(value) {
    if (value === null || value === undefined || value === false) return null;
    if (value === true) return '';
    if (Array.isArray(value)) {
        const tokens = value.map(item => String(item).trim()).filter(Boolean);
        return tokens.length ? tokens.join(' ') : null;
    }

    const normalized = String(value).trim();
    if (!normalized || /^(?:false|none|off)$/iu.test(normalized)) return null;
    if (/^(?:on|true)$/iu.test(normalized)) return '';
    return normalized;
}

function booleanValue(value) {
    if (typeof value === 'string') return /^(?:1|on|true|yes)$/iu.test(value.trim());
    return value === true || value === 1;
}

function getEmbedOptions(themeConfig = {}, post = {}, siteTitle = '') {
    const embed = themeConfig.embed || {};
    const loading = configuredValue(post, 'iframe_loading', embed, 'loading');
    const referrerpolicy = configuredValue(post, 'iframe_referrerpolicy', embed, 'referrerpolicy');
    const sandbox = configuredValue(post, 'iframe_sandbox', embed, 'sandbox');
    const allow = configuredValue(post, 'iframe_allow', embed, 'allow');
    const allowfullscreen = configuredValue(post, 'iframe_allowfullscreen', embed, 'allowfullscreen');

    return {
        src: post.iframe_url || './embed_page/',
        title: post.iframe_title || post.title || siteTitle || '',
        loading: enumValue(loading, LOADING_VALUES, 'lazy'),
        referrerpolicy: enumValue(referrerpolicy, REFERRER_POLICY_VALUES, 'strict-origin-when-cross-origin'),
        sandbox: sandboxValue(sandbox),
        allow: allow ? String(allow).trim() : '',
        allowfullscreen: booleanValue(allowfullscreen)
    };
}

function register(hexoInstance) {
    hexoInstance.extend.helper.register('wikiflow_embed_options', function(post) {
        return getEmbedOptions(this.theme, post, this.config.title);
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    getEmbedOptions,
    register
};
