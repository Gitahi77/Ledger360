'use client';
// src/app/net-worth/NetWorthClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAsset, editAsset, deleteAsset } from '@/lib/actions/networth';
import { fmtAdaptive } from '@/lib/format';
import { Plus, Trash2, Loader2, X, Home, Car, Briefcase, PiggyBank, Gem, BarChart3, Edit2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { toMinor, toMajor } from '@/lib/money';

type Asset = { id: string; name: string; category: string; valueMinor: number; symbol?: string | null };
type Loan  = { id: string; name: string; balanceMinor: number; type: string };

function NwChartTip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--surface-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0.625rem 0.875rem', boxShadow:'var(--shadow-md)' }}>
      <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>{label}</p>
      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background: payload[0].value >= 0 ? 'var(--color-income)' : 'var(--color-expense)', flexShrink:0 }} />
        <span style={{ fontSize:'0.78rem', color:'var(--color-text-secondary)' }}>Net Worth:</span>
        <span style={{ fontSize:'0.78rem', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', color:'var(--color-text-primary)' }}>{fmtAdaptive(payload[0].value, currency)}</span>
      </div>
    </div>
  );
}

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
  const [symbol,   setSymbol]   = useState(asset?.symbol ?? '');
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
      if (isEdit && asset) { await editAsset(asset.id, { name, category, valueMinor: toMinor(parsedValue), symbol: symbol || undefined }); }
      else { await addAsset({ name, category, valueMinor: toMinor(parsedValue), symbol: symbol || undefined }); }
      startT(() => router.refresh()); onClose();
    } catch (err: any) { setError(err.message ?? 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card animate-in" style={{ width:'100%', maxWidth:420, padding:'1.75rem' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title" style={{ marginBottom:0 }}>{isEdit ? 'Update Value' : 'Add Asset'}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex' }}><X size={18}/></button>
        </div>
        {error && <div style={{ padding:'0.625rem', borderRadius:7, background:'var(--color-expense-light)', color:'var(--color-expense)', fontSize:'0.8rem', marginBottom:'1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Asset Name</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Family Land Machakos" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Ticker Symbol (Optional)</label>
            <input className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem', textTransform: 'uppercase' }} value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="e.g. AAPL, BTC-USD" />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>Category</label>
            <select className="input-field" style={{ width:'100%', padding:'0.55rem 0.75rem', fontSize:'0.85rem' }} value={category} onChange={e => setCategory(e.target.value)}>
              {ASSET_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>
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

export function NetWorthClient({ assets, liabilities, totalAssetsMinor, totalLiabilitiesMinor, netWorthMinor, debtRatio, history, currency }: {
  assets: Asset[]; liabilities: Loan[];
  totalAssetsMinor: number; totalLiabilitiesMinor: number;
  netWorthMinor: number; debtRatio: number; 
  history: { date: string; netWorthMinor: number }[];
  currency: string;
}) {
  const router     = useRouter();
  const [, startT] = useTransition();
  const [showAdd,    setShowAdd]    = useState(false);
  const [editAsset,  setEditAsset]  = useState<Asset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [openSection, setOpenSection] = useState<'assets' | 'liabilities' | null>(null);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '1Y' | 'ALL'>('3M');

  const sliceDays = timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '1Y' ? 365 : 365;
  const chartData = history.slice(-sliceDays).map(d => ({ ...d, label: new Date(d.date).toLocaleDateString('default', { month: 'short', day: 'numeric' }) }));

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
  const debtColor = debtRatio < 40 ? 'var(--color-income)' : debtRatio < 70 ? 'var(--warning)' : 'var(--color-expense)';
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
              color: positive ? 'var(--color-income)' : 'var(--color-expense)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            }}>
              {positive ? '+' : '−'}{fmtAdaptive(Math.abs(netWorthMinor), currency)}
            </p>
            <p className="hero-sub">Assets minus liabilities</p>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card">
              <p className="hero-label">Total Assets</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-income)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fmtAdaptive(totalAssetsMinor, currency)}</p>
              <p className="hero-sub">{assets.length} items</p>
            </div>
            <div className="hero-stat-card">
              <p className="hero-label">Total Liabilities</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-expense)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{fmtAdaptive(totalLiabilitiesMinor, currency)}</p>
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

      {/* Chart Section */}
      <div className="card animate-in mb-5">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Net Worth History</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-sunken)', padding: '0.25rem', borderRadius: 8 }}>
            {['1M', '3M', '1Y', 'ALL'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeframe(t as any)}
                style={{ 
                  background: timeframe === t ? 'var(--surface-card)' : 'transparent',
                  border: timeframe === t ? '1px solid var(--border)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: timeframe === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  boxShadow: timeframe === t ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} minTickGap={30} dy={10} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={v => Math.abs(v) >= 100000000 ? `${Math.round(v/100000000)}M` : Math.abs(v) >= 100000 ? `${Math.round(v/100000)}k` : String(v/100)} />
              <Tooltip content={<NwChartTip currency={currency} />} />
              <Area type="monotone" dataKey="netWorthMinor" stroke="var(--color-brand)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNw)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Accordion Layout: Assets + Liabilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        
        {/* Assets Accordion Header */}
        <button 
          onClick={() => setOpenSection(s => s === 'assets' ? null : 'assets')}
          className="card"
          style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: openSection === 'assets' ? '1px solid var(--color-brand)' : undefined }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Assets Breakdown</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{assets.length} items • {fmtAdaptive(totalAssetsMinor, currency)}</div>
          </div>
          <div style={{ color: 'var(--color-brand)' }}>
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
              <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--color-text-secondary)', fontSize:'0.8rem' }}>
                <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>🏦</div>
                No assets yet — add your first one
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {assets.map((a, i) => (
                  <div key={a.id} className={`card animate-in delay-${(i%4)+1}`}
                    style={{ padding:'0.875rem 1.125rem', borderLeft:'3px solid var(--color-income)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width:32, height:32, borderRadius:7, background:'var(--color-income-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--color-income)' }}>
                      {ASSET_ICONS[a.category] ?? ASSET_ICONS.Other}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'0.8125rem', color:'var(--color-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)', textTransform:'capitalize' }}>{a.category}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'var(--color-income)', whiteSpace:'nowrap' }}>{fmtAdaptive(a.valueMinor, currency)}</div>
                      <div style={{ display:'flex', gap:'0.3rem', justifyContent:'flex-end', marginTop:'0.2rem' }}>
                        <button onClick={() => setEditAsset(a)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.15rem' }}><Edit2 size={12}/></button>
                        <button onClick={() => handleDelete(a.id)} disabled={deletingId===a.id} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex', padding:'0.15rem' }}>
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
          style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: openSection === 'liabilities' ? '1px solid var(--color-brand)' : undefined }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Liabilities Breakdown</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{liabilities.length} loans • {fmtAdaptive(totalLiabilitiesMinor, currency)}</div>
          </div>
          <div style={{ color: 'var(--color-brand)' }}>
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
              <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--color-text-secondary)', fontSize:'0.8rem' }}>
                <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>🎉</div>
                No liabilities! You are debt free.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {liabilities.map((l, i) => (
                  <div key={l.id} className={`card animate-in delay-${(i%4)+1}`}
                    style={{ padding:'0.875rem 1.125rem', borderLeft:'3px solid var(--color-expense)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'0.8125rem', color:'var(--color-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.name}</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--color-text-secondary)', textTransform:'capitalize' }}>{l.type.replace('_', ' ')}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.9rem', color:'var(--color-expense)', whiteSpace:'nowrap' }}>{fmtAdaptive(l.balanceMinor, currency)}</div>
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
