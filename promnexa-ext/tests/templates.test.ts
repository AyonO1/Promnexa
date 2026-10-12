import test from 'node:test';
import assert from 'node:assert/strict';
import { PROMPT_TEMPLATES, searchTemplates, getTemplatesByCategory, getSubcategories } from '../lib/templates.ts';

test('Templates - Library has at least 200 curated templates', () => {
  assert.ok(PROMPT_TEMPLATES.length >= 200, `Expected >= 200 templates, got ${PROMPT_TEMPLATES.length}`);
});

test('Templates - Search by query matches title, description, or tags', () => {
  const results = searchTemplates('react');
  assert.ok(results.length > 0);
  assert.ok(results.some(t => t.tags.includes('react') || t.title.toLowerCase().includes('react')));
});

test('Templates - Search filtered by category', () => {
  const results = searchTemplates('', 'coding');
  assert.ok(results.length > 0);
  assert.ok(results.every(t => t.category === 'coding'));
});

test('Templates - Education category contains academic templates', () => {
  const edu = getTemplatesByCategory('education');
  assert.ok(edu.length > 0);
  assert.ok(edu.some(t => t.title.toLowerCase().includes('explain') || t.title.toLowerCase().includes('exam')));
});

test('Templates - Subcategories list extraction', () => {
  const subcats = getSubcategories('coding');
  assert.ok(Array.isArray(subcats));
  assert.ok(subcats.length > 0);
});

test('Templates - Empty search query returns all', () => {
  const all = searchTemplates('');
  assert.equal(all.length, PROMPT_TEMPLATES.length);
});
