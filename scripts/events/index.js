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

hexo.on('ready', () => {
    if (!/^(g|s)/.test(hexo.env.cmd) || process.argv.includes('--wikiflow-disable-banner')) return;

    const { version } = require('../../package.json');
    hexo.log.info(`========================================
__        ___ _    _ _____ _     ___  __        __
\\ \\      / (_) | _(_)  ___| |   / _ \\ \\ \\      / /
 \\ \\ /\\ / /| | |/ / | |_  | |  | | | | \\ \\ /\\ / /
  \\ V  V / | |   <| |  _| | |__| |_| |  \\ V  V /
   \\_/\\_/  |_|_|\\_\\_|_|   |_____\\___/    \\_/\\_/
========================================
WikiFlow version ${version}
Documentation: https://github.com/AlliotTech/hexo-theme-wikiflow#readme
========================================`);
});
