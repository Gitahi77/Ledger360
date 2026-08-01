import React from 'react';
import { Sparkline } from '@/components/finance/primitives/Sparkline';
import { DynamicCategoryIcon } from '@/lib/icons';
import { Edit2, Trash2, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/finance/formatCurrency';
import type { CategoryAnalyticsDTO } from '@/lib/queries/analytics';

export type CategoryData = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  _count: {
    transactions: number;
    budgets: number;
  };
};

type CategoryCardProps = {
  category: CategoryData;
  analytics?: CategoryAnalyticsDTO;
  currency: string;
  deletingId: string | null;
  onEdit: (cat: CategoryData) => void;
  onDelete: (cat: CategoryData) => void;
};

export function CategoryCard({
  category,
  analytics,
  currency,
  deletingId,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  const isExpense = category.type === 'expense';
  const isIncome = category.type === 'income';
  const colorVar = isExpense ? 'var(--color-expense)' : isIncome ? 'var(--color-income)' : 'var(--color-brand)';
  const bgVar = isExpense ? 'var(--color-expense-light)' : isIncome ? 'var(--color-income-light)' : 'var(--color-brand-light)';

  const inUse = category._count.transactions > 0 || category._count.budgets > 0;
  
  // Extract analytics
  const hasAnalytics = !!analytics;
  const historyData = analytics?.history.map(h => h.amountMinor) || [];
  
  // Determine Trend Icon
  let TrendIcon = Minus;
  let trendColor = 'var(--color-text-secondary)';
  if (analytics?.trendLabel.includes('Rising')) {
    TrendIcon = TrendingUp;
    trendColor = isExpense ? 'var(--color-expense)' : 'var(--color-income)';
  } else if (analytics?.trendLabel.includes('Falling')) {
    TrendIcon = TrendingDown;
    trendColor = isExpense ? 'var(--color-income)' : 'var(--color-expense)';
  }

  return (
    <div 
      className="card category-card" 
      style={{ 
        padding: '1.25rem', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1.25rem',
        borderRadius: 12, 
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', 
        cursor: 'default',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: bgVar, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${colorVar}40`, boxShadow: `inset 0 2px 4px rgba(255,255,255,0.1)` }}>
            <DynamicCategoryIcon category={category.name} size={22} style={{ color: colorVar }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>{category.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 500 }}>{category._count.transactions}</span> txns
              <span style={{ color: 'var(--border)' }}>•</span>
              <span style={{ fontWeight: 500 }}>{category._count.budgets}</span> budgets
            </div>
          </div>
        </div>

        {/* Action Buttons (visible on hover) */}
        <div className="flex items-center gap-1 category-actions" style={{ opacity: 0, transition: 'opacity 0.2s' }}>
          <button onClick={() => onEdit(category)} 
            style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.4rem', borderRadius: 6, transition: 'all 0.2s' }}
            className="hover-bg-subtle"
            title="Edit Category"
          >
            <Edit2 size={15}/>
          </button>
          <button onClick={() => onDelete(category)} disabled={deletingId === category.id}
            style={{ background:'transparent', border:'none', cursor: inUse ? 'not-allowed' : 'pointer', color: inUse ? 'var(--color-text-muted)' : 'var(--color-expense)', display:'flex', padding:'0.4rem', borderRadius: 6, opacity: inUse ? 0.4 : 1, transition: 'all 0.2s' }}
            className="hover-bg-subtle"
            title={inUse ? "Cannot delete category in use" : "Delete Category"}
          >
            {deletingId === category.id ? <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={15}/>}
          </button>
        </div>
      </div>

      {/* Analytics Body */}
      {hasAnalytics && analytics.history.length >= 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.25rem' }}>
          
          {/* Sparkline & Averages */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ flex: 1, height: 36 }}>
              <Sparkline data={historyData} width={120} height={36} color={colorVar} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', fontWeight: 700, marginBottom: '0.1rem' }}>
                3mo Avg
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                {formatCurrency({ amountMinor: analytics.threeMonthAverageMinor, currency }, { showSymbol: false })}
              </div>
            </div>
          </div>

          {/* Intelligent Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {/* Trend Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--surface-sunken)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              <TrendIcon size={12} style={{ color: trendColor }} />
              {analytics.trendLabel}
            </div>

            {/* Velocity / Volatility */}
            {(analytics.velocityLabel !== 'On normal pace' && analytics.velocityLabel !== 'Insufficient data') && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--surface-sunken)', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                <Activity size={12} style={{ color: 'var(--color-text-secondary)' }} />
                {analytics.velocityLabel}
              </div>
            )}
            
            {analytics.volatilityLabel === 'Highly Variable' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--color-expense-light)', border: `1px solid var(--color-expense)`, padding: '0.25rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-expense)' }}>
                <AlertTriangle size={12} />
                Variable
              </div>
            )}
          </div>
          
        </div>
      )}
      
      {!hasAnalytics && (
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', opacity: 0.7 }}>
          No analytics data available
        </div>
      )}
    </div>
  );
}
