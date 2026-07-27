'use client';
// src/app/loans/LoansClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addLoan, editLoan, deleteLoan } from '@/lib/actions/loans';
import { formatCurrency } from '@/lib/finance/formatCurrency';
import { Plus, Trash2, Loader2, X, CreditCard, AlertTriangle, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { toMinor, toMajor } from '@/lib/money';
import { getErrorMessage } from '@/lib/errors';
import type { LoanDTO } from '@/lib/mappers/loans';

// All colours via CSS token vars — adapts to light and dark automatically
function loanStyle(l: LoanDTO) {
  const overdueDays = l.daysOverdue ?? 0;
  const paidPct = Math.min(100, Math.round(((l.originalMoney.amountMinor - l.balanceMoney.amountMinor) / l.originalMoney.amountMinor) * 100));
  if (overdueDays > 0) return {
    badge: 'badge-danger',  label: 'Overdue',
    color: 'var(--color-expense)',  barGrad: 'linear-gradient(90deg,var(--color-expense),hsl(0,78%,72%))',
    glow: 'rgba(220,38,38,0.5)', paidPct,
  };
  // Due Soon only fires for FUTURE dates within 7 days — not past dates
  const nextDueDate = new Date(l.nextDue);
  const now = new Date();
  if (overdueDays === 0 && nextDueDate >= now && nextDueDate < new Date(Date.now() + 7 * 86400000))
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

/* -- Add Loan Modal ----------------------------------------- */
function LoanModal({ loan, accounts, onClose }: { loan?: LoanDTO; accounts: {id: string, name: string}[]; onClose: () => void; }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [name,       setName]       = useState(loan?.name ?? '');
  const [lender,     setLender]     = useState(loan?.lender ?? '');
  const [type,       setType]       = useState(loan?.type ?? 'personal');
  const [origAmt,    setOrigAmt]    = useState(loan ? String(toMajor(loan.originalMoney.amountMinor)) : '');
  const [balance,    setBalance]    = useState(loan ? String(toMajor(loan.balanceMoney.amountMinor)) : '');
  const [rate,       setRate]       = useState(loan ? String(loan.annualRate) : '');
  const [monthly,    setMonthly]    = useState(loan ? String(toMajor(loan.monthlyPaymentMoney.amountMinor)) : '');
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
      const idempotencyKey = crypto.randomUUID();
      if (isEdit && loan) {
        await editLoan(loan.id, {
          idempotencyKey,
          payload: {
            name, lender, type,
            originalAmountMinor: toMinor(parseFloat(origAmt)),
            balanceMinor:     toMinor(parseFloat(balance || origAmt)),
            annualRate:  parseFloat(rate),
            amortization,
            monthlyPaymentMinor:  toMinor(parseFloat(monthly)),
            nextDue,
          }
        });
      } else {
        await addLoan({
          idempotencyKey,
          payload: {
            name, lender, type,
            originalAmountMinor: toMinor(parseFloat(origAmt)),
            balanceMinor:     toMinor(parseFloat(balance || origAmt)),
            annualRate:  parseFloat(rate),
            amortization,
            monthlyPaymentMinor:  toMinor(parseFloat(monthly)),
            nextDue,
            disbursementType,
            disbursementAccountId: disbursementType === 'received_funds' ? disbursementAccountId : undefined,
          }
        });
      }
      startT(() => router.refresh());
      onClose();
    } catch (err: unknown) {  
      setError(getErrorMessage(err));
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

/* -- Expanded Forecast Panel (Interactive Extra Payment Simulator) -- */
function ExpandedForecast({ loan, monthsLeft, totalInterest, currency }: { loan: LoanDTO; monthsLeft: number; totalInterest: number; currency: string }) {
  const [extraPayment, setExtraPayment] = useState(0);

  const monthlyRate = loan.annualRate / 100 / 12;
  const totalPmtMinor    = loan.monthlyPaymentMoney.amountMinor + toMinor(extraPayment);
  const isFlat = loan.amortization === 'FLAT_RATE';
  const minPmtMinor      = isFlat ? 0 : (monthlyRate > 0 ? loan.balanceMoney.amountMinor * monthlyRate : 0);
  const newMonths   = totalPmtMinor <= minPmtMinor
    ? Infinity
    : isFlat
      ? Math.ceil(loan.balanceMoney.amountMinor / (totalPmtMinor - (loan.originalMoney.amountMinor * monthlyRate)))
      : monthlyRate > 0
        ? Math.ceil(Math.log(totalPmtMinor / (totalPmtMinor - loan.balanceMoney.amountMinor * monthlyRate)) / Math.log(1 + monthlyRate))
        : Math.ceil(loan.balanceMoney.amountMinor / totalPmtMinor);
  const newInterestMinor = isFinite(newMonths) 
    ? Math.round(Math.max(0, isFlat ? (loan.originalMoney.amountMinor * monthlyRate * newMonths) : (totalPmtMinor * newMonths) - loan.balanceMoney.amountMinor)) 
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
          { label:'Total Interest', value: formatCurrency({ amountMinor: totalInterest, currency: 'KES' }), sub:'estimated remaining' },
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
              { label:'Interest saved', value: formatCurrency({ amountMinor: interestSavedMinor, currency: 'KES' }), color:'var(--color-income)' },
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



/* -- Main Client Component ---------------------------------- */
export function LoansClient({ loans = [], currency, accounts = [] }: { loans: LoanDTO[], currency: string, accounts?: {id: string, name: string}[] }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,     setShowAdd]     = useState(false);
  const [editLoanObj, setEditLoanObj] = useState<LoanDTO | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);

  const totalDebtMinor     = (loans || []).reduce((s, l) => s + (l.balanceMoney.amountMinor || 0), 0);
  const totalOriginalMinor = (loans || []).reduce((s, l) => s + (l.originalMoney.amountMinor || 0), 0);
  const totalMonthlyMinor  = (loans || []).reduce((s, l) => s + (l.monthlyPaymentMoney.amountMinor || 0), 0);
  const overdue       = (loans || []).filter(l => (l.daysOverdue ?? 0) > 0).length;
  const paidPct       = totalOriginalMinor > 0 ? Math.min(100, Math.round(((totalOriginalMinor - totalDebtMinor) / totalOriginalMinor) * 100)) : 0;

  async function handleDelete(id: string) {
    if (!confirm('Delete this loan?')) return;
    setDeletingId(id);
    try {
      const idempotencyKey = crypto.randomUUID();
      await deleteLoan({ idempotencyKey, payload: { id } });
      startT(() => router.refresh());
    } catch {
      // silent
    } finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showAdd    && <LoanModal accounts={accounts} onClose={() => setShowAdd(false)} />}
      {editLoanObj && <LoanModal loan={editLoanObj} accounts={accounts} onClose={() => setEditLoanObj(null)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div />
        <button 
          className="btn btn-primary shadow-sm hover:shadow-md transition-all duration-300" 
          style={{ background: 'linear-gradient(135deg, var(--color-brand), hsl(220, 80%, 65%))', border: 'none' }}
          onClick={() => setShowAdd(true)}
        >
          <Plus size={14}/> Add Loan
        </button>
      </div>

      {/* Hero — matches NetWorth but tuned for debt */}
      <div className="rounded-2xl shadow-md p-6 relative overflow-hidden mb-6 transition-all duration-300" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '150%', height: '200%', background: 'radial-gradient(circle at top left, rgba(220,38,38,0.04), transparent 50%)', pointerEvents: 'none' }} />
        
        <div className="dashboard-hero-grid relative z-10">
          <div>
            <p className="text-[0.8rem] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-expense)] shadow-[0_0_8px_var(--color-expense)]"></span>
              Total Debt
            </p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: totalDebtMinor > 9_999_99900 ? '2.2rem' : totalDebtMinor > 999_99900 ? '2.5rem' : '3rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.1,
              background: 'linear-gradient(90deg, var(--color-expense), hsl(0,78%,72%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              textShadow: '0 2px 10px rgba(0,0,0,0.05)',
              paddingBottom: '0.2rem'
            }}>{formatCurrency({ amountMinor: totalDebtMinor, currency: 'KES' })}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">of {formatCurrency({ amountMinor: totalOriginalMinor, currency: 'KES' })} original · {paidPct}% paid</p>
            
            <div className="mt-5" style={{ background: 'var(--surface-sunken)', padding: '0.35rem', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Repayment Progress</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{paidPct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-app)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${paidPct}%`, background: 'linear-gradient(90deg, var(--color-income), hsl(152,65%,62%))', borderRadius: 4, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
            </div>
          </div>
          
          <div className="hero-stats-grid">
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)] hover:shadow-sm">
              <p className="hero-label">Active Loans</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-text-primary)' }}>{(loans || []).length}</p>
              <p className="hero-sub">total tracked</p>
            </div>
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)] hover:shadow-sm">
              <p className="hero-label">Monthly Burden</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{formatCurrency({ amountMinor: totalMonthlyMinor, currency: 'KES' })}</p>
              <p className="hero-sub">minimum required</p>
            </div>
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)] hover:shadow-sm">
              <p className="hero-label">Status</p>
              <p className="hero-stat-value tabular" style={{ color: overdue > 0 ? 'var(--color-expense)' : 'var(--color-income)' }}>{overdue}</p>
              <p className="hero-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface-sunken)', padding: '0.1rem 0.4rem', borderRadius: 4, marginTop: '0.2rem' }}>
                {overdue > 0 ? '⚠ Overdue' : '✓ All Current'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan cards / empty state */}
      {(!loans || loans.length === 0) ? (
        <div className="card shadow-sm" style={{ textAlign:'center', padding:'4rem 2rem', color:'var(--color-text-secondary)', border: '1px dashed var(--border)', background: 'transparent' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-sunken)', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            <CreditCard size={32} style={{ opacity:0.7 }} />
          </div>
          <div style={{ fontWeight:700, fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom:'0.25rem' }}>No loans tracked</div>
          <div style={{ fontSize:'0.85rem', marginBottom:'1.5rem', maxWidth: 300, margin: '0 auto 1.5rem auto' }}>Add a loan to track repayments, forecast interest, and monitor payoff dates.</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14}/> Add Your First Loan</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap:'1rem' }}>
          {loans.map((l) => {
            const st  = loanStyle(l);
            const isExpanded = expanded === l.id;

            // Amortization calculator with safety guards
            const isFlat = l.amortization === 'FLAT_RATE';
            const monthlyRate   = (l.annualRate || 0) / 100 / 12;
            const minPaymentMinor    = isFlat ? 0 : (monthlyRate > 0 ? l.balanceMoney.amountMinor * monthlyRate : 0); // payment must exceed this
            const paymentValid  = l.monthlyPaymentMoney.amountMinor > minPaymentMinor;
            
            // Safe calculation avoiding div-by-zero or log of negative
            let monthsLeft = Infinity;
            if (paymentValid && l.monthlyPaymentMoney.amountMinor > 0) {
              if (isFlat) {
                const den = l.monthlyPaymentMoney.amountMinor - (l.originalMoney.amountMinor * monthlyRate);
                monthsLeft = den > 0 ? Math.ceil(l.balanceMoney.amountMinor / den) : Infinity;
              } else if (monthlyRate > 0) {
                const arg = l.monthlyPaymentMoney.amountMinor / (l.monthlyPaymentMoney.amountMinor - l.balanceMoney.amountMinor * monthlyRate);
                monthsLeft = arg > 0 ? Math.ceil(Math.log(arg) / Math.log(1 + monthlyRate)) : Infinity;
              } else {
                monthsLeft = Math.ceil(l.balanceMoney.amountMinor / l.monthlyPaymentMoney.amountMinor);
              }
            }

            const totalInterestMinor = isFinite(monthsLeft)
              ? Math.round(Math.max(0, isFlat ? (l.originalMoney.amountMinor * monthlyRate * monthsLeft) : (l.monthlyPaymentMoney.amountMinor * monthsLeft) - l.balanceMoney.amountMinor))
              : 0;

            return (
              <div key={l.id} className="card group transition-all duration-300 hover:shadow-md"
                style={{ borderTop:`4px solid ${st.color}`, borderRadius: '16px', padding:0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem' }}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div style={{ width:42, height:42, borderRadius:12, background: (l.daysOverdue ?? 0) > 0 ? 'var(--color-expense-light)' : 'var(--color-brand-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition: 'transform 0.3s', transform: 'scale(1)' }} className="group-hover:scale-105">
                        {(l.daysOverdue ?? 0) > 0 ? <AlertTriangle size={20} color="var(--color-expense)" /> : <CreditCard size={20} color="var(--color-brand)" />}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--color-text-primary)' }}>{l.name}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--color-text-secondary)', marginTop:'0.15rem', textTransform:'capitalize', fontWeight: 500 }}>
                          {l.lender} · {l.type.replace('_', ' ')} · {l.annualRate}% p.a.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditLoanObj(l)} 
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all" aria-label="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(l.id)} disabled={deletingId===l.id}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50" aria-label="Delete">
                        {deletingId===l.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
                      </button>
                    </div>
                  </div>

                  {/* Balance + progress */}
                  <div className="flex items-end justify-between mb-4 bg-[var(--surface-sunken)] p-3 rounded-xl border border-border/50">
                    <div style={{ minWidth:0, flex:1, marginRight:'0.5rem' }}>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Remaining</div>
                      <div style={{
                        fontFamily:'Space Grotesk,sans-serif',
                        fontSize: l.balanceMoney.amountMinor > 9_999_99900 ? '1.4rem' : l.balanceMoney.amountMinor > 999_99900 ? '1.6rem' : '1.8rem',
                        fontWeight:800, color:st.color, letterSpacing:'-0.04em', lineHeight:1.1,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>
                        {formatCurrency({ amountMinor: l.balanceMoney.amountMinor, currency: 'KES' })}
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', marginTop:'0.2rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>of {formatCurrency({ amountMinor: l.originalMoney.amountMinor, currency: 'KES' })} original</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.4rem', fontWeight:800, color:st.color, lineHeight:1, padding: '0.3rem', background: 'var(--card)', borderRadius: 8 }}>{st.paidPct}%</div>
                    </div>
                  </div>

                  <div className="mb-5 bg-[var(--surface-sunken)] rounded-full overflow-hidden border border-border/50" style={{ height: 6 }}>
                    <div style={{ height: '100%', width:`${st.paidPct}%`, background:st.barGrad, boxShadow:`0 0 10px ${st.glow}`, borderRadius: 4, transition: 'width 1s ease' }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[var(--surface-sunken)] p-3 rounded-xl border border-border/50">
                      <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom: '0.2rem' }}>Monthly</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'1rem', color:'var(--color-text-primary)', whiteSpace:'nowrap' }}>{formatCurrency({ amountMinor: l.monthlyPaymentMoney.amountMinor, currency: 'KES' })}</div>
                    </div>
                    <div className="bg-[var(--surface-sunken)] p-3 rounded-xl border border-border/50">
                      <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom: '0.2rem' }}>Next Due</div>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'1rem', color: (l.daysOverdue ?? 0) > 0 ? 'var(--color-expense)' : 'var(--color-text-primary)' }}>
                        {new Date(l.nextDue).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={() => setExpanded(isExpanded ? null : l.id)}
                    className="w-full btn btn-outline" style={{ padding:'0.6rem', fontSize:'0.8rem', gap:'0.4rem', borderRadius: '10px', background: isExpanded ? 'var(--surface-sunken)' : 'transparent', border: isExpanded ? '1px solid var(--border)' : '1px solid var(--border)' }}>
                    {isExpanded ? 'Hide Forecast' : 'View Payoff Forecast'} {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                </div>

                {/* Expanded interest forecast + interactive extra payment simulator */}
                {isExpanded && (
                  <div className="bg-[var(--surface-sunken)] border-t border-border/50 p-5">
                    <ExpandedForecast loan={l} monthsLeft={monthsLeft} totalInterest={totalInterestMinor} currency={currency} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
