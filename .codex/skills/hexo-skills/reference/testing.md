# Hexo 主题测试参考

## 目录

- [当前基线](#当前基线)
- [测试策略](#测试策略)
- [项目配置](#项目配置)
- [Node 单元测试](#node-单元测试)
- [配置与语言文件验证](#配置与语言文件验证)
- [代码质量检查](#代码质量检查)
- [生成与功能测试](#生成与功能测试)
- [GitHub Actions](#github-actions)

## 当前基线

本次审校时的当前版本快照：

| 工具 | 版本 | 关键要求 |
| --- | --- | --- |
| Hexo | `8.1.2` | Node.js `>=20.19.0` |
| ESLint | `10.7.0` | Node.js `^20.19.0 || ^22.13.0 || >=24` |
| Stylelint | `17.14.0` | Node.js `>=20.19.0` |
| Node 内置测试运行器 | 随 Node.js 提供 | 无额外断言依赖 |
| GitHub Actions checkout/setup-node | `v7` | 使用当前 GitHub 托管运行器 |

版本会继续变化。更新依赖前运行：

```bash
npm view hexo version engines --json
npm view eslint version engines --json
npm view stylelint version engines peerDependencies --json
npm view stylelint-config-standard version peerDependencies --json
```

Hexo 8 不再兼容 Node 18。Node 20 已进入生命周期末期时，生产环境优先使用受支持的 Node LTS；如果包声明最低兼容版本为 `20.19.0`，CI 可以保留该版本做下限测试。

## 测试策略

至少覆盖以下层面：

| 层面 | 建议工具 | 目标 |
| --- | --- | --- |
| Helper、Filter、Tag | `node:test` + `node:assert/strict` | 验证输入、输出和边界情况 |
| YAML/JSON | `js-yaml`、`JSON.parse` | 验证主题配置和语言文件 |
| JavaScript | ESLint | 区分 Node、浏览器和测试环境 |
| CSS | Stylelint | 验证标准 CSS |
| Stylus | Stylelint 16 + `stylelint-stylus` | 避免与 Stylelint 17 的 peer 依赖冲突 |
| 静态生成 | `hexo clean && hexo generate` | 验证模板、生成器和资源 |
| 页面行为 | Playwright 或浏览器手工检查 | 验证响应式、交互和可访问性 |
| 内容覆盖 | `hexo-theme-unit-test` | 验证主题对常见文章内容的支持 |

CommonJS 主题优先使用 Node 内置断言。Chai 5/6 是 ESM-only，不能继续配合旧示例中的 `require('chai')` 使用。

## 项目配置

### package.json

适用于标准 CSS 的简化配置：

```json
{
  "engines": {
    "node": ">=20.19.0"
  },
  "scripts": {
    "build": "hexo clean && hexo generate",
    "lint:js": "eslint scripts source/js test",
    "lint:styles": "stylelint \"source/css/**/*.css\"",
    "lint": "npm run lint:js && npm run lint:styles",
    "test": "node --test",
    "test:coverage": "node --test --experimental-test-coverage"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "eslint": "^10.7.0",
    "globals": "^17.7.0",
    "hexo": "^8.1.2",
    "js-yaml": "^5.2.1",
    "stylelint": "^17.14.0",
    "stylelint-config-standard": "^40.0.0"
  }
}
```

提交锁文件并在 CI 中使用 `npm ci`。如果项目使用 pnpm 或 Yarn，沿用已有包管理器和锁文件。

### Stylus 兼容性

`stylelint-stylus@1.0.0` 的 peer 范围只覆盖 Stylelint 13–16，不能与 Stylelint 17 混用。Stylus 主题应保留兼容组合，例如：

```json
{
  "devDependencies": {
    "stylelint": "^16.26.1",
    "stylelint-config-standard": "^36.0.1",
    "stylelint-stylus": "^1.0.0"
  }
}
```

不要为了追求单个包的最高版本而破坏 peer 依赖兼容性。

## Node 单元测试

### 让扩展逻辑可测试

将注册逻辑导出为函数，同时保留 Hexo 自动加载能力：

```javascript
'use strict';

function registerReadingTime(hexoInstance) {
  const stripHtml = hexoInstance.extend.helper.get('strip_html').bind(hexoInstance);

  hexoInstance.extend.helper.register('reading_time', function(content) {
    const text = stripHtml(content || '');
    const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
    return Math.ceil(words / 200);
  });
}

if (typeof hexo !== 'undefined') {
  registerReadingTime(hexo);
}

module.exports = registerReadingTime;
```

### 测试 Helper

```javascript
'use strict';

const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Hexo = require('hexo');
const registerReadingTime = require('../../scripts/helpers/reading-time');

describe('reading_time helper', () => {
  const hexo = new Hexo(__dirname, { silent: true });
  let readingTime;

  before(async () => {
    await hexo.init();
    registerReadingTime(hexo);
    readingTime = hexo.extend.helper.get('reading_time').bind(hexo);
  });

  after(async () => {
    await hexo.exit();
  });

  it('calculates English words', () => {
    assert.equal(readingTime('word '.repeat(200)), 1);
  });

  it('handles empty content', () => {
    assert.equal(readingTime(''), 0);
  });

  it('strips HTML', () => {
    assert.equal(readingTime(`<p>${'word '.repeat(400)}</p>`), 2);
  });
});
```

始终在测试结束后调用 `hexo.exit()`，避免数据库、监听器或临时资源残留。

### 测试 Tag

使用 `hexo.post.render()` 验证真实标签解析：

```javascript
const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Hexo = require('hexo');
const registerNoteTag = require('../../scripts/tags/note');

describe('note tag', () => {
  const hexo = new Hexo(__dirname, { silent: true });

  before(async () => {
    await hexo.init();
    registerNoteTag(hexo);
  });

  after(async () => {
    await hexo.exit();
  });

  it('renders note content', async () => {
    const result = await hexo.post.render(null, {
      content: '{% note warning %}Be careful{% endnote %}',
      engine: 'markdown'
    });

    assert.match(result.content, /class="note warning"/);
    assert.match(result.content, /Be careful/);
  });
});
```

让测试共享已初始化的 Hexo fixture；不要为每个断言重复执行昂贵的初始化。

## 配置与语言文件验证

```javascript
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const themeDir = path.resolve(__dirname, '../..');

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    const nested = flattenKeys(child, next);
    return nested.length ? nested : [next];
  });
}

describe('theme configuration', () => {
  it('parses _config.yml', () => {
    const content = fs.readFileSync(path.join(themeDir, '_config.yml'), 'utf8');
    assert.doesNotThrow(() => yaml.load(content));
  });

  it('keeps language keys consistent', () => {
    const langDir = path.join(themeDir, 'languages');
    const files = fs.readdirSync(langDir).filter(file => /\.ya?ml$/u.test(file));
    if (files.length < 2) return;

    const [baseFile, ...otherFiles] = files.sort();
    const baseKeys = flattenKeys(
      yaml.load(fs.readFileSync(path.join(langDir, baseFile), 'utf8'))
    ).sort();

    for (const file of otherFiles) {
      const keys = flattenKeys(
        yaml.load(fs.readFileSync(path.join(langDir, file), 'utf8'))
      ).sort();
      assert.deepEqual(keys, baseKeys, `${file} 与 ${baseFile} 的语言键不一致`);
    }
  });
});
```

如果 `default.yml` 有意只保存回退子集，不要把它作为完整键集合基准。

## 代码质量检查

### ESLint 10

使用 `eslint.config.mjs` 明确区分运行环境：

```javascript
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'public/', '.deploy_git/']
  },
  js.configs.recommended,
  {
    files: ['scripts/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        hexo: 'readonly'
      }
    }
  },
  {
    files: ['source/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.browser
    }
  }
];
```

### Stylelint 17（标准 CSS）

Stylelint 16 起已移除 `indentation`、`string-quotes` 等核心风格规则，不要继续复制旧配置：

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "selector-class-pattern": "^[a-z][a-z0-9-]*$"
  }
}
```

格式化交给 Prettier 或项目现有格式化工具。

## 生成与功能测试

每次修改模板或扩展后运行：

```bash
npm test
npm run lint
npm run build
```

至少检查：

- 首页、文章页、独立页、归档、分类和标签路由能生成。
- `url_for()` 在站点部署到子目录时仍正确。
- 相对链接模式下没有被片段缓存污染。
- 无标题、长标题、空分类/标签和特殊字符内容不会破坏布局。
- 代码高亮、图片、分页、Feed 和 Sitemap 插件按项目声明工作。
- HTML 具备正确的 `doctype`、UTF-8、viewport、标题和规范链接。
- 键盘导航、焦点状态、移动端布局和暗色模式可用。

使用官方内容测试仓库：

```bash
git clone https://github.com/hexojs/hexo-theme-unit-test.git
cd hexo-theme-unit-test
npm install
git clone https://github.com/your/theme.git themes/mytheme
```

然后把 `theme: mytheme` 写入测试站点配置并运行 `npx hexo generate` 或 `npx hexo server`。

## GitHub Actions

使用只读默认权限和当前 Action 主版本：

```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        node: ['20.19', '22', '24']
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node }}
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

如果项目不承诺 Node 20 兼容性，从矩阵中移除 `20.19`。如果使用 Stylus 兼容依赖组合，CI 必须安装锁文件中的 Stylelint 16，不要自动升级到 17。
