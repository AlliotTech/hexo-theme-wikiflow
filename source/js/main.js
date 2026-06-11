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
        lightbox.className = 'wikiflow-lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.innerHTML = [
            '<button type="button" class="wikiflow-lightbox-close" aria-label="Close image">&times;</button>',
            '<img class="wikiflow-lightbox-image" alt="">',
            '<div class="wikiflow-lightbox-caption"></div>'
        ].join('');
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

        document.addEventListener('click', function () {
            profile.classList.remove('card');
        });
        anchor.addEventListener('click', function (event) {
            event.stopPropagation();
            profile.classList.toggle('card');
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
            var html = item.innerHTML.trim();
            var checked = /^\[x\]/i.test(item.textContent.trim());
            var unchecked = /^\[ \]/.test(item.textContent.trim());
            if (!checked && !unchecked) return;

            item.classList.add('task-list');
            if (checked) item.classList.add('check');
            item.innerHTML = html.replace(/^\[(?: |x)\]/i, '<input type="checkbox" disabled ' + (checked ? 'checked' : '') + '>');
        });
    }

    ready(function () {
        setupImages();
        setupLightbox();
        setupProfileCard();
        setupToTop();
        setupTaskLists();
    });
})();
