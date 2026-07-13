import { NextResponse } from 'next/server';
import { fetchQuotes } from '@/lib/api/assets';

import { z } from 'zod';
import { respondValidationError } from '@/lib/respond';

export const dynamic = 'force-dynamic';

const QuoteQuerySchema = z.object({
  symbols: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuoteQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return respondValidationError(parsed.error, 'Quote API');

    const symbolsParam = parsed.data.symbols;
    if (!symbolsParam) {
      return NextResponse.json({ quotes: [], isLive: true });
    }
    const symbols = symbolsParam.split(',').filter(s => s.trim().length > 0);
    const { quotes, isLive } = await fetchQuotes(symbols);
    return NextResponse.json({ quotes, isLive });
  } catch {
    return NextResponse.json({ quotes: [], isLive: false }, { status: 500 });
  }
}
