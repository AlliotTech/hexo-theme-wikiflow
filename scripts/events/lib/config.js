'use strict';

const { asArray, mergeConfig, points } = require('./utils');

function normalizeInjects(themeConfig) {
    const injects = themeConfig.injects || {};

    themeConfig.injects = {
        ...Object.fromEntries(points.views.map(point => [point, asArray(injects[point])])),
        ...Object.fromEntries(points.styles.map(point => [point, asArray(injects[point])]))
    };
}

module.exports = hexo => {
    const siteThemeConfig = hexo.config.theme_config || {};

    hexo.theme.config = mergeConfig(hexo.theme.config || {}, siteThemeConfig);

    const themeConfig = hexo.theme.config;
    if (Object.prototype.hasOwnProperty.call(siteThemeConfig, 'menu')) {
        themeConfig.menu = siteThemeConfig.menu || {};
    }

    themeConfig.custom_file_path = themeConfig.custom_file_path || {};
    themeConfig.vendors = themeConfig.vendors || {};
    normalizeInjects(themeConfig);

    return themeConfig;
};
