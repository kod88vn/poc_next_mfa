/**
 * Shell Root Layout — Server Component.
 *
 * Reads the mfe_cart_count cookie (set by the shop zone's Server Action) and
 * passes it down to the shared Header. Because cookies are scoped to the
 * localhost domain (not the port), both zones can read/write the same value.
 */
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Header } from '@repo/ui';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | MFE Store',
    default: 'MFE Store',
  },
  description:
    'A Next.js 16 Multi-Zone Microfrontend POC powered by Turborepo and Tailwind CSS.',
};

export default async function RootLayout({
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
        <Header cartCount={cartCount} currentZone="shell" />
        <main>{children}</main>
      </body>
    </html>
  );
}
