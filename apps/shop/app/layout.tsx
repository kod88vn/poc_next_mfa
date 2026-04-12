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
import { Header } from '@repo/ui';
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
  const cartCount = parseInt(
    cookieStore.get('mfe_cart_count')?.value ?? '0',
    10,
  );

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <Header cartCount={cartCount} currentZone="shop" />
        <main>{children}</main>
      </body>
    </html>
  );
}
