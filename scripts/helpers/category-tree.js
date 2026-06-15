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

function sortByDateDesc(left, right) {
    return new Date(right.date) - new Date(left.date);
}

function categoryPath(category) {
    return category && (category.path || category.permalink || '');
}

function categorySummary(category) {
    return {
        _id: category._id,
        name: category.name,
        path: categoryPath(category),
        length: category.length || 0
    };
}

function postSummary(post) {
    return {
        title: post.title || '',
        date: post.date,
        path: post.path,
        _id: post._id
    };
}

function buildCategoryTree(categories, posts, currentPostId) {
    const shouldMarkSelected = currentPostId != null;
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
        const postInfo = postSummary(post);

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
                ...categorySummary(category),
                children: buildBranch(category._id),
                articles
            };

            if (shouldMarkSelected) {
                branch.selected = articles.some(post => post._id === currentPostId);
                if (branch.children.some(child => child.selected)) branch.selected = true;
            }

            return branch;
        });

        return children;
    }

    const rootArticles = articlesByCategory.get('_root').sort(sortByDate);
    return {
        _id: '_root',
        name: '_root',
        path: '',
        length: toArray(posts).length,
        children: buildBranch('_root'),
        articles: rootArticles,
        ...(shouldMarkSelected ? { selected: rootArticles.some(post => post._id === currentPostId) } : {})
    };
}

function buildCategoryGroups(categories, options = {}) {
    const childLimit = options.childLimit || 6;
    const postLimit = options.postLimit || 4;
    const categoryList = toArray(categories)
        .filter(category => category && category.length)
        .sort(sortByName);
    const childrenByParent = new Map();

    categoryList.forEach(category => {
        const parentId = getParentId(category);
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId).push(category);
    });

    return (childrenByParent.get('_root') || []).map(category => {
        const children = (childrenByParent.get(category._id) || [])
            .sort(sortByName)
            .slice(0, childLimit)
            .map(child => ({
                _id: child._id,
                name: child.name,
                length: child.length,
                path: categoryPath(child)
            }));
        const posts = toArray(category.posts)
            .filter(Boolean)
            .sort(sortByDateDesc)
            .slice(0, postLimit)
            .map(postSummary);

        return {
            _id: category._id,
            name: category.name,
            length: category.length,
            path: categoryPath(category),
            children,
            posts
        };
    });
}

function register(hexoInstance) {
    hexoInstance.extend.helper.register('wikiflow_category_tree', function() {
        const currentPostId = this.is_post && this.is_post() ? this.page._id : null;
        return buildCategoryTree(this.site.categories, this.site.posts, currentPostId);
    });

    hexoInstance.extend.helper.register('wikiflow_category_groups', function(options) {
        return buildCategoryGroups(this.site.categories, options);
    });

    hexoInstance.extend.helper.register('wikiflow_category_tree_url', function() {
        const categoryConfig = this.theme.category || {};
        if (!categoryConfig.tree_path) return '';

        return this.url_for(categoryConfig.tree_path);
    });
}

if (typeof hexo !== 'undefined') register(hexo);

module.exports = {
    buildCategoryGroups,
    buildCategoryTree,
    categorySummary,
    getPostCategories,
    register,
    toArray
};
