# Hexo 高级用法示例

## 目录

- [自定义辅助函数](#自定义辅助函数)
- [自定义过滤器](#自定义过滤器)
- [自定义标签](#自定义标签)
- [高级模板技巧](#高级模板技巧)
- [性能优化](#性能优化)
- [数据文件使用](#数据文件使用)
- [多语言高级设置](#多语言高级设置)
- [SEO 优化](#seo-优化)
- [暗色模式](#暗色模式)

## 自定义辅助函数

在 `scripts/` 目录创建自定义辅助函数：

```javascript
// scripts/helpers.js

// 阅读时间估算
hexo.extend.helper.register('reading_time', function(content) {
  const text = this.strip_html(content || '').trim();
  if (!text) return '0 min read';

  const cjkCharacters = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || [];
  const latinWords = text
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
    .match(/[\p{L}\p{N}]+/gu) || [];
  const units = cjkCharacters.length + latinWords.length;
  const minutes = Math.max(1, Math.ceil(units / 300));
  return minutes + ' min read';
});

// 文章字数统计
hexo.extend.helper.register('word_count', function(content) {
  const text = this.strip_html(content || '');
  return text.length;
});

// 随机文章
hexo.extend.helper.register('random_posts', function(count) {
  const posts = this.site.posts.toArray();
  for (let index = posts.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [posts[index], posts[target]] = [posts[target], posts[index]];
  }
  return posts.slice(0, count);
});
```

使用方式：

```ejs
<span><%= reading_time(page.content) %></span>
<span><%= word_count(page.content) %> 字</span>

<% random_posts(5).forEach(function(post){ %>
  <a href="<%- url_for(post.path) %>"><%= post.title %></a>
<% }) %>
```

## 自定义过滤器

需要结构化修改 HTML 时显式安装 `cheerio`，不要依赖 Hexo 的传递依赖，也不要用正则表达式解析任意 HTML。

```javascript
// scripts/filters.js
const cheerio = require('cheerio');

// 使用 HTML 解析器统一处理外部链接和图片属性
hexo.extend.filter.register('after_post_render', function(data) {
  const $ = cheerio.load(data.content, null, false);
  const siteOrigin = new URL(hexo.config.url).origin;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    try {
      const target = new URL(href, hexo.config.url);
      if (target.origin !== siteOrigin) {
        $(element).attr('target', '_blank');
        $(element).attr('rel', 'noopener noreferrer');
      }
    } catch {
      // 保留无法解析的链接
    }
  });

  $('img').each((_, element) => {
    if (!$(element).attr('loading')) {
      $(element).attr('loading', 'lazy');
    }
    if (!$(element).attr('decoding')) {
      $(element).attr('decoding', 'async');
    }
  });

  data.content = $.html();
  return data;
});
```

## 自定义标签

```javascript
// scripts/tags.js

// 提示框标签
hexo.extend.tag.register('note', function(args, content) {
  const requestedType = args[0] || 'info';
  const type = /^[a-z0-9-]+$/iu.test(requestedType) ? requestedType : 'info';
  const md = hexo.render.renderSync({ text: content, engine: 'markdown' });
  return `<div class="note note-${type}">${md}</div>`;
}, { ends: true });

// 代码群组标签
const escapeHtml = hexo.extend.helper.get('escape_html').bind(hexo);

hexo.extend.tag.register('codegroup', function(args, content) {
  const tabs = content.split('---').map((block, i) => {
    const lines = block.trim().split('\n');
    const title = lines[0].replace('# ', '');
    const code = lines.slice(1).join('\n');
    return { title, code, active: i === 0 };
  });

  let html = '<div class="code-group">';
  html += '<div class="code-tabs">';
  tabs.forEach((tab, i) => {
    html += `<button class="${tab.active ? 'active' : ''}" data-tab="${i}">${escapeHtml(tab.title)}</button>`;
  });
  html += '</div>';
  tabs.forEach((tab, i) => {
    html += `<div class="code-panel ${tab.active ? 'active' : ''}" data-panel="${i}"><pre><code>${escapeHtml(tab.code)}</code></pre></div>`;
  });
  html += '</div>';
  return html;
}, { ends: true });
```

使用方式：

```markdown
{% note warning %}
这是一个警告提示框
{% endnote %}

{% codegroup %}
# JavaScript
console.log('Hello');
---
# Python
print('Hello')
{% endcodegroup %}
```

## 高级模板技巧

### 条件式加载资源

```ejs
<% if (is_post()) { %>
  <%- css('css/prism') %>
  <%- js('js/prism') %>
<% } %>

<% if (page.photos && page.photos.length) { %>
  <%- css('css/lightbox') %>
  <%- js('js/lightbox') %>
<% } %>

<% if (page.mathjax) { %>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<% } %>
```

### 自动生成目录

```ejs
<% if (page.toc !== false && toc(page.content).length > 0) { %>
<aside class="post-toc">
  <h3>目录</h3>
  <%- toc(page.content, {
    class: 'toc',
    list_number: false,
    max_depth: 3
  }) %>
</aside>
<% } %>
```

### 相关文章

```ejs
<%
var relatedPosts = site.posts.filter(function(post) {
  if (post.path === page.path) return false;
  var hasSameCat = page.categories.some(function(cat) {
    return post.categories.some(function(c) { return c.name === cat.name; });
  });
  var hasSameTag = page.tags.some(function(tag) {
    return post.tags.some(function(t) { return t.name === tag.name; });
  });
  return hasSameCat || hasSameTag;
}).slice(0, 5);
%>

<% if (relatedPosts.length) { %>
<section class="related-posts">
  <h3>相关文章</h3>
  <ul>
    <% relatedPosts.each(function(post){ %>
      <li><a href="<%- url_for(post.path) %>"><%= post.title %></a></li>
    <% }) %>
  </ul>
</section>
<% } %>
```

### 面包屑导航

```ejs
<nav class="breadcrumb">
  <a href="<%- url_for('/') %>"><%= __('menu.home') %></a>

  <% if (is_archive()) { %>
    <span>›</span>
    <a href="<%- url_for('/archives') %>"><%= __('archive') %></a>
    <% if (page.year) { %>
      <span>›</span>
      <span><%= page.year %></span>
    <% } %>
  <% } else if (is_category()) { %>
    <span>›</span>
    <span><%= page.category %></span>
  <% } else if (is_tag()) { %>
    <span>›</span>
    <span><%= page.tag %></span>
  <% } else if (is_post()) { %>
    <% if (page.categories && page.categories.length) { %>
      <% var cat = page.categories.toArray()[0]; %>
      <span>›</span>
      <a href="<%- url_for(cat.path) %>"><%= cat.name %></a>
    <% } %>
    <span>›</span>
    <span><%= page.title %></span>
  <% } %>
</nav>
```

## 性能优化

### 片段缓存使用

```ejs
<!-- 仅缓存跨页面完全相同的内容 -->
<%- fragment_cache('static-footer', function(){
  return partial('_partial/static-footer');
}) %>

<!-- 或使用 partial 的 cache 选项 -->
<%- partial('_partial/static-footer', {}, {cache: true}) %>
```

活动菜单、当前语言、页面数据或相对链接会变化时不要启用缓存。开启 `relative_link` 时尤其要谨慎。

### 条件式渲染

```ejs
<!-- 仅在需要时渲染 -->
<% if (theme.sidebar && theme.sidebar.display !== 'none') { %>
  <%- partial('_partial/sidebar') %>
<% } %>

<!-- 使用 only 选项限制变量传递 -->
<%- partial('_partial/article', {item: post}, {only: true}) %>
```

## 数据文件使用

### 创建数据文件

```yaml
# source/_data/links.yml
- name: Hexo
  url: https://hexo.io
  description: 快速、简洁的博客框架

- name: GitHub
  url: https://github.com
  description: 代码托管平台
```

### 在模板中使用

```ejs
<% if (site.data.links) { %>
<div class="friend-links">
  <h3>友情链接</h3>
  <ul>
    <% site.data.links.forEach(function(link){ %>
      <li>
        <a href="<%= link.url %>" target="_blank" rel="noopener">
          <%= link.name %>
        </a>
        <span><%= link.description %></span>
      </li>
    <% }) %>
  </ul>
</div>
<% } %>
```

## 多语言高级设置

### 语言切换器

```ejs
<%
const languages = Array.isArray(config.language)
  ? config.language
  : [config.language || 'en'];
const defaultLanguage = languages[0];
const currentLanguage = page.lang || page.language || defaultLanguage;
const translations = page.translations || {};
%>

<div class="language-switcher">
  <% languages.forEach(function(language){ %>
    <% if (translations[language]) { %>
      <a href="<%- url_for(translations[language]) %>"
         hreflang="<%= language %>"
         class="<%= language === currentLanguage ? 'active' : '' %>">
        <%= language %>
      </a>
    <% } %>
  <% }) %>
</div>
```

`page.translations` 是主题约定的 Front-matter 映射。只有目标翻译真实存在时才输出链接，不要通过替换当前 URL 猜测翻译路径。

### 语言特定配置

```yaml
# _config.yml
language:
  - zh-CN
  - en

# 这是主题自定义配置，不是 Hexo 内置设置
per_page_i18n:
  zh-CN: 10
  en: 5
```

## SEO 优化

### 结构化数据

```ejs
<%
const structuredData = {
  '@context': 'https://schema.org',
  '@type': is_post() ? 'BlogPosting' : 'WebPage',
  headline: page.title || config.title,
  author: {
    '@type': 'Person',
    name: config.author
  },
  publisher: {
    '@type': 'Organization',
    name: config.title
  }
};

if (page.date) structuredData.datePublished = date_xml(page.date);
if (page.updated) structuredData.dateModified = date_xml(page.updated);

const serializedStructuredData = JSON.stringify(structuredData)
  .replace(/</gu, '\\u003c');
%>
<script type="application/ld+json"><%- serializedStructuredData %></script>
```

### Sitemap 标头

```ejs
<% if (page.prev) { %>
  <link rel="prev" href="<%- full_url_for(page.prev.path) %>">
<% } %>
<% if (page.next) { %>
  <link rel="next" href="<%- full_url_for(page.next.path) %>">
<% } %>
<link rel="canonical" href="<%- full_url_for(page.path) %>">
```

## 暗色模式

### JavaScript 切换

```javascript
// source/js/darkmode.js
const toggle = document.querySelector('.darkmode-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(dark, {persist = true} = {}) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  if (persist) localStorage.setItem('theme', dark ? 'dark' : 'light');
}

// 初始化
const saved = localStorage.getItem('theme');
if (saved) {
  setTheme(saved === 'dark');
} else {
  setTheme(prefersDark.matches, {persist: false});
}

if (toggle) {
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(!isDark);
  });
}

prefersDark.addEventListener('change', event => {
  if (!localStorage.getItem('theme')) {
    setTheme(event.matches, {persist: false});
  }
});
```

### CSS 变量

```css
:root {
  --bg-color: #fff;
  --text-color: #333;
  --border-color: #eee;
}

[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
  --border-color: #333;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
}
```
