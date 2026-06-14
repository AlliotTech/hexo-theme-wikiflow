/* global hexo */

'use strict';

hexo.extend.helper.register('wikiflow_inject', function(point) {
    const injects = this.theme.injects && this.theme.injects[point];
    if (!injects || !injects.length) return '';

    return injects
        .map(item => this.partial(item.layout, item.locals, item.options))
        .join('');
});
