import { z } from 'zod';

export const YahooSearchItemSchema = z.object({
  symbol: z.string(),
  shortname: z.string().nullable().optional(),
  longname: z.string().nullable().optional(),
  exchDisp: z.string().nullable().optional(),
  dispFormat: z.string().nullable().optional(),
}).passthrough();

export type YahooSearchQuote = z.infer<typeof YahooSearchItemSchema>;

export const YahooSearchResponseSchema = z.object({
  quotes: z.array(YahooSearchItemSchema).default([]),
}).passthrough();

export const YahooQuoteItemSchema = z.object({
  symbol: z.string(),
  shortName: z.string().nullable().optional(),
  longName: z.string().nullable().optional(),
  regularMarketPrice: z.number().nullable().optional(),
  regularMarketChange: z.number().nullable().optional(),
  regularMarketChangePercent: z.number().nullable().optional(),
  regularMarketVolume: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
}).passthrough();

export type YahooQuoteItem = z.infer<typeof YahooQuoteItemSchema>;
