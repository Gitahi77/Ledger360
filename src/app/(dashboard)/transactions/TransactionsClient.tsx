'use client';
import { useState, useTransition, useRef, useOptimistic } from 'react';
import { useQueryState } from 'nuqs';
import { DynamicCategoryIcon } from '@/lib/icons';
import { SmartUpload } from '@/components/SmartUpload';
import { deleteTransaction } from '@/lib/actions/transactions';
import { deleteTransfer } from '@/lib/actions/transfers';
import { Plus, FileDown, X, Loader2, Search, AlertTriangle } from 'lucide-react';
import { toMajor } from '@/lib/money';
import { Grid } from '@/components/layout/grid';
import { Stack } from '@/components/layout/stack';
import { Surface, Button, Input } from '@/components/ui';
import { FinancialMetric } from '@/components/finance/metrics/FinancialMetric';
import { CurrencyDisplay, TransactionRow, TransactionDrawer, SplitTransactionDrawer } from '@/components/finance';
import { getErrorMessage } from '@/lib/errors';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { MoneyDTO } from '@/lib/types/domain';

type Tx = {
  id: string; name: string; baseMoney: MoneyDTO; type: string;
  date: string; note: string | null;
  category?: { id: string; name: string; icon: string | null } | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  goalId?: string | null;
  loanId?: string | null;
  interestMoney?: MoneyDTO;
};
type Category = { id: string; name: string; type: string; icon: string | null };
type Account = { id: string; name: string };
type Goal = { id: string; name: string };
type Loan = { id: string; name: string; balanceMoney: MoneyDTO; annualRate: number };

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
  'all-time':   'All Time'
};

export function TransactionsClient({
  transactions, categories, accounts, totalIncome, totalExpense, moneyOut,
  period, typeFilter, currency, goals = [], loans = []
}: Props) {
  const [, startT] = useTransition();
  const net = totalIncome - totalExpense;

  const [searchQuery, setSearchQuery] = useQueryState('q', { defaultValue: '' });
  const [periodParam, setPeriodParam] = useQueryState('period', { defaultValue: 'this-month' });
  const [typeParam, setTypeParam] = useQueryState('type', { defaultValue: 'all' });

  // Optimistic UI state
  const [optimisticTransactions, addOptimisticTransaction] = useOptimistic(
    transactions || [],
    (state: Tx[], newTx: Tx) => {
      // Very simple optimistic insert at top
      return [newTx, ...state];
    }
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [splitDrawerOpen, setSplitDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Tx | undefined>();
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pageWarning, setPageWarning] = useState<string>('');

  const filteredTxs = optimisticTransactions.filter(tx => {
    if (!searchQuery?.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.name?.toLowerCase().includes(q) ||
      tx.category?.name?.toLowerCase().includes(q) ||
      (tx.note && tx.note.toLowerCase().includes(q)) ||
      String(toMajor(tx.baseMoney.amountMinor)).includes(q)
    );
  });

  const listRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useWindowVirtualizer({
    count: filteredTxs.length,
    estimateSize: () => 72,
    overscan: 5,
  });

  async function handleDelete(id: string, type: string) {
    if (!confirm('Delete this transaction?')) return;
    setDeletingId(id);
    try {
      const idempotencyKey = crypto.randomUUID();
      if (type === 'transfer') {
        await deleteTransfer({ idempotencyKey, payload: { id } });
      } else {
        await deleteTransaction({ idempotencyKey, payload: { id } });
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err) || 'Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  }

  function openNewTransaction() {
    setEditingTx(undefined);
    setDrawerOpen(true);
  }

  function openEditTransaction(tx: Tx) {
    setEditingTx(tx);
    setDrawerOpen(true);
  }

  function openSplitTransaction(tx: Tx) {
    setEditingTx(tx);
    setSplitDrawerOpen(true);
  }

  const periodLabel = PERIOD_LABELS[period] ?? 'This Period';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <TransactionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        tx={editingTx}
        categories={categories}
        accounts={accounts}
        goals={goals}
        loans={loans}
        currency={currency}
        transactions={transactions}
        onComplete={(w) => { setDrawerOpen(false); if(w) setPageWarning(w); }}
      />
      <SplitTransactionDrawer
        open={splitDrawerOpen}
        onOpenChange={setSplitDrawerOpen}
        tx={editingTx}
        categories={categories}
        currency={currency}
        onComplete={(w) => { setSplitDrawerOpen(false); if(w) setPageWarning(w); }}
      />
      {showUpload && <div className="bg-card border border-border rounded-xl shadow-md p-5 animate-in fade-in slide-in-from-top-4 duration-300"><SmartUpload /></div>}

      {pageWarning && (
        <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/30 text-warning rounded-xl shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} />
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
              <button key={v} onClick={() => setTypeParam(v)} className={`px-4 py-2 text-[0.8rem] font-semibold rounded-lg transition-all duration-300 ${typeFilter === v ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                {v === 'all' ? 'All Types' : v === 'income' ? 'Income' : v === 'expense' ? 'Expenses' : 'Transfers'}
              </button>
            ))}
          </Surface>
          <Surface variant="flat" className="flex p-1 rounded-xl">
            {(['this-week', 'this-month', 'this-year'] as const).map(v => (
              <button key={v} onClick={() => setPeriodParam(v)} className={`px-4 py-2 text-[0.8rem] font-semibold rounded-lg transition-all duration-300 ${period === v ? 'bg-card text-foreground shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                {v === 'this-week' ? 'Week' : v === 'this-month' ? 'Month' : 'Year'}
              </button>
            ))}
          </Surface>
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="w-full pl-10"
              placeholder="Search transactions..."
              value={searchQuery || ''}
              onChange={e => setSearchQuery(e.target.value || null)}
            />
          </div>
        </Stack>
        <Stack gap="sm" className="flex-row items-center">
          <Button variant="secondary" onClick={() => setShowUpload(v => !v)}>
            <FileDown size={16} className="mr-2 text-muted-foreground"/> Import CSV
          </Button>
          <Button onClick={openNewTransaction}>
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
              value={<CurrencyDisplay money={{ amountMinor: net, currency: currency }} tone={net >= 0 ? 'positive' : 'negative'} className="text-4xl md:text-5xl font-semibold tracking-tight" showSymbol />}
              subLabel={`${optimisticTransactions.length} transactions`}
            />
          </div>
        </Surface>
        
        <Stack gap="md" className="col-span-1">
          <Surface variant="raised" className="p-5">
            <FinancialMetric
              label={`${periodLabel} Income`}
              value={<CurrencyDisplay money={{ amountMinor: totalIncome, currency: currency }} tone="positive" className="text-2xl font-semibold tracking-tight" />}
            />
          </Surface>
          <Surface variant="raised" className="p-5">
            <FinancialMetric
              label={`${PERIOD_LABELS[period] || 'All Time'} Outflow`}
              value={<CurrencyDisplay money={{ amountMinor: Math.abs(moneyOut), currency: currency }} tone="negative" className="text-2xl font-semibold tracking-tight" />}
            />
          </Surface>
        </Stack>
      </Grid>

      {/* Transaction list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
        {optimisticTransactions.length === 0 ? (
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
          <div ref={listRef} style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const tx = filteredTxs[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="border-b border-border/60">
                    <TransactionRow
                      title={tx.name}
                      subtitle={tx.note ? `${tx.category?.name || 'Uncategorized'} • ${tx.note}` : (tx.category?.name || 'Uncategorized')}
                      amountMinor={tx.baseMoney.amountMinor}
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
                      onClick={() => openEditTransaction(tx)}
                      onDelete={() => handleDelete(tx.id, tx.type)}
                      onEdit={() => openEditTransaction(tx)}
                      onSplit={tx.type !== 'transfer' ? () => openSplitTransaction(tx) : undefined}
                      isDeleting={deletingId === tx.id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
