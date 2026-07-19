(function (window, document) {
    'use strict';

    var configScript = document.currentScript;
    var shortname = configScript && configScript.getAttribute('data-shortname');
    var pageUrl = configScript && configScript.getAttribute('data-page-url');
    var pageIdentifier = configScript && configScript.getAttribute('data-page-identifier');
    var scriptName = configScript && configScript.getAttribute('data-script-name');

    if (!shortname || !/^[a-z0-9_-]+$/i.test(shortname)) return;
    if (scriptName !== 'embed.js' && scriptName !== 'count.js') return;

    window.disqus_config = function () {
        if (pageUrl) this.page.url = pageUrl;
        if (pageIdentifier) this.page.identifier = pageIdentifier;
    };

    var script = document.createElement('script');
    script.src = 'https://' + shortname + '.disqus.com/' + scriptName;
    script.setAttribute('data-timestamp', String(Date.now()));
    (document.head || document.body).appendChild(script);
})(window, document);
