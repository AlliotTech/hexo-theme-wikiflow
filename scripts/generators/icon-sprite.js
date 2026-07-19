/* global hexo */

'use strict';

const crypto = require('node:crypto');
const { createSprite } = require('../lib/icons');

const ASSET_DIR = 'assets/wikiflow';
const HASH_LENGTH = 12;

function prepareIconSprite(hexoInstance) {
    const themeConfig = hexoInstance.theme.config || {};
    const data = createSprite(themeConfig);
    const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, HASH_LENGTH);
    const routePath = `${ASSET_DIR}/icons.${hash}.svg`;

    themeConfig._wikiflow_icon_sprite = {
        path: routePath,
        data
    };
}

function register(hexoInstance) {
    hexoInstance.extend.filter.register('before_generate', () => {
        prepareIconSprite(hexoInstance);
    }, 15);

    hexoInstance.extend.generator.register('wikiflow_icon_sprite', () => {
        const sprite = (hexoInstance.theme.config || {})._wikiflow_icon_sprite;
        if (!sprite) return [];

        return {
            path: sprite.path,
            data: sprite.data
        };
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    prepareIconSprite,
    register
};
