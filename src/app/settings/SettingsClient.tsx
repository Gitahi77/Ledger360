'use client';
// src/app/settings/SettingsClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/actions/reports';
import {
  User, Bell, Palette, ShieldCheck, Database,
  HelpCircle, Download, Trash2, ExternalLink, Info,
  Globe, CheckCircle2, Loader2, ChevronDown, ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

type Section = 'profile' | 'appearance' | 'preferences' | 'notifications' | 'data' | 'help';

const SECTIONS: { id: Section; label: string; Icon: React.ElementType; desc: string }[] = [
  { id: 'profile',       label: 'Profile',        Icon: User,        desc: 'Name, email, account type'     },
  { id: 'appearance',    label: 'Appearance',      Icon: Palette,     desc: 'Theme, accent color, display'  },
  { id: 'preferences',   label: 'Preferences',     Icon: Globe,       desc: 'Currency, date format'         },
  { id: 'notifications', label: 'Notifications',   Icon: Bell,        desc: 'Alerts and reminders'          },
  { id: 'data',          label: 'Data & Privacy',  Icon: ShieldCheck, desc: 'Export, import, delete'        },
  { id: 'help',          label: 'Help & About',    Icon: HelpCircle,  desc: 'Guide, shortcuts, version'     },
];

const ACCENTS = [
  { label: 'Royal Blue', value: '#1A73E8' },
  { label: 'Emerald',    value: '#1E8449' },
  { label: 'Teal',       value: '#0E6655' },
  { label: 'Purple',     value: '#6C3483' },
  { label: 'Rose',       value: '#C0392B' },
  { label: 'Amber',      value: '#D35400' },
];

/* ── Shared sub-components ────────────────────────────────── */
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 0', borderBottom:'1px solid var(--border-light)', gap:'1rem', flexWrap:'wrap' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>{desc}</div>}
      </div>
      <div style={{ flexShrink:0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ width:42, height:24, borderRadius:999, border:'none', cursor:'pointer', background: checked ? 'linear-gradient(90deg,#27AE60,#1E8449)' : 'var(--border)', position:'relative', transition:'background 0.2s', boxShadow: checked ? '0 2px 6px rgba(39,174,96,0.35)' : 'inset 0 1px 3px rgba(0,0,0,0.15)' }}>
      <div style={{ position:'absolute', top:3, left: checked ? 21 : 3, width:18, height:18, borderRadius:'50%', background:'white', boxShadow:'0 1px 3px rgba(0,0,0,0.25)', transition:'left 0.2s' }} />
    </button>
  );
}

function SettingSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding:'0.375rem 0.625rem', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-primary)', fontSize:'0.8rem', fontFamily:'inherit', outline:'none', cursor:'pointer', maxWidth:'100%' }}>
      {children}
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:'1.125rem' }}>
      <label style={{ display:'block', fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.375rem' }}>{label}</label>
      {children}
    </div>
  );
}

/* ── Accordion header for each section ─────────────────────── */
function AccordionHeader({
  section, isOpen, onClick,
}: {
  section: typeof SECTIONS[number]; isOpen: boolean; onClick: () => void;
}) {
  const Icon = section.Icon;
  return (
    <button
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:'0.75rem',
        width:'100%', padding:'1rem', borderRadius: isOpen ? '0.75rem 0.75rem 0 0' : '0.75rem',
        background: isOpen ? 'var(--primary-light)' : 'var(--bg-card)',
        border:`1px solid ${isOpen ? 'var(--primary)' : 'var(--border)'}`,
        borderBottom: isOpen ? 'none' : `1px solid var(--border)`,
        color: isOpen ? 'var(--primary)' : 'var(--text-secondary)',
        textAlign:'left', cursor:'pointer',
        transition:'all 0.2s', marginBottom: isOpen ? 0 : '0.5rem',
      }}
    >
      <div style={{
        width:36, height:36, borderRadius:8, flexShrink:0,
        background: isOpen ? 'var(--primary)' : 'var(--bg-hover)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color: isOpen ? 'white' : 'var(--text-muted)',
        transition:'all 0.2s',
      }}>
        <Icon size={16} strokeWidth={isOpen ? 2.5 : 2} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:'0.875rem', color: isOpen ? 'var(--primary)' : 'var(--text-primary)' }}>{section.label}</div>
        <div style={{ fontSize:'0.7rem', color: isOpen ? 'var(--primary)' : 'var(--text-muted)', opacity:0.8, marginTop:'0.1rem' }}>{section.desc}</div>
      </div>
      {isOpen
        ? <ChevronDown size={16} style={{ flexShrink:0, color:'var(--primary)' }} />
        : <ChevronRight size={16} style={{ flexShrink:0, color:'var(--text-muted)' }} />
      }
    </button>
  );
}

/* ── Section content panel ──────────────────────────────────── */
function AccordionPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in" style={{
      border:'1px solid var(--primary)', borderTop:'none',
      borderRadius:'0 0 0.75rem 0.75rem',
      padding:'1.25rem',
      background:'var(--bg-card)',
      marginBottom:'0.5rem',
    }}>
      {children}
    </div>
  );
}

/* ── Main Settings Client ───────────────────────────────────── */
export function SettingsClient({
  initialName, initialEmail, initialCurrency, initialAccountType,
}: {
  initialName: string; initialEmail: string; initialCurrency: string; initialAccountType: string;
}) {
  const router       = useRouter();
  const [, startT]   = useTransition();
  // On mobile, nothing is open by default — tap to open. On desktop, profile opens by default.
  const [openSections, setOpenSections] = useState<Set<Section>>(new Set(['profile']));
  const [saved,  setSaved]      = useState(false);
  const [saving, setSaving]     = useState(false);

  const [name,        setName]        = useState(initialName);
  const [currency,    setCurrency]    = useState(initialCurrency);
  const [accountType, setAccountType] = useState(initialAccountType);

  const [dateFormat, setDateFmt]    = useState('DD/MM/YYYY');
  const [savingRate, setSavingRate] = useState('30');
  const [accent,     setAccent]     = useState('#1A73E8');
  const [notifs,     setNotifs]     = useState({ overbudget: true, goals: true, bills: true, insights: false, loanDue: true });

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'0.5rem 0.75rem', borderRadius:6,
    border:'1px solid var(--border)', background:'var(--bg-card)',
    color:'var(--text-primary)', fontSize:'0.8rem', fontFamily:'inherit',
    outline:'none', boxShadow:'0 1px 2px rgba(0,0,0,0.05)',
  };

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  function toggleSection(id: Section) {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false);
    await updateProfile({ name, currency, accountType });
    startT(() => router.refresh());
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false);
    await updateProfile({ name, currency, accountType });
    startT(() => router.refresh());
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>

      {/* ── Profile ─────────────────────────────────────────── */}
      <AccordionHeader section={SECTIONS[0]} isOpen={openSections.has('profile')} onClick={() => toggleSection('profile')} />
      {openSections.has('profile') && (
        <AccordionPanel>
          {/* Avatar banner */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem', background:'var(--bg-app)', borderRadius:8, marginBottom:'1.25rem' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#2B7DE9,#1A6FD4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'1.1rem', flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name || '—'}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{initialEmail} · {accountType}</div>
            </div>
          </div>
          <form onSubmit={handleSaveProfile}>
            <Field label="Full Name">
              <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
            </Field>
            <Field label="Email Address">
              <input style={{ ...inputStyle, opacity:0.7, cursor:'not-allowed' }} type="email" value={initialEmail} disabled title="Email cannot be changed" />
            </Field>
            <Field label="Account Type">
              <select style={{ ...inputStyle, cursor:'pointer' }} value={accountType} onChange={e => setAccountType(e.target.value)}>
                <option value="individual">Individual</option>
                <option value="freelancer">Freelancer</option>
                <option value="small_business">Small Business</option>
              </select>
            </Field>
            <Field label="Currency">
              <select style={{ ...inputStyle, cursor:'pointer' }} value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="UGX">UGX — Ugandan Shilling</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
              </select>
            </Field>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginTop:'0.5rem' }}>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                {saving ? <Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> : null}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && (
                <div className="animate-in" style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem', color:'var(--success)', fontWeight:600 }}>
                  <CheckCircle2 size={14}/> Saved!
                </div>
              )}
            </div>
          </form>
        </AccordionPanel>
      )}

      {/* ── Appearance ────────────────────────────────────────── */}
      <AccordionHeader section={SECTIONS[1]} isOpen={openSections.has('appearance')} onClick={() => toggleSection('appearance')} />
      {openSections.has('appearance') && (
        <AccordionPanel>
          <Row label="Theme" desc="Toggle between light and dark mode">
            <ThemeToggle />
          </Row>
          <div style={{ padding:'0.875rem 0', borderBottom:'1px solid var(--border-light)' }}>
            <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'0.2rem' }}>Accent Color</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>Choose your brand accent color</div>
            <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap' }}>
              {ACCENTS.map(a => (
                <button key={a.value} onClick={() => setAccent(a.value)} title={a.label}
                  style={{ width:28, height:28, borderRadius:'50%', background:a.value, border:'none', cursor:'pointer', outline: accent === a.value ? `3px solid ${a.value}` : '3px solid transparent', outlineOffset:2, transition:'all 0.15s', boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }} />
              ))}
            </div>
          </div>
          <Row label="Compact Mode" desc="Display more information in less space">
            <Toggle checked={false} onChange={() => {}} />
          </Row>
          <Row label="Smooth Animations" desc="Page entry and transition animations">
            <Toggle checked={true} onChange={() => {}} />
          </Row>
        </AccordionPanel>
      )}

      {/* ── Preferences ───────────────────────────────────────── */}
      <AccordionHeader section={SECTIONS[2]} isOpen={openSections.has('preferences')} onClick={() => toggleSection('preferences')} />
      {openSections.has('preferences') && (
        <AccordionPanel>
          <form onSubmit={handleSavePrefs}>
            <Row label="Currency" desc="Primary currency for all calculations">
              <SettingSelect value={currency} onChange={setCurrency}>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="UGX">UGX — Ugandan Shilling</option>
                <option value="TZS">TZS — Tanzanian Shilling</option>
              </SettingSelect>
            </Row>
            <Row label="Date Format" desc="How dates appear throughout the app">
              <SettingSelect value={dateFormat} onChange={setDateFmt}>
                <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
              </SettingSelect>
            </Row>
            <Row label="Target Saving Rate" desc="Your personal monthly savings goal">
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <input type="number" value={savingRate} min={5} max={80} onChange={e => setSavingRate(e.target.value)}
                  style={{ width:60, padding:'0.375rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-primary)', fontSize:'0.8rem', textAlign:'center', fontFamily:'Space Grotesk,sans-serif', fontWeight:700 }} />
                <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>% of income</span>
              </div>
            </Row>
            <Row label="Week Start Day" desc="First day shown in calendar views">
              <SettingSelect value="Monday" onChange={() => {}}>
                <option>Monday</option><option>Sunday</option>
              </SettingSelect>
            </Row>
            <div style={{ marginTop:'1.25rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Saving…</> : 'Save Preferences'}
              </button>
              {saved && <div className="animate-in" style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem', color:'var(--success)', fontWeight:600 }}><CheckCircle2 size={14}/> Saved!</div>}
            </div>
          </form>
        </AccordionPanel>
      )}

      {/* ── Notifications ──────────────────────────────────────── */}
      <AccordionHeader section={SECTIONS[3]} isOpen={openSections.has('notifications')} onClick={() => toggleSection('notifications')} />
      {openSections.has('notifications') && (
        <AccordionPanel>
          <Row label="Overbudget Alerts" desc="Notify when spending exceeds its limit">
            <Toggle checked={notifs.overbudget} onChange={() => setNotifs(n => ({ ...n, overbudget: !n.overbudget }))} />
          </Row>
          <Row label="Goal Progress Updates" desc="Weekly updates on savings milestones">
            <Toggle checked={notifs.goals} onChange={() => setNotifs(n => ({ ...n, goals: !n.goals }))} />
          </Row>
          <Row label="Upcoming Loan Payments" desc="3-day reminder before each due date">
            <Toggle checked={notifs.loanDue} onChange={() => setNotifs(n => ({ ...n, loanDue: !n.loanDue }))} />
          </Row>
          <Row label="Upcoming Bills" desc="Remind me when regular bills are due">
            <Toggle checked={notifs.bills} onChange={() => setNotifs(n => ({ ...n, bills: !n.bills }))} />
          </Row>
          <Row label="Monthly Financial Summary" desc="End-of-month report on income and spending">
            <Toggle checked={notifs.insights} onChange={() => setNotifs(n => ({ ...n, insights: !n.insights }))} />
          </Row>
          <div style={{ marginTop:'1rem', padding:'0.75rem', background:'var(--bg-app)', borderRadius:8, display:'flex', gap:'0.5rem' }}>
            <Info size={14} color="var(--text-muted)" style={{ flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>Notifications are in-app only. Email and push notifications coming soon.</p>
          </div>
        </AccordionPanel>
      )}

      {/* ── Data & Privacy ─────────────────────────────────────── */}
      <AccordionHeader section={SECTIONS[4]} isOpen={openSections.has('data')} onClick={() => toggleSection('data')} />
      {openSections.has('data') && (
        <AccordionPanel>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.25rem' }}>
            {[
              { label:'Export All Transactions', desc:'Download as CSV',              Icon: Download },
              { label:'Export Reports',           desc:'Download monthly summary PDF', Icon: Download },
              { label:'Import Bank Statement',    desc:'Upload M-Pesa or bank CSV',   Icon: Database },
            ].map(a => (
              <div key={a.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', background:'var(--bg-app)', borderRadius:8, gap:'0.75rem' }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <button className="btn btn-outline" style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', flexShrink:0 }}>
                  <a.Icon size={12}/> Go
                </button>
              </div>
            ))}
          </div>
          <div style={{ padding:'1rem', background:'var(--danger-light)', borderRadius:8, border:'1px solid rgba(192,57,43,0.15)' }}>
            <div style={{ fontSize:'0.8125rem', fontWeight:700, color:'var(--danger)', marginBottom:'0.35rem' }}>Danger Zone</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginBottom:'0.875rem' }}>
              Deleting your data is permanent and cannot be undone. Please export your data first.
            </div>
            <button className="btn" style={{ background:'var(--danger-grad)', color:'white', display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem' }}>
              <Trash2 size={12}/> Delete All Data
            </button>
          </div>
        </AccordionPanel>
      )}

      {/* ── Help & About ────────────────────────────────────────── */}
      <AccordionHeader section={SECTIONS[5]} isOpen={openSections.has('help')} onClick={() => toggleSection('help')} />
      {openSections.has('help') && (
        <AccordionPanel>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem', marginBottom:'1.25rem' }}>
            {[
              { title:'Getting Started Guide',    desc:'Step-by-step intro to tracking your finances'   },
              { title:'How Budgets Work',          desc:'Set monthly spending limits per category'       },
              { title:'Snowball vs Avalanche',     desc:'Choosing the right debt payoff strategy'        },
              { title:'Smart Upload / AI Import',  desc:'Auto-import your bank statement with AI'        },
              { title:'Understanding Net Worth',   desc:'How assets, liabilities, and NW are calculated' },
              { title:'Keyboard Shortcuts',        desc:'Navigate Ledger360 faster with shortcuts'       },
            ].map(h => (
              <div key={h.title} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0.875rem', background:'var(--bg-app)', borderRadius:7, cursor:'pointer', gap:'0.5rem' }}>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--text-primary)' }}>{h.title}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.1rem' }}>{h.desc}</div>
                </div>
                <ExternalLink size={13} color="var(--text-muted)" style={{ flexShrink:0 }} />
              </div>
            ))}
          </div>
          <div style={{ padding:'0.875rem 1rem', background:'var(--bg-app)', borderRadius:8 }}>
            {[
              { label:'App Version', val:'Ledger360 v1.0.0' },
              { label:'Plan',        val:'Free (Individual)' },
              { label:'Stack',       val:'Next.js 16 · Prisma 7 · Neon' },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.375rem' }}>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontSize:'0.72rem', fontWeight:600, fontFamily:'Space Grotesk,sans-serif', color:'var(--text-primary)' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </AccordionPanel>
      )}

    </div>
  );
}
