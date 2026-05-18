'use client';
// src/app/transactions/TransactionsClient.tsx
// Handles filters, Add modal, and delete — receives server-fetched data as props.
import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryIcon } from '@/components/CategoryIcon';
import { SmartUpload } from '@/components/SmartUpload';
import { addTransaction, deleteTransaction } from '@/lib/actions/transactions';
import { Plus, FileDown, Trash2, X, Loader2 } from 'lucide-react';

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

/* ── Period label ─────────────────────────────────────────── */
const PERIOD_LABELS: Record<string, string> = {
  'this-week':  'This Week',
  'this-month': 'This Month',
  'this-year':  'This Year',
};

/* ── Add Transaction Modal ────────────────────────────────── */
function AddTransactionModal({
  categories, onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
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

  const filteredCats = categories.filter(c =>
    c.type === type || c.type === 'savings'
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) { setError('Please select a category.'); return; }
    setLoading(true);
    setError('');
    try {
      await addTransaction({
        name, amount: parseFloat(amount), type, categoryId, date, note,
      });
      startT(() => router.refresh());
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 460, padding: '1.75rem', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom: 0 }}>Add Transaction</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.625rem 0.875rem', borderRadius: 7, background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Type toggle */}
          <div className="segmented-control" style={{ width: '100%' }}>
            {(['expense', 'income'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                className={`segmented-btn ${type === t ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}>
                {t === 'income' ? '+ Income' : '− Expense'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Description</label>
              <input className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Naivas Grocery" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Amount (KES)</label>
              <input className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Category</label>
              <select className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                <option value="">Select…</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Date</label>
              <input className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Note <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <input className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
              value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. May salary" />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', marginTop: '0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : `Save ${type === 'income' ? 'Income' : 'Expense'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main client component ────────────────────────────────── */
export function TransactionsClient({ transactions, categories, totalIncome, totalExpense, period, typeFilter }: Props) {
  const router     = useRouter();
  const params     = useSearchParams();
  const [, startT] = useTransition();
  const net        = totalIncome - totalExpense;

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
      {/* Modals */}
      {showAdd && (
        <AddTransactionModal
          categories={categories}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3 animate-in">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="segmented-control">
            {(['all', 'income', 'expense'] as const).map(v => (
              <button key={v} onClick={() => setParam('type', v)}
                className={`segmented-btn ${typeFilter === v ? 'active' : ''}`}>
                {v === 'all' ? 'All' : v === 'income' ? 'Income' : 'Expenses'}
              </button>
            ))}
          </div>
          <div className="segmented-control">
            {(['this-week', 'this-month', 'this-year'] as const).map(v => (
              <button key={v} onClick={() => setParam('period', v)}
                className={`segmented-btn ${period === v ? 'active' : ''}`}>
                {v === 'this-week' ? 'Week' : v === 'this-month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={() => setShowUpload(v => !v)} title="Import from bank statement">
            <FileDown size={13} /> Import
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Add Entry
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="card mb-5 animate-in"><SmartUpload /></div>
      )}

      {/* Summary Hero Banner — Goals-style */}
      <div className="animate-in delay-1 mb-5" style={{
        borderRadius: 12,
        background: net >= 0
          ? 'linear-gradient(135deg, #16A34A 0%, #0070F3 60%, #0F766E 100%)'
          : 'linear-gradient(135deg, #DC2626 0%, #7C3AED 55%, #0F766E 100%)',
        boxShadow: net >= 0
          ? '0 10px 32px rgba(22,163,74,0.28)'
          : '0 10px 32px rgba(220,38,38,0.28)',
        padding: '1.375rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />

        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:'1rem', alignItems:'center', position:'relative' }}>
          {/* Primary — Net Balance */}
          <div>
            <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.55)', marginBottom:'0.3rem' }}>
              Net Balance · {periodLabel}
            </p>
            <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.04em', color: net >= 0 ? '#4ADE80' : '#FCA5A5', lineHeight:1 }}>
              {net >= 0 ? '+' : '−'}KES {Math.abs(net).toLocaleString()}
            </p>
            <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', marginTop:'0.25rem' }}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} in period
            </p>
          </div>

          {/* Frosted glass — Income */}
          <div style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:10, padding:'0.75rem 1rem' }}>
            <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.55)', marginBottom:'0.2rem' }}>{periodLabel} Income</p>
            <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#4ADE80', lineHeight:1, letterSpacing:'-0.03em' }}>
              +KES {totalIncome.toLocaleString()}
            </p>
            <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', marginTop:'0.15rem' }}>↑ coming in</p>
          </div>

          {/* Frosted glass — Expenses */}
          <div style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:10, padding:'0.75rem 1rem' }}>
            <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.55)', marginBottom:'0.2rem' }}>{periodLabel} Expenses</p>
            <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.3rem', fontWeight:800, color:'#F87171', lineHeight:1, letterSpacing:'-0.03em' }}>
              −KES {totalExpense.toLocaleString()}
            </p>
            <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', marginTop:'0.15rem' }}>↓ going out</p>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="card animate-in delay-2">
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            <div style={{ fontWeight: 600 }}>No transactions in this period</div>
            <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Try a different period or add a new entry</div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowAdd(true)}>
              <Plus size={13} /> Add Transaction
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={tx.category.icon ?? tx.category.name.toLowerCase()} name={tx.name} size={14} />
                      <div className="min-w-0">
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{tx.name}</div>
                        {tx.note && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.note}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-blue'}`}>
                      {tx.category.name}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: '0.875rem', color: tx.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                    {tx.type === 'income' ? '+' : '−'}KES {tx.amount.toLocaleString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.25rem' }}
                      title="Delete transaction"
                    >
                      {deletingId === tx.id
                        ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Trash2 size={13} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
