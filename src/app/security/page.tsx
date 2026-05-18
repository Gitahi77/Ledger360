import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppLayout } from '@/components/layout/AppLayout';
import { ShieldCheck, History, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default async function SecurityPage() {
  const user = await requireAuth();

  const logs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <AppLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--success-light)', padding: '0.75rem', borderRadius: 12 }}>
            <ShieldCheck size={28} color="var(--success)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Security & Activity</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Enterprise-grade audit log of your account actions</p>
          </div>
        </header>

        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
              <History size={18} /> Recent Activity
            </h3>
          </div>
          <div style={{ padding: '1rem' }}>
            {logs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No activity logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {logs.map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span className={`badge ${log.action === 'DELETE' ? 'badge-red' : log.action === 'CREATE' ? 'badge-success' : 'badge-blue'}`}>
                          {log.action}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{log.resource}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {log.metadata ? JSON.stringify(JSON.parse(log.metadata)).slice(0, 80) + '...' : 'System Action'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                      <div style={{ fontSize: '0.75rem' }}>{format(new Date(log.createdAt), 'h:mm a')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
