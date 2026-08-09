'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from '@/components/os';
import { Label, Combobox, CreatableCombobox } from '@/components/ui';
import { DynamicCategoryIcon } from '@/lib/icons';
import { toMinor, toMajor } from '@/lib/money';
import { addTransaction, editTransaction } from '@/lib/actions/transactions';
import { createTransfer, editTransfer } from '@/lib/actions/transfers';
import { getErrorMessage } from '@/lib/errors';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx?: Tx;
  categories: Category[];
  accounts: Account[];
  goals: Goal[];
  loans: Loan[];
  currency: string;
  transactions: Tx[];
  onComplete: (warning?: string) => void;
  defaultType?: 'income' | 'expense' | 'transfer';
}

export function TransactionDrawer({
  open, onOpenChange, tx, categories, accounts, goals, loans, currency, transactions, onComplete, defaultType
}: Props) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState(tx?.name ?? '');
  const [amount, setAmount] = useState(tx ? (toMajor(tx.baseMoney.amountMinor)).toString() : '');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(tx ? (tx.type as 'income' | 'expense' | 'transfer') : (defaultType || 'expense'));
  const [categoryId, setCategoryId] = useState(tx?.category?.id ?? '');
  
  const initialAccountId = tx?.type === 'transfer' ? (tx.fromAccountId ?? accounts[0]?.id ?? '') : (('accountId' in (tx || {}) ? (tx as unknown as { accountId: string }).accountId : null) ?? accounts[0]?.id ?? '');
  const [accountId, setAccountId] = useState(initialAccountId);
  
  const [toAccountId, setToAccountId] = useState(tx?.toAccountId ?? '');
  const [goalId, setGoalId] = useState(tx?.goalId ?? '');
  const [loanId, setLoanId] = useState(tx?.loanId ?? '');
  const [interestAmount, setInterestAmount] = useState(tx && tx.interestMoney ? (toMajor(tx.interestMoney.amountMinor)).toString() : '');
  const [date, setDate] = useState(tx ? new Date(tx.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(tx?.note ?? '');
  const isEdit = Boolean(tx);

  const filteredCats = categories.filter(c => c.type === type);
  const uniquePayees = Array.from(new Set(transactions.filter(t => t.type !== 'transfer' && t.name).map(t => t.name)));

  // Reset state when opening/closing or tx changes
  useEffect(() => {
    if (open) {
      setName(tx?.name ?? '');
      setAmount(tx ? (toMajor(tx.baseMoney.amountMinor)).toString() : '');
      setType(tx ? (tx.type as 'income' | 'expense' | 'transfer') : (defaultType || 'expense'));
      setCategoryId(tx?.category?.id ?? '');
      setAccountId(tx?.type === 'transfer' ? (tx.fromAccountId ?? accounts[0]?.id ?? '') : (('accountId' in (tx || {}) ? (tx as unknown as { accountId: string }).accountId : null) ?? accounts[0]?.id ?? ''));
      setToAccountId(tx?.toAccountId ?? '');
      setGoalId(tx?.goalId ?? '');
      setLoanId(tx?.loanId ?? '');
      setInterestAmount(tx && tx.interestMoney ? (toMajor(tx.interestMoney.amountMinor)).toString() : '');
      setDate(tx ? new Date(tx.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setNote(tx?.note ?? '');
      setError('');
    }
  }, [open, tx, accounts, defaultType]);

  useEffect(() => {
    if (loanId && !isEdit) {
      const selectedLoan = loans.find(l => l.id === loanId);
      if (selectedLoan) {
        const autoInterestMinor = Math.round(selectedLoan.balanceMoney.amountMinor * (selectedLoan.annualRate / 100) / 12);
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
      const idempotencyKey = crypto.randomUUID();
      
      if (type === 'transfer') {
        const intMinor = interestAmount !== '' ? toMinor(parseFloat(interestAmount)) : undefined;
        const payload = { fromAccountId: accountId, toAccountId: loanId ? null : toAccountId, amountMinor: toMinor(parseFloat(amount)), date, note, goalId: goalId || null, loanId: loanId || null, interestMinor: intMinor };
        if (isEdit && tx) {
          await editTransfer(tx.id, { idempotencyKey, payload });
        } else {
          await createTransfer({ idempotencyKey, payload });
        }
      } else {
        if (isEdit && tx) {
          const payload = { name, baseAmountMinor: toMinor(parseFloat(amount)), type, categoryId, accountId, date: new Date(date), note };
          const res = await editTransaction(tx.id, { idempotencyKey, payload });
          if (res && 'warning' in res) warnMsg = res.warning as string;
        } else {
          const payload = { name, baseAmountMinor: toMinor(parseFloat(amount)), type, categoryId, accountId, date, note };
          const res = await addTransaction({ idempotencyKey, payload });
          if (res && 'warning' in res) warnMsg = res.warning as string;
        }
      }
      startT(() => router.refresh());
      onComplete(warnMsg);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally { 
      setLoading(false); 
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DrawerTitle>
          <DrawerDescription>
            {isEdit ? 'Modify details below.' : 'Record a new transaction.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 md:px-0">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 text-sm font-medium text-destructive bg-destructive/10 rounded-lg">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          
          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="flex p-1 bg-secondary rounded-lg">
              {(['expense', 'income', 'transfer'] as const).map(t => (
                <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                  className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    type === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}>
                  {t === 'income' ? '+ Income' : t === 'expense' ? '− Expense' : '⇄ Transfer'}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-4">
              {type !== 'transfer' && (
                <div className="w-full">
                  <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description (Payee)</Label>
                  <CreatableCombobox
                    options={uniquePayees.map(p => ({ id: p, value: p, label: p }))}
                    value={name}
                    onChange={(val) => setName(val)}
                    onCreateOption={(val) => setName(val)}
                    placeholder="e.g. Naivas Grocery"
                    searchPlaceholder="Search or create payee..."
                    emptyText="No recent payees found."
                  />
                </div>
              )}
              <div className="w-full">
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
                    <Combobox
                      options={filteredCats.map(c => ({ id: c.id, value: c.id, label: c.name, icon: <DynamicCategoryIcon category={c.name} size={16} /> }))}
                      value={categoryId}
                      onChange={(val) => setCategoryId(val)}
                      placeholder="Select Category..."
                      emptyText="No categories found."
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Account</Label>
                    <Combobox
                      options={accounts.map(a => ({ id: a.id, value: a.id, label: a.name }))}
                      value={accountId}
                      onChange={(val) => setAccountId(val)}
                      placeholder="Select Account..."
                      emptyText="No accounts found."
                    />
                  </div>
                </>
              ) : (
                <div className="w-full space-y-4">
                  <div className="w-full">
                    <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">From Account</Label>
                    <Combobox
                      options={accounts.map(a => ({ id: a.id, value: a.id, label: a.name }))}
                      value={accountId}
                      onChange={(val) => setAccountId(val)}
                      placeholder="Select From Account..."
                      emptyText="No accounts found."
                    />
                  </div>
                  {!loanId && (
                    <div className="w-full">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">To Account</Label>
                      <Combobox
                        options={accounts.map(a => ({ id: a.id, value: a.id, label: a.name }))}
                        value={toAccountId}
                        onChange={(val) => setToAccountId(val)}
                        placeholder="Select To Account..."
                        emptyText="No accounts found."
                      />
                    </div>
                  )}
                  {goals.length > 0 && !loanId && (
                    <div className="w-full">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Goal to Fund (Optional)</Label>
                      <Combobox
                        options={goals.map(g => ({ id: g.id, value: g.id, label: g.name }))}
                        value={goalId}
                        onChange={(val) => setGoalId(val)}
                        placeholder="None"
                        emptyText="No goals found."
                      />
                    </div>
                  )}
                  {loans.length > 0 && !goalId && (
                    <div className="w-full">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Loan to Repay (Optional)</Label>
                      <Combobox
                        options={loans.map(l => ({ id: l.id, value: l.id, label: l.name }))}
                        value={loanId}
                        onChange={(val) => setLoanId(val)}
                        placeholder="None"
                        emptyText="No loans found."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {type === 'transfer' && loanId && (
              <div>
                <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Interest Portion ({currency})</Label>
                <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono"
                  type="number" inputMode="decimal" min="0" step="0.01" value={interestAmount} onChange={e => setInterestAmount(e.target.value)} required placeholder="0.00" />
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Date</Label>
                <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="flex-1">
                <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Note <span className="font-normal opacity-70">(optional)</span></Label>
                <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                  value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. May salary" />
              </div>
            </div>
          </form>
        </div>

        <DrawerFooter>
          <button form="transaction-form" type="submit" disabled={loading} className="w-full flex items-center justify-center py-2.5 px-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Loader2 size={16} className="animate-spin mr-2"/> Saving…</> : (isEdit ? 'Save Changes' : `Save ${type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Transfer'}`)}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
