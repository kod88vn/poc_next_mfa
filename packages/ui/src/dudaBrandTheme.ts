import { cache } from 'react';
import { normalizeHeaderTheme } from './headerThemeAccessibility';

const DUDA_ORIGIN = (process.env.DUDA_ORIGIN ?? 'https://www.chocochalet.ch').replace(/\/$/, '');
const DUDA_LANDING_URL = `${DUDA_ORIGIN}/`;

type DudaBrandTheme = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  fontFamily: string;
  fontStylesheetUrls: string[];
};

const DEFAULT_THEME: DudaBrandTheme = {
  primary: '#223a3f',
  secondary: '#1d2735',
  accent: '#223a3f',
  surface: '#faf9f9',
  text: '#111111',
  mutedText: '#475569',
  border: '#d5dbe3',
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
  fontStylesheetUrls: [],
};

const COLOR_TOKEN_RE =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\([^\)]+\)|hsla?\([^\)]+\)/g;
const DECLARATION_RE = /([a-zA-Z-]+)\s*:\s*([^;}{]+);?/g;
const CSS_RULE_RE = /([^{}]+)\{([^{}]*)\}/g;

const HEADER_SELECTOR_HINTS = [
  'header',
  '.header',
  '#header',
  '[role="banner"]',
  '.site-header',
  '.main-header',
];

const FOOTER_SELECTOR_HINTS = [
  'footer',
  '.footer',
  '#footer',
  '[role="contentinfo"]',
  '.site-footer',
  '.main-footer',
];

function parseHexChannel(value: string) {
  return Number.parseInt(value, 16);
}

function tokenToRgb(token: string): { r: number; g: number; b: number } | null {
  const color = token.trim().toLowerCase();

  if (color.startsWith('#')) {
    if (color.length === 4) {
      return {
        r: parseHexChannel(color[1] + color[1]),
        g: parseHexChannel(color[2] + color[2]),
        b: parseHexChannel(color[3] + color[3]),
      };
    }

    if (color.length === 7) {
      return {
        r: parseHexChannel(color.slice(1, 3)),
        g: parseHexChannel(color.slice(3, 5)),
        b: parseHexChannel(color.slice(5, 7)),
      };
    }
  }

  const rgbMatch = color.match(/^rgba?\(([^\)]+)\)$/);
  if (!rgbMatch) return null;

  const channels = rgbMatch[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((value) => Number.isFinite(value));

  if (channels.length < 3) return null;

  return {
    r: Math.max(0, Math.min(255, channels[0])),
    g: Math.max(0, Math.min(255, channels[1])),
    b: Math.max(0, Math.min(255, channels[2])),
  };
}

function relativeLuminance(token: string) {
  const rgb = tokenToRgb(token);
  if (!rgb) return null;

  const transform = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * transform(rgb.r) +
    0.7152 * transform(rgb.g) +
    0.0722 * transform(rgb.b)
  );
}

function contrastRatio(a: string, b: string) {
  const aLum = relativeLuminance(a);
  const bLum = relativeLuminance(b);
  if (aLum === null || bLum === null) return 0;

  const lighter = Math.max(aLum, bLum);
  const darker = Math.min(aLum, bLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function isNearNeutral(token: string) {
  const rgb = tokenToRgb(token);
  if (!rgb) return false;

  const delta = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  return delta < 18;
}

function pickByLuminance(
  bucket: Map<string, number>,
  fallback: string,
  mode: 'light' | 'dark',
) {
  let picked = fallback;
  let bestScore = -1;

  for (const [token, frequency] of bucket.entries()) {
    const luminance = relativeLuminance(token);
    if (luminance === null) continue;

    if (mode === 'light' && luminance < 0.72) continue;
    if (mode === 'dark' && luminance > 0.35) continue;

    const score = frequency + (mode === 'light' ? luminance : 1 - luminance);
    if (score > bestScore) {
      bestScore = score;
      picked = token;
    }
  }

  return picked;
}

function scorePalette(cssText: string) {
  const bg = new Map<string, number>();
  const text = new Map<string, number>();
  const accent = new Map<string, number>();
  const border = new Map<string, number>();

  let match: RegExpExecArray | null;
  while ((match = DECLARATION_RE.exec(cssText)) !== null) {
    const property = match[1].toLowerCase();
    const value = match[2];
    const colorTokens = value.match(COLOR_TOKEN_RE) ?? [];

    for (const token of colorTokens) {
      const add = (bucket: Map<string, number>, weight = 1) => {
        bucket.set(token, (bucket.get(token) ?? 0) + weight);
      };

      if (property.includes('background')) add(bg, 3);
      if (property.includes('border') || property.includes('outline')) add(border, 2);

      if (property === 'color' || property.endsWith('-color')) {
        if (property.includes('border')) add(border, 2);
        else if (property.includes('background')) add(bg, 2);
        else add(text, 2);
      }

      if (
        property.includes('accent') ||
        property.includes('primary') ||
        property.includes('button') ||
        property.includes('link')
      ) {
        add(accent, 3);
      }

      add(accent, 1);
    }
  }

  return { bg, text, accent, border };
}

function isTransparentColor(token: string) {
  const value = token.trim().toLowerCase();
  return value === 'transparent' || value === 'rgba(0,0,0,0)' || value === 'rgba(0, 0, 0, 0)';
}

function pickSemanticBackgroundColor(cssText: string, selectorHints: string[]) {
  const scoreByColor = new Map<string, number>();

  let ruleMatch: RegExpExecArray | null;
  while ((ruleMatch = CSS_RULE_RE.exec(cssText)) !== null) {
    const selectorText = ruleMatch[1].toLowerCase();
    const declarationText = ruleMatch[2];

    const hintHits = selectorHints.filter((hint) => selectorText.includes(hint)).length;
    if (hintHits === 0) continue;

    let declarationMatch: RegExpExecArray | null;
    DECLARATION_RE.lastIndex = 0;
    while ((declarationMatch = DECLARATION_RE.exec(declarationText)) !== null) {
      const property = declarationMatch[1].toLowerCase();
      const value = declarationMatch[2];
      if (!(property === 'background' || property === 'background-color')) continue;

      const colorTokens = value.match(COLOR_TOKEN_RE) ?? [];
      if (colorTokens.length === 0) continue;

      const pick = colorTokens.find((token) => !isTransparentColor(token));
      if (!pick) continue;

      const weight = hintHits * (property === 'background-color' ? 3 : 2);
      scoreByColor.set(pick, (scoreByColor.get(pick) ?? 0) + weight);
    }
  }

  return Array.from(scoreByColor.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function absolutizeUrl(pathOrUrl: string) {
  const raw = pathOrUrl.trim();
  try {
    return new URL(raw, DUDA_ORIGIN).toString();
  } catch {
    return raw;
  }
}

function extractStylesheetUrls(html: string) {
  // Match both rel="stylesheet" and rel="preload" as="style" (used by Duda/BGS sites)
  const stylesheetMatches = [
    ...(html.match(/<link[^>]+rel="stylesheet"[^>]*>/gi) ?? []),
    ...(html.match(/<link[^>]+rel="preload"[^>]+as="style"[^>]*>/gi) ?? []),
  ];

  return Array.from(
    new Set(
      stylesheetMatches
        .map((tag) => tag.match(/href="([^"]+)"/i)?.[1])
        .filter((value): value is string => Boolean(value))
        .map((url) => absolutizeUrl(url)),
    ),
  );
}

function extractFontStylesheetUrls(stylesheetUrls: string[]) {
  return stylesheetUrls.filter(
    (url) =>
      /fonts\/css2|font/i.test(url) ||
      /family=/.test(url),
  );
}

function pickFontFamily(cssText: string) {
  const fontFamilyDecls = cssText.match(/font-family\s*:\s*[^;}{]+/gi) ?? [];
  const genericNames = new Set([
    'serif',
    'sans-serif',
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
  ]);

  const counts = new Map<string, number>();

  for (const decl of fontFamilyDecls) {
    const value = decl.split(':').slice(1).join(':').trim();
    const candidates = value
      .split(',')
      .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);

    for (const candidate of candidates) {
      if (genericNames.has(candidate.toLowerCase())) continue;
      if (/font.?awesome|material.?icon|glyphicon|ionicon|dashicon|symbol|icomoon/i.test(candidate)) continue;
      counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return DEFAULT_THEME.fontFamily;
  }

  const [fontName] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return `${fontName}, system-ui, -apple-system, Segoe UI, sans-serif`;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchLinkedCss(stylesheetUrls: string[]) {
  const cssChunks = await Promise.all(
    stylesheetUrls.map(async (url) => {
      try {
        return await fetchText(url);
      } catch {
        return '';
      }
    }),
  );

  return cssChunks.join('\n');
}

export const getDudaBrandTheme = cache(async (): Promise<DudaBrandTheme> => {
  try {
    const landingHtml = await fetchText(DUDA_LANDING_URL);
    const stylesheetUrls = extractStylesheetUrls(landingHtml);
    const cssText = await fetchLinkedCss(stylesheetUrls);

    const buckets = scorePalette(cssText);
    const accentCandidates = Array.from(buckets.accent.entries())
      .filter(([token]) => !isNearNeutral(token))
      .sort((a, b) => b[1] - a[1]);

    const primary = accentCandidates[0]?.[0] ?? DEFAULT_THEME.primary;
    const headerBackground = pickSemanticBackgroundColor(cssText, HEADER_SELECTOR_HINTS);
    const footerBackground = pickSemanticBackgroundColor(cssText, FOOTER_SELECTOR_HINTS);
    const secondary = headerBackground ?? footerBackground ?? accentCandidates[1]?.[0] ?? DEFAULT_THEME.secondary;
    const surface = pickByLuminance(buckets.bg, DEFAULT_THEME.surface, 'light');
    let text = pickByLuminance(buckets.text, DEFAULT_THEME.text, 'dark');

    if (contrastRatio(surface, text) < 3.5) {
      text = contrastRatio(surface, '#111827') >= 4.5 ? '#111827' : '#f8fafc';
    }

    const border = Array.from(buckets.border.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? DEFAULT_THEME.border;
    const mutedText = contrastRatio(surface, '#475569') >= 3 ? '#475569' : text;

    return normalizeHeaderTheme({
      primary,
      secondary,
      accent: primary,
      surface,
      text,
      mutedText,
      border,
      fontFamily: pickFontFamily(cssText),
      fontStylesheetUrls: extractFontStylesheetUrls(stylesheetUrls),
    });
  } catch {
    return DEFAULT_THEME;
  }
});
