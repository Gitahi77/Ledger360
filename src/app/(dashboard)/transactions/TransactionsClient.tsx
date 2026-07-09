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
import { Plus, FileDown, X, Loader2, Search, ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';
import { Grid } from '@/components/layout/grid';
import { Stack } from '@/components/layout/stack';
import { Surface } from '@/components/ui/surface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FinancialMetric } from '@/components/finance/metrics/FinancialMetric';
import { CurrencyDisplay } from '@/components/finance/display/currency-display';
import { TransactionRow } from '@/components/finance/TransactionRow';

type Tx = {
  id: string; name: string; baseAmountMinor: number; type: string;
  date: string; note: string | null;
  category?: { id: string; name: string; icon: string | null } | null;
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
  const [categoryId, setCategoryId] = useState(tx?.category?.id ?? '');
  
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => onClose()}>
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border p-6 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={() => onClose()} className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"><X size={18}/></button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 p-3 mb-5 text-sm font-medium text-destructive bg-destructive/10 rounded-lg">
            <TriangleAlert size={16} /> {error}
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
                <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</Label>
                <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Naivas Grocery" />
              </div>
            )}
            <div className={type === 'transfer' ? 'w-full' : 'w-full sm:w-1/3'}>
              <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount ({currency})</Label>
              <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono"
                type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {type !== 'transfer' ? (
              <>
                <div className="flex-1">
                  <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Category</Label>
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
                  <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Account</Label>
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
                  <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">From Account</Label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    value={accountId} onChange={e => setAccountId(e.target.value)} required>
                    <option value="">Select From Account...</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                {!loanId && (
                  <div className="flex-1">
                    <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">To Account</Label>
                    <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      value={toAccountId} onChange={e => setToAccountId(e.target.value)} required>
                      <option value="">Select To Account...</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
                {goals.length > 0 && !loanId && (
                  <div className="flex-1">
                    <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Goal to Fund (Optional)</Label>
                    <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      value={goalId} onChange={e => setGoalId(e.target.value)}>
                      <option value="">None</option>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}
                {loans.length > 0 && !goalId && (
                  <div className="flex-1">
                    <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Loan to Repay (Optional)</Label>
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
              <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Interest Portion ({currency})</Label>
              <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono"
                type="number" inputMode="decimal" min="0" step="0.01" value={interestAmount} onChange={e => setInterestAmount(e.target.value)} required placeholder="0.00" />
            </div>
          )}
          
          <div>
            <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</Label>
            <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Note <span className="font-normal opacity-70">(optional)</span></Label>
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
  period, typeFilter, currency, goals = [], loans = []
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
  const filteredTxs = (transactions || []).filter(tx => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.name?.toLowerCase().includes(q) ||
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showAdd && <TransactionModal categories={categories} accounts={accounts} goals={goals} loans={loans} currency={currency} onClose={(w) => { setShowAdd(false); if(w) setPageWarning(w); }} />}
      {editTx && <TransactionModal key={editTx.id} tx={editTx} categories={categories} accounts={accounts} goals={goals} loans={loans} currency={currency} onClose={(w) => { setEditTx(null); if(w) setPageWarning(w); }} />}
      {showUpload && <div className="bg-card border border-border rounded-xl shadow-md p-5 animate-in fade-in slide-in-from-top-4 duration-300"><SmartUpload /></div>}

      {pageWarning && (
        <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/30 text-warning rounded-xl shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <TriangleAlert size={18} />
            <span className="text-sm font-medium">{pageWarning}</span>
          </div>
          <button onClick={() => setPageWarning('')} className="p-1.5 hover:bg-warning/20 rounded-md transition-colors"><X size={16}/></button>
        </div>
      )}

      {/* Toolbar */}
      <Stack gap="md" className="xl:flex-row xl:items-center justify-between">
        <Stack gap="sm" className="flex-row items-center flex-wrap flex-1">
          <Surface variant="flat" className="flex p-1 rounded-xl">
            {(['all', 'income', 'expense', 'transfer'] as const).map(v => (
              <button key={v} onClick={() => setParam('type', v)} className={`px-4 py-2 text-[0.8rem] font-semibold rounded-lg transition-all duration-300 ${typeFilter === v ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                {v === 'all' ? 'All Types' : v === 'income' ? 'Income' : v === 'expense' ? 'Expenses' : 'Transfers'}
              </button>
            ))}
          </Surface>
          <Surface variant="flat" className="flex p-1 rounded-xl">
            {(['this-week', 'this-month', 'this-year'] as const).map(v => (
              <button key={v} onClick={() => setParam('period', v)} className={`px-4 py-2 text-[0.8rem] font-semibold rounded-lg transition-all duration-300 ${period === v ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                {v === 'this-week' ? 'Week' : v === 'this-month' ? 'Month' : 'Year'}
              </button>
            ))}
          </Surface>
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="w-full pl-10"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); resetPagination(); }}
            />
          </div>
        </Stack>
        <Stack gap="sm" className="flex-row items-center">
          <Button variant="secondary" onClick={() => setShowUpload(v => !v)}>
            <FileDown size={16} className="mr-2 text-muted-foreground"/> Import CSV
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} className="mr-2"/> New Transaction
          </Button>
        </Stack>
      </Stack>

      {/* Summary Hero */}
      <Grid columns={3} responsive gap="lg">
        <Surface variant="raised" className="col-span-1 md:col-span-2 p-7 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <FinancialMetric
              label={`Net Flow · ${periodLabel}`}
              value={<CurrencyDisplay value={{ amountMinor: Math.abs(net), currencyCode: currency }} size="hero" signDisplay="always" colorize />}
              subLabel={`${(transactions || []).length} transactions`}
            />
          </div>
        </Surface>
        
        <Stack gap="md" className="col-span-1">
          <Surface variant="raised" className="p-5">
            <FinancialMetric
              label={`${periodLabel} Income`}
              value={<CurrencyDisplay value={{ amountMinor: totalIncome, currencyCode: currency }} size="lg" colorize />}
            />
          </Surface>
          <Surface variant="raised" className="p-5">
            <FinancialMetric
              label={`${PERIOD_LABELS[period] || 'All Time'} Outflow`}
              value={<CurrencyDisplay value={{ amountMinor: moneyOut, currencyCode: currency }} size="lg" colorize />}
            />
          </Surface>
        </Stack>
      </Grid>

      {/* Transaction list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
        {(!transactions || transactions.length === 0) ? (
          <div className="text-center py-24 text-muted-foreground">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-[0.95rem] font-semibold text-foreground">No transactions found</div>
            <div className="text-sm mt-1">There is no activity in this period.</div>
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-[0.95rem] font-semibold text-foreground">No matching results</div>
            <div className="text-sm mt-1">Try adjusting your search or filters.</div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border/60">
              {paginatedTxs.map((tx, index) => (
                <div key={tx.id} className="animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}>
                  <TransactionRow
                    title={tx.name}
                    subtitle={tx.note ? `${tx.category?.name || 'Uncategorized'} • ${tx.note}` : (tx.category?.name || 'Uncategorized')}
                    amountMinor={tx.baseAmountMinor}
                    type={tx.type}
                    icon={
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ 
                        background: tx.type === 'income' ? 'hsl(var(--success) / 0.15)' : tx.type === 'transfer' ? 'hsl(var(--secondary))' : 'hsl(var(--destructive) / 0.15)',
                        color: tx.type === 'income' ? 'hsl(var(--success))' : tx.type === 'transfer' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--destructive))'
                      }}>
                        <DynamicCategoryIcon category={tx.category?.name || 'Other'} size={22} className="opacity-90" />
                      </div>
                    }
                    state={tx.type === 'pending' ? 'pending' : undefined}
                    onClick={() => setEditTx(tx)}
                    onDelete={() => handleDelete(tx.id, tx.type)}
                    onEdit={() => setEditTx(tx)}
                    isDeleting={deletingId === tx.id}
                  />
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border bg-secondary/20 backdrop-blur-sm">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredTxs.length)} of {filteredTxs.length}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border rounded-lg transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:cursor-not-allowed" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-foreground bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <button 
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border rounded-lg transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:cursor-not-allowed" 
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
