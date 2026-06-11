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
    hexo.theme.config = mergeConfig(hexo.theme.config || {}, hexo.config.theme_config || {});

    const themeConfig = hexo.theme.config;
    themeConfig.cache = mergeConfig({ enable: true }, themeConfig.cache || {});
    themeConfig.custom_file_path = themeConfig.custom_file_path || {};
    themeConfig.vendors = themeConfig.vendors || {};
    normalizeInjects(themeConfig);

    return themeConfig;
};
