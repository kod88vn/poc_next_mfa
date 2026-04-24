/**
 * Shop Root Layout — Server Component.
 *
 * The shop zone has its own <html> root because it is an independent Next.js
 * app. When accessed via the shell's rewrite (localhost:3000/shop) the browser
 * loads the shell's layout for the outer chrome, but when hitting the shop
 * directly (localhost:3001/shop) this layout renders in full.
 *
 * Cart count is read from the shared mfe_cart_count cookie, which is visible
 * to both zones because cookies ignore port numbers for the localhost domain.
 */
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Header, getDudaBrandTheme, normalizeHeaderTheme } from '@repo/ui';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | MFE Store',
    default: 'Shop | MFE Store',
  },
  description: 'Browse our product catalogue.',
};

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const brandTheme = normalizeHeaderTheme(await getDudaBrandTheme());
  const cartCount = parseInt(
    cookieStore.get('mfe_cart_count')?.value ?? '0',
    10,
  );

  const brandVars = {
    '--brand-primary': brandTheme.primary,
    '--brand-secondary': brandTheme.secondary,
    '--brand-accent': brandTheme.accent,
    '--brand-surface': brandTheme.surface,
    '--brand-text': brandTheme.text,
    '--brand-muted': brandTheme.mutedText,
    '--brand-border': brandTheme.border,
    '--brand-font-family': brandTheme.fontFamily,
    fontFamily: 'var(--brand-font-family)',
  } as React.CSSProperties;

  return (
    <html lang="en">
      <head>
        {brandTheme.fontStylesheetUrls.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body
        className="bg-slate-50 text-slate-900 antialiased min-h-screen"
        style={brandVars}
      >
        <Header cartCount={cartCount} currentZone="shop" />
        <main>{children}</main>
      </body>
    </html>
  );
}
