/* global hexo */

'use strict';

const { points } = require('../events/lib/utils');

hexo.extend.filter.register('theme_inject', injects => {
    const filePath = hexo.theme.config.custom_file_path;

    if (!filePath) return;

    points.views.forEach(point => {
        if (filePath[point]) injects[point].file('custom', filePath[point]);
    });

    points.styles.forEach(point => {
        if (filePath[point]) injects[point].push(filePath[point]);
    });
}, 99);
