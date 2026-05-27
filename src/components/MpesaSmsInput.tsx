'use client';
// src/components/MpesaSmsInput.tsx
// Paste M-Pesa SMS messages → Gemini parses → shows transactions for import
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState } from 'react';
import { Smartphone, Loader2, CheckCircle2, AlertCircle, ChevronRight, X } from 'lucide-react';

interface ParsedTx {
  name: string; date: string; amount: number;
  type: 'income' | 'expense'; category: string; fee?: number; ref?: string;
}

interface Props {
  onImport: (txs: ParsedTx[]) => void;
}

const EXAMPLE_SMS = `FG7K2X8L Confirmed. KES1,500 sent to JOHN KAMAU 0722XXXXXX on 27/5/25 at 3:14 PM. New M-PESA balance is KES 8,432. Transaction cost KES 27.

QK3P9XY2 Confirmed. You have received KES5,000 from JANE WANJIKU 0733XXXXXX on 27/5/25 at 9:02 AM. New M-PESA balance is KES 13,432.

RN5M4HJ1 Confirmed. KES2,000 paid to KPLC(paybill number 888880) on 26/5/25 at 7:45 PM. New M-PESA balance is KES 11,432. Transaction cost KES 33.`;

export function MpesaSmsInput({ onImport }: Props) {
  const [sms,       setSms]       = useState('');
  const [state,     setState]     = useState<'idle' | 'parsing' | 'review' | 'error'>('idle');
  const [parsed,    setParsed]    = useState<ParsedTx[]>([]);
  const [selected,  setSelected]  = useState<Set<number>>(new Set());
  const [errMsg,    setErrMsg]    = useState('');

  async function handleParse() {
    if (!sms.trim()) return;
    setState('parsing');
    try {
      const res = await fetch('/api/sms-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Parse failed');
      if (!data.transactions?.length) throw new Error('No transactions found in that SMS text');
      setParsed(data.transactions);
      setSelected(new Set(data.transactions.map((_: any, i: number) => i)));
      setState('review');
    } catch (e: any) {
      setErrMsg(e.message);
      setState('error');
    }
  }

  function handleImport() {
    const toImport = parsed.filter((_, i) => selected.has(i));
    onImport(toImport);
    setSms(''); setParsed([]); setSelected(new Set()); setState('idle');
  }

  function toggleRow(i: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  if (state === 'parsing') return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <Loader2 size={36} color="var(--primary)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        Gemini AI is reading your SMS…
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Extracting and categorising M-Pesa transactions</p>
    </div>
  );

  if (state === 'review') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {parsed.length} transaction{parsed.length !== 1 ? 's' : ''} found
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            ✨ Parsed by Gemini AI · {selected.size} selected for import
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setState('idle')} className="btn btn-outline">Back</button>
          <button onClick={handleImport} disabled={selected.size === 0} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            Import {selected.size} <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
        <table className="data-table" style={{ fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox"
                  checked={selected.size === parsed.length}
                  onChange={e => setSelected(e.target.checked ? new Set(parsed.map((_, i) => i)) : new Set())} />
              </th>
              <th>Description</th>
              <th>Date</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map((t, i) => (
              <tr key={i} onClick={() => toggleRow(i)} style={{ cursor: 'pointer', opacity: selected.has(i) ? 1 : 0.45 }}>
                <td><input type="checkbox" checked={selected.has(i)} onChange={() => toggleRow(i)} onClick={e => e.stopPropagation()} /></td>
                <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</td>
                <td>{t.date}</td>
                <td>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                    {t.category}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                  {t.type === 'income' ? '+' : '−'}KES {t.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      {state === 'error' && (
        <div style={{ marginBottom: '0.875rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--danger-light)', border: '1px solid rgba(220,38,38,0.2)', fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={14} /> {errMsg}
          <button onClick={() => setState('idle')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={14} /></button>
        </div>
      )}

      {/* Icon + heading */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #00C853, #009624)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', boxShadow: '0 4px 16px rgba(0,200,83,0.3)' }}>
          <Smartphone size={24} color="white" />
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Paste M-Pesa SMS Messages
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 340 }}>
          Copy your M-Pesa confirmation SMS messages and paste them all below.
          Gemini AI will extract every transaction automatically.
        </p>
      </div>

      <textarea
        value={sms}
        onChange={e => setSms(e.target.value)}
        placeholder={`Paste your M-Pesa SMS messages here…\n\nExample:\n${EXAMPLE_SMS}`}
        style={{
          width: '100%', minHeight: 180, padding: '0.75rem', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg-app)',
          color: 'var(--text-primary)', fontSize: '0.78rem', fontFamily: 'inherit',
          resize: 'vertical', outline: 'none', lineHeight: 1.6,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          💡 Works with Send Money, Paybill, Buy Goods, Receive, Withdraw, Fuliza
        </span>
        <button
          onClick={handleParse}
          disabled={!sms.trim()}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <CheckCircle2 size={14} /> Parse with AI
        </button>
      </div>
    </div>
  );
}
