'use client';
// src/app/net-worth/NetWorthClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAsset, editAsset, deleteAsset } from '@/lib/actions/networth';
import { formatCurrency } from '@/lib/finance/formatCurrency';
import { Plus, Trash2, Loader2, X, Home, Car, Gem, BarChart3, Edit2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { toMinor, toMajor } from '@/lib/money';
import { getErrorMessage } from '@/lib/errors';

type Asset = { id: string; name: string; category: string; valueMoney: import('@/lib/types/domain').MoneyDTO; symbol?: string | null };
type Loan  = { id: string; name: string; balanceMoney: import('@/lib/types/domain').MoneyDTO; type: string };

function NwChartTip(props: { active?: boolean; payload?: unknown; label?: string; currency?: string; total?: number }) {
  if (typeof props !== 'object' || props === null) return null;
  const { active, payload, label } = props as { active?: boolean; payload?: { value: number; color?: string }[]; label?: string };
  const currency = (props as { currency?: string }).currency || 'USD';
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--surface-card)', border:'1px solid var(--border)', borderRadius:8, padding:'0.625rem 0.875rem', boxShadow:'var(--shadow-md)' }}>
      <p style={{ fontSize:'0.68rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--color-text-secondary)', marginBottom:'0.35rem' }}>{label}</p>
      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background: payload[0].value >= 0 ? 'var(--color-income)' : 'var(--color-expense)', flexShrink:0 }} />
        <span style={{ fontSize:'0.78rem', color:'var(--color-text-secondary)' }}>Net Worth:</span>
        <span style={{ fontSize:'0.78rem', fontWeight:700, fontFamily:'Space Grotesk,sans-serif', color:'var(--color-text-primary)' }}>{formatCurrency({ amountMinor: payload[0].value, currency: currency }, { variant: 'compact' })}</span>
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
  const [value,    setValue]    = useState(asset ? String(toMajor(asset.valueMoney.amountMinor)) : '');
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
    } catch (err: unknown) { setError(getErrorMessage(err)); }  
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
  const chartData = (history || []).slice(-sliceDays).map(d => ({ ...d, label: new Date(d.date).toLocaleDateString('default', { month: 'short', day: 'numeric' }) }));

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showAdd   && <AssetModal onClose={() => setShowAdd(false)} currency={currency} />}
      {editAsset && <AssetModal asset={editAsset} onClose={() => setEditAsset(null)} currency={currency} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div/>
        <button 
          className="btn btn-primary shadow-sm hover:shadow-md transition-all duration-300" 
          onClick={() => setShowAdd(true)}
          style={{ background: 'linear-gradient(135deg, var(--color-brand), hsl(220, 80%, 65%))', border: 'none' }}
        >
          <Plus size={14}/> Add Asset
        </button>
      </div>

      {/* Hero — matches dashboard exactly, but with glassmorphism touches */}
      <div className="dashboard-hero mb-6" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle background glow */}
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '150%', height: '200%', background: positive ? 'radial-gradient(circle at top left, rgba(22,163,74,0.04), transparent 50%)' : 'radial-gradient(circle at top left, rgba(220,38,38,0.04), transparent 50%)', pointerEvents: 'none' }} />
        
        <div className="dashboard-hero-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <p className="hero-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>Net Worth <div style={{ width: 6, height: 6, borderRadius: '50%', background: positive ? 'var(--color-income)' : 'var(--color-expense)', boxShadow: `0 0 8px ${positive ? 'var(--color-income)' : 'var(--color-expense)'}` }} /></p>
            <p style={{
              fontFamily:'Space Grotesk,sans-serif',
              fontSize: Math.abs(netWorthMinor) > 9_999_99900 ? '1.8rem' : Math.abs(netWorthMinor) > 999_99900 ? '2.1rem' : '2.5rem',
              fontWeight:800, letterSpacing:'-0.04em', lineHeight:1.1,
              background: positive ? 'linear-gradient(90deg, var(--color-income), hsl(152,65%,62%))' : 'linear-gradient(90deg, var(--color-expense), hsl(0,78%,72%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
              textShadow: '0 2px 10px rgba(0,0,0,0.05)',
              paddingBottom: '0.2rem'
            }}>
              {positive ? '+' : '−'}{formatCurrency({ amountMinor: Math.abs(netWorthMinor), currency: currency }, { variant: 'compact' })}
            </p>
            <p className="hero-sub">Assets minus liabilities</p>
          </div>
          <div className="hero-stats-grid">
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)]">
              <p className="hero-label">Total Assets</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-income)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{formatCurrency({ amountMinor: totalAssetsMinor, currency: currency }, { variant: 'compact' })}</p>
              <p className="hero-sub">{assets?.length || 0} items</p>
            </div>
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)]">
              <p className="hero-label">Total Liabilities</p>
              <p className="hero-stat-value tabular" style={{ color:'var(--color-expense)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{formatCurrency({ amountMinor: totalLiabilitiesMinor, currency: currency }, { variant: 'compact' })}</p>
              <p className="hero-sub">{liabilities?.length || 0} loans</p>
            </div>
            <div className="hero-stat-card transition-all duration-300 hover:bg-[var(--surface-sunken)]">
              <p className="hero-label">Debt Ratio</p>
              <p className="hero-stat-value tabular" style={{ color: debtColor }}>{debtRatio}%</p>
              <p className="hero-sub" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--surface-sunken)', padding: '0.1rem 0.4rem', borderRadius: 4, marginTop: '0.2rem' }}>{debtLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card mb-6" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.25rem 0 1.25rem' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Performance History</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--surface-sunken)', padding: '0.25rem', borderRadius: 8 }}>
            {['1M', '3M', '1Y', 'ALL'].map(t => (
              <button 
                key={t}
                onClick={() => setTimeframe(t as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                style={{ 
                  background: timeframe === t ? 'var(--surface-card)' : 'transparent',
                  border: timeframe === t ? '1px solid var(--border)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '0.25rem 0.7rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: timeframe === t ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  boxShadow: timeframe === t ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', padding: '0 0.5rem 0.5rem 0.5rem' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--brand))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--brand))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} minTickGap={30} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={v => Math.abs(v) >= 100000000 ? `${Math.round(v/100000000)}M` : Math.abs(v) >= 100000 ? `${Math.round(v/100000)}k` : String(v/100)} />
                <Tooltip content={<NwChartTip currency={currency} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="netWorthMinor" 
                  stroke="hsl(var(--brand))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorNw)" 
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
             <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
               <Loader2 size={18} className="animate-spin" style={{ marginRight: '0.5rem' }} /> Loading history...
             </div>
          )}
        </div>
      </div>

      {/* Accordion Layout: Assets + Liabilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Assets Accordion Header */}
        <button 
          onClick={() => setOpenSection(s => s === 'assets' ? null : 'assets')}
          className="card hover:border-[var(--color-brand)] transition-colors duration-300"
          style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: openSection === 'assets' ? '1px solid var(--color-brand)' : '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-income-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-income)' }}>
              <Home size={20} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>Assets Breakdown</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>{(assets || []).length} items • <span style={{ color: 'var(--color-income)', fontWeight: 600 }}>{formatCurrency({ amountMinor: totalAssetsMinor, currency: currency }, { variant: 'compact' })}</span></div>
            </div>
          </div>
          <div style={{ color: 'var(--color-brand)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {openSection === 'assets' ? 'Hide Details' : 'View Details'}
          </div>
        </button>

        {/* Assets Content */}
        {openSection === 'assets' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300" style={{ padding: '0 0.5rem 1rem 0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:'1rem' }}>
              <button className="btn btn-outline hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-all" style={{ padding:'0.4rem 0.8rem', fontSize:'0.75rem', borderRadius: '8px' }} onClick={() => setShowAdd(true)}><Plus size={14} style={{ marginRight: '0.25rem' }}/> Add Asset</button>
            </div>
            {(!assets || assets.length === 0) ? (
              <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--color-text-secondary)', fontSize:'0.85rem', borderRadius: '12px', border: '1px dashed var(--border)', background: 'transparent' }}>
                <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>🏦</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>No assets yet</div>
                <div style={{ marginTop: '0.25rem' }}>Add your first asset to start tracking your net worth.</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap:'0.75rem' }}>
                {assets.map((a) => (
                  <div key={a.id} className="card group transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    style={{ padding:'1rem', borderLeft:'4px solid var(--color-income)', display:'flex', alignItems:'center', gap:'0.875rem', borderRadius: '12px', cursor: 'default' }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:'var(--color-income-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--color-income)' }}>
                      {ASSET_ICONS[a.category] ?? ASSET_ICONS.Other}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--color-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', textTransform:'capitalize', marginTop: '0.1rem' }}>{a.category}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'var(--color-income)', whiteSpace:'nowrap' }}>{formatCurrency({ amountMinor: a.valueMoney.amountMinor, currency: currency }, { variant: 'compact' })}</div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ display:'flex', gap:'0.4rem', justifyContent:'flex-end', marginTop:'0.3rem' }}>
                        <button onClick={() => setEditAsset(a)} className="hover:bg-[var(--surface-sunken)] p-1 rounded transition-colors" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex' }}><Edit2 size={13}/></button>
                        <button onClick={() => handleDelete(a.id)} disabled={deletingId===a.id} className="hover:bg-[var(--color-expense-light)] hover:text-[var(--color-expense)] p-1 rounded transition-colors" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-secondary)', display:'flex' }}>
                          {deletingId===a.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13}/>}
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
          className="card hover:border-[var(--color-expense)] transition-colors duration-300"
          style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: openSection === 'liabilities' ? '1px solid var(--color-expense)' : '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-expense-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-expense)' }}>
              <div style={{ transform: 'rotate(180deg)' }}><BarChart3 size={20} /></div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>Liabilities Breakdown</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>{(liabilities || []).length} loans • <span style={{ color: 'var(--color-expense)', fontWeight: 600 }}>{formatCurrency({ amountMinor: totalLiabilitiesMinor, currency: currency }, { variant: 'compact' })}</span></div>
            </div>
          </div>
          <div style={{ color: 'var(--color-expense)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {openSection === 'liabilities' ? 'Hide Details' : 'View Details'}
          </div>
        </button>

        {/* Liabilities Content */}
        {openSection === 'liabilities' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300" style={{ padding: '0 0.5rem 1rem 0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginBottom:'1rem' }}>
              <button className="btn btn-outline hover:bg-[var(--color-expense-light)] hover:text-[var(--color-expense)] hover:border-[var(--color-expense)] transition-all" style={{ padding:'0.4rem 0.8rem', fontSize:'0.75rem', borderRadius: '8px' }} onClick={() => router.push('/loans')}><Plus size={14} style={{ marginRight: '0.25rem' }}/> Manage Loans</button>
            </div>
            {(!liabilities || liabilities.length === 0) ? (
              <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--color-text-secondary)', fontSize:'0.85rem', borderRadius: '12px', border: '1px dashed var(--border)', background: 'transparent' }}>
                <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>🎉</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>No liabilities!</div>
                <div style={{ marginTop: '0.25rem' }}>You are completely debt free.</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap:'0.75rem' }}>
                {liabilities.map((l) => (
                  <div key={l.id} className="card group transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                    style={{ padding:'1rem', borderLeft:'4px solid var(--color-expense)', display:'flex', alignItems:'center', gap:'0.875rem', borderRadius: '12px', cursor: 'default' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--color-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.name}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', textTransform:'capitalize', marginTop: '0.1rem' }}>{l.type.replace('_', ' ')}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'0.95rem', color:'var(--color-expense)', whiteSpace:'nowrap' }}>{formatCurrency({ amountMinor: l.balanceMoney.amountMinor, currency: currency }, { variant: 'compact' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

