'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { formatKES } from '@/lib/format';

interface NseStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume?: number;
}

export function NsePortfolioBoard() {
  const [stocks, setStocks] = useState<NseStock[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchNse() {
      try {
        const res = await fetch('/api/nse');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStocks(data.stocks || []);
        setIsLive(data.isLive);
        setLastUpdated(new Date());
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchNse();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 8 }}></div>
      </div>
    );
  }

  if (error || stocks.length === 0) {
    return (
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <AlertCircle size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <p>Could not load NSE market data.</p>
      </div>
    );
  }

  return (
    <div className="card animate-in">
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--color-brand)" />
            NSE Market Feed
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0, marginTop: '0.2rem' }}>
            Top tracked securities
          </p>
        </div>
        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: isLive ? 'var(--color-income)' : 'var(--warning)', background: isLive ? 'var(--color-income-light)' : 'var(--warning-light)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>
            <Clock size={12} />
            {isLive ? 'Live Prices' : 'Delayed / Fallback'}
          </div>
        )}
      </div>

      <div style={{ padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.75rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          <div>Symbol</div>
          <div style={{ textAlign: 'right' }}>Price (KES)</div>
          <div style={{ textAlign: 'right' }}>Change</div>
        </div>

        {stocks.slice(0, 5).map((stock) => {
          const isPositive = stock.changePct > 0;
          const isNegative = stock.changePct < 0;
          const color = isPositive ? 'var(--color-income)' : isNegative ? 'var(--color-expense)' : 'var(--color-text-secondary)';
          const bg = isPositive ? 'var(--color-income-light)' : isNegative ? 'var(--color-expense-light)' : 'var(--bg-subtle)';

          return (
            <div key={stock.symbol} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '1rem 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{stock.symbol}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif' }}>
                {formatKES(stock.price)}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                <span style={{ background: bg, color: color, padding: '0.2rem 0.4rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                  {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
                  {Math.abs(stock.changePct).toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0 }}>
          Prices provided by Yahoo Finance. Data may be delayed by up to 15 minutes.
        </p>
      </div>
    </div>
  );
}
