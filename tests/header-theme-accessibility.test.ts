import test from 'node:test';
import assert from 'node:assert/strict';

import {
  contrastRatio,
  HEADER_CONTRAST_TARGETS,
  normalizeHeaderTheme,
} from '../packages/ui/src/headerThemeAccessibility';

test('normalizeHeaderTheme auto-fixes low-contrast header tokens', () => {
  const rawTheme = {
    primary: '#223a3f',
    secondary: '#1d2735',
    accent: '#223a3f',
    surface: '#ffffff',
    text: '#111111',
    mutedText: '#475569',
    border: '#000000',
  };

  assert.ok(
    contrastRatio(rawTheme.secondary, rawTheme.mutedText) < HEADER_CONTRAST_TARGETS.text,
  );

  const adjusted = normalizeHeaderTheme(rawTheme);

  assert.ok(
    contrastRatio(adjusted.secondary, adjusted.surface) >= HEADER_CONTRAST_TARGETS.text,
  );
  assert.ok(
    contrastRatio(adjusted.accent, adjusted.surface) >= HEADER_CONTRAST_TARGETS.text,
  );
  assert.ok(
    contrastRatio(adjusted.primary, adjusted.surface) >= HEADER_CONTRAST_TARGETS.text,
  );
  assert.ok(
    contrastRatio(adjusted.secondary, adjusted.mutedText) >= HEADER_CONTRAST_TARGETS.text,
  );
  assert.ok(
    contrastRatio(adjusted.secondary, adjusted.border) >= HEADER_CONTRAST_TARGETS.nonText,
  );
});

test('normalizeHeaderTheme preserves already accessible palettes', () => {
  const rawTheme = {
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#334155',
    surface: '#ffffff',
    text: '#0f172a',
    mutedText: '#e2e8f0',
    border: '#94a3b8',
  };

  assert.deepEqual(normalizeHeaderTheme(rawTheme), rawTheme);
});