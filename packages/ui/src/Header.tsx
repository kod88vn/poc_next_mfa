// Server Component — no 'use client' needed.
// Button is a client component boundary imported here; Next.js handles the split.
import React from 'react';
import { Button } from './Button';

export interface HeaderProps {
  /** Live cart item count read from the shared mfe_cart_count cookie. */
  cartCount?: number;
  /** Badge showing which MFE zone is rendering this header. */
  currentZone?: 'shell' | 'shop';
}

export function Header({ cartCount = 0, currentZone = 'shell' }: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand + zone badge + nav */}
        <div className="flex items-center gap-6">
          {/* Cross-zone link: must use <a>, not Next.js <Link> */}
          <a
            href="/"
            className="text-xl font-bold tracking-tight hover:text-blue-400 transition-colors"
          >
            MFE Store
          </a>

          <span
            className={[
              'text-xs px-2 py-0.5 rounded-full font-mono border',
              currentZone === 'shell'
                ? 'bg-indigo-900 text-indigo-300 border-indigo-700'
                : 'bg-emerald-900 text-emerald-300 border-emerald-700',
            ].join(' ')}
          >
            zone:{currentZone}
          </span>

          <nav className="hidden md:flex gap-6">
            <a
              href="/"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Home
            </a>
            {/* /shop is cross-zone — full navigation required */}
            <a
              href="/shop"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              Shop
            </a>
          </nav>
        </div>

        {/* Cart indicator — shared state via cookie */}
        <div className="flex items-center gap-3">
          <a
            href="/shop"
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            aria-label={`Cart, ${cartCount} items`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3A1 1 0 006 17h12M17 21a1 1 0 100-2 1 1 0 000 2zm-10 0a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold">
              {cartCount}
            </span>
          </a>

          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </div>
      </div>
    </header>
  );
}
