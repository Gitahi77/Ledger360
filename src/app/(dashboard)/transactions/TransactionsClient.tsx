'use client';
// src/app/transactions/TransactionsClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DynamicCategoryIcon } from '@/lib/icons';
import { SmartUpload } from '@/components/SmartUpload';
import { addTransaction, editTransaction, deleteTransaction } from '@/lib/actions/transactions';
import { createTransfer, editTransfer, deleteTransfer } from '@/lib/actions/transfers';
import { fmtAdaptive } from '@/lib/format';
import { Plus, FileDown, X, Loader2, Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';
import { TransactionRow } from '@/components/finance/TransactionRow';

type Tx = {
  id: string; name: string; baseAmountMinor: number; type: string;
  date: Date; note: string | null;
  category: { id: string; name: string; icon: string | null };
  fromAccountId?: string | null;
  toAccountId?: string | null;
  goalId?: string | null;
  loanId?: string | null;
  interestMinor?: number;
};
type Category = { id: string; name: string; type: string; icon: string | null };
type Account = { id: string; name: string };
type Goal = { id: string; name: string };
type Loan = { id: string; name: string; balanceMinor: number; annualRate: number };

interface Props {
  transactions: Tx[];
  categories: Category[];
  accounts: Account[];
  totalIncome: number;
  totalExpense: number;
  moneyOut: number;
  period: string;
  typeFilter: string;
  currency: string;
  goals: Goal[];
  loans: Loan[];
}

const PERIOD_LABELS: Record<string, string> = {
  'this-week':  'This Week',
  'this-month': 'This Month',
  'this-year':  'This Year',
};

function TransactionModal({ tx, categories, accounts, goals, loans, currency, onClose }: { tx?: Tx; categories: Category[]; accounts: Account[]; goals: Goal[]; loans: Loan[]; currency: string; onClose: (warning?: string) => void }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name,       setName]       = useState(tx?.name ?? '');
  const [amount,     setAmount]     = useState(tx ? (toMajor(tx.baseAmountMinor)).toString() : '');
  const [type,       setType]       = useState<'income' | 'expense' | 'transfer'>(tx ? (tx.type as 'income' | 'expense' | 'transfer') : 'expense');
  const [categoryId, setCategoryId] = useState(tx?.category.id ?? '');
  
  const initialAccountId = tx?.type === 'transfer' ? (tx.fromAccountId ?? accounts[0]?.id ?? '') : (('accountId' in (tx || {}) ? (tx as unknown as { accountId: string }).accountId : null) ?? accounts[0]?.id ?? '');
  const [accountId,  setAccountId]  = useState(initialAccountId);
  
  const [toAccountId,setToAccountId]= useState(tx?.toAccountId ?? '');
  const [goalId,     setGoalId]     = useState(tx?.goalId ?? '');
  const [loanId,     setLoanId]     = useState(tx?.loanId ?? '');
  const [interestAmount, setInterestAmount] = useState(tx && tx.interestMinor !== undefined && tx.interestMinor !== null ? (toMajor(tx.interestMinor)).toString() : '');
  const [date,       setDate]       = useState(tx ? new Date(tx.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [note,       setNote]       = useState(tx?.note ?? '');
  const isEdit = Boolean(tx);

  const filteredCats = categories.filter(c => c.type === type);

  useEffect(() => {
    if (loanId && !isEdit) {
      const selectedLoan = loans.find(l => l.id === loanId);
      if (selectedLoan) {
        const autoInterestMinor = Math.round(selectedLoan.balanceMinor * (selectedLoan.annualRate / 100) / 12);
        setInterestAmount((toMajor(autoInterestMinor)).toString());
      }
    } else if (!loanId) {
      setInterestAmount('');
    }
  }, [loanId, loans, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type !== 'transfer' && !categoryId) { setError('Please select a category.'); return; }
    if (type === 'transfer' && accountId === toAccountId) { setError('From and To accounts must be different.'); return; }
    if (type === 'transfer' && !loanId && !toAccountId) { setError('Please select a destination account or loan to repay.'); return; }

    setLoading(true); setError('');
    try {
      // Finance app invariant: NEVER store NaN or zero amounts.
      const parsedAmount = parseFloat(amount);
      if (!amount || !isFinite(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid positive amount.'); setLoading(false); return;
      }
      if (type === 'transfer' && loanId && interestAmount !== '') {
        const parsedInterest = parseFloat(interestAmount);
        if (!isFinite(parsedInterest) || parsedInterest < 0) {
          setError('Interest amount must be a valid number (0 or greater).'); setLoading(false); return;
        }
      }
      let warnMsg: string | undefined;
      if (type === 'transfer') {
        const intMinor = interestAmount !== '' ? toMinor(parseFloat(interestAmount)) : undefined;
        if (isEdit && tx) {
          await editTransfer(tx.id, { fromAccountId: accountId, toAccountId: loanId ? null : toAccountId, amountMinor: toMinor(parseFloat(amount)), date, note, goalId: goalId || null, loanId: loanId || null, interestMinor: intMinor });
        } else {
          await createTransfer({ fromAccountId: accountId, toAccountId: loanId ? null : toAccountId, amountMinor: toMinor(parseFloat(amount)), date, note, goalId: goalId || null, loanId: loanId || null, interestMinor: intMinor });
        }
      } else {
        if (isEdit && tx) {
          const res = await editTransaction(tx.id, { name, baseAmountMinor: toMinor(parseFloat(amount)), type, categoryId, accountId, date: new Date(date), note });
          warnMsg = res?.warning;
        } else {
          const res = await addTransaction({ name, baseAmountMinor: toMinor(parseFloat(amount)), type, categoryId, accountId, date, note });
          warnMsg = res?.warning;
        }
      }
      startT(() => router.refresh());
      onClose(warnMsg);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => onClose()}>
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border p-6 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={() => onClose()} className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"><X size={18}/></button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 p-3 mb-5 text-sm font-medium text-destructive bg-destructive/10 rounded-lg">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex p-1 bg-secondary rounded-lg">
            {(['expense', 'income', 'transfer'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  type === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {t === 'income' ? '+ Income' : t === 'expense' ? '− Expense' : '⇄ Transfer'}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {type !== 'transfer' && (
              <div className="flex-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</label>
                <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Naivas Grocery" />
              </div>
            )}
            <div className={type === 'transfer' ? 'w-full' : 'w-full sm:w-1/3'}>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount ({currency})</label>
              <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono"
                type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {type !== 'transfer' ? (
              <>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                    <option value="">Select…</option>
                    {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {categoryId && !filteredCats.find(c => c.id === categoryId) && categories.find(c => c.id === categoryId) && (
                      <option value={categoryId}>{categories.find(c => c.id === categoryId)!.name}</option>
                    )}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Account</label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    value={accountId} onChange={e => setAccountId(e.target.value)} required>
                    <option value="">Select Account…</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">From Account</label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    value={accountId} onChange={e => setAccountId(e.target.value)} required>
                    <option value="">Select From Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                {!loanId && (
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">To Account</label>
                    <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      value={toAccountId} onChange={e => setToAccountId(e.target.value)} required>
                      <option value="">Select To Account...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
                {goals.length > 0 && !loanId && (
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Goal to Fund (Optional)</label>
                    <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      value={goalId} onChange={e => setGoalId(e.target.value)}>
                      <option value="">None</option>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}
                {loans.length > 0 && !goalId && (
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Loan to Repay (Optional)</label>
                    <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      value={loanId} onChange={e => setLoanId(e.target.value)}>
                      <option value="">None</option>
                      {loans.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
          
          {type === 'transfer' && loanId && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Interest Portion ({currency})</label>
              <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono"
                type="number" inputMode="decimal" min="0" step="0.01" value={interestAmount} onChange={e => setInterestAmount(e.target.value)} required placeholder="0.00" />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</label>
            <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Note <span className="font-normal opacity-70">(optional)</span></label>
            <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. May salary" />
          </div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-2.5 px-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={16} className="animate-spin mr-2"/> Saving…</> : (isEdit ? 'Save Changes' : `Save ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Transfer'}`)}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TransactionsClient({
  transactions, categories, accounts, totalIncome, totalExpense, moneyOut,
  period, typeFilter, currency, goals, loans
}: Props) {
  const router     = useRouter();
  const params     = useSearchParams();
  const [, startT] = useTransition();
  const net        = totalIncome - totalExpense;
  const netPositive = net >= 0;

  const [showAdd,    setShowAdd]    = useState(false);
  const [editTx,     setEditTx]     = useState<Tx | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageWarning, setPageWarning] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Derived state for filtering and pagination
  const filteredTxs = transactions.filter(tx => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.name.toLowerCase().includes(q) ||
      tx.category?.name?.toLowerCase().includes(q) ||
      (tx.note && tx.note.toLowerCase().includes(q)) ||
      String(toMajor(tx.baseAmountMinor)).includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / PAGE_SIZE));
  const paginatedTxs = filteredTxs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filter/search changes
  useTransition();
  const resetPagination = () => setCurrentPage(1);

  function setParam(key: string, value: string) {
    resetPagination();
    startT(() => {
      const next = new URLSearchParams(params.toString());
      next.set(key, value);
      router.push(`?${next.toString()}`);
    });
  }

  async function handleDelete(id: string, type: string) {
    if (!confirm('Delete this transaction?')) return;
    setDeletingId(id);
    try {
      if (type === 'transfer') {
        await deleteTransfer(id);
      } else {
        await deleteTransaction(id);
      }
      startT(() => router.refresh());
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  }

  const periodLabel = PERIOD_LABELS[period] ?? 'This Period';

  return (
    <div className="space-y-6">
      {showAdd && <TransactionModal categories={categories} accounts={accounts} goals={goals} loans={loans} currency={currency} onClose={(w) => { setShowAdd(false); if(w) setPageWarning(w); }} />}
      {editTx && <TransactionModal key={editTx.id} tx={editTx} categories={categories} accounts={accounts} goals={goals} loans={loans} currency={currency} onClose={(w) => { setEditTx(null); if(w) setPageWarning(w); }} />}
      {showUpload && <div className="bg-card border border-border rounded-xl shadow-soft p-5 animate-in fade-in"><SmartUpload /></div>}

      {pageWarning && (
        <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/20 text-warning rounded-xl">
          <span className="text-sm font-medium">{pageWarning}</span>
          <button onClick={() => setPageWarning('')} className="p-1 hover:bg-warning/20 rounded-md transition-colors"><X size={16}/></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex p-1 bg-secondary rounded-lg">
            {(['all', 'income', 'expense', 'transfer'] as const).map(v => (
              <button key={v} onClick={() => setParam('type', v)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${typeFilter === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {v === 'all' ? 'All' : v === 'income' ? 'Income' : v === 'expense' ? 'Expenses' : 'Transfers'}
              </button>
            ))}
          </div>
          <div className="flex p-1 bg-secondary rounded-lg">
            {(['this-week', 'this-month', 'this-year'] as const).map(v => (
              <button key={v} onClick={() => setParam('period', v)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {v === 'this-week' ? 'Week' : v === 'this-month' ? 'Month' : 'Year'}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              className="w-full py-1.5 pl-8 pr-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); resetPagination(); }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center px-4 py-2 text-sm font-semibold text-muted-foreground bg-background border border-border rounded-lg hover:bg-secondary transition-colors" onClick={() => setShowUpload(v => !v)}>
            <FileDown size={14} className="mr-1.5"/> Import
          </button>
          <button className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors shadow-sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} className="mr-1.5"/> Add Entry
          </button>
        </div>
      </div>

      {/* Summary Hero — Monarch Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-soft flex flex-col justify-center">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Net Balance · {periodLabel}</p>
          <p className={`text-4xl md:text-5xl font-display font-bold tabular-nums tracking-tight ${netPositive ? 'text-success' : 'text-destructive'}`}>
              {netPositive ? '+' : '-'}{fmtAdaptive(Math.abs(net), currency)}
          </p>
          <p className="text-sm font-medium text-muted-foreground mt-2">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} in period</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-success/5 border border-success/20 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-success uppercase tracking-wider mb-1">{periodLabel} Income</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{fmtAdaptive(totalIncome, currency)}</p>
            </div>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">{PERIOD_LABELS[period] || 'All Time'} Money Out</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{fmtAdaptive(moneyOut, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-sm font-medium">No transactions in this period</div>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm font-medium">No matching transactions found</div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/50">
              {paginatedTxs.map(tx => (
                <TransactionRow
                  key={tx.id}
                  title={tx.name}
                  subtitle={tx.note ? `${tx.category?.name || 'Uncategorized'} • ${tx.note}` : (tx.category?.name || 'Uncategorized')}
                  amountMinor={tx.baseAmountMinor}
                  type={tx.type}
                  icon={
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <DynamicCategoryIcon category={tx.category?.name || 'Other'} size={20} className="text-muted-foreground" />
                    </div>
                  }
                  state={tx.type === 'pending' ? 'pending' : undefined}
                  onClick={() => setEditTx(tx)}
                  onDelete={() => handleDelete(tx.id, tx.type)}
                  onEdit={() => setEditTx(tx)}
                  isDeleting={deletingId === tx.id}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/30">
                <div className="text-xs font-medium text-muted-foreground">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredTxs.length)} of {filteredTxs.length}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
