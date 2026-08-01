'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, editCategory, deleteCategory } from '@/lib/actions/categories';
import { DynamicCategoryIcon } from '@/lib/icons';
import { Plus, Loader2, X, AlertTriangle, Lightbulb } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import type { CategoryAnalyticsDTO } from '@/lib/queries/analytics';
import { CategoryCard, type CategoryData } from './CategoryCard';

function CategoryModal({ category, onClose }: { category?: CategoryData, onClose: () => void }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState(category?.type ?? 'expense');

  const isEdit = Boolean(category);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit && category) {
        await editCategory(category.id, { name, type });
      } else {
        await createCategory({ name, type });
      }
      startT(() => router.refresh());
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:420, padding:'2rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="card-title" style={{ marginBottom:0, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} style={{ background:'var(--surface-sunken)', border:'1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover-bg-active"><X size={16}/></button>
        </div>
        {error && <div style={{ padding:'0.75rem 1rem', borderRadius:8, background:'var(--color-expense-light)', color:'var(--color-expense)', fontSize:'0.85rem', marginBottom:'1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}><AlertTriangle size={16} /> {error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--color-text-secondary)', marginBottom:'0.5rem' }}>Category Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.65rem 0.85rem', fontSize:'0.9rem', borderRadius: 8, border: '1px solid var(--border)' }}
              value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Groceries, Salary, Rent" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--color-text-secondary)', marginBottom:'0.5rem' }}>Type</label>
            <select className="input-field" style={{ width:'100%', padding:'0.65rem 0.85rem', fontSize:'0.9rem', textTransform:'capitalize', borderRadius: 8, border: '1px solid var(--border)' }}
              value={type} onChange={e => setType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="savings">Savings / Transfer</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:700, textTransform: 'uppercase', letterSpacing: '0.05em', color:'var(--color-text-secondary)', marginBottom:'0.5rem' }}>Icon</label>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
              Icons are automatically assigned based on the category name.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <DynamicCategoryIcon category={name} size={20} style={{ color: 'var(--color-brand)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                Preview based on name
              </span>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.85rem', marginTop:'0.5rem', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600 }}>
            {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : (isEdit ? 'Save Changes' : 'Create Category')}
          </button>
        </form>
      </div>
    </div>
  );
}

export function CategoriesClient({ 
  initialCategories,
  analytics,
  currency = 'KES'
}: { 
  initialCategories: CategoryData[];
  analytics: CategoryAnalyticsDTO[];
  currency?: string;
}) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState<CategoryData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const expenses = initialCategories.filter(c => c.type === 'expense');
  const incomes = initialCategories.filter(c => c.type === 'income');
  const savings = initialCategories.filter(c => c.type === 'savings');

  // Analytics mapping
  const analyticsMap = Object.fromEntries(analytics.map(a => [a.categoryId, a]));

  async function handleDelete(cat: CategoryData) {
    if (cat._count.transactions > 0 || cat._count.budgets > 0) {
      setErrorMsg(`Cannot delete '${cat.name}'. It is currently used in ${cat._count.transactions} transactions and ${cat._count.budgets} budgets.`);
      return;
    }
    
    if (!confirm(`Are you sure you want to permanently delete the category '${cat.name}'?`)) return;
    
    setDeletingId(cat.id);
    setErrorMsg(null);
    try {
      await deleteCategory(cat.id);
      startT(() => router.refresh());
    } catch (e: unknown) {
      setErrorMsg(getErrorMessage(e) || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  }

  // Level 1: Immediate Answer (Advisor Note)
  const risingCategories = analytics.filter(a => a.trendLabel.includes('Rising') && a.totalSixMonthSpendMinor > 0);
  const volatileCategories = analytics.filter(a => a.volatilityLabel === 'Highly Variable');
  
  let advisorMessage = "Your spending patterns appear stable across most categories.";
  if (risingCategories.length > 2) {
    advisorMessage = `Attention required: ${risingCategories.length} categories are showing rapidly rising spending trends.`;
  } else if (risingCategories.length > 0) {
    advisorMessage = `Watch out for ${risingCategories[0].name}, which is trending upwards.`;
  } else if (volatileCategories.length > 0) {
    advisorMessage = `You have highly variable spending in ${volatileCategories[0].name}.`;
  }

  const renderSection = (title: string, items: CategoryData[]) => {
    return (
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            {title}
          </h3>
          <span style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border)', padding: '0.15rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
            {items.length}
          </span>
        </div>
        
        {items.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface-sunken)', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>No {title.toLowerCase()} configured.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {items.map(cat => (
              <CategoryCard 
                key={cat.id} 
                category={cat} 
                analytics={analyticsMap[cat.id]}
                currency={currency}
                deletingId={deletingId}
                onEdit={setEditCat}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {showAdd && <CategoryModal onClose={() => setShowAdd(false)} />}
      {editCat && <CategoryModal category={editCat} onClose={() => setEditCat(null)} />}
      
      {/* Level 1 & 2: Hero & Immediate Answer */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4 animate-in">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Category Analytics</h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Monitor behavior, volatility, and spending velocity across your habits.</p>
        </div>
        
        {/* Level 5: CRUD is deprioritized but accessible */}
        <button className="btn btn-secondary" onClick={() => setShowAdd(true)} style={{ padding: '0.65rem 1.25rem', borderRadius: 8, fontWeight: 700 }}>
          <Plus size={16}/> New Category
        </button>
      </div>

      {/* Advisor Insight */}
      <div className="card mb-10 animate-in delay-1" style={{ padding: '1.25rem', borderRadius: 12, background: 'var(--color-brand-light)', border: '1px solid var(--color-brand)', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Lightbulb size={18} style={{ color: 'var(--color-brand)' }} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-brand)' }}>Advisor Note</h4>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '1rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {advisorMessage}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="animate-in mb-6" style={{ padding: '1rem 1.25rem', background: 'var(--color-expense-light)', color: 'var(--color-expense)', borderRadius: 12, border: '1px solid var(--color-expense)', display: 'flex', alignItems: 'flex-start', gap: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} style={{ marginLeft: 'auto', background: 'var(--color-expense)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
        </div>
      )}

      {/* Level 3 & 4: Detailed Breakdowns */}
      <div className="animate-in delay-2">
        {renderSection('Expenses', expenses)}
        {renderSection('Income', incomes)}
        {renderSection('Savings & Transfers', savings)}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-subtle:hover {
          background-color: var(--surface-sunken) !important;
        }
        .category-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-strong, var(--border));
        }
        .category-card:hover .category-actions {
          opacity: 1 !important;
        }
      `}} />
    </div>
  );
}
