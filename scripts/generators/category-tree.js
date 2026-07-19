/* global hexo */

'use strict';

const crypto = require('node:crypto');
const { buildCategoryTree, toArray } = require('../helpers/category-tree');

const ASSET_DIR = 'assets/wikiflow';
const HASH_LENGTH = 12;

function categoryMode(hexoInstance) {
    const themeConfig = hexoInstance.theme.config || {};
    const categoryConfig = themeConfig.category || {};
    return categoryConfig.mode || 'external';
}

function shouldGenerateCategoryTree(hexoInstance) {
    return categoryMode(hexoInstance) === 'external';
}

function slimCategoryTree(branch) {
    return {
        ...(branch.name && branch.name !== '_root' ? { name: branch.name } : {}),
        ...(branch.path ? { path: branch.path } : {}),
        children: (branch.children || []).map(slimCategoryTree),
        articles: (branch.articles || []).map(post => ({
            title: post.title || '',
            path: post.path || ''
        }))
    };
}

function buildPayload(hexoInstance) {
    return {
        version: 2,
        tree: slimCategoryTree(buildCategoryTree(
            hexoInstance.locals.get('categories'),
            hexoInstance.locals.get('posts')
        ))
    };
}

function prepareCategoryTree(hexoInstance) {
    const themeConfig = hexoInstance.theme.config || {};
    const categoryConfig = themeConfig.category || {};
    const categories = toArray(hexoInstance.locals.get('categories'));

    if (!shouldGenerateCategoryTree(hexoInstance) || !categories.length) {
        delete categoryConfig.tree_asset;
        delete categoryConfig.tree_path;
        return;
    }

    const data = `${JSON.stringify(buildPayload(hexoInstance))}\n`;
    const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, HASH_LENGTH);
    const routePath = `${ASSET_DIR}/category-tree.${hash}.json`;

    categoryConfig.tree_path = routePath;
    categoryConfig.tree_asset = {
        path: routePath,
        data
    };
    themeConfig.category = categoryConfig;
}

function register(hexoInstance) {
    hexoInstance.extend.filter.register('before_generate', () => {
        prepareCategoryTree(hexoInstance);
    }, 20);

    hexoInstance.extend.generator.register('wikiflow_category_tree', () => {
        const categoryConfig = (hexoInstance.theme.config || {}).category || {};

        if (!shouldGenerateCategoryTree(hexoInstance) || !categoryConfig.tree_asset) return [];

        return {
            path: categoryConfig.tree_asset.path,
            data: categoryConfig.tree_asset.data
        };
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    buildPayload,
    prepareCategoryTree,
    register,
    shouldGenerateCategoryTree,
    slimCategoryTree
};
