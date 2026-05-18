'use client';
import { useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, ChevronRight, X } from 'lucide-react';
import { importTransactions } from '@/lib/actions/transactions';

type ParsedRow = {
  date: string; name: string; amount: number; type: string;
  category: string; categoryId: string; note?: string;
};

type UploadState = 'idle' | 'uploading' | 'reviewing' | 'importing' | 'done' | 'error';

export function SmartUpload({ onDone }: { onDone?: () => void }) {
  const [state,     setState]    = useState<UploadState>('idle');
  const [progress,  setProgress] = useState(0);
  const [rows,      setRows]     = useState<ParsedRow[]>([]);
  const [selected,  setSelected] = useState<Set<number>>(new Set());
  const [method,    setMethod]   = useState<'ai' | 'csv'>('csv');
  const [errMsg,    setErrMsg]   = useState('');
  const [isDragging,setDragging] = useState(false);

  /* ── Upload & parse ─────────────────────────────────────── */
  async function processFile(file: File) {
    setState('uploading');
    setProgress(0);

    // Animate progress while waiting for AI
    const tick = setInterval(() => setProgress(p => Math.min(p + 8, 88)), 350);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res  = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      clearInterval(tick);
      setProgress(100);

      if (!res.ok || !data.success) {
        setErrMsg(data.error ?? 'Upload failed.');
        setState('error');
        return;
      }

      setTimeout(() => {
        setRows(data.transactions);
        setSelected(new Set(data.transactions.map((_: any, i: number) => i)));
        setMethod(data.method);
        setState('reviewing');
      }, 400);
    } catch {
      clearInterval(tick);
      setErrMsg('Network error — please try again.');
      setState('error');
    }
  }

  /* ── Confirm import ──────────────────────────────────────── */
  async function confirmImport() {
    setState('importing');
    const toImport = rows.filter((_, i) => selected.has(i));
    try {
      await importTransactions(toImport.map(r => ({
        name: r.name, amount: r.amount, type: r.type,
        categoryName: r.category, date: r.date, note: r.note,
      })));
      setState('done');
      setTimeout(() => { onDone?.(); }, 1500);
    } catch (e: any) {
      setErrMsg(e.message ?? 'Import failed.');
      setState('error');
    }
  }

  function toggleRow(i: number) {
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  /* ── Idle / drop zone ─────────────────────────────────────── */
  if (state === 'idle' || state === 'error') return (
    <div>
      {state === 'error' && (
        <div style={{ marginBottom: '0.875rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--danger-light)', border: '1px solid rgba(220,38,38,0.2)', fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={14} /> {errMsg}
          <button onClick={() => setState('idle')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><X size={14} /></button>
        </div>
      )}
      <div
        onDragEnter={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={e => { e.preventDefault(); setDragging(false); }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        onClick={() => document.getElementById('smart-upload-input')?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 12, padding: '2.5rem 2rem', textAlign: 'center', cursor: 'pointer',
          background: isDragging ? 'var(--primary-light)' : 'var(--bg-app)',
          transition: 'all 0.15s',
        }}
      >
        <input id="smart-upload-input" type="file" accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        <UploadCloud size={40} color="var(--primary)" style={{ margin: '0 auto 0.875rem' }} />
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>AI Smart Upload</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Drop your bank statement here — PDF, CSV, Excel or screenshot.<br />
          AI will auto-detect and categorise every transaction.
        </p>
        <button className="btn btn-primary" style={{ pointerEvents: 'none' }}>Browse Files</button>
      </div>
    </div>
  );

  /* ── Uploading ───────────────────────────────────────────── */
  if (state === 'uploading') return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <Loader2 size={40} color="var(--primary)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        AI is reading your statement…
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Extracting and categorising transactions</p>
      <div style={{ maxWidth: 260, margin: '0 auto' }}>
        <div className="progress-track" style={{ height: 6 }}>
          <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--primary-grad)', boxShadow: '0 0 10px rgba(0,112,243,0.45)', transition: 'width 0.35s ease' }} />
        </div>
        <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>{progress}%</div>
      </div>
    </div>
  );

  /* ── Review ──────────────────────────────────────────────── */
  if (state === 'reviewing') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            {rows.length} transactions found
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {method === 'ai' ? '✨ Parsed by GPT-4o Vision' : '📄 Parsed from CSV'}
            {' · '}{selected.size} selected for import
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setState('idle')} className="btn btn-outline">Cancel</button>
          <button onClick={confirmImport} disabled={selected.size === 0} className="btn btn-primary">
            Import {selected.size} transactions <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
        <table className="data-table" style={{ fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={selected.size === rows.length}
                  onChange={e => setSelected(e.target.checked ? new Set(rows.map((_, i) => i)) : new Set())} />
              </th>
              <th>Description</th>
              <th>Date</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} onClick={() => toggleRow(i)} style={{ cursor: 'pointer', opacity: selected.has(i) ? 1 : 0.45 }}>
                <td><input type="checkbox" checked={selected.has(i)} onChange={() => toggleRow(i)} onClick={e => e.stopPropagation()} /></td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</td>
                <td>{r.date}</td>
                <td>
                  <input
                    type="text"
                    value={r.category}
                    onChange={(e) => {
                      const newRows = [...rows];
                      newRows[i].category = e.target.value;
                      setRows(newRows);
                    }}
                    style={{
                      background: 'transparent', border: '1px solid var(--border)', borderRadius: 4,
                      padding: '2px 6px', fontSize: '0.72rem', width: 110, color: 'var(--text-primary)'
                    }}
                  />
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: r.type === 'income' ? 'var(--success)' : 'var(--text-primary)' }}>
                  {r.type === 'income' ? '+' : '−'}KES {r.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Importing ───────────────────────────────────────────── */
  if (state === 'importing') return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <Loader2 size={32} color="var(--primary)" style={{ margin: '0 auto 0.875rem', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Saving to your account…</div>
    </div>
  );

  /* ── Done ─────────────────────────────────────────────────── */
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <CheckCircle2 size={40} color="var(--success)" style={{ margin: '0 auto 0.875rem' }} />
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--success)', marginBottom: '0.3rem' }}>Import complete!</div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Your transactions have been saved.</p>
    </div>
  );
}
