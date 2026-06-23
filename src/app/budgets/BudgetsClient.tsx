'use client';
// src/app/budgets/BudgetsClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addBudget, editBudget, deleteBudget } from '@/lib/actions/budgets';
import { SmartUpload } from '@/components/SmartUpload';
import { fmtAdaptive } from '@/lib/format';
import { Plus, Trash2, Loader2, X, FileDown, LayoutGrid } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';

type Budget = { id: string; name: string; category: string; icon: string; limit: number; spent: number; period: string; rollover?: boolean };
type Category = { id: string; name: string; type: string };

function budgetStyle(limit: number, spent: number) {
  const pct = Math.min(100, limit > 0 ? (spent / limit) * 100 : 0);
  if (pct >= 100) return { barColor:'var(--color-expense)',  badge:'badge-danger',  label:'Over Budget', numColor:'var(--color-expense)',  borderColor:'var(--color-expense)',  glow:'rgba(220,38,38,0.35)',  pct:100 };
  if (pct >= 80)  return { barColor:'var(--warning)', badge:'badge-warning', label:'Warning',     numColor:'var(--warning)', borderColor:'var(--warning)', glow:'rgba(217,119,6,0.3)',   pct };
  return               { barColor:'var(--color-income)', badge:'badge-success', label:'On Track',    numColor:'var(--color-income)', borderColor:'var(--color-income)', glow:'rgba(22,163,74,0.3)',   pct };
}

function BudgetModal({ budget, categories, currency, onClose }: { budget?: Budget; categories: Category[]; currency: string; onClose: () => void }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name, setName]             = useState(budget?.name ?? '');
  const [categoryId, setCategoryId] = useState(''); // Need to map budget.category to categoryId later if we want proper edit, for now leave as is or find it
  const [limitAmt, setLimitAmt]     = useState(budget ? String(toMajor(budget.limit)) : '');
  const [period, setPeriod]         = useState(budget?.period ?? 'monthly');
  const [rollover, setRollover]     = useState(budget?.rollover ?? false);
  const expenseCats = categories.filter(c => c.type === 'expense');
  const isEdit = Boolean(budget);

  // set initial categoryId if editing
  useState(() => {
    if (budget) {
      const cat = categories.find(c => c.name === budget.category);
      if (cat) setCategoryId(cat.id);
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { setError('Please select a category.'); return; }
    // Finance app invariant: a budget with a NaN or zero limit is meaningless and misleading.
    const parsedLimit = parseFloat(limitAmt);
    if (!limitAmt || !isFinite(parsedLimit) || parsedLimit <= 0) {
      setError('Please enter a valid positive budget limit.'); return;
    }
    setLoading(true); setError('');
    try {
      if (isEdit && budget) {
        await editBudget(budget.id, { name, categoryId, limitAmountMinor: toMinor(parseFloat(limitAmt)), period: period as 'monthly' | 'yearly', rollover });
      } else {
        await addBudget({ name, categoryId, limitAmountMinor: toMinor(parseFloat(limitAmt)), period, rollover });
      }
      startT(() => router.refresh()); onClose();
    } catch (err: any) { setError(err.message ?? 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:440, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>{isEdit ? 'Edit Budget' : 'Add Budget'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--color-expense-light)', color:'var(--color-expense)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Budget Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Monthly Groceries" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Category</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Select…</option>
                {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Period</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Monthly Limit ({currency})</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} type="number" min="1" step="1" value={limitAmt} onChange={e => setLimitAmt(e.target.value)} required placeholder="5000" />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.25rem' }}>
            <input type="checkbox" id="rollover" checked={rollover} onChange={e => setRollover(e.target.checked)} style={{ cursor:'pointer' }} />
            <label htmlFor="rollover" style={{ fontSize:'0.8rem', color:'var(--text-secondary)', cursor:'pointer' }}>
              <strong>Strict Envelope</strong> (carry unspent amount to next period)
            </label>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem', marginTop:'0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : (isEdit ? 'Save Changes' : 'Create Budget')}
          </button>
        </form>
      </div>
    </div>
  );
}

export function BudgetsClient({ budgets, categories, totalBudgeted, totalSpent, period, currency }: {
  budgets: Budget[]; categories: Category[];
  totalBudgeted: number; totalSpent: number; period: string; currency: string;
}) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,    setShowAdd]    = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const overBudget = budgets.filter(b => b.spent >= b.limit).length;
  const onTrack    = budgets.filter(b => b.limit > 0 && (b.spent / b.limit) < 0.8).length;
  const overallPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;
  const overallStatus = overallPct >= 100 ? { color:'var(--color-expense)', bar:'var(--color-expense)' } : overallPct >= 80 ? { color:'var(--warning)', bar:'var(--warning)' } : { color:'var(--color-income)', bar:'var(--color-income)' };

  async function handleDelete(id: string) {
    if (!confirm('Delete this budget?')) return;
    setDeletingId(id);
    try {
      await deleteBudget(id);
      startT(() => router.refresh());
    } catch {
      // non-critical
    } finally { setDeletingId(null); }
  }

  return (
    <>
      {showAdd && <BudgetModal categories={categories} currency={currency} onClose={() => setShowAdd(false)} />}
      {editBudget && <BudgetModal budget={editBudget} categories={categories} currency={currency} onClose={() => setEditBudget(null)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <div/>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={() => setShowUpload(v => !v)}><FileDown size={13}/> Import</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Budget</button>
        </div>
      </div>

      {showUpload && (
        <div className="card mb-5 animate-in">
          <div style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', marginBottom:'0.75rem' }}>
            <strong style={{ color:'var(--color-text-primary)' }}>Import bank statement</strong> — AI parses your PDF, CSV or screenshot.
          </div>
          <SmartUpload onDone={() => setShowUpload(false)} />
        </div>
      )}

      {/* Hero — matches dashboard exactly */}
      <div className="dashboard-hero animate-in mb-5">
        <div className="dashboard-hero-grid">
          <div>
            <p className="hero-label">Total Budgeted</p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: totalBudgeted > 9_999_999 ? '1.6rem' : totalBudgeted > 999_999 ? '1.9rem' : '2.25rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color:'var(--color-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>{fmtAdaptive(totalBudgeted, currency)}</p>
            <p className="hero-sub">{fmtAdaptive(totalSpent, currency)} spent · {overallPct}% used</p>
            {/* Overall progress bar */}
            <div className="hero-progress-wrap" style={{ marginTop:'0.75rem', paddingTop:'0.75rem' }}>
              <div className="hero-progress-labels">
                <span className="hero-progress-label">Overall spend</span>
                <span className="hero-progress-val tabular" style={{ color: overallStatus.color }}>{overallPct}%</span>
              </div>
              <div className="hero-progress-track">
                <div className="hero-progress-bar" style={{ width:`${overallPct}%`, backgroundColor: overallStatus.bar }}/>
              </div>
            </div>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">Budgets</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-text-primary)' }}>{budgets.length}</p>
              <p className="hero-sub">total</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">On Track</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-income)' }}>{onTrack}</p>
              <p className="hero-sub">under 80%</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Over Budget</p>
              <p className="hero-stat-value tabular" style={{ color: overBudget > 0 ? 'var(--color-expense)' : 'var(--color-text-primary)' }}>{overBudget}</p>
              <p className="hero-sub">{overBudget > 0 ? 'needs action' : 'all clear'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget cards */}
      {budgets.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--color-text-secondary)' }}>
          <LayoutGrid size={40} style={{ margin:'0 auto 0.75rem', opacity:0.4 }}/>
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
              <div key={b.id} className={`card animate-in delay-${(i % 4) + 1}`}
                style={{ borderTop:`3px solid ${st.borderColor}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--color-text-primary)' }}>
                      {b.name}
                      {b.rollover && <span className="badge" style={{ marginLeft:'0.5rem', background:'var(--surface-card)', border:'1px solid var(--border-color)', color:'var(--color-text-secondary)' }}>Envelope</span>}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', marginTop:'0.1rem', textTransform:'capitalize' }}>{b.category} · {b.period}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <button onClick={() => setEditBudget(b)} 
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.2rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.2rem' }}>
                      {deletingId === b.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={13}/>}
                    </button>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div style={{ minWidth:0, flex:1, marginRight:'0.5rem' }}>
                    <div style={{
                      fontFamily:'Space Grotesk,sans-serif',
                      fontSize: b.spent > 9_999_999 ? '1.1rem' : b.spent > 999_999 ? '1.25rem' : '1.5rem',
                      fontWeight:800, color:st.numColor, letterSpacing:'-0.04em', lineHeight:1.1,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{fmtAdaptive(b.spent, currency)}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>of {fmtAdaptive(b.limit, currency)}</div>
                  </div>
                  <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'2rem', fontWeight:800, color:st.numColor, letterSpacing:'-0.05em', lineHeight:1, opacity:0.8, flexShrink:0 }}>
                    {Math.round(st.pct)}%
                  </div>
                </div>
                <div className="progress-track mb-3" style={{ height:8 }}>
                  <div className="progress-fill" style={{ width:`${st.pct}%`, background:st.barColor, boxShadow:`0 0 8px ${st.glow}` }}/>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', flex:1, marginRight:'0.5rem' }}>
                    {rem > 0 ? `${fmtAdaptive(rem, currency)} left` : `${fmtAdaptive(b.spent - b.limit, currency)} over`}
                  </span>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:st.numColor, flexShrink:0 }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
