# poc_next_mfa — Next.js 16 Multi-Zone Microfrontend POC

A production-style Microfrontend architecture using **Next.js 16 Multi-Zones** and **Turborepo**, demonstrating independent deployability, a shared design system, and cross-zone state.

---

## Architecture

```
Browser → localhost:3000/          ← Shell zone  (homepage + global navigation)
Browser → localhost:3000/shop/*    ← Shell rewrites → Shop zone (localhost:3001/shop/*)

Cookie: mfe_cart_count             ← Shared by both zones (port-agnostic on localhost)
```

| Workspace | Port | Role |
|---|---|---|
| `apps/shell` | 3000 | Host — homepage, global nav, rewrite proxy |
| `apps/shop` | 3001 | Remote — product listing & PDP (`basePath: /shop`) |
| `packages/ui` | — | Shared design system — `Header`, `Button` (Tailwind CSS) |

---

## Quickstart

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Install & run all zones simultaneously

```bash
npm install
npm run dev        # Turborepo starts shell (:3000) + shop (:3001) in parallel
```

Open **http://localhost:3000** — the shell homepage.  
Navigate to **http://localhost:3000/shop** — transparently served by the shop zone.

### Run a single zone

```bash
# Shell only
cd apps/shell && npm run dev

# Shop only (direct, no shell proxy)
cd apps/shop && npm run dev
```

---

## Key files

| File | Purpose |
|---|---|
| `turbo.json` | Pipeline tasks with Turborepo caching |
| `apps/shell/next.config.js` | **Rewrite rules** — the multi-zone "glue" |
| `apps/shop/next.config.js` | `basePath: '/shop'` — aligns shop routes with rewrites |
| `packages/ui/src/Header.tsx` | Shared header showing the live cart count |
| `packages/ui/src/Button.tsx` | Shared button (`"use client"`) |
| `apps/shop/app/actions.ts` | Server Action — increments `mfe_cart_count` cookie |
| `apps/shop/app/[id]/page.tsx` | PDP with `generateMetadata` + `generateStaticParams` |

---

## How the MFE "string" works

1. The **shell** (`apps/shell/next.config.js`) rewrites `/shop` and `/shop/:path*` to `http://localhost:3001/shop/*`.
2. The **shop** sets `basePath: '/shop'` so its internal routes (`/`, `/[id]`) resolve to `/shop` and `/shop/[id]` in the browser.
3. Cross-zone links use plain `<a>` tags (not `<Link>`) to force a full navigation and load the correct zone's JS bundle.
4. The shared `mfe_cart_count` cookie is readable by both zones because browser cookies are scoped to the domain (`localhost`), not the port.

---

## Turborepo caching

```bash
npm run build      # First run: compiles everything
npm run build      # Second run: 100% cache hits, sub-second
npm run lint       # Cached per workspace; reruns only when source changes
```

The `turbo.json` pipeline ensures `packages/ui` is always built before the apps, and apps build in parallel after that.
