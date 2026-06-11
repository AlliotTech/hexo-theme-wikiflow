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

function resolveVendor(hexo, key, definition, configuredValue) {
    const value = configuredValue === undefined ? definition.default : configuredValue;
    if (isDisabled(value)) return false;

    if (isPlainObject(value) && value.url) {
        return {
            ...value,
            url: normalizeUrl(hexo, value.url)
        };
    }

    if (value === true || value === 'cdn' || value === 'cdnjs') {
        return {
            type: definition.type,
            url: normalizeUrl(hexo, definition.cdn),
            integrity: definition.integrity
        };
    }

    if (value === 'local') {
        if (hasLocalAsset(hexo, definition.local)) {
            return {
                type: definition.type,
                url: normalizeUrl(hexo, definition.local),
                integrity: definition.integrity
            };
        }

        if (!warnedLocalFallbacks.has(key)) {
            hexo.log.warn(`Vendor "${key}" was configured as local but no local asset exists. Falling back to CDN.`);
            warnedLocalFallbacks.add(key);
        }

        return {
            type: definition.type,
            url: normalizeUrl(hexo, definition.cdn),
            integrity: definition.integrity
        };
    }

    if (typeof value === 'string') {
        return {
            type: definition.type,
            url: normalizeUrl(hexo, value),
            integrity: definition.integrity
        };
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
module.exports.hasLocalAsset = hasLocalAsset;
module.exports.normalizeUrl = normalizeUrl;
module.exports.readDependencies = readDependencies;
module.exports.resolveVendor = resolveVendor;
