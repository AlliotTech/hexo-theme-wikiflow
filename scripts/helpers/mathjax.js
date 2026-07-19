/* global hexo */

'use strict';

function shouldLoadMathJax(plugins = {}, page = {}) {
    if (page.mathjax === true) return true;
    if (page.mathjax === false) return false;
    return plugins.mathjax === true;
}

function register(hexoInstance) {
    hexoInstance.extend.helper.register('wikiflow_mathjax_enabled', function(page) {
        return shouldLoadMathJax((this.theme && this.theme.plugins) || {}, page || this.page || {});
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    register,
    shouldLoadMathJax
};
