'use client';
import { useState, useRef, useOptimistic, useEffect, useCallback } from 'react';
import { fetchTransactionsPage } from '@/lib/actions/transactions';
import { useQueryState } from 'nuqs';
import { SmartUpload } from '@/components/SmartUpload';
import { deleteTransaction } from '@/lib/actions/transactions';
import { deleteTransfer } from '@/lib/actions/transfers';
import { Plus, FileDown, Search, Loader2, X, AlertTriangle } from 'lucide-react';
import { toMajor } from '@/lib/money';
import { Button, Input } from '@/components/ui';
import { CurrencyDisplay, TransactionDrawer, SplitTransactionDrawer, InsightCard } from '@/components/finance';
import { getErrorMessage } from '@/lib/errors';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { MoneyDTO } from '@/lib/types/domain';
import type { TransactionsIntelligenceDTO } from '@/lib/types/transactions-intelligence';

// UI OS Primitives
import { 
  PageShell, 
  SectionHeader, 
  MetricBlock, 
  AdvisoryCard, 
  FilterBar, 
  FilterGroup, 
  EmptyState 
} from '@/components/os';
import { TransactionRow } from './components/TransactionRow';

type Tx = {
  id: string; name: string; baseMoney: MoneyDTO; type: string;
  date: string; note: string | null;
  category?: { id: string; name: string; icon: string | null } | null;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  goalId?: string | null;
  loanId?: string | null;
  interestMoney?: MoneyDTO;
  status?: string;
  parentId?: string | null;
  optimisticId?: string;
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
  intelligence: TransactionsIntelligenceDTO;
  nextCursor?: string | null;
  hasNextPage?: boolean;
}

const PERIOD_LABELS: Record<string, string> = {
  'this-week':  'This Week',
  'this-month': 'This Month',
  'this-year':  'This Year',
  'all-time':   'All Time'
};

export function TransactionsClient({
  transactions, categories, accounts,
  period, typeFilter, currency, goals = [], loans = [], intelligence, ...props
}: Props) {
  const [searchQuery, setSearchQuery] = useQueryState('q', { defaultValue: '' });
  const [, setPeriodParam] = useQueryState('period', { defaultValue: 'this-month' });
  const [, setTypeParam] = useQueryState('type', { defaultValue: 'all' });
  const [auditMode, setAuditMode] = useQueryState('audit', { defaultValue: 'false' });
  
  const [txIdParam, setTxIdParam] = useQueryState('tx');
  const [actionParam, setActionParam] = useQueryState('action');

  const [loadedTxs, setLoadedTxs] = useState<Tx[]>(transactions);
  const [cursor, setCursor] = useState(props.nextCursor);
  const [hasMore, setHasMore] = useState(props.hasNextPage);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pageWarning, setPageWarning] = useState('');

  useEffect(() => {
    setLoadedTxs(transactions);
    setCursor(props.nextCursor);
    setHasMore(props.hasNextPage);
  }, [transactions, props.nextCursor, props.hasNextPage]);

  useEffect(() => {
    if (actionParam === 'new' || actionParam === 'transfer') {
      setEditingTx(undefined);
      setDrawerOpen(true);
    } else if (txIdParam && loadedTxs.length > 0) {
      const found = loadedTxs.find(t => t.id === txIdParam);
      if (found) {
        if (actionParam === 'split') {
          setEditingTx(found);
          setSplitDrawerOpen(true);
        } else {
          setEditingTx(found);
          setDrawerOpen(true);
        }
      }
    }
  }, [txIdParam, actionParam, loadedTxs]);

  const [optimisticTransactions] = useOptimistic(
    loadedTxs || [],
    (state: Tx[], newTx: Tx) => [newTx, ...state]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [splitDrawerOpen, setSplitDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Tx | undefined>();
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore || !hasMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoadingMore]);

  async function loadMore() {
    if (isLoadingMore || !hasMore || !cursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetchTransactionsPage({
        period: period,
        type: typeFilter === 'all' || typeFilter === 'transfer' ? undefined : typeFilter,
        cursor: cursor,
        take: 50,
        includeAudit: auditMode === 'true'
      });
      if (res) {
        setLoadedTxs(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newItems = res.items.filter((t: Tx) => !existingIds.has(t.id));
          return [...prev, ...newItems];
        });
        setCursor(res.nextCursor);
        setHasMore(res.hasNextPage);
      }
    } catch (e) {
      console.error('Failed to load more transactions', e);
    } finally {
      setIsLoadingMore(false);
    }
  }

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

  function handleDrawerOpenChange(isOpen: boolean) {
    setDrawerOpen(isOpen);
    if (!isOpen) {
      setTxIdParam(null);
      setActionParam(null);
    }
  }

  function handleSplitDrawerOpenChange(isOpen: boolean) {
    setSplitDrawerOpen(isOpen);
    if (!isOpen) {
      setTxIdParam(null);
      setActionParam(null);
    }
  }

  const periodLabel = PERIOD_LABELS[period] ?? 'This Period';

  return (
    <PageShell width="transactions">
      <TransactionDrawer
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        tx={editingTx}
        categories={categories}
        accounts={accounts}
        goals={goals}
        loans={loans}
        currency={currency}
        transactions={transactions}
        defaultType={actionParam === 'transfer' ? 'transfer' : 'expense'}
        onComplete={(w) => { setDrawerOpen(false); setTxIdParam(null); setActionParam(null); if (w) setPageWarning(w); }}
      />
      <SplitTransactionDrawer
        open={splitDrawerOpen}
        onOpenChange={handleSplitDrawerOpenChange}
        tx={editingTx}
        categories={categories}
        currency={currency}
        onComplete={(w) => { setSplitDrawerOpen(false); setTxIdParam(null); setActionParam(null); if (w) setPageWarning(w); }}
      />

      <SectionHeader 
        title="Transactions" 
        subtitle={`Viewing activity for ${periodLabel.toLowerCase()}.`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowUpload(v => !v)} className="hidden sm:flex">
              <FileDown size={16} className="mr-2"/> Import CSV
            </Button>
            <Button onClick={openNewTransaction} className="hidden sm:flex">
              <Plus size={16} className="mr-2"/> New Transaction
            </Button>
          </div>
        } 
      />

      {showUpload && <div className="mb-8"><SmartUpload /></div>}

      {/* Page Warning (from drawer operations) */}
      {pageWarning && (
        <div className="flex items-center justify-between p-4 mb-6 bg-warning/10 border border-warning/30 text-warning rounded-xl shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} />
            <span className="text-sm font-medium">{pageWarning}</span>
          </div>
          <button onClick={() => setPageWarning('')} className="p-1.5 hover:bg-warning/20 rounded-md transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      {/* LEVEL 2: Executive Summary (Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <MetricBlock
          label={`Net Flow · ${periodLabel}`}
          value={<CurrencyDisplay money={intelligence.metrics.netCashFlow} showSymbol />}
          trend={`${intelligence.metrics.transactionCount} transactions`}
        />
        <MetricBlock
          label="Average Daily Spend"
          value={<CurrencyDisplay money={intelligence.metrics.averageSpend} />}
          trend={`${intelligence.metrics.averageTransactionsPerDay} tx/day`}
        />
        <MetricBlock
          label="Total Expenses"
          value={<CurrencyDisplay money={intelligence.metrics.totalExpenses} />}
        />
        <MetricBlock
          label="Total Income"
          value={<CurrencyDisplay money={intelligence.metrics.totalIncome} />}
        />
      </div>

      {/* LEVEL 1: Advisory / Insight (from intelligence) */}
      {intelligence.insights && intelligence.insights.length > 0 && (
        <AdvisoryCard
          className="mb-8"
          title={intelligence.insights[0].type === 'acceleration' ? 'Spending Acceleration Detected' : 'Financial Insight'}
          explainer={intelligence.insights[0].explanation}
          priority="medium"
        />
      )}

      {/* LEVEL 3: Behaviour Analysis (Insights + Observations) */}
      {(intelligence.insights.length > 1 || intelligence.observations.length > 0) && (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold px-1">Behaviour Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intelligence.insights.slice(1, 4).map(insight => (
              <InsightCard
                key={insight.id}
                title={insight.type === 'acceleration' ? 'Acceleration' : insight.type === 'reliance' ? 'Reliance' : 'Insight'}
                content={insight.explanation}
                severity="info"
              />
            ))}
            {intelligence.observations.slice(0, 3).map(obs => (
              <InsightCard
                key={obs.id}
                title={obs.type.charAt(0).toUpperCase() + obs.type.slice(1)}
                content={obs.description}
                severity={obs.type === 'outlier' ? 'warning' : 'info'}
              />
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 4: Timeline */}
      {intelligence.timeline.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold px-1">Timeline</h2>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="space-y-3">
              {intelligence.timeline.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()} · {event.data?.description || event.type}</p>
                  </div>
                  {event.data && 'amount' in event.data && event.data.amount && (
                    <CurrencyDisplay 
                      money={event.data.amount as MoneyDTO} 
                      className="text-sm font-semibold" 
                      tone={event.severity === 'success' ? 'positive' : event.severity === 'warning' ? 'negative' : 'neutral'} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 5: Exploration (Filters + Transaction List) */}
      <FilterBar className="mb-6 flex-wrap gap-y-4">
        <FilterGroup>
          {(['all', 'income', 'expense', 'transfer'] as const).map(v => (
            <button key={v} onClick={() => setTypeParam(v)} className={`px-4 py-2 text-[0.85rem] font-medium rounded-full transition-all duration-300 ${typeFilter === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {v === 'all' ? 'All Types' : v === 'income' ? 'Income' : v === 'expense' ? 'Expenses' : 'Transfers'}
            </button>
          ))}
        </FilterGroup>
        <FilterGroup>
          {(['this-week', 'this-month', 'this-year'] as const).map(v => (
            <button key={v} onClick={() => setPeriodParam(v)} className={`px-4 py-2 text-[0.85rem] font-medium rounded-full transition-all duration-300 ${period === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              {v === 'this-week' ? 'Week' : v === 'this-month' ? 'Month' : 'Year'}
            </button>
          ))}
        </FilterGroup>
        <FilterGroup>
          <div className="relative w-full sm:w-[260px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="w-full pl-9 rounded-full bg-secondary/50 border-transparent focus:border-border"
              placeholder="Search transactions..."
              value={searchQuery || ''}
              onChange={e => setSearchQuery(e.target.value || null)}
            />
          </div>
        </FilterGroup>
        <FilterGroup>
          <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer">
            <input 
              type="checkbox" 
              checked={auditMode === 'true'} 
              onChange={(e) => setAuditMode(e.target.checked ? 'true' : 'false')}
              className="rounded border-border bg-card text-primary focus:ring-primary/20"
            />
            <span>Audit Mode</span>
          </label>
        </FilterGroup>
      </FilterBar>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {/* Table Header (Desktop Only) */}
        <div className="hidden md:grid grid-cols-[100px_180px_2fr_3fr_120px_auto] gap-4 p-4 border-b border-border/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/30">
          <div>Date</div>
          <div>Category</div>
          <div>Merchant</div>
          <div>Note</div>
          <div className="text-right">Amount</div>
          <div></div>
        </div>

        {optimisticTransactions.length === 0 ? (
          <EmptyState 
            title="No transactions found" 
            description="There is no activity in this period. Once you add transactions, they will appear here." 
            icon="📭" 
            action={<Button onClick={openNewTransaction}>Add your first transaction</Button>} 
          />
        ) : filteredTxs.length === 0 ? (
          <EmptyState 
            title="No matching results" 
            description="Try adjusting your search or filters to find what you're looking for." 
            icon="🔍" 
            action={<Button variant="outline" onClick={() => { setSearchQuery(null); setTypeParam('all'); }}>Clear filters</Button>} 
          />
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
                  <TransactionRow
                    tx={tx}
                    onEdit={() => openEditTransaction(tx)}
                    onDelete={() => handleDelete(tx.id, tx.type)}
                    onSplit={tx.type !== 'transfer' ? () => openSplitTransaction(tx) : undefined}
                    isDeleting={deletingId === tx.id}
                  />
                </div>
              );
            })}
          </div>
        )}
        
        {hasMore && (
          <div ref={loadMoreRef} className="py-6 flex justify-center border-t border-border/50">
            <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
              {isLoadingMore ? <><Loader2 size={16} className="mr-2 animate-spin" /> Loading...</> : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <div className="sm:hidden fixed bottom-20 right-6 z-40">
        <button 
          onClick={openNewTransaction}
          className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow active:scale-95"
          aria-label="New Transaction"
        >
          <Plus size={24} />
        </button>
      </div>

    </PageShell>
  );
}
