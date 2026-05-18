// src/app/loading.tsx — Global loading skeleton
import { AppLayout } from '@/components/layout/AppLayout';

export default function GlobalLoading() {
  return (
    <AppLayout>
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="skeleton" style={{ width: 200, height: 34, borderRadius: 8 }} />
      </div>
      {/* KPI strip skeleton */}
      <div className="grid-4 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="kpi-card" style={{ gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '55%', height: 10, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '80%', height: 22, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
      {/* Chart row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 4, marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '100%', height: 210, borderRadius: 8 }} />
        </div>
        <div className="card">
          <div className="skeleton" style={{ width: '50%', height: 14, borderRadius: 4, marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '100%', height: 170, borderRadius: 8 }} />
        </div>
      </div>
      {/* Bottom row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem' }}>
        <div className="card">
          <div className="skeleton" style={{ width: '35%', height: 14, borderRadius: 4, marginBottom: '1rem' }} />
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ marginBottom: '0.875rem' }}>
              <div className="skeleton" style={{ width: '100%', height: 8, borderRadius: 4, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '100%', height: 6, borderRadius: 4 }} />
            </div>
          ))}
        </div>
        <div className="hero-card" style={{ opacity: 0.4 }} />
      </div>
    </AppLayout>
  );
}
