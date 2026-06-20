// src/app/api/fx-rates/route.ts
// Server-side proxy for Frankfurter FX rates — avoids CORS on the client.
// This route is dynamic (reads session headers for auth) — no static revalidate.
// Caching is handled at the client level (FxTicker polls every 5 min).
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { apiRoute } from '@/lib/api/respond';
import { getRates } from '@/lib/api/frankfurter';

export const dynamic = 'force-dynamic';

export const GET = apiRoute(
  null,
  async (req) => {
    const { searchParams } = new URL(req.url);
    const base = searchParams.get('base') || 'USD';
    const rates = await getRates(base);
    if (!rates) {
      throw new Error('FX rates unavailable');
    }
    return rates;
  }
);
