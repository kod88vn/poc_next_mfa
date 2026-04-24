type ThemePalette = {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
};

export const HEADER_CONTRAST_TARGETS = {
  text: 4.5,
  nonText: 3,
} as const;

type Rgb = { r: number; g: number; b: number };

function clampChannel(channel: number) {
  return Math.max(0, Math.min(255, Math.round(channel)));
}

function parseHexChannel(value: string) {
  return Number.parseInt(value, 16);
}

function tokenToRgb(token: string): Rgb | null {
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
  if (!rgbMatch) return null;

  const channels = rgbMatch[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((value) => Number.isFinite(value));

  if (channels.length < 3) return null;

  return {
    r: clampChannel(channels[0]),
    g: clampChannel(channels[1]),
    b: clampChannel(channels[2]),
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixColors(source: string, target: string, amount: number) {
  const sourceRgb = tokenToRgb(source);
  const targetRgb = tokenToRgb(target);
  if (!sourceRgb || !targetRgb) return source;

  return rgbToHex({
    r: sourceRgb.r + (targetRgb.r - sourceRgb.r) * amount,
    g: sourceRgb.g + (targetRgb.g - sourceRgb.g) * amount,
    b: sourceRgb.b + (targetRgb.b - sourceRgb.b) * amount,
  });
}

function colorDistance(a: string, b: string) {
  const aRgb = tokenToRgb(a);
  const bRgb = tokenToRgb(b);
  if (!aRgb || !bRgb) return Number.POSITIVE_INFINITY;

  return Math.sqrt(
    ((aRgb.r - bRgb.r) ** 2) +
      ((aRgb.g - bRgb.g) ** 2) +
      ((aRgb.b - bRgb.b) ** 2),
  );
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

export function contrastRatio(a: string, b: string) {
  const aLum = relativeLuminance(a);
  const bLum = relativeLuminance(b);
  if (aLum === null || bLum === null) return 0;

  const lighter = Math.max(aLum, bLum);
  const darker = Math.min(aLum, bLum);
  return (lighter + 0.05) / (darker + 0.05);
}

function dedupeColors(colors: string[]) {
  return Array.from(new Set(colors.map((color) => color.trim()).filter(Boolean)));
}

export function ensureColorContrast(
  color: string,
  against: string,
  minimumContrast: number,
  candidateAnchors: string[] = [],
) {
  if (contrastRatio(color, against) >= minimumContrast) {
    return color;
  }

  const anchors = dedupeColors([
    ...candidateAnchors,
    '#ffffff',
    '#111827',
    '#000000',
  ]);

  let bestColor = color;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const anchor of anchors) {
    for (let step = 0.05; step <= 1; step += 0.05) {
      const candidate = mixColors(color, anchor, step);
      if (contrastRatio(candidate, against) < minimumContrast) continue;

      const distance = colorDistance(candidate, color);
      if (distance < bestDistance) {
        bestColor = candidate;
        bestDistance = distance;
      }
    }
  }

  if (bestDistance !== Number.POSITIVE_INFINITY) {
    return bestColor;
  }

  return anchors
    .map((candidate) => ({
      candidate,
      contrast: contrastRatio(candidate, against),
      distance: colorDistance(candidate, color),
    }))
    .sort((a, b) => b.contrast - a.contrast || a.distance - b.distance)[0]?.candidate ?? color;
}

export function normalizeHeaderTheme<T extends ThemePalette>(theme: T): T {
  const secondary = ensureColorContrast(
    theme.secondary,
    theme.surface,
    HEADER_CONTRAST_TARGETS.text,
    [theme.text, theme.primary, theme.accent],
  );
  const accent = ensureColorContrast(
    theme.accent,
    theme.surface,
    HEADER_CONTRAST_TARGETS.text,
    [theme.primary, secondary, theme.text],
  );
  const primary = ensureColorContrast(
    theme.primary,
    theme.surface,
    HEADER_CONTRAST_TARGETS.text,
    [accent, secondary, theme.text],
  );
  const mutedText = ensureColorContrast(
    theme.mutedText,
    secondary,
    HEADER_CONTRAST_TARGETS.text,
    [theme.surface, theme.text],
  );
  const border = ensureColorContrast(
    theme.border,
    secondary,
    HEADER_CONTRAST_TARGETS.nonText,
    [mutedText, theme.surface, theme.text],
  );

  return {
    ...theme,
    primary,
    secondary,
    accent,
    mutedText,
    border,
  };
}