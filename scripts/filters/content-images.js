/* global hexo */

'use strict';

const cheerio = require('cheerio');

function enhanceImageMarkup(html) {
    const content = String(html || '');
    if (!content || !/<img(?:\s|>)/iu.test(content)) return content;

    const $ = cheerio.load(content, null, false);
    $('img').each((_, image) => {
        const element = $(image);
        if (!element.attr('loading')) element.attr('loading', 'lazy');
        if (!element.attr('decoding')) element.attr('decoding', 'async');
    });
    return $.html();
}

function enhancePostImages(data) {
    if (!data || typeof data !== 'object') return data;

    if (data.content) data.content = enhanceImageMarkup(data.content);
    if (data.excerpt) data.excerpt = enhanceImageMarkup(data.excerpt);
    return data;
}

function register(hexoInstance) {
    hexoInstance.extend.filter.register('after_post_render', enhancePostImages, 20);
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    enhanceImageMarkup,
    enhancePostImages,
    register
};
