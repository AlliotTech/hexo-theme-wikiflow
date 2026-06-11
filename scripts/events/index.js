/* global hexo */

'use strict';

const runConfig = require('./lib/config');
const runVendors = require('./lib/vendors');
const runInjects = require('./lib/injects');
const runHighlight = require('./lib/highlight');
const runNavigation = require('./lib/navigation');

function run() {
    runConfig(hexo);
    runVendors(hexo);
    runInjects(hexo);
    runHighlight(hexo);
    runNavigation(hexo);
}

hexo.extend.filter.register('before_generate', run, 0);

run();
