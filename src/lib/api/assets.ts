import yahooFinance from 'yahoo-finance2';

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
    const results = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 });
    return (results as any).quotes.map((q: any) => ({
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
    const rawQuotes = await yahooFinance.quote(symbols);
    const quotesArray = Array.isArray(rawQuotes) ? rawQuotes : [rawQuotes];
    
    const quotes: AssetQuote[] = quotesArray.map((q: any) => {
      // We convert prices to minor units (e.g. multiply by 100) to keep math consistent with Ledger360 standard
      return {
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: Math.round((q.regularMarketPrice ?? 0) * 100),
        change: Math.round((q.regularMarketChange ?? 0) * 100),
        changePct: q.regularMarketChangePercent ?? 0,
        volume: q.regularMarketVolume ?? 0,
        currency: q.currency || 'USD'
      };
    }).filter(s => s.price > 0);

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
