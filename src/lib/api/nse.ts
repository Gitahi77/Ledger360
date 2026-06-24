// src/lib/api/nse.ts
// Nairobi Securities Exchange — community price feed
// Falls back to manual prices if the community API is unavailable
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import yahooFinance from 'yahoo-finance2';

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
    const symbols = NSE_STOCKS_FALLBACK.map(s => `${s.symbol}.NR`);
    const quotes = await yahooFinance.quote(symbols);

    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    const stocks: NseStock[] = quotesArray.map((q: any) => {
      const symbol = q.symbol.replace('.NR', '');
      const fallback = NSE_STOCKS_FALLBACK.find(f => f.symbol === symbol);
      return {
        symbol: symbol,
        name: q.shortName ?? fallback?.name ?? symbol,
        price: Math.round((q.regularMarketPrice ?? fallback?.price ?? 0) * 100),
        change: Math.round((q.regularMarketChange ?? 0) * 100),
        changePct: q.regularMarketChangePercent ?? 0,
        volume: q.regularMarketVolume ?? 0,
      };
    }).filter((s: NseStock) => s.price > 0);

    if (stocks.length > 0) {
      _cache = { stocks, updatedAt: Date.now() };
      return { stocks, isLive: true };
    }
    throw new Error('Empty NSE response');
  } catch (err) {
    console.warn('[NSE] Using fallback prices:', err);
    return { 
      stocks: NSE_STOCKS_FALLBACK.map(s => ({
        ...s,
        price: Math.round(s.price * 100),
        change: Math.round(s.change * 100)
      })), 
      isLive: false 
    };
  }
}

export function getStockValue(symbol: string, shares: number, stocks: NseStock[]): number {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return 0;
  return Math.round(stock.price * shares);
}
