import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Header, getDudaBrandTheme } from '@repo/ui';
import { getDudaLandingPayload } from '../lib/duda-landing';
import './globals.css';

export const metadata: Metadata = {
    title: {
        template: '%s | MFE Store',
        default: 'Duda | MFE Store',
    },
    description: 'Duda integration zone.',
};

export default async function DudaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const { cssText, bodyId, bodyClassName, bodyStyle } =
        await getDudaLandingPayload();
    const brandTheme = await getDudaBrandTheme();
    const cartCount = parseInt(
        cookieStore.get('mfe_cart_count')?.value ?? '0',
        10,
    );

    const themedVars = {
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

    const mergedBodyClassName = [
        'antialiased min-h-screen',
        bodyClassName,
    ]
        .filter(Boolean)
        .join(' ');

    const bodyStyleObject = bodyStyle
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, rule) => {
            const [rawKey, ...rawValueParts] = rule.split(':');
            const rawValue = rawValueParts.join(':').trim();
            if (!rawKey || !rawValue) return acc;

            const key = rawKey
                .trim()
                .replace(/-([a-z])/g, (_m, letter: string) => letter.toUpperCase());
            acc[key] = rawValue;
            return acc;
        }, {});

    return (
        <html lang="en">
            <head>
                {/* Inline fetched CSS — React/Next.js converts <link rel="stylesheet"> to
                        preloads in App Router, and @import URLs get &amp; encoded by SSR.
                        Inlining the fetched CSS avoids both problems. */}
                {cssText && (
                    <style
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: cssText }}
                    />
                )}
            </head>
            <body
                id={bodyId || undefined}
                className={mergedBodyClassName}
                style={{ ...bodyStyleObject, ...themedVars }}
            >
                <Header cartCount={cartCount} currentZone="duda" />
                <main>{children}</main>
            </body>
        </html>
    );
}
