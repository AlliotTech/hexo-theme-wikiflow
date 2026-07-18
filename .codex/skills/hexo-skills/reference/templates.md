# Hexo 模板参考

## 目录

- [模板类型与回退机制](#模板类型与回退机制)
- [支持的模板引擎](#支持的模板引擎)
- [布局 (Layout)](#布局-layout)
- [局部模板 (Partials)](#局部模板-partials)
- [片段缓存 (Fragment Cache)](#片段缓存-fragment-cache)
- [各模板文件示例](#各模板文件示例)

## 模板类型与回退机制

Hexo 使用模板回退机制，当特定模板不存在时会使用回退模板：

```text
index    (必需，无回退)
post     → index
page     → index
archive  → index
category → archive → index
tag      → archive → index
```

## 支持的模板引擎

| 引擎     | 扩展名              | 安装方式                          |
| -------- | ------------------- | --------------------------------- |
| Nunjucks | `.njk`, `.nunjucks` | 内置                              |
| EJS      | `.ejs`              | `npm install hexo-renderer-ejs`   |
| Pug      | `.pug`              | `npm install hexo-renderer-pug`   |

## 布局 (Layout)

### 基本布局结构

```ejs
<!-- layout/layout.ejs -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title><%= config.title %></title>
  <%- css('css/style') %>
</head>
<body>
  <%- partial('_partial/header') %>
  <main><%- body %></main>
  <%- partial('_partial/footer') %>
  <%- js('js/script') %>
</body>
</html>
```

### 禁用布局

在 front-matter 中设置：

```yaml
---
title: 无布局页面
layout: false
---
```

### 指定特定布局

```yaml
---
title: 自定义布局
layout: custom
---
```

## 局部模板 (Partials)

### 基本用法

```ejs
<%- partial('_partial/header') %>
```

### 传递变量

```ejs
<%- partial('_partial/article', {
  item: post,
  index: true
}) %>
```

### 局部模板示例

```ejs
<!-- layout/_partial/article.ejs -->
<article class="<%= item.layout %>">
  <header>
    <h2><a href="<%- url_for(item.path) %>"><%= item.title %></a></h2>
    <time><%= date(item.date, 'YYYY-MM-DD') %></time>
  </header>
  <% if (index && item.excerpt) { %>
    <%- item.excerpt %>
  <% } else { %>
    <%- item.content %>
  <% } %>
</article>
```

## 片段缓存 (Fragment Cache)

用于缓存跨页面不变的内容，提升生成性能：

### 使用 fragment_cache

```ejs
<%- fragment_cache('static-footer', function(){
  return partial('_partial/static-footer');
}) %>
```

### 使用 partial 的 cache 选项

```ejs
<%- partial('_partial/static-footer', {}, {cache: true}) %>
```

**注意**：仅缓存跨页面完全相同的内容。活动菜单、当前语言、页面数据或相对链接会随路由变化时不要启用缓存；开启 `relative_link` 时尤其要避免缓存包含站内链接的片段。

## 各模板文件示例

### index.ejs

```ejs
<% page.posts.each(function(post){ %>
  <%- partial('_partial/article', {item: post, index: true}) %>
<% }) %>
<%- paginator({
  prev_text: '&laquo; 上一页',
  next_text: '下一页 &raquo;'
}) %>
```

### post.ejs

```ejs
<%- partial('_partial/article', {item: page, index: false}) %>
<% if (page.comments) { %>
  <%- partial('_partial/comments') %>
<% } %>
```

### archive.ejs

```ejs
<% page.posts.each(function(post){ %>
<article>
  <h3><a href="<%- url_for(post.path) %>"><%= post.title %></a></h3>
  <time><%= date(post.date, 'YYYY-MM-DD') %></time>
</article>
<% }) %>
<%- paginator() %>
```

### page.ejs

```ejs
<article class="page">
  <h1><%= page.title %></h1>
  <%- page.content %>
</article>
```

### category.ejs / tag.ejs

```ejs
<h1><%= page.category || page.tag %></h1>
<% page.posts.each(function(post){ %>
  <%- partial('_partial/article-item', {item: post}) %>
<% }) %>
<%- paginator() %>
```
