# hexo-theme-wikiflow

[English Page](./README.md)

一个面向知识管理和个人 wiki 的 Hexo 8 主题。

- 面向个人知识库的目录分类
- 双栏布局，侧边栏支持分类分级展开
- 可选 Insight 搜索、图片查看层、MathJax、评论、分享和历史版本入口
- 支持 Hexo 8.1.0+ 和 Node.js 20.19.0+

![Site Preview](./docs/assets/SitePreview.png)

![mobile preview](./docs/assets/mobile1.png) ![mobile preview](./docs/assets/mobile2.png)

## 安装说明

`hexo-theme-wikiflow` 由 [AlliotTech](https://github.com/AlliotTech) 维护。项目是 `hexo-theme-Wikitten` 的持续维护 fork，并保留原始 MIT 许可证声明。

### 使用 npm 安装

1. 在 Hexo 站点目录中安装主题：

```bash
cd your-hexo-directory
npm install hexo-theme-wikiflow
```

2. 复制主题提供的初始页面和脚手架：

```bash
cp -rf node_modules/hexo-theme-wikiflow/docs/starter/source/* source/
cp -rf node_modules/hexo-theme-wikiflow/docs/starter/scaffolds/* scaffolds/
```

3. 复制并编辑主题配置：

```bash
cp -f node_modules/hexo-theme-wikiflow/_config.yml.example _config.wikiflow.yml
```

4. 在站点 `_config.yml` 中启用主题：

```yaml
theme: wikiflow
```

### 使用源码安装

仅在需要直接修改主题源码时使用源码安装：

```bash
cd your-hexo-directory
git clone https://github.com/AlliotTech/hexo-theme-wikiflow.git themes/WikiFlow
cp -rf themes/WikiFlow/docs/starter/source/* source/
cp -rf themes/WikiFlow/docs/starter/scaffolds/* scaffolds/
```

如果主题目录是 `themes/WikiFlow`，站点主题名也要与目录一致：

```yaml
theme: WikiFlow
```

### 更新

```bash
npm install hexo-theme-wikiflow@latest
```

源码安装时：

```bash
cd themes/WikiFlow
git pull origin main
```

## 站点配置

推荐的站点 `_config.yml` 配置：

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

只安装你实际使用的站点插件：

```bash
npm install --save hexo-directory-category hexo-generator-json-content
```

可选站点插件：

```bash
npm install --save hexo-generator-feed hexo-generator-sitemap hexo-filter-nofollow
```

`hexo-directory-category` 用于根据文章目录生成分类。启用 `search.insight` 时需要安装 `hexo-generator-json-content`。Sitemap、Feed 和 nofollow 属于站点级选择，不是主题必需依赖。

## 主题配置

编辑站点根目录中的 `_config.wikiflow.yml`。本仓库的 `_config.yml.example` 是带注释的标准示例。

发布站点前，请替换 `customize.profile`、`customize.social_links`、`history_control` 等个人信息配置中的示例值。

常用主题选项：

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

代码高亮主题名来自 `highlight.js/styles/*.css`，填写时不带 `.css` 后缀。未设置 `codeblock.theme.light` 时，主题仍会兼容旧的 `customize.highlight` 配置。

设置 `plugins.gallery: false` 可关闭内置图片查看层。设置 `plugins.mathjax: false` 可关闭 MathJax 输出，也可以通过 `vendors.mathjax` 指定脚本地址。样式类 vendor 可以使用 `cdn`、`false` 或外部样式表 URL。`local` 只适用于你明确在 `source/libs` 下提供了对应文件的情况；文件不存在时 WikiFlow 会回退到 `_vendors.yml` 中的 CDN 地址。

## 工程化

npm 包通过 `files` 白名单控制发布内容，只发布主题运行文件、文档资源和 starter 文件。

修改共享主题行为前建议运行：

```bash
npm run lint
npm test
npm run test:package
```

影响浏览器运行时行为的改动还应运行 `npm run test:browser`。除非明确决定内置并写清楚授权，否则不要把第三方构建产物提交到 `source/libs`。

## 版权协议

[MIT LICENSE](./LICENSE)

本项目在随附许可证声明中保留上游 MIT 授权作品的必要归属。重新分发修改版本时，请保留版权和许可证声明。
