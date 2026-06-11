'use strict';

function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
}

function mergeConfig(target, source) {
    if (!isPlainObject(source)) return target;

    for (const key of Object.keys(source)) {
        if (isPlainObject(target[key]) && isPlainObject(source[key])) {
            mergeConfig(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }

    return target;
}

function asArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function isDisabled(value) {
    return value === false ||
        value === null ||
        value === 'false' ||
        value === 'off' ||
        value === 'none';
}

function isExternalUrl(value) {
    return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value) ||
        value.startsWith('data:');
}

module.exports = {
    asArray,
    isDisabled,
    isExternalUrl,
    isPlainObject,
    mergeConfig
};
