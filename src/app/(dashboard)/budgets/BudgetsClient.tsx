'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addBudget, editBudget, deleteBudget } from '@/lib/actions/budgets';
import { SmartUpload } from '@/components/SmartUpload';
import { toMinor, toMajor } from '@/lib/money';
import { getErrorMessage } from '@/lib/errors';
import { Plus, X, FileDown, LayoutGrid, Loader2 } from 'lucide-react';
import { generateBudgetIntelligence, BudgetWithPacing } from './intelligence';
import { BudgetCommandCenterHero } from '@/components/finance/primitives/budget-command-center-hero';
import { BudgetCard } from '@/components/finance/primitives/budget-card';

type Category = { id: string; name: string; type: string };

function BudgetModal({ budget, categories, currency, onClose }: { budget?: BudgetWithPacing; categories: Category[]; currency: string; onClose: () => void }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name, setName]             = useState(budget?.name ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [limitAmt, setLimitAmt]     = useState(budget ? String(toMajor(budget.limit)) : '');
  const [period, setPeriod]         = useState(budget?.period ?? 'monthly');
  const [rollover, setRollover]     = useState(budget?.rollover ?? false);
  const expenseCats = categories.filter(c => c.type === 'expense');
  const isEdit = Boolean(budget);

  useState(() => {
    if (budget) {
      const cat = categories.find(c => c.name === budget.category);
      if (cat) setCategoryId(cat.id);
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { setError('Please select a category.'); return; }
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
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={period} onChange={e => setPeriod(e.target.value as 'weekly'|'monthly'|'yearly')}>
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

export function BudgetsClient({ budgets = [], categories = [], totalBudgeted = 0, totalSpent = 0, currency, income = 0 }: {
  budgets: BudgetWithPacing[]; categories: Category[];
  totalBudgeted: number; totalSpent: number; currency: string; period?: string; income?: number;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editBudgetState, setEditBudgetState] = useState<BudgetWithPacing | null>(null);

  const intelligence = generateBudgetIntelligence(budgets, currency);

  const needsAttention = budgets.filter(b => b.status === 'exceeded' || b.status === 'critical' || b.status === 'warning' || b.pacing.isAheadOfSchedule).sort((a, b) => b.percentage - a.percentage);
  const healthyBudgets = budgets.filter(b => !needsAttention.find(na => na.id === b.id));

  const handleAction = (actionId: string, budgetId: string) => {
    if (actionId === 'edit') {
      const b = budgets.find(b => b.id === budgetId);
      if (b) setEditBudgetState(b);
    } else if (actionId === 'review' || actionId === 'reduce') {
      router.push(`/transactions?categoryId=${budgets.find(b => b.id === budgetId)?.category}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showAdd && <BudgetModal categories={categories} currency={currency} onClose={() => setShowAdd(false)} />}
      {editBudgetState && <BudgetModal budget={editBudgetState} categories={categories} currency={currency} onClose={() => setEditBudgetState(null)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight font-heading text-foreground">Budget Command Center</h1>
        <div className="flex items-center gap-3">
          <button className="btn btn-outline hover:bg-secondary transition-colors" onClick={() => setShowUpload(v => !v)}>
            <FileDown size={14}/> Import
          </button>
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
        <div className="rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-top-4 bg-card border border-border">
          <div className="text-[0.85rem] text-muted-foreground mb-4">
            <strong className="text-foreground">Import bank statement</strong> — AI parses your PDF, CSV or screenshot.
          </div>
          <SmartUpload onDone={() => setShowUpload(false)} />
        </div>
      )}

      {/* Hero Intelligence */}
      <BudgetCommandCenterHero 
        intelligence={intelligence} 
        currency={currency} 
        totalCapacity={totalBudgeted} 
        totalSpent={totalSpent}
        income={income}
      />

      {budgets.length === 0 ? (
        <div className="card shadow-sm border border-dashed border-border bg-transparent text-center p-16 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
            <LayoutGrid size={32} className="opacity-70" />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-1">No budgets yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">Create your first budget to start tracking spending and taking control of your money.</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14}/> Create Your First Budget</button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Needs Attention Section */}
          {needsAttention.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(220,38,38,0.5)]"></span>
                Needs Attention
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {needsAttention.map(b => (
                  <BudgetCard key={b.id} budget={b} currency={currency} onAction={handleAction} />
                ))}
              </div>
            </div>
          )}

          {/* Healthy Budgets Section */}
          {healthyBudgets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(22,163,74,0.5)]"></span>
                Healthy Budgets
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthyBudgets.map(b => (
                  <BudgetCard key={b.id} budget={b} currency={currency} onAction={handleAction} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
