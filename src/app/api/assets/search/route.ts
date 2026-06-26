import { NextResponse } from 'next/server';
import { searchAssets } from '@/lib/api/assets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (!query) {
      return NextResponse.json({ results: [] });
    }
    const results = await searchAssets(query);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
