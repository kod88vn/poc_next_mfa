/**
 * Product Listing — Server Component.
 *
 * Root page of the shop zone. With basePath="/shop" configured, this renders
 * at /shop (both directly on :3001 and via the shell's rewrite on :3000).
 *
 * "Add to Cart" uses a progressive-enhancement pattern: a plain HTML form
 * posts to a Server Action, so it works even without JavaScript enabled.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { addToCart } from './actions';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse our curated product catalogue.',
};

// In a real app this data comes from an API / CMS.
const PRODUCTS = [
  {
    id: '1',
    name: 'Ergonomic Keyboard',
    price: 149.99,
    category: 'Peripherals',
    emoji: '⌨️',
  },
  {
    id: '2',
    name: 'Ultrawide Monitor',
    price: 799.0,
    category: 'Displays',
    emoji: '🖥️',
  },
  {
    id: '3',
    name: 'Noise-Cancelling Headphones',
    price: 349.99,
    category: 'Audio',
    emoji: '🎧',
  },
  {
    id: '4',
    name: 'Mechanical Mouse',
    price: 89.99,
    category: 'Peripherals',
    emoji: '🖱️',
  },
  {
    id: '5',
    name: 'USB-C Hub',
    price: 59.99,
    category: 'Accessories',
    emoji: '🔌',
  },
  {
    id: '6',
    name: 'Webcam 4K',
    price: 199.99,
    category: 'Video',
    emoji: '📷',
  },
];

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Zone banner */}
      <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
        <p className="text-sm text-emerald-700 font-medium">
          🟢 <strong>Shop Zone</strong> — origin:{' '}
          <code className="font-mono">localhost:3001</code>, served via shell
          rewrite at{' '}
          <code className="font-mono">localhost:3000/shop</code>
        </p>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Product Catalogue
        </h1>
        <span className="text-sm text-slate-500">
          {PRODUCTS.length} products
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => (
          <article
            key={product.id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="text-5xl mb-4 text-center" role="img" aria-label={product.name}>
              {product.emoji}
            </div>

            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
              {product.category}
            </span>

            {/* basePath-relative Link — resolves to /shop/[id] in the browser */}
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              <Link
                href={`/${product.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {product.name}
              </Link>
            </h2>

            <p className="text-2xl font-bold text-slate-800 mb-6">
              ${product.price.toFixed(2)}
            </p>

            <div className="mt-auto flex gap-2">
              <Link
                href={`/${product.id}`}
                className="flex-1 text-center px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Details
              </Link>

              {/* Progressive-enhancement form: works without JS */}
              <form action={addToCart}>
                <input type="hidden" name="productId" value={product.id} />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
                >
                  Add to Cart
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
