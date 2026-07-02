/**
 * Unit tests for Legado text.* preview request routing.
 * Run: node tests/text-preview-rule.test.js
 */

const assert = require('node:assert/strict');

function resolveTextPreviewRule(input) {
  const raw = (input || '').trim();
  if (!raw || raw.startsWith('<js>')) return '';

  const match = raw.match(/^text\.([^@]+?)(?:@[^@\s]+)?$/);
  if (!match || !match[1].trim()) return '';

  return raw;
}

function buildPreviewMessage(ruleValue, previewSelector) {
  const previewRule = resolveTextPreviewRule(ruleValue);
  if (previewRule) {
    return { action: 'previewRule', rule: previewRule };
  }
  if (previewSelector) {
    return { action: 'previewSelector', selector: previewSelector };
  }
  return null;
}

function normalizePreviewText(text) {
  return (text || '').trim().replace(/\s+/g, ' ');
}

function parseTextPreviewRule(rule) {
  const raw = (rule || '').trim();
  if (!raw || raw.includes('<js>')) return null;

  const match = raw.match(/^text\.([^@]+?)(?:@([^@\s]+))?$/);
  if (!match) return null;

  const text = normalizePreviewText(match[1]);
  if (!text) return null;

  return { text, attr: match[2] || '' };
}

assert.equal(
  resolveTextPreviewRule('text.下一页@href'),
  'text.下一页@href',
  'text rule with href suffix is recognized'
);

assert.equal(
  resolveTextPreviewRule('text.@href'),
  '',
  'empty text rule is ignored'
);

assert.deepEqual(
  buildPreviewMessage('text.下一页@href', 'text.下一页'),
  { action: 'previewRule', rule: 'text.下一页@href' },
  'text rule takes precedence over CSS-shaped preview selector'
);

assert.deepEqual(
  buildPreviewMessage('.index-container a@href', '.index-container a'),
  { action: 'previewSelector', selector: '.index-container a' },
  'CSS selector rule keeps existing previewSelector routing'
);

assert.deepEqual(
  parseTextPreviewRule('text.下一页@href'),
  { text: '下一页', attr: 'href' },
  'content preview parser extracts text and attr'
);

assert.deepEqual(
  parseTextPreviewRule('text. 下一 页 @href'),
  { text: '下一 页', attr: 'href' },
  'content preview parser normalizes whitespace inside text'
);

assert.equal(parseTextPreviewRule('div > a@href'), null, 'non-text rule is not parsed as text rule');

console.log('All text preview rule tests passed!');
