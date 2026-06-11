(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
            return;
        }
        callback();
    }

    function closest(element, selector) {
        return element && element.closest ? element.closest(selector) : null;
    }

    function wrapImage(image) {
        var parent = image.parentElement;
        if (!parent || parent.tagName === 'A' || parent.classList.contains('gallery-item')) return;

        var link = document.createElement('a');
        link.href = image.currentSrc || image.src;
        link.title = image.alt || '';
        link.className = 'gallery-item';
        parent.insertBefore(link, image);
        link.appendChild(image);
    }

    function addCaption(image) {
        if (!image.alt || closest(image, '.article-gallery')) return;
        var next = image.nextElementSibling;
        if (next && next.classList.contains('caption')) return;

        var caption = document.createElement('span');
        caption.className = 'caption';
        caption.textContent = image.alt;
        image.insertAdjacentElement('afterend', caption);
    }

    function setupImages() {
        document.querySelectorAll('.article-entry img').forEach(function (image) {
            addCaption(image);
            wrapImage(image);
        });
    }

    function createLightbox() {
        var lightbox = document.createElement('div');
        var closeButton = document.createElement('button');
        var image = document.createElement('img');
        var caption = document.createElement('div');

        lightbox.className = 'wikiflow-lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        closeButton.type = 'button';
        closeButton.className = 'wikiflow-lightbox-close';
        closeButton.setAttribute('aria-label', 'Close image');
        closeButton.textContent = String.fromCharCode(215);
        image.className = 'wikiflow-lightbox-image';
        image.alt = '';
        caption.className = 'wikiflow-lightbox-caption';
        lightbox.appendChild(closeButton);
        lightbox.appendChild(image);
        lightbox.appendChild(caption);
        document.body.appendChild(lightbox);
        return lightbox;
    }

    function setupLightbox() {
        var enabled = !document.documentElement.hasAttribute('data-gallery-disabled');
        if (!enabled) return;

        var lightbox = createLightbox();
        var image = lightbox.querySelector('.wikiflow-lightbox-image');
        var caption = lightbox.querySelector('.wikiflow-lightbox-caption');

        function close() {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            image.removeAttribute('src');
            document.body.classList.remove('wikiflow-lightbox-open');
        }

        document.addEventListener('click', function (event) {
            var trigger = closest(event.target, '.gallery-item');
            if (!trigger) return;
            event.preventDefault();

            var triggerImage = trigger.querySelector('img');
            image.src = trigger.href;
            image.alt = triggerImage ? triggerImage.alt : '';
            caption.textContent = trigger.title || image.alt || '';
            caption.hidden = !caption.textContent;
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('wikiflow-lightbox-open');
        });

        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox || closest(event.target, '.wikiflow-lightbox-close')) {
                close();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && lightbox.classList.contains('is-open')) close();
        });
    }

    function setupProfileCard() {
        var profile = document.getElementById('profile');
        var anchor = document.getElementById('profile-anchor');
        if (!profile || !anchor) return;

        function setExpanded(expanded) {
            profile.classList.toggle('card', expanded);
            anchor.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }

        document.addEventListener('click', function () {
            setExpanded(false);
        });
        anchor.addEventListener('click', function (event) {
            event.stopPropagation();
            setExpanded(!profile.classList.contains('card'));
        });
        var inner = profile.querySelector('.profile-inner');
        if (inner) {
            inner.addEventListener('click', function (event) {
                event.stopPropagation();
            });
        }
    }

    function setupToTop() {
        var sidebar = document.getElementById('sidebar');
        var toTop = document.getElementById('toTop');
        if (!sidebar || !toTop) return;

        var threshold = sidebar.offsetHeight - window.innerHeight + 60;
        function update() {
            if (document.documentElement.clientWidth >= 800 && window.scrollY > threshold && window.scrollY > 0) {
                toTop.style.display = 'block';
                toTop.style.left = sidebar.getBoundingClientRect().left + window.scrollX + 'px';
            } else {
                toTop.style.display = 'none';
            }
        }

        document.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', function () {
            threshold = sidebar.offsetHeight - window.innerHeight + 60;
            update();
        });
        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function setupTaskLists() {
        document.querySelectorAll('.article-entry ul > li').forEach(function (item) {
            var text = item.textContent.trim();
            var checked = /^\[x\]/i.test(text);
            var unchecked = /^\[ \]/.test(text);
            var checkbox;
            if (!checked && !unchecked) return;

            item.classList.add('task-list');
            if (checked) item.classList.add('check');
            checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.disabled = true;
            checkbox.checked = checked;

            if (item.firstChild && item.firstChild.nodeType === Node.TEXT_NODE) {
                item.firstChild.nodeValue = item.firstChild.nodeValue.replace(/^\s*\[(?: |x)\]\s*/i, '');
            }
            item.insertBefore(checkbox, item.firstChild);
        });
    }

    function setupCategoryTree() {
        var categories = document.getElementById('categories');
        var iconFolderOpenClass = 'fa-folder-open';
        var iconFolderCloseClass = 'fa-folder';
        var iconAllExpandClass = 'fa-angle-double-down';
        var iconAllPackClass = 'fa-angle-double-up';

        if (!categories) return;

        function setFolderIcon(icon, expanded) {
            if (!icon) return;
            icon.classList.remove(iconFolderOpenClass, iconFolderCloseClass);
            icon.classList.add(expanded ? iconFolderOpenClass : iconFolderCloseClass);
        }

        function setAllIcon(icon, expanded) {
            if (!icon) return;
            icon.classList.remove(iconAllExpandClass, iconAllPackClass);
            icon.classList.add(expanded ? iconAllPackClass : iconAllExpandClass);
        }

        function setDirectory(directory, expanded) {
            var link = directory.querySelector(':scope > a[data-role="directory"]');
            var icon = link && link.querySelector('.fa');

            directory.classList.toggle('open', expanded);
            if (link) link.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            setFolderIcon(icon, expanded);
        }

        function setBranch(directoryLink, expanded, includeChildren) {
            var directory = directoryLink.closest('li.directory');
            var branches;

            if (!directory) return;
            branches = includeChildren ? directory.querySelectorAll('li.directory') : [];
            setDirectory(directory, expanded);
            branches.forEach(function (branch) {
                setDirectory(branch, expanded);
            });
        }

        categories.addEventListener('click', function (event) {
            var directoryLink = event.target.closest('a[data-role="directory"]');
            var allExpandLink = event.target.closest('#allExpand');
            var allIcon;
            var shouldExpandAll;

            if (directoryLink) {
                event.preventDefault();
                setBranch(directoryLink, !directoryLink.closest('li.directory').classList.contains('open'), false);
                return;
            }

            if (!allExpandLink) return;
            event.preventDefault();
            allIcon = allExpandLink.querySelector('.fa');
            shouldExpandAll = allIcon && allIcon.classList.contains(iconAllExpandClass);
            categories.querySelectorAll('li.directory').forEach(function (directory) {
                setDirectory(directory, shouldExpandAll);
            });
            setAllIcon(allIcon, shouldExpandAll);
        });

        categories.querySelectorAll('a[data-role="directory"]').forEach(function (directoryLink) {
            directoryLink.addEventListener('contextmenu', function (event) {
                event.preventDefault();
                setBranch(directoryLink, !directoryLink.closest('li.directory').classList.contains('open'), true);
            });
        });
    }

    ready(function () {
        setupImages();
        setupLightbox();
        setupProfileCard();
        setupToTop();
        setupTaskLists();
        setupCategoryTree();
    });
})();
