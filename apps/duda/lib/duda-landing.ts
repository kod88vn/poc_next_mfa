import { cache } from 'react';
import { getDudaBrandTheme, normalizeHeaderTheme } from '@repo/ui';

const DUDA_ORIGIN = (process.env.DUDA_ORIGIN ?? 'https://pocmfe.multiscreensite.com/').replace(/\/$/, '');
const DUDA_LANDING_URL = `${DUDA_ORIGIN}/`;

type DudaTheme = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  fontFamily: string;
};

type DudaLandingPayload = {
  html: string;
  theme: DudaTheme;
  stylesheetUrls: string[];
  bodyId: string;
  bodyClassName: string;
  bodyStyle: string;
  cssText: string;
};

const DEFAULT_THEME: DudaTheme = {
  primary: '#1d4ed8',
  secondary: '#334155',
  accent: '#2563eb',
  surface: '#ffffff',
  text: '#0f172a',
  mutedText: '#475569',
  border: '#cbd5e1',
  fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
};

const COLOR_TOKEN_RE =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\([^\)]+\)|hsla?\([^\)]+\)/g;
const DECLARATION_RE = /([a-zA-Z-]+)\s*:\s*([^;}{]+);?/g;

function isIgnoredColor(token: string) {
  const normalized = token.trim().toLowerCase();
  return (
    normalized === 'transparent' ||
    normalized === '#fff' ||
    normalized === '#ffffff' ||
    normalized === '#000' ||
    normalized === '#000000'
  );
}

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

    return null;
  }

  const rgbMatch = color.match(/^rgba?\(([^\)]+)\)$/);
  if (rgbMatch) {
    const channels = rgbMatch[1]
      .split(',')
      .map((part) => Number.parseFloat(part.trim()))
      .filter((value) => Number.isFinite(value));

    if (channels.length >= 3) {
      return {
        r: Math.max(0, Math.min(255, channels[0])),
        g: Math.max(0, Math.min(255, channels[1])),
        b: Math.max(0, Math.min(255, channels[2])),
      };
    }
  }

  return null;
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

  const r = transform(rgb.r);
  const g = transform(rgb.g);
  const b = transform(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
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
    if (mode === 'dark' && luminance > 0.3) continue;

    const score = frequency + (mode === 'light' ? luminance : 1 - luminance);
    if (score > bestScore) {
      bestScore = score;
      picked = token;
    }
  }

  return picked;
}

function contrastRatio(a: string, b: string) {
  const aLum = relativeLuminance(a);
  const bLum = relativeLuminance(b);
  if (aLum === null || bLum === null) return 0;

  const lighter = Math.max(aLum, bLum);
  const darker = Math.min(aLum, bLum);
  return (lighter + 0.05) / (darker + 0.05);
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
      if (isIgnoredColor(token)) continue;

      const add = (bucket: Map<string, number>, weight = 1) => {
        bucket.set(token, (bucket.get(token) ?? 0) + weight);
      };

      if (property.includes('background')) {
        add(bg, 3);
      }

      if (property === 'color' || property.endsWith('-color')) {
        if (property.includes('border')) {
          add(border, 2);
        } else if (property.includes('background')) {
          add(bg, 2);
        } else {
          add(text, 2);
        }
      }

      if (
        property.includes('accent') ||
        property.includes('primary') ||
        property.includes('button') ||
        property.includes('link')
      ) {
        add(accent, 3);
      }

      if (property.includes('border') || property.includes('outline')) {
        add(border, 2);
      }

      if (property === 'fill' || property === 'stroke') {
        add(accent, 2);
      }

      add(accent, 1);
    }
  }

  return { bg, text, accent, border };
}

function pickMostCommon(
  bucket: Map<string, number>,
  fallback: string,
  disallow: Set<string> = new Set(),
) {
  let picked = fallback;
  let best = -1;

  for (const [token, score] of bucket.entries()) {
    if (disallow.has(token)) continue;
    if (score > best) {
      best = score;
      picked = token;
    }
  }

  return picked;
}

function pickFontFamily(cssText: string): string {
  const genericNames = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);
  // Exclude icon / symbol font families that should never be used as body text.
  const iconFontPattern = /font.?awesome|material.?icon|glyphicon|ionicon|dashicon|symbol|icomoon/i;
  const counts = new Map<string, number>();

  for (const decl of (cssText.match(/font-family\s*:\s*[^;}{]+/gi) ?? [])) {
    const value = decl.split(':').slice(1).join(':').trim();
    for (const part of value.split(',').map((p) => p.trim().replace(/^['\"]|['\"]$/g, '')).filter(Boolean)) {
      if (!genericNames.has(part.toLowerCase()) && !iconFontPattern.test(part)) {
        counts.set(part, (counts.get(part) ?? 0) + 1);
      }
    }
  }

  if (counts.size === 0) return DEFAULT_THEME.fontFamily;
  const [name] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return `${name}, system-ui, -apple-system, Segoe UI, sans-serif`;
}

function deriveTheme(html: string, cssText: string): DudaTheme {
  const inlineStyles = (html.match(/style\s*=\s*"([^"]*)"/gi) ?? []).join(' ');
  const combined = `${cssText}\n${inlineStyles}`;
  const buckets = scorePalette(combined);

  const accentCandidates = Array.from(buckets.accent.entries())
    .filter(([token]) => !isNearNeutral(token))
    .sort((a, b) => b[1] - a[1]);

  const primary = accentCandidates[0]?.[0] ?? DEFAULT_THEME.primary;
  const secondary = accentCandidates[1]?.[0] ?? DEFAULT_THEME.secondary;

  const surface = pickByLuminance(buckets.bg, DEFAULT_THEME.surface, 'light');

  let text = pickByLuminance(buckets.text, DEFAULT_THEME.text, 'dark');
  if (contrastRatio(surface, text) < 3) {
    const candidate = contrastRatio(surface, '#111827') >= 4.5 ? '#111827' : '#f8fafc';
    text = candidate;
  }

  const border = pickMostCommon(buckets.border, DEFAULT_THEME.border);

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
  });
}

function absolutizeUrl(pathOrUrl: string) {
  const raw = pathOrUrl.trim();
  if (
    raw.startsWith('javascript:') ||
    raw.startsWith('data:')
  ) {
    return '#';
  }

  if (
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:') ||
    raw.startsWith('#')
  ) {
    return raw;
  }

  try {
    return new URL(raw, DUDA_ORIGIN).toString();
  } catch {
    return raw;
  }
}

function isKnownZonePath(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname === '/duda'
  );
}

function mapProxyHref(rawHref: string) {
  const value = htmlDecodeAttr(rawHref.trim());

  if (!value) {
    return { href: value, openInNewTab: false };
  }

  if (
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:')
  ) {
    return { href: value, openInNewTab: false };
  }

  try {
    const url = new URL(value, DUDA_ORIGIN);
    const isSameOrigin = url.origin === new URL(DUDA_ORIGIN).origin;

    if (!isSameOrigin) {
      return { href: url.toString(), openInNewTab: true };
    }

    const localPath = `${url.pathname}${url.search}${url.hash}`;
    if (isKnownZonePath(url.pathname)) {
      return { href: localPath, openInNewTab: false };
    }

    return {
      href: `/not-found?from=${encodeURIComponent(localPath)}`,
      openInNewTab: false,
    };
  } catch {
    return { href: value, openInNewTab: false };
  }
}

function sanitizeLandingHtml(html: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const source = bodyMatch ? bodyMatch[1] : html;

  // Extract just <main> + <footer> to skip vendor header/nav regardless of
  // Extract content starting from the main content area, skipping vendor
  // header/nav. Handles both <main> tags and Duda's role="main" pattern.
  const mainTagIdx = source.search(/<main[\s>]/i);
  const roleMainIdx = source.search(/<[a-z][a-z0-9]*[^>]*\brole="main"[^>]*>/i);
  const mainStart = mainTagIdx >= 0 ? mainTagIdx
    : roleMainIdx >= 0 ? roleMainIdx
    : -1;
  const coreSource = mainStart > 0 ? source.substring(mainStart) : source;

    // Extract Duda head CSS variable block and critical CSS for background colors.
    const cssVarBlock = html.match(/<style[^>]*id="cssVariables"[^>]*>[\s\S]*?<\/style>/i)?.[0] ?? '';
    const criticalBlock = html.match(/<style[^>]*id="criticalCss"[^>]*>[\s\S]*?<\/style>/i)?.[0] ?? '';

    let sanitized = coreSource;

    // Remove active/embedded content only; keep structural containers so
    // visible sections are not dropped.
    sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');
    sanitized = sanitized.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

    sanitized = sanitized.replace(/\s+on[a-z]+="[^"]*"/gi, '');

    sanitized = sanitized.replace(
      /src="([^"]+)"/gi,
      (_full, value: string) => `src="${absolutizeUrl(value)}"`,
    );

    // Route links according to app-zone rules: known zone paths stay in-app;
    // unknown vendor-internal paths go to /not-found; external origins open new tab.
    sanitized = sanitized.replace(
      /<a([^>]*?)href="([^"]+)"([^>]*)>/gi,
      (_full, beforeHref: string, href: string, afterHref: string) => {
        const mapped = mapProxyHref(href);
        const existingAttrs = `${beforeHref}${afterHref}`
          .replace(/\s+target="[^"]*"/gi, '')
          .replace(/\s+rel="[^"]*"/gi, '');

        const targetAttrs = mapped.openInNewTab
          ? ' target="_blank" rel="noopener noreferrer"'
          : '';

        return `<a${existingAttrs} href="${mapped.href}"${targetAttrs}>`;
      },
    );

    // Restore the minimal Duda wrapper hierarchy expected by theme CSS.
    return `${cssVarBlock}${criticalBlock}<div id="dm"><div class="dmOuter"><div class="dmInner">${sanitized.trim()}</div></div></div>`;
}

function extractBodyMeta(html: string) {
  const bodyOpenTag = html.match(/<body([^>]*)>/i)?.[1] ?? '';

  const bodyId = bodyOpenTag.match(/\sid="([^"]*)"/i)?.[1] ?? '';
  const bodyClassName = bodyOpenTag.match(/\sclass="([^"]*)"/i)?.[1] ?? '';
  const bodyStyle = bodyOpenTag.match(/\sstyle="([^"]*)"/i)?.[1] ?? '';

  return {
    bodyId,
    bodyClassName,
    bodyStyle,
  };
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

function extractStylesheetUrls(html: string) {
  // Duda uses rel="preload" as="style" instead of rel="stylesheet" for its CSS
  const stylesheetMatches = [
    ...(html.match(/<link[^>]+rel="stylesheet"[^>]*>/gi) ?? []),
    ...(html.match(/<link[^>]+rel="preload"[^>]+as="style"[^>]*>/gi) ?? []),
    ...(html.match(/<link[^>]+as="style"[^>]+rel="preload"[^>]*>/gi) ?? []),
  ];

  return stylesheetMatches
    .map((tag) => {
      const hrefMatch = tag.match(/href="([^"]+)"/i);
        return hrefMatch ? htmlDecodeAttr(hrefMatch[1]) : undefined;
    })
    .filter((value): value is string => Boolean(value))
    .map((url) => absolutizeUrl(url));
}

  function htmlDecodeAttr(encoded: string) {
    return encoded
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }

async function fetchLinkedCss(stylesheetUrls: string[]) {
  const cssUrls = Array.from(new Set(stylesheetUrls));

  const cssChunks = await Promise.all(
    cssUrls.map(async (url) => {
      try {
        return await fetchText(url);
      } catch {
        return '';
      }
    }),
  );

  return cssChunks.join('\n');
}

export const getDudaLandingPayload = cache(async (): Promise<DudaLandingPayload> => {
  try {
    const landingHtml = await fetchText(DUDA_LANDING_URL);
    const stylesheetUrls = extractStylesheetUrls(landingHtml);
    const cssText = await fetchLinkedCss(stylesheetUrls);
    const bodyMeta = extractBodyMeta(landingHtml);
    const theme = await getDudaBrandTheme();

    if (process.env.NODE_ENV !== 'production') {
      console.log('[duda-theme-capture]', {
        origin: DUDA_ORIGIN,
        landingUrl: DUDA_LANDING_URL,
        stylesheetCount: stylesheetUrls.length,
        cssBytes: cssText.length,
        theme,
      });
    }

    return {
      html: sanitizeLandingHtml(landingHtml),
      theme,
      stylesheetUrls,
      ...bodyMeta,
      cssText, // Added cssText to the return object
    };
  } catch {
    return {
      html: '<p>Unable to load Duda landing content right now.</p>',
      theme: DEFAULT_THEME,
      stylesheetUrls: [],
      cssText: '',
      bodyId: '',
      bodyClassName: '',
      bodyStyle: '',
    };
  }
});
