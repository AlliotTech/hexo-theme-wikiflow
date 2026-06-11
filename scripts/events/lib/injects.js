'use strict';

const fs = require('fs');
const path = require('path');
const { points } = require('./utils');

const defaultExtname = '.ejs';

class StylusInject {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.files = [];
    }

    push(file) {
        const resolved = path.resolve(this.baseDir, file);
        if (!this.files.includes(resolved)) this.files.push(resolved);
    }
}

class ViewInject {
    constructor(baseDir) {
        this.baseDir = baseDir;
        this.raws = [];
    }

    raw(name, raw, ...args) {
        const viewName = path.extname(name) ? name : name + defaultExtname;
        this.raws.push({ name: viewName, raw, args });
    }

    file(name, file, ...args) {
        const viewName = path.extname(name) ? name : name + path.extname(file);
        this.raw(viewName, fs.readFileSync(path.resolve(this.baseDir, file), 'utf8'), ...args);
    }
}

function initInject(baseDir) {
    const injects = {};

    points.styles.forEach(point => {
        injects[point] = new StylusInject(baseDir);
    });

    points.views.forEach(point => {
        injects[point] = new ViewInject(baseDir);
    });

    return injects;
}

function configureInjects(hexo) {
    const injects = initInject(hexo.base_dir);
    hexo.execFilterSync('theme_inject', injects);
    hexo.theme.config.injects = {};

    points.styles.forEach(point => {
        hexo.theme.config.injects[point] = injects[point].files;
    });

    points.views.forEach(point => {
        const configs = Object.create(null);
        hexo.theme.config.injects[point] = [];

        injects[point].raws.forEach((injectObj, index) => {
            const name = `inject/${point}/${injectObj.name}`;
            hexo.theme.setView(name, injectObj.raw);
            configs[name] = {
                layout: name,
                locals: injectObj.args[0],
                options: injectObj.args[1],
                order: injectObj.args[2] || index
            };
        });

        hexo.theme.config.injects[point] = Object.values(configs)
            .sort((left, right) => left.order - right.order);
    });
}

module.exports = configureInjects;
module.exports.StylusInject = StylusInject;
module.exports.ViewInject = ViewInject;
module.exports.initInject = initInject;
