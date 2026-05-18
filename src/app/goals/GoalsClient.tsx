'use client';
// src/app/goals/GoalsClient.tsx — Live Goals UI with Add/Update/Delete modals
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addGoal, updateGoalAmount, deleteGoal } from '@/lib/actions/goals';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Plus, CheckCircle2, TrendingUp, Trash2, Loader2, X, PiggyBank } from 'lucide-react';

type Goal = {
  id: string; name: string; category: string;
  targetAmount: number; currentAmount: number;
  deadline: Date | null;
};

/* ── Status style (identical to original mock version) ───── */
function goalStyle(pct: number) {
  if (pct >= 100) return { label:'Achieved',     badge:'badge-success', barGrad:'linear-gradient(90deg,#16A34A,#4ADE80)', borderColor:'#16A34A', numColor:'#16A34A', glow:'rgba(22,163,74,0.5)',    iconBg:'var(--success-light)' };
  if (pct >= 70)  return { label:'Almost There', badge:'badge-blue',    barGrad:'linear-gradient(90deg,#0070F3,#0F766E)', borderColor:'#0F766E', numColor:'#0F766E', glow:'rgba(15,118,110,0.45)',  iconBg:'var(--teal-light)'    };
  if (pct >= 35)  return { label:'Building',     badge:'badge-blue',    barGrad:'linear-gradient(90deg,#38BDF8,#0070F3)', borderColor:'#0070F3', numColor:'#0070F3', glow:'rgba(0,112,243,0.45)',   iconBg:'var(--primary-light)' };
  return               { label:'Early Stage',  badge:'badge-sky',     barGrad:'linear-gradient(90deg,#BAE6FD,#38BDF8)', borderColor:'#0284C7', numColor:'#0284C7', glow:'rgba(2,132,199,0.4)',    iconBg:'var(--sky-light)'     };
}

/* ── Add Goal Modal ───────────────────────────────────────── */
function AddGoalModal({ onClose }: { onClose: () => void }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name,          setName]          = useState('');
  const [category,      setCategory]      = useState('savings');
  const [targetAmount,  setTargetAmount]  = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline,      setDeadline]      = useState('');

  const GOAL_CATS = ['savings','emergency','travel','education','health','car','home','business','shopping','other'];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await addGoal({
        name, category,
        targetAmount:  parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        deadline:      deadline || undefined,
      });
      startT(() => router.refresh());
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:460, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>New Goal</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--danger-light)', color:'var(--danger)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Goal Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Emergency Fund" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Category</label>
            <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              value={category} onChange={e => setCategory(e.target.value)}>
              {GOAL_CATS.map(c => <option key={c} value={c} style={{ textTransform:'capitalize' }}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Target Amount (KES)</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="1" step="1" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required placeholder="100000" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Already Saved (KES)</label>
              <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
                type="number" min="0" step="1" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>
              Target Deadline <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(optional)</span>
            </label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem', marginTop:'0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : 'Create Goal'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Add Funds Modal ──────────────────────────────────────── */
function AddFundsModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [amount,  setAmount]  = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const newTotal = goal.currentAmount + parseFloat(amount);
    await updateGoalAmount(goal.id, newTotal);
    startT(() => router.refresh());
    onClose();
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:380, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title" style={{ marginBottom:0 }}>Add Funds</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'1rem' }}>
          Adding to <strong>{goal.name}</strong> · current: KES {goal.currentAmount.toLocaleString()}
        </p>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Amount to Add (KES)</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }}
              type="number" min="1" step="1" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="5000" autoFocus />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : 'Add Funds'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main Client Component ────────────────────────────────── */
export function GoalsClient({ goals }: { goals: Goal[] }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,      setShowAdd]      = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<Goal | null>(null);
  const [celebrating,  setCelebrate]    = useState<string | null>(null);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);

  const totalSaved   = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget  = goals.reduce((s, g) => s + g.targetAmount, 0);
  const achieved     = goals.filter(g => g.currentAmount >= g.targetAmount).length;
  const almostThere  = goals.filter(g => { const p = (g.currentAmount/g.targetAmount)*100; return p >= 70 && p < 100; }).length;
  const overallPct   = totalTarget > 0 ? Math.round((totalSaved/totalTarget)*100) : 0;

  async function handleDelete(id: string) {
    if (!confirm('Delete this goal?')) return;
    setDeletingId(id);
    await deleteGoal(id);
    startT(() => router.refresh());
    setDeletingId(null);
  }

  return (
    <>
      {showAdd      && <AddGoalModal onClose={() => setShowAdd(false)} />}
      {addFundsGoal && <AddFundsModal goal={addFundsGoal} onClose={() => setAddFundsGoal(null)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <div />
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> New Goal</button>
      </div>

      {/* Hero Banner — identical gradient to original mock */}
      <div style={{ marginBottom:'1.5rem' }}>
        <div className="hero-card animate-in" style={{
          background:'linear-gradient(135deg, #16A34A 0%, #0F766E 50%, #0070F3 100%)',
          boxShadow:'0 10px 28px rgba(22,163,74,0.28)',
        }}>
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1fr', gap:'1rem', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.55)', marginBottom:'0.35rem' }}>Total Saved</p>
              <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.75rem', fontWeight:800, letterSpacing:'-0.04em', color:'white', lineHeight:1 }}>KES {totalSaved.toLocaleString()}</p>
              <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', marginTop:'0.25rem' }}>of KES {totalTarget.toLocaleString()}</p>
            </div>
            {[
              { label:'Goals',       value:`${goals.length}`, sub:'total'     },
              { label:'Achieved',    value:`${achieved}`,      sub:'complete'  },
              { label:'Almost There',value:`${almostThere}`,   sub:'70%+ done' },
            ].map(k => (
              <div key={k.label} style={{ background:'rgba(255,255,255,0.12)', borderRadius:8, padding:'0.625rem 0.875rem', border:'1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.55)', marginBottom:'0.2rem' }}>{k.label}</p>
                <p style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.5rem', fontWeight:800, color:'white', lineHeight:1 }}>{k.value}</p>
                <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', marginTop:'0.1rem' }}>{k.sub}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop:'1.125rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
              <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.65)', fontWeight:600 }}>Overall progress</span>
              <span style={{ fontSize:'0.7rem', color:'white', fontWeight:700, fontFamily:'Space Grotesk,sans-serif' }}>{overallPct}%</span>
            </div>
            <div style={{ height:5, background:'rgba(255,255,255,0.2)', borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${overallPct}%`, background:'rgba(255,255,255,0.85)', borderRadius:999, boxShadow:'0 0 8px rgba(255,255,255,0.5)', transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Goal cards / empty state */}
      {goals.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <PiggyBank size={40} style={{ margin:'0 auto 0.75rem', opacity:0.4 }} />
          <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>No goals yet</div>
          <div style={{ fontSize:'0.78rem', marginBottom:'1rem' }}>Set your first savings goal to start tracking progress</div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Create Goal</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.125rem' }}>
          {goals.map((g, i) => {
            const pct  = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const st   = goalStyle(pct);
            const left = Math.max(0, g.targetAmount - g.currentAmount);
            const deadlineLabel = g.deadline
              ? new Date(g.deadline).toLocaleDateString('en-GB', { month:'short', year:'numeric' })
              : 'No deadline';

            return (
              <div key={g.id} className={`card animate-in delay-${(i%4)+1}`}
                style={{ cursor:'pointer', borderTop:`3px solid ${st.borderColor}`,
                  transition:'transform 0.2s,box-shadow 0.2s',
                  boxShadow: celebrating===g.id ? `0 8px 28px ${st.glow}` : undefined,
                  transform:  celebrating===g.id ? 'scale(1.025)' : undefined,
                }}
                onClick={() => { if (pct>=100) { setCelebrate(g.id); setTimeout(()=>setCelebrate(null),800); } }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width:32, height:32, borderRadius:7, background:st.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <CategoryIcon category={g.category} name={g.name} size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>{g.name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.1rem' }}>Target by {deadlineLabel}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${st.badge}`}>{st.label}</span>
                    <button onClick={e => { e.stopPropagation(); handleDelete(g.id); }} disabled={deletingId===g.id}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.2rem' }}>
                      {deletingId===g.id ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={13}/>}
                    </button>
                  </div>
                </div>

                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1.5rem', fontWeight:800, color:st.numColor, letterSpacing:'-0.04em', lineHeight:1.1 }}>
                      KES {g.currentAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>of KES {g.targetAmount.toLocaleString()}</div>
                  </div>
                  <div style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'2rem', fontWeight:800, color:st.numColor, letterSpacing:'-0.05em', lineHeight:1, opacity:0.88 }}>{pct}%</div>
                </div>

                <div className="progress-track mb-3" style={{ height:8 }}>
                  <div className="progress-fill" style={{ width:`${pct}%`, background:st.barGrad, boxShadow:`0 0 10px ${st.glow}, 0 1px 0 rgba(255,255,255,0.3) inset` }} />
                </div>

                {pct >= 100 ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', padding:'0.5rem', background:'var(--success-light)', borderRadius:6, fontSize:'0.8rem', fontWeight:700, color:'var(--success)' }}>
                    <CheckCircle2 size={14}/> Goal achieved — tap to celebrate 🎉
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontWeight:500 }}>KES {left.toLocaleString()} to go</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); setAddFundsGoal(g); }}
                        className="btn btn-outline"
                        style={{ padding:'0.2rem 0.6rem', fontSize:'0.72rem', gap:'0.2rem' }}
                      >
                        <TrendingUp size={11}/> Add Funds
                      </button>
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
