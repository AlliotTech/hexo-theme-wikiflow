# Hexo API 参考

Hexo API 用于开发插件和深度自定义主题功能。示例以 Hexo 8 为基线；实现前应对照当前 [Hexo API 文档](https://hexo.io/api/) 和已安装版本。

## 目录

- [初始化与生命周期](#初始化与生命周期)
- [事件系统](#事件系统)
- [局部变量 (Locals)](#局部变量-locals)
- [扩展 API](#扩展-api)
  - [Filter 过滤器](#filter-过滤器)
  - [Helper 辅助函数](#helper-辅助函数)
  - [Generator 生成器](#generator-生成器)
  - [Tag 标签](#tag-标签)
  - [Renderer 渲染器](#renderer-渲染器)
  - [Injector 注入器](#injector-注入器)
  - [Console 控制台](#console-控制台)

## 初始化与生命周期

### 创建 Hexo 实例

```javascript
const Hexo = require('hexo');
const hexo = new Hexo(process.cwd(), {});

// 初始化
hexo.init().then(() => {
  // 加载源文件
  return hexo.load();
}).then(() => {
  // 运行指令
  return hexo.call('generate');
}).then(() => {
  // 结束
  return hexo.exit();
}).catch(err => {
  return hexo.exit(err);
});
```

### 主要方法

| 方法                    | 说明                   |
| ----------------------- | ---------------------- |
| `hexo.init()`           | 初始化，加载配置和插件 |
| `hexo.load()`           | 加载源文件           |
| `hexo.watch()`          | 监视文件变化           |
| `hexo.call(name, args)` | 运行控制台指令         |
| `hexo.exit(err)`        | 结束并保存数据库       |

## 事件系统

Hexo 继承自 Node.js 的 EventEmitter。

### 可用事件

| 事件             | 说明             | 返回数据          |
| ---------------- | ---------------- | ----------------- |
| `deployBefore`   | 部署前触发       | -                 |
| `deployAfter`    | 部署后触发       | -                 |
| `generateBefore` | 生成前触发       | -                 |
| `generateAfter`  | 生成后触发       | -                 |
| `processBefore`  | 处理前触发       | Box 根目录路径    |
| `processAfter`   | 处理后触发       | Box 根目录路径    |
| `new`            | 创建文章时触发   | `{path, content}` |
| `exit`           | 结束前触发       | -                 |
| `ready`          | 初始化完成时触发 | -                 |

### 使用示例

```javascript
hexo.on('generateBefore', () => {
  console.log('开始生成网站...');
});

hexo.on('new', (post) => {
  console.log(`新文章: ${post.path}`);
});
```

## 局部变量 (Locals)

局部变量用于模板渲染，对应模板中的 `site` 变量。

### 默认变量

- `posts` - 所有文章
- `pages` - 所有页面
- `categories` - 所有分类
- `tags` - 所有标签

### 操作方法

```javascript
// 获取变量
hexo.locals.get('posts');

// 设置变量
hexo.locals.set('posts', function() {
  return this.database.model('Post').find({});
});

// 移除变量
hexo.locals.remove('posts');

// 获取所有变量
hexo.locals.toObject();

// 清除缓存
hexo.locals.invalidate();
```

## 扩展 API

### Filter 过滤器

过滤器用于修改特定数据，依优先级运行（数字越小越先运行）。

#### 注册过滤器

```javascript
hexo.extend.filter.register('before_post_render', function(data) {
  // 修改文章数据
  data.title = data.title.toUpperCase();
  return data;
}, 10); // 优先级
```

#### 可用过滤器类型

##### 文章处理

| 类型                 | 说明       | 参数   |
| -------------------- | ---------- | ------ |
| `before_post_render` | 文章渲染前 | `data` |
| `after_post_render`  | 文章渲染后 | `data` |

##### 生命周期

| 类型              | 说明     |
| ----------------- | -------- |
| `after_init`      | 初始化后 |
| `before_exit`     | 结束前   |
| `before_generate` | 生成前   |
| `after_generate`  | 生成后   |
| `after_clean`     | 清理后   |

##### 内容与路由

| 类型              | 说明             |
| ----------------- | ---------------- |
| `post_permalink`  | 决定文章永久链接 |
| `new_post_path`   | 决定新文章路径   |
| `template_locals` | 修改模板局部变量 |

##### 渲染与服务器

| 类型                | 说明               |
| ------------------- | ------------------ |
| `after_render:html` | HTML 渲染后        |
| `after_render:css`  | CSS 渲染后         |
| `server_middleware` | 添加服务器中间件 |

`server_middleware` 由 `hexo-server` 提供。编写服务器中间件时同时检查当前 `hexo-server` README，不要只依赖 Hexo 核心 API 页面。

#### 实用示例

需要结构化修改 HTML 时显式声明 `cheerio` 依赖，不要依赖 Hexo 的传递依赖。

```javascript
const cheerio = require('cheerio');

// 使用 HTML 解析器处理外部链接，避免正则表达式破坏标签
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
      // 保留无法解析的相对或自定义协议链接
    }
  });

  data.content = $.html();
  return data;
});

// 修改模板变量
hexo.extend.filter.register('template_locals', function(locals) {
  locals.now = Date.now();
  return locals;
});
```

### Helper 辅助函数

辅助函数用于在模板中快速插入代码片段。

#### 注册辅助函数

```javascript
hexo.extend.helper.register('greeting', function(name) {
  return `Hello, ${name}!`;
});
```

#### 在模板中使用

```ejs
<%= greeting('World') %>
<!-- 输出: Hello, World! -->
```

#### 访问其他辅助函数

```javascript
hexo.extend.helper.register('my_link', function(path, text) {
  // 使用内置的 url_for 辅助函数
  return `<a href="${this.url_for(path)}">${text}</a>`;
});
```

#### 在插件中获取辅助函数

```javascript
const helper = hexo.extend.helper.get('url_for').bind(hexo);
const url = helper('/about');
```

### Generator 生成器

生成器根据处理后的文件创建路由。

#### 注册生成器

```javascript
hexo.extend.generator.register('my_generator', function(locals) {
  return {
    path: 'about/index.html',
    data: { title: 'About' },
    layout: ['page', 'index']
  };
});
```

#### 返回格式

| 属性     | 说明                       |
| -------- | -------------------------- |
| `path`   | 路由路径（不含开头 `/`）   |
| `data`   | 要渲染的数据               |
| `layout` | 使用的布局（数组或字符串）   |

#### Generator 示例

```javascript
// 生成文章页面
hexo.extend.generator.register('post', function(locals) {
  return locals.posts.map(function(post) {
    return {
      path: post.path,
      data: post,
      layout: ['post', 'index']
    };
  });
});

// 生成分页
const pagination = require('hexo-pagination');

hexo.extend.generator.register('archive', function(locals) {
  return pagination('archives/', locals.posts, {
    perPage: 10,
    layout: ['archive', 'index'],
    data: {}
  });
});

// 复制文件
const fs = require('node:fs');

hexo.extend.generator.register('asset', function(locals) {
  return {
    path: 'file.txt',
    data: function() {
      return fs.createReadStream('path/to/file.txt');
    }
  };
});
```

### Tag 标签

标签插件用于在文章中插入特定内容。

#### 基本注册

```javascript
// 简单标签
hexo.extend.tag.register('youtube', function(args) {
  const id = encodeURIComponent(args[0] || '');
  return `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" loading="lazy" allowfullscreen></iframe>`;
});
```

#### 带结束标签

```javascript
hexo.extend.tag.register('pullquote', function(args, content) {
  const className = args.filter(value => /^[a-z0-9_-]+$/iu.test(value)).join(' ');
  return `<blockquote class="${className}">${content}</blockquote>`;
}, { ends: true });
```

#### 异步标签

```javascript
const fs = require('node:fs/promises');

hexo.extend.tag.register('include', function(args) {
  const filename = args[0];
  return fs.readFile(filename, 'utf8');
}, { async: true });
```

#### 使用方式（在文章中）

```markdown
{% youtube dQw4w9WgXcQ %}

{% pullquote center %}
这是引用文字
{% endpullquote %}
```

#### 取消注册

```javascript
hexo.extend.tag.unregister('youtube');
```

### Renderer 渲染器

渲染器用于转换内容格式。

#### 注册渲染器

```javascript
const sass = require('sass');
const ejs = require('ejs');

// 异步渲染器；使用 Dart Sass 当前 API
hexo.extend.renderer.register('scss', 'css', async function(data, options) {
  const result = await sass.compileStringAsync(data.text, {
    loadPaths: options.loadPaths || []
  });
  return result.css;
});

// 同步渲染器
hexo.extend.renderer.register('ejs', 'html', function(data, options) {
  return ejs.render(data.text, options);
}, true);
```

#### 参数说明

| 参数       | 说明                         |
| ---------- | ---------------------------- |
| `name`     | 输入扩展名（小写，不含 `.`） |
| `output`   | 输出扩展名                   |
| `function` | 渲染函数                     |
| `sync`     | 是否同步（默认 `false`）     |

#### 禁用 Nunjucks 处理

```javascript
function renderer(data, options) {
  // ...
}
renderer.disableNunjucks = true;

hexo.extend.renderer.register('html', 'html', renderer);
```

### Injector 注入器

注入器用于在 HTML 特定位置插入静态代码。

#### 基本用法

```javascript
hexo.extend.injector.register(entry, value, to);
```

#### Entry 注入点

| 值           | 说明         |
| ------------ | ------------ |
| `head_begin` | `<head>` 后  |
| `head_end`   | `</head>` 前 |
| `body_begin` | `<body>` 后  |
| `body_end`   | `</body>` 前 |

#### To 目标页面

| 值         | 说明     |
| ---------- | -------- |
| `default`  | 所有页面 |
| `home`     | 首页     |
| `post`     | 文章页   |
| `page`     | 独立页面 |
| `archive`  | 归档页   |
| `category` | 分类页   |
| `tag`      | 标签页   |

#### Injector 示例

```javascript
// 注入 CSS
hexo.extend.injector.register('head_end', '<link rel="stylesheet" href="/custom.css">', 'default');

// 注入 JS（仅文章页）
hexo.extend.injector.register('body_end', '<script src="/post.js"></script>', 'post');

// 使用函数动态生成
hexo.extend.injector.register('head_end', () => {
  return `<meta name="generator" content="Hexo ${hexo.version}">`;
}, 'default');
```

### Console 控制台

控制台是 Hexo 与用户沟通的桥梁。

#### 注册指令

```javascript
hexo.extend.console.register('hello', '打招呼指令', {
  usage: '[name]',
  arguments: [
    { name: 'name', desc: '你的名字' }
  ],
  options: [
    { name: '-u, --uppercase', desc: '使用大写' }
  ]
}, function(args) {
  const name = args._[0] || 'World';
  let greeting = `Hello, ${name}!`;

  if (args.uppercase) {
    greeting = greeting.toUpperCase();
  }

  console.log(greeting);
});
```

#### 使用指令

```bash
hexo hello Ray
# 输出: Hello, Ray!

hexo hello Ray -u
# 输出: HELLO, RAY!
```

## 配置访问

在扩展中可访问配置：

```javascript
// 网站配置
hexo.config.title

// 主题配置
hexo.theme.config.menu

// 最终主题配置
// 由主题 _config.yml、站点 theme_config 和替代主题配置合并而来
hexo.theme.config
```

站点配置始终从 `hexo.config` 读取；不要把 `hexo.theme.config` 当成完整站点配置。

## 脚本文件位置

自定义脚本可放置于：

- 项目根目录 `scripts/` 文件夹
- 主题 `themes/<name>/scripts/` 文件夹

Hexo 初始化时会自动加载这些脚本。
