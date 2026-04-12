/**
 * Shell Homepage — Server Component.
 *
 * Marketing / landing page for the MFE Store. Cross-zone links (<a> to /shop)
 * trigger a full navigation so the browser loads the shop zone's JS bundle.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Welcome to MFE Store — built with Next.js 16 Multi-Zones and Turborepo.',
};

const features = [
  {
    title: 'Multi-Zone Architecture',
    description:
      'Shell (port 3000) and Shop (port 3001) are fully independent Next.js apps. The shell rewrites /shop/* to the shop zone — no iframes, no extra runtime.',
    icon: '🏗️',
    badge: 'next.config.js rewrites',
  },
  {
    title: 'Turborepo Caching',
    description:
      'Builds and lints are content-hashed and cached. Only changed workspaces are rebuilt — sub-second pipeline runs on repeat invocations.',
    icon: '⚡',
    badge: 'turbo.json',
  },
  {
    title: 'Shared Design System',
    description:
      '@repo/ui exports a Header and Button consumed by both zones. One source of truth for styling with Tailwind CSS, transpiled at build time.',
    icon: '🎨',
    badge: 'packages/ui',
  },
  {
    title: 'Shared Cart State',
    description:
      'Cart count lives in a first-party cookie (mfe_cart_count). Cookies on localhost are port-agnostic, so both zones read/write the same value.',
    icon: '🍪',
    badge: 'Server Actions + cookies()',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="text-center mb-24">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
          Next.js 16 · App Router · Multi-Zones · Turborepo
        </span>

        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
          Microfrontend POC
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Two independent Next.js applications seamlessly stitched together via
          URL rewrites. Independent deployments, shared design system, and a
          cross-zone cart counter — all without iframes.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Cross-zone: must use <a>, not Next.js <Link> */}
          <a
            href="/shop"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Browse the Shop →
          </a>
          <a
            href="https://turbo.build/repo/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
          >
            Turborepo Docs ↗
          </a>
        </div>
      </section>

      {/* ── Feature grid ──────────────────────────────────────────────────── */}
      <section className="mb-24">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">
          What this POC demonstrates
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <span className="text-xs font-mono text-slate-400 mb-2">
                {f.badge}
              </span>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Architecture diagram ──────────────────────────────────────────── */}
      <section className="bg-slate-900 rounded-2xl p-8 text-slate-300 font-mono text-sm overflow-x-auto">
        <p className="text-slate-500 text-xs mb-4 font-sans uppercase tracking-widest">
          Request flow
        </p>
        <pre className="leading-7">{`Browser ──► localhost:3000/          ◄── Shell zone  (homepage, global nav)
Browser ──► localhost:3000/shop/*    ──► rewrite ──► localhost:3001/shop/*  ◄── Shop zone

Cookie: mfe_cart_count               Shared by both zones (localhost, port-agnostic)

Turborepo pipeline
  build  ──► ^build (packages/ui first, then apps in parallel)
  dev    ──► all apps concurrently, no cache
  lint   ──► cached; reruns only when source files change`}</pre>
      </section>
    </div>
  );
}
