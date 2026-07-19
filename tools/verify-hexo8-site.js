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
        'https://cdn.example.com/mathjax-v4.js',
        'window.MathJax = {',
        'id="MathJax-script"'
      ],
      excludes: [
        'https://cdn.example.com/fontawesome-free.css',
        '/libs/fontawesome-free/css/all.min.css',
        '/libs/open-sans/styles.css',
        '/libs/source-code-pro/styles.css'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'language-array',
    configPatch: config => config.replace(
      'language: en',
      [
        'language:',
        '  - zh-CN',
        '  - en'
      ].join('\n')
    ),
    expectHtml: {
      includes: [
        '<html lang="zh-CN"',
        '跳到主要内容',
        'aria-label="菜单"',
        'aria-label="关闭搜索"'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'page-language',
    configPatch: config => config.replace(
      'language: en',
      ['language:', '  - en', '  - zh-CN'].join('\n')
    ),
    prepare: async tmpRoot => {
      const pageDir = path.join(tmpRoot, 'source', 'zh-page');
      await fs.promises.mkdir(pageDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(pageDir, 'index.md'),
        '---\ntitle: 中文页面\nlang: zh-CN\nlayout: page\n---\n正文。\n'
      );
    },
    verifyGenerated: async tmpRoot => {
      const html = await fs.promises.readFile(path.join(tmpRoot, 'public', 'zh-page', 'index.html'), 'utf8');
      if (!html.includes('<html lang="zh-CN"')) {
        throw new Error('Page-level language was not reflected in the html lang attribute.');
      }
    },
    browser: false
  },
  {
    name: 'mathjax-page-opt-in',
    configPatch: config => config.replace('    mathjax: true', '    mathjax: false'),
    prepare: async tmpRoot => {
      const postPath = path.join(tmpRoot, 'source', '_posts', 'guide', 'first-note.md');
      const post = await fs.promises.readFile(postPath, 'utf8');
      await fs.promises.writeFile(postPath, post.replace('comments: true', 'comments: true\nmathjax: true'));
    },
    verifyGenerated: async tmpRoot => {
      const postHtml = await fs.promises.readFile(path.join(tmpRoot, 'public', 'wiki', 'guide', 'first-note', 'index.html'), 'utf8');
      const aboutHtml = await fs.promises.readFile(path.join(tmpRoot, 'public', 'about', 'index.html'), 'utf8');
      if (!postHtml.includes('id="MathJax-script"') || aboutHtml.includes('id="MathJax-script"')) {
        throw new Error('Page-level MathJax opt-in did not isolate the vendor script to the requested page.');
      }
    },
    browser: false
  },
  {
    name: 'third-party-integrations',
    configPatch: config => config
      .replace('    disqus:', '    disqus: wikiflow-test')
      .replace('    google_analytics:', '    google_analytics: G-WIKIFLOW1'),
    expectHtml: {
      includes: [
        'src="/js/analytics.js" data-measurement-id="G-WIKIFLOW1"',
        'https://www.googletagmanager.com/gtag/js?id=G-WIKIFLOW1',
        'src="/js/disqus.js"',
        'data-shortname="wikiflow-test"',
        'data-page-identifier="guide/first-note"'
      ],
      excludes: [
        'https://www.google-analytics.com/analytics.js',
        "this.page.identifier = '"
      ]
    },
    verifyGenerated: async tmpRoot => {
      const aboutHtml = await fs.promises.readFile(path.join(tmpRoot, 'public', 'about', 'index.html'), 'utf8');
      if (aboutHtml.includes('src="/js/disqus.js"') || aboutHtml.includes('count.js')) {
        throw new Error('Disqus count script was loaded on a page without a comments section.');
      }
    },
    browser: false
  },
  {
    name: 'share-disabled',
    shareDisabled: true,
    configPatch: config => config.replace('  share: default', '  share: false'),
    expectHtml: {
      excludes: [
        'class="article-share-link"',
        'src="/js/share.js"'
      ]
    },
    browser: false
  },
  {
    name: 'custom-archive-dir',
    archiveDir: 'records',
    configPatch: config => config.replace('archive_dir: archives', 'archive_dir: records'),
    verifyGenerated: async tmpRoot => {
      const html = await fs.promises.readFile(path.join(tmpRoot, 'public', 'records', 'index.html'), 'utf8');
      if (!html.includes('href="/records/2026/"') || html.includes('href="/archives/2026/"')) {
        throw new Error('Archive timeline links do not respect archive_dir.');
      }
    },
    browser: false
  },
  {
    name: 'home-index-pagination',
    skipIndexListAssertions: true,
    configPatch: config => config.replace('    index_file:', '    index_file: index.md'),
    prepare: async tmpRoot => {
      const postsDir = path.join(tmpRoot, 'source', '_posts');
      await fs.promises.writeFile(
        path.join(postsDir, 'index.md'),
        '---\ntitle: Pinned Home Article\ndate: 2026-03-30 00:00:00\n---\nPinned body.\n'
      );
      for (let index = 1; index <= 10; index++) {
        const day = String(index).padStart(2, '0');
        await fs.promises.writeFile(
          path.join(postsDir, `extra-${index}.md`),
          `---\ntitle: Extra Post ${index}\ndate: 2026-03-${day} 00:00:00\n---\nExtra body.\n`
        );
      }
    },
    verifyGenerated: async tmpRoot => {
      const html = await fs.promises.readFile(path.join(tmpRoot, 'public', 'page', '2', 'index.html'), 'utf8');
      const articleIds = Array.from(html.matchAll(/<article id="([^"]+)"/g), match => match[1]);
      if (articleIds.includes('post-index') || !articleIds.length || !html.includes('id="page-nav"')) {
        throw new Error(`Pinned home article replaced paginated posts: ${articleIds.join(', ')}`);
      }
    },
    browser: false
  },
  {
    name: 'archive-month-counts',
    configPatch: config => config.replace(
      'archive_generator:\n  per_page: 10',
      'archive_generator:\n  per_page: 5'
    ),
    prepare: async tmpRoot => {
      const postsDir = path.join(tmpRoot, 'source', '_posts');
      for (let index = 1; index <= 8; index++) {
        await fs.promises.writeFile(
          path.join(postsDir, `january-extra-${index}.md`),
          `---\ntitle: January Extra ${index}\ndate: 2026-01-${String(index + 10).padStart(2, '0')} 00:00:00\n---\nBody.\n`
        );
      }
    },
    verifyGenerated: async tmpRoot => {
      const pagePaths = [
        path.join(tmpRoot, 'public', 'archives', 'index.html'),
        path.join(tmpRoot, 'public', 'archives', 'page', '2', 'index.html')
      ];
      for (const pagePath of pagePaths) {
        const html = await fs.promises.readFile(pagePath, 'utf8');
        const match = html.match(/href="\/archives\/2026\/01\/">2026-01<\/a><span class="archive-list-count">(\d+)<\/span>/);
        if (!match || Number(match[1]) !== 9) {
          throw new Error(`Archive month count was not site-wide in ${pagePath}: ${match && match[1]}`);
        }
      }
    },
    browser: false
  },
  {
    name: 'category-full',
    categoryMode: 'full',
    configPatch: config => config.replace(
      /  category:\r?\n    expand_all: false/,
      [
        '  category:',
        '    mode: full',
        '    expand_all: false'
      ].join('\n')
    ),
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'output-escaping',
    categoryMode: 'full',
    configPatch: config => config
      .replace(
        /  category:\r?\n    expand_all: false/,
        [
          '  category:',
          '    mode: full',
          '    expand_all: false'
        ].join('\n')
      )
      .replace(
        '    About: /about',
        '    About: \'https://example.com/" onmouseover="window.WIKIFLOW_XSS=1\''
      )
      .replace(
        '    WikiFlow: https://github.com/AlliotTech/hexo-theme-wikiflow',
        '    WikiFlow: \'https://example.com/" data-wikiflow-injected="true\''
      ),
    prepare: async tmpRoot => {
      const postPath = path.join(tmpRoot, 'source', '_posts', 'guide', 'first-note.md');
      const post = await fs.promises.readFile(postPath, 'utf8');
      await fs.promises.writeFile(
        postPath,
        post
          .replace('title: First Note', 'title: \'First <img src=x onerror="window.WIKIFLOW_XSS=1">\'')
          .replace('  - wiki', '  - \'wiki <math href="javascript:window.WIKIFLOW_XSS=1">\'')
          .replace('  - Basics', '  - \'Basics <svg onload="window.WIKIFLOW_XSS=1">\'')
      );
    },
    expectHtml: {
      includes: [
        'First &lt;img src=x onerror=&#34;window.WIKIFLOW_XSS=1&#34;&gt;',
        'Basics &lt;svg onload=&#34;window.WIKIFLOW_XSS=1&#34;&gt;',
        'wiki &lt;math href=&#34;javascript:window.WIKIFLOW_XSS=1&#34;&gt;',
        'href="https://example.com/&#34; onmouseover=&#34;window.WIKIFLOW_XSS=1"'
      ],
      excludes: [
        '<img src=x onerror="window.WIKIFLOW_XSS=1">',
        '<svg onload="window.WIKIFLOW_XSS=1">',
        '<math href="javascript:window.WIKIFLOW_XSS=1">',
        ' onmouseover="window.WIKIFLOW_XSS=1"',
        ' data-wikiflow-injected="true"'
      ]
    },
    expectAllHtmlExcludes: [
      '<img src=x onerror="window.WIKIFLOW_XSS=1">',
      '<svg onload="window.WIKIFLOW_XSS=1">',
      '<math href="javascript:window.WIKIFLOW_XSS=1">',
      ' onmouseover="window.WIKIFLOW_XSS=1"',
      ' data-wikiflow-injected="true"'
    ],
    browser: false
  },
  {
    name: 'gallery-disabled',
    configPatch: config => config.replace('    gallery: true', '    gallery: false'),
    browser: {
      galleryEnabled: false
    }
  },
  {
    name: 'insight-disabled',
    configPatch: config => config.replace('    insight: true', '    insight: false'),
    expectHtml: {
      includes: [
        'class="search-form-submit"',
        'wikiflow-icon-solid-magnifying-glass'
      ],
      excludes: [
        'window.INSIGHT_CONFIG',
        'class="ins-search"'
      ]
    },
    browser: false
  },
  {
    name: 'fontawesome-compat',
    configPatch: config => config.replace(
      '    fontawesome: false',
      '    fontawesome: https://cdn.example.com/fontawesome-free.css'
    ),
    expectHtml: {
      includes: [
        'https://cdn.example.com/fontawesome-free.css'
      ]
    },
    browser: false
  },
  {
    name: 'vendors-disabled',
    configPatch: config => config.replace('    mathjax: https://cdn.example.com/mathjax-v4.js', '    mathjax: false'),
    expectHtml: {
      excludes: [
        'https://cdn.example.com/fontawesome-free.css',
        '/libs/fontawesome-free/css/all.min.css',
        '/libs/open-sans/styles.css',
        '/libs/source-code-pro/styles.css',
        'https://cdn.example.com/mathjax-v4.js',
        'MathJax-script',
        'window.MathJax'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'footer-beian',
    configPatch: config => config.replace(
      /  favicon: \/css\/images\/favicon\.ico\r?\n/,
      [
        '  favicon: /css/images/favicon.ico',
        '  footer:',
        '    license:',
        '      enable: true',
        '      name: Example License',
        '      url: https://example.com/license',
        '      icon: /css/images/favicon.ico',
        '    beian:',
        '      enable: true',
        '      icp: 京ICP备12345678号-1',
        '      gongan_id: 11000002000001',
        '      gongan_num: 京公网安备11000002000001号',
        '      gongan_icon_url: /css/images/favicon.ico',
        ''
      ].join('\n')
    ),
    expectHtml: {
      includes: [
        'href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer nofollow"',
        '京ICP备12345678号-1',
        'href="https://beian.mps.gov.cn/#/query/webSearch?code=11000002000001" target="_blank" rel="noopener noreferrer nofollow"',
        '京公网安备11000002000001号',
        'class="beian-gongan"',
        'src="/css/images/favicon.ico"',
        'rel="license" href="https://example.com/license"',
        'Example License'
      ]
    },
    expectCss: {
      includes: [
        '.beian',
        '.beian-gongan img'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'codeblock-default-theme',
    configPatch: config => config
      .replace('      light: github', '      light:')
      .replace('      dark: github-dark', '      dark:'),
    expectCss: {
      includes: [
        '--highlight-background: #272822;',
        '.hljs-string',
        'code.hljs'
      ],
      excludes: [
        'Generated from highlight.js/styles/monokai.css',
        '@media (prefers-color-scheme: dark)',
        '.highlight .code .string'
      ]
    },
    browser: {
      galleryEnabled: true
    }
  },
  {
    name: 'custom-injects',
    configPatch: config => config.replace(
      /theme_config:\r?\n/,
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

  const archiveDir = scenario.archiveDir || 'archives';
  const expectedFiles = [
    'index.html',
    `${archiveDir}/index.html`,
    'categories/index.html',
    'tags/index.html',
    'wiki/guide/first-note/index.html',
    'wiki/reference/second-note/index.html',
    'about/index.html',
    'embed/index.html',
    'content.json',
    'css/style.css'
  ];

  const missing = expectedFiles.filter(file => !fs.existsSync(path.join(tmpRoot, 'public', file)));
  if (missing.length) {
    throw new Error(`Hexo 8 fixture build missed expected files for ${scenario.name}: ${missing.join(', ')}`);
  }

  await verifyCategoryTreeAsset(scenario, tmpRoot);
  await verifyIconSpriteAsset(scenario, tmpRoot);

  await verifyGeneratedHtml(scenario, tmpRoot);
  await verifyAllGeneratedHtml(scenario, tmpRoot);
  await verifySmokeHtml(scenario, tmpRoot);
  await verifyGeneratedCss(scenario, tmpRoot);
  if (scenario.verifyGenerated) await scenario.verifyGenerated(tmpRoot);

  if (browserMode && scenario.browser !== false) {
    await verifyBrowserRuntime(scenario);
  }
}

async function verifyAllGeneratedHtml(scenario, tmpRoot) {
  const forbidden = scenario.expectAllHtmlExcludes || [];
  if (!forbidden.length) return;

  const publicRoot = path.join(tmpRoot, 'public');
  const htmlFiles = [];

  async function visit(directory) {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(target);
      } else if (entry.name.endsWith('.html')) {
        htmlFiles.push(target);
      }
    }
  }

  await visit(publicRoot);
  const failures = [];

  for (const file of htmlFiles) {
    const html = await fs.promises.readFile(file, 'utf8');
    const matches = forbidden.filter(fragment => html.includes(fragment));
    if (matches.length) {
      failures.push({
        file: path.relative(publicRoot, file),
        matches
      });
    }
  }

  if (failures.length) {
    throw new Error(`Unsafe HTML output found for ${scenario.name}:\n${JSON.stringify(failures, null, 2)}`);
  }
}

async function verifyCategoryTreeAsset(scenario, tmpRoot) {
  const assetDir = path.join(tmpRoot, 'public', 'assets', 'wikiflow');
  const mode = scenario.categoryMode || 'external';
  const files = fs.existsSync(assetDir)
    ? (await fs.promises.readdir(assetDir)).filter(file => /^category-tree\.[a-f0-9]{12}\.json$/.test(file))
    : [];

  if (mode === 'full') {
    if (files.length) {
      throw new Error(`Full category mode should not emit an external tree asset for ${scenario.name}: ${files.join(', ')}`);
    }
    return;
  }

  if (files.length !== 1) {
    throw new Error(`External category mode expected one hashed tree asset for ${scenario.name}, found: ${files.join(', ') || '(none)'}`);
  }

  const payload = JSON.parse(await fs.promises.readFile(path.join(assetDir, files[0]), 'utf8'));
  if (payload.version !== 2 || !payload.tree || !Array.isArray(payload.tree.children)) {
    throw new Error(`External category tree payload is malformed for ${scenario.name}`);
  }
}

async function verifyIconSpriteAsset(scenario, tmpRoot) {
  const assetDir = path.join(tmpRoot, 'public', 'assets', 'wikiflow');
  const files = fs.existsSync(assetDir)
    ? (await fs.promises.readdir(assetDir)).filter(file => /^icons\.[a-f0-9]{12}\.svg$/.test(file))
    : [];

  if (files.length !== 1) {
    throw new Error(`Expected one hashed icon sprite for ${scenario.name}, found: ${files.join(', ') || '(none)'}`);
  }

  const sprite = await fs.promises.readFile(path.join(assetDir, files[0]), 'utf8');
  const requiredSymbols = [
    'wikiflow-icon-solid-calendar',
    'wikiflow-icon-solid-folder',
    'wikiflow-icon-brands-github',
    'wikiflow-icon-solid-rss'
  ];
  const missing = requiredSymbols.filter(symbol => !sprite.includes(`id="${symbol}"`));
  if (missing.length || sprite.includes('wikiflow-icon-brands-discord')) {
    throw new Error(`Icon sprite contents are invalid for ${scenario.name}: ${JSON.stringify({ missing })}`);
  }
}

async function verifySmokeHtml(scenario, tmpRoot) {
  const smokeFiles = [
    'index.html',
    'categories/index.html',
    'tags/index.html',
    'wiki/guide/first-note/index.html'
  ];

  const failures = [];
  for (const file of smokeFiles) {
    const html = await fs.promises.readFile(path.join(tmpRoot, 'public', file), 'utf8');
    if (html.length < 500 || !html.includes('id="container"')) {
      failures.push({
        file,
        length: html.length,
        hasContainer: html.includes('id="container"')
      });
    }
  }

  if (failures.length) {
    throw new Error(`Smoke HTML expectation failed for ${scenario.name}:\n${JSON.stringify(failures, null, 2)}`);
  }
}

async function verifyGeneratedHtml(scenario, tmpRoot) {
  const htmlPath = path.join(tmpRoot, 'public', 'wiki', 'guide', 'first-note', 'index.html');
  const html = await fs.promises.readFile(htmlPath, 'utf8');
  const indexHtml = await fs.promises.readFile(path.join(tmpRoot, 'public', 'index.html'), 'utf8');
  const embedHtml = await fs.promises.readFile(path.join(tmpRoot, 'public', 'embed', 'index.html'), 'utf8');
  const tocDisabledHtmlPath = path.join(tmpRoot, 'public', 'wiki', 'reference', 'second-note', 'index.html');
  const tocDisabledHtml = await fs.promises.readFile(tocDisabledHtmlPath, 'utf8');
  const categoryMode = scenario.categoryMode || 'external';
  const genericIncludes = [
    '<link rel="canonical" href="https://example.com/wiki/guide/first-note/">',
    '<meta name="description" content="',
    '<script type="application/ld+json">',
    '<button id="profile-anchor" type="button" aria-controls="profile" aria-expanded="false"',
    '<img id="avatar" src="/css/images/logo.png" alt="WikiFlow" />',
    'sidebar-category-panel sidebar-panel-active-categories',
    'data-sidebar-panel="outline"',
    'id="categories-outline-body"',
    'class="post-toc post-toc-mobile"',
    'class="wikiflow-icon fa-solid fa-calendar"',
    'class="wikiflow-icon fa-brands fa-github"',
    '<use href="/assets/wikiflow/icons.',
    'class="article-banner" decoding="async"',
    'loading="lazy" decoding="async"',
    'alt="Rendered content image" loading="lazy" decoding="async"',
    'class="hljs-variable language_"',
    'class="hljs-title function_"'
  ];
  if (!scenario.shareDisabled) {
    genericIncludes.push('class="article-share-link"', 'src="/js/share.js"');
  }
  const genericExcludes = [
    'maximum-scale=1',
    'href="javascript:;"',
    'MathJax.Hub.Config',
    'text/x-mathjax-config',
    'fa fa-',
    '<span style="background-image:url(',
    '<p><h'
  ];
  const tocDisabledExcludes = [
    'id="categories-outline-body"',
    'data-sidebar-panel="outline"',
    'sidebar-category-panel',
    'class="post-toc post-toc-sidebar widget-wrap"',
    'class="post-toc post-toc-mobile"',
    '<a href="/wiki/reference/second-note/#more">Read More</a>'
  ];
  const categoryModeIncludes = categoryMode === 'full'
    ? [
        'data-category-mode="full"',
        'class="file active"'
      ]
    : [
        'data-category-mode="external"',
        'data-tree-src="/assets/wikiflow/category-tree.'
      ];
  const categoryModeExcludes = categoryMode === 'full'
    ? [
        'data-category-mode="external"',
        'data-tree-src="/assets/wikiflow/category-tree.'
      ]
    : [
        'class="file active"'
      ];
  const includes = genericIncludes.concat(categoryModeIncludes, scenario.expectHtml?.includes || []);
  const excludes = genericExcludes.concat(categoryModeExcludes, scenario.expectHtml?.excludes || []);
  const missing = includes.filter(fragment => !html.includes(fragment));
  const unexpected = excludes.filter(fragment => html.includes(fragment));
  const unexpectedTocDisabled = tocDisabledExcludes.filter(fragment => tocDisabledHtml.includes(fragment));
  const invalidIndexExcerpt = indexHtml.includes('<p><h');
  const descriptionMoreLink = indexHtml.match(/<div class="article-more-link">[\s\S]*?<a href="([^"]+)"/);
  const invalidDescriptionMoreLink = !scenario.skipIndexListAssertions &&
    (!descriptionMoreLink || descriptionMoreLink[1] !== '/wiki/reference/second-note/');
  const invalidEmbed = !embedHtml.includes('<body class="layout-embed">') ||
    !embedHtml.includes('title="Fixture frame" loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts" allow="fullscreen" allowfullscreen') ||
    embedHtml.includes('<style>');

  if (missing.length || unexpected.length || unexpectedTocDisabled.length || invalidIndexExcerpt || invalidDescriptionMoreLink || invalidEmbed) {
    throw new Error(`HTML expectation failed for ${scenario.name}:\n${JSON.stringify({
      missing,
      unexpected,
      unexpectedTocDisabled,
      invalidIndexExcerpt,
      descriptionMoreHref: descriptionMoreLink && descriptionMoreLink[1],
      invalidEmbed
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
    'grid-area: sidebar;',
    '.sidebar-category-panel',
    '.sidebar-panel-outline',
    '.post-toc-sidebar',
    '.post-toc-mobile',
    'body.layout-embed'
  ];
  const genericExcludes = [
    'grid-area: true',
    "grid-area: 'left'",
    'grid-area: "left"'
  ];
  const includes = expectation.includes || [
    '--highlight-background: #ffffff;',
    '.hljs-variable.language_',
    '.hljs-title.function_',
    '@media (prefers-color-scheme: dark)',
    '.hljs-string'
  ];
  const excludes = expectation.excludes || [
    'Generated from highlight.js/styles/github.css',
    'Generated from highlight.js/styles/github-dark.css',
    '.highlight .code .variable.language_',
    '.highlight .code .title.function_'
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
    await page.waitForFunction(() => {
      const categories = document.querySelector('#categories');
      return !categories ||
        categories.getAttribute('data-category-mode') === 'full' ||
        document.querySelector('#categories li.directory');
    }, null, { timeout: 3000 });
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
        categoryPanel: rectFor('#categories'),
        categoriesBody: rectFor('#categories-body'),
        outlineBody: rectFor('#categories-outline-body'),
        article: rectFor('.article'),
        galleryItem: rectFor('.gallery-item'),
        icon: rectFor('.article-date .wikiflow-icon'),
        iconGlyph: (() => {
          const icon = document.querySelector('.article-date .wikiflow-icon');
          if (!icon || typeof icon.getBBox !== 'function') return null;
          const bounds = icon.getBBox();
          return { width: bounds.width, height: bounds.height };
        })(),
        iconUseCount: document.querySelectorAll('.wikiflow-icon use').length,
        iconReference: document.querySelector('.wikiflow-icon use')?.getAttribute('href') || '',
        fontAwesomeStylesheet: Array.from(document.styleSheets).some(sheet => /fontawesome/iu.test(sheet.href || '')),
        activePanel: document.querySelector('#categories')?.classList.contains('sidebar-panel-active-categories') ? 'categories' : 'outline',
        activeTab: document.querySelector('.sidebar-panel-tab.is-active')?.getAttribute('data-sidebar-panel'),
        categoriesTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="categories"]')?.getAttribute('aria-selected'),
        outlineTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="outline"]')?.getAttribute('aria-selected'),
        categoryMode: document.querySelector('#categories')?.getAttribute('data-category-mode'),
        categoryActiveFile: !!document.querySelector('#categories li.file.active'),
        categoryFileCount: document.querySelectorAll('#categories li.file').length
      };
    });

    const categoryPanelLayout = await page.evaluate(() => {
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
        categoriesBody: rectFor('#categories-body'),
        outlineBody: rectFor('#categories-outline-body'),
        categoryMode: document.querySelector('#categories')?.getAttribute('data-category-mode'),
        categoryActiveFile: !!document.querySelector('#categories li.file.active'),
        categoryFileCount: document.querySelectorAll('#categories li.file').length,
        activePanel: document.querySelector('#categories')?.classList.contains('sidebar-panel-active-categories') ? 'categories' : 'outline',
        activeTab: document.querySelector('.sidebar-panel-tab.is-active')?.getAttribute('data-sidebar-panel'),
        categoriesTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="categories"]')?.getAttribute('aria-selected'),
        outlineTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="outline"]')?.getAttribute('aria-selected')
      };
    });

    await page.focus('.sidebar-panel-tab[data-sidebar-panel="categories"]');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => {
      const outline = document.querySelector('#categories-outline-body');
      if (!outline) return false;
      const rect = outline.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, null, { timeout: 3000 });

    const outlinePanelLayout = await page.evaluate(() => {
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
        categoriesBody: rectFor('#categories-body'),
        outlineBody: rectFor('#categories-outline-body'),
        activePanel: document.querySelector('#categories')?.classList.contains('sidebar-panel-active-outline') ? 'outline' : 'categories',
        activeTab: document.querySelector('.sidebar-panel-tab.is-active')?.getAttribute('data-sidebar-panel'),
        categoriesTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="categories"]')?.getAttribute('aria-selected'),
        outlineTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="outline"]')?.getAttribute('aria-selected')
      };
    });

    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => {
      const categories = document.querySelector('#categories-body');
      if (!categories) return false;
      const rect = categories.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, null, { timeout: 3000 });

    const categoryReturnLayout = await page.evaluate(() => {
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
        categoriesBody: rectFor('#categories-body'),
        outlineBody: rectFor('#categories-outline-body'),
        activePanel: document.querySelector('#categories')?.classList.contains('sidebar-panel-active-categories') ? 'categories' : 'outline',
        activeTab: document.querySelector('.sidebar-panel-tab.is-active')?.getAttribute('data-sidebar-panel'),
        categoriesTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="categories"]')?.getAttribute('aria-selected'),
        outlineTabSelected: document.querySelector('.sidebar-panel-tab[data-sidebar-panel="outline"]')?.getAttribute('aria-selected')
      };
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const mobileLayout = await page.evaluate(() => {
      const rectFor = selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          visible: rect.width > 0 && rect.height > 0
        };
      };
      const categories = rectFor('#categories');
      const article = rectFor('.article');
      const sidebarWidgets = Array.from(document.querySelectorAll('#sidebar .widget-wrap'))
        .map(widget => {
          const rect = widget.getBoundingClientRect();
          return {
            id: widget.id || null,
            top: Math.round(rect.top),
            height: Math.round(rect.height),
            visible: rect.width > 0 && rect.height > 0
          };
        })
        .filter(widget => widget.visible && widget.id !== 'categories');

      return {
        categories,
        article,
        outlineBody: rectFor('#categories-outline-body'),
        gapCategoriesToArticle: categories && article ? article.top - categories.bottom : null,
        otherWidgetsAfterArticle: sidebarWidgets.every(widget => article && widget.top >= article.bottom)
      };
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(300);

    if (scenario.browser.galleryEnabled) {
      await page.click('.gallery-item');
      await page.waitForTimeout(500);
    }

    const lightbox = await page.evaluate(() => ({
      rootGalleryDisabled: document.documentElement.hasAttribute('data-gallery-disabled'),
      visibleGallery: !!document.querySelector('.wikiflow-lightbox.is-open'),
      closeButton: !!document.querySelector('.wikiflow-lightbox-close'),
      activeImage: !!document.querySelector('.wikiflow-lightbox-image[src]'),
      closeButtonFocused: document.activeElement?.classList.contains('wikiflow-lightbox-close') || false
    }));

    let lightboxFocusReturned = true;
    if (scenario.browser.galleryEnabled) {
      await page.keyboard.press('Escape');
      lightboxFocusReturned = await page.evaluate(() => document.activeElement?.classList.contains('gallery-item') || false);
    }

    await page.click('.article-share-link');
    const share = await page.evaluate(() => {
      const button = document.querySelector('.article-share-link');
      const box = document.querySelector('.article-share-box.on');
      return {
        visible: !!box,
        expanded: button?.getAttribute('aria-expanded'),
        inputValue: box?.querySelector('.article-share-input')?.value || '',
        inputFocused: document.activeElement?.classList.contains('article-share-input') || false,
        iconCount: box?.querySelectorAll('.wikiflow-icon use').length || 0
      };
    });
    await page.keyboard.press('Escape');
    const shareClosed = await page.evaluate(() => ({
      visible: !!document.querySelector('.article-share-box.on'),
      expanded: document.querySelector('.article-share-link')?.getAttribute('aria-expanded'),
      focusReturned: document.activeElement?.classList.contains('article-share-link') || false
    }));

    const embedMessageStart = messages.length;
    await page.goto(`http://127.0.0.1:${port}/embed/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(100);
    const embedLayout = await page.evaluate(() => ({
      hasProfile: !!document.querySelector('#profile'),
      hasSidebar: !!document.querySelector('#sidebar'),
      hasIframe: !!document.querySelector('#embed_iframe')
    }));
    const embedErrors = messages.slice(embedMessageStart).filter(message => {
      return message.startsWith('pageerror') ||
        message.includes('ReferenceError') ||
        message.includes('TypeError');
    });

    let searchSuccess = null;
    let searchFailure = null;
    if (scenario.name === 'default') {
      const successPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      let successContentRequests = 0;
      successPage.on('request', request => {
        if (new URL(request.url()).pathname.endsWith('/content.json')) successContentRequests += 1;
      });
      await successPage.goto(`http://127.0.0.1:${port}/wiki/guide/first-note/`, { waitUntil: 'domcontentloaded' });
      await successPage.waitForTimeout(300);
      const successRequestsBeforeOpen = successContentRequests;
      await successPage.click('.search-form-trigger');
      await successPage.waitForFunction(() => {
        const search = document.querySelector('.ins-search');
        return !!window.WIKIFLOW_INSIGHT && search && !search.hasAttribute('aria-busy');
      });
      await successPage.fill('.ins-search-input', 'Overview');
      await successPage.waitForSelector('.ins-search-item');
      searchSuccess = await successPage.evaluate(() => ({
        visible: document.querySelector('.ins-search')?.classList.contains('show') || false,
        resultText: document.querySelector('.ins-search-item')?.textContent.trim() || ''
      }));
      searchSuccess.requestsBeforeOpen = successRequestsBeforeOpen;
      searchSuccess.requestsAfterOpen = successContentRequests;
      await successPage.close();

      const searchPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const searchErrors = [];
      let contentRequests = 0;
      searchPage.on('pageerror', error => searchErrors.push(error.message));
      searchPage.on('request', request => {
        if (new URL(request.url()).pathname.endsWith('/content.json')) contentRequests += 1;
      });
      await searchPage.route('**/content.json', route => route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{}'
      }));
      await searchPage.goto(`http://127.0.0.1:${port}/wiki/guide/first-note/`, { waitUntil: 'domcontentloaded' });
      await searchPage.waitForTimeout(300);
      const requestsBeforeOpen = contentRequests;
      await searchPage.click('.search-form-trigger');
      await searchPage.waitForSelector('.ins-search-error');
      searchFailure = await searchPage.evaluate(() => ({
        message: document.querySelector('.ins-search-error')?.textContent.trim() || '',
        inputDisabled: !!document.querySelector('.ins-search-input')?.disabled
      }));
      searchFailure.requestsBeforeOpen = requestsBeforeOpen;
      searchFailure.requestsAfterOpen = contentRequests;
      searchFailure.errors = searchErrors;
      await searchPage.close();
    }

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
      !layout.categoryPanel?.visible ||
      !layout.categoriesBody?.visible ||
      layout.outlineBody?.visible ||
      layout.activePanel !== 'categories' ||
      layout.activeTab !== 'categories' ||
      layout.categoriesTabSelected !== 'true' ||
      layout.outlineTabSelected !== 'false' ||
      !layout.article?.visible ||
      !layout.galleryItem?.visible ||
      !layout.icon?.visible ||
      !layout.iconGlyph || layout.iconGlyph.width <= 0 || layout.iconGlyph.height <= 0 ||
      layout.iconUseCount < 1 ||
      !/\/assets\/wikiflow\/icons\.[a-f0-9]{12}\.svg#wikiflow-icon-/u.test(layout.iconReference) ||
      layout.fontAwesomeStylesheet ||
      categoryPanelLayout.activePanel !== 'categories' ||
      categoryPanelLayout.activeTab !== 'categories' ||
      categoryPanelLayout.categoriesTabSelected !== 'true' ||
      categoryPanelLayout.outlineTabSelected !== 'false' ||
      !categoryPanelLayout.categoriesBody?.visible ||
      categoryPanelLayout.outlineBody?.visible ||
      categoryPanelLayout.categoryMode !== (scenario.categoryMode || 'external') ||
      !categoryPanelLayout.categoryActiveFile ||
      categoryPanelLayout.categoryFileCount < 1 ||
      outlinePanelLayout.activePanel !== 'outline' ||
      outlinePanelLayout.activeTab !== 'outline' ||
      outlinePanelLayout.categoriesTabSelected !== 'false' ||
      outlinePanelLayout.outlineTabSelected !== 'true' ||
      outlinePanelLayout.categoriesBody?.visible ||
      !outlinePanelLayout.outlineBody?.visible ||
      categoryReturnLayout.activePanel !== 'categories' ||
      categoryReturnLayout.activeTab !== 'categories' ||
      categoryReturnLayout.categoriesTabSelected !== 'true' ||
      categoryReturnLayout.outlineTabSelected !== 'false' ||
      !categoryReturnLayout.categoriesBody?.visible ||
      categoryReturnLayout.outlineBody?.visible ||
      layout.main.width < 500 ||
      layout.article.height < 200 ||
      !mobileLayout.categories?.visible ||
      mobileLayout.outlineBody?.visible ||
      !mobileLayout.article?.visible ||
      mobileLayout.gapCategoriesToArticle < 0 ||
      mobileLayout.gapCategoriesToArticle > 80 ||
      !mobileLayout.otherWidgetsAfterArticle ||
      lightbox.rootGalleryDisabled !== !scenario.browser.galleryEnabled ||
      (scenario.browser.galleryEnabled && (!lightbox.visibleGallery || !lightbox.closeButton || !lightbox.activeImage || !lightbox.closeButtonFocused || !lightboxFocusReturned)) ||
      (!scenario.browser.galleryEnabled && (lightbox.visibleGallery || lightbox.closeButton || lightbox.activeImage)) ||
      !share.visible ||
      share.expanded !== 'true' ||
      !share.inputValue ||
      !share.inputFocused ||
      share.iconCount !== 3 ||
      shareClosed.visible ||
      shareClosed.expanded !== 'false' ||
      !shareClosed.focusReturned ||
      embedLayout.hasProfile ||
      embedLayout.hasSidebar ||
      !embedLayout.hasIframe ||
      embedErrors.length ||
      (searchFailure && (
        searchFailure.requestsBeforeOpen !== 0 ||
        searchFailure.requestsAfterOpen !== 1 ||
        !searchFailure.message ||
        !searchFailure.inputDisabled ||
        searchFailure.errors.length
      )) ||
      (searchSuccess && (
        searchSuccess.requestsBeforeOpen !== 0 ||
        searchSuccess.requestsAfterOpen !== 1 ||
        !searchSuccess.visible ||
        !searchSuccess.resultText
      )) ||
      runtimeErrors.length ||
      failedResponses.length) {
      throw new Error(`Browser fixture verification failed:\n${JSON.stringify({
        scenario: scenario.name,
        runtime,
        layout,
        categoryPanelLayout,
        outlinePanelLayout,
        categoryReturnLayout,
        mobileLayout,
        lightbox,
        lightboxFocusReturned,
        share,
        shareClosed,
        embedLayout,
        embedErrors,
        searchSuccess,
        searchFailure,
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
