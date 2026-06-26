import { NextResponse } from 'next/server';
import { fetchQuotes } from '@/lib/api/assets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    if (!symbolsParam) {
      return NextResponse.json({ quotes: [], isLive: true });
    }
    const symbols = symbolsParam.split(',').filter(s => s.trim().length > 0);
    const { quotes, isLive } = await fetchQuotes(symbols);
    return NextResponse.json({ quotes, isLive });
  } catch (err) {
    return NextResponse.json({ quotes: [], isLive: false }, { status: 500 });
  }
}
