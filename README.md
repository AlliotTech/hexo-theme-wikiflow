# hexo-theme-wikiflow

[中文版文档](./README_zh-CN.md)

A knowledge-focused wiki theme for Hexo 8.

- Directory-based article categories for personal knowledge bases
- Two-column layout with expandable category navigation
- Optional Insight search, image gallery, MathJax, comments, sharing, and history links
- Designed for Hexo 8.1.0+ and Node.js 20.19.0+

![Site Preview](./docs/assets/SitePreview.png)

![mobile preview](./docs/assets/mobile1.png) ![mobile preview](./docs/assets/mobile2.png)

## Installation

`hexo-theme-wikiflow` is maintained by [AlliotTech](https://github.com/AlliotTech). It is a maintained fork of `hexo-theme-Wikitten`, with the original MIT license notices preserved.

### Install From npm

1. Install the theme in your Hexo site:

```bash
cd your-hexo-directory
npm install hexo-theme-wikiflow
```

2. Copy the starter pages and scaffolds:

```bash
cp -rf node_modules/hexo-theme-wikiflow/docs/starter/source/* source/
cp -rf node_modules/hexo-theme-wikiflow/docs/starter/scaffolds/* scaffolds/
```

3. Copy and edit the theme config:

```bash
cp -f node_modules/hexo-theme-wikiflow/_config.yml.example _config.wikiflow.yml
```

4. Enable the theme in the site `_config.yml`:

```yaml
theme: wikiflow
```

### Install From Source

Use a source install only when you want to modify the theme directly:

```bash
cd your-hexo-directory
git clone https://github.com/AlliotTech/hexo-theme-wikiflow.git themes/WikiFlow
cp -rf themes/WikiFlow/docs/starter/source/* source/
cp -rf themes/WikiFlow/docs/starter/scaffolds/* scaffolds/
```

When using `themes/WikiFlow`, set the site theme name to match the folder:

```yaml
theme: WikiFlow
```

### Update

```bash
npm install hexo-theme-wikiflow@latest
```

For a source install:

```bash
cd themes/WikiFlow
git pull origin main
```

## Site Configuration

Recommended site `_config.yml` settings:

```yaml
permalink: wiki/:title/

skip_render:
  - README.md
  - '_posts/**/embed_page/**'

new_post_name: :title.md

jsonContent:
  meta: false
  pages:
    title: true
    date: true
    path: true
    text: true
  posts:
    title: true
    date: true
    path: true
    text: true
    tags: true
    categories: true
  ignore:
    - 404.html

sitemap:
  path: sitemap.xml
```

Install only the site plugins for features you use:

```bash
npm install --save hexo-directory-category hexo-generator-json-content
```

Optional site plugins:

```bash
npm install --save hexo-generator-feed hexo-generator-sitemap hexo-filter-nofollow
```

`hexo-directory-category` enables directory-based categories. `hexo-generator-json-content` is required when `search.insight` is enabled. Sitemap, feed, and nofollow support are site-level choices, not theme requirements.

## Theme Configuration

Edit `_config.wikiflow.yml` in the site root. `_config.yml.example` in this repository is the canonical commented example.

Before publishing a site, replace the example values under `customize.profile`, `customize.social_links`, `history_control`, and related personal options.

Frequently used theme options:

```yaml
customize:
  sidebar: left
  category_perExpand: false
  default_index_file: index.md

codeblock:
  theme:
    light: github
    dark: github-dark

widgets:
  - category

search:
  insight: true

vendors:
  fontawesome: cdn
  open_sans: false
  source_code_pro: false
  mathjax: https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML

plugins:
  gallery: true
  mathjax: true
  google_analytics:
  google_site_verification:

comment:
  disqus:
```

Code block theme names come from `highlight.js/styles/*.css` without the `.css` suffix. `customize.highlight` is still read for compatibility when `codeblock.theme.light` is not set.

Set `plugins.gallery: false` to disable the built-in image lightbox. Set `plugins.mathjax: false` to disable MathJax output, or set `vendors.mathjax` to choose a script URL. Stylesheet vendors accept `cdn`, `false`, or an external stylesheet URL. `local` only works when matching files are intentionally provided under `source/libs`; otherwise WikiFlow falls back to the CDN entries in `_vendors.yml`.

## Engineering

The npm package uses a `files` allowlist so only theme runtime files, documentation assets, and starter files are published.

Run checks before changing shared theme behavior:

```bash
npm run lint
npm test
npm run test:package
```

Use `npm run test:browser` when changes affect browser runtime behavior. Keep generated third-party builds out of `source/libs` unless they are intentionally bundled and documented.

## License

[MIT LICENSE](./LICENSE)

This project keeps attribution to upstream MIT-licensed work in the included license notices. Keep the copyright and license notices when redistributing modified copies.
