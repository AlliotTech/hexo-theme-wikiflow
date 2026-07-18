---
name: hexo-theme-development
description: Develop, modernize, debug, and test Hexo 8 themes and extensions. Use when Codex works with Hexo theme structure, EJS/Nunjucks/Pug templates, variables, helpers, i18n, theme scripts, plugin APIs, compatibility upgrades, or theme CI and release checks.
---

# Hexo 8 主题开发

## 工作流程

1. 先读取项目的 `package.json`、`_config.yml`、主题 `_config.yml` 和现有模板，确认 Hexo、Node.js、渲染器与生成器版本。
2. 不要根据本 skill 中的版本快照盲目升级。需要安装或升级依赖时，先运行 `npm view <package> version engines peerDependencies --json`。
3. 优先沿用项目现有模板引擎、模块格式、测试框架和代码风格；只有在用户要求时才迁移技术栈。
4. 修改模板后运行静态生成；修改脚本、Helper、Tag 或 Generator 后同时运行单元测试和生成测试。
5. 对 URL、HTML、JSON-LD 和用户配置进行转义或结构化处理，不要使用脆弱的正则表达式改写任意 HTML。

## 当前兼容基线

- 本次审校基于 Hexo `8.1.2`；Hexo 8 要求 Node.js `>=20.19.0`。
- 新项目优先使用仍受支持的 Node.js LTS；如果包声明支持最低版本，CI 可额外测试 `20.19` 兼容性。
- Hexo 主题至少需要 `layout/index` 模板。`post`、`page`、`archive`、`category` 和 `tag` 按回退链选择模板。
- Nunjucks 由 Hexo 提供；EJS 和 Pug 分别安装 `hexo-renderer-ejs`、`hexo-renderer-pug`。
- Hexo 会在初始化时自动加载站点和主题 `scripts/` 中的 JavaScript 文件。

## 按任务读取参考资料

- 配置、命令、Front-matter、标签插件和数据文件：读取 [reference/basics.md](reference/basics.md)。
- 模板回退、布局、局部模板和片段缓存：读取 [reference/templates.md](reference/templates.md)。
- `site`、`page`、`config`、`theme` 和分页变量：读取 [reference/variables.md](reference/variables.md)。
- 内置 Helper 的参数与示例：读取 [reference/helpers.md](reference/helpers.md)。
- 语言文件、`__()`、`_p()`、路径语言检测和多语言路由：读取 [reference/i18n.md](reference/i18n.md)。
- Filter、Helper、Generator、Tag、Renderer、Injector 和 Console API：读取 [reference/api.md](reference/api.md)。
- Node 测试、ESLint、Stylelint、Hexo 生成测试和 GitHub Actions：读取 [reference/testing.md](reference/testing.md)。
- 完整主题骨架：读取 [examples/basic-theme.md](examples/basic-theme.md)。
- 自定义扩展、SEO、多语言和性能示例：读取 [examples/advanced-usage.md](examples/advanced-usage.md)。

## 主题结构

```text
.
├── _config.yml
├── languages/
├── layout/
├── scripts/
└── source/
```

- 将主题默认配置放在主题 `_config.yml` 中。
- 将可翻译文案放在 `languages/*.yml` 或 `languages/*.json` 中。
- 将模板放在 `layout/` 中，将可复用片段放在其子目录中。
- 将扩展脚本放在 `scripts/` 中；为可测试性，优先把注册逻辑导出为函数。
- 将 CSS、浏览器 JavaScript、字体和图片放在 `source/` 中。

## 模板规则

使用以下回退链：

```text
index
post     -> index
page     -> index
archive  -> index
category -> archive -> index
tag      -> archive -> index
```

布局模板必须输出 `body`：

```ejs
<!doctype html>
<html>
  <body><%- body %></body>
</html>
```

使用 `partial()` 复用组件。仅对所有目标页面输出完全相同的片段启用缓存；活动菜单、相对链接、当前语言和页面数据会变化时不要缓存。

## 变量与输出安全

- 使用 `site` 访问全站集合，使用 `page` 访问当前路由或文章数据。
- 使用 `config` 访问站点配置，使用 `theme` 访问最终主题配置。
- `site.posts`、`site.pages`、分类和标签通常是 Warehouse Query，不要假定它们是原生数组；需要数组方法时先调用 `toArray()`。
- 使用 `url_for()` 生成站内 URL，使用 `full_url_for()` 生成规范绝对 URL。
- EJS 中用 `<%= value %>` 输出需要 HTML 转义的文本，用 `<%- value %>` 输出可信 HTML，例如已渲染正文或 Helper 返回的标签。
- 生成 JSON-LD 时先构造对象并调用 `JSON.stringify()`，不要手工拼接 JSON。

## 国际化

```yaml
language:
  - zh-CN
  - en
```

- 语言文件名必须与语言代码匹配，例如 `languages/zh-CN.yml`。
- `language` 为数组时，第一项是默认语言和回退优先级最高的语言。
- `i18n_dir: :lang` 只负责从路径检测语言，不会自动复制或翻译页面。
- 多语言文章仍放在 `source/_posts/` 下，可结合 `new_post_name: :lang/:title.md` 与 `permalink: :lang/:title/` 组织路径。

## 扩展 API

优先选择最小的扩展点：

| 扩展点 | 用途 |
| --- | --- |
| Helper | 在模板中复用格式化或 HTML 生成逻辑 |
| Filter | 在生命周期或渲染阶段转换数据 |
| Generator | 创建路由与分页数据 |
| Tag | 在文章内容中提供自定义标签语法 |
| Renderer | 将一种源格式转换为输出格式 |
| Injector | 向生成后的 HTML 注入静态片段 |
| Console | 添加 Hexo CLI 子命令 |

注册函数需要访问其他 Helper 时，在 Helper 内使用 `this.helperName()`；在 Filter、Injector 或测试中使用 `hexo.extend.helper.get(name).bind(hexo)`。

## 测试与发布

- CommonJS 主题优先使用 `node:test` 与 `node:assert/strict`，避免只为断言引入 ESM-only 测试库。
- 至少验证主题 YAML、语言键一致性、自定义扩展、`hexo generate`、首页、文章页、归档页和静态资源。
- Hexo 8 的 CI 不要再测试 Node 18。
- 使用当前 GitHub Actions 主版本；本次审校时 `actions/checkout` 与 `actions/setup-node` 的当前主版本均为 `v7`。
- 发布前用 [hexo-theme-unit-test](https://github.com/hexojs/hexo-theme-unit-test) 做内容覆盖检查，并按 [hexojs/site](https://github.com/hexojs/site) 当前主题提交流程准备元数据和 800×500 PNG 截图。

## 官方来源

- [Hexo 文档](https://hexo.io/docs/)
- [Hexo API](https://hexo.io/api/)
- [Hexo npm 包](https://www.npmjs.com/package/hexo)
- [Hexo GitHub 仓库](https://github.com/hexojs/hexo)
