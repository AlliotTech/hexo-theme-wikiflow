# Hexo 基本主题示例

本示例展示如何创建一个简单但完整的 Hexo 主题。

## 目录

- [目录结构](#目录结构)
- [主题配置](#主题配置)
- [布局文件](#布局文件)
- [页面模板](#页面模板)
- [语言文件](#语言文件)
- [基本样式](#基本样式)

## 目录结构

```text
themes/simple/
├── _config.yml
├── languages/
│   ├── en.yml
│   └── zh-CN.yml
├── layout/
│   ├── _partial/
│   │   ├── head.ejs
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── article.ejs
│   │   └── pagination.ejs
│   ├── layout.ejs
│   ├── index.ejs
│   ├── post.ejs
│   ├── page.ejs
│   └── archive.ejs
└── source/
    ├── css/
    │   └── style.css
    └── js/
        └── script.js
```

## 主题配置

```yaml
# themes/simple/_config.yml
menu:
  home: /
  archives: /archives
  about: /about

# 社区链接
social:
  github: https://github.com/username
  twitter: https://twitter.com/username

# 页脚信息
footer:
  since: 2024

favicon: /favicon.ico
```

## 布局文件

### layout.ejs（主布局）

```ejs
<!DOCTYPE html>
<%
const htmlLanguage = page.lang
  || page.language
  || (Array.isArray(config.language) ? config.language[0] : config.language)
  || 'en';
%>
<html lang="<%= htmlLanguage %>">
<head>
  <%- partial('_partial/head') %>
</head>
<body>
  <%- partial('_partial/header') %>

  <main class="container">
    <%- body %>
  </main>

  <%- partial('_partial/footer') %>

  <%- js('js/script') %>
</body>
</html>
```

### _partial/head.ejs

```ejs
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><%= page.title ? page.title + ' | ' + config.title : config.title %></title>
<meta name="description" content="<%= page.description || config.description %>">

<%- css('css/style') %>
<%- meta_generator() %>
<%- open_graph() %>

<% if (theme.favicon) { %>
  <%- favicon_tag(theme.favicon) %>
<% } %>
```

### _partial/header.ejs

```ejs
<header class="site-header">
  <div class="container">
    <a href="<%- url_for('/') %>" class="site-title">
      <%= config.title %>
    </a>

    <nav class="main-nav">
      <% for (var name in theme.menu) { %>
        <a href="<%- url_for(theme.menu[name]) %>"
           class="<%= is_current(theme.menu[name]) ? 'active' : '' %>">
          <%= __('menu.' + name) %>
        </a>
      <% } %>
    </nav>
  </div>
</header>
```

### _partial/footer.ejs

```ejs
<footer class="site-footer">
  <div class="container">
    <p>&copy; <%= theme.footer.since %>-<%= new Date().getFullYear() %> <%= config.author %></p>
    <p><%= __('powered_by', 'Hexo') %></p>

    <% if (theme.social) { %>
    <div class="social-links">
      <% for (var name in theme.social) { %>
        <a href="<%= theme.social[name] %>" target="_blank" rel="noopener">
          <%= name %>
        </a>
      <% } %>
    </div>
    <% } %>
  </div>
</footer>
```

### _partial/article.ejs

```ejs
<article class="post <%= item.layout %>">
  <header class="post-header">
    <% if (index) { %>
      <h2 class="post-title">
        <a href="<%- url_for(item.path) %>"><%= item.title %></a>
      </h2>
    <% } else { %>
      <h1 class="post-title"><%= item.title %></h1>
    <% } %>

    <div class="post-meta">
      <time datetime="<%- date_xml(item.date) %>">
        <%= date(item.date, 'YYYY-MM-DD') %>
      </time>

      <% if (item.categories && item.categories.length) { %>
        <span class="post-categories">
          <% item.categories.each(function(cat){ %>
            <a href="<%- url_for(cat.path) %>"><%= cat.name %></a>
          <% }) %>
        </span>
      <% } %>
    </div>
  </header>

  <div class="post-content">
    <% if (index && item.excerpt) { %>
      <%- item.excerpt %>
      <a href="<%- url_for(item.path) %>" class="read-more">
        <%= __('post.read_more') %>
      </a>
    <% } else { %>
      <%- item.content %>
    <% } %>
  </div>

  <% if (!index && item.tags && item.tags.length) { %>
  <footer class="post-footer">
    <div class="post-tags">
      <% item.tags.each(function(tag){ %>
        <a href="<%- url_for(tag.path) %>">#<%= tag.name %></a>
      <% }) %>
    </div>
  </footer>
  <% } %>
</article>
```

### _partial/pagination.ejs

```ejs
<% if (page.total > 1) { %>
<nav class="pagination">
  <%- paginator({
    prev_text: __('pagination.prev'),
    next_text: __('pagination.next'),
    mid_size: 1
  }) %>
</nav>
<% } %>
```

## 页面模板

### index.ejs

```ejs
<div class="posts">
  <% page.posts.each(function(post){ %>
    <%- partial('_partial/article', {item: post, index: true}) %>
  <% }) %>
</div>

<%- partial('_partial/pagination') %>
```

### post.ejs

```ejs
<%- partial('_partial/article', {item: page, index: false}) %>

<% if (page.prev || page.next) { %>
<nav class="post-nav">
  <% if (page.prev) { %>
    <a href="<%- url_for(page.prev.path) %>" class="prev">
      ← <%= page.prev.title %>
    </a>
  <% } %>
  <% if (page.next) { %>
    <a href="<%- url_for(page.next.path) %>" class="next">
      <%= page.next.title %> →
    </a>
  <% } %>
</nav>
<% } %>

<% if (page.comments) { %>
<section class="comments">
  <!-- 评论系统占位 -->
</section>
<% } %>
```

### page.ejs

```ejs
<article class="page">
  <h1 class="page-title"><%= page.title %></h1>
  <div class="page-content">
    <%- page.content %>
  </div>
</article>
```

### archive.ejs

```ejs
<h1 class="archive-title">
  <% if (page.category) { %>
    <%= __('category') %>: <%= page.category %>
  <% } else if (page.tag) { %>
    <%= __('tag') %>: <%= page.tag %>
  <% } else { %>
    <%= __('archive') %>
  <% } %>
</h1>

<div class="archive-posts">
  <% var year; %>
  <% page.posts.each(function(post){ %>
    <% var postYear = date(post.date, 'YYYY'); %>
    <% if (postYear !== year) { %>
      <% year = postYear; %>
      <h2 class="archive-year"><%= year %></h2>
    <% } %>
    <article class="archive-post">
      <time><%= date(post.date, 'MM-DD') %></time>
      <a href="<%- url_for(post.path) %>"><%= post.title %></a>
    </article>
  <% }) %>
</div>

<%- partial('_partial/pagination') %>
```

## 语言文件

### languages/zh-CN.yml

```yaml
menu:
  home: 首页
  archives: 归档
  about: 关于

post:
  read_more: 继续阅读

pagination:
  prev: ← 较新
  next: 较旧 →

archive: 文章归档
category: 分类
tag: 标签

powered_by: 由 %s 驱动
```

### languages/en.yml

```yaml
menu:
  home: Home
  archives: Archives
  about: About

post:
  read_more: Read More

pagination:
  prev: ← Newer
  next: Older →

archive: Archives
category: Category
tag: Tag

powered_by: Powered by %s
```

## 基本样式

```css
/* source/css/style.css */

/* 重置与基础 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.6;
  color: #333;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 页眉 */
.site-header {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.site-title {
  font-size: 1.5rem;
  text-decoration: none;
  color: #333;
}

.main-nav a {
  margin-left: 20px;
  text-decoration: none;
  color: #666;
}

.main-nav a.active {
  color: #333;
  font-weight: bold;
}

/* 文章 */
.post {
  padding: 40px 0;
  border-bottom: 1px solid #eee;
}

.post-title {
  margin-bottom: 10px;
}

.post-title a {
  text-decoration: none;
  color: #333;
}

.post-meta {
  color: #999;
  font-size: 0.9rem;
}

.post-content {
  margin-top: 20px;
}

/* 分页 */
.pagination {
  padding: 40px 0;
  text-align: center;
}

.pagination a {
  padding: 5px 15px;
  margin: 0 5px;
  text-decoration: none;
}

/* 页脚 */
.site-footer {
  padding: 40px 0;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}
```
