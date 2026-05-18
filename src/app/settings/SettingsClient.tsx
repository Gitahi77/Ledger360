'use client';
// src/app/settings/SettingsClient.tsx
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/lib/actions/reports';
import {
  User, Bell, Palette, ShieldCheck, Database,
  HelpCircle, Download, Trash2, ExternalLink, Info,
  Globe, CheckCircle2, Loader2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

type Section = 'profile' | 'appearance' | 'preferences' | 'notifications' | 'data' | 'help';

const SECTIONS: { id: Section; label: string; Icon: React.ElementType; desc: string }[] = [
  { id: 'profile',       label: 'Profile',       Icon: User,        desc: 'Name, email, account type'     },
  { id: 'appearance',    label: 'Appearance',     Icon: Palette,     desc: 'Theme, accent color, display'  },
  { id: 'preferences',   label: 'Preferences',    Icon: Globe,       desc: 'Currency, date format'         },
  { id: 'notifications', label: 'Notifications',  Icon: Bell,        desc: 'Alerts and reminders'          },
  { id: 'data',          label: 'Data & Privacy', Icon: ShieldCheck, desc: 'Export, import, delete'        },
  { id: 'help',          label: 'Help & About',   Icon: HelpCircle,  desc: 'Guide, shortcuts, version'     },
];

const ACCENTS = [
  { label: 'Royal Blue', value: '#1A73E8' },
  { label: 'Emerald',    value: '#1E8449' },
  { label: 'Teal',       value: '#0E6655' },
  { label: 'Purple',     value: '#6C3483' },
  { label: 'Rose',       value: '#C0392B' },
  { label: 'Amber',      value: '#D35400' },
];

/* ── Shared sub-components ──────────────────────────────────── */
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 0', borderBottom:'1px solid var(--border-light)', gap:'1.5rem' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{desc}</div>}
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
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding:'0.375rem 0.625rem', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-card)', color:'var(--text-primary)', fontSize:'0.8rem', fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
      {children}
    </select>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:'1px solid var(--border)' }}>
      <h2 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:'1rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'0.25rem' }}>{title}</h2>
      <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{subtitle}</p>
    </div>
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

/* ── Main Settings Client ───────────────────────────────────── */
export function SettingsClient({
  initialName, initialEmail, initialCurrency, initialAccountType,
}: {
  initialName: string; initialEmail: string; initialCurrency: string; initialAccountType: string;
}) {
  const router       = useRouter();
  const [, startT]   = useTransition();
  const [active, setActive]     = useState<Section>('profile');
  const [saved,  setSaved]      = useState(false);
  const [saving, setSaving]     = useState(false);

  // Profile fields
  const [name,        setName]        = useState(initialName);
  const [currency,    setCurrency]    = useState(initialCurrency);
  const [accountType, setAccountType] = useState(initialAccountType);

  // Preferences
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

  // Initials for avatar
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

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
    <div style={{ display:'grid', gridTemplateColumns:'210px 1fr', gap:'1.5rem', maxWidth:920 }}>

      {/* Left nav */}
      <div style={{ alignSelf:'start' }}>
        <div className="card" style={{ padding:'0.5rem' }}>
          {SECTIONS.map(s => {
            const Icon = s.Icon;
            const isActive = active === s.id;
            return (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                display:'flex', alignItems:'center', gap:'0.625rem',
                width:'100%', padding:'0.625rem 0.75rem', borderRadius:6,
                background: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500, fontSize:'0.8125rem',
                transition:'all 0.15s', textAlign:'left', marginBottom:2,
                border:'none', cursor:'pointer',
              }}>
                <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div>{s.label}</div>
                  <div style={{ fontSize:'0.65rem', color: isActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight:400, marginTop:'0.05rem' }}>{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="card animate-in" key={active}>

        {/* ── Profile ─────────────────────────────────────────── */}
        {active === 'profile' && (<>
          <SectionTitle title="Profile" subtitle="Your personal information and account details" />

          <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem', background:'var(--bg-app)', borderRadius:8, marginBottom:'1.5rem' }}>
            <div style={{ width:54, height:54, borderRadius:'50%', background:'linear-gradient(135deg,#2B7DE9,#1A6FD4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'1.25rem', flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{name || '—'}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{initialEmail} · {accountType}</div>
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
        </>)}

        {/* ── Appearance ──────────────────────────────────────── */}
        {active === 'appearance' && (<>
          <SectionTitle title="Appearance" subtitle="Customize how Ledger360 looks for you" />
          <Row label="Theme" desc="Toggle between light and dark mode">
            <ThemeToggle />
          </Row>
          <div style={{ padding:'1rem 0', borderBottom:'1px solid var(--border-light)' }}>
            <div style={{ fontSize:'0.8125rem', fontWeight:600, marginBottom:'0.2rem' }}>Accent Color</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'0.875rem' }}>Choose your brand accent color</div>
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
        </>)}

        {/* ── Preferences ─────────────────────────────────────── */}
        {active === 'preferences' && (<>
          <SectionTitle title="Preferences" subtitle="Adjust how the app handles your financial data" />
          <form onSubmit={handleSavePrefs}>
            <Row label="Currency" desc="Primary currency for all calculations">
              <SettingSelect value={currency} onChange={setCurrency}>
                <option value="KES">KES</option><option value="USD">USD</option>
                <option value="EUR">EUR</option><option value="GBP">GBP</option>
                <option value="UGX">UGX</option><option value="TZS">TZS</option>
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
        </>)}

        {/* ── Notifications ────────────────────────────────────── */}
        {active === 'notifications' && (<>
          <SectionTitle title="Notifications" subtitle="Control which alerts and reminders you receive" />
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
          <div style={{ marginTop:'1.25rem', padding:'0.875rem 1rem', background:'var(--bg-app)', borderRadius:8, display:'flex', gap:'0.625rem' }}>
            <Info size={14} color="var(--text-muted)" style={{ flexShrink:0, marginTop:1 }} />
            <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>Notifications are in-app only. Email and push notifications will be available in a future update.</p>
          </div>
        </>)}

        {/* ── Data & Privacy ───────────────────────────────────── */}
        {active === 'data' && (<>
          <SectionTitle title="Data & Privacy" subtitle="Manage your financial data and account security" />
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.5rem' }}>
            {[
              { label:'Export All Transactions', desc:'Download as CSV',              Icon: Download },
              { label:'Export Reports',           desc:'Download monthly summary PDF', Icon: Download },
              { label:'Import Bank Statement',    desc:'Upload M-Pesa or bank CSV',   Icon: Database },
            ].map(a => (
              <div key={a.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', background:'var(--bg-app)', borderRadius:8 }}>
                <div>
                  <div style={{ fontSize:'0.8125rem', fontWeight:600 }}>{a.label}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <button className="btn btn-outline" style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem' }}>
                  <a.Icon size={12}/> Go
                </button>
              </div>
            ))}
          </div>
          <div style={{ padding:'1rem', background:'var(--danger-light)', borderRadius:8, border:'1px solid rgba(192,57,43,0.2)' }}>
            <div style={{ fontSize:'0.8125rem', fontWeight:700, color:'var(--danger)', marginBottom:'0.35rem' }}>Danger Zone</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginBottom:'0.875rem' }}>
              Deleting your data is permanent and cannot be undone. Please export your data first.
            </div>
            <button className="btn" style={{ background:'var(--danger-grad)', color:'white', display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem' }}>
              <Trash2 size={12}/> Delete All Data
            </button>
          </div>
        </>)}

        {/* ── Help & About ─────────────────────────────────────── */}
        {active === 'help' && (<>
          <SectionTitle title="Help & About" subtitle="Learn how to use Ledger360 and find support" />
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem' }}>
            {[
              { title:'Getting Started Guide',    desc:'Step-by-step intro to tracking your finances'   },
              { title:'How Budgets Work',          desc:'Set monthly spending limits per category'       },
              { title:'Snowball vs Avalanche',     desc:'Choosing the right debt payoff strategy'        },
              { title:'Smart Upload / AI Import',  desc:'Auto-import your bank statement with AI'        },
              { title:'Understanding Net Worth',   desc:'How assets, liabilities, and NW are calculated' },
              { title:'Keyboard Shortcuts',        desc:'Navigate Ledger360 faster with shortcuts'       },
            ].map(h => (
              <div key={h.title} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0.875rem', background:'var(--bg-app)', borderRadius:7, cursor:'pointer' }}>
                <div>
                  <div style={{ fontSize:'0.8125rem', fontWeight:600 }}>{h.title}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{h.desc}</div>
                </div>
                <ExternalLink size={13} color="var(--text-muted)" />
              </div>
            ))}
          </div>
          <div style={{ padding:'1rem', background:'var(--bg-app)', borderRadius:8 }}>
            {[
              { label:'App Version', val:'Ledger360 v1.0.0' },
              { label:'Plan',        val:'Free (Individual)' },
              { label:'Stack',       val:'Next.js 16 · Prisma 7 · Neon' },
            ].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.375rem' }}>
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontSize:'0.72rem', fontWeight:600, fontFamily:'Space Grotesk,sans-serif' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </>)}

      </div>
    </div>
  );
}
