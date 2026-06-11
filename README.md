# hexo-theme-wikiflow

[中文版文档](./README_zh-CN.md)

### A knowledge-focused wiki theme for Hexo 8.

some features:

- Applicable to personal wiki knowledge management
- Simple, double column, classified management
- The knowledge of multi-level sorting, the side can be expand at all levels of classification, easy to jump
- Categorize article according to file directory  #4

![Site Preview](./docs/assets/SitePreview.png)



![mobile preview](./docs/assets/mobile1.png) ![mobile preview](./docs/assets/mobile2.png)



## Installation

`hexo-theme-wikiflow` is maintained by [AlliotTech](https://github.com/AlliotTech). It is a maintained fork of `hexo-theme-Wikitten`, with the original MIT license notices preserved.

### Install

**Note: This theme requires Hexo 8.1.0 or later, and Node.js 20.19.0 or later.**

1. Go to your Hexo site folder and install the theme package:

```bash
$ cd your-hexo-directory
$ npm install hexo-theme-wikiflow
```

2. Copy the starter pages and scaffolds into your site:

```bash
$ cp -rf node_modules/hexo-theme-wikiflow/docs/starter/source/* source/
$ cp -rf node_modules/hexo-theme-wikiflow/docs/starter/scaffolds/* scaffolds/
```

3. Copy the theme config into the site root:

```bash
$ cp -f node_modules/hexo-theme-wikiflow/_config.yml.example _config.wikiflow.yml
# edit and customize it
$ vim _config.wikiflow.yml
```

Recommended site and theme options are listed below in [Configuration](#configuration).

4. Optional site plugins are listed below. Install only the features you use in the Hexo **site** project.

here is those function and effect:

```json
hexo-directory-category // automatic categorize article according to their file directory
hexo-generator-feed     // generate Atom 1.0 or RSS 2.0 feed
hexo-generator-json-content // generate a json content file for site search
hexo-generator-sitemap  // generate sitemap
hexo-filter-nofollow    // add rel="nofollow" to external links
```

you can merge these plugins into the **site's** `package.json` file by `npm install` command install them once,

or in the **site folder**, you can install them with the following command:

```bash
$ npm install --save hexo-directory-category hexo-generator-feed hexo-generator-json-content hexo-generator-sitemap hexo-filter-nofollow
```

5. `mathjax` renderer configuration (optional)：

If you need to write mathematical formulas, the following configuration is recommended:

First, you need to install [pandoc](https://pandoc.org/installing.html)，and modify the rendering engine under the hexo site in the meanwhile:

```bash
$ npm un hexo-renderer-marked --save
$ npm i hexo-renderer-pandoc --save # or hexo-renderer-krammed
```

Modify settings in site config file `_config.yml`:

```bash
math:
  enable: true
  engine: mathjax
```

### Source Install

If you want to work directly from the repository, clone the theme into `themes/WikiFlow` instead:

```bash
$ cd your-hexo-directory
$ git clone https://github.com/AlliotTech/hexo-theme-wikiflow.git themes/WikiFlow
$ cp -rf themes/WikiFlow/docs/starter/source/* source/
$ cp -rf themes/WikiFlow/docs/starter/scaffolds/* scaffolds/
```

### Enable

Modify `theme` in the site config file `_config.yml`:

```yaml
theme: wikiflow
```

When using the source install path `themes/WikiFlow`, set it to `WikiFlow` instead.

### Update

For npm installation:

```bash
$ npm install hexo-theme-wikiflow@latest
```

For source installation:

```bash
$ cd themes/WikiFlow
$ git pull origin main
```

## Configuration

In site config file `_config.yml`, **recommend settings**:

```yaml
# Hexo Configuration
# URL
permalink: wiki/:title/

# Directory
skip_render:
  - README.md
  - '_posts/**/embed_page/**'

# Writing
new_post_name: :title.md # File name of new posts

## Markdown
## https://github.com/hexojs/hexo-renderer-marked
marked:
  gfm: true
  
## Plugins: https://hexo.io/plugins/
### JsonContent
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
    
### Creat sitemap
sitemap:
  path: sitemap.xml

### Adds nofollow attribute to external links. Install `hexo-filter-nofollow` first.
nofollow:
  enable: true
  exclude:
    - <your site url domain> # eg: example.com
```

In **theme** config file `WikiFlow/_config.yml`, you can read more detailed commentary for some options.

**Before publishing your site, change the example personal info in `profile`, `social_links`, `history_control`, and related theme options.**

### `profile`, `comment`, `Share`, `history_control` and `miscellaneous` are **DEFAULT DISABLE**!

The built-in comment integration is Disqus.

The built-in gallery uses a small native JavaScript lightbox.

## Optional Features

WikiFlow keeps the wiki navigation, article layout, and search UI as the core theme experience. Browser-side enhancements are controlled by theme config so site projects can keep unused features out of the rendered pages:

```yaml
codeblock:
    theme:
        light: github
        dark: github-dark

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

Code block theme names come from `highlight.js/styles/*.css` without the `.css` suffix. `customize.highlight` is still read for configuration compatibility when `codeblock.theme.light` is not set.

Set `plugins.gallery: false` to disable the built-in image lightbox. Set `plugins.mathjax: false` to disable math rendering, or set `vendors.mathjax` to a script URL to choose the loader. For stylesheet vendors, use `cdn`, `false`, or an external stylesheet URL. `local` only works when you intentionally provide matching files under `source/libs`; otherwise WikiFlow falls back to the CDN entry in `_vendors.yml`.

## Engineering

The npm package uses a `files` allowlist so only theme runtime files, documentation assets, and starter files are published. Run `npm pack --dry-run` before publishing to inspect the tarball.

Run quality checks before changing shared theme behavior:

```bash
$ npm run lint
$ npm test
$ npm run test:browser
```

Optional browser-side assets are tracked in `_vendors.yml`. Keep generated third-party builds out of `source/libs` unless they are intentionally bundled and documented there.

other theme **recommend settings**:

```yaml
# Customize
customize: # modify this information for yourself
    sidebar: left # sidebar position, options: left, right
    category_perExpand: false # enable article categories list per expanding
    default_index_file: index.md # enable this, it will display at site index instead of default index page, or disable that it will display more articles order by time 

# Code blocks
codeblock:
    theme:
        light: github
        dark: github-dark
    
# Widgets
widgets: # default use category only
    - category
    # - recent_posts
    # - archive
    # - tag
    # - tagcloud
    # - links
    
# History version 
history_control: # make you wiki has history version control in page (view source code, edit online, compare historical changes)
    enable: false # set true after filling in your own repository information
    server_link: https://github.com # recommend use GitHub - https://github.com
    user: <your GitHub name>
    repertory: <your repertory name of this wiki source code>
    branch: <branch name of this wiki site source code>
```



## License

[MIT LICENSE](./LICENSE)

This project keeps attribution to upstream MIT-licensed work in the included license notices. Keep the copyright and license notices when redistributing modified copies.
