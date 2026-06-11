'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { url_for } = require('hexo-util');
const { isDisabled, isExternalUrl, isPlainObject } = require('./utils');

const warnedLocalFallbacks = new Set();

function readDependencies(hexo) {
    const vendorsFile = path.join(hexo.theme_dir, '_vendors.yml');
    if (!fs.existsSync(vendorsFile)) return {};

    return yaml.load(fs.readFileSync(vendorsFile, 'utf8')) || {};
}

function normalizeUrl(hexo, value) {
    if (!value) return '';
    if (isExternalUrl(value)) return value;

    return url_for.call(hexo, value);
}

function hasLocalAsset(hexo, localPath) {
    if (!localPath) return false;

    return fs.existsSync(path.join(hexo.theme_dir, 'source', localPath));
}

function createVendor(hexo, definition, url, overrides = {}) {
    return {
        type: definition.type,
        integrity: definition.integrity,
        ...overrides,
        url: normalizeUrl(hexo, url)
    };
}

function resolveVendor(hexo, key, definition, configuredValue) {
    const value = configuredValue === undefined ? definition.default : configuredValue;
    if (isDisabled(value)) return false;

    if (isPlainObject(value) && value.url) {
        const { url, ...overrides } = value;
        return createVendor(hexo, definition, url, overrides);
    }

    if (value === true || value === 'cdn' || value === 'cdnjs') {
        return createVendor(hexo, definition, definition.cdn);
    }

    if (value === 'local') {
        if (hasLocalAsset(hexo, definition.local)) {
            return createVendor(hexo, definition, definition.local);
        }

        if (!warnedLocalFallbacks.has(key)) {
            hexo.log.warn(`Vendor "${key}" was configured as local but no local asset exists. Falling back to CDN.`);
            warnedLocalFallbacks.add(key);
        }

        return createVendor(hexo, definition, definition.cdn);
    }

    if (typeof value === 'string') {
        return createVendor(hexo, definition, value);
    }

    return false;
}

function configureVendors(hexo) {
    const themeConfig = hexo.theme.config || {};
    const configuredVendors = themeConfig.vendors || {};
    const dependencies = readDependencies(hexo);
    const resolvedVendors = {};

    for (const [key, definition] of Object.entries(dependencies)) {
        resolvedVendors[key] = resolveVendor(hexo, key, definition, configuredVendors[key]);
    }

    themeConfig.vendors = {
        ...configuredVendors,
        ...resolvedVendors
    };
}

module.exports = configureVendors;
module.exports.createVendor = createVendor;
module.exports.hasLocalAsset = hasLocalAsset;
module.exports.normalizeUrl = normalizeUrl;
module.exports.readDependencies = readDependencies;
module.exports.resolveVendor = resolveVendor;
