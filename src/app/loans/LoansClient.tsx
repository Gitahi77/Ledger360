'use client';
// src/app/loans/LoansClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addLoan, editLoan, updateLoanBalance, deleteLoan } from '@/lib/actions/loans';
import { addTransaction } from '@/lib/actions/transactions';
import { fmtAdaptive } from '@/lib/format';
import { Plus, Trash2, Loader2, X, CreditCard, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';

type Loan = {
  id: string; name: string; lender: string; type: string;
  originalAmountMinor: number; balanceMinor: number; annualRate: number;
  monthlyPaymentMinor: number; nextDue: Date; daysOverdue: number;
};

// All colours via CSS token vars — adapts to light and dark automatically
function loanStyle(l: Loan) {
  const paidPct = Math.min(100, Math.round(((l.originalAmountMinor - l.balanceMinor) / l.originalAmountMinor) * 100));
  if (l.daysOverdue > 0) return {
    badge: 'badge-danger',  label: 'Overdue',
    color: 'var(--danger)',  barGrad: 'linear-gradient(90deg,var(--danger),hsl(0,78%,72%))',
    glow: 'rgba(220,38,38,0.5)', paidPct,
  };
  // Due Soon only fires for FUTURE dates within 7 days — not past dates
  const nextDueDate = new Date(l.nextDue);
  const now = new Date();
  if (l.daysOverdue === 0 && nextDueDate >= now && nextDueDate < new Date(Date.now() + 7 * 86400000))
    return {
      badge: 'badge-warning', label: 'Due Soon',
      color: 'var(--warning)', barGrad: 'linear-gradient(90deg,var(--warning),hsl(38,92%,68%))',
      glow: 'rgba(217,119,6,0.4)', paidPct,
    };
  return {
    badge: 'badge-success', label: 'On Track',
    color: 'var(--success)', barGrad: 'linear-gradient(90deg,var(--success),hsl(152,65%,62%))',
    glow: 'rgba(22,163,74,0.4)', paidPct,
  };
}

/* ── Add Loan Modal ───────────────────────────────────────── */
function LoanModal({ loan, onClose, currency }: { loan?: Loan; onClose: () => void; currency: string }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [name,       setName]       = useState(loan?.name ?? '');
  const [lender,     setLender]     = useState(loan?.lender ?? '');
  const [type,       setType]       = useState(loan?.type ?? 'personal');
  const [origAmt,    setOrigAmt]    = useState(loan ? String(toMajor(loan.originalAmountMinor)) : '');
  const [balance,    setBalance]    = useState(loan ? String(toMajor(loan.balanceMinor)) : '');
  const [rate,       setRate]       = useState(loan ? String(loan.annualRate) : '');
  const [monthly,    setMonthly]    = useState(loan ? String(toMajor(loan.monthlyPaymentMinor)) : '');
  const [nextDue,    setNextDue]    = useState(loan?.nextDue ? new Date(loan.nextDue).toISOString().slice(0, 10) : '');
  const isEdit = Boolean(loan);

  const LOAN_TYPES = ['personal','mortgage','car','student','business','credit card','other'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isEdit && loan) {
        await editLoan(loan.id, {
          name, lender, type,
          originalAmountMinor: toMinor(parseFloat(origAmt)),
          balanceMinor:     toMinor(parseFloat(balance || origAmt)),
          annualRate:  parseFloat(rate),
          monthlyPaymentMinor:  toMinor(parseFloat(monthly)),
          nextDue,
        });
      } else {
        await addLoan({
          name, lender, type,
          originalAmountMinor: toMinor(parseFloat(origAmt)),
          balanceMinor:     toMinor(parseFloat(balance || origAmt)),
          annualRate:  parseFloat(rate),
          monthlyPaymentMinor:  toMinor(parseFloat(monthly)),
          nextDue,
        });
      }
      startT(() => router.refresh());
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:500, padding:'1.75rem', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>{isEdit ? 'Edit Loan' : 'Add Loan'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--danger-light)', color:'var(--danger)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Loan Name</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. KCB Personal Loan" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Lender</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={lender} onChange={e => setLender(e.target.value)} required placeholder="e.g. KCB Bank" />
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Loan Type</label>
            <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={type} onChange={e => setType(e.target.value)}>
              {LOAN_TYPES.map(t => <option key={t} value={t} style={{ textTransform:'capitalize' }}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Original Amount ({currency})</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="1" step="1" value={origAmt} onChange={e => setOrigAmt(e.target.value)} required placeholder="500000" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Current Balance ({currency})</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="0" step="1" value={balance} onChange={e => setBalance(e.target.value)} placeholder="Leave blank = same as original" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Annual Rate (%)</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="0" step="0.1" value={rate} onChange={e => setRate(e.target.value)} required placeholder="14.5" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Monthly Payment</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="1" step="1" value={monthly} onChange={e => setMonthly(e.target.value)} required placeholder="15000" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Next Due Date</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem', marginTop:'0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : (isEdit ? 'Save Changes' : 'Add Loan')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Expanded Forecast Panel (Interactive Extra Payment Simulator) ── */
function ExpandedForecast({ loan, monthsLeft, totalInterest, currency }: { loan: Loan; monthsLeft: number; totalInterest: number; currency: string }) {
  const [extraPayment, setExtraPayment] = useState(0);

  const monthlyRate = loan.annualRate / 100 / 12;
  const totalPmtMinor    = loan.monthlyPaymentMinor + toMinor(extraPayment);
  const minPmtMinor      = monthlyRate > 0 ? loan.balanceMinor * monthlyRate : 0;
  const newMonths   = totalPmtMinor <= minPmtMinor
    ? Infinity
    : monthlyRate > 0
      ? Math.ceil(Math.log(totalPmtMinor / (totalPmtMinor - loan.balanceMinor * monthlyRate)) / Math.log(1 + monthlyRate))
      : Math.ceil(loan.balanceMinor / totalPmtMinor);
  const newInterestMinor = isFinite(newMonths) ? Math.round(Math.max(0, (totalPmtMinor * newMonths) - loan.balanceMinor)) : 0;
  const monthsSaved = isFinite(monthsLeft) && isFinite(newMonths) ? Math.max(0, monthsLeft - newMonths) : 0;
  const interestSavedMinor = totalInterest - newInterestMinor;

  const payoffDate = (months: number) => {
    if (!isFinite(months)) return 'N/A';
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="animate-in" style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Repayment Forecast</div>

      {/* Base forecast */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem', marginBottom:'1rem' }}>
        {[
          { label:'Months Left',    value: isFinite(monthsLeft) ? `~${monthsLeft}` : '⚠ Check payment', sub:'at current pace' },
          { label:'Total Interest', value: fmtAdaptive(totalInterest, currency), sub:'estimated remaining' },
          { label:'Payoff Date',    value: payoffDate(monthsLeft), sub:'projected' },
        ].map(f => (
          <div key={f.label} style={{ background:'var(--bg-app)', borderRadius:8, padding:'0.625rem 0.875rem', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'0.2rem' }}>{f.label}</div>
            <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>{f.value}</div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginTop:'0.1rem' }}>{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Interactive extra payment simulator */}
      <div style={{ background:'var(--primary-light)', borderRadius:10, padding:'0.875rem 1rem', border:'1px solid var(--primary-dark)' }}>
        <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--primary)', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Extra Payment Simulator</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom: extraPayment > 0 ? '0.75rem' : 0 }}>
          <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>Pay extra {currency}</span>
          <input
            type="number" min="0" step="500"
            value={extraPayment || ''}
            onChange={e => setExtraPayment(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="e.g. 5000"
            className="input-field"
            style={{ width:'100%', padding:'0.4rem 0.65rem', fontSize:'0.82rem' }}
          />
          <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', whiteSpace:'nowrap' }}>per month</span>
        </div>
        {extraPayment > 0 && isFinite(newMonths) && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.5rem' }}>
            {[
              { label:'New payoff', value: payoffDate(newMonths), color:'var(--success)' },
              { label:'Months saved', value:`${monthsSaved} mo`, color:'var(--success)' },
              { label:'Interest saved', value: fmtAdaptive(interestSavedMinor, currency), color:'var(--success)' },
            ].map(r => (
              <div key={r.label} style={{ background:'var(--success-light)', borderRadius:7, padding:'0.5rem 0.625rem', border:'1px solid var(--success)' }}>
                <div style={{ fontSize:'0.58rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:'0.15rem' }}>{r.label}</div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'0.9rem', fontWeight:800, color: r.color }}>{r.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Record Payment Modal ─────────────────────────────────── */
function RecordPaymentModal({ loan, onClose, currency, categories }: { loan: Loan; onClose: () => void; currency: string; categories: { id: string; name: string }[] }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [payment,  setPayment]  = useState(String(toMajor(loan.monthlyPaymentMinor)));
  // Default next due date to +1 month from current due date
  const defaultNextDue = (() => {
    const d = new Date(loan.nextDue);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const [nextDue,  setNextDue]  = useState(defaultNextDue);
  const [recordTx, setRecordTx] = useState(false);
  const [categoryId, setCategoryId] = useState(categories.find(c => c.name.toLowerCase() === 'debt' || c.name.toLowerCase() === 'loan')?.id || categories[0]?.id || '');

  const paymentAmtMinor = toMinor(parseFloat(payment || '0'));
  // Correctly split payment into interest + principal (reducing-balance method)
  const monthlyRate       = loan.annualRate / 100 / 12;
  const interestChargeMinor    = Math.round(loan.balanceMinor * monthlyRate);
  const principalReductionMinor = Math.max(0, paymentAmtMinor - interestChargeMinor);
  const newBalanceMinor         = Math.max(0, loan.balanceMinor - principalReductionMinor);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await updateLoanBalance(loan.id, newBalanceMinor, 0, nextDue || undefined);
      
      if (recordTx && categoryId && paymentAmtMinor > 0) {
        await addTransaction({
          baseAmountMinor: paymentAmtMinor,
          name: `Loan Repayment: ${loan.name}`,
          type: 'expense',
          date: new Date().toISOString().slice(0, 10),
          categoryId,
          note: `Principal: ${toMajor(principalReductionMinor)} | Interest: ${toMajor(interestChargeMinor)}`,
        });
      }
      
      startT(() => router.refresh());
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:420, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title" style={{ marginBottom:0 }}>Record Payment</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'1rem' }}>
          Recording payment for <strong>{loan.name}</strong> · balance: {fmtAdaptive(loan.balanceMinor, currency)}
        </p>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Payment Amount ({currency})</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              type="number" min="1" step="1" value={payment} onChange={e => setPayment(e.target.value)} required autoFocus />
          </div>
          {/* Payment breakdown — interest vs principal */}
          {paymentAmtMinor > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
              <div style={{ padding:'0.6rem 0.75rem', borderRadius:8, background:'var(--warning-light)', fontSize:'0.75rem' }}>
                <div style={{ color:'var(--text-muted)', fontWeight:600, marginBottom:'0.1rem', textTransform:'uppercase', fontSize:'0.6rem', letterSpacing:'0.06em' }}>Interest this month</div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, color:'var(--danger)' }}>{fmtAdaptive(interestChargeMinor, currency)}</div>
              </div>
              <div style={{ padding:'0.6rem 0.75rem', borderRadius:8, background:'var(--success-light)', fontSize:'0.75rem' }}>
                <div style={{ color:'var(--text-muted)', fontWeight:600, marginBottom:'0.1rem', textTransform:'uppercase', fontSize:'0.6rem', letterSpacing:'0.06em' }}>Principal Paid</div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, color:'var(--success)' }}>{fmtAdaptive(principalReductionMinor, currency)}</div>
              </div>
            </div>
          )}
          {paymentAmtMinor > 0 && (
            <div style={{ padding:'0.6rem 0.75rem', borderRadius:8, background:'var(--primary-light)', fontSize:'0.75rem' }}>
              <div style={{ color:'var(--text-muted)', fontWeight:600, marginBottom:'0.1rem', textTransform:'uppercase', fontSize:'0.6rem', letterSpacing:'0.06em' }}>New balance</div>
              <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, color:'var(--primary)' }}>{fmtAdaptive(newBalanceMinor, currency)}</div>
            </div>
          )}
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>
              Next Due Date <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span>
            </label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} />
          </div>
          <div style={{ padding:'0.75rem', borderRadius:8, background:'var(--primary-light)', fontSize:'0.8rem', color:'var(--primary)', fontWeight:600 }}>
            New balance: {currency} {toMajor(newBalanceMinor).toLocaleString()}
          </div>
          
          <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.8rem', color:'var(--text-primary)' }}>
            <input type="checkbox" checked={recordTx} onChange={e => setRecordTx(e.target.checked)} style={{ width:'1rem', height:'1rem' }} />
            Record this payment as an expense transaction
          </label>
          
          {recordTx && (
            <div className="animate-in" style={{ marginTop: '-0.25rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Expense Category</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite'}}/> Saving…</> : 'Record Payment'}
          </button>
          {error && <div style={{ padding:'0.5rem 0.625rem', borderRadius:7, background:'var(--danger-light)', color:'var(--danger)', fontSize:'0.8rem' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}


/* ── Main Client Component ────────────────────────────────── */
export function LoansClient({ loans, currency, categories = [] }: { loans: Loan[], currency: string, categories?: { id: string; name: string }[] }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,     setShowAdd]     = useState(false);
  const [editLoanObj, setEditLoanObj] = useState<Loan | null>(null);
  const [payingLoan,  setPayingLoan]  = useState<Loan | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);

  const totalDebtMinor     = loans.reduce((s, l) => s + l.balanceMinor, 0);
  const totalOriginalMinor = loans.reduce((s, l) => s + l.originalAmountMinor, 0);
  const totalMonthlyMinor  = loans.reduce((s, l) => s + l.monthlyPaymentMinor, 0);
  const overdue       = loans.filter(l => l.daysOverdue > 0).length;
  const paidPct       = totalOriginalMinor > 0 ? Math.min(100, Math.round(((totalOriginalMinor - totalDebtMinor) / totalOriginalMinor) * 100)) : 0;

  async function handleDelete(id: string) {
    if (!confirm('Delete this loan?')) return;
    setDeletingId(id);
    try {
      await deleteLoan(id);
      startT(() => router.refresh());
    } catch {
      // error is non-critical for UX here; log it silently
    } finally { setDeletingId(null); }
  }

  return (
    <>
      {showAdd    && <LoanModal onClose={() => setShowAdd(false)} currency={currency} />}
      {editLoanObj && <LoanModal loan={editLoanObj} onClose={() => setEditLoanObj(null)} currency={currency} />}
      {payingLoan && <RecordPaymentModal loan={payingLoan} onClose={() => setPayingLoan(null)} currency={currency} categories={categories} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <div />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Loan</button>
      </div>

      {/* Hero — matches dashboard style exactly: dark surface, clear text */}
      <div className="dashboard-hero animate-in mb-5">
        <div className="dashboard-hero-grid">
          <div>
            <p className="hero-label">Total Debt</p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: totalDebtMinor > 9_999_99900 ? '1.6rem' : totalDebtMinor > 999_99900 ? '1.9rem' : '2.25rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color:'var(--danger)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>{fmtAdaptive(totalDebtMinor, currency)}</p>
            <p className="hero-sub">of {fmtAdaptive(totalOriginalMinor, currency)} original · {paidPct}% paid</p>
            <div className="hero-progress-wrap" style={{ marginTop:'0.75rem', paddingTop:'0.75rem' }}>
              <div className="hero-progress-labels">
                <span className="hero-progress-label">Repayment progress</span>
                <span className="hero-progress-val tabular">{paidPct}% paid off</span>
              </div>
              <div className="hero-progress-track">
                <div className="hero-progress-bar" style={{ width:`${paidPct}%`, backgroundColor:'var(--success)' }}/>
              </div>
            </div>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">Loans</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--text-primary)' }}>{loans.length}</p>
              <p className="hero-sub">total</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Monthly Pmts</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fmtAdaptive(totalMonthlyMinor, currency)}</p>
              <p className="hero-sub">per month</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Overdue</p>
              <p className="hero-stat-value tabular" style={{ color: overdue > 0 ? 'var(--danger)' : 'var(--success)' }}>{overdue}</p>
              <p className="hero-sub">{overdue > 0 ? '⚠ needs attention' : '✓ all current'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan cards / empty state */}
      {loans.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <CreditCard size={40} style={{ margin:'0 auto 0.75rem', opacity:0.4 }} />
          <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>No loans tracked</div>
          <div style={{ fontSize:'0.78rem', marginBottom:'1rem' }}>Add a loan to track repayments and interest</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Loan</button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          {loans.map((l, i) => {
            const st  = loanStyle(l);
            const isExpanded = expanded === l.id;

            // Amortization calculator with safety guards
            const monthlyRate   = l.annualRate / 100 / 12;
            const minPaymentMinor    = monthlyRate > 0 ? l.balanceMinor * monthlyRate : 0; // payment must exceed this
            const paymentValid  = l.monthlyPaymentMinor > minPaymentMinor;
            const monthsLeft    = !paymentValid
              ? Infinity
              : monthlyRate > 0
                ? Math.ceil(Math.log(l.monthlyPaymentMinor / (l.monthlyPaymentMinor - l.balanceMinor * monthlyRate)) / Math.log(1 + monthlyRate))
                : Math.ceil(l.balanceMinor / l.monthlyPaymentMinor);
            const totalInterestMinor = isFinite(monthsLeft)
              ? Math.round(Math.max(0, (l.monthlyPaymentMinor * monthsLeft) - l.balanceMinor))
              : 0;

            return (
              <div key={l.id} className={`card animate-in delay-${(i%4)+1}`}
                style={{ borderLeft:`4px solid ${st.color}`, borderRadius:10, padding:'1.25rem 1.375rem' }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div style={{ width:36, height:36, borderRadius:8, background: l.daysOverdue > 0 ? 'var(--danger-light)' : 'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {l.daysOverdue > 0 ? <AlertTriangle size={16} color="var(--danger)" /> : <CreditCard size={16} color="var(--primary)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>{l.name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.1rem', textTransform:'capitalize' }}>
                        {l.lender} · {l.type} · {l.annualRate}% p.a.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <button onClick={() => setEditLoanObj(l)} 
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.2rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(l.id)} disabled={deletingId===l.id}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.2rem' }}>
                      {deletingId===l.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={13}/>}
                    </button>
                  </div>
                </div>

                {/* Balance + progress */}
                <div className="flex items-end justify-between mb-3">
                  <div style={{ minWidth:0, flex:1, marginRight:'0.5rem' }}>
                    <div style={{
                      fontFamily:'Space Grotesk,sans-serif',
                      fontSize: l.balanceMinor > 9_999_99900 ? '1.1rem' : l.balanceMinor > 999_99900 ? '1.25rem' : '1.5rem',
                      fontWeight:800, color:st.color, letterSpacing:'-0.04em', lineHeight:1.1,
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>
                      {fmtAdaptive(l.balanceMinor, currency)}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>of {fmtAdaptive(l.originalAmountMinor, currency)} original</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.5rem', fontWeight:800, color:st.color, lineHeight:1, opacity:0.88 }}>{st.paidPct}%</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>paid off</div>
                  </div>
                </div>

                <div className="progress-track mb-3" style={{ height:8 }}>
                  <div className="progress-fill" style={{ width:`${st.paidPct}%`, background:st.barGrad, boxShadow:`0 0 10px ${st.glow}` }} />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div style={{ display:'flex', gap:'1rem' }}>
                    <div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Monthly</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)', whiteSpace:'nowrap' }}>{fmtAdaptive(l.monthlyPaymentMinor, currency)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Next Due</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color: l.daysOverdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {new Date(l.nextDue).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                        {l.daysOverdue > 0 && <span style={{ fontSize:'0.7rem', marginLeft:4 }}>({l.daysOverdue}d late)</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Est. Months Left</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color: isFinite(monthsLeft) ? 'var(--text-primary)' : 'var(--danger)' }}>
                        {isFinite(monthsLeft) ? `~${monthsLeft} mo` : '⚠ Raise payment'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isExpanded ? null : l.id)}
                      className="btn btn-outline" style={{ padding:'0.25rem 0.6rem', fontSize:'0.72rem', gap:'0.25rem' }}>
                      Forecast {isExpanded ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                    </button>
                    <button onClick={() => setPayingLoan(l)} className="btn btn-primary" style={{ padding:'0.25rem 0.75rem', fontSize:'0.72rem' }}>
                      Record Payment
                    </button>
                  </div>
                </div>

                {/* Expanded interest forecast + interactive extra payment simulator */}
                {isExpanded && (
                  <ExpandedForecast loan={l} monthsLeft={monthsLeft} totalInterest={totalInterestMinor} currency={currency} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
