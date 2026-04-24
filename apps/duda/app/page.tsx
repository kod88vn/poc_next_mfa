import type { Metadata } from 'next';
import { getDudaLandingPayload } from '../lib/duda-landing';

export const metadata: Metadata = {
    title: 'Duda',
    description: 'Duda site inside a dedicated multi-zone app.',
};

export default async function DudaPage() {
    const { html } = await getDudaLandingPayload();

    return (
        <article className="duda-landing" dangerouslySetInnerHTML={{ __html: html }} />
    );
}
