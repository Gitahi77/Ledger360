// src/lib/api/nse.ts
// Nairobi Securities Exchange — community price feed
// Falls back to manual prices if the community API is unavailable
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import yahooFinance from 'yahoo-finance2';
import { YahooQuoteItemSchema } from './yahoo';
import { env } from '@/env';
import { withTimeout } from '@/lib/timeout';

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
  { symbol: 'SCOM',  name: 'Safaricom PLC',      price: 1400, change: 0, changePct: 0 },
  { symbol: 'EQTY',  name: 'Equity Group',        price: 4500, change: 0, changePct: 0 },
  { symbol: 'KCB',   name: 'KCB Group PLC',       price: 3800, change: 0, changePct: 0 },
  { symbol: 'EABL',  name: 'East African Breweries', price: 14000, change: 0, changePct: 0 },
  { symbol: 'COOP',  name: 'Co-op Bank',          price: 1450, change: 0, changePct: 0 },
  { symbol: 'STBIC', name: 'Stanbic Holdings',    price: 11000, change: 0, changePct: 0 },
  { symbol: 'KPLC',  name: 'Kenya Power',         price: 180,  change: 0, changePct: 0 },
  { symbol: 'BAMB',  name: 'Bamburi Cement',      price: 6500, change: 0, changePct: 0 },
  { symbol: 'CABL',  name: 'East African Cables', price: 250,  change: 0, changePct: 0 },
  { symbol: 'NSE',   name: 'Nairobi Securities Exchange', price: 1000, change: 0, changePct: 0 },
];

let _cache: { stocks: NseStock[]; updatedAt: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes (prices change during trading)

export async function getNseStocks(): Promise<{ stocks: NseStock[]; isLive: boolean }> {
  if (_cache && Date.now() - _cache.updatedAt < CACHE_TTL) {
    return { stocks: _cache.stocks, isLive: true };
  }
  try {
    const symbols = NSE_STOCKS_FALLBACK.map(s => `${s.symbol}.NR`);
    const rawQuotes = await withTimeout(
      yahooFinance.quote(symbols),
      env.EXTERNAL_API_TIMEOUT_MS,
      'NSE quote timed out'
    );

    const quotesArray = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
    const stocks: NseStock[] = [];
    
    for (const raw of quotesArray) {
      const parsed = YahooQuoteItemSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn(`[NSE] Discarding invalid quote item`, parsed.error.flatten().fieldErrors);
        continue;
      }
      const q = parsed.data;
      const symbol = q.symbol.replace('.NR', '');
      const fallback = NSE_STOCKS_FALLBACK.find(f => f.symbol === symbol);
      
      const price = q.regularMarketPrice ? Math.round(q.regularMarketPrice * 100) : (fallback?.price ?? 0);
      if (price <= 0) {
         console.warn(`[NSE] Discarding quote for ${q.symbol} due to zero or negative price`);
         continue;
      }

      stocks.push({
        symbol: symbol,
        name: q.shortName ?? fallback?.name ?? symbol,
        price,
        change: q.regularMarketChange ? Math.round(q.regularMarketChange * 100) : 0,
        changePct: q.regularMarketChangePercent ?? 0,
        volume: q.regularMarketVolume ?? 0,
      });
    }

    if (stocks.length > 0) {
      _cache = { stocks, updatedAt: Date.now() };
      return { stocks, isLive: true };
    }
    throw new Error('Empty NSE response');
  } catch (err) {
    console.warn('[NSE] Using fallback prices:', err);
    return { 
      stocks: NSE_STOCKS_FALLBACK, 
      isLive: false 
    };
  }
}

export function getStockValue(symbol: string, shares: number, stocks: NseStock[]): number {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return 0;
  return Math.round(stock.price * shares);
}
