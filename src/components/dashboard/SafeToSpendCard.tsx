'use client';
// src/components/dashboard/SafeToSpendCard.tsx
import { useState } from 'react';
import { fmtAdaptive } from '@/lib/format';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export function SafeToSpendCard({
  data,
  currency,
}: {
  data: {
    discretionaryMinor: number;
    remainingMinor: number;
    perDayMinor: number;
    daysLeft: number;
    breakdown: {
      expectedIncome: number;
      baseEnvelopeLimits: number;
      plannedSavings: number;
      loanDue: number;
      unbudgetedSpendThisPeriod: number;
      envelopeOverspendPenalty: number;
    };
  };
  currency: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const { remainingMinor, perDayMinor, daysLeft, breakdown } = data;
  const isSafe = remainingMinor >= 0;

  return (
    <div 
      className="card animate-in mb-5" 
      role="button"
      tabIndex={0}
      style={{ 
        background: isSafe ? 'var(--color-brand-grad)' : 'var(--color-expense-grad)', 
        color: 'white', 
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        overflow: 'hidden',
        boxShadow: isSafe ? '0 8px 30px rgba(37,99,235,0.2)' : '0 8px 30px rgba(220,38,38,0.2)'
      }}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={18} opacity={0.9} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                {isSafe ? 'Safe to Spend' : 'Overspent'}
              </span>
            </div>
            
            <div style={{ 
              fontFamily: 'Space Grotesk,sans-serif',
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              marginBottom: '0.5rem'
            }}>
              {fmtAdaptive(remainingMinor, currency)}
            </div>
            
            <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 500 }}>
              {isSafe 
                ? `${fmtAdaptive(perDayMinor, currency)} / day for ${daysLeft} days` 
                : 'Reduce spending to get back on track'
              }
            </div>
          </div>
          
          <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex' }}>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="animate-in" style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '1.25rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, marginBottom: '0.75rem', fontWeight: 700 }}>
            Withheld & Allocated
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ opacity: 0.9 }}>Expected Income</span>
              <span style={{ fontWeight: 600 }}>{fmtAdaptive(breakdown.expectedIncome, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ opacity: 0.9 }}>Planned Savings</span>
              <span style={{ fontWeight: 600 }}>-{fmtAdaptive(breakdown.plannedSavings, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ opacity: 0.9 }}>Debt & Loan Payments</span>
              <span style={{ fontWeight: 600 }}>-{fmtAdaptive(breakdown.loanDue, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ opacity: 0.9 }}>Base Envelope Limits</span>
              <span style={{ fontWeight: 600 }}>-{fmtAdaptive(breakdown.baseEnvelopeLimits, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ opacity: 0.9 }}>Unbudgeted Spend</span>
              <span style={{ fontWeight: 600 }}>-{fmtAdaptive(breakdown.unbudgetedSpendThisPeriod, currency)}</span>
            </div>
            {breakdown.envelopeOverspendPenalty > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ fontWeight: 600 }}>Envelope Overspend Penalty</span>
                <span style={{ fontWeight: 700 }}>-{fmtAdaptive(breakdown.envelopeOverspendPenalty, currency)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
