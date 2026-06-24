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

import { getAccountIcon } from '@/lib/icons';
import { getAccountGroup, ACCOUNT_GROUPS } from '@/lib/accounts';
import type { AccountType } from '@prisma/client';

const ACCOUNT_TYPES = [
  { id: 'CHECKING',       label: 'Checking' },
  { id: 'SAVINGS',        label: 'Savings' },
  { id: 'MPESA',          label: 'M-Pesa' },
  { id: 'AIRTEL_MONEY',   label: 'Airtel Money' },
  { id: 'CREDIT_CARD',    label: 'Credit Card' },
  { id: 'SACCO_DEPOSIT',  label: 'SACCO Deposit' },
  { id: 'SACCO_LOAN',     label: 'SACCO Loan' },
  { id: 'CHAMA',          label: 'Chama' },
  { id: 'BROKERAGE',      label: 'Brokerage' },
  { id: 'MORTGAGE',       label: 'Mortgage' },
  { id: 'AUTO_LOAN',      label: 'Auto Loan' },
  { id: 'CRYPTO',         label: 'Crypto' },
];

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
      return <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', padding: '1rem' }}>No accounts found.</div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {list.map(acc => {
          const typeObj = ACCOUNT_TYPES.find(t => t.id === acc.type);
          const iconClass = getAccountIcon(acc.type as AccountType);
          return (
            <div key={acc.id} className="card animate-in" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isArchivedList ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`ti ${iconClass}`} style={{ fontSize: 20, color: 'var(--color-text-secondary)' }}></i>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{acc.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    {typeObj?.label} $ {acc.archived ? 'Archived' : 'Active'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>Balance</p>
                  <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: acc.balanceMinor < 0 ? 'var(--color-expense)' : 'var(--color-text-primary)' }}>
                    {formatKES(acc.balanceMinor)}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEdit(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleToggleArchive(acc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} title={acc.archived ? "Unarchive" : "Archive"}>
                    <Archive size={16} />
                  </button>
                  <button onClick={() => handleDelete(acc.id)} disabled={deletingId === acc.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-expense)' }} title="Delete">
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
      return <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', padding: '1rem' }}>No accounts found.</div>;
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.entries(ACCOUNT_GROUPS).map(([groupLabel, types]) => {
          const groupAccounts = list.filter(acc => (types as string[]).includes(acc.type));
          if (groupAccounts.length === 0) return null;
          
          return (
            <div key={groupLabel}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {groupLabel}
              </h3>
              {renderList(groupAccounts, isArchivedList)}
            </div>
          );
        })}
        {/* Render any accounts that don't fit into defined groups */}
        {(() => {
          const groupedTypes = Object.values(ACCOUNT_GROUPS).flat();
          const otherAccounts = list.filter(acc => !groupedTypes.includes(acc.type as AccountType));
          if (otherAccounts.length === 0) return null;
          return (
            <div key="Other">
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Accounts</h1>
        <button onClick={openNew} className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Active Accounts</h2>
        {renderGroupedList(activeAccounts, false)}
      </div>

      {archivedAccounts.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Archived Accounts</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Archived accounts do not appear in dropdowns, but their balances still count toward your Net Worth.
          </p>
          {renderGroupedList(archivedAccounts, true)}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 400, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{editingAcc ? 'Edit Account' : 'New Account'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>

            {error && <div style={{ padding: '0.625rem', borderRadius: 7, background: 'var(--color-expense-light)', color: 'var(--color-expense)', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Account Name</label>
                <input required className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                  value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Checking" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Type</label>
                <select required className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                  value={type} onChange={e => setType(e.target.value)}>
                  {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>Opening Balance ({currency})</label>
                <input type="number" step="0.01" inputMode="decimal" className="input-field" style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
                  value={opening} onChange={e => setOpening(e.target.value)} placeholder="0.00" />
                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
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
