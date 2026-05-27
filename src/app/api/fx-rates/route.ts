// src/app/api/fx-rates/route.ts
// Server-side proxy for Frankfurter FX rates — avoids CORS on the client
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { NextResponse } from 'next/server';
import { getKesRates } from '@/lib/api/frankfurter';

export const revalidate = 3600; // Next.js cache: 1 hour

export async function GET() {
  const rates = await getKesRates();
  if (!rates) {
    return NextResponse.json({ error: 'FX rates unavailable' }, { status: 503 });
  }
  return NextResponse.json(rates);
}
