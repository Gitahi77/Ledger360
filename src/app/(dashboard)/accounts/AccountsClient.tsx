'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createAccount, updateAccount, deleteAccount } from '@/lib/actions/accounts';
import { Plus, Edit2, Trash2, Loader2, X, Archive, MoreHorizontal, ArrowRightLeft } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';
import { formatCurrency } from '@/lib/finance/formatCurrency';
import { DynamicAccountIcon } from '@/lib/icons';
import { getErrorMessage } from '@/lib/errors';
import { EmptyState } from '@/components/os/EmptyState';
import { AccountsIntelligenceDTO } from '@/lib/types/accounts-intelligence';
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

function ActionMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }} onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
    }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }} title="Actions">
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '0.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.25rem', display: 'flex', flexDirection: 'column', zIndex: 10, minWidth: '140px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function AccountsClient({ intelligence, currency }: { intelligence: AccountsIntelligenceDTO, currency: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startT] = useTransition();

  const action = searchParams.get('action');
  const accountId = searchParams.get('accountId');
  const showModal = action === 'new' || action === 'edit';

  const isEditing = action === 'edit' && accountId;

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CHECKING');
  const [opening, setOpening] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Initialize form state when modal opens
  useState(() => {
    // If edit, we should ideally fetch the account details or find it in the DTO
    // Since the DTO has nativeBalance we could reconstruct opening roughly, but for now we won't populate opening edit perfectly
    // For a real app, editing opening balance might require a separate fetch or including it in the DTO capabilities.
    // We'll leave it blank if editing, as it shouldn't be casually edited anyway.
  });

  function closeModal() {
    router.replace(pathname);
    setName('');
    setType('CHECKING');
    setOpening('');
    setError('');
  }

  function openNew() {
    router.push(`${pathname}?action=new`);
  }

  function openEdit(id: string, currentName: string, currentType: string) {
    setName(currentName);
    setType(currentType as AccountType);
    router.push(`${pathname}?action=edit&accountId=${id}`);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = {
        name,
        type: type as AccountType,
        openingMinor: toMinor(parseFloat(opening || '0')),
      };
      
      if (isEditing && accountId) {
        await updateAccount(accountId, { name, type: type as AccountType });
      } else {
        await createAccount(data);
      }
      
      closeModal();
      startT(() => router.refresh());
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleArchive(id: string, isCurrentlyArchived: boolean) {
    try {
      await updateAccount(id, { archived: !isCurrentlyArchived });
      startT(() => router.refresh());
    } catch (err: unknown) {
      alert(getErrorMessage(err) ?? 'Could not archive account.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this account? This cannot be undone. You can only delete accounts that have no transactions.')) return;
    setDeletingId(id);
    try {
      await deleteAccount(id);
      startT(() => router.refresh());
    } catch (err: unknown) {
      alert(getErrorMessage(err) ?? 'Could not delete account.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* 1. Accounts Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 0.5rem 0' }}>
            Net Position
          </h1>
          <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {formatCurrency(intelligence.totalPosition)}
          </p>
          {intelligence.dataFreshness.status === 'stale' && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'currentColor' }} />
              Data may be stale (last updated {new Date(intelligence.dataFreshness.lastUpdatedAt).toLocaleString()})
            </p>
          )}
        </div>
        <button onClick={openNew} className="btn btn-primary" style={{ gap: '0.5rem', alignSelf: 'flex-start' }}>
          <Plus size={16} /> Add Account
        </button>
      </div>

      {/* 2. Main Body */}
      {intelligence.domainState === 'onboarding' ? (
        <EmptyState 
          title="Where is your money?"
          description="Add your first account to start tracking your net position and organizing your finances."
          icon={<DynamicAccountIcon type="CHECKING" size={48} />}
          action={<button onClick={openNew} className="btn btn-primary">Add First Account</button>}
          style={{ background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border-color)' }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          {intelligence.accountGroups.map(group => (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0' }}>
                {group.label}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {group.accounts.map(acc => (
                  <div key={acc.id} className="card animate-in" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DynamicAccountIcon type={acc.type as AccountType} size={22} style={{ color: 'var(--color-text-secondary)' }} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{acc.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            {ACCOUNT_TYPES.find(t => t.id === acc.type)?.label || 'Account'}
                          </p>
                          {acc.health.status !== 'healthy' && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 4, background: 'var(--color-expense-light)', color: 'var(--color-expense)', fontWeight: 500 }}>
                              {acc.health.message || acc.health.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {formatCurrency(acc.reportingBalance)}
                        </p>
                        {acc.nativeBalance.currency !== acc.reportingBalance.currency && (
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {formatCurrency(acc.nativeBalance)}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Menu */}
                      <ActionMenu>
                        {acc.capabilities.canTransfer && (
                          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                            <ArrowRightLeft size={14} /> Transfer
                          </button>
                        )}
                        {acc.capabilities.canEdit && (
                          <button onClick={() => openEdit(acc.id, acc.name, acc.type)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                            <Edit2 size={14} /> Edit
                          </button>
                        )}
                        {acc.capabilities.canArchive && (
                          <button onClick={() => handleToggleArchive(acc.id, false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                            <Archive size={14} /> Archive
                          </button>
                        )}
                        {acc.capabilities.canDelete && (
                          <button onClick={() => handleDelete(acc.id)} disabled={deletingId === acc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-expense)' }}>
                            {deletingId === acc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                          </button>
                        )}
                      </ActionMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Archived Section */}
      {intelligence.archivedAccounts.length > 0 && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Archived Accounts</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.7 }}>
            {intelligence.archivedAccounts.map(acc => (
              <div key={acc.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DynamicAccountIcon type={acc.type as AccountType} size={18} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{acc.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Archived</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      {formatCurrency(acc.reportingBalance)}
                    </p>
                  </div>
                  
                  <ActionMenu>
                    {acc.capabilities.canUnarchive && (
                      <button onClick={() => handleToggleArchive(acc.id, true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                        <Archive size={14} /> Unarchive
                      </button>
                    )}
                    {acc.capabilities.canDelete && (
                      <button onClick={() => handleDelete(acc.id)} disabled={deletingId === acc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-expense)' }}>
                        {deletingId === acc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                      </button>
                    )}
                  </ActionMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 420, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{isEditing ? 'Edit Account' : 'New Account'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>

            {error && <div style={{ padding: '0.75rem', borderRadius: 8, background: 'var(--color-expense-light)', color: 'var(--color-expense)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{error}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>Account Name</label>
                <input required className="input-field" style={{ width: '100%', padding: '0.65rem 0.75rem', fontSize: '0.9rem' }}
                  value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Checking" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>Account Type</label>
                <select required className="input-field" style={{ width: '100%', padding: '0.65rem 0.75rem', fontSize: '0.9rem', backgroundColor: 'var(--bg-input)' }}
                  value={type} onChange={e => setType(e.target.value as AccountType)}>
                  {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {!isEditing && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>Opening Balance ({currency})</label>
                  <input type="number" step="0.01" inputMode="decimal" className="input-field" style={{ width: '100%', padding: '0.65rem 0.75rem', fontSize: '0.9rem' }}
                    value={opening} onChange={e => setOpening(e.target.value)} placeholder="0.00" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', lineHeight: 1.4 }}>
                    Set the starting balance before adding transactions. Cannot be changed later.
                  </p>
                </div>
              )}

              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={closeModal} className="btn" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
