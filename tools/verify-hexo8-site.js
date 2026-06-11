#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const Hexo = require('hexo');

const repoRoot = path.resolve(__dirname, '..');
const fixtureRoot = path.join(repoRoot, 'test', 'hexo8-site');
const browserMode = process.argv.includes('--browser');
const themeName = 'WikiFlow';
const scenarios = [
  {
    name: 'default',
    expectHtml: {
      includes: [
        'https://cdn.example.com/font-awesome.css',
        'https://cdn.example.com/mathjax.js'
      ],
      excludes: [
        '/libs/font-awesome/css/font-awesome.min.css',
        '/libs/open-sans/styles.css',
        '/libs/source-code-pro/styles.css'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'gallery-disabled',
    configPatch: config => config.replace('    gallery: true', '    gallery: false'),
    browser: {
      galleryEnabled: false
    }
  },
  {
    name: 'vendors-disabled',
    configPatch: config => config
      .replace('    fontawesome: https://cdn.example.com/font-awesome.css', '    fontawesome: false')
      .replace('    mathjax: https://cdn.example.com/mathjax.js', '    mathjax: false'),
    expectHtml: {
      excludes: [
        'https://cdn.example.com/font-awesome.css',
        '/libs/font-awesome/css/font-awesome.min.css',
        '/libs/open-sans/styles.css',
        '/libs/source-code-pro/styles.css',
        'https://cdn.example.com/mathjax.js',
        'MathJax.js'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'customize-highlight-compat',
    configPatch: config => config
      .replace('      light: github', '      light:')
      .replace('      dark: github-dark', '      dark:'),
    expectCss: {
      includes: [
        'Generated from highlight.js/styles/monokai.css',
        '--highlight-background: #272822;',
        '.highlight .code .string'
      ],
      excludes: [
        'Generated from highlight.js/styles/github.css',
        '@media (prefers-color-scheme: dark)',
        '.hljs-string',
        'code.hljs'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'custom-injects',
    configPatch: config => config.replace(
      'theme_config:\n',
      [
        'theme_config:',
        '  custom_file_path:',
        '    head: source/_data/wikiflow-head.ejs',
        '    comment: source/_data/wikiflow-comment.ejs',
        '    style: source/_data/wikiflow-style.styl',
        ''
      ].join('\n')
    ),
    prepare: async tmpRoot => {
      const dataDir = path.join(tmpRoot, 'source', '_data');
      await fs.promises.mkdir(dataDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(dataDir, 'wikiflow-head.ejs'),
        '<meta name="wikiflow-inject" content="head">\n'
      );
      await fs.promises.writeFile(
        path.join(dataDir, 'wikiflow-comment.ejs'),
        '<div id="wikiflow-comment-inject">Injected comment</div>\n'
      );
      await fs.promises.writeFile(
        path.join(dataDir, 'wikiflow-style.styl'),
        '.wikiflow-inject-test\n  color: #123456\n'
      );
    },
    expectHtml: {
      includes: [
        '<meta name="wikiflow-inject" content="head">',
        'id="wikiflow-comment-inject"'
      ]
    },
    expectCss: {
      includes: [
        '.wikiflow-inject-test',
        '#123456'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  }
];

async function copyFixture(scenario) {
  const tmpRoot = tmpRootForScenario(scenario);
  await fs.promises.rm(tmpRoot, { recursive: true, force: true });
  await fs.promises.mkdir(path.dirname(tmpRoot), { recursive: true });
  await fs.promises.cp(fixtureRoot, tmpRoot, { recursive: true });

  if (scenario.configPatch) {
    const configPath = path.join(tmpRoot, '_config.yml');
    const config = await fs.promises.readFile(configPath, 'utf8');
    await fs.promises.writeFile(configPath, scenario.configPatch(config));
  }

  if (scenario.prepare) {
    await scenario.prepare(tmpRoot);
  }

  const themesDir = path.join(tmpRoot, 'themes');
  const themePath = path.join(themesDir, themeName);
  await fs.promises.mkdir(themesDir, { recursive: true });
  await fs.promises.rm(themePath, { recursive: true, force: true });
  await fs.promises.mkdir(themePath, { recursive: true });

  for (const entry of ['layout', 'source', 'scripts', 'languages', 'package.json', '_config.yml', '_config.yml.example', '_vendors.yml']) {
    await fs.promises.cp(path.join(repoRoot, entry), path.join(themePath, entry), { recursive: true });
  }

  await fs.promises.writeFile(
    path.join(tmpRoot, 'package.json'),
    `${JSON.stringify({
      private: true,
      dependencies: require(path.join(repoRoot, 'package.json')).devDependencies
    }, null, 2)}\n`
  );
  await fs.promises.symlink(path.join(repoRoot, 'node_modules'), path.join(tmpRoot, 'node_modules'), 'dir');
}

async function run() {
  for (const scenario of scenarios) {
    await verifyScenario(scenario);
  }
}

async function verifyScenario(scenario) {
  const tmpRoot = tmpRootForScenario(scenario);
  await copyFixture(scenario);

  const hexo = new Hexo(tmpRoot, { silent: false });
  hexo.env.init = true;
  await hexo.init();
  await hexo.call('clean');
  await hexo.call('generate');
  await hexo.exit();

  const expectedFiles = [
    'index.html',
    'archives/index.html',
    'categories/index.html',
    'tags/index.html',
    'wiki/guide/first-note/index.html',
    'wiki/reference/second-note/index.html',
    'about/index.html',
    'content.json',
    'css/style.css'
  ];

  const missing = expectedFiles.filter(file => !fs.existsSync(path.join(tmpRoot, 'public', file)));
  if (missing.length) {
    throw new Error(`Hexo 8 fixture build missed expected files for ${scenario.name}: ${missing.join(', ')}`);
  }

  await verifyGeneratedHtml(scenario, tmpRoot);
  await verifyGeneratedCss(scenario, tmpRoot);

  if (browserMode) {
    await verifyBrowserRuntime(scenario);
  }
}

async function verifyGeneratedHtml(scenario, tmpRoot) {
  const htmlPath = path.join(tmpRoot, 'public', 'wiki', 'guide', 'first-note', 'index.html');
  const html = await fs.promises.readFile(htmlPath, 'utf8');
  const genericIncludes = [
    '<button id="profile-anchor" type="button" aria-controls="profile" aria-expanded="false"',
    '<img id="avatar" src="/css/images/logo.png" alt="WikiFlow" />'
  ];
  const genericExcludes = [
    'href="javascript:;"'
  ];
  const includes = genericIncludes.concat(scenario.expectHtml?.includes || []);
  const excludes = genericExcludes.concat(scenario.expectHtml?.excludes || []);
  const missing = includes.filter(fragment => !html.includes(fragment));
  const unexpected = excludes.filter(fragment => html.includes(fragment));

  if (missing.length || unexpected.length) {
    throw new Error(`HTML expectation failed for ${scenario.name}:\n${JSON.stringify({
      missing,
      unexpected
    }, null, 2)}`);
  }
}

async function verifyGeneratedCss(scenario, tmpRoot) {
  const cssPath = path.join(tmpRoot, 'public', 'css', 'style.css');
  const css = await fs.promises.readFile(cssPath, 'utf8');
  const expectation = scenario.expectCss || {};
  const genericIncludes = [
    '--color-surface: #fff;',
    'grid-template-areas: "sidebar main profile";',
    'grid-area: profile;',
    'grid-area: sidebar;'
  ];
  const genericExcludes = [
    'grid-area: true',
    "grid-area: 'left'",
    'grid-area: "left"'
  ];
  const includes = expectation.includes || [
    'Generated from highlight.js/styles/github.css',
    '--highlight-background: #ffffff;',
    '.highlight .code .variable.language_',
    '.highlight .code .title.function_',
    '@media (prefers-color-scheme: dark)',
    'Generated from highlight.js/styles/github-dark.css'
  ];
  const excludes = expectation.excludes || [
    '.hljs-variable',
    'code.hljs'
  ];
  const missing = genericIncludes.concat(includes).filter(fragment => !css.includes(fragment));
  const unexpected = genericExcludes.concat(excludes).filter(fragment => css.includes(fragment));

  if (css.length < 1000 || missing.length || unexpected.length) {
    throw new Error(`CSS expectation failed for ${scenario.name}:\n${JSON.stringify({
      length: css.length,
      missing,
      unexpected
    }, null, 2)}`);
  }
}

function tmpRootForScenario(scenario) {
  const suffix = browserMode ? 'browser' : 'build';
  return path.join(repoRoot, '.tmp', `hexo8-site-${scenario.name}-${suffix}`);
}

function servePublic(tmpRoot) {
  const publicRoot = path.join(tmpRoot, 'public');
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };

  const server = http.createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let filePath = path.join(publicRoot, urlPath);

    if (!filePath.startsWith(publicRoot)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      if (stats.isDirectory()) filePath = path.join(filePath, 'index.html');

      fs.readFile(filePath, (readError, data) => {
        if (readError) {
          response.writeHead(404);
          response.end('Not found');
          return;
        }

        response.writeHead(200, {
          'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
        });
        response.end(data);
      });
    });
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function verifyBrowserRuntime(scenario) {
  const tmpRoot = tmpRootForScenario(scenario);
  const { chromium } = require('playwright');
  const server = await servePublic(tmpRoot);
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const messages = [];
  const failedResponses = [];

  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', error => messages.push(`pageerror: ${error.message}`));
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });

  try {
    await page.goto(`http://127.0.0.1:${port}/wiki/guide/first-note/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const runtime = await page.evaluate(() => ({
      jquery: typeof window.jQuery,
      hasLightGallery: typeof window.lightGallery,
      hasLgThumbnail: typeof window.lgThumbnail,
      galleryItems: document.querySelectorAll('.gallery-item').length,
      justified: typeof window.jQuery?.fn?.justifiedGallery
    }));

    const layout = await page.evaluate(() => {
      const rectFor = selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          visible: rect.width > 0 && rect.height > 0
        };
      };

      return {
        header: rectFor('#header'),
        main: rectFor('#main'),
        profile: rectFor('#profile'),
        sidebar: rectFor('#sidebar'),
        article: rectFor('.article'),
        galleryItem: rectFor('.gallery-item')
      };
    });

    if (scenario.browser.galleryEnabled) {
      await page.click('.gallery-item');
      await page.waitForTimeout(500);
    }

    const lightbox = await page.evaluate(() => ({
      rootGalleryDisabled: document.documentElement.hasAttribute('data-gallery-disabled'),
      visibleGallery: !!document.querySelector('.wikiflow-lightbox.is-open'),
      closeButton: !!document.querySelector('.wikiflow-lightbox-close'),
      activeImage: !!document.querySelector('.wikiflow-lightbox-image[src]')
    }));

    const runtimeErrors = messages.filter(message => {
      return message.startsWith('pageerror') ||
        message.includes('ReferenceError') ||
        message.includes('TypeError');
    });

    if (runtime.jquery !== 'undefined' ||
      runtime.hasLightGallery !== 'undefined' ||
      runtime.hasLgThumbnail !== 'undefined' ||
      runtime.justified !== 'undefined' ||
      runtime.galleryItems < 1 ||
      !layout.header?.visible ||
      !layout.main?.visible ||
      !layout.profile?.visible ||
      !layout.sidebar?.visible ||
      !layout.article?.visible ||
      !layout.galleryItem?.visible ||
      layout.main.width < 500 ||
      layout.article.height < 200 ||
      lightbox.rootGalleryDisabled !== !scenario.browser.galleryEnabled ||
      (scenario.browser.galleryEnabled && (!lightbox.visibleGallery || !lightbox.closeButton || !lightbox.activeImage)) ||
      (!scenario.browser.galleryEnabled && (lightbox.visibleGallery || lightbox.closeButton || lightbox.activeImage)) ||
      runtimeErrors.length ||
      failedResponses.length) {
      throw new Error(`Browser fixture verification failed:\n${JSON.stringify({
        scenario: scenario.name,
        runtime,
        layout,
        lightbox,
        messages,
        failedResponses
      }, null, 2)}`);
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
