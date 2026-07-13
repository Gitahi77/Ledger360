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
import { getErrorMessage } from '@/lib/format';

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
    } catch (err: unknown) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'none' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:440, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>{isEdit ? 'Edit Budget' : 'Add Budget'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--color-expense-light)', color:'var(--color-expense)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Budget Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Monthly Groceries" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Category</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Select…</option>
                {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Period</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Monthly Limit ({currency})</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} type="number" min="1" step="1" value={limitAmt} onChange={e => setLimitAmt(e.target.value)} required placeholder="5000" />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.25rem' }}>
            <input type="checkbox" id="rollover" checked={rollover} onChange={e => setRollover(e.target.checked)} style={{ cursor:'pointer' }} />
            <label htmlFor="rollover" style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)', cursor:'pointer' }}>
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

export function BudgetsClient({ budgets = [], categories = [], totalBudgeted = 0, totalSpent = 0, currency, period }: {
  budgets: Budget[]; categories: Category[];
  totalBudgeted: number; totalSpent: number; currency: string; period?: string;
}) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,    setShowAdd]    = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const safeBudgets = budgets || [];
  const overBudget = safeBudgets.filter(b => b.spent >= b.limit).length;
  const onTrack    = safeBudgets.filter(b => b.limit > 0 && (b.spent / b.limit) < 0.8).length;
  const overallPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;
  const overallStatus = overallPct >= 100 ? { color:'var(--color-expense)', bar:'linear-gradient(90deg, var(--color-expense), hsl(0,78%,72%))' } : overallPct >= 80 ? { color:'var(--warning)', bar:'linear-gradient(90deg, var(--warning), hsl(38,92%,68%))' } : { color:'var(--color-income)', bar:'linear-gradient(90deg, var(--color-income), hsl(152,65%,62%))' };

  async function handleDelete(id: string) {
    if (!confirm('Delete this budget?')) return;
    setDeletingId(id);
    try {
      await deleteBudget(id);
      startT(() => router.refresh());
    } catch {
      // silent
    } finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showAdd && <BudgetModal categories={categories} currency={currency} onClose={() => setShowAdd(false)} />}
      {editBudget && <BudgetModal budget={editBudget} categories={categories} currency={currency} onClose={() => setEditBudget(null)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div/>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline hover:bg-[var(--surface-sunken)] transition-colors duration-300" onClick={() => setShowUpload(v => !v)}><FileDown size={14}/> Import</button>
          <button 
            className="btn btn-primary shadow-sm hover:shadow-md transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, var(--color-brand), hsl(220, 80%, 65%))', border: 'none' }} 
            onClick={() => setShowAdd(true)}
          >
            <Plus size={14}/> Add Budget
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="rounded-2xl shadow-sm p-6 mb-6 animate-in fade-in slide-in-from-top-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)', marginBottom:'1rem' }}>
            <strong style={{ color:'var(--color-text-primary)' }}>Import bank statement</strong> — AI parses your PDF, CSV or screenshot.
          </div>
          <SmartUpload onDone={() => setShowUpload(false)} />
        </div>
      )}

      {/* Hero — matches NetWorth/Loans style */}
      <div className="rounded-2xl shadow-md p-6 relative overflow-hidden mb-6 transition-all duration-300" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '150%', height: '200%', background: 'radial-gradient(circle at top left, rgba(22,163,74,0.04), transparent 50%)', pointerEvents: 'none' }} />
        
        <div className="dashboard-hero-grid relative z-10">
          <div>
            <p className="text-[0.8rem] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: overallStatus.color, color: overallStatus.color }}></span>
              Total Budgeted
            </p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: totalBudgeted > 9_999_999 ? '2.2rem' : totalBudgeted > 999_999 ? '2.5rem' : '3rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.1,
              color:'var(--color-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>{fmtAdaptive(totalBudgeted, currency)}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">{fmtAdaptive(totalSpent, currency)} spent · {overallPct}% used</p>
            
            {/* Overall progress bar */}
            <div className="mt-5" style={{ background: 'var(--surface-sunken)', padding: '0.35rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Spend</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: overallStatus.color }}>{overallPct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-app)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${overallPct}%`, background: overallStatus.bar, borderRadius: 4, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
            </div>
          </div>
          
          <div className="hero-stats-grid">
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)] hover:shadow-sm">
              <p className="hero-label">Budgets</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-text-primary)' }}>{safeBudgets.length}</p>
              <p className="hero-sub">total tracked</p>
            </div>
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)] hover:shadow-sm">
              <p className="hero-label">On Track</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-income)' }}>{onTrack}</p>
              <p className="hero-sub">under 80%</p>
            </div>
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)] hover:shadow-sm">
              <p className="hero-label">Over Budget</p>
              <p className="hero-stat-value tabular" style={{ color: overBudget > 0 ? 'var(--color-expense)' : 'var(--color-text-primary)' }}>{overBudget}</p>
              <p className="hero-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface-sunken)', padding: '0.1rem 0.4rem', borderRadius: 4, marginTop: '0.2rem' }}>
                {overBudget > 0 ? '⚠ Needs action' : '✓ All clear'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget cards */}
      {(!safeBudgets || safeBudgets.length === 0) ? (
        <div className="card shadow-sm" style={{ textAlign:'center', padding:'4rem 2rem', color:'var(--color-text-secondary)', border: '1px dashed var(--border)', background: 'transparent' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-sunken)', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            <LayoutGrid size={32} style={{ opacity:0.7 }}/>
          </div>
          <div style={{ fontWeight:700, fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom:'0.25rem' }}>No budgets yet</div>
          <div style={{ fontSize:'0.85rem', marginBottom:'1.5rem', maxWidth: 300, margin: '0 auto 1.5rem auto' }}>Create your first budget to start tracking spending and taking control of your money.</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14}/> Create Your First Budget</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'1rem' }}>
          {safeBudgets.map((b) => {
            const st  = budgetStyle(b.limit, b.spent);
            const rem = Math.max(0, b.limit - b.spent);
            return (
              <div key={b.id} className="card group transition-all duration-300 hover:shadow-md"
                style={{ borderTop:`4px solid ${st.borderColor}`, borderRadius: '16px', padding:0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div style={{ width:42, height:42, borderRadius:12, background: 'var(--surface-sunken)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '1.2rem' }}>{b.icon || '📦'}</span>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {b.name}
                          {b.rollover && <span className="px-1.5 py-0.5 rounded-md bg-[var(--surface-sunken)] text-[var(--color-text-secondary)] text-[0.6rem] font-bold uppercase tracking-wider border border-[var(--border)]">Envelope</span>}
                        </div>
                        <div style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', marginTop:'0.15rem', textTransform:'capitalize', fontWeight: 500 }}>{b.category} · {b.period}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditBudget(b)} 
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all" aria-label="Edit Budget">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                      <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50" aria-label="Delete Budget">
                        {deletingId === b.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mb-4 bg-[var(--surface-sunken)] p-3 rounded-xl border border-border/50">
                    <div style={{ minWidth:0, flex:1, marginRight:'0.5rem' }}>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Spent</div>
                      <div style={{
                        fontFamily:'Space Grotesk,sans-serif',
                        fontSize: b.spent > 9_999_999 ? '1.4rem' : b.spent > 999_999 ? '1.6rem' : '1.8rem',
                        fontWeight:800, color:st.numColor, letterSpacing:'-0.04em', lineHeight:1.1,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>{fmtAdaptive(b.spent, currency)}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', marginTop:'0.2rem' }}>of {fmtAdaptive(b.limit, currency)}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.4rem', fontWeight:800, color:st.numColor, lineHeight:1, padding: '0.3rem', background: 'var(--card)', borderRadius: 8 }}>{Math.round(st.pct)}%</div>
                    </div>
                  </div>
                  
                  <div className="mb-4 bg-[var(--surface-sunken)] rounded-full overflow-hidden border border-border/50" style={{ height: 6 }}>
                    <div style={{ height: '100%', width:`${st.pct}%`, background:st.barColor, boxShadow:`0 0 10px ${st.glow}`, borderRadius: 4, transition: 'width 1s ease' }}/>
                  </div>
                  
                  <div className="flex items-center justify-between px-1">
                    <span style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', flex:1, marginRight:'0.5rem' }}>
                      {rem > 0 ? `${fmtAdaptive(rem, currency)} left` : `${fmtAdaptive(b.spent - b.limit, currency)} over`}
                    </span>
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
