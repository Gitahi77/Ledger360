'use client';
// src/app/net-worth/NetWorthClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAsset, editAsset, deleteAsset } from '@/lib/actions/networth';
import { fmtAdaptive } from '@/lib/format';
import { Plus, Trash2, Loader2, X, Home, Car, Briefcase, PiggyBank, Gem, BarChart3, Edit2 } from 'lucide-react';

import { toMinor, toMajor } from '@/lib/money';

type Asset = { id: string; name: string; category: string; valueMinor: number };
type Loan  = { id: string; name: string; balanceMinor: number; type: string };

const ASSET_ICONS: Record<string, React.ReactNode> = {
  Property:    <Home size={16}/>,
  Vehicle:     <Car size={16}/>,
  Investment:  <BarChart3 size={16}/>,
  Other:       <Gem size={16}/>,
};
const ASSET_CATS = ['Property', 'Investment', 'Vehicle', 'Other'];

function AssetModal({ asset, onClose, currency }: { asset?: Asset; onClose: () => void; currency: string }) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [name,     setName]     = useState(asset?.name     ?? '');
  const [category, setCategory] = useState(asset?.category ?? 'Other');
  const [value,    setValue]    = useState(asset ? String(toMajor(asset.valueMinor)) : '');
  const isEdit = Boolean(asset);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Finance app invariant: an asset with NaN or zero value silently corrupts net worth.
    const parsedValue = parseFloat(value);
    if (!value || !isFinite(parsedValue) || parsedValue <= 0) {
      setError('Please enter a valid positive asset value.'); return;
    }
    setLoading(true); setError('');
    try {
      if (isEdit && asset) { await editAsset(asset.id, { name, category, valueMinor: toMinor(parsedValue) }); }
      else { await addAsset({ name, category, valueMinor: toMinor(parsedValue) }); }
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
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Asset Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Family Land Machakos" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>Category</label>
            <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={category} onChange={e => setCategory(e.target.value)}>
              {ASSET_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'0.35rem' }}>
              {isEdit ? `New Estimated Value (${currency})` : `Current Value (${currency})`}
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

export function NetWorthClient({ assets, liabilities, totalAssetsMinor, totalLiabilitiesMinor, netWorthMinor, debtRatio, currency }: {
  assets: Asset[]; liabilities: Loan[];
  totalAssetsMinor: number; totalLiabilitiesMinor: number;
  netWorthMinor: number; debtRatio: number; currency: string;
}) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,    setShowAdd]    = useState(false);
  const [editAsset,  setEditAsset]  = useState<Asset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [openSection, setOpenSection] = useState<'assets' | 'liabilities' | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Remove this asset?')) return;
    setDeletingId(id);
    try {
      await deleteAsset(id);
      startT(() => router.refresh());
    } catch {
      // non-critical
    } finally { setDeletingId(null); }
  }

  const positive = netWorthMinor >= 0;
  const debtColor = debtRatio < 40 ? 'var(--success)' : debtRatio < 70 ? 'var(--warning)' : 'var(--danger)';
  const debtLabel = debtRatio < 40 ? '✓ Healthy' : debtRatio < 70 ? '⚠ Watch this' : '⛔ High';

  return (
    <>
      {showAdd   && <AssetModal onClose={() => setShowAdd(false)} currency={currency} />}
      {editAsset && <AssetModal asset={editAsset} onClose={() => setEditAsset(null)} currency={currency} />}

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
              fontSize: Math.abs(netWorthMinor) > 9_999_99900 ? '1.6rem' : Math.abs(netWorthMinor) > 999_99900 ? '1.9rem' : '2.25rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1,
              color: positive ? 'var(--success)' : 'var(--danger)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {positive ? '+' : '−'}{fmtAdaptive(Math.abs(netWorthMinor), currency)}
            </p>
            <p className="hero-sub">Assets minus liabilities</p>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">Total Assets</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--success)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fmtAdaptive(totalAssetsMinor, currency)}</p>
              <p className="hero-sub">{assets.length} items</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Total Liabilities</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--danger)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fmtAdaptive(totalLiabilitiesMinor, currency)}</p>
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

      {/* Accordion Layout: Assets + Liabilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* Assets Accordion Header */}
        <button 
          onClick={() => setOpenSection(s => s === 'assets' ? null : 'assets')}
          className="card"
          style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: openSection === 'assets' ? '1px solid var(--primary)' : undefined }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Assets Breakdown</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{assets.length} items • {fmtAdaptive(totalAssetsMinor, currency)}</div>
          </div>
          <div style={{ color: 'var(--primary)' }}>
            {openSection === 'assets' ? 'Hide Details' : 'View Details'}
          </div>
        </button>

        {/* Assets Content */}
        {openSection === 'assets' && (
          <div className="animate-in" style={{ padding: '0 0.5rem 1rem 0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:'0.875rem' }}>
              <button className="btn btn-outline" style={{ padding:'0.35rem 0.75rem', fontSize:'0.75rem' }} onClick={() => setShowAdd(true)}><Plus size={13}/> Add Asset</button>
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
                      {ASSET_ICONS[a.category] ?? ASSET_ICONS.Other}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'0.8125rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'capitalize' }}>{a.category}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'var(--success)', whiteSpace:'nowrap' }}>{fmtAdaptive(a.valueMinor, currency)}</div>
                      <div style={{ display:'flex', gap:'0.3rem', justifyContent:'flex-end', marginTop:'0.2rem' }}>
                        <button onClick={() => setEditAsset(a)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.15rem' }}><Edit2 size={12}/></button>
                        <button onClick={() => handleDelete(a.id)} disabled={deletingId===a.id} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.15rem' }}>
                          {deletingId===a.id ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Liabilities Accordion Header */}
        <button 
          onClick={() => setOpenSection(s => s === 'liabilities' ? null : 'liabilities')}
          className="card"
          style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: openSection === 'liabilities' ? '1px solid var(--primary)' : undefined }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Liabilities Breakdown</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{liabilities.length} loans • {fmtAdaptive(totalLiabilitiesMinor, currency)}</div>
          </div>
          <div style={{ color: 'var(--primary)' }}>
            {openSection === 'liabilities' ? 'Hide Details' : 'View Details'}
          </div>
        </button>

        {/* Liabilities Content */}
        {openSection === 'liabilities' && (
          <div className="animate-in" style={{ padding: '0 0.5rem 1rem 0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:'0.875rem' }}>
              <button className="btn btn-outline" style={{ padding:'0.35rem 0.75rem', fontSize:'0.75rem' }} onClick={() => router.push('/loans')}><Plus size={13}/> Manage Loans</button>
            </div>
            {liabilities.length === 0 ? (
              <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>🎉</div>
                No liabilities! You are debt free.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {liabilities.map((l, i) => (
                  <div key={l.id} className={`card animate-in delay-${(i%4)+1}`}
                    style={{ padding:'0.875rem 1.125rem', borderLeft:'3px solid var(--danger)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'0.8125rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.name}</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'capitalize' }}>{l.type.replace('_', ' ')}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'var(--danger)', whiteSpace:'nowrap' }}>{fmtAdaptive(l.balanceMinor, currency)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
