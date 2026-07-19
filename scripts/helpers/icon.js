/* global hexo */

'use strict';

const {
    iconDescriptor,
    renderIcon,
    socialIconDescriptor
} = require('../lib/icons');

function spriteUrl(helperContext) {
    const sprite = helperContext.theme._wikiflow_icon_sprite;
    return sprite ? helperContext.url_for(sprite.path) : '';
}

function register(hexoInstance) {
    hexoInstance.extend.helper.register('wikiflow_icon', function(name, style) {
        return renderIcon(spriteUrl(this), iconDescriptor(name, style));
    });

    hexoInstance.extend.helper.register('wikiflow_social_icon', function(name) {
        return renderIcon(spriteUrl(this), socialIconDescriptor(name));
    });

    hexoInstance.extend.helper.register('wikiflow_icon_sprite_url', function() {
        return spriteUrl(this);
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    register,
    spriteUrl
};
