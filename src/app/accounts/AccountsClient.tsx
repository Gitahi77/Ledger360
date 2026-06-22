'use client';
// src/app/accounts/AccountsClient.tsx
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAccount, updateAccount, deleteAccount } from '@/lib/actions/accounts';
import { Plus, Edit2, Trash2, Loader2, X, Archive, Landmark, Wallet, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';
import { fmtAdaptive, formatKES } from '@/lib/format';

type Account = {
  id: string; name: string; type: string; currency: string;
  openingMinor: number; balanceMinor: number; archived: boolean;
};

const ACCOUNT_TYPES = [
  { id: 'CHECKING',       label: 'Checking',      icon: Landmark,  color: 'var(--text-primary)' },
  { id: 'SAVINGS',        label: 'Savings',       icon: Landmark,  color: 'var(--text-primary)' },
  { id: 'MPESA',          label: 'M-Pesa',        icon: Smartphone, color: 'var(--color-mpesa)' },
  { id: 'AIRTEL_MONEY',   label: 'Airtel Money',  icon: Smartphone, color: 'var(--danger)' },
  { id: 'CREDIT_CARD',    label: 'Credit Card',   icon: CreditCard, color: 'var(--warning)' },
  { id: 'SACCO_DEPOSIT',  label: 'SACCO Deposit', icon: Landmark,  color: 'var(--success)' },
  { id: 'SACCO_LOAN',     label: 'SACCO Loan',    icon: Landmark,  color: 'var(--warning)' },
  { id: 'CHAMA',          label: 'Chama',         icon: Wallet,    color: 'var(--purple)' },
  { id: 'BROKERAGE',      label: 'Brokerage',     icon: TrendingUpIcon, color: 'var(--teal)' },
  { id: 'MORTGAGE',       label: 'Mortgage',      icon: Landmark,  color: 'var(--warning)' },
  { id: 'AUTO_LOAN',      label: 'Auto Loan',     icon: Landmark,  color: 'var(--warning)' },
  { id: 'CRYPTO',         label: 'Crypto',        icon: Wallet,    color: 'var(--purple)' },
];

const ACCOUNT_GROUPS = [
  { label: 'Mobile Money', types: ['MPESA', 'AIRTEL_MONEY'] },
  { label: 'Bank & Cash',  types: ['CHECKING', 'SAVINGS'] },
  { label: 'SACCOs & Chamas', types: ['SACCO_DEPOSIT', 'CHAMA'] },
  { label: 'Loans',        types: ['CREDIT_CARD', 'SACCO_LOAN', 'MORTGAGE', 'AUTO_LOAN'] },
  { label: 'Investments',  types: ['BROKERAGE', 'CRYPTO'] },
];

// Helper to get an icon
function TrendingUpIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>;
}

export function AccountsClient({ accounts, currency }: { accounts: Account[], currency: string }) {
  const router = useRouter();
  const [, startT] = useTransition();

  const [showModal, setShowModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('CHECKING');
  const [opening, setOpening] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeAccounts = accounts.filter(a => !a.archived);
  const archivedAccounts = accounts.filter(a => a.archived);

  function openNew() {
    setEditingAcc(null);
    setName('');
    setType('CHECKING');
    setOpening('');
    setError('');
    setShowModal(true);
  }

  function openEdit(acc: Account) {
    setEditingAcc(acc);
    setName(acc.name);
    setType(acc.type);
    setOpening((toMajor(acc.openingMinor)).toString());
    setError('');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = {
        name,
        type: type as any,
        openingMinor: toMinor(parseFloat(opening || '0')),
      };
      
      if (editingAcc) {
        await updateAccount(editingAcc.id, data);
      } else {
        await createAccount(data);
      }
      
      setShowModal(false);
      startT(() => router.refresh());
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleArchive(acc: Account) {
    try {
      await updateAccount(acc.id, { archived: !acc.archived });
      startT(() => router.refresh());
    } catch (err: any) {
      alert(err.message ?? 'Could not archive account.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this account? This cannot be undone. You can only delete accounts that have no transactions.')) return;
    setDeletingId(id);
    try {
      await deleteAccount(id);
      startT(() => router.refresh());
    } catch (err: any) {
      alert(err.message ?? 'Could not delete account.');
    } finally {
      setDeletingId(null);
    }
  }

  function renderList(list: Account[], isArchivedList = false) {
    if (list.length === 0) {
      return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>No accounts found.</div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map(acc => {
          const typeObj = ACCOUNT_TYPES.find(t => t.id === acc.type);
          const Icon = typeObj?.icon || Landmark;
          return (
            <div key={acc.id} className="card animate-in" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isArchivedList ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color="var(--text-secondary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{acc.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {typeObj?.label} $ {acc.archived ? 'Archived' : 'Active'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Balance</p>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: acc.balanceMinor < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {formatKES(acc.balanceMinor)}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleToggleArchive(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title={acc.archived ? "Unarchive" : "Archive"}>
                    <Archive size={16} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} disabled={deletingId === acc.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Delete">
                    {deletingId === acc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderGroupedList(list: Account[], isArchivedList = false) {
    if (list.length === 0) {
      return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>No accounts found.</div>;
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {ACCOUNT_GROUPS.map(group => {
          const groupAccounts = list.filter(acc => group.types.includes(acc.type));
          if (groupAccounts.length === 0) return null;
          
          return (
            <div key={group.label}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.label}
              </h3>
              {renderList(groupAccounts, isArchivedList)}
            </div>
          );
        })}
        {/* Render any accounts that don't fit into defined groups */}
        {(() => {
          const groupedTypes = ACCOUNT_GROUPS.flatMap(g => g.types);
          const otherAccounts = list.filter(acc => !groupedTypes.includes(acc.type));
          if (otherAccounts.length === 0) return null;
          return (
            <div key="Other">
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Other
              </h3>
              {renderList(otherAccounts, isArchivedList)}
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Accounts</h1>
        <button onClick={openNew} className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Active Accounts</h2>
        {renderGroupedList(activeAccounts, false)}
      </div>

      {archivedAccounts.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Archived Accounts</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Archived accounts do not appear in dropdowns, but their balances still count toward your Net Worth.
          </p>
          {renderGroupedList(archivedAccounts, true)}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 400, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{editingAcc ? 'Edit Account' : 'New Account'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            {error && <div style={{ padding: '0.625rem', borderRadius: 7, background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Account Name</label>
                <input required className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                  value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Checking" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Type</label>
                <select required className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                  value={type} onChange={e => setType(e.target.value)}>
                  {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Opening Balance ({currency})</label>
                <input type="number" step="0.01" inputMode="decimal" className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                  value={opening} onChange={e => setOpening(e.target.value)} placeholder="0.00" />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Set the starting balance before adding transactions in Ledger360.
                </p>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1.25rem', marginTop: '0.5rem' }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
