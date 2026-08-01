'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, X, Plus, Trash2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { Label, Combobox } from '@/components/ui';
import { DynamicCategoryIcon } from '@/lib/icons';
import { toMinor, toMajor } from '@/lib/money';
import { splitTransaction } from '@/lib/actions/transactions';
import { getErrorMessage } from '@/lib/errors';
import type { MoneyDTO } from '@/lib/types/domain';

type Tx = {
  id: string; name: string; baseMoney: MoneyDTO; type: string;
  date: string; note: string | null;
  category?: { id: string; name: string; icon: string | null } | null;
};
type Category = { id: string; name: string; type: string; icon: string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx?: Tx;
  categories: Category[];
  currency: string;
  onComplete: (warning?: string) => void;
}

export function SplitTransactionDrawer({
  open, onOpenChange, tx, categories, currency, onComplete
}: Props) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [children, setChildren] = useState<{ amount: string; categoryId: string; note: string }[]>([]);

  const filteredCats = categories.filter(c => c.type === tx?.type);
  const parentAmountMinor = tx ? tx.baseMoney.amountMinor : 0;
  
  // Calculate allocated amount
  let allocatedMinor = 0;
  for (const child of children) {
    const parsedAmount = parseFloat(child.amount);
    if (isFinite(parsedAmount) && parsedAmount > 0) {
      allocatedMinor += toMinor(parsedAmount);
    }
  }
  const remainingMinor = parentAmountMinor - allocatedMinor;

  useEffect(() => {
    if (open && tx) {
      setChildren([
        { amount: '', categoryId: '', note: '' },
        { amount: '', categoryId: '', note: '' }
      ]);
      setError('');
    }
  }, [open, tx]);

  function handleAddChild() {
    setChildren(prev => [...prev, { amount: '', categoryId: '', note: '' }]);
  }

  function handleRemoveChild(index: number) {
    if (children.length <= 2) {
      setError('A split must have at least two parts.');
      return;
    }
    setChildren(prev => prev.filter((_, i) => i !== index));
    setError('');
  }

  function handleChildChange(index: number, field: 'amount' | 'categoryId' | 'note', value: string) {
    setChildren(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tx) return;
    
    if (children.length < 2) {
      setError('A split must have at least two parts.');
      return;
    }

    const payloadChildren: { baseAmountMinor: number; categoryId: string; note?: string }[] = [];
    
    for (const child of children) {
      if (!child.categoryId) {
        setError('Please select a category for all split parts.');
        return;
      }
      const parsedAmount = parseFloat(child.amount);
      if (!isFinite(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid positive amount for all split parts.');
        return;
      }
      payloadChildren.push({
        baseAmountMinor: Number(toMinor(parsedAmount)),
        categoryId: child.categoryId,
        note: child.note || undefined,
      });
    }

    if (remainingMinor !== 0) {
      setError(`Split amounts must exactly equal the total transaction amount. Remaining: ${toMajor(remainingMinor)}`);
      return;
    }

    setLoading(true); setError('');
    try {
      const idempotencyKey = crypto.randomUUID();
      const payload = {
        parentId: tx.id,
        children: payloadChildren,
      };

      const res = await splitTransaction({ idempotencyKey, payload });
      if (res && typeof res === 'object' && 'error' in res && res.error) {
        throw new Error(String(res.error));
      }
      
      startT(() => router.refresh());
      onComplete();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[96vh]">
        <div className="mx-auto w-full max-w-lg p-6 pb-12 overflow-y-auto">
          <DrawerHeader className="px-0 pt-0 pb-4 flex justify-between items-center">
            <div>
              <DrawerTitle>Split Transaction</DrawerTitle>
              <DrawerDescription>
                Allocate <span className="font-semibold text-foreground">{currency} {toMajor(parentAmountMinor)}</span> to multiple categories.
              </DrawerDescription>
            </div>
            <DrawerClose className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
              <X size={18} />
            </DrawerClose>
          </DrawerHeader>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 text-sm font-medium text-destructive bg-destructive/10 rounded-lg">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div className="flex items-center justify-between p-3 mb-6 bg-secondary/50 rounded-xl border border-border">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remaining</span>
              <span className={`text-lg font-semibold tracking-tight ${remainingMinor === 0 ? 'text-success' : remainingMinor < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {currency} {toMajor(remainingMinor)}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                {currency} {toMajor(parentAmountMinor)}
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {children.map((child, idx) => (
                <div key={idx} className="p-4 bg-card border border-border rounded-xl relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => handleRemoveChild(idx)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Remove part">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-3 pt-1">
                    <div className="w-full sm:w-1/3">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Amount</Label>
                      <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all font-mono"
                        type="number" inputMode="decimal" min="0.01" step="0.01" value={child.amount} onChange={e => handleChildChange(idx, 'amount', e.target.value)} required placeholder="0.00" />
                    </div>
                    <div className="flex-1">
                      <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Category</Label>
                      <Combobox
                        options={filteredCats.map(c => ({ id: c.id, value: c.id, label: c.name, icon: <DynamicCategoryIcon category={c.name} size={16} /> }))}
                        value={child.categoryId}
                        onChange={(val) => handleChildChange(idx, 'categoryId', val)}
                        placeholder="Select Category..."
                        emptyText="No categories found."
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Note <span className="font-normal opacity-70">(optional)</span></Label>
                    <input className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                      value={child.note} onChange={e => handleChildChange(idx, 'note', e.target.value)} placeholder="Specific detail..." />
                  </div>
                </div>
              ))}
            </div>
            
            <button type="button" onClick={handleAddChild} className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-border hover:border-brand text-muted-foreground hover:text-brand font-medium rounded-xl transition-colors mb-2 text-sm">
              <Plus size={16} className="mr-2"/> Add Split Part
            </button>
            
            <button type="submit" disabled={loading || remainingMinor !== 0} className="w-full flex items-center justify-center py-2.5 px-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 size={16} className="animate-spin mr-2"/> Splitting…</> : 'Split Transaction'}
            </button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
