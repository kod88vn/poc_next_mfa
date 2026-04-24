import Link from 'next/link';

export default async function NotFoundPage({
    searchParams,
}: {
    searchParams?: Promise<{ from?: string }>;
}) {
    const resolvedSearchParams = await searchParams;
    const from = resolvedSearchParams?.from;

    return (
        <main
            style={{
                minHeight: 'calc(100vh - 67px)',
                display: 'grid',
                placeItems: 'center',
                padding: '2rem 1rem',
            }}
        >
            <section
                style={{
                    maxWidth: '42rem',
                    width: '100%',
                    border: '1px solid var(--brand-border, #cbd5e1)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    background: 'var(--brand-surface, #ffffff)',
                    color: 'var(--brand-text, #0f172a)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
            >
                <p style={{ fontSize: '0.75rem', letterSpacing: '0.08em', opacity: 0.7, margin: 0 }}>
                    404
                </p>
                <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem', fontSize: '1.5rem' }}>
                    Page not available in this MFE demo
                </h1>
                <p style={{ marginTop: 0, lineHeight: 1.6 }}>
                    This link points to a vendor-internal page that is not mapped to a local zone route.
                </p>
                {from ? (
                    <p style={{ marginTop: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem', opacity: 0.85 }}>
                        Requested path: {from}
                    </p>
                ) : null}
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link href="/" style={{ color: 'var(--brand-primary, #2563eb)', textDecoration: 'none' }}>
                        Go to Home
                    </Link>
                    <Link href="/shop" style={{ color: 'var(--brand-primary, #2563eb)', textDecoration: 'none' }}>
                        Go to Shop
                    </Link>
                    <Link href="/duda" style={{ color: 'var(--brand-primary, #2563eb)', textDecoration: 'none' }}>
                        Go to Duda
                    </Link>
                </div>
            </section>
        </main>
    );
}
