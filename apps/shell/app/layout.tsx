/**
 * Shell Root Layout — Server Component.
 *
 * Reads the mfe_cart_count cookie (set by the shop zone's Server Action) and
 * passes it down to the shared Header. Because cookies are scoped to the
 * localhost domain (not the port), both zones can read/write the same value.
 */
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Header, getDudaBrandTheme, normalizeHeaderTheme } from '@repo/ui';
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
        <Header
          cartCount={cartCount}
          currentZone="shell"
          showDudaLink
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
