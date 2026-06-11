/* global hexo */

'use strict';

function toArray(collection) {
    if (!collection) return [];
    if (Array.isArray(collection)) return collection;
    if (typeof collection.toArray === 'function') return collection.toArray();
    if (Array.isArray(collection.data)) return collection.data;

    const result = [];
    if (typeof collection.forEach === 'function') {
        collection.forEach(item => result.push(item));
    }

    return result;
}

function getPostCategories(post) {
    if (!post || !post.categories) return [];
    return toArray(post.categories);
}

function getParentId(category) {
    if (!category || category.parent == null) return '_root';
    return category.parent;
}

function sortByName(left, right) {
    return String(left.name).localeCompare(String(right.name));
}

function sortByDate(left, right) {
    return new Date(left.date) - new Date(right.date);
}

function buildCategoryTree(categories, posts, currentPostId) {
    const categoryList = toArray(categories)
        .filter(category => category && category.length)
        .sort(sortByName);
    const childrenByParent = new Map();
    const articlesByCategory = new Map([['_root', []]]);

    categoryList.forEach(category => {
        const parentId = getParentId(category);
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(category);
    });

    toArray(posts).forEach(post => {
        const postCategories = getPostCategories(post);
        const postInfo = {
            title: post.title,
            date: post.date,
            path: post.path,
            _id: post._id
        };

        if (!postCategories.length) {
            articlesByCategory.get('_root').push(postInfo);
            return;
        }

        const lastCategory = postCategories[postCategories.length - 1];
        const categoryId = lastCategory && lastCategory._id;
        if (!categoryId) {
            articlesByCategory.get('_root').push(postInfo);
            return;
        }

        if (!articlesByCategory.has(categoryId)) articlesByCategory.set(categoryId, []);
        articlesByCategory.get(categoryId).push(postInfo);
    });

    function buildBranch(parentId) {
        const children = (childrenByParent.get(parentId) || []).map(category => {
            const articles = (articlesByCategory.get(category._id) || []).sort(sortByDate);
            const branch = {
                _id: category._id,
                name: category.name,
                children: buildBranch(category._id),
                articles,
                selected: articles.some(post => post._id === currentPostId)
            };

            if (branch.children.some(child => child.selected)) branch.selected = true;
            return branch;
        });

        return children;
    }

    const rootArticles = articlesByCategory.get('_root').sort(sortByDate);
    return {
        _id: '_root',
        name: '_root',
        children: buildBranch('_root'),
        articles: rootArticles,
        selected: rootArticles.some(post => post._id === currentPostId)
    };
}

function register(hexoInstance) {
    hexoInstance.extend.helper.register('wikiflow_category_tree', function() {
        const currentPostId = this.is_post && this.is_post() ? this.page._id : null;
        return buildCategoryTree(this.site.categories, this.site.posts, currentPostId);
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    buildCategoryTree,
    getPostCategories,
    register,
    toArray
};
