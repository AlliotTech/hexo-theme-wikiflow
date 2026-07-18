# Hexo 辅助函数参考

Hexo 辅助函数只能在模板中使用，不能在源文件中使用。

## 目录

- [URL 辅助函数](#url-辅助函数)
- [HTML 标签辅助函数](#html-标签辅助函数)
- [条件判断辅助函数](#条件判断辅助函数)
- [字符串处理辅助函数](#字符串处理辅助函数)
- [模板辅助函数](#模板辅助函数)
- [日期时间辅助函数](#日期时间辅助函数)
- [列表辅助函数](#列表辅助函数)
- [其他辅助函数](#其他辅助函数)

## URL 辅助函数

### url_for(path, [options])

返回含根路径的 URL，自动编码。

```ejs
<%- url_for('/about') %>
<!-- /root/about -->

<%- url_for('/css/style.css', {relative: false}) %>
```

`options.relative` 可覆盖 `config.relative_link`。

### relative_url(from, to)

计算两个路径间的相对路径。

```ejs
<%- relative_url('foo/bar/', 'css/style.css') %>
<!-- ../../css/style.css -->
```

### full_url_for(path)

返回含 `config.url` 的完整 URL。

```ejs
<%- full_url_for('/about') %>
<!-- https://example.com/about -->
```

### gravatar(email, [size])

生成 Gravatar 图片 URL。

```ejs
<%- gravatar('email@example.com') %>
<%- gravatar('email@example.com', 200) %>
```

## HTML 标签辅助函数

### css(path)

加载 CSS 文件，自动加上 `.css` 扩展名。

```ejs
<%- css('style') %>
<!-- <link rel="stylesheet" href="/style.css"> -->

<%- css(['style', 'custom']) %>
<!-- 加载多个 CSS -->

<%- css({href: 'style', integrity: 'sha384-xxx'}) %>
<!-- 带属性的 CSS -->
```

### js(path)

加载 JavaScript 文件。

```ejs
<%- js('script') %>
<!-- <script src="/script.js"></script> -->

<%- js(['jquery', 'app']) %>
<!-- 加载多个 JS -->
```

### link_to(path, [text], [options])

创建超链接。

```ejs
<%- link_to('https://hexo.io', 'Hexo') %>
<!-- <a href="https://hexo.io">Hexo</a> -->

<%- link_to('https://hexo.io', 'Hexo', {external: true}) %>
<!-- <a href="https://hexo.io" target="_blank" rel="noopener">Hexo</a> -->

<%- link_to('https://hexo.io', 'Hexo', {class: 'btn'}) %>
<!-- <a href="https://hexo.io" class="btn">Hexo</a> -->
```

### mail_to(email, [text], [options])

创建邮件链接。

```ejs
<%- mail_to('info@example.com') %>
<%- mail_to('info@example.com', 'Contact', {subject: 'Hello'}) %>
```

**选项**：`subject`, `cc`, `bcc`, `body`

### image_tag(path, [options])

插入图片标签。

```ejs
<%- image_tag('image.jpg') %>
<%- image_tag('image.jpg', {alt: '描述', class: 'thumbnail'}) %>
```

### favicon_tag(path)

插入 favicon 链接。

```ejs
<%- favicon_tag('favicon.ico') %>
```

### feed_tag(path, [options])

插入 feed 链接。

```ejs
<%- feed_tag('atom.xml') %>
<%- feed_tag('rss.xml', {title: 'RSS Feed', type: 'rss'}) %>
```

## 条件判断辅助函数

### is_current(path, [strict])

检查路径是否为当前页面。

```ejs
<%- is_current('/about') %>
```

### is_home() / is_home_first_page()

检查是否为首页。

```ejs
<% if (is_home()) { %>首页<% } %>
<% if (is_home_first_page()) { %>首页第一页<% } %>
```

### is_post()

检查是否为文章页面。

### is_page()

检查是否为独立页面。

### is_archive()

检查是否为归档页面。

### is_year() / is_month()

检查是否为年度/月份归档页面。

### is_category()

检查是否为分类页面，可选传入分类名称。

```ejs
<% if (is_category()) { %>分类页<% } %>
<% if (is_category('生活')) { %>生活分类<% } %>
```

### is_tag()

检查是否为标签页面，可选传入标签名称。

## 字符串处理辅助函数

### trim(string)

移除首尾空白。

```ejs
<%- trim('  hello  ') %>
<!-- hello -->
```

### strip_html(string)

移除 HTML 标签。

```ejs
<%- strip_html('<p>Hello</p>') %>
<!-- Hello -->
```

### titlecase(string)

转换为标题格式。

```ejs
<%- titlecase('hello world') %>
<!-- Hello World -->
```

### markdown(str)

将 Markdown 转换为 HTML。

```ejs
<%- markdown('## 标题') %>
<!-- <h2>标题</h2> -->
```

### render(str, engine, [options])

使用已注册的渲染器渲染字符串。

```ejs
<%- render('p.example Hello', 'pug') %>
<!-- <p class="example">Hello</p> -->
```

### word_wrap(str, [length])

将文字依指定长度换行（默认 80）。

```ejs
<%- word_wrap('Very long text...', 40) %>
```

### truncate(text, [options])

截断文字到指定长度（默认 30）。

```ejs
<%- truncate('Hello World', {length: 5, separator: ' '}) %>
<!-- Hello... -->
```

### escape_html(str)

转义 HTML 实体。

```ejs
<%- escape_html('<div>') %>
<!-- &lt;div&gt; -->
```

## 模板辅助函数

### partial(layout, [locals], [options])

渲染局部模板。`options.only: true` 只向局部模板暴露显式传入的变量；`options.cache: true` 会启用片段缓存。

```ejs
<%- partial('_partial/article', {item: post}, {only: true}) %>
```

### fragment_cache(id, fn)

缓存函数返回的 HTML。仅用于所有目标页面输出完全相同的片段；包含活动菜单、当前语言、页面数据或相对链接时不要缓存。

```ejs
<%- fragment_cache('static-footer', function(){
  return partial('_partial/static-footer');
}) %>
```

## 日期时间辅助函数

### date(date, [format])

格式化日期，使用 Moment.js 格式。

```ejs
<%- date(Date.now()) %>
<!-- 2024-01-15 -->

<%- date(page.date, 'YYYY年MM月DD日') %>
<!-- 2024年01月15日 -->

<%- date(page.date, 'MMM D, YYYY') %>
<!-- Jan 15, 2024 -->
```

### date_xml(date)

输出 ISO 8601 格式日期（用于 feed）。

```ejs
<%- date_xml(page.date) %>
<!-- 2024-01-15T10:30:00.000Z -->
```

### time(date, [format])

格式化时间。

```ejs
<%- time(Date.now(), 'HH:mm:ss') %>
<!-- 10:30:00 -->
```

### full_date(date, [format])

格式化完整日期时间。

```ejs
<%- full_date(page.date) %>
<!-- 2024-01-15 10:30:00 -->
```

### relative_date(date)

显示相对时间。

```ejs
<%- relative_date(page.date) %>
<!-- 3 天前 -->
```

### time_tag(date, [format])

插入 `<time>` 标签。

```ejs
<%- time_tag(page.date) %>
<!-- <time datetime="2024-01-15T10:30:00.000Z">2024-01-15</time> -->
```

### moment

访问 Hexo 使用的 Moment.js 实例。新代码优先使用日期 Helper；只有需要 Moment.js 特有操作时才直接调用它。

## 列表辅助函数

### list_categories([options])

生成分类列表。

```ejs
<%- list_categories() %>
<%- list_categories(site.categories, {
  orderby: 'name',
  order: 1,
  show_count: true,
  depth: 2,
  class: 'category',
  separator: ', '
}) %>
```

**选项**：

| 选项         | 默认值     | 说明                      |
| ------------ | ---------- | ------------------------- |
| `orderby`    | `name`     | 排序依据                  |
| `order`      | `1`        | 排序方式，1 升序，-1 降序 |
| `show_count` | `true`     | 显示文章数量              |
| `depth`      | `0`        | 分类深度，0 表示全部      |
| `class`      | `category` | CSS class                 |
| `separator`  | `,`        | 分隔符                    |

### list_tags([options])

生成标签列表。

```ejs
<%- list_tags() %>
<%- list_tags({
  orderby: 'count',
  order: -1,
  show_count: true,
  class: 'tag',
  amount: 10
}) %>
```

### list_archives([options])

生成归档列表。

```ejs
<%- list_archives() %>
<%- list_archives({
  type: 'monthly',
  order: -1,
  show_count: true,
  format: 'YYYY年MM月'
}) %>
```

### list_posts([options])

生成文章列表。

```ejs
<%- list_posts({amount: 5}) %>
```

### tagcloud([tags], [options])

生成标签云。

```ejs
<%- tagcloud() %>
<%- tagcloud({
  min_font: 12,
  max_font: 24,
  amount: 50,
  color: true,
  start_color: '#ccc',
  end_color: '#111'
}) %>
```

## 其他辅助函数

### paginator(options)

生成分页导航。

```ejs
<%- paginator() %>
<%- paginator({
  prev_text: '← 上一页',
  next_text: '下一页 →',
  mid_size: 2,
  end_size: 1,
  show_all: false
}) %>
```

### search_form(options)

嵌入 Google 搜索表单。

```ejs
<%- search_form({
  class: 'search-form',
  text: '搜索',
  button: true
}) %>
```

### number_format(number, [options])

格式化数字。

```ejs
<%- number_format(1234567) %>
<!-- 1,234,567 -->

<%- number_format(1234.567, {precision: 2}) %>
<!-- 1,234.57 -->
```

### meta_generator()

输出 Hexo 生成器 meta 标签。

```ejs
<%- meta_generator() %>
<!-- <meta name="generator" content="Hexo 当前版本"> -->
```

### open_graph([options])

生成 Open Graph 标签（用于社交分享）。

```ejs
<%- open_graph() %>
<%- open_graph({
  title: page.title,
  description: page.description,
  image: page.thumbnail,
  twitter_card: 'summary_large_image',
  twitter_site: '@username'
}) %>
```

Hexo 7.3+ 支持 `max_items` 限制目录条目数量。需要调试模板上下文时，还可使用 `inspect()` 和 `log()`；不要把调试输出保留在发布版本中。

### toc(str, [options])

解析标题生成目录。

```ejs
<%- toc(page.content) %>
<%- toc(page.content, {
  class: 'toc',
  list_number: true,
  max_depth: 3,
  min_depth: 1
}) %>
```
