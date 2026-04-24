import test from 'node:test';
import assert from 'node:assert/strict';

import {
  contrastRatio,
  HEADER_CONTRAST_TARGETS,
  normalizeHeaderTheme,
} from '../packages/ui/src/headerThemeAccessibility';

test('dark header: surface text readable, header bg locked', () => {
  const rawTheme = {
    primary: '#223a3f',
    secondary: '#1d2735',
    accent: '#223a3f',
    surface: '#3a4a60',
    text: '#111111',
    mutedText: '#475569',
    border: '#2d3f55',
  };
  const adjusted = normalizeHeaderTheme(rawTheme);
  assert.equal(adjusted.secondary, rawTheme.secondary);
  assert.ok(contrastRatio(adjusted.surface, adjusted.secondary) >= HEADER_CONTRAST_TARGETS.text);
});

test('light header: surface text dark, header bg locked', () => {
  const rawTheme = {
    primary: '#f5e6c8',
    secondary: '#fafaf0',
    accent: '#eeddb5',
    surface: '#f0ece0',
    text: '#333333',
    mutedText: '#aaaaaa',
    border: '#e0d8c0',
  };
  const adjusted = normalizeHeaderTheme(rawTheme);
  assert.equal(adjusted.secondary, rawTheme.secondary);
  assert.ok(contrastRatio(adjusted.surface, adjusted.secondary) >= HEADER_CONTRAST_TARGETS.text);
  assert.ok(contrastRatio(adjusted.surface, adjusted.primary) >= HEADER_CONTRAST_TARGETS.text);
});
