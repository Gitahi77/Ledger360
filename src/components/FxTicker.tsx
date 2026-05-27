'use client';
// src/components/FxTicker.tsx
// Live KES exchange rates — powered by Frankfurter (free, no API key)
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

interface Rates { base: string; date: string; rates: Record<string, number>; }

const CURRENCIES = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar'          },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro'               },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound'      },
  { code: 'ZAR', flag: '🇿🇦', name: 'South African Rand' },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc'        },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen'       },
];

export function FxTicker() {
  const [rates, setRates]   = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const res = await fetch('/api/fx-rates');
      if (!res.ok) throw new Error();
      setRates(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={15} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
            KES Exchange Rates
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {rates && (
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Updated {rates.date}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', display: 'flex', borderRadius: 4, transition: 'color 0.15s' }}
            title="Refresh rates"
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
          <AlertCircle size={13} />
          Rates temporarily unavailable. Try refreshing.
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !rates && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 52, borderRadius: 8, background: 'var(--bg-hover)', animation: 'pulse 2s ease infinite' }} />
          ))}
        </div>
      )}

      {/* Rate grid */}
      {rates && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {CURRENCIES.map(c => {
            const rate = rates.rates[c.code];
            if (!rate) return null;
            return (
              <div key={c.code} style={{
                background: 'var(--bg-app)', borderRadius: 8, padding: '0.625rem 0.75rem',
                border: '1px solid var(--border-light)',
              }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.15rem' }}>{c.flag}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 750, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  {rate < 0.01
                    ? rate.toFixed(5)
                    : rate < 1
                    ? rate.toFixed(4)
                    : rate.toFixed(2)
                  }
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.1rem', fontWeight: 600 }}>
                  {c.code}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.625rem', textAlign: 'right' }}>
        1 KES = X {'{currency}'} · Source: European Central Bank via Frankfurter
      </div>
    </div>
  );
}
