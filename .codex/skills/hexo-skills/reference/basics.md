# Hexo 基础参考

开发 Hexo 主题前需要了解的基础知识。当前示例以 Hexo 8 为基线；Hexo 8.1.2 要求 Node.js `>=20.19.0`。升级前应以项目的 `package.json` 和 `npm view hexo version engines --json` 为准。

## 目录

- [配置文件](#配置文件)
- [指令](#指令)
- [Front-matter](#front-matter)
- [标签插件](#标签插件)
- [数据文件](#数据文件)

## 配置文件

Hexo 使用 `_config.yml` 作为主要配置文件。

### 网站设置

| 设置          | 说明                                 |
| ------------- | ------------------------------------ |
| `title`       | 网站标题                             |
| `subtitle`    | 网站副标题                           |
| `description` | 网站描述（用于 SEO）                 |
| `keywords`    | 网站关键字                           |
| `author`      | 作者名称                             |
| `language`    | 语言代码或语言优先级数组，如 `zh-CN`、`en` |
| `timezone`    | 时区（如 `Asia/Taipei`）             |

### URL 设置

| 设置                         | 默认值                      | 说明                                             |
| ---------------------------- | --------------------------- | ------------------------------------------------ |
| `url`                        | -                           | 网站 URL（必须以 `http://` 或 `https://` 开头）  |
| `root`                       | `url` 的路径部分            | 网站根目录                                       |
| `permalink`                  | `:year/:month/:day/:title/` | 文章永久链接格式                                 |
| `pretty_urls.trailing_index` | `true`                      | 是否保留结尾的 `index.html`                      |
| `pretty_urls.trailing_html`  | `true`                      | 是否保留结尾的 `.html`                           |

### 永久链接变量

| 变量          | 说明                                 |
| ------------- | ------------------------------------ |
| `:year`       | 4 位数年份                           |
| `:month`      | 2 位数月份                           |
| `:i_month`    | 不补零的月份                         |
| `:day`        | 2 位数日期                           |
| `:i_day`      | 不补零的日期                         |
| `:hour`       | 2 位数小时                           |
| `:minute`     | 2 位数分钟                           |
| `:second`     | 2 位数秒                             |
| `:timestamp`  | 发布时间戳                           |
| `:title`      | 相对于 `source/_posts/` 的文件路径   |
| `:name`       | 不含目录的文件名                     |
| `:post_title` | 文章标题                             |
| `:id`         | 文章 ID；清理缓存后不保证保持不变    |
| `:category`   | 分类（若无则为 `default_category`）  |
| `:hash`       | 文件名与发布日期的 12 位 SHA-1 摘要 |

### 目录设置

| 设置           | 默认值       | 说明                         |
| -------------- | ------------ | ---------------------------- |
| `source_dir`   | `source`     | 源文件目录                 |
| `public_dir`   | `public`     | 生成的静态文件目录           |
| `tag_dir`      | `tags`       | 标签目录                     |
| `archive_dir`  | `archives`   | 归档目录                     |
| `category_dir` | `categories` | 分类目录                     |
| `code_dir`     | `downloads/code` | `include_code` 的代码目录 |
| `i18n_dir`     | `:lang`      | 路径语言检测目录             |
| `skip_render`  | -            | 跳过渲染的文件（支持 glob）  |

### 写作设置

| 设置                   | 默认值      | 说明                 |
| ---------------------- | ----------- | -------------------- |
| `new_post_name`        | `:title.md` | 新文章文件名格式       |
| `default_layout`       | `post`      | 默认布局             |
| `titlecase`            | `false`     | 标题转换为标题格式   |
| `external_link.enable` | `true`      | 外部链接在新标签页打开     |
| `filename_case`        | `0`         | 文件名大小写转换：0 不变、1 小写、2 大写 |
| `render_drafts`        | `false`     | 是否渲染草稿         |
| `post_asset_folder`    | `false`     | 启用文章资源文件夹   |
| `relative_link`        | `false`     | 使用相对链接         |
| `future`               | `true`      | 显示未来文章         |
| `syntax_highlighter`   | `highlight.js` | 代码高亮器        |

### 分页设置

| 设置             | 默认值 | 说明                     |
| ---------------- | ------ | ------------------------ |
| `per_page`       | `10`   | 每页文章数（0 禁用分页） |
| `pagination_dir` | `page` | 分页目录                 |

### 主题设置

```yaml
# 指定主题
theme: landscape

# 主题配置（会与主题 _config.yml 合并）
theme_config:
  menu:
    home: /
    archives: /archives
```

### 替代配置文件

```bash
# 使用替代配置文件
hexo generate --config custom.yml

# 合并多个配置文件（后者优先）
hexo generate --config _config.yml,_config.theme.yml
```

逗号分隔的配置文件列表中不能包含空格。合并结果会写入 `_multiconfig.yml`。

## 指令

### 核心指令

```bash
# 创建新网站
hexo init [folder]

# 创建新文章/页面/草稿
hexo new [layout] <title>
hexo new post "My Post"
hexo new page "about"
hexo new draft "Draft Post"

# 生成静态文件
hexo generate
hexo g              # 简写
hexo g --watch      # 监视文件变化
hexo g --deploy     # 生成后部署
hexo g --force      # 强制重新生成

# 启动本地服务器
hexo server
hexo s              # 简写
hexo s -p 5000      # 指定端口号
hexo s --draft      # 显示草稿

# 发布草稿
hexo publish <filename>

# 部署网站
hexo deploy
hexo d              # 简写
hexo d --generate   # 生成后部署

# 清除缓存和已生成文件
hexo clean

# 显示列表
hexo list <type>

# 渲染指定文件
hexo render <file> --output <path>

# 显示版本
hexo version

# 查看或修改配置
hexo config [key] [value]
```

### 全局选项

| 选项              | 说明                 |
| ----------------- | -------------------- |
| `--safe`          | 安全模式（禁用插件） |
| `--debug`         | 调试模式             |
| `--silent`        | 静默模式             |
| `--config <path>` | 指定配置文件           |
| `--draft`         | 显示草稿             |
| `--cwd <path>`    | 指定工作目录         |

## Front-matter

Front-matter 是文件开头的 YAML 或 JSON 区块，用于设置文章属性。

### 格式

```yaml
---
title: 文章标题
date: 2024-01-15 10:30:00
tags:
  - Tag1
  - Tag2
categories:
  - Category1
---
文章内容...
```

### 可用属性

| 属性         | 说明           | 默认值             |
| ------------ | -------------- | ------------------ |
| `title`      | 标题           | 文件名称           |
| `date`       | 创建日期       | 文件创建日期       |
| `updated`    | 更新日期       | 文件修改日期       |
| `layout`     | 布局           | `config.default_layout` |
| `comments`   | 开启评论       | `true`             |
| `tags`       | 标签（仅文章） | -                  |
| `categories` | 分类（仅文章） | -                  |
| `permalink`  | 自定义永久链接   | -                  |
| `excerpt`    | 摘要（纯文字） | -                  |
| `disableNunjucks` | 禁用 Nunjucks 标签和 Hexo 标签插件处理 | `false` |
| `published`  | 是否发布       | `true`             |
| `lang`       | 语言           | 继承 `_config.yml` |

### 分类与标签

```yaml
# 标签（同一层级）
tags:
  - JavaScript
  - Node.js
```

```yaml
# 分类（层级结构）
categories:
  - Programming
  - Web Development
```

```yaml
# 多重分类层级
categories:
  - [Programming, JavaScript]
  - [Tutorial]
```

### 自定义属性

可以自定义任意属性，在模板中通过 `page.xxx` 访问：

```yaml
---
title: My Post
thumbnail: /images/thumb.jpg
featured: true
---
```

```ejs
<% if (page.featured) { %>
  <img src="<%= page.thumbnail %>">
<% } %>
```

## 标签插件

标签插件用于在文章中插入特定内容，格式为 `{% tag_name args %}`。

Hexo 7 起已移除内置 `jsfiddle`、`gist`、`youtube` 和 `vimeo` 标签。旧文章需要这些标签时，安装并配置 [`hexo-tag-embed`](https://github.com/hexojs/hexo-tag-embed)，不要继续假定它们由 Hexo 核心提供。

### 代码区块

```markdown
{% codeblock [title] [lang:language] [url] [link text] [line_number:false] [highlight:true] [first_line:1] [mark:#,#-#] %}
code snippet
{% endcodeblock %}

<!-- 示例 -->
{% codeblock Array.map lang:javascript %}
const doubled = [1, 2, 3].map(n => n * 2);
{% endcodeblock %}
```

### 引用区块

```markdown
{% blockquote [author[, source]] [link] [source_link_title] %}
quote content
{% endblockquote %}

<!-- 示例 -->
{% blockquote David Levithan, Wide Awake %}
Do not just seek happiness for yourself.
{% endblockquote %}
```

### Pull Quote

```markdown
{% pullquote [class] %}
content
{% endpullquote %}
```

### 嵌入内容

```markdown
<!-- iframe -->
{% iframe url [width] [height] %}

<!-- 图片 -->
{% img [class names] /path/to/image [width] [height] "title text 'alt text'" %}

<!-- 链接 -->
{% link text url [external] [title] %}
```

### 引入代码文件

```markdown
<!-- 从 source/downloads/code 引入 -->
{% include_code [title] [lang:language] [from:line] [to:line] path/to/file %}

<!-- 示例 -->
{% include_code lang:javascript test.js %}
```

### 文章链接

```markdown
<!-- 获取文章路径 -->
{% post_path filename %}

<!-- 创建文章链接 -->
{% post_link filename [title] [escape] %}

<!-- 示例 -->
{% post_link my-post '点击这里' %}
```

### 资源标签

需启用 `post_asset_folder: true`：

```markdown
<!-- 资源路径 -->
{% asset_path filename %}

<!-- 资源图片 -->
{% asset_img [class names] filename [width] [height] [title text [alt text]] %}

<!-- 资源链接 -->
{% asset_link filename [title] [escape] %}
```

### URL 标签

```markdown
{% url_for path %}
{% full_url_for path %}
```

### Raw 标签

防止内容被解析：

```markdown
{% raw %}
content that should not be parsed
{% endraw %}
```

### 文章摘要

在文章中插入 `<!-- more -->` 分隔摘要：

```markdown
这是摘要内容

<!-- more -->

这是完整内容
```

## 数据文件

数据文件用于保存可重复使用的数据。

### 创建数据文件

在 `source/_data/` 目录创建 YAML 或 JSON 文件：

```yaml
# source/_data/menu.yml
home: /
archives: /archives
about: /about
```

```yaml
# source/_data/friends.yml
- name: Friend 1
  url: https://friend1.com
  description: A great blog

- name: Friend 2
  url: https://friend2.com
  description: Another great blog
```

### 在模板中使用

通过 `site.data` 访问：

```ejs
<!-- 导航菜单 -->
<nav>
  <% for (var name in site.data.menu) { %>
    <a href="<%= site.data.menu[name] %>"><%= name %></a>
  <% } %>
</nav>

<!-- 友情链接 -->
<% if (site.data.friends) { %>
  <ul class="friends">
    <% site.data.friends.forEach(function(friend){ %>
      <li>
        <a href="<%= friend.url %>"><%= friend.name %></a>
        <span><%= friend.description %></span>
      </li>
    <% }) %>
  </ul>
<% } %>
```

### 用途示例

- 导航菜单配置
- 社区链接
- 友情链接
- 网站公告
- 赞助商信息
- 任何需要重复使用的结构化数据
