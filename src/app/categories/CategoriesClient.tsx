'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory, editCategory, deleteCategory } from '@/lib/actions/categories';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Plus, Trash2, Edit2, Loader2, X, AlertTriangle } from 'lucide-react';

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
  const [icon, setIcon] = useState(category?.icon ?? '');

  const isEdit = Boolean(category);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit && category) {
        await editCategory(category.id, { name, type, icon: icon || undefined });
      } else {
        await createCategory({ name, type, icon: icon || undefined });
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
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:400, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--color-expense-light)', color:'var(--color-expense)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Category Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Groceries" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Type</label>
            <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem', textTransform:'capitalize' }}
              value={type} onChange={e => setType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="savings">Savings</option>
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Icon Name (Optional)</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={icon} onChange={e => setIcon(e.target.value)} placeholder="e.g. shopping-cart" />
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Used to match lucide-react icons, if available.
            </p>
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem', marginTop:'0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : (isEdit ? 'Save Changes' : 'Create Category')}
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
    
    if (!confirm(`Delete category '${cat.name}'?`)) return;
    
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

  const renderSection = (title: string, items: Category[], color: string) => (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {title} <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>({items.length})</span>
      </h3>
      
      {items.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No categories.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {items.map(cat => (
            <div key={cat.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `3px solid ${color}` }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIcon category={cat.icon || cat.name.toLowerCase()} name={cat.name} size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                    Used in: {cat._count.transactions} tx, {cat._count.budgets} budgets
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button onClick={() => setEditCat(cat)} 
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.4rem', borderRadius: 6 }}
                  className="hover-bg-active"
                >
                  <Edit2 size={14}/>
                </button>
                <button onClick={() => handleDelete(cat)} disabled={deletingId === cat.id}
                  style={{ background:'none', border:'none', cursor:'pointer', color: (cat._count.transactions > 0 || cat._count.budgets > 0) ? 'var(--color-text-secondary)' : 'var(--color-expense)', display:'flex', padding:'0.4rem', borderRadius: 6, opacity: (cat._count.transactions > 0 || cat._count.budgets > 0) ? 0.5 : 1 }}
                  className="hover-bg-active"
                  title={(cat._count.transactions > 0 || cat._count.budgets > 0) ? "Cannot delete category in use" : "Delete"}
                >
                  {deletingId === cat.id ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={14}/>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {showAdd && <CategoryModal onClose={() => setShowAdd(false)} />}
      {editCat && <CategoryModal category={editCat} onClose={() => setEditCat(null)} />}
      
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3 animate-in">
        <div />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> New Category</button>
      </div>

      {errorMsg && (
        <div className="animate-in mb-5" style={{ padding: '1rem', background: 'var(--color-expense-light)', color: 'var(--color-expense)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      <div className="animate-in delay-1">
        {renderSection('Expenses', expenses, 'var(--color-expense)')}
        {renderSection('Income', incomes, 'var(--color-income)')}
        {renderSection('Savings & Transfers', savings, 'var(--color-brand)')}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-active:hover {
          background-color: var(--surface-active);
        }
      `}} />
    </>
  );
}
