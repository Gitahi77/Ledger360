'use client';
// src/app/budgets/BudgetsClient.tsx
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addBudget, deleteBudget } from '@/lib/actions/budgets';
import { SmartUpload } from '@/components/SmartUpload';
import { Plus, Trash2, Loader2, X, FileDown } from 'lucide-react';

type Budget = {
  id: string; name: string; category: string; icon: string;
  limit: number; spent: number; period: string;
};
type Category = { id: string; name: string; type: string };

/* ── Status helper ────────────────────────────────────────── */
function budgetStyle(limit: number, spent: number) {
  const pct = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
  if (pct >= 100) return {
    barGrad: 'linear-gradient(90deg,#DC2626,#EF4444)', badge: 'badge-danger',
    label: 'Over Budget', numColor: '#DC2626', glow: 'rgba(220,38,38,0.5)', pct: 100,
  };
  if (pct >= 80) return {
    barGrad: 'linear-gradient(90deg,#D97706,#F59E0B)', badge: 'badge-warning',
    label: 'Warning', numColor: '#D97706', glow: 'rgba(217,119,6,0.4)', pct,
  };
  return {
    barGrad: 'linear-gradient(90deg,#16A34A,#4ADE80)', badge: 'badge-success',
    label: 'On Track', numColor: '#16A34A', glow: 'rgba(22,163,74,0.4)', pct,
  };
}

/* ── Add Budget Modal ─────────────────────────────────────── */
function AddBudgetModal({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name,       setName]       = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [limitAmt,   setLimitAmt]   = useState('');
  const [period,     setPeriod]     = useState('monthly');

  const expenseCats = categories.filter(c => c.type === 'expense');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { setError('Please select a category.'); return; }
    setLoading(true); setError('');
    try {
      await addBudget({ name, categoryId, limitAmt: parseFloat(limitAmt), period });
      startT(() => router.refresh());
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:440, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>Add Budget</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--danger-light)', color:'var(--danger)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Budget Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Monthly Groceries" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Category</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Select…</option>
                {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Period</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Spending Limit (KES)</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              type="number" min="1" step="1" value={limitAmt} onChange={e => setLimitAmt(e.target.value)} required placeholder="0" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem', marginTop:'0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : 'Create Budget'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main Client Component ────────────────────────────────── */
export function BudgetsClient({ budgets, categories, totalBudgeted, totalSpent, period }: {
  budgets: Budget[]; categories: Category[];
  totalBudgeted: number; totalSpent: number; period: string;
}) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,    setShowAdd]    = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const overBudget = budgets.filter(b => b.spent >= b.limit).length;
  const onTrack    = budgets.filter(b => (b.spent / b.limit) < 0.8).length;
  const warning    = budgets.length - overBudget - onTrack;
  const overallPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;

  async function handleDelete(id: string) {
    if (!confirm('Delete this budget?')) return;
    setDeletingId(id);
    await deleteBudget(id);
    startT(() => router.refresh());
    setDeletingId(null);
  }

  return (
    <>
      {showAdd && <AddBudgetModal categories={categories} onClose={() => setShowAdd(false)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <div />
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={() => setShowUpload(v => !v)} title="Import transactions from bank statement">
            <FileDown size={13} /> Import
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Budget</button>
        </div>
      </div>

      {showUpload && (
        <div className="card mb-5 animate-in">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Import bank statement</strong> — AI parses your PDF, CSV or screenshot and creates transactions, which automatically update your budget spend.
          </div>
          <SmartUpload onDone={() => setShowUpload(false)} />
        </div>
      )}

      {/* Hero Banner */}
      <div className="animate-in mb-5" style={{
        borderRadius:12,
        background:'linear-gradient(135deg, #D97706 0%, #7C3AED 55%, #0070F3 100%)',
        boxShadow:'0 10px 32px rgba(217,119,6,0.28)',
        padding:'1.375rem 1.5rem',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:'1rem', alignItems:'center', position:'relative' }}>
          <div>
            <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.55)', marginBottom:'0.3rem' }}>Total Budgeted</p>
            <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.04em', color:'white', lineHeight:1 }}>KES {totalBudgeted.toLocaleString()}</p>
            <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', marginTop:'0.25rem' }}>KES {totalSpent.toLocaleString()} spent · {overallPct}% used</p>
          </div>
          {[
            { label:'Budgets',    value:`${budgets.length}`, sub:'total'       },
            { label:'On Track',   value:`${onTrack}`,         sub:'under 80%'  },
            { label:'Over Budget',value:`${overBudget}`,      sub:'needs action'},
          ].map(k => (
            <div key={k.label} style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:10, padding:'0.75rem 1rem' }}>
              <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.55)', marginBottom:'0.2rem' }}>{k.label}</p>
              <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'white', lineHeight:1 }}>{k.value}</p>
              <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', marginTop:'0.1rem' }}>{k.sub}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.35rem' }}>
            <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Overall spend</span>
            <span style={{ fontSize:'0.68rem', color:'white', fontWeight:700, fontFamily:'Space Grotesk,sans-serif' }}>{overallPct}% of budget used</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.18)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${overallPct}%`, background: overallPct >= 100 ? '#F87171' : overallPct >= 80 ? '#FCD34D' : '#4ADE80', borderRadius:999, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>
      </div>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>💰</div>
          <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>No budgets yet</div>
          <div style={{ fontSize:'0.78rem', marginBottom:'1rem' }}>Create your first budget to start tracking spending</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Create Budget</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.125rem' }}>
          {budgets.map((b, i) => {
            const st  = budgetStyle(b.limit, b.spent);
            const rem = Math.max(0, b.limit - b.spent);
            return (
              <div key={b.id} className={`card animate-in delay-${(i % 4) + 1}`} style={{ borderTop:`3px solid ${st.numColor}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>{b.name}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.1rem', textTransform:'capitalize' }}>{b.category} · {b.period}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.2rem' }}>
                      {deletingId === b.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={13}/>}
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.5rem', fontWeight:800, color:st.numColor, letterSpacing:'-0.04em', lineHeight:1.1 }}>
                      KES {b.spent.toLocaleString()}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>of KES {b.limit.toLocaleString()}</div>
                  </div>
                  <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'2rem', fontWeight:800, color:st.numColor, letterSpacing:'-0.05em', lineHeight:1, opacity:0.88 }}>
                    {Math.round(st.pct)}%
                  </div>
                </div>

                <div className="progress-track mb-3" style={{ height:8 }}>
                  <div className="progress-fill" style={{ width:`${st.pct}%`, background:st.barGrad, boxShadow:`0 0 10px ${st.glow}` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontWeight:500 }}>
                    {rem > 0 ? `KES ${rem.toLocaleString()} left` : `KES ${(b.spent - b.limit).toLocaleString()} over`}
                  </span>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:st.numColor }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
