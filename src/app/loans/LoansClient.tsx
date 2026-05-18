'use client';
// src/app/loans/LoansClient.tsx
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addLoan, updateLoanBalance, deleteLoan } from '@/lib/actions/loans';
import { Plus, Trash2, Loader2, X, CreditCard, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

type Loan = {
  id: string; name: string; lender: string; type: string;
  originalAmt: number; balance: number; annualRate: number;
  monthlyPmt: number; nextDue: Date; daysOverdue: number;
};

/* ── Status style ─────────────────────────────────────────── */
function loanStyle(l: Loan) {
  const paidPct = Math.min(100, Math.round(((l.originalAmt - l.balance) / l.originalAmt) * 100));
  if (l.daysOverdue > 0) return { badge: 'badge-danger',  label: 'Overdue',    color: '#DC2626', barGrad: 'linear-gradient(90deg,#DC2626,#EF4444)', glow: 'rgba(220,38,38,0.5)', paidPct };
  if (l.daysOverdue === 0 && new Date(l.nextDue) < new Date(Date.now() + 7*86400000))
    return { badge: 'badge-warning', label: 'Due Soon', color: '#D97706', barGrad: 'linear-gradient(90deg,#D97706,#F59E0B)', glow: 'rgba(217,119,6,0.4)', paidPct };
  return { badge: 'badge-success', label: 'On Track', color: '#16A34A', barGrad: 'linear-gradient(90deg,#16A34A,#4ADE80)', glow: 'rgba(22,163,74,0.4)', paidPct };
}

/* ── Add Loan Modal ───────────────────────────────────────── */
function AddLoanModal({ onClose }: { onClose: () => void }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const [name,       setName]       = useState('');
  const [lender,     setLender]     = useState('');
  const [type,       setType]       = useState('personal');
  const [origAmt,    setOrigAmt]    = useState('');
  const [balance,    setBalance]    = useState('');
  const [rate,       setRate]       = useState('');
  const [monthly,    setMonthly]    = useState('');
  const [nextDue,    setNextDue]    = useState('');

  const LOAN_TYPES = ['personal','mortgage','car','student','business','credit card','other'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await addLoan({
        name, lender, type,
        originalAmt: parseFloat(origAmt),
        balance:     parseFloat(balance || origAmt),
        annualRate:  parseFloat(rate),
        monthlyPmt:  parseFloat(monthly),
        nextDue,
      });
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
          <h2 className="card-title" style={{ marginBottom:0 }}>Add Loan</h2>
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
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Original Amount (KES)</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="1" step="1" value={origAmt} onChange={e => setOrigAmt(e.target.value)} required placeholder="500000" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Current Balance (KES)</label>
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
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : 'Add Loan'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Record Payment Modal ─────────────────────────────────── */
function RecordPaymentModal({ loan, onClose }: { loan: Loan; onClose: () => void }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading]   = useState(false);
  const [payment,  setPayment]  = useState(String(loan.monthlyPmt));
  const [nextDue,  setNextDue]  = useState('');

  const newBalance = Math.max(0, loan.balance - parseFloat(payment || '0'));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await updateLoanBalance(loan.id, newBalance, 0, nextDue || undefined);
    startT(() => router.refresh());
    onClose();
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:400, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title" style={{ marginBottom:0 }}>Record Payment</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'1rem' }}>
          Payment for <strong>{loan.name}</strong> · current balance: KES {loan.balance.toLocaleString()}
        </p>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Payment Amount (KES)</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              type="number" min="1" step="1" value={payment} onChange={e => setPayment(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>
              Next Due Date <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span>
            </label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} />
          </div>
          <div style={{ padding:'0.75rem', borderRadius:8, background:'var(--success-light)', fontSize:'0.8rem', color:'var(--success)', fontWeight:600 }}>
            New balance after payment: KES {newBalance.toLocaleString()}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : 'Record Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main Client Component ────────────────────────────────── */
export function LoansClient({ loans }: { loans: Loan[] }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,     setShowAdd]     = useState(false);
  const [payingLoan,  setPayingLoan]  = useState<Loan | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [expanded,    setExpanded]    = useState<string | null>(null);

  const totalDebt     = loans.reduce((s, l) => s + l.balance, 0);
  const totalOriginal = loans.reduce((s, l) => s + l.originalAmt, 0);
  const totalMonthly  = loans.reduce((s, l) => s + l.monthlyPmt, 0);
  const overdue       = loans.filter(l => l.daysOverdue > 0).length;
  const paidPct       = totalOriginal > 0 ? Math.min(100, Math.round(((totalOriginal - totalDebt) / totalOriginal) * 100)) : 0;

  async function handleDelete(id: string) {
    if (!confirm('Delete this loan?')) return;
    setDeletingId(id);
    await deleteLoan(id);
    startT(() => router.refresh());
    setDeletingId(null);
  }

  return (
    <>
      {showAdd    && <AddLoanModal onClose={() => setShowAdd(false)} />}
      {payingLoan && <RecordPaymentModal loan={payingLoan} onClose={() => setPayingLoan(null)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <div />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Loan</button>
      </div>

      {/* Hero Banner */}
      <div className="animate-in mb-5" style={{
        borderRadius:12,
        background: overdue > 0
          ? 'linear-gradient(135deg, #DC2626 0%, #7C3AED 55%, #0F766E 100%)'
          : 'linear-gradient(135deg, #0F766E 0%, #0070F3 55%, #7C3AED 100%)',
        boxShadow: overdue > 0 ? '0 10px 32px rgba(220,38,38,0.28)' : '0 10px 32px rgba(15,118,110,0.28)',
        padding:'1.375rem 1.5rem', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,0.06)', pointerEvents:'none' }} />
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:'1rem', alignItems:'center', position:'relative' }}>
          <div>
            <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.55)', marginBottom:'0.3rem' }}>Total Debt</p>
            <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.04em', color:'white', lineHeight:1 }}>KES {totalDebt.toLocaleString()}</p>
            <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', marginTop:'0.25rem' }}>of KES {totalOriginal.toLocaleString()} original · {paidPct}% paid</p>
          </div>
          {[
            { label:'Loans',         value:`${loans.length}`, sub:'total'          },
            { label:'Monthly Pmts',  value:`KES ${totalMonthly.toLocaleString()}`,  sub:'per month'       },
            { label:'Overdue',       value:`${overdue}`,       sub: overdue > 0 ? '⚠ needs attention' : '✓ all current' },
          ].map(k => (
            <div key={k.label} style={{ background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:10, padding:'0.75rem 1rem' }}>
              <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.55)', marginBottom:'0.2rem' }}>{k.label}</p>
              <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.1rem', fontWeight:800, color:'white', lineHeight:1.2 }}>{k.value}</p>
              <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', marginTop:'0.1rem' }}>{k.sub}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.35rem' }}>
            <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Repayment progress</span>
            <span style={{ fontSize:'0.68rem', color:'white', fontWeight:700, fontFamily:'Space Grotesk,sans-serif' }}>{paidPct}% paid off</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.18)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${paidPct}%`, background:'rgba(255,255,255,0.85)', borderRadius:999, transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
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

            // Extra payment calculator
            const monthlyRate = l.annualRate / 100 / 12;
            const monthsLeft = monthlyRate > 0
              ? Math.ceil(Math.log(1 + (l.balance * monthlyRate) / l.monthlyPmt) / Math.log(1 + monthlyRate))
              : Math.ceil(l.balance / l.monthlyPmt);
            const totalInterest = Math.round(Math.max(0, (l.monthlyPmt * monthsLeft) - l.balance));

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
                    <button onClick={() => handleDelete(l.id)} disabled={deletingId===l.id}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.2rem' }}>
                      {deletingId===l.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={13}/>}
                    </button>
                  </div>
                </div>

                {/* Balance + progress */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.5rem', fontWeight:800, color:st.color, letterSpacing:'-0.04em', lineHeight:1.1 }}>
                      KES {l.balance.toLocaleString()}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>of KES {l.originalAmt.toLocaleString()} original</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
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
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)' }}>KES {l.monthlyPmt.toLocaleString()}</div>
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
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)' }}>~{monthsLeft} mo</div>
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

                {/* Expanded interest forecast */}
                {isExpanded && (
                  <div className="animate-in" style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.625rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Repayment Forecast</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.75rem' }}>
                      {[
                        { label:'Months Remaining', value:`~${monthsLeft}`, sub:'at current pace' },
                        { label:'Total Interest',   value:`KES ${totalInterest.toLocaleString()}`, sub:'estimated remaining' },
                        { label:'Payoff Date',      value: (() => { const d = new Date(); d.setMonth(d.getMonth()+monthsLeft); return d.toLocaleDateString('en-GB',{month:'short',year:'numeric'}); })(), sub:'projected' },
                      ].map(f => (
                        <div key={f.label} style={{ background:'var(--bg-app)', borderRadius:8, padding:'0.625rem 0.875rem', border:'1px solid var(--border)' }}>
                          <div style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'0.2rem' }}>{f.label}</div>
                          <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1rem', fontWeight:800, color:'var(--text-primary)' }}>{f.value}</div>
                          <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginTop:'0.1rem' }}>{f.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
