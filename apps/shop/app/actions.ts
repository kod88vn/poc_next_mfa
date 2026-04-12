/**
 * Cart Server Action — shop zone.
 *
 * Increments the shared mfe_cart_count cookie and revalidates the current
 * page so the header re-renders with the updated count.
 *
 * The cookie is intentionally NOT HttpOnly so that both zones (and potential
 * client-side reads) can access it. For a real app, use a server-side session
 * or an API call instead of a plain cookie.
 */
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function addToCart(formData: FormData) {
  const productId = formData.get('productId')?.toString();
  if (!productId) return;

  const cookieStore = await cookies();
  const current = parseInt(
    cookieStore.get('mfe_cart_count')?.value ?? '0',
    10,
  );

  cookieStore.set('mfe_cart_count', String(current + 1), {
    path: '/',
    // 'lax' prevents CSRF while still allowing cross-page navigation reads
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  // Revalidate the listing and the specific PDP so header shows updated count
  revalidatePath('/');
  revalidatePath(`/${productId}`);
}
