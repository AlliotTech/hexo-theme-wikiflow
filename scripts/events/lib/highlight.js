'use strict';

const fs = require('fs');
const path = require('path');
let css;

try {
    css = require('@adobe/css-tools');
} catch {
    css = require('css');
}

const DEFAULT_THEME = 'monokai';
const DEFAULT_BACKGROUND = '#f8f8f8';
const DEFAULT_FOREGROUND = '#333';
const NAMED_COLORS = {
    black: '#000000',
    white: '#ffffff'
};

function resolvePackagePath(packageName, file) {
    try {
        return path.join(path.dirname(require.resolve(`${packageName}/package.json`)), file);
    } catch {
        return '';
    }
}

function parseCss(content, file) {
    try {
        return css.parse(content, { source: file });
    } catch (error) {
        throw new Error(`Failed to parse highlight theme CSS: ${file}\n${error.message}`);
    }
}

function walkRules(rules, visitor) {
    if (!Array.isArray(rules)) return;

    for (const rule of rules) {
        visitor(rule);
        if (rule.rules) walkRules(rule.rules, visitor);
    }
}

function extractThemeColors(ast) {
    const colors = {
        background: '',
        foreground: ''
    };

    walkRules(ast.stylesheet.rules, rule => {
        if (rule.type !== 'rule' || !Array.isArray(rule.selectors)) return;

        const isRootSelector = rule.selectors.some(selector => selector.trim().endsWith('.hljs'));
        if (!isRootSelector || !Array.isArray(rule.declarations)) return;

        for (const declaration of rule.declarations) {
            if (declaration.type !== 'declaration') continue;
            if (declaration.property === 'background' || declaration.property === 'background-color') {
                colors.background = declaration.value;
            } else if (declaration.property === 'color') {
                colors.foreground = declaration.value;
            }
        }
    });

    return {
        background: colors.background || DEFAULT_BACKGROUND,
        foreground: colors.foreground || DEFAULT_FOREGROUND
    };
}

function parseColor(value) {
    if (!value) return null;

    const color = NAMED_COLORS[String(value).toLowerCase()] || String(value).trim();
    const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
        const raw = hex[1].length === 3
            ? hex[1].split('').map(channel => channel + channel).join('')
            : hex[1];

        return {
            red: parseInt(raw.slice(0, 2), 16),
            green: parseInt(raw.slice(2, 4), 16),
            blue: parseInt(raw.slice(4, 6), 16)
        };
    }

    const rgb = color.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (rgb) {
        return {
            red: Number(rgb[1]),
            green: Number(rgb[2]),
            blue: Number(rgb[3])
        };
    }

    return null;
}

function colorChannelToHex(value) {
    return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

function mixColor(background, foreground, backgroundWeight) {
    const backgroundColor = parseColor(background);
    const foregroundColor = parseColor(foreground);
    if (!backgroundColor || !foregroundColor) return '';

    const weight = backgroundWeight / 100;
    const mixed = {
        red: backgroundColor.red * weight + foregroundColor.red * (1 - weight),
        green: backgroundColor.green * weight + foregroundColor.green * (1 - weight),
        blue: backgroundColor.blue * weight + foregroundColor.blue * (1 - weight)
    };

    return `#${colorChannelToHex(mixed.red)}${colorChannelToHex(mixed.green)}${colorChannelToHex(mixed.blue)}`;
}

function completeThemeColors(colors) {
    return {
        ...colors,
        gutter_background: mixColor(colors.background, colors.foreground, 88) || colors.background,
        gutter_foreground: mixColor(colors.background, colors.foreground, 35) || colors.foreground
    };
}

function transformSelector(selector) {
    const trimmed = selector.trim();
    if (!trimmed || !trimmed.includes('.hljs')) return null;

    if (/(^|[\s>+~])(?:pre\s+)?code\.hljs\b/.test(trimmed)) return null;

    const hasTokenSelector = trimmed.includes('.hljs-');
    let transformed = trimmed
        .replace(/\.hljs-([A-Za-z0-9_-]+)/g, '.$1')
        .replace(/\.hljs\b/g, '.highlight');

    if (hasTokenSelector && !transformed.startsWith('.highlight')) {
        transformed = `.highlight .code ${transformed}`;
    } else if (hasTokenSelector) {
        transformed = transformed.replace(/^\.highlight\s+/, '.highlight .code ');
    }

    return transformed;
}

function transformRules(rules) {
    if (!Array.isArray(rules)) return rules;

    return rules.reduce((result, rule) => {
        if (rule.type === 'rule') {
            const selectors = [...new Set((rule.selectors || []).map(transformSelector).filter(Boolean))];
            if (selectors.length) {
                rule.selectors = selectors;
                result.push(rule);
            }
            return result;
        }

        if (rule.rules) rule.rules = transformRules(rule.rules);
        result.push(rule);
        return result;
    }, []);
}

function transformHighlightCss(content, file) {
    const ast = parseCss(content, file);
    return transformHighlightAst(ast);
}

function transformHighlightAst(ast) {
    ast.stylesheet.rules = transformRules(ast.stylesheet.rules);
    return css.stringify(ast);
}

function safeFileName(name) {
    return name.replace(/[^A-Za-z0-9_.-]/g, '-');
}

function writeGeneratedTheme(hexo, name, content) {
    const outputDir = path.join(hexo.base_dir, '.tmp', 'wikiflow-highlight');
    const outputFile = path.join(outputDir, `${safeFileName(name)}.css`);

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputFile, content);

    return outputFile;
}

function resolveHighlightTheme(hexo, name) {
    const themeName = name || DEFAULT_THEME;
    const themeFile = resolvePackagePath('highlight.js', path.join('styles', `${themeName}.css`));

    if (themeFile && fs.existsSync(themeFile)) {
        const source = fs.readFileSync(themeFile, 'utf8');
        const ast = parseCss(source, themeFile);
        const colors = extractThemeColors(ast);
        const transformed = transformHighlightAst(ast);
        const generatedFile = writeGeneratedTheme(
            hexo,
            themeName,
            `/* Generated from highlight.js/styles/${themeName}.css. */\n${transformed}\n`
        );

        return {
            name: themeName,
            file: generatedFile,
            ...completeThemeColors(colors)
        };
    }

    hexo.log.warn(`Code highlight theme "${themeName}" was not found. Falling back to "${DEFAULT_THEME}".`);
    if (themeName === DEFAULT_THEME) {
        throw new Error(`Default code highlight theme "${DEFAULT_THEME}" was not found in highlight.js.`);
    }

    return resolveHighlightTheme(hexo, DEFAULT_THEME);
}

function shouldUseHighlight(hexo) {
    const highlightConfig = hexo.config.highlight || {};
    return hexo.config.syntax_highlighter === 'highlight.js' ||
        highlightConfig.enable !== false;
}

function configureHighlight(hexo) {
    const themeConfig = hexo.theme.config || {};
    const codeblock = themeConfig.codeblock || {};
    const codeblockTheme = codeblock.theme || {};
    const lightThemeName = codeblockTheme.light || DEFAULT_THEME;
    const darkThemeName = codeblockTheme.dark || '';
    const lightTheme = resolveHighlightTheme(hexo, lightThemeName);
    const darkTheme = darkThemeName ? resolveHighlightTheme(hexo, darkThemeName) : {};

    hexo.config.highlight = hexo.config.highlight || {};
    if (shouldUseHighlight(hexo)) hexo.config.highlight.hljs = false;

    themeConfig.codeblock = {
        ...codeblock,
        theme: {
            ...codeblockTheme,
            light: lightTheme.name,
            dark: darkTheme.name || ''
        }
    };
    themeConfig.highlight = {
        ...(themeConfig.highlight || {}),
        enable: shouldUseHighlight(hexo),
        light: lightTheme,
        dark: darkTheme
    };
}

module.exports = configureHighlight;
module.exports.completeThemeColors = completeThemeColors;
module.exports.extractThemeColors = extractThemeColors;
module.exports.parseColor = parseColor;
module.exports.transformHighlightCss = transformHighlightCss;
