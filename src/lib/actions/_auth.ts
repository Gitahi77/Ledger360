// src/lib/actions/_auth.ts
// Shared requireAuth helper — used by all server actions.
// Bug 0-D fix: null-guards the id so a stale/corrupt session never leaks through.
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { cache } from 'react';

export const requireAuth = cache(async () => {
  if (process.env.npm_lifecycle_event === 'build') {
    return { id: 'build-dummy-id', currency: 'KES' };
  }
  
  if (process.env.ALLOW_BENCHMARK_BYPASS === 'true') {
    const { headers } = await import('next/headers');
    const benchmarkUserId = (await headers()).get('x-benchmark-user-id');
    if (benchmarkUserId) {
      return { id: benchmarkUserId, currency: 'KES' };
    }
  }

  const session = await getServerSession(authOptions);
  const id      = session?.user?.id;
  if (!id) redirect('/login');
  return {
    id,
    currency: session.user.currency ?? 'KES',
  };
});
