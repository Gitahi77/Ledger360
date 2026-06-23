'use client';
// src/app/settings/SavingsAutomationSection.tsx
// Save-More-Tomorrow settings UI (WO-15, B-5).
// Transparent and reversible (B-0): shows what happens on each income,
// lists recent auto-saves with Undo buttons.
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  upsertSavingsPlan,
  toggleSavingsPlan,
  deleteSavingsPlan,
} from '@/lib/actions/savings';
import { deleteTransfer } from '@/lib/actions/transfers';
import { toMajor } from '@/lib/money';
import { fmtAdaptive } from '@/lib/format';
import {
  Loader2, CheckCircle2, AlertTriangle, Undo2, Trash2,
  TrendingUp, Pause, Play, PiggyBank, Info,
} from 'lucide-react';

/* ── Types ────────────────────────────────────────────────── */
type Account = { id: string; name: string; type: string; currency: string };
type Goal    = { id: string; name: string };
type Plan    = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  goalId: string | null;
  baseRatePct: number;
  escalationPct: number;
  maxRatePct: number;
  currentRatePct: number;
  nextEscalation: Date | string;
  active: boolean;
  fromAccount?: { id: string; name: string; type: string; currency: string } | null;
  toAccount?:   { id: string; name: string; type: string; currency: string } | null;
  goal?:        { id: string; name: string } | null;
} | null;
type AutoSave = {
  id: string;
  amountMinor: number;
  date: Date | string;
  fromAccount?: { name: string; currency: string } | null;
  toAccount?:   { name: string; currency: string } | null;
};

/* ── Shared sub-components ────────────────────────────────── */
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 0', borderBottom:'1px solid var(--border-light)', gap:'1rem', flexWrap:'wrap' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)', marginTop:'0.15rem' }}>{desc}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        width:42, height:24, borderRadius:999, border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'linear-gradient(90deg,rgb(39, 174, 96),rgb(30, 132, 73))' : 'var(--border)',
        position:'relative', transition:'background 0.2s',
        boxShadow: checked ? '0 2px 6px rgba(39,174,96,0.35)' : 'inset 0 1px 3px rgba(0,0,0,0.15)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ position:'absolute', top:3, left: checked ? 21 : 3, width:18, height:18, borderRadius:'50%', background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.25)', transition:'left 0.2s' }} />
    </button>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export function SavingsAutomationSection({
  plan: initialPlan,
  accounts,
  goals,
  autoSaves: initialAutoSaves,
  currency,
}: {
  plan: Plan;
  accounts: Account[];
  goals: Goal[];
  autoSaves: AutoSave[];
  currency: string;
}) {
  const router = useRouter();
  const [, startT] = useTransition();

  // State
  const [plan, setPlan] = useState(initialPlan);
  const [autoSaves, setAutoSaves] = useState(initialAutoSaves);

  const [fromAccountId, setFromAccountId] = useState(plan?.fromAccountId ?? (accounts[0]?.id || ''));
  const [toAccountId, setToAccountId]     = useState(plan?.toAccountId ?? '');
  const [goalId, setGoalId]               = useState(plan?.goalId ?? '');
  const [baseRatePct, setBaseRatePct]     = useState(String(plan?.baseRatePct ?? 10));
  const [escalationPct, setEscalationPct] = useState(String(plan?.escalationPct ?? 1));
  const [maxRatePct, setMaxRatePct]       = useState(String(plan?.maxRatePct ?? 30));
  const [active, setActive]               = useState(plan?.active ?? true);

  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [undoing, setUndoing] = useState<string | null>(null);

  // Check if selected destination is savings/investment
  const selectedToAccount = accounts.find(a => a.id === toAccountId);
  const isSavingsDestination = selectedToAccount?.type === 'savings' || selectedToAccount?.type === 'investment';
  const needsGoal = toAccountId && !isSavingsDestination;

  // Filter destination accounts (exclude source)
  const destAccounts = accounts.filter(a => a.id !== fromAccountId);

  const inputStyle: React.CSSProperties = {
    width: 70, padding: '0.375rem 0.5rem', borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--surface-card)',
    color: 'var(--color-text-primary)', fontSize: '0.8rem', textAlign: 'center',
    fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700,
  };

  const selectStyle: React.CSSProperties = {
    padding: '0.375rem 0.625rem', borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--surface-card)',
    color: 'var(--color-text-primary)', fontSize: '0.8rem', fontFamily: 'inherit',
    outline: 'none', cursor: 'pointer', maxWidth: '100%',
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false); setError('');
    try {
      await upsertSavingsPlan({
        fromAccountId,
        toAccountId,
        goalId: goalId || null,
        baseRatePct:   Math.min(80, Math.max(1, parseInt(baseRatePct) || 10)),
        escalationPct: Math.min(20, Math.max(0, parseInt(escalationPct) || 1)),
        maxRatePct:    Math.min(80, Math.max(1, parseInt(maxRatePct) || 30)),
        active,
      });
      setSaving(false); setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      startT(() => router.refresh());
    } catch (err: any) {
      setSaving(false); setError(err?.message ?? 'Save failed');
    }
  }

  async function handleToggle() {
    const newActive = !active;
    setActive(newActive);
    try {
      await toggleSavingsPlan(newActive);
      startT(() => router.refresh());
    } catch (err: any) {
      setActive(!newActive); // revert on failure
      setError(err?.message ?? 'Toggle failed');
    }
  }

  async function handleUndo(transferId: string) {
    setUndoing(transferId);
    try {
      await deleteTransfer(transferId);
      setAutoSaves(prev => prev.filter(s => s.id !== transferId));
      startT(() => router.refresh());
    } catch (err: any) {
      setError(err?.message ?? 'Undo failed');
    } finally {
      setUndoing(null);
    }
  }

  return (
    <div>
      {/* Header with icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, rgb(39, 174, 96), rgb(30, 132, 73))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TrendingUp size={16} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
            Save-More-Tomorrow
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
            Automatically save a growing % of every income
          </div>
        </div>
      </div>

      {/* Info box */}
      <div style={{ padding: '0.75rem', background: 'var(--bg-app)', borderRadius: 8, display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Info size={14} color="var(--color-text-secondary)" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Each time you record income, Ledger360 automatically creates a transfer to your savings.
          The rate starts at your base rate and escalates monthly until the cap.
          Every auto-save is visible here and can be undone instantly.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* Source Account */}
        <Row label="Source Account" desc="Where auto-saves are deducted from">
          <select style={selectStyle} value={fromAccountId} onChange={e => setFromAccountId(e.target.value)}>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
            ))}
          </select>
        </Row>

        {/* Destination Account */}
        <Row label="Destination Account" desc="Where savings are sent (savings/investment recommended)">
          <select style={selectStyle} value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
            <option value="">Select destination…</option>
            {destAccounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.type})
                {(a.type === 'savings' || a.type === 'investment') ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </Row>

        {/* Goal (required if destination isn't savings/investment) */}
        {needsGoal && (
          <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(217, 119, 6, 0.08)', borderRadius: 6, marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--warning, rgb(217, 119, 6))', fontWeight: 600, marginBottom: '0.25rem' }}>
              ⚠ Non-savings account selected — a goal is required
            </div>
            <select style={selectStyle} value={goalId} onChange={e => setGoalId(e.target.value)}>
              <option value="">Select a goal…</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Goal (optional for savings/investment accounts) */}
        {!needsGoal && (
          <Row label="Goal (optional)" desc="Link auto-saves to a specific goal">
            <select style={selectStyle} value={goalId} onChange={e => setGoalId(e.target.value)}>
              <option value="">None</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </Row>
        )}

        {/* Rate fields */}
        <Row label="Base Rate" desc="Starting auto-save percentage of income">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input type="number" value={baseRatePct} min={1} max={80}
              onChange={e => setBaseRatePct(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>%</span>
          </div>
        </Row>

        <Row label="Escalation" desc="Monthly increase (percentage points)">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input type="number" value={escalationPct} min={0} max={20}
              onChange={e => setEscalationPct(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>pp/mo</span>
          </div>
        </Row>

        <Row label="Max Rate" desc="Rate will never exceed this cap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input type="number" value={maxRatePct} min={1} max={80}
              onChange={e => setMaxRatePct(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>%</span>
          </div>
        </Row>

        {/* Current rate (read-only, from plan) */}
        {plan && (
          <Row label="Current Rate" desc="Active rate after escalation">
            <span style={{ fontSize: '0.875rem', fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif', color: 'var(--color-income, rgb(39, 174, 96))' }}>
              {plan.currentRatePct}%
            </span>
          </Row>
        )}

        {/* Next escalation (read-only) */}
        {plan && (
          <Row label="Next Escalation" desc="When the rate bumps next">
            <span style={{ fontSize: '0.8rem', fontFamily: 'Space Grotesk,sans-serif', color: 'var(--color-text-primary)' }}>
              {new Date(plan.nextEscalation).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </Row>
        )}

        {/* Active toggle */}
        <Row label="Active" desc={active ? 'Auto-save triggers on every income' : 'Paused — no auto-saves until re-enabled'}>
          <Toggle checked={active} onChange={handleToggle} />
        </Row>

        {/* Save button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="submit" disabled={saving || !toAccountId} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <PiggyBank size={13} />}
            {saving ? 'Saving…' : (plan ? 'Update Plan' : 'Create Plan')}
          </button>
          {saved && (
            <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--color-income)', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Saved!
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--color-expense)', fontWeight: 600 }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>
      </form>

      {/* Recent Auto-Saves with Undo */}
      {autoSaves.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.625rem' }}>
            Recent Auto-Saves
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: 280, overflowY: 'auto' }}>
            {autoSaves.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.625rem 0.75rem', background: 'var(--bg-app)', borderRadius: 8,
                border: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {fmtAdaptive(toMajor(s.amountMinor), currency)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                    {s.fromAccount?.name ?? '?'} → {s.toAccount?.name ?? '?'} · {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => handleUndo(s.id)}
                  disabled={undoing === s.id}
                  title="Undo this auto-save"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.3rem 0.5rem', borderRadius: 6,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--color-expense)', fontSize: '0.72rem', cursor: 'pointer',
                    opacity: undoing === s.id ? 0.5 : 1,
                  }}
                >
                  {undoing === s.id ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Undo2 size={11} />}
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
