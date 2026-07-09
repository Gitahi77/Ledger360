'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, editCategory, deleteCategory } from '@/lib/actions/categories';
import { DynamicCategoryIcon } from '@/lib/icons';
import { Plus, Trash2, Edit2, Loader2, X, TriangleAlert } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  _count: {
    transactions: number;
    budgets: number;
  };
};

function CategoryModal({ category, onClose }: { category?: Category, onClose: () => void }) {
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
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
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
        {error && <div style={{ padding:'0.75rem 1rem', borderRadius:8, background:'var(--color-expense-light)', color:'var(--color-expense)', fontSize:'0.85rem', marginBottom:'1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}><TriangleAlert size={16} /> {error}</div>}
        
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
              Name your category after a common label (e.g. "Matatu", "NHIF",
              "Supermarket") to get the right icon automatically.
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

export function CategoriesClient({ initialCategories, currency }: { initialCategories: Category[], currency: string }) {
  const router = useRouter();
  const [, startT] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const expenses = initialCategories.filter(c => c.type === 'expense');
  const incomes = initialCategories.filter(c => c.type === 'income');
  const savings = initialCategories.filter(c => c.type === 'savings');

  async function handleDelete(cat: Category) {
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
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  }

  const renderSection = (title: string, items: Category[], type: 'expense' | 'income' | 'savings') => {
    const isExpense = type === 'expense';
    const isIncome = type === 'income';
    const colorVar = isExpense ? 'var(--color-expense)' : isIncome ? 'var(--color-income)' : 'var(--color-brand)';
    const bgVar = isExpense ? 'var(--color-expense-light)' : isIncome ? 'var(--color-income-light)' : 'var(--color-brand-light)';

    return (
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {items.map(cat => (
              <div key={cat.id} className="card category-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: bgVar, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${colorVar}40`, boxShadow: `inset 0 2px 4px rgba(255,255,255,0.1)` }}>
                    <DynamicCategoryIcon category={cat.name} size={24} style={{ color: colorVar }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 500 }}>{cat._count.transactions}</span> txns
                      <span style={{ color: 'var(--border)' }}>•</span>
                      <span style={{ fontWeight: 500 }}>{cat._count.budgets}</span> budgets
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 category-actions" style={{ opacity: 0.7, transition: 'opacity 0.2s' }}>
                  <button onClick={() => setEditCat(cat)} 
                    style={{ background:'var(--surface-sunken)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--color-text-primary)', display:'flex', padding:'0.5rem', borderRadius: 8, transition: 'all 0.2s' }}
                    className="hover-bg-active"
                    title="Edit Category"
                  >
                    <Edit2 size={16}/>
                  </button>
                  <button onClick={() => handleDelete(cat)} disabled={deletingId === cat.id}
                    style={{ background:'var(--surface-sunken)', border:'1px solid var(--border)', cursor:'pointer', color: (cat._count.transactions > 0 || cat._count.budgets > 0) ? 'var(--color-text-secondary)' : 'var(--color-expense)', display:'flex', padding:'0.5rem', borderRadius: 8, opacity: (cat._count.transactions > 0 || cat._count.budgets > 0) ? 0.4 : 1, transition: 'all 0.2s' }}
                    className="hover-bg-active"
                    title={(cat._count.transactions > 0 || cat._count.budgets > 0) ? "Cannot delete category in use" : "Delete Category"}
                  >
                    {deletingId === cat.id ? <Loader2 size={16} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={16}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      {showAdd && <CategoryModal onClose={() => setShowAdd(false)} />}
      {editCat && <CategoryModal category={editCat} onClose={() => setEditCat(null)} />}
      
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4 animate-in">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Categories</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Manage how your transactions are classified.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ padding: '0.65rem 1.25rem', borderRadius: 8, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <Plus size={16}/> New Category
        </button>
      </div>

      {errorMsg && (
        <div className="animate-in mb-6" style={{ padding: '1rem 1.25rem', background: 'var(--color-expense-light)', color: 'var(--color-expense)', borderRadius: 12, border: '1px solid var(--color-expense)', display: 'flex', alignItems: 'flex-start', gap: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <TriangleAlert size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} style={{ marginLeft: 'auto', background: 'var(--color-expense)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
        </div>
      )}

      <div className="animate-in delay-1">
        {renderSection('Expenses', expenses, 'expense')}
        {renderSection('Income', incomes, 'income')}
        {renderSection('Savings & Transfers', savings, 'savings')}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-active:hover {
          background-color: var(--surface-card) !important;
          box-shadow: var(--shadow-sm);
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
