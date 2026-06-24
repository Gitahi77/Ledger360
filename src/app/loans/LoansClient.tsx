'use client';
// src/app/loans/LoansClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addLoan, editLoan, deleteLoan } from '@/lib/actions/loans';
import { fmtAdaptive, formatKES } from '@/lib/format';
import { Plus, Trash2, Loader2, X, CreditCard, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';

type Loan = {
  id: string; name: string; lender: string; type: string;
  originalAmountMinor: number; balanceMinor: number; annualRate: number;
  amortization: string;
  monthlyPaymentMinor: number; nextDue: Date; daysOverdue: number;
};

// All colours via CSS token vars — adapts to light and dark automatically
function loanStyle(l: Loan) {
  const paidPct = Math.min(100, Math.round(((l.originalAmountMinor - l.balanceMinor) / l.originalAmountMinor) * 100));
  if (l.daysOverdue > 0) return {
    badge: 'badge-danger',  label: 'Overdue',
    color: 'var(--color-expense)',  barGrad: 'linear-gradient(90deg,var(--color-expense),hsl(0,78%,72%))',
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
    color: 'var(--color-income)', barGrad: 'linear-gradient(90deg,var(--color-income),hsl(152,65%,62%))',
    glow: 'rgba(22,163,74,0.4)', paidPct,
  };
}

/* ── Add Loan Modal ───────────────────────────────────────── */
function LoanModal({ loan, accounts, onClose, currency }: { loan?: Loan; accounts: {id: string, name: string}[]; onClose: () => void; currency: string }) {
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
  const [amortization,setAmortization]= useState(loan?.amortization ?? 'REDUCING_BALANCE');
  const [nextDue,    setNextDue]    = useState(loan?.nextDue ? new Date(loan.nextDue).toISOString().slice(0, 10) : '');
  const [disbursementType, setDisbursementType] = useState<'existing_debt' | 'received_funds'>('existing_debt');
  const [disbursementAccountId, setDisbursementAccountId] = useState(accounts[0]?.id || '');
  const isEdit = Boolean(loan);

  const LOAN_TYPES = ['personal','mortgage','car','student','business','credit card','sacco loan','other'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Finance app invariant: loans with NaN amounts, rates, or payments produce
    // catastrophically wrong amortization forecasts.
    const parsedOrig = parseFloat(origAmt);
    if (!origAmt || !isFinite(parsedOrig) || parsedOrig <= 0) {
      setError('Please enter a valid positive original loan amount.'); return;
    }
    const parsedRate = parseFloat(rate);
    if (rate === '' || !isFinite(parsedRate) || parsedRate < 0) {
      setError('Please enter a valid annual interest rate (0 or greater).'); return;
    }
    const parsedMonthly = parseFloat(monthly);
    if (!monthly || !isFinite(parsedMonthly) || parsedMonthly <= 0) {
      setError('Please enter a valid positive monthly payment amount.'); return;
    }
    setLoading(true); setError('');
    try {
      if (isEdit && loan) {
        await editLoan(loan.id, {
          name, lender, type,
          originalAmountMinor: toMinor(parseFloat(origAmt)),
          balanceMinor:     toMinor(parseFloat(balance || origAmt)),
          annualRate:  parseFloat(rate),
          amortization,
          monthlyPaymentMinor:  toMinor(parseFloat(monthly)),
          nextDue,
        });
      } else {
        await addLoan({
          name, lender, type,
          originalAmountMinor: toMinor(parseFloat(origAmt)),
          balanceMinor:     toMinor(parseFloat(balance || origAmt)),
          annualRate:  parseFloat(rate),
          amortization,
          monthlyPaymentMinor:  toMinor(parseFloat(monthly)),
          nextDue,
          disbursementType,
          disbursementAccountId: disbursementType === 'received_funds' ? disbursementAccountId : undefined,
        });
      }
      startT(() => router.refresh());
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:500, padding:'1.75rem', maxHeight:'90vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>{isEdit ? 'Edit Loan' : 'Add Loan'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--color-expense-light)', color:'var(--color-expense)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Loan Name</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. KCB Personal Loan" />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Lender</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={lender} onChange={e => setLender(e.target.value)} required placeholder="e.g. KCB Bank" />
            </div>
          </div>

          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Loan Type</label>
            <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={type} onChange={e => setType(e.target.value)}>
              {LOAN_TYPES.map(t => <option key={t} value={t} style={{ textTransform:'capitalize' }}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Original Amount</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="1" step="1" value={origAmt} onChange={e => setOrigAmt(e.target.value)} required placeholder="500000" />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Current Balance</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="0" step="1" value={balance} onChange={e => setBalance(e.target.value)} placeholder="Leave blank = same as original" />
            </div>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Annual Rate (%)</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="0" step="0.1" value={rate} onChange={e => setRate(e.target.value)} required placeholder="14.5" />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Monthly Payment</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="1" step="1" value={monthly} onChange={e => setMonthly(e.target.value)} required placeholder="15000" />
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Amortization</label>
              <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                value={amortization} onChange={e => setAmortization(e.target.value)}>
                <option value="REDUCING_BALANCE">Reducing Balance</option>
                <option value="FLAT_RATE">Flat Rate (Straight Line)</option>
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Next Due Date</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} required />
            </div>
          </div>

          {!isEdit && (
            <div style={{ marginTop: '0.5rem', background: 'var(--bg-app)', padding: '0.875rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.5rem' }}>Disbursement Details</label>
              <div className="segmented-control" style={{ width:'100%', marginBottom: disbursementType === 'received_funds' ? '0.75rem' : '0' }}>
                <button type="button" onClick={() => setDisbursementType('existing_debt')}
                  className={`segmented-btn ${disbursementType === 'existing_debt' ? 'active' : ''}`} style={{ flex:1, fontSize:'0.75rem', justifyContent:'center' }}>
                  Existing Debt
                </button>
                <button type="button" onClick={() => setDisbursementType('received_funds')}
                  className={`segmented-btn ${disbursementType === 'received_funds' ? 'active' : ''}`} style={{ flex:1, fontSize:'0.75rem', justifyContent:'center' }}>
                  Funds Received
                </button>
              </div>
              
              {disbursementType === 'received_funds' && (
                <div className="animate-in fade-in slide-in-from-top-2" style={{ marginTop: '0.5rem' }}>
                  <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Receiving Account</label>
                  <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                    value={disbursementAccountId} onChange={e => setDisbursementAccountId(e.target.value)} required>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'1.25rem', marginTop:'0.25rem' }}>
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
  const isFlat = loan.amortization === 'FLAT_RATE';
  const minPmtMinor      = isFlat ? 0 : (monthlyRate > 0 ? loan.balanceMinor * monthlyRate : 0);
  const newMonths   = totalPmtMinor <= minPmtMinor
    ? Infinity
    : isFlat
      ? Math.ceil(loan.balanceMinor / (totalPmtMinor - (loan.originalAmountMinor * monthlyRate)))
      : monthlyRate > 0
        ? Math.ceil(Math.log(totalPmtMinor / (totalPmtMinor - loan.balanceMinor * monthlyRate)) / Math.log(1 + monthlyRate))
        : Math.ceil(loan.balanceMinor / totalPmtMinor);
  const newInterestMinor = isFinite(newMonths) 
    ? Math.round(Math.max(0, isFlat ? (loan.originalAmountMinor * monthlyRate * newMonths) : (totalPmtMinor * newMonths) - loan.balanceMinor)) 
    : 0;
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
      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--color-text-secondary)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Repayment Forecast</div>

      {/* Base forecast */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
        {[
          { label:'Months Left',    value: isFinite(monthsLeft) ? `~${monthsLeft}` : '⚠ Check payment', sub:'at current pace' },
          { label:'Total Interest', value: formatKES(totalInterest), sub:'estimated remaining' },
          { label:'Payoff Date',    value: payoffDate(monthsLeft), sub:'projected' },
        ].map(f => (
          <div key={f.label} style={{ background:'var(--bg-app)', borderRadius:8, padding:'0.625rem 0.875rem', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--color-text-secondary)', marginBottom:'0.2rem' }}>{f.label}</div>
            <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1rem', fontWeight:800, color:'var(--color-text-primary)' }}>{f.value}</div>
            <div style={{ fontSize:'0.6rem', color:'var(--color-text-secondary)', marginTop:'0.1rem' }}>{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Interactive extra payment simulator */}
      <div style={{ background:'var(--color-brand-light)', borderRadius:10, padding:'0.875rem 1rem', border:'1px solid var(--color-brand-dark)' }}>
        <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--color-brand)', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Extra Payment Simulator</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom: extraPayment > 0 ? '0.75rem' : 0 }}>
          <span style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)', whiteSpace:'nowrap' }}>Pay extra {currency}</span>
          <input
            type="number" min="0" step="500"
            value={extraPayment || ''}
            onChange={e => setExtraPayment(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="e.g. 5000"
            className="input-field"
            style={{ width:'100%', padding:'0.4rem 0.65rem', fontSize:'0.82rem' }}
          />
          <span style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)', whiteSpace:'nowrap' }}>per month</span>
        </div>
        {extraPayment > 0 && isFinite(newMonths) && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'0.5rem' }}>
            {[
              { label:'New payoff', value: payoffDate(newMonths), color:'var(--color-income)' },
              { label:'Months saved', value:`${monthsSaved} mo`, color:'var(--color-income)' },
              { label:'Interest saved', value: formatKES(interestSavedMinor), color:'var(--color-income)' },
            ].map(r => (
              <div key={r.label} style={{ background:'var(--color-income-light)', borderRadius:7, padding:'0.5rem 0.625rem', border:'1px solid var(--color-income)' }}>
                <div style={{ fontSize:'0.58rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)', marginBottom:'0.15rem' }}>{r.label}</div>
                <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'0.9rem', fontWeight:800, color: r.color }}>{r.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



/* ── Main Client Component ────────────────────────────────── */
export function LoansClient({ loans, currency, categories = [], accounts = [] }: { loans: Loan[], currency: string, categories?: { id: string; name: string }[], accounts?: {id: string, name: string}[] }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,     setShowAdd]     = useState(false);
  const [editLoanObj, setEditLoanObj] = useState<Loan | null>(null);
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
    <div className="page-container">
      {showAdd    && <LoanModal accounts={accounts} onClose={() => setShowAdd(false)} currency={currency} />}
      {editLoanObj && <LoanModal loan={editLoanObj} accounts={accounts} onClose={() => setEditLoanObj(null)} currency={currency} />}

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
              color:'var(--hero-expense)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>{formatKES(totalDebtMinor)}</p>
            <p className="hero-sub">of {formatKES(totalOriginalMinor)} original · {paidPct}% paid</p>
            <div className="hero-progress-wrap" style={{ marginTop:'0.75rem', paddingTop:'0.75rem' }}>
              <div className="hero-progress-labels">
                <span className="hero-progress-label">Repayment progress</span>
                <span className="hero-progress-val tabular">{paidPct}% paid off</span>
              </div>
              <div className="hero-progress-track">
                <div className="hero-progress-bar" style={{ width:`${paidPct}%`, backgroundColor:'var(--hero-income)' }}/>
              </div>
            </div>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">Loans</p>
              <p className="hero-stat-value tabular" style={{ color:'white' }}>{loans.length}</p>
              <p className="hero-sub">total</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Monthly Pmts</p>
              <p className="hero-stat-value tabular" style={{ color:'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{formatKES(totalMonthlyMinor)}</p>
              <p className="hero-sub">per month</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Overdue</p>
              <p className="hero-stat-value tabular" style={{ color: overdue > 0 ? 'var(--hero-expense)' : 'var(--hero-income)' }}>{overdue}</p>
              <p className="hero-sub">{overdue > 0 ? '⚠ needs attention' : '✓ all current'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan cards / empty state */}
      {loans.length === 0 ? (
        <div className="card" style={{ textAlign:'left', padding:'3rem', color:'var(--color-text-secondary)' }}>
          <CreditCard size={40} style={{ margin:'0 0 0.75rem 0', opacity:0.4 }} />
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
            const isFlat = l.amortization === 'FLAT_RATE';
            const monthlyRate   = l.annualRate / 100 / 12;
            const minPaymentMinor    = isFlat ? 0 : (monthlyRate > 0 ? l.balanceMinor * monthlyRate : 0); // payment must exceed this
            const paymentValid  = l.monthlyPaymentMinor > minPaymentMinor;
            const monthsLeft    = !paymentValid
              ? Infinity
              : isFlat
                ? Math.ceil(l.balanceMinor / (l.monthlyPaymentMinor - (l.originalAmountMinor * monthlyRate)))
                : monthlyRate > 0
                  ? Math.ceil(Math.log(l.monthlyPaymentMinor / (l.monthlyPaymentMinor - l.balanceMinor * monthlyRate)) / Math.log(1 + monthlyRate))
                  : Math.ceil(l.balanceMinor / l.monthlyPaymentMinor);
            const totalInterestMinor = isFinite(monthsLeft)
              ? Math.round(Math.max(0, isFlat ? (l.originalAmountMinor * monthlyRate * monthsLeft) : (l.monthlyPaymentMinor * monthsLeft) - l.balanceMinor))
              : 0;

            return (
              <div key={l.id} className={`card animate-in delay-${(i%4)+1}`}
                style={{ borderLeft:`4px solid ${st.color}`, borderRadius:10, padding:'1.25rem 1.375rem' }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div style={{ width:36, height:36, borderRadius:8, background: l.daysOverdue > 0 ? 'var(--color-expense-light)' : 'var(--color-brand-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {l.daysOverdue > 0 ? <AlertTriangle size={16} color="var(--color-expense)" /> : <CreditCard size={16} color="var(--color-brand)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--color-text-primary)' }}>{l.name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', marginTop:'0.1rem', textTransform:'capitalize' }}>
                        {l.lender} · {l.type} · {l.annualRate}% p.a.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <button onClick={() => setEditLoanObj(l)} 
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.2rem' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button onClick={() => handleDelete(l.id)} disabled={deletingId===l.id}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.2rem' }}>
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
                      {formatKES(l.balanceMinor)}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', marginTop:'0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>of {formatKES(l.originalAmountMinor)} original</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.5rem', fontWeight:800, color:st.color, lineHeight:1, opacity:0.88 }}>{st.paidPct}%</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)' }}>paid off</div>
                  </div>
                </div>

                <div className="progress-track mb-3" style={{ height:8 }}>
                  <div className="progress-fill" style={{ width:`${st.paidPct}%`, background:st.barGrad, boxShadow:`0 0 10px ${st.glow}` }} />
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="grid-3" style={{ flex:'1 1 100%' }}>
                    <div>
                      <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Monthly</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'var(--color-text-primary)', whiteSpace:'nowrap' }}>{formatKES(l.monthlyPaymentMinor)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Next Due</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color: l.daysOverdue > 0 ? 'var(--color-expense)' : 'var(--color-text-primary)' }}>
                        {new Date(l.nextDue).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                        {l.daysOverdue > 0 && <span style={{ fontSize:'0.7rem', marginLeft:4 }}>({l.daysOverdue}d late)</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Est. Months Left</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color: isFinite(monthsLeft) ? 'var(--color-text-primary)' : 'var(--color-expense)' }}>
                        {isFinite(monthsLeft) ? `~${monthsLeft} mo` : '⚠ Raise payment'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isExpanded ? null : l.id)}
                      className="btn btn-outline" style={{ padding:'0.25rem 0.6rem', fontSize:'0.72rem', gap:'0.25rem' }}>
                      Forecast {isExpanded ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
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
    </div>
  );
}
