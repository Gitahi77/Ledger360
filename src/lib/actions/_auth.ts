// src/lib/actions/_auth.ts
// Shared requireAuth helper — used by all server actions.
// Bug 0-D fix: null-guards the id so a stale/corrupt session never leaks through.
'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  const id      = session?.user?.id;
  if (!id) throw new Error('Unauthorized');
  return {
    id,
    currency: session.user.currency ?? 'KES',
  };
}
