'use client';
// src/app/net-worth/NetWorthClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAsset, updateAsset, deleteAsset } from '@/lib/actions/networth';
import { fmtAdaptive } from '@/lib/format';
import { Plus, Trash2, Loader2, X, Home, Car, Briefcase, PiggyBank, Gem, BarChart3, Edit2 } from 'lucide-react';

type Asset = { id: string; name: string; category: string; value: number };
type Loan  = { id: string; name: string; balance: number; type: string };

const ASSET_ICONS: Record<string, React.ReactNode> = {
  property:    <Home size={16}/>,
  vehicle:     <Car size={16}/>,
  business:    <Briefcase size={16}/>,
  savings:     <PiggyBank size={16}/>,
  investments: <BarChart3 size={16}/>,
  jewelry:     <Gem size={16}/>,
  other:       <Gem size={16}/>,
};
const ASSET_CATS = ['savings','property','vehicle','investments','business','jewelry','other'];

function AssetModal({ asset, onClose }: { asset?: Asset; onClose: () => void }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name,     setName]     = useState(asset?.name     ?? '');
  const [category, setCategory] = useState(asset?.category ?? 'savings');
  const [value,    setValue]    = useState(asset ? String(asset.value) : '');
  const isEdit = Boolean(asset);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isEdit && asset) { await updateAsset(asset.id, parseFloat(value)); }
      else { await addAsset({ name, category, value: parseFloat(value) }); }
      startT(() => router.refresh()); onClose();
    } catch (err: any) { setError(err.message ?? 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:420, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>{isEdit ? 'Update Value' : 'Add Asset'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--danger-light)', color:'var(--danger)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          {!isEdit && (
            <>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Asset Name</label>
                <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Family Land Machakos" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Category</label>
                <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={category} onChange={e => setCategory(e.target.value)}>
                  {ASSET_CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>
              {isEdit ? 'New Estimated Value (KES)' : 'Current Value (KES)'}
            </label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} type="number" min="0" step="1" value={value} onChange={e => setValue(e.target.value)} required placeholder="500000" autoFocus={isEdit} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'0.7rem', marginTop:'0.25rem' }}>
            {loading ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : (isEdit ? 'Update Asset' : 'Add Asset')}
          </button>
        </form>
      </div>
    </div>
  );
}

export function NetWorthClient({ assets, liabilities, totalAssets, totalLiabilities, netWorth, debtRatio }: {
  assets: Asset[]; liabilities: Loan[];
  totalAssets: number; totalLiabilities: number;
  netWorth: number; debtRatio: number;
}) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,    setShowAdd]    = useState(false);
  const [editAsset,  setEditAsset]  = useState<Asset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Remove this asset?')) return;
    setDeletingId(id);
    await deleteAsset(id);
    startT(() => router.refresh());
    setDeletingId(null);
  }

  const positive = netWorth >= 0;
  const debtColor = debtRatio < 40 ? 'var(--success)' : debtRatio < 70 ? 'var(--warning)' : 'var(--danger)';
  const debtLabel = debtRatio < 40 ? '✓ Healthy' : debtRatio < 70 ? '⚠ Watch this' : '⛔ High';

  return (
    <>
      {showAdd   && <AssetModal onClose={() => setShowAdd(false)} />}
      {editAsset && <AssetModal asset={editAsset} onClose={() => setEditAsset(null)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 animate-in flex-wrap gap-3">
        <div/>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Asset</button>
      </div>

      {/* Hero — matches dashboard exactly */}
      <div className="dashboard-hero animate-in mb-5">
        <div className="dashboard-hero-grid">
          <div>
            <p className="hero-label">Net Worth</p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: Math.abs(netWorth) > 9_999_999 ? '1.6rem' : Math.abs(netWorth) > 999_999 ? '1.9rem' : '2.25rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color: positive ? 'var(--success)' : 'var(--danger)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {positive ? '+' : '−'}{fmtAdaptive(Math.abs(netWorth))}
            </p>
            <p className="hero-sub">Assets minus liabilities</p>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">Total Assets</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--success)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fmtAdaptive(totalAssets)}</p>
              <p className="hero-sub">{assets.length} items</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Total Liabilities</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--danger)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fmtAdaptive(totalLiabilities)}</p>
              <p className="hero-sub">{liabilities.length} loans</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Debt Ratio</p>
              <p className="hero-stat-value tabular" style={{ color: debtColor }}>{debtRatio}%</p>
              <p className="hero-sub">{debtLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Assets + Liabilities */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
        {/* Assets */}
        <div>
          <div style={{ fontWeight:700, fontSize:'0.8125rem', color:'var(--text-primary)', marginBottom:'0.875rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            Assets
            <button className="btn btn-outline" style={{ padding:'0.25rem 0.625rem', fontSize:'0.72rem' }} onClick={() => setShowAdd(true)}><Plus size={11}/> Add</button>
          </div>
          {assets.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>🏦</div>
              No assets yet — add your first one
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              {assets.map((a, i) => (
                <div key={a.id} className={`card animate-in delay-${(i%4)+1}`}
                  style={{ padding:'0.875rem 1.125rem', borderLeft:'3px solid var(--success)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:32, height:32, borderRadius:7, background:'var(--success-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--success)' }}>
                    {ASSET_ICONS[a.category] ?? ASSET_ICONS.other}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'0.8125rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'capitalize' }}>{a.category}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'var(--success)', whiteSpace:'nowrap' }}>{fmtAdaptive(a.value)}</div>
                    <div style={{ display:'flex', gap:'0.3rem', justifyContent:'flex-end', marginTop:'0.2rem' }}>
                      <button onClick={() => setEditAsset(a)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.15rem' }}><Edit2 size={12}/></button>
                      <button onClick={() => handleDelete(a.id)} disabled={deletingId===a.id} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.15rem' }}>
                        {deletingId===a.id ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ padding:'0.625rem 1rem', borderRadius:8, background:'var(--success-light)', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.25rem' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--success)' }}>Total Assets</span>
                <span style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1rem', fontWeight:800, color:'var(--success)', whiteSpace:'nowrap' }}>{fmtAdaptive(totalAssets)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Liabilities */}
        <div>
          <div style={{ fontWeight:700, fontSize:'0.8125rem', color:'var(--text-primary)', marginBottom:'0.875rem' }}>Liabilities</div>
          {liabilities.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>
              <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>✨</div>
              No debts — debt free!
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              {liabilities.map((l, i) => (
                <div key={l.id} className={`card animate-in delay-${(i%4)+1}`}
                  style={{ padding:'0.875rem 1.125rem', borderLeft:'3px solid var(--danger)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:32, height:32, borderRadius:7, background:'var(--danger-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:'0.85rem' }}>💳</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'0.8125rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.name}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'capitalize' }}>{l.type}</div>
                  </div>
                  <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'var(--danger)', whiteSpace:'nowrap', flexShrink:0 }}>
                    {fmtAdaptive(l.balance)}
                  </div>
                </div>
              ))}
              <div style={{ padding:'0.625rem 1rem', borderRadius:8, background:'var(--danger-light)', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.25rem' }}>
                <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--danger)' }}>Total Liabilities</span>
                <span style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1rem', fontWeight:800, color:'var(--danger)', whiteSpace:'nowrap' }}>{fmtAdaptive(totalLiabilities)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
