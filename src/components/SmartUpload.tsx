'use client';
import { useState, useEffect } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertCircle, ChevronRight, X, Smartphone, FileText } from 'lucide-react';
import { importTransactions } from '@/lib/actions/transactions';
import { getAccounts } from '@/lib/actions/accounts';
import { MpesaSmsInput } from '@/components/MpesaSmsInput';
import { toMinor } from '@/lib/money';

type ParsedRow = {
  date: string; name: string; amount: number; type: string;
  category: string; categoryId: string; note?: string;
  reference?: string; importHash?: string;
  isDuplicate?: boolean; isTransfer?: boolean;
};

type UploadState = 'idle' | 'uploading' | 'reviewing' | 'importing' | 'done' | 'error';
type Tab = 'file' | 'sms';

export function SmartUpload({ onDone }: { onDone?: () => void }) {
  const [state,     setState]    = useState<UploadState>('idle');
  const [tab,       setTab]      = useState<Tab>('file');
  const [progress,  setProgress] = useState(0);
  const [rows,      setRows]     = useState<ParsedRow[]>([]);
  const [selected,  setSelected] = useState<Set<number>>(new Set());
  const [method,    setMethod]   = useState<'ai' | 'csv'>('csv');
  const [errMsg,    setErrMsg]   = useState('');
  const [isDragging,setDragging] = useState(false);
  const [aiConsent, setAiConsent]= useState(false);
  const [accounts,  setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId]= useState<string>('');

  useEffect(() => {
    getAccounts().then(accs => {
      setAccounts(accs);
      if (accs.length > 0) setAccountId(accs[0].id);
    }).catch(console.error);
  }, []);

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
        setSelected(new Set(data.transactions.map((r: any, i: number) => 
          (r.isDuplicate || r.isTransfer) ? -1 : i
        ).filter((i: number) => i !== -1)));
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
    const toImport = rows.filter((r, i) => selected.has(i) && !r.isTransfer);
    try {
      await importTransactions(toImport.map(r => ({
        name: r.name, baseAmountMinor: toMinor(r.amount), type: r.type,
        categoryName: r.category, date: r.date, note: r.note,
        importHash: r.importHash, reference: r.reference
      })), accountId);
      setState('done');
      setTimeout(() => { onDone?.(); }, 1500);
    } catch (e: any) {
      setErrMsg(e.message ?? 'Import failed.');
      setState('error');
    }
  }

  function toggleRow(i: number) {
    if (rows[i].isTransfer) return; // Cannot import transfers
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  /* ── SMS import handler ──────────────────────────────────── */
  async function handleSmsImport(txs: Array<{ name: string; date: string; amount: number; type: 'income' | 'expense'; category: string; fee?: number }>) {
    if (!accountId) {
      setErrMsg('Please select an account first.');
      setState('error');
      return;
    }
    setState('importing');
    try {
      const toImport = txs.map(t => ({
        name: t.name, date: t.date, amount: t.amount,
        type: t.type as 'income' | 'expense',
        category: t.category, categoryId: '', note: '',
        categoryName: t.category,
      }));
      await importTransactions(toImport.map(r => ({
        name: r.name, baseAmountMinor: toMinor(r.amount), type: r.type,
        date: r.date, categoryName: r.categoryName, note: r.note,
      })), accountId);
      setState('done');
      setTimeout(() => { onDone?.(); }, 1500);
    } catch (e: any) {
      setErrMsg(e.message ?? 'Import failed.');
      setState('error');
    }
  }

  /* ── Idle / drop zone ─────────────────────────────────────── */
  if (state === 'idle' || state === 'error') return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-app)' }}>
        {([
          { key: 'file', label: 'File Upload',     icon: <FileText size={13} /> },
          { key: 'sms',  label: 'M-Pesa SMS',      icon: <Smartphone size={13} /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
              padding: '0.6rem 0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
              background: tab === t.key ? 'var(--color-brand)' : 'transparent',
              color:      tab === t.key ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {state === 'error' && (
        <div style={{ marginBottom: '0.875rem', padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--color-expense-light)', border: '1px solid rgba(220,38,38,0.2)', fontSize: '0.8rem', color: 'var(--color-expense)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={14} /> {errMsg}
          <button onClick={() => setState('idle')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-expense)' }}><X size={14} /></button>
        </div>
      )}

      {/* Account Selector */}
      <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>Import into Account</label>
        <select
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="input-base"
          style={{ width: '100%' }}
        >
          <option value="" disabled>Select an account...</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
          ))}
        </select>
      </div>

      {/* File upload tab */}
      {tab === 'file' && (
        <div
          onDragEnter={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={e => { e.preventDefault(); setDragging(false); }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            if (!accountId) { setErrMsg('Please select an account first.'); setState('error'); return; }
            if (!aiConsent) { setErrMsg('Please consent to AI processing before uploading.'); setState('error'); return; }
            const f = e.dataTransfer.files[0];
            if (f) processFile(f);
          }}
          onClick={() => {
            if (!accountId) { setErrMsg('Please select an account first.'); setState('error'); return; }
            if (!aiConsent) { setErrMsg('Please consent to AI processing before uploading.'); setState('error'); return; }
            document.getElementById('smart-upload-input')?.click();
          }}
          style={{
            border: `2px dashed ${isDragging ? 'var(--color-brand)' : 'var(--border)'}`,
            borderRadius: 12, padding: '2.5rem 2rem', textAlign: 'center', cursor: 'pointer',
            background: isDragging ? 'var(--color-brand-light)' : 'var(--bg-app)',
            transition: 'all 0.15s',
          }}
        >
          <input id="smart-upload-input" type="file" accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
          <UploadCloud size={40} color="var(--color-brand)" style={{ margin: '0 auto 0.875rem' }} />
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.3rem' }}>AI Smart Upload</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Drop your bank statement here — PDF, CSV, Excel or screenshot.<br />
            Gemini AI will auto-detect and categorise every transaction.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
            <a
              href="/Ledger360_Template.xlsx"
              download
              className="btn btn-outline"
              style={{ textDecoration: 'none' }}
              onClick={e => e.stopPropagation()}
            >
              Download Template
            </a>
            <button className="btn btn-primary" style={{ pointerEvents: 'none' }}>Browse Files</button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer', textAlign: 'left', maxWidth: 400, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={aiConsent} onChange={e => setAiConsent(e.target.checked)} />
            <span>I consent to having my document securely parsed by Google Gemini AI. Note: PDFs and images are sent in full (no redaction). Data is NOT used to train models.</span>
          </label>
        </div>
      )}

      {/* M-Pesa SMS tab */}
      {tab === 'sms' && (
        <MpesaSmsInput onImport={handleSmsImport} />
      )}
    </div>
  );


  /* ── Uploading ───────────────────────────────────────────── */
  if (state === 'uploading') return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <Loader2 size={40} color="var(--color-brand)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
        AI is reading your statement…
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Extracting and categorising transactions</p>
      <div style={{ maxWidth: 260, margin: '0 auto' }}>
        <div className="progress-track" style={{ height: 6 }}>
          <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--color-brand-grad)', boxShadow: '0 0 10px rgba(0,112,243,0.45)', transition: 'width 0.35s ease' }} />
        </div>
        <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{progress}%</div>
      </div>
    </div>
  );

  /* ── Review ──────────────────────────────────────────────── */
  if (state === 'reviewing') return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
            {rows.length} transactions found
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
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
            {rows.map((r, i) => {
              const rowStyle = r.isTransfer 
                ? { opacity: 0.5, background: 'var(--surface-card-hover)', cursor: 'not-allowed' }
                : { cursor: 'pointer', opacity: selected.has(i) ? 1 : 0.5, background: r.isDuplicate ? 'var(--color-expense-light)' : 'transparent' };
              
              return (
                <tr key={i} onClick={() => toggleRow(i)} style={rowStyle}>
                  <td>
                    <input type="checkbox" checked={selected.has(i)} disabled={r.isTransfer} onChange={() => toggleRow(i)} onClick={e => e.stopPropagation()} />
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    {r.reference && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>Ref: {r.reference}</div>}
                    {r.isDuplicate && <div style={{ fontSize: '0.65rem', color: 'var(--color-expense)', fontWeight: 600 }}>Duplicate Warning</div>}
                    {r.isTransfer && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>Suggested Transfer (Skipped)</div>}
                  </td>
                  <td>{r.date}</td>
                  <td>
                    <input
                      type="text"
                      value={r.category}
                      disabled={r.isTransfer}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[i].category = e.target.value;
                        setRows(newRows);
                      }}
                      style={{
                        background: 'transparent', border: '1px solid var(--border)', borderRadius: 4,
                        padding: '2px 6px', fontSize: '0.72rem', width: 110, color: 'var(--color-text-primary)'
                      }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, color: r.type === 'income' ? 'var(--color-income)' : (r.isTransfer ? 'var(--color-brand)' : 'var(--color-text-primary)') }}>
                    {r.type === 'income' ? '+' : '-'}KES {r.amount.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Importing ───────────────────────────────────────────── */
  if (state === 'importing') return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <Loader2 size={32} color="var(--color-brand)" style={{ margin: '0 auto 0.875rem', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Saving to your account…</div>
    </div>
  );

  /* ── Done ─────────────────────────────────────────────────── */
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <CheckCircle2 size={40} color="var(--color-income)" style={{ margin: '0 auto 0.875rem' }} />
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-income)', marginBottom: '0.3rem' }}>Import complete!</div>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Your transactions have been saved.</p>
    </div>
  );
}
