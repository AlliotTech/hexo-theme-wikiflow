'use strict';

const { asArray } = require('./utils');

const STYLE_POINTS = ['variable', 'mixin', 'style'];

function pushUnique(target, values) {
    for (const value of values) {
        if (!target.includes(value)) target.push(value);
    }
}

module.exports = hexo => {
    const themeConfig = hexo.theme.config || {};
    const customFilePath = themeConfig.custom_file_path || {};
    const injects = themeConfig.injects || {};

    for (const point of STYLE_POINTS) {
        injects[point] = asArray(injects[point]);
        pushUnique(injects[point], asArray(customFilePath[point]));
    }

    themeConfig.injects = injects;
};
