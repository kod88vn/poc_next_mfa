# Duda Integration Architecture

This document describes the current Duda zone architecture in this repository.

## Scope

- Zone app: `apps/duda`
- Shared UI: `packages/ui`
- Host shell route: `/duda` via shell rewrite to the Duda zone
- All three zones (shell, shop, duda) share a single brand theme pipeline

## Configuration

### DUDA_ORIGIN

The vendor origin to proxy is set via a single root `.env` file at the monorepo root:

```
DUDA_ORIGIN=https://www.example.com/
```

Each zone's `next.config.js` loads this file via `require('../../load-root-env')` at the top. `load-root-env.js` is a dependency-free Node.js script that reads the root `.env` and sets `process.env` values without overwriting existing environment variables. This ensures all three zones always use the same origin without duplicating config.

`DUDA_ORIGIN` is also declared in `turbo.json` under `globalEnv` so Turborepo includes it in cache keys.

## Runtime Flow

1. Browser requests `/duda` (or any zone path) in the shell zone.
2. Shell rewrites to the appropriate zone (duda zone for `/duda`, shop zone for `/shop/*`).
3. **All three zone layouts** call `getDudaBrandTheme()` from `packages/ui` to obtain shared `--brand-*` CSS variables.
4. The duda zone additionally calls `getDudaLandingPayload()` which:
   a. Fetches vendor HTML from `DUDA_ORIGIN`.
   b. Extracts linked CSS URLs (`rel="stylesheet"` and `rel="preload" as="style"`).
   c. Fetches and concatenates those CSS files server-side.
   d. Returns sanitized body HTML, body attributes, and the raw CSS text.
5. The duda zone layout inlines the fetched vendor CSS in `<head>` and merges vendor body attributes/styles with the `--brand-*` variables.
6. Sanitized vendor HTML is rendered into the page via `dangerouslySetInnerHTML`.

## Key Components

### Shared brand theme pipeline

File: `packages/ui/src/dudaBrandTheme.ts`

Single source of truth for `--brand-*` CSS variables used by all three zones. Reads `process.env.DUDA_ORIGIN`, fetches the vendor page, and derives the theme in the following priority order:

1. **Semantic header selector** — background color of `header`, `.header`, `[role="banner"]`, `nav`, `.navbar`, `.site-header`, `.top-bar` selectors in the vendor CSS.
2. **Semantic footer selector** — background color of `footer`, `.footer`, `[role="contentinfo"]` selectors, used as the secondary color.
3. **Palette fallback** — scored CSS declarations bucketed by semantic role (background/text/accent/border).

After extraction, `normalizeHeaderTheme()` from `headerThemeAccessibility.ts` is applied to ensure ADA WCAG 2.1 contrast compliance before the theme is returned.

The function is wrapped in `React.cache()` so the fetch and derivation run once per request across all components.

### ADA contrast normalization

File: `packages/ui/src/headerThemeAccessibility.ts`

Exported function: `normalizeHeaderTheme(theme: DudaTheme): DudaTheme`

Automatically adjusts `--brand-primary`, `--brand-text`, `--brand-muted`, and `--brand-accent` tokens until the following WCAG thresholds are met:

| Pair | Minimum ratio |
|---|---|
| brand-text on brand-primary (header bg) | 4.5 : 1 (AA normal text) |
| nav text on brand-accent | 4.5 : 1 (AA normal text) |
| brand-muted on brand-primary | 3 : 1 (AA large text) |

If a token pair fails, the background is lightened or the foreground is darkened in small increments until the ratio passes or the maximum adjustment limit is reached.

Automated tests: `tests/header-theme-accessibility.test.ts` (run with `npm test` from monorepo root).

### HTML capture and sanitization

File: `apps/duda/lib/duda-landing.ts`

- `fetchText(url)`: server fetch with revalidation.
- `sanitizeLandingHtml(html)`:
  - Keeps content from `main` / `role="main"` onward.
  - Strips `script`, `noscript`, and `iframe` blocks.
  - Removes inline event handlers.
  - Rewrites all `href` and `src` values according to the **URL routing policy** (see below).
  - Prepends `cssVariables` and `criticalCss` style blocks when present.
  - Wraps content in `#dm > .dmOuter > .dmInner` so Duda CSS selectors match.

### URL routing policy

Implemented in `mapProxyHref(href)` inside `sanitizeLandingHtml`.

| Link type | Behavior |
|---|---|
| External domain (not `DUDA_ORIGIN` host) | Kept as-is; `target="_blank" rel="noopener noreferrer"` added |
| Vendor path mapped to a known zone | Rewritten to the zone path; same-tab navigation |
| Vendor path not mapped to any zone | Rewritten to `/not-found?from=<encodedPath>`; same-tab navigation |

Known zone mappings:

| Vendor path | Zone route |
|---|---|
| `/` | `/` (shell) |
| `/shop/*` | `/shop/*` (shop zone) |
| `/duda` | `/duda` (duda zone) |

### Not-found page

File: `apps/shell/app/not-found/page.tsx`

Shown when a proxied vendor link resolves to an unmapped path. Displays a 404 message, explains the context, shows the original vendor path (from the `from` query param), and provides navigation links to Home, Shop, and the Duda zone.

### CSS collection

File: `apps/duda/lib/duda-landing.ts`

- `extractStylesheetUrls(html)`: discovers stylesheet and preload-as-style links.
- `fetchLinkedCss(urls)`: fetches each CSS file and concatenates all text.

### Payload assembly

File: `apps/duda/lib/duda-landing.ts`

- `getDudaLandingPayload()`:
  - Orchestrates fetch, CSS extraction, and sanitization.
  - Returns `html`, `stylesheetUrls`, body metadata, and `cssText`.
  - Theme is obtained separately via `getDudaBrandTheme()` (not derived inside this function).
  - Emits a development console log labeled `[duda-theme-capture]` with the captured theme.

### Layout and rendering

Files: `apps/duda/app/layout.tsx`, `apps/duda/app/page.tsx`

- `layout.tsx`:
  - Calls both `getDudaBrandTheme()` and `getDudaLandingPayload()`.
  - Applies `--brand-*` CSS variables to the body via inline style.
  - Inlines fetched vendor CSS in `<head>`.
  - Merges vendor body `id`, `className`, and `style` attributes.
  - Renders shared `Header` from `packages/ui`.
- `page.tsx`:
  - Injects sanitized vendor HTML into `<article>` via `dangerouslySetInnerHTML`.

### Shared header component

File: `packages/ui/src/Header.tsx`

Renders the MFE navigation header using `--brand-*` CSS variables. All anchor tags carry explicit `fontWeight` and `lineHeight` to prevent vendor CSS from bleeding onto the header. The inner nav container has a fixed height (`67px`) for layout stability.

## Testing

```sh
npm test   # from monorepo root
```

Runs `tests/header-theme-accessibility.test.ts` with Jest. Tests assert that `normalizeHeaderTheme` produces token combinations that pass WCAG AA contrast thresholds for both high-contrast and low-contrast input themes.

## Current Constraints and Tradeoffs

- Vendor scripts are removed to avoid third-party behavior conflicts.
- Some vendor assets can still fail due to cross-origin browser blocking or remote host rules.
- This is server-side HTML/CSS projection, not a full vendor runtime mirror.
- `getDudaBrandTheme()` makes a live network request on first render per server request cycle. Output is cached per request via `React.cache()`.

## Main Files To Inspect

- `apps/duda/lib/duda-landing.ts`
- `apps/duda/app/layout.tsx`
- `apps/duda/app/page.tsx`
- `apps/shell/app/not-found/page.tsx`
- `packages/ui/src/dudaBrandTheme.ts`
- `packages/ui/src/headerThemeAccessibility.ts`
- `packages/ui/src/Header.tsx`
- `load-root-env.js`
- `.env`
