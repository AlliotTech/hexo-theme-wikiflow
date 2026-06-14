/* global hexo */

'use strict';

const { htmlTag } = require('hexo-util');

function trim(value) {
    return String(value).trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}

function split(value, separator) {
    const result = [];
    let matched;

    while ((matched = separator.exec(value))) {
        result.push(matched[0]);
    }

    return result;
}

function clean(value) {
    return trim(value).replace(/\\([;=])/g, '$1');
}

function parseMeta(meta) {
    const attrs = {};
    const entities = split(String(meta), /(?:[^\\;]+|\\.)+/g);

    entities.forEach(entity => {
        const keyValue = split(entity, /(?:[^\\=]+|\\.)+/g);
        if (keyValue.length < 2) return;

        const key = clean(keyValue[0]);
        const value = clean(keyValue[1]);
        if (key) attrs[key] = value;
    });

    return attrs;
}

function renderMeta(post) {
    const metas = post.meta || [];

    return metas
        .map(parseMeta)
        .filter(attrs => Object.keys(attrs).length)
        .map(attrs => htmlTag('meta', attrs))
        .join('\n');
}

if (typeof hexo !== 'undefined') {
    hexo.extend.helper.register('meta', renderMeta);
}

module.exports = {
    parseMeta,
    renderMeta
};
