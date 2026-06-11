'use strict';

const { asArray, mergeConfig } = require('./utils');

function normalizeInjects(themeConfig) {
    const injects = themeConfig.injects || {};

    themeConfig.injects = {
        variable: asArray(injects.variable),
        mixin: asArray(injects.mixin),
        style: asArray(injects.style)
    };
}

module.exports = hexo => {
    hexo.theme.config = mergeConfig(hexo.theme.config || {}, hexo.config.theme_config || {});

    const themeConfig = hexo.theme.config;
    themeConfig.cache = mergeConfig({ enable: true }, themeConfig.cache || {});
    themeConfig.custom_file_path = themeConfig.custom_file_path || {};
    themeConfig.vendors = themeConfig.vendors || {};
    normalizeInjects(themeConfig);

    return themeConfig;
};
