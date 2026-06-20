// src/lib/api/frankfurter.ts
// Live KES exchange rates — free, no API key needed
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.

export interface FxRates {
  base: string;
  date: string;
  rates: Record<string, number>;
  updatedAt: number; // timestamp ms
}

let _cache: FxRates | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function getRates(base: string = 'USD'): Promise<FxRates | null> {
  const cacheKey = `rates_${base}`;
  if (_cache && _cache.base === base && Date.now() - _cache.updatedAt < CACHE_TTL) return _cache;
  try {
    const toCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'CHF', 'JPY', 'KES'].filter(c => c !== base).join(',');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${base}&to=${toCurrencies}`,
      { next: { revalidate: 3600 }, signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
    const data = await res.json();
    _cache = { ...data, base, updatedAt: Date.now() };
    return _cache;
  } catch (err) {
    console.warn('[Frankfurter] Failed to fetch FX rates:', err);
    return _cache ?? null;
  }
}

/** Convert an amount in KES to another currency */
export function kesTo(amount: number, currency: string, rates: FxRates): number {
  const rate = rates.rates[currency];
  if (!rate) return amount;
  return +(amount * rate).toFixed(2);
}

/** Convert an amount from a foreign currency back to KES */
export function toKes(amount: number, currency: string, rates: FxRates): number {
  const rate = rates.rates[currency];
  if (!rate) return amount;
  return +(amount / rate).toFixed(2);
}
