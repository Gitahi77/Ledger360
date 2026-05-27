// src/app/api/nse/route.ts
// Server-side proxy for NSE stock prices
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { NextResponse } from 'next/server';
import { getNseStocks } from '@/lib/api/nse';

export const revalidate = 900; // 15 minutes

export async function GET() {
  const { stocks, isLive } = await getNseStocks();
  return NextResponse.json({ stocks, isLive });
}
