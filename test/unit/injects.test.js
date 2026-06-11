'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const configureInjects = require('../../scripts/events/lib/injects');

test('configureInjects preserves an explicit zero order', () => {
    const views = {};
    const hexo = {
        base_dir: process.cwd(),
        theme: {
            config: {},
            setView(name, raw) {
                views[name] = raw;
            }
        },
        execFilterSync(_name, injects) {
            injects.head.raw('late', '<meta name="late">', null, null, 10);
            injects.head.raw('zero', '<meta name="zero">', null, null, 0);
        }
    };

    configureInjects(hexo);

    assert.deepEqual(hexo.theme.config.injects.head.map(item => item.layout), [
        'inject/head/zero.ejs',
        'inject/head/late.ejs'
    ]);
    assert.equal(views['inject/head/zero.ejs'], '<meta name="zero">');
});
