import re

with open('src/app/settings/SettingsClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Toggle component
old_toggle = """function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        width: 64, height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0.75rem',
      }}
    >
      <div style={{
        width: 42, height: 24, borderRadius: 999,
        background: checked ? 'var(--color-brand)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
      </div>
    </button>
  );
}"""

new_toggle = """function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        minWidth: 64, minHeight: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        background: 'transparent', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0.5rem',
        margin: '-0.5rem'
      }}
    >
      <div style={{
        width: 42, height: 24, borderRadius: 999,
        background: checked ? 'var(--color-brand)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
      </div>
    </button>
  );
}"""

content = content.replace(old_toggle, new_toggle)

new_body = """  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <button className={`settings-sidebar-btn ${['profile', 'appearance'].includes(openSection || '') ? 'active' : ''}`} onClick={() => setOpenSection('profile')}>
          <User size={16} /> Profile
        </button>
        <button className={`settings-sidebar-btn ${['preferences', 'savings', 'notifications'].includes(openSection || '') ? 'active' : ''}`} onClick={() => setOpenSection('preferences')}>
          <Globe size={16} /> Preferences
        </button>
        <button className={`settings-sidebar-btn ${['security'].includes(openSection || '') ? 'active' : ''}`} onClick={() => setOpenSection('security')}>
          <ShieldCheck size={16} /> Account Management
        </button>
        <button className={`settings-sidebar-btn ${['data', 'help'].includes(openSection || '') ? 'active' : ''}`} onClick={() => setOpenSection('data')}>
          <Database size={16} /> Data & Privacy
        </button>
      </div>

      <div className="settings-content animate-in">
        {(openSection === 'profile' || openSection === 'appearance') && (
          <>
            <div className="settings-card">
              <h2 className="settings-card-title">Profile</h2>
              <p className="settings-card-desc">Manage your personal information</p>
              <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', padding:'0.875rem', background:'var(--bg-app)', borderRadius:8, marginBottom:'1.25rem' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,rgb(43, 125, 233),rgb(26, 111, 212))', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:'1.1rem', flexShrink:0 }}>
                  {initials}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--color-text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name || '—'}</div>
                  <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', marginTop:'0.1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{initialEmail} · {accountType}</div>
                </div>
              </div>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="Full Name">
                  <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" autoComplete="name" />
                </Field>
                <Field label="Email Address">
                  <input style={{ ...inputStyle, opacity:0.7, cursor:'not-allowed' }} type="email" value={initialEmail} disabled title="Email cannot be changed" autoComplete="email" />
                </Field>
                <Field label="Account Type">
                  <select style={{ ...inputStyle, cursor:'pointer' }} value={accountType} onChange={e => setAccountType(e.target.value)}>
                    <option value="individual">Individual</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="small_business">Small Business</option>
                  </select>
                </Field>
                <Field label="Currency">
                  <input style={{ ...inputStyle, opacity:0.7, cursor:'not-allowed' }} type="text" value="KES" disabled title="Base currency is locked to KES for now" />
                </Field>
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <SaveRow saving={profileState.saving} saved={profileState.saved} error={profileState.error} />
                </div>
              </form>
            </div>
            
            <div className="settings-card mt-6">
              <h2 className="settings-card-title">Appearance</h2>
              <p className="settings-card-desc">Customize how Ledger360 looks</p>
              <form onSubmit={handleSaveAppearance} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Row label="Theme" desc="Toggle between light and dark mode">
                  <ThemeToggle />
                </Row>
                <div style={{ padding:'0.875rem 0', borderBottom:'1px solid var(--border-light)' }}>
                  <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-text-primary)', marginBottom:'0.2rem' }}>Accent Color</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)', marginBottom:'0.75rem' }}>Choose your brand accent color</div>
                  <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap' }}>
                    {ACCENTS.map(a => (
                      <button key={a.value} type="button" onClick={() => setAccent(a.value)} title={a.label}
                        style={{ width:28, height:28, borderRadius:'50%', background:a.value, border:'none', cursor:'pointer', outline: accent === a.value ? `3px solid ${a.value}` : '3px solid transparent', outlineOffset:2, transition:'all 0.15s', boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }} />
                    ))}
                  </div>
                </div>
                <Row label="Compact Mode" desc="Display more information in less space">
                  <Toggle checked={compactMode} onChange={() => setCompactMode(v => !v)} />
                </Row>
                <Row label="Smooth Animations" desc="Page entry and transition animations">
                  <Toggle checked={smoothAnims} onChange={() => setSmoothAnims(v => !v)} />
                </Row>
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <SaveRow saving={appearState.saving} saved={appearState.saved} error={appearState.error} />
                </div>
              </form>
            </div>
          </>
        )}

        {(openSection === 'preferences' || openSection === 'savings' || openSection === 'notifications') && (
          <>
            <div className="settings-card">
              <h2 className="settings-card-title">Preferences</h2>
              <p className="settings-card-desc">Regional and display preferences</p>
              <form onSubmit={handleSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Row label="Date Format" desc="How dates appear throughout the app">
                  <SettingSelect value={dateFormat} onChange={setDateFmt}>
                    <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                  </SettingSelect>
                </Row>
                <Row label="Target Saving Rate" desc="Your personal monthly savings goal">
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    <input type="number" value={savingRate} min={1} max={80} onChange={e => setSavingRate(e.target.value)}
                      style={{ width:60, padding:'0.375rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-card)', color:'var(--color-text-primary)', fontSize:'0.8rem', textAlign:'center', fontFamily:'Space Grotesk,sans-serif', fontWeight:700 }} />
                    <span style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)' }}>% of income</span>
                  </div>
                </Row>
                <Row label="Expected Monthly Income" desc="Optional. Overrides actual income for Safe-to-Spend calculations.">
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    <span style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)' }}>{initialCurrency}</span>
                    <input type="number" value={expectedMonthlyIncome} onChange={e => setExpectedMonthlyIncome(e.target.value)} placeholder="Auto"
                      style={{ width:100, padding:'0.375rem 0.5rem', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-card)', color:'var(--color-text-primary)', fontSize:'0.8rem', textAlign:'right', fontFamily:'Space Grotesk,sans-serif', fontWeight:700 }} />
                  </div>
                </Row>
                <Row label="Week Start Day" desc="First day shown in calendar views">
                  <SettingSelect value={weekStart} onChange={setWeekStart}>
                    <option>Monday</option><option>Sunday</option>
                  </SettingSelect>
                </Row>
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <SaveRow saving={prefsState.saving} saved={prefsState.saved} error={prefsState.error} />
                </div>
              </form>
            </div>
            
            <div className="settings-card mt-6">
              <h2 className="settings-card-title">Save-More-Tomorrow</h2>
              <p className="settings-card-desc">Automate your savings and goals</p>
              <SavingsAutomationSection
                plan={savingsPlan}
                accounts={accounts}
                goals={goals}
                autoSaves={autoSaves}
                currency={currency}
              />
            </div>

            <div className="settings-card mt-6">
              <h2 className="settings-card-title">Notifications</h2>
              <p className="settings-card-desc">Alerts and reminders</p>
              <form onSubmit={handleSaveNotifs} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                  <SaveRow saving={notifState.saving} saved={notifState.saved} error={notifState.error} />
                </div>
                <div style={{ marginTop:'1rem', padding:'0.75rem', background:'var(--bg-app)', borderRadius:8, display:'flex', gap:'0.5rem' }}>
                  <Info size={14} color="var(--color-text-secondary)" style={{ flexShrink:0, marginTop:1 }} />
                  <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>Notifications are in-app only. Email and push notifications coming soon.</p>
                </div>
              </form>
            </div>
          </>
        )}

        {openSection === 'security' && (
          <>
            <div className="settings-card">
              <h2 className="settings-card-title">Security & Activity</h2>
              <p className="settings-card-desc">Recent security events and account actions.</p>
              {logs.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>No activity logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {logs.map(log => {
                    const date = new Date(log.createdAt);
                    
                    const rawAction = log.action.split('_')[0].toUpperCase();
                    const actionVerbs: Record<string, string> = {
                      CREATE: 'added', UPDATE: 'updated', DELETE: 'deleted', IMPORT: 'imported'
                    };
                    const verb = actionVerbs[rawAction] || 'modified';
                    const resourceNoun = (log.resource || 'item').toLowerCase();
                    
                    let details = '';
                    if (log.metadata) {
                      try {
                        const meta = JSON.parse(log.metadata);
                        const parts = [];
                        if (meta.name) parts.push(`"${meta.name}"`);
                        const minorAmt = meta.amountMinor ?? meta.baseAmountMinor;
                        if (minorAmt !== undefined) parts.push(`for ${fmtAdaptive(toMajor(minorAmt), initialCurrency || 'KES')}`);
                        if (parts.length > 0) details = parts.join(' ');
                        else {
                          const keys = Object.keys(meta).filter(k => !k.includes('Id'));
                          if (keys.length > 0) details = `(Fields: ${keys.join(', ')})`;
                        }
                      } catch {
                        details = log.metadata.startsWith('{') ? '' : log.metadata;
                      }
                    }

                    return (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                              You {verb} a {resourceNoun}
                            </span>
                          </div>
                          {details && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {details}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          <div style={{ fontSize: '0.7rem' }}>{date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {(openSection === 'data' || openSection === 'help') && (
          <>
            <div className="settings-card">
              <h2 className="settings-card-title">Data & Privacy</h2>
              <p className="settings-card-desc">Manage your data exports and imports</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', background:'var(--bg-app)', borderRadius:8, gap:'0.75rem' }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-text-primary)' }}>Export All Data</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)' }}>Download all your financial data as JSON</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={dataState.saving}
                    className="btn btn-outline"
                    style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', flexShrink:0 }}
                  >
                    {dataState.saving ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Download size={12}/>}
                    Export
                  </button>
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', background:'var(--bg-app)', borderRadius:8, gap:'0.75rem' }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-text-primary)' }}>Import Bank Statement</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)' }}>Upload M-Pesa or bank CSV/Excel/PDF</div>
                  </div>
                  <a href="/transactions" className="btn btn-outline" style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', flexShrink:0, textDecoration:'none' }}>
                    <Database size={12}/> Go
                  </a>
                </div>
              </div>

              <div style={{ padding:'1.5rem', background:'var(--color-expense)', color: 'white', borderRadius:8, border:'1px solid rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize:'0.9rem', fontWeight:700, color:'white', marginBottom:'0.35rem' }}>Danger Zone</div>
                <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.9)', marginBottom:'0.875rem' }}>
                  Deleting your data is permanent and cannot be undone. Please export your data first.
                </div>
                {deleteConfirm ? (
                  <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.78rem', color:'var(--color-expense)', fontWeight:600 }}>Type "DELETE" to confirm:</span>
                    <input
                      type="text"
                      value={deleteAllText}
                      onChange={(e) => setDeleteAllText(e.target.value)}
                      placeholder="DELETE"
                      style={{ width: 80, padding: '0.375rem 0.5rem', borderRadius: 6, border: '1px solid white', background: 'transparent', color: 'white', fontSize: '0.8rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}
                    />
                    <button
                      type="button"
                      onClick={handleDeleteAll}
                      disabled={dataState.saving || deleteAllText !== 'DELETE'}
                      className="btn"
                      style={{ background:'white', color:'var(--color-expense)', display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem', opacity: deleteAllText === 'DELETE' ? 1 : 0.5 }}
                    >
                      {dataState.saving ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                      Yes, Delete Everything
                    </button>
                    <button type="button" onClick={() => { setDeleteConfirm(false); setDeleteAllText(''); }} className="btn btn-outline" style={{ fontSize:'0.78rem', color: 'white', borderColor: 'white', background: 'transparent' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(true)}
                    className="btn"
                    style={{ background:'white', color:'var(--color-expense)', display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem' }}
                  >
                    <Trash2 size={12}/> Delete All Data
                  </button>
                )}

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize:'0.9rem', fontWeight:700, color:'white', marginBottom:'0.35rem' }}>Delete Account</div>
                  <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.9)', marginBottom:'0.875rem' }}>
                    Permanently delete your account and all associated data. This action is irreversible.
                  </div>
                  {deleteAcctConfirm ? (
                    <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.78rem', color:'white', fontWeight:600 }}>Type "DELETE" to confirm:</span>
                      <input
                        type="text"
                        value={deleteAcctText}
                        onChange={(e) => setDeleteAcctText(e.target.value)}
                        placeholder="DELETE"
                        style={{ width: 80, padding: '0.375rem 0.5rem', borderRadius: 6, border: '1px solid white', background: 'transparent', color: 'white', fontSize: '0.8rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' }}
                      />
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={dataState.saving || deleteAcctText !== 'DELETE'}
                        className="btn"
                        style={{ background:'white', color:'var(--color-expense)', display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem', opacity: deleteAcctText === 'DELETE' ? 1 : 0.5 }}
                      >
                        {dataState.saving ? <Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={12}/>}
                        Yes, Delete My Account
                      </button>
                      <button type="button" onClick={() => { setDeleteAcctConfirm(false); setDeleteAcctText(''); }} className="btn btn-outline" style={{ fontSize:'0.78rem', color: 'white', borderColor: 'white', background: 'transparent' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteAcctConfirm(true)}
                      className="btn"
                      style={{ background:'white', color:'var(--color-expense)', display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.78rem' }}
                    >
                      <Trash2 size={12}/> Delete Account
                    </button>
                  )}
                </div>

                {dataState.error && (
                  <div style={{ marginTop:'0.5rem', fontSize:'0.78rem', color:'white' }}>{dataState.error}</div>
                )}
              </div>
            </div>
            <div className="settings-card mt-6">
              <h2 className="settings-card-title">Help & About</h2>
              <p className="settings-card-desc">Information and resources</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem', marginBottom:'1.25rem' }}>
                {[
                  { title:'Privacy Policy', desc:'How we handle your data', href: '/privacy' },
                  { title:'Terms of Service', desc:'Rules and agreements', href: '/tos' },
                  { title:'Contact Support', desc:'Email our support team', href: 'mailto:support@ledger360.com' },
                ].map(h => (
                  <a href={h.href} key={h.title} style={{ textDecoration: 'none', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0.875rem', background:'var(--bg-app)', borderRadius:7, cursor:'pointer', gap:'0.5rem' }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--color-text-primary)' }}>{h.title}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--color-text-secondary)', marginTop:'0.1rem' }}>{h.desc}</div>
                    </div>
                    <ExternalLink size={13} color="var(--color-text-secondary)" style={{ flexShrink:0 }} />
                  </a>
                ))}
              </div>
              <div style={{ padding:'0.875rem 1rem', background:'var(--bg-app)', borderRadius:8 }}>
                {[
                  { label:'App Version', val:'Ledger360 v1.0.0' },
                  { label:'Stack', val:'Next.js 16 · Prisma 7 · Neon' },
                ].map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.375rem' }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--color-text-secondary)' }}>{r.label}</span>
                    <span style={{ fontSize:'0.72rem', fontWeight:600, fontFamily:'Space Grotesk,sans-serif', color:'var(--color-text-primary)' }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
"""

start_str = "  return ("
end_str = "}"

start_idx = content.find("  return (")
# Find the start index for SettingsClient's return statement, which is the LAST one in the file because it's the main component.
start_idx = content.rfind("  return (")

end_idx = content.rfind("}")

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_body + "\n"

# Let's remove AccordionHeader and AccordionPanel if they exist
content = re.sub(r'function AccordionHeader.*?return.*?\}\s*\}\s*', '', content, flags=re.DOTALL)
content = re.sub(r'function AccordionPanel.*?return.*?\}\s*', '', content, flags=re.DOTALL)

with open('src/app/settings/SettingsClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
