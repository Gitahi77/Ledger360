export interface YahooSearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchDisp?: string;
  dispFormat?: string;
}

export interface YahooQuoteItem {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  currency?: string;
}
