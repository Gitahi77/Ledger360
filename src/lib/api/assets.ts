import yahooFinance from 'yahoo-finance2';
import { YahooSearchResponseSchema, YahooQuoteItemSchema } from './yahoo';
import { env } from '@/env';
import { withTimeout } from '@/lib/timeout';

export interface AssetQuote {
  symbol: string;
  name: string;
  price: number;      // Minor units (cents/pesewas, etc)
  change: number;     // Minor units
  changePct: number;  // % change
  volume?: number;
  currency?: string;
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  exchDisp: string;
  typeDisp: string;
}


export async function searchAssets(query: string): Promise<AssetSearchResult[]> {
  try {
    const rawResult = await withTimeout(
      yahooFinance.search(query, { quotesCount: 10, newsCount: 0 }),
      env.EXTERNAL_API_TIMEOUT_MS,
      'Yahoo Finance search timed out'
    );
    
    const parsed = YahooSearchResponseSchema.safeParse(rawResult);
    if (!parsed.success) {
      console.warn('[Assets] search validation failed:', parsed.error.flatten().fieldErrors);
      return [];
    }

    return parsed.data.quotes.map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchDisp: q.exchDisp || 'Global',
      typeDisp: q.dispFormat || 'Asset'
    }));
  } catch (err) {
    console.error('[Assets] Search error:', err);
    return [];
  }
}


export async function fetchQuotes(symbols: string[]): Promise<{ quotes: AssetQuote[]; isLive: boolean }> {
  if (!symbols || symbols.length === 0) return { quotes: [], isLive: true };

  try {
    const rawQuotes = await withTimeout(
      yahooFinance.quote(symbols),
      env.EXTERNAL_API_TIMEOUT_MS,
      'Yahoo Finance quote timed out'
    );
    const quotesArray = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
    
    const quotes: AssetQuote[] = [];
    
    for (const raw of quotesArray) {
      const parsed = YahooQuoteItemSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn(`[Assets] Discarding invalid quote item`, parsed.error.flatten().fieldErrors);
        continue;
      }
      
      const q = parsed.data;
      const price = Math.round((q.regularMarketPrice ?? 0) * 100);
      if (price <= 0) {
        console.warn(`[Assets] Discarding quote for ${q.symbol} due to zero or negative price`);
        continue;
      }

      quotes.push({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price,
        change: Math.round((q.regularMarketChange ?? 0) * 100),
        changePct: q.regularMarketChangePercent ?? 0,
        volume: q.regularMarketVolume ?? 0,
        currency: q.currency || 'USD'
      });
    }

    return { quotes, isLive: true };
  } catch (err) {
    console.error('[Assets] Quote fetch error:', err);
    return { quotes: [], isLive: false };
  }
}

export function getAssetValue(symbol: string, shares: number, quotes: AssetQuote[]): number {
  const quote = quotes.find(q => q.symbol === symbol);
  if (!quote) return 0;
  return Math.round(quote.price * shares);
}
