'use client';
import { AlertTriangle, TrendingUp, RefreshCw, Lightbulb, X } from 'lucide-react';
import { useState } from 'react';
import type { Insight } from '@/lib/intelligence';

export function InsightsFeed({ initialInsights }: { initialInsights: Insight[] }) {
  const [insights, setInsights] = useState(initialInsights);

  if (insights.length === 0) return null;

  function dismiss(id: string) {
    setInsights(prev => prev.filter(i => i.id !== id));
  }

  const iconMap = {
    anomaly: <AlertTriangle size={18} />,
    recurring: <RefreshCw size={18} />,
    forecast: <TrendingUp size={18} />,
    info: <Lightbulb size={18} />
  };

  const colorMap = {
    danger: 'var(--danger)',
    warning: 'var(--warning)',
    success: 'var(--success)',
    info: 'var(--primary)'
  };

  const bgMap = {
    danger: 'var(--danger-light)',
    warning: 'var(--warning-light)',
    success: 'var(--success-light)',
    info: 'var(--primary-light)'
  };

  return (
    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Ledger Brain Insights
      </div>
      {insights.map(insight => (
        <div 
          key={insight.id} 
          style={{ 
            display: 'flex', gap: '1rem', alignItems: 'flex-start',
            padding: '1rem', borderRadius: 12, 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ 
            background: bgMap[insight.severity], 
            color: colorMap[insight.severity], 
            padding: '0.6rem', borderRadius: 8 
          }}>
            {iconMap[insight.type as keyof typeof iconMap] || <Lightbulb size={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              {insight.title}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {insight.description}
            </div>
          </div>
          <button 
            onClick={() => dismiss(insight.id)}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--text-muted)', padding: '0.25rem' 
            }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
