'use strict';

module.exports = hexo => {
    const themeConfig = hexo.theme.config || {};
    const menu = themeConfig.menu || {};

    themeConfig.menu = Object.fromEntries(
        Object.entries(menu).filter(([, value]) => value)
    );
};
