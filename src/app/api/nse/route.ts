// src/app/api/nse/route.ts
// Server-side proxy for NSE stock prices
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { apiRoute } from '@/lib/api/respond';
import { getNseStocks } from '@/lib/api/nse';

export const revalidate = 900; // 15 minutes

export const GET = apiRoute(
  null,
  async () => {
    const { stocks, isLive } = await getNseStocks();
    return { stocks, isLive };
  }
);
