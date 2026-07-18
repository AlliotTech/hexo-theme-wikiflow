# Hexo 变量参考

## 目录

- [全局变量](#全局变量)
- [Site 变量](#site-变量)
- [Page 变量](#page-变量)
- [Config 变量](#config-变量)
- [Theme 变量](#theme-变量)
- [模板使用示例](#模板使用示例)

## 全局变量

| 变量     | 类型   | 说明                             |
| -------- | ------ | -------------------------------- |
| `site`   | Object | 网站数据                         |
| `page`   | Object | 当前页面数据及 front-matter 变量 |
| `config` | Object | 网站配置 (`_config.yml`)         |
| `theme`  | Object | 主题配置，继承自网站配置         |
| `path`   | String | 当前页面路径（不含根路径）       |
| `url`    | String | 当前页面完整 URL                 |
| `env`    | Object | Hexo 渲染环境信息                |

> **注意**：Lodash 已从 Hexo 5.0.0 版本的全局变量中移除。

## Site 变量

通过 `site` 对象访问网站范围的数据集合：

| 变量              | 类型  | 说明         |
| ----------------- | ----- | ------------ |
| `site.posts`      | Query | 所有文章     |
| `site.pages`      | Query | 所有独立页面 |
| `site.categories` | Query | 所有分类     |
| `site.tags`       | Query | 所有标签     |

### 使用示例

```ejs
<!-- 获取文章总数 -->
<%= site.posts.length %>

<!-- 遍历所有文章 -->
<% site.posts.each(function(post){ %>
  <a href="<%- url_for(post.path) %>"><%= post.title %></a>
<% }) %>

<!-- 获取所有标签 -->
<% site.tags.each(function(tag){ %>
  <span><%= tag.name %> (<%= tag.posts.length %>)</span>
<% }) %>
```

## Page 变量

### 通用页面变量

| 变量               | 类型    | 说明                     |
| ------------------ | ------- | ------------------------ |
| `page.title`       | String  | 页面标题                 |
| `page.date`        | Moment  | 创建日期                 |
| `page.updated`     | Moment  | 更新日期                 |
| `page.comments`    | Boolean | 是否开启评论             |
| `page.layout`      | String  | 布局名称                 |
| `page.content`     | String  | 完整内容                 |
| `page.excerpt`     | String  | 摘要                     |
| `page.more`        | String  | 摘要以外的内容           |
| `page.source`      | String  | 源文件路径               |
| `page.full_source` | String  | 源文件完整路径           |
| `page.path`        | String  | 页面 URL（不含根路径）   |
| `page.permalink`   | String  | 页面完整 URL             |
| `page.prev`        | Object  | 上一篇文章               |
| `page.next`        | Object  | 下一篇文章               |
| `page.raw`         | String  | 原始内容                 |
| `page.photos`      | Array   | 文章照片                 |
| `page.link`        | String  | 外部链接                 |

### 文章特有变量

| 变量              | 类型    | 说明       |
| ----------------- | ------- | ---------- |
| `page.published`  | Boolean | 是否已发布 |
| `page.categories` | Query   | 分类集合   |
| `page.tags`       | Query   | 标签集合   |

### 首页特有变量

| 变量               | 类型   | 说明             |
| ------------------ | ------ | ---------------- |
| `page.per_page`    | Number | 每页文章数       |
| `page.total`       | Number | 总页数           |
| `page.current`     | Number | 当前页码         |
| `page.current_url` | String | 当前页面 URL     |
| `page.posts`       | Query  | 当前页面的文章   |
| `page.prev`        | Number | 上一页页码       |
| `page.prev_link`   | String | 上一页链接       |
| `page.next`        | Number | 下一页页码       |
| `page.next_link`   | String | 下一页链接       |

### 归档页面特有变量

| 变量           | 类型    | 说明         |
| -------------- | ------- | ------------ |
| `page.archive` | Boolean | 是否为归档页 |
| `page.year`    | Number  | 年份         |
| `page.month`   | Number  | 月份         |

### 分类/标签页面特有变量

| 变量            | 说明         |
| --------------- | ------------ |
| `page.category` | 当前分类名称 |
| `page.tag`      | 当前标签名称 |

## Config 变量

访问 `_config.yml` 中的设置：

```ejs
<!-- 网站标题 -->
<%= config.title %>

<!-- 网站描述 -->
<%= config.description %>

<!-- 网站 URL -->
<%= config.url %>

<!-- 语言设置 -->
<%= Array.isArray(config.language) ? config.language[0] : config.language %>
```

## Theme 变量

访问主题 `_config.yml` 中的设置：

```ejs
<!-- 主题设置的 menu -->
<% for (var name in theme.menu) { %>
  <a href="<%- url_for(theme.menu[name]) %>"><%= name %></a>
<% } %>
```

## 模板使用示例

### 判断页面类型

```ejs
<% if (is_home()) { %>
  <!-- 首页内容 -->
<% } else if (is_post()) { %>
  <!-- 文章内容 -->
<% } else if (is_archive()) { %>
  <!-- 归档内容 -->
<% } %>
```

### 显示文章标签

```ejs
<% if (page.tags && page.tags.length) { %>
  <div class="tags">
    <% page.tags.each(function(tag){ %>
      <a href="<%- url_for(tag.path) %>">#<%= tag.name %></a>
    <% }) %>
  </div>
<% } %>
```

### 显示分页导航

```ejs
<% if (page.prev || page.next) { %>
  <nav class="post-nav">
    <% if (page.prev) { %>
      <a href="<%- url_for(page.prev.path) %>">← <%= page.prev.title %></a>
    <% } %>
    <% if (page.next) { %>
      <a href="<%- url_for(page.next.path) %>"><%= page.next.title %> →</a>
    <% } %>
  </nav>
<% } %>
```
