// Server Component — no 'use client' needed.
// Button is a client component boundary imported here; Next.js handles the split.
import React from 'react';

export interface HeaderProps {
  /** Live cart item count read from the shared mfe_cart_count cookie. */
  cartCount?: number;
  /** Badge showing which MFE zone is rendering this header. */
  currentZone?: 'shell' | 'shop' | 'duda';
  /** Show link to duda zone. */
  showDudaLink?: boolean;
}

export function Header({
  cartCount = 0,
  currentZone = 'shell',
  showDudaLink = true,
}: HeaderProps) {
  const zoneBadgeStyle: React.CSSProperties =
    currentZone === 'shell'
      ? {
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        color: '#c7d2fe',
        borderColor: 'rgba(129, 140, 248, 0.6)',
      }
      : currentZone === 'shop'
        ? {
          backgroundColor: 'rgba(16, 185, 129, 0.25)',
          color: '#a7f3d0',
          borderColor: 'rgba(16, 185, 129, 0.6)',
        }
        : {
          backgroundColor: 'rgba(217, 119, 6, 0.25)',
          color: '#fef3c7',
          borderColor: 'rgba(217, 119, 6, 0.6)',
        };

  return (
    <header
      className="text-white shadow-lg"
      style={{
        backgroundColor: 'var(--brand-secondary, #0f172a)',
        fontFamily: 'var(--brand-font-family, inherit)',
        display: 'block',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          height: '67px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand + zone badge + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Cross-zone link: must use <a>, not Next.js <Link> */}
          <a
            href="/"
            style={{
              color: 'var(--brand-surface, #ffffff)',
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            MFE Store
          </a>

          <span
            style={{
              ...zoneBadgeStyle,
              fontSize: '0.75rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              fontFamily: 'monospace',
              border: '1px solid',
              whiteSpace: 'nowrap',
            }}
          >
            zone:{currentZone}
          </span>

          <nav
            style={{
              display: 'flex',
              gap: '1.5rem',
              backgroundColor: 'var(--brand-accent, #2563eb)',
              borderRadius: '9999px',
              padding: '0.375rem 0.875rem',
            }}
          >
            <a
              href="/"
              style={{ color: 'var(--brand-surface, #ffffff)', fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.5', textDecoration: 'none' }}
            >
              Home
            </a>
            {/* /shop is cross-zone — full navigation required */}
            <a
              href="/shop"
              style={{ color: 'var(--brand-surface, #ffffff)', fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.5', textDecoration: 'none' }}
            >
              Shop
            </a>
            {showDudaLink ? (
              <a
                href="/duda"
                style={{ color: 'var(--brand-surface, #ffffff)', fontSize: '0.875rem', fontWeight: 400, lineHeight: '1.5', textDecoration: 'none' }}
              >
                Duda
              </a>
            ) : null}
          </nav>
        </div>

        {/* Cart indicator — shared state via cookie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href="/shop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--brand-muted, #cbd5e1)',
              fontSize: '0.875rem',
              fontWeight: 400,
              textDecoration: 'none',
            }}
            aria-label={`Cart, ${cartCount} items`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '1.25rem', height: '1.25rem', minWidth: '1.25rem', flex: 'none' }}
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
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.25rem',
                height: '1.25rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'var(--brand-primary, #2563eb)',
                color: 'var(--brand-surface, #ffffff)',
              }}
            >
              {cartCount}
            </span>
          </a>

          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              border: '1px solid var(--brand-border, #64748b)',
              padding: '0.375rem 0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--brand-muted, #cbd5e1)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
}
