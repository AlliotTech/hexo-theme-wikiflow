/**
 * Insight search plugin
 * @author PPOffice { @link https://github.com/ppoffice }
 */
(function (window, document, CONFIG, ENGINE) {
    'use strict';

    var main = document.querySelector('.ins-search');
    if (!main || !CONFIG || !ENGINE) return;

    var input = main.querySelector('.ins-search-input');
    var wrapper = main.querySelector('.ins-section-wrapper');
    var container = main.querySelector('.ins-section-container');
    var lastTrigger = null;
    var searchTimer = null;
    var searchIndex = null;
    var dataPromise = null;

    if (main.parentNode) main.parentNode.removeChild(main);
    document.body.appendChild(main);
    main.setAttribute('aria-hidden', 'true');

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
        var titleText = title != null && title !== '' ? title : CONFIG.TRANSLATION.UNTITLED;
        var titleElement = createElement('span', 'ins-search-title');
        header.appendChild(createElement('i', 'fa-solid fa-' + icon));
        appendHighlightedText(titleElement, titleText, keywords || []);
        header.appendChild(titleElement);
        if (slug) header.appendChild(createElement('span', 'ins-slug', slug));
        item.appendChild(header);
        if (preview) {
            var previewElement = createElement('p', 'ins-search-preview');
            appendHighlightedText(previewElement, preview, keywords || []);
            item.appendChild(previewElement);
        }
        item.setAttribute('data-url', url);
        item.setAttribute('tabindex', '0');
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

    function cleanSearchText(text) {
        var parsed = new DOMParser().parseFromString(String(text || ''), 'text/html');

        return String(parsed.body.textContent || '')
            .replace(/[0-9]{8,}/g, ' ')
            .replace(/\b\d{1,4}(?=[#.$/A-Za-z])/g, ' ')
            .replace(/\b\d{1,4}\s+(?=[#.$/A-Za-z])/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function pathLabel(path) {
        var cleanPath = String(path || '').replace(/\/index\.html$/, '').replace(/\/$/, '');
        if (!cleanPath) return '';
        try {
            cleanPath = decodeURIComponent(cleanPath);
        } catch {
            cleanPath = cleanPath.replace(/%20/g, ' ');
        }
        return cleanPath;
    }

    function previewFor(item, keywordArray) {
        var sourceText = String(item.text || '');
        var rawOccur = ENGINE.findFirstOccur(keywordArray, item, 'text');
        var rawStart = rawOccur > 80 ? rawOccur - 80 : 0;
        var text = cleanSearchText(sourceText.slice(rawStart, rawStart + 800));
        var firstOccur = ENGINE.findFirstOccur(keywordArray, { text: text }, 'text');
        var start = firstOccur > 40 ? firstOccur - 40 : 0;
        var preview = text.slice(start, start + 180);
        if (start > 0) preview = '...' + preview;
        if (text.length > start + 180) preview += '...';
        return preview;
    }

    function sectionFactory(keywordArray, type, array) {
        if (array.length === 0) return null;

        var resultSection = section(CONFIG.TRANSLATION[type]);
        var limit = (type === 'POSTS' || type === 'PAGES') ? 30 : 20;
        array.slice(0, limit).forEach(function (result) {
            var item = result.item;
            var element;
            if (type === 'POSTS' || type === 'PAGES') {
                element = searchItem('file', item.title, pathLabel(item.path), previewFor(item, keywordArray), CONFIG.ROOT_URL + item.path, keywordArray);
            } else if (type === 'CATEGORIES' || type === 'TAGS') {
                element = searchItem(type === 'CATEGORIES' ? 'folder' : 'tag', item.name, item.slug, null, item.permalink, keywordArray);
            }
            if (element) resultSection.appendChild(element);
        });
        return resultSection;
    }

    function searchResultToDOM(keywordArray, searchResult) {
        var hasResults = false;
        while (container.firstChild) container.removeChild(container.firstChild);
        if (!keywordArray.length) return;
        Object.keys(searchResult).forEach(function (key) {
            var resultSection = sectionFactory(keywordArray, key.toUpperCase(), searchResult[key]);
            if (resultSection) {
                hasResults = true;
                container.appendChild(resultSection);
            }
        });
        if (!hasResults && keywordArray.length) {
            container.appendChild(createElement(
                'p',
                'ins-empty',
                CONFIG.TRANSLATION.EMPTY || 'No results. Try fewer or different keywords.'
            ));
        }
    }

    function scheduleSearch() {
        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(function () {
            var keywordArray = ENGINE.parseKeywords(input.value);
            if (!keywordArray.length) {
                searchResultToDOM(keywordArray, {});
                return;
            }
            if (searchIndex) searchResultToDOM(keywordArray, ENGINE.search(searchIndex, keywordArray));
        }, 160);
    }

    function showSearchError() {
        while (container.firstChild) container.removeChild(container.firstChild);
        container.appendChild(createElement(
            'p',
            'ins-empty ins-search-error',
            CONFIG.TRANSLATION.ERROR || 'Search data is unavailable.'
        ));
        input.disabled = true;
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

    function openSearch(trigger) {
        if (trigger) lastTrigger = trigger;
        main.classList.add('show');
        main.setAttribute('aria-hidden', 'false');
        input.focus();
        loadData();
    }

    function closeSearch() {
        main.classList.remove('show');
        main.setAttribute('aria-hidden', 'true');
        if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }

    function loadData() {
        if (dataPromise) return dataPromise;

        main.setAttribute('aria-busy', 'true');
        dataPromise = fetch(CONFIG.CONTENT_URL)
            .then(function (response) {
                if (!response.ok) throw new Error('Insight search data request failed.');
                return response.json();
            })
            .then(function (json) {
                searchIndex = ENGINE.createSearchIndex(json);
                input.addEventListener('input', scheduleSearch);
                searchResultToDOM([], {});
                return searchIndex;
            })
            .catch(function () {
                showSearchError();
                return null;
            })
            .finally(function () {
                main.removeAttribute('aria-busy');
            });

        return dataPromise;
    }

    document.addEventListener('click', function (event) {
        var searchInput = event.target.closest('.search-form-input');
        var searchTrigger = event.target.closest('.search-form-trigger');
        var searchItemElement = event.target.closest('.ins-search-item');
        var closeButton = event.target.closest('.ins-close');

        if (searchInput || searchTrigger) {
            event.preventDefault();
            openSearch(searchTrigger || searchInput);
        } else if (searchItemElement) {
            gotoLink(searchItemElement);
        } else if (closeButton || event.target.closest('.ins-search-mask')) {
            closeSearch();
        }
    });

    document.addEventListener('focusin', function (event) {
        if (!event.target.closest('.search-form-input')) return;
        openSearch(event.target);
    });

    document.addEventListener('keydown', function (event) {
        if (!main.classList.contains('show')) return;
        switch (event.key) {
            case 'Escape':
                closeSearch();
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
                gotoLink(container.querySelector('.ins-selectable.active') || event.target.closest('.ins-search-item'));
                break;
            case 'Tab':
                trapFocus(event);
                break;
        }
    });

    function trapFocus(event) {
        var focusables = Array.prototype.slice.call(main.querySelectorAll('input, button, .ins-search-item'));
        var current = document.activeElement;
        var index;
        if (!focusables.length) return;
        index = focusables.indexOf(current);
        if (event.shiftKey && index <= 0) {
            event.preventDefault();
            focusables[focusables.length - 1].focus();
        } else if (!event.shiftKey && index === focusables.length - 1) {
            event.preventDefault();
            focusables[0].focus();
        }
    }

    window.WIKIFLOW_INSIGHT = {
        close: closeSearch,
        open: openSearch
    };

    if (window.location.hash.trim() === '#ins-search') openSearch();
})(window, document, window.INSIGHT_CONFIG, window.WIKIFLOW_INSIGHT_ENGINE);
