// src/lib/api/nse.ts
// Nairobi Securities Exchange — community price feed
// Falls back to manual prices if the community API is unavailable
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.

export interface NseStock {
  symbol: string;
  name: string;
  price: number;      // KES
  change: number;     // absolute KES change
  changePct: number;  // % change
  volume?: number;
}

// Well-known NSE stocks with fallback prices (KES, approx 2025)
export const NSE_STOCKS_FALLBACK: NseStock[] = [
  { symbol: 'SCOM',  name: 'Safaricom PLC',      price: 14.00, change: 0, changePct: 0 },
  { symbol: 'EQTY',  name: 'Equity Group',        price: 45.00, change: 0, changePct: 0 },
  { symbol: 'KCB',   name: 'KCB Group PLC',       price: 38.00, change: 0, changePct: 0 },
  { symbol: 'EABL',  name: 'East African Breweries', price: 140.00, change: 0, changePct: 0 },
  { symbol: 'COOP',  name: 'Co-op Bank',          price: 14.50, change: 0, changePct: 0 },
  { symbol: 'STBIC', name: 'Stanbic Holdings',    price: 110.00, change: 0, changePct: 0 },
  { symbol: 'KPLC',  name: 'Kenya Power',         price: 1.80,  change: 0, changePct: 0 },
  { symbol: 'BAMB',  name: 'Bamburi Cement',      price: 65.00, change: 0, changePct: 0 },
  { symbol: 'CABL',  name: 'East African Cables', price: 2.50,  change: 0, changePct: 0 },
  { symbol: 'NSE',   name: 'Nairobi Securities Exchange', price: 10.00, change: 0, changePct: 0 },
];

let _cache: { stocks: NseStock[]; updatedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (prices change during trading)

export async function getNseStocks(): Promise<{ stocks: NseStock[]; isLive: boolean }> {
  if (_cache && Date.now() - _cache.updatedAt < CACHE_TTL) {
    return { stocks: _cache.stocks, isLive: true };
  }
  try {
    const res = await fetch('https://nse-api-eight.vercel.app/api/stocks', {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    if (!res.ok) throw new Error(`NSE API ${res.status}`);
    const raw = await res.json();

    // Normalize API response (shape may vary)
    const stocks: NseStock[] = (Array.isArray(raw) ? raw : raw.stocks ?? []).map((s: any) => ({
      symbol:    s.symbol ?? s.ticker ?? '',
      name:      s.name ?? s.company ?? s.symbol ?? '',
      price:     parseFloat(s.price ?? s.last ?? 0),
      change:    parseFloat(s.change ?? 0),
      changePct: parseFloat(s.changePercent ?? s.changePct ?? s.pct ?? 0),
      volume:    parseInt(s.volume ?? 0),
    })).filter((s: NseStock) => s.symbol && s.price > 0);

    if (stocks.length > 0) {
      _cache = { stocks, updatedAt: Date.now() };
      return { stocks, isLive: true };
    }
    throw new Error('Empty NSE response');
  } catch (err) {
    console.warn('[NSE] Using fallback prices:', err);
    return { stocks: NSE_STOCKS_FALLBACK, isLive: false };
  }
}

export function getStockValue(symbol: string, shares: number, stocks: NseStock[]): number {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return 0;
  return +(stock.price * shares).toFixed(2);
}
