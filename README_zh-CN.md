<div align="right">
  语言:
  <a title="English" href="README.md">English</a> |
  简体中文
</div>

<picture>
  <img alt="WikiFlow 桌面端预览" src="https://raw.githubusercontent.com/AlliotTech/hexo-theme-wikiflow/master/docs/assets/SitePreview.png">
</picture>

<p align="center">
  <img alt="WikiFlow 移动端预览 1" width="220" src="https://raw.githubusercontent.com/AlliotTech/hexo-theme-wikiflow/master/docs/assets/mobile1.png">
  <img alt="WikiFlow 移动端预览 2" width="220" src="https://raw.githubusercontent.com/AlliotTech/hexo-theme-wikiflow/master/docs/assets/mobile2.png">
</p>

# WikiFlow

> WikiFlow 是一款面向个人 wiki、知识笔记和轻量文档站的 [Hexo](https://hexo.io) 主题。

[![NPM version](https://img.shields.io/npm/v/hexo-theme-wikiflow?color=red&logo=npm&style=for-the-badge)](https://www.npmjs.com/package/hexo-theme-wikiflow)
[![NPM downloads](https://img.shields.io/npm/dm/hexo-theme-wikiflow?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/hexo-theme-wikiflow)
[![Required Hexo version](https://img.shields.io/badge/hexo-%3E%3D8.1.0-blue?style=for-the-badge&logo=hexo)](https://hexo.io)
[![Required Node version](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)](./LICENSE)

## 主题特色

WikiFlow 把阅读界面保持得尽量安静，把内容层级放在更容易浏览的位置。它适合用来搭建个人知识库：目录、分类树和文章大纲会比杂志式首页更重要。

* 支持基于文章目录生成分类，适合 wiki 式笔记组织。
* 双栏阅读布局，侧边栏提供可展开的分类树。
* 文章默认显示目录大纲，移动端会显示紧凑的折叠目录。
* 可选个人资料栏、最近文章、归档、标签、标签云和友情链接组件。
* 内置 Insight 搜索、图片灯箱、MathJax、Disqus 评论、分享入口和源码历史链接。
* 支持独立主题配置和自定义文件注入，方便升级时保留站点自定义内容。

## 安装

如果你使用 Hexo 8.1.0 或更新版本，最简单的安装方式是通过 npm：

```sh
cd hexo-site
npm install hexo-theme-wikiflow
```

把主题提供的初始页面和脚手架复制到 Hexo 站点中：

```sh
cp -rf node_modules/hexo-theme-wikiflow/docs/starter/source/* source/
cp -rf node_modules/hexo-theme-wikiflow/docs/starter/scaffolds/* scaffolds/
```

创建独立主题配置文件：

```sh
cp -f node_modules/hexo-theme-wikiflow/_config.yml.example _config.wikiflow.yml
```

然后打开 Hexo 站点配置文件，将 `theme` 设置为 `wikiflow`。

```yml
theme: wikiflow
```

如果你需要直接修改主题源码，也可以克隆整个仓库：

```sh
cd hexo-site
git clone https://github.com/AlliotTech/hexo-theme-wikiflow.git themes/WikiFlow
cp -rf themes/WikiFlow/docs/starter/source/* source/
cp -rf themes/WikiFlow/docs/starter/scaffolds/* scaffolds/
cp -f themes/WikiFlow/_config.yml.example _config.wikiflow.yml
```

使用 `themes/WikiFlow` 目录时，站点主题名需要和目录名一致：

```yml
theme: WikiFlow
```

## 站点配置

WikiFlow 在主题层保持轻量。目录分类、搜索数据、站点地图、Feed 和 nofollow 都交给站点级 Hexo 插件处理，所以只安装你实际需要的插件即可。

默认 WikiFlow 站点推荐安装：

```sh
npm install --save hexo-directory-category hexo-generator-json-content
```

可选站点插件：

```sh
npm install --save hexo-generator-feed hexo-generator-sitemap hexo-filter-nofollow
```

推荐的站点 `_config.yml` 配置：

```yml
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

`hexo-directory-category` 可以让文章目录变成分类路径。启用 `search.insight` 时必须安装 `hexo-generator-json-content`，因为 WikiFlow 会在浏览器中读取 `content.json`。

## 主题配置

日常自定义不建议直接修改已安装的主题包文件。把配置保存在 `_config.wikiflow.yml` 中，后续升级主题会更稳。

带完整注释的标准示例是 [_config.yml.example](./_config.yml.example)。发布站点前，请替换 `profile`、`social`、`post_history`、`open_graph` 等配置中的示例个人信息。

常用主题选项：

```yml
sidebar:
  position: left

home:
  index_file: index.md

category:
  mode: external
  expand_all: false

recent_posts:
  thumbnail: true

footer:
  license:
    enable: false
    name:
    url:
    icon:
  powered_by: true
  beian:
    enable: false
    icp:
    gongan_id:
    gongan_num:
    gongan_icon_url:

post_meta:
  updated_at:
    enable: true

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
  mathjax: https://cdn.jsdelivr.net/npm/mathjax@4.1.2/tex-mml-chtml.js

plugins:
  gallery: true
  mathjax: false
  google_analytics: # GA4 衡量 ID，例如 G-XXXXXXXXXX
  google_site_verification:

comment:
  disqus:
```

Markdown 文章和页面默认显示大纲。如果某篇内容不需要目录，可以在 front matter 中设置 `toc: false`。

```md
---
title: My Note
date: 2026-06-15
toc: false
tags:
categories:
---
```

MathJax 默认关闭。只需在使用公式的文章或页面 front matter 中设置 `mathjax: true`，即可按页加载；也可以设置 `plugins.mathjax: true` 全站启用。

归档页和最近文章中的缩略图优先读取 `thumbnail`，其次读取 `banner`。如果知道横幅图片的原始尺寸，可以在 front matter 中填写 `banner_width` 和 `banner_height`，提前预留布局空间并减少页面跳动。文章图库使用 Hexo 的 `photos` front matter 字段。`embed` 脚手架可以通过 `iframe_url` 创建 iframe 页面，也可以读取文章资源目录中的 `embed_page/index.html`。

分类 widget 默认使用 `category.mode: external`。WikiFlow 会生成一个带 hash 的 `assets/wikiflow/category-tree.*.json`，再由浏览器渲染侧栏目录树：优先展开当前文章所在分支，其余 DOM 在用户展开目录或点击全部展开时再创建。如需恢复旧版每个页面服务端完整输出目录树的行为，可以设置 `category.mode: full`。

## 插件功能

可选功能统一在 `_config.wikiflow.yml` 中启用。

* `search.insight`：启用本地 Insight 搜索浮层；其 JavaScript 与 `content.json` 索引会在首次打开搜索时才加载。
* `plugins.gallery`：为文章图片启用内置灯箱。
* `plugins.mathjax`：在所有页面加载 MathJax；保持关闭时可使用按页 `mathjax: true`。
* `plugins.google_analytics`：配置 `G-...` 格式的衡量 ID 后加载 Google Analytics 4。
* `comment.disqus`：配置 shortname 后加载 Disqus 评论。
* `share: default`：启用内置分享弹层。
* `post_history.enable`：为托管在 GitHub/GitLab 风格仓库中的文章显示 Source、Edit 和 History 链接。
* `footer.license`：按需显示站点内容许可证；WikiFlow 默认不会替站点声明许可证。
* `footer.beian`：在网站页脚显示 ICP 与公安备案链接。

### 配置 CDN

第三方资源通过 `_vendors.yml` 解析。vendor 的值可以是 `cdn`、`true`、`local`、`false`，也可以直接写自定义 URL。

```yml
vendors:
  fontawesome: cdn
  open_sans: false
  source_code_pro: false
  mathjax: https://cdn.jsdelivr.net/npm/mathjax@4.1.2/tex-mml-chtml.js
```

只有当你明确把对应文件放进 `source/libs` 时才建议使用 `local`；否则 WikiFlow 会回退到 [_vendors.yml](./_vendors.yml) 中的 CDN 地址。

## 自定义文件

WikiFlow 通过 `custom_file_path` 提供便于升级的注入点。EJS 片段可以注入到 `head`、`header`、`sidebar`、`postMeta`、`postBodyStart`、`postBodyEnd`、`footer`、`bodyEnd` 和 `comment` 等位置。Stylus 文件可以通过 `variable`、`mixin` 和 `style` 注入。

```yml
custom_file_path:
  head: source/_data/wikiflow-head.ejs
  style: source/_data/wikiflow-styles.styl
```

这些文件通常放在 Hexo 站点的 `source/_data` 目录中，不需要改动主题源码。

## 更新

更新 npm 安装版本：

```sh
cd hexo-site
npm install hexo-theme-wikiflow@latest
```

更新源码安装版本：

```sh
cd themes/WikiFlow
git pull origin main
```

升级后建议对照最新的 [_config.yml.example](./_config.yml.example) 检查自己的 `_config.wikiflow.yml`，然后运行：

```sh
hexo clean && hexo generate
```

## 开发

WikiFlow 由 [AlliotTech](https://github.com/AlliotTech) 维护。npm 包通过 `files` 白名单控制发布内容，只发布主题运行文件、文档资源和 starter 文件。

修改共享主题行为前建议运行：

```sh
npm run lint
npm test
npm run test:package
```

如果改动影响浏览器运行时行为，还应运行 `npm run test:browser`。

## 反馈

* 在 [GitHub Issues][issues-url] 报告问题。
* 在 [GitHub Issues][issues-url] 提出改进建议。
* 向 [AlliotTech/hexo-theme-wikiflow][repo-url] 提交 pull request。

## 鸣谢

WikiFlow 是 `hexo-theme-Wikitten` 的持续维护 fork。本仓库保留了原项目的 MIT 许可证声明。

## 版权协议

[MIT License](./LICENSE)

[repo-url]: https://github.com/AlliotTech/hexo-theme-wikiflow
[issues-url]: https://github.com/AlliotTech/hexo-theme-wikiflow/issues
