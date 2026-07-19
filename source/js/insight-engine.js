(function (root, factory) {
    'use strict';

    var engine = factory();
    if (typeof module === 'object' && module.exports) module.exports = engine;
    if (root) root.WIKIFLOW_INSIGHT_ENGINE = engine;
})(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    var normalizedFields = typeof WeakMap === 'function' ? new WeakMap() : null;

    function parseKeywords(keywords) {
        return String(keywords).trim().split(/\s+/).filter(Boolean).map(function (keyword) {
            return keyword.toUpperCase();
        });
    }

    function extractToSet(json, key) {
        var values = new Map();
        json.pages.concat(json.posts).forEach(function (entry) {
            if (!Array.isArray(entry[key])) return;
            entry[key].forEach(function (value) {
                if (value && value.name != null && !values.has(value.name)) values.set(value.name, value);
            });
        });
        return Array.from(values.values());
    }

    function upperField(object, field) {
        var fieldCache;

        if (!object || !Object.prototype.hasOwnProperty.call(object, field)) return '';
        if (!normalizedFields) return String(object[field]).toUpperCase();

        fieldCache = normalizedFields.get(object);
        if (!fieldCache) {
            fieldCache = new Map();
            normalizedFields.set(object, fieldCache);
        }
        if (!fieldCache.has(field)) fieldCache.set(field, String(object[field]).toUpperCase());
        return fieldCache.get(field);
    }

    function matchesKeywords(keywordArray, object, fields) {
        return keywordArray.every(function (keyword) {
            return fields.some(function (field) {
                return upperField(object, field).indexOf(keyword) > -1;
            });
        });
    }

    function findFirstOccur(keywordArray, object, field) {
        var value = upperField(object, field);
        if (!value) return -1;

        return keywordArray.reduce(function (firstOccur, keyword) {
            var index = value.indexOf(keyword);
            if (index === -1) return firstOccur;
            return firstOccur === -1 ? index : Math.min(firstOccur, index);
        }, -1);
    }

    function weight(keywordArray, object, fields, weights) {
        var value = 0;
        keywordArray.forEach(function (keyword) {
            fields.forEach(function (field, index) {
                if (upperField(object, field).indexOf(keyword) > -1) value += weights[index];
            });
        });
        return value;
    }

    function insertRanked(results, result, limit) {
        var start = 0;
        var end = results.length;

        while (start < end) {
            var middle = Math.floor((start + end) / 2);
            var current = results[middle];
            if (current.weight > result.weight ||
                (current.weight === result.weight && current.order < result.order)) {
                start = middle + 1;
            } else {
                end = middle;
            }
        }

        results.splice(start, 0, result);
        if (results.length > limit) results.pop();
    }

    function searchCollection(items, keywordArray, fields, weights, limit) {
        var results = [];

        items.forEach(function (item, order) {
            if (!matchesKeywords(keywordArray, item, fields)) return;
            insertRanked(results, {
                item: item,
                order: order,
                weight: weight(keywordArray, item, fields, weights)
            }, limit);
        });

        return results;
    }

    function createSearchIndex(json) {
        var data = {
            pages: Array.isArray(json.pages) ? json.pages : [],
            posts: Array.isArray(json.posts) ? json.posts : []
        };

        return {
            pages: data.pages,
            posts: data.posts,
            categories: Array.isArray(json.categories) ? json.categories : extractToSet(data, 'categories'),
            tags: Array.isArray(json.tags) ? json.tags : extractToSet(data, 'tags')
        };
    }

    function search(index, keywordArray, limits) {
        var resultLimits = limits || {};
        var documentLimit = Math.max(1, Number(resultLimits.documents) || 30);
        var taxonomyLimit = Math.max(1, Number(resultLimits.taxonomies) || 20);

        return {
            posts: searchCollection(index.posts, keywordArray, ['title', 'text'], [3, 1], documentLimit),
            pages: searchCollection(index.pages, keywordArray, ['title', 'text'], [3, 1], documentLimit),
            categories: searchCollection(index.categories, keywordArray, ['name', 'slug'], [1, 1], taxonomyLimit),
            tags: searchCollection(index.tags, keywordArray, ['name', 'slug'], [1, 1], taxonomyLimit)
        };
    }

    return {
        createSearchIndex: createSearchIndex,
        findFirstOccur: findFirstOccur,
        parseKeywords: parseKeywords,
        search: search
    };
});
