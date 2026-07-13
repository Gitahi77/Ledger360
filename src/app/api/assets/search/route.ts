import { NextResponse } from 'next/server';
import { searchAssets } from '@/lib/api/assets';

import { z } from 'zod';
import { respondValidationError } from '@/lib/respond';

export const dynamic = 'force-dynamic';

const SearchQuerySchema = z.object({
  q: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = SearchQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return respondValidationError(parsed.error, 'Search API');

    const query = parsed.data.q;
    if (!query) {
      return NextResponse.json({ results: [] });
    }
    const results = await searchAssets(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
