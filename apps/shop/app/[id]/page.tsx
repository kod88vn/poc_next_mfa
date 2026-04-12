/**
 * Product Detail Page (PDP) — Server Component.
 *
 * Dynamic route: app/[id]/page.tsx
 * Resolves to /shop/[id] in the browser (because of basePath: '/shop').
 *
 * Uses generateMetadata for per-product SEO and generateStaticParams for
 * build-time static generation of all known product pages.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addToCart } from '../actions';

// ── Data ─────────────────────────────────────────────────────────────────────

const PRODUCTS = [
  {
    id: '1',
    name: 'Ergonomic Keyboard',
    price: 149.99,
    category: 'Peripherals',
    emoji: '⌨️',
    description:
      'Full-size mechanical keyboard with per-key RGB lighting, hot-swap sockets, and a programmable macro layer. Designed for marathon coding sessions.',
  },
  {
    id: '2',
    name: 'Ultrawide Monitor',
    price: 799.0,
    category: 'Displays',
    emoji: '🖥️',
    description:
      '34″ curved ultrawide QHD panel at 144 Hz with 1 ms response time and USB-C KVM. Ideal for multi-window developer workflows.',
  },
  {
    id: '3',
    name: 'Noise-Cancelling Headphones',
    price: 349.99,
    category: 'Audio',
    emoji: '🎧',
    description:
      'Adaptive ANC with 30-hour battery life, Bluetooth 5.3, and premium 40 mm drivers. Block out open-plan office chaos and ship more code.',
  },
  {
    id: '4',
    name: 'Mechanical Mouse',
    price: 89.99,
    category: 'Peripherals',
    emoji: '🖱️',
    description:
      'Lightweight ambidextrous mouse with a 26 K DPI optical sensor, 2.4 GHz wireless, and sub-1 ms click latency.',
  },
  {
    id: '5',
    name: 'USB-C Hub',
    price: 59.99,
    category: 'Accessories',
    emoji: '🔌',
    description:
      '7-in-1 USB-C hub with 100 W PD passthrough, 4K HDMI, SD/microSD card reader, and dual USB-A 3.2 ports.',
  },
  {
    id: '6',
    name: 'Webcam 4K',
    price: 199.99,
    category: 'Video',
    emoji: '📷',
    description:
      '4K 30 fps webcam with AI auto-focus, a built-in ring light with 3 colour temperatures, and background blur. Perfect for remote standups.',
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> };

// ── Metadata (Next.js 16 pattern) ─────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return { title: 'Product Not Found' };
  return {
    title: product.name,
    description: product.description,
  };
}

// ── Static params (build-time SSG for all known products) ─────────────────────

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Back link — basePath-relative href resolves to /shop */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
      >
        ← Back to catalogue
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Hero image area */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center py-24">
          <span className="text-9xl" role="img" aria-label={product.name}>
            {product.emoji}
          </span>
        </div>

        {/* Product details */}
        <div className="p-8">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {product.category}
          </span>

          <h1 className="text-3xl font-bold text-slate-900 mt-1 mb-4">
            {product.name}
          </h1>

          <p className="text-slate-600 mb-8 leading-relaxed text-lg">
            {product.description}
          </p>

          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-100">
            <span className="text-4xl font-extrabold text-slate-900">
              ${product.price.toFixed(2)}
            </span>

            {/* Server Action form — progressive enhancement */}
            <form action={addToCart} className="flex gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <button
                type="submit"
                className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
              >
                Add to Cart
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Zone / route debug panel */}
      <div className="mt-8 p-5 bg-slate-900 rounded-xl font-mono text-xs text-slate-400 space-y-1">
        <p className="text-slate-500 mb-2">// Route debug</p>
        <p>
          <span className="text-slate-500">zone</span> ={' '}
          <span className="text-emerald-400">&apos;shop&apos;</span>
        </p>
        <p>
          <span className="text-slate-500">basePath</span> ={' '}
          <span className="text-yellow-400">&apos;/shop&apos;</span>
        </p>
        <p>
          <span className="text-slate-500">productId</span> ={' '}
          <span className="text-blue-400">&apos;{product.id}&apos;</span>
        </p>
        <p>
          <span className="text-slate-500">direct URL</span> ={' '}
          <span className="text-slate-300">
            localhost:3001/shop/{product.id}
          </span>
        </p>
        <p>
          <span className="text-slate-500">via shell</span> ={' '}
          <span className="text-slate-300">
            localhost:3000/shop/{product.id}
          </span>
        </p>
      </div>
    </div>
  );
}
