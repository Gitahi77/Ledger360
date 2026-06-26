// src/lib/actions/_auth.ts
// Shared requireAuth helper — used by all server actions.
// Bug 0-D fix: null-guards the id so a stale/corrupt session never leaks through.
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  const id      = session?.user?.id;
  if (!id) redirect('/login');
  return {
    id,
    currency: session.user.currency ?? 'KES',
  };
}
