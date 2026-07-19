(function () {
    'use strict';

    var lastShareButton = null;

    function closeShareBoxes(restoreFocus) {
        document.querySelectorAll('.article-share-box.on').forEach(function (box) {
            box.classList.remove('on');
            box.style.display = '';
        });
        document.querySelectorAll('.article-share-link[aria-expanded="true"]').forEach(function (button) {
            button.setAttribute('aria-expanded', 'false');
        });
        if (restoreFocus && lastShareButton) lastShareButton.focus();
    }

    function createShareLink(href, className, title) {
        var link = document.createElement('a');
        link.href = href;
        link.className = className;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = title;
        return link;
    }

    function createShareBox(id, url) {
        var encodedUrl = encodeURIComponent(url);
        var box = document.createElement('div');
        var input = document.createElement('input');
        var links = document.createElement('div');

        box.id = id;
        box.className = 'article-share-box';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'false');
        input.className = 'article-share-input';
        input.value = url;
        input.readOnly = true;
        links.className = 'article-share-links';
        links.appendChild(createShareLink('https://twitter.com/intent/tweet?url=' + encodedUrl, 'fa-brands fa-x-twitter article-share-twitter', 'Twitter'));
        links.appendChild(createShareLink('https://www.facebook.com/sharer.php?u=' + encodedUrl, 'fa-brands fa-facebook article-share-facebook', 'Facebook'));
        links.appendChild(createShareLink('https://pinterest.com/pin/create/button/?url=' + encodedUrl, 'fa-brands fa-pinterest article-share-pinterest', 'Pinterest'));
        box.appendChild(input);
        box.appendChild(links);
        document.body.appendChild(box);
        return box;
    }

    document.body.addEventListener('click', function (event) {
        var shareLink = event.target.closest('.article-share-link');
        var shareBox = event.target.closest('.article-share-box');
        var shareInput = event.target.closest('.article-share-input');
        var shareBoxLink = event.target.closest('.article-share-links a');

        if (shareLink) {
            event.stopPropagation();

            var url = shareLink.getAttribute('data-url');
            var id = 'article-share-box-' + shareLink.getAttribute('data-id');
            var offset = shareLink.getBoundingClientRect();
            var box = document.getElementById(id);

            if (box && box.classList.contains('on')) {
                closeShareBoxes(true);
                return;
            }

            if (!box) box = createShareBox(id, url);

            closeShareBoxes(false);
            lastShareButton = shareLink;
            shareLink.setAttribute('aria-controls', id);
            shareLink.setAttribute('aria-expanded', 'true');
            box.setAttribute('aria-label', shareLink.getAttribute('aria-label') || 'Share');
            box.style.top = window.scrollY + offset.top + 25 + 'px';
            box.style.left = window.scrollX + offset.left + 'px';
            box.classList.add('on');
            shareInput = box.querySelector('.article-share-input');
            if (shareInput) shareInput.focus();
            return;
        }

        if (shareBox) {
            event.stopPropagation();
            if (shareInput) shareInput.select();
            if (shareBoxLink) {
                event.preventDefault();
                window.open(shareBoxLink.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
            }
            return;
        }

        closeShareBoxes(false);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && document.querySelector('.article-share-box.on')) {
            closeShareBoxes(true);
        }
    });
})();
