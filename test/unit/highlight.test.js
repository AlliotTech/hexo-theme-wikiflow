'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const configureHighlight = require('../../scripts/events/lib/highlight');
const {
    completeThemeColors,
    parseColor
} = configureHighlight;

test('configureHighlight uses highlight.js theme CSS without writing generated files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wikiflow-highlight-'));
    const warnings = [];
    const hexo = {
        base_dir: tmp,
        config: {
            highlight: {},
            syntax_highlighter: 'highlight.js'
        },
        log: {
            warn(message) {
                warnings.push(message);
            }
        },
        theme: {
            config: {
                codeblock: {
                    theme: {
                        light: 'github',
                        dark: ''
                    }
                }
            }
        }
    };

    try {
        configureHighlight(hexo);

        assert.equal(hexo.config.highlight.hljs, true);
        assert.equal(hexo.theme.config.highlight.light.name, 'github');
        assert.match(
            hexo.theme.config.highlight.light.file,
            /node_modules[/\\]highlight\.js[/\\]styles[/\\]github\.css$/
        );
        assert.equal(fs.existsSync(path.join(tmp, '.tmp', 'wikiflow-highlight')), false);
        assert.deepEqual(warnings, []);
    } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('configureHighlight does not treat PrismJS as highlight.js', () => {
    const hexo = {
        config: {
            highlight: { enable: true },
            syntax_highlighter: 'prismjs'
        },
        log: {
            warn() {}
        },
        theme: {
            config: {
                codeblock: {
                    theme: {
                        light: 'github',
                        dark: ''
                    }
                }
            }
        }
    };

    configureHighlight(hexo);

    assert.equal(hexo.theme.config.highlight.enable, false);
    assert.equal(Object.prototype.hasOwnProperty.call(hexo.config.highlight, 'hljs'), false);
});

test('parseColor handles hex and rgb colors', () => {
    assert.deepEqual(parseColor('#abc'), { red: 170, green: 187, blue: 204 });
    assert.deepEqual(parseColor('rgb(1, 2, 3)'), { red: 1, green: 2, blue: 3 });
    assert.equal(parseColor('var(--color)'), null);
});

test('completeThemeColors derives gutter colors', () => {
    const colors = completeThemeColors({
        background: '#ffffff',
        foreground: '#000000'
    });

    assert.equal(colors.gutter_background, '#e0e0e0');
    assert.equal(colors.gutter_foreground, '#595959');
});
