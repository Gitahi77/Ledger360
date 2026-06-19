// src/app/api/fx-rates/route.ts
// Server-side proxy for Frankfurter FX rates — avoids CORS on the client
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { apiRoute } from '@/lib/api/respond';
import { getRates } from '@/lib/api/frankfurter';

export const revalidate = 3600; // Next.js cache: 1 hour

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
