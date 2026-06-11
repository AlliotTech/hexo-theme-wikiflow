/**
 * Insight search plugin
 * @author PPOffice { @link https://github.com/ppoffice }
 */
(function (window, document, CONFIG) {
    'use strict';

    var main = document.querySelector('.ins-search');
    if (!main || !CONFIG) return;

    var input = main.querySelector('.ins-search-input');
    var wrapper = main.querySelector('.ins-section-wrapper');
    var container = main.querySelector('.ins-section-container');

    if (main.parentNode) main.parentNode.removeChild(main);
    document.body.appendChild(main);

    function createElement(tagName, className, text) {
        var element = document.createElement(tagName);
        if (className) element.className = className;
        if (text != null) element.textContent = text;
        return element;
    }

    function section(title) {
        var element = createElement('section', 'ins-section');
        element.appendChild(createElement('header', 'ins-section-header', title));
        return element;
    }

    function searchItem(icon, title, slug, preview, url, keywords) {
        var item = createElement('div', 'ins-selectable ins-search-item');
        var header = createElement('header');
        header.appendChild(createElement('i', 'fa fa-' + icon));
        header.appendChild(document.createTextNode(title != null && title !== '' ? title : CONFIG.TRANSLATION.UNTITLED));
        if (slug) header.appendChild(createElement('span', 'ins-slug', slug));
        item.appendChild(header);
        if (preview) {
            var previewElement = createElement('p', 'ins-search-preview');
            appendHighlightedText(previewElement, preview, keywords || []);
            item.appendChild(previewElement);
        }
        item.setAttribute('data-url', url);
        return item;
    }

    function appendHighlightedText(element, text, keywords) {
        var keywordArray = keywords.filter(Boolean);
        var pattern;
        var lastIndex = 0;

        if (!keywordArray.length) {
            element.textContent = text;
            return;
        }

        pattern = new RegExp(keywordArray.map(escapeRegExp).join('|'), 'gi');
        text.replace(pattern, function (match, offset) {
            var marker;

            if (offset > lastIndex) {
                element.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
            }
            marker = createElement('em', 'search-keyword', match);
            element.appendChild(marker);
            lastIndex = offset + match.length;
            return match;
        });

        if (lastIndex < text.length) {
            element.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
    }

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function parseKeywords(keywords) {
        return keywords.split(' ').filter(Boolean).map(function (keyword) {
            return keyword.toUpperCase();
        });
    }

    function sectionFactory(keywords, type, array) {
        var keywordArray = parseKeywords(keywords);
        if (array.length === 0) return null;

        var resultSection = section(CONFIG.TRANSLATION[type]);
        array.forEach(function (item) {
            var element;
            if (type === 'POSTS' || type === 'PAGES') {
                var firstOccur = item.firstOccur > 20 ? item.firstOccur - 20 : 0;
                var preview = item.text.slice(firstOccur, firstOccur + 80);
                element = searchItem('file', item.title, null, preview, CONFIG.ROOT_URL + item.path, keywordArray);
            } else if (type === 'CATEGORIES' || type === 'TAGS') {
                element = searchItem(type === 'CATEGORIES' ? 'folder' : 'tag', item.name, item.slug, null, item.permalink);
            }
            if (element) resultSection.appendChild(element);
        });
        return resultSection;
    }

    function extractToSet(json, key) {
        var values = {};
        json.pages.concat(json.posts).forEach(function (entry) {
            if (!entry[key]) return;
            entry[key].forEach(function (value) {
                values[value.name] = value;
            });
        });
        return Object.keys(values).map(function (name) {
            return values[name];
        });
    }

    function filter(keywords, obj, fields) {
        var keywordArray = parseKeywords(keywords);
        var containKeywords = keywordArray.filter(function (keyword) {
            return fields.some(function (field) {
                if (!Object.prototype.hasOwnProperty.call(obj, field)) return false;
                var firstOccur = String(obj[field]).toUpperCase().indexOf(keyword);
                if (firstOccur > -1) {
                    if (field === 'text') obj.firstOccur = firstOccur;
                    return true;
                }
                return false;
            });
        });
        return containKeywords.length === keywordArray.length;
    }

    function filterFactory(keywords) {
        return {
            POST: function (obj) { return filter(keywords, obj, ['title', 'text']); },
            PAGE: function (obj) { return filter(keywords, obj, ['title', 'text']); },
            CATEGORY: function (obj) { return filter(keywords, obj, ['name', 'slug']); },
            TAG: function (obj) { return filter(keywords, obj, ['name', 'slug']); }
        };
    }

    function weight(keywords, obj, fields, weights) {
        var value = 0;
        parseKeywords(keywords).forEach(function (keyword) {
            var pattern = new RegExp(escapeRegExp(keyword), 'img');
            fields.forEach(function (field, index) {
                if (Object.prototype.hasOwnProperty.call(obj, field)) {
                    var matches = String(obj[field]).match(pattern);
                    value += matches ? matches.length * weights[index] : 0;
                }
            });
        });
        return value;
    }

    function weightFactory(keywords) {
        return {
            POST: function (obj) { return weight(keywords, obj, ['title', 'text'], [3, 1]); },
            PAGE: function (obj) { return weight(keywords, obj, ['title', 'text'], [3, 1]); },
            CATEGORY: function (obj) { return weight(keywords, obj, ['name', 'slug'], [1, 1]); },
            TAG: function (obj) { return weight(keywords, obj, ['name', 'slug'], [1, 1]); }
        };
    }

    function search(json, keywords) {
        var weights = weightFactory(keywords);
        var filters = filterFactory(keywords);
        var tags = extractToSet(json, 'tags');
        var categories = extractToSet(json, 'categories');
        return {
            posts: json.posts.filter(filters.POST).sort(function (a, b) { return weights.POST(b) - weights.POST(a); }),
            pages: json.pages.filter(filters.PAGE).sort(function (a, b) { return weights.PAGE(b) - weights.PAGE(a); }),
            categories: categories.filter(filters.CATEGORY).sort(function (a, b) { return weights.CATEGORY(b) - weights.CATEGORY(a); }),
            tags: tags.filter(filters.TAG).sort(function (a, b) { return weights.TAG(b) - weights.TAG(a); })
        };
    }

    function searchResultToDOM(keywords, searchResult) {
        while (container.firstChild) container.removeChild(container.firstChild);
        Object.keys(searchResult).forEach(function (key) {
            var resultSection = sectionFactory(keywords, key.toUpperCase(), searchResult[key]);
            if (resultSection) container.appendChild(resultSection);
        });
    }

    function scrollToItem(item) {
        if (!item) return;
        var itemTop = item.offsetTop - wrapper.scrollTop;
        var itemBottom = item.clientHeight + item.offsetTop;
        if (itemBottom > wrapper.clientHeight + wrapper.scrollTop) {
            wrapper.scrollTop = itemBottom - wrapper.clientHeight;
        }
        if (itemTop < 0) wrapper.scrollTop = item.offsetTop;
    }

    function selectItemByDiff(value) {
        var items = Array.prototype.slice.call(container.querySelectorAll('.ins-selectable'));
        if (!items.length) return;
        var prevPosition = items.findIndex(function (item) {
            return item.classList.contains('active');
        });
        var nextPosition = (items.length + prevPosition + value) % items.length;
        if (prevPosition > -1) items[prevPosition].classList.remove('active');
        items[nextPosition].classList.add('active');
        scrollToItem(items[nextPosition]);
    }

    function gotoLink(item) {
        if (item) window.location.href = item.getAttribute('data-url');
    }

    function openSearch() {
        main.classList.add('show');
        input.focus();
    }

    fetch(CONFIG.CONTENT_URL)
        .then(function (response) { return response.json(); })
        .then(function (json) {
            if (window.location.hash.trim() === '#ins-search') openSearch();
            input.addEventListener('input', function () {
                var keywords = input.value;
                searchResultToDOM(keywords, search(json, keywords));
            });
            input.dispatchEvent(new Event('input'));
        });

    document.addEventListener('click', function (event) {
        var searchInput = event.target.closest('.search-form-input');
        var searchTrigger = event.target.closest('.search-form-trigger');
        var searchItemElement = event.target.closest('.ins-search-item');
        var closeButton = event.target.closest('.ins-close');

        if (searchInput || searchTrigger) {
            event.preventDefault();
            openSearch();
        } else if (searchItemElement) {
            gotoLink(searchItemElement);
        } else if (closeButton) {
            main.classList.remove('show');
        }
    });

    document.addEventListener('focusin', function (event) {
        if (!event.target.closest('.search-form-input')) return;
        main.classList.add('show');
        input.focus();
    });

    document.addEventListener('keydown', function (event) {
        if (!main.classList.contains('show')) return;
        switch (event.key) {
            case 'Escape':
                main.classList.remove('show');
                break;
            case 'ArrowUp':
                event.preventDefault();
                selectItemByDiff(-1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                selectItemByDiff(1);
                break;
            case 'Enter':
                gotoLink(container.querySelector('.ins-selectable.active'));
                break;
        }
    });
})(window, document, window.INSIGHT_CONFIG);
