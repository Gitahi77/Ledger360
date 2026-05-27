'use client';
// src/app/transactions/TransactionsClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SmartUpload } from '@/components/SmartUpload';
import { addTransaction, deleteTransaction } from '@/lib/actions/transactions';
import { fmtAdaptive } from '@/lib/format';
import { Plus, FileDown, X, Loader2 } from 'lucide-react';
import { TransactionRow } from '@/components/finance/TransactionRow';

type Tx = {
  id: string; name: string; amount: number; type: string;
  date: Date; note: string | null;
  category: { id: string; name: string; icon: string | null };
};
type Category = { id: string; name: string; type: string; icon: string | null };

interface Props {
  transactions: Tx[];
  categories: Category[];
  totalIncome: number;
  totalExpense: number;
  period: string;
  typeFilter: string;
}

const PERIOD_LABELS: Record<string, string> = {
  'this-week':  'This Week',
  'this-month': 'This Month',
  'this-year':  'This Year',
};

function AddTransactionModal({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name,       setName]       = useState('');
  const [amount,     setAmount]     = useState('');
  const [type,       setType]       = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [date,       setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [note,       setNote]       = useState('');

  const filteredCats = categories.filter(c => c.type === type || c.type === 'savings');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { setError('Please select a category.'); return; }
    setLoading(true); setError('');
    try {
      await addTransaction({ name, amount: parseFloat(amount), type, categoryId, date, note });
      startT(() => router.refresh());
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:460, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>Add Transaction</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--danger-light)', color:'var(--danger)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div className="segmented-control" style={{ width:'100%' }}>
            {(['expense', 'income'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                className={`segmented-btn ${type === t ? 'active' : ''}`} style={{ flex:1, justifyContent:'center' }}>
                {t === 'income' ? '+ Income' : '− Expense'}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Description</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Naivas Grocery" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Amount (KES)</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Category</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Select…</option>
                {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Date</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Note <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span></label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. May salary" />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem', marginTop:'0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TransactionsClient({ transactions, categories, totalIncome, totalExpense, period, typeFilter }: Props) {
  const router     = useRouter();
  const params     = useSearchParams();
  const [, startT] = useTransition();
  const net        = totalIncome - totalExpense;
  const netPositive = net >= 0;

  const [showAdd,    setShowAdd]    = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function setParam(key: string, value: string) {
    startT(() => {
      const next = new URLSearchParams(params.toString());
      next.set(key, value);
      router.push(`?${next.toString()}`);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    setDeletingId(id);
    await deleteTransaction(id);
    startT(() => router.refresh());
    setDeletingId(null);
  }

  const periodLabel = PERIOD_LABELS[period] ?? 'This Period';

  return (
    <>
      {showAdd && <AddTransactionModal categories={categories} onClose={() => setShowAdd(false)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3 animate-in">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="segmented-control">
            {(['all', 'income', 'expense'] as const).map(v => (
              <button key={v} onClick={() => setParam('type', v)} className={`segmented-btn ${typeFilter === v ? 'active' : ''}`}>
                {v === 'all' ? 'All' : v === 'income' ? 'Income' : 'Expenses'}
              </button>
            ))}
          </div>
          <div className="segmented-control">
            {(['this-week', 'this-month', 'this-year'] as const).map(v => (
              <button key={v} onClick={() => setParam('period', v)} className={`segmented-btn ${period === v ? 'active' : ''}`}>
                {v === 'this-week' ? 'Week' : v === 'this-month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={() => setShowUpload(v => !v)}><FileDown size={13}/> Import</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Entry</button>
        </div>
      </div>

      {showUpload && <div className="card mb-5 animate-in"><SmartUpload /></div>}

      {/* Summary Hero — matches dashboard style exactly */}
      <div className="dashboard-hero animate-in delay-1 mb-5">
        <div className="dashboard-hero-grid">
          {/* Primary: Net Balance */}
          <div>
            <p className="hero-label">Net Balance · {periodLabel}</p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: Math.abs(net) > 9_999_999 ? '1.6rem' : Math.abs(net) > 999_999 ? '1.9rem' : '2.25rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color: netPositive ? 'var(--success)' : 'var(--danger)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {netPositive ? '+' : '−'}{fmtAdaptive(Math.abs(net))}
            </p>
            <p className="hero-sub">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} in period</p>
          </div>

          {/* Stat cards */}
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">{periodLabel} Income</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--success)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>+{fmtAdaptive(totalIncome)}</p>
              <p className="hero-sub">↑ coming in</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">{periodLabel} Expenses</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--danger)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>−{fmtAdaptive(totalExpense)}</p>
              <p className="hero-sub">↓ going out</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Transactions</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--text-primary)' }}>{transactions.length}</p>
              <p className="hero-sub">in period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="card animate-in delay-2">
        {transactions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📭</div>
            <div style={{ fontWeight:600 }}>No transactions in this period</div>
            <div style={{ fontSize:'0.78rem', marginTop:'0.25rem' }}>Try a different period or add a new entry</div>
            <button className="btn btn-primary" style={{ marginTop:'1rem' }} onClick={() => setShowAdd(true)}>
              <Plus size={13}/> Add Transaction
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            {transactions.map(tx => (
              <TransactionRow
                key={tx.id}
                title={tx.name}
                subtitle={tx.note ? `${tx.category.name} • ${tx.note}` : tx.category.name}
                amount={tx.amount}
                icon={<CategoryIcon category={tx.category.icon ?? tx.category.name.toLowerCase()} name={tx.name} size={18}/>}
                state={tx.type === 'pending' ? 'pending' : undefined}
                onDelete={() => handleDelete(tx.id)}
                isDeleting={deletingId === tx.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
