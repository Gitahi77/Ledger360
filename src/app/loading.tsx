import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Loading() {
  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} color="var(--primary)" style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Loading Dashboard...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fetching the latest data</p>
      </div>
    </AppLayout>
  );
}
