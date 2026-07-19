'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
    createSprite,
    iconDescriptor,
    renderIcon,
    resolveDefinition,
    socialIconDescriptor,
    spriteId
} = require('../../scripts/lib/icons');

test('createSprite includes core icons and only configured optional social brands', () => {
    const sprite = createSprite({
        social: {
            github: 'https://github.com/example',
            rss: '/atom.xml'
        }
    });

    assert.match(sprite, new RegExp(`id="${spriteId('solid', 'calendar')}"`, 'u'));
    assert.match(sprite, new RegExp(`id="${spriteId('brands', 'github')}"`, 'u'));
    assert.match(sprite, new RegExp(`id="${spriteId('solid', 'rss')}"`, 'u'));
    assert.doesNotMatch(sprite, new RegExp(`id="${spriteId('brands', 'discord')}"`, 'u'));
    assert.match(sprite, /Font Awesome Free 7\.3\.1/u);
});

test('socialIconDescriptor keeps current social naming compatibility', () => {
    assert.deepEqual(socialIconDescriptor('twitter'), iconDescriptor('x-twitter', 'brands'));
    assert.deepEqual(socialIconDescriptor('rss'), iconDescriptor('rss', 'solid'));
    assert.equal(resolveDefinition(socialIconDescriptor('qq')).iconName, 'qq');
    assert.equal(resolveDefinition(socialIconDescriptor('stack-overflow')).iconName, 'stack-overflow');
});

test('renderIcon references the generated sprite and preserves compatibility classes', () => {
    assert.equal(
        renderIcon('/assets/wikiflow/icons.svg', iconDescriptor('calendar', 'solid')),
        '<svg class="wikiflow-icon fa-solid fa-calendar" aria-hidden="true" focusable="false"><use href="/assets/wikiflow/icons.svg#wikiflow-icon-solid-calendar"></use></svg>'
    );
});
