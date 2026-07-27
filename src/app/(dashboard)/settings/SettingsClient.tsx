'use client';
// src/app/settings/SettingsClient.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
// Fully wired: every toggle/field saves to the database via server actions.
import { useState, useTransition } from 'react';
import { getErrorMessage } from '@/lib/format';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useSession } from 'next-auth/react';
import { updateProfile } from '@/lib/actions/reports';
import {
  saveAppearance, savePreferences, saveNotifications,
  exportUserData, deleteAllUserData, deleteUserAccount,
} from '@/lib/actions/settings';
import { signOut } from 'next-auth/react';
import { toMajor, toMinor } from '@/lib/money';
import { fmtAdaptive } from '@/lib/format';
import {
  User, ShieldCheck, Database,
  Download, Trash2, ExternalLink, Info,
  Globe, CheckCircle2, Loader2,
  AlertTriangle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SavingsAutomationSection } from './SavingsAutomationSection';

import { Button } from '@/components/ui/button/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card/Card';
import { Input } from '@/components/ui/input/Input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';


type Section = 'profile' | 'appearance' | 'preferences' | 'savings' | 'notifications' | 'security' | 'data' | 'help';



const ACCENTS = [
  { label: 'Royal Blue', value: '#1A73E8' },
  { label: 'Emerald',    value: '#1E8449' },
  { label: 'Teal',       value: '#0E6655' },
  { label: 'Purple',     value: '#6C3483' },
  { label: 'Rose',       value: '#C0392B' },
  { label: 'Amber',      value: '#D35400' },
];

/* -- Shared sub-components ---------------------------------- */
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 border-b border-border">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {desc && <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full max-w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer">
      {children}
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SaveRow({ saving, saved, error }: { saving: boolean; saved: boolean; error: string }) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <Button type="submit" disabled={saving} loading={saving}>
        Save Changes
      </Button>
      {saved && (
        <div className="animate-in fade-in flex items-center gap-1.5 text-sm font-semibold text-success">
          <CheckCircle2 size={14} /> Saved!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
    </div>
  );
}



type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/* -- Main Settings Client ----------------------------------- */
export function SettingsClient({
  initialName, initialEmail, initialCurrency, initialAccountType,
  initialPrefs, logs, savingsPlan, autoSaves, accounts, goals,
}: {
  initialName: string; initialEmail: string; initialCurrency: string; initialAccountType: string;
  initialPrefs: {
    accentColor: string; compactMode: boolean; smoothAnims: boolean;
    dateFormat: string; weekStartDay: string; savingRate: number;
    notifOverbudget: boolean; notifGoals: boolean; notifBills: boolean;
    notifInsights: boolean; notifLoanDue: boolean;
    expectedMonthlyIncomeMinor: number | null;
  } | null;
  logs: { id: string; action: string; resource: string; metadata: Json; createdAt: string }[];
  savingsPlan: Awaited<ReturnType<typeof import('@/lib/queries/savings').getSavingsPlan>>;
  autoSaves: Awaited<ReturnType<typeof import('@/lib/queries/savings').getRecentAutoSaves>>;
  accounts: { id: string; name: string; type: string; currency: string }[];
  goals: { id: string; name: string }[];
}) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const [, startT]   = useTransition();

  const currentTab = searchParams?.get('tab') || 'profile';

  function handleTabChange(value: string) {
    router.replace(`?tab=${value}`, { scroll: false });
  }

  // Per-section save state
  const [profileState, setProfileState] = useState({ saving: false, saved: false, error: '' });
  const [appearState,  setAppearState]  = useState({ saving: false, saved: false, error: '' });
  const [prefsState,   setPrefsState]   = useState({ saving: false, saved: false, error: '' });
  const [notifState,   setNotifState]   = useState({ saving: false, saved: false, error: '' });
  const [dataState,    setDataState]    = useState({ saving: false, saved: false, error: '' });

  // Profile fields
  const [name,        setName]        = useState(initialName);
  const [currency]    = useState(initialCurrency);
  const [accountType, setAccountType] = useState(initialAccountType);

  // Appearance fields (from DB prefs or defaults)
  const [accent,       setAccent]      = useState(initialPrefs?.accentColor  ?? 'rgb(26, 115, 232)');
  const [compactMode,  setCompactMode] = useState(initialPrefs?.compactMode  ?? false);
  const [smoothAnims,  setSmoothAnims] = useState(initialPrefs?.smoothAnims  ?? true);

  // Preferences fields
  const [dateFormat,  setDateFmt]    = useState(initialPrefs?.dateFormat    ?? 'DD/MM/YYYY');
  const [savingRate,  setSavingRate] = useState(String(initialPrefs?.savingRate ?? 30));
  const [weekStart,   setWeekStart]  = useState(initialPrefs?.weekStartDay  ?? 'Monday');
  const [expectedMonthlyIncome, setExpectedMonthlyIncome] = useState(initialPrefs?.expectedMonthlyIncomeMinor != null ? String(toMajor(initialPrefs.expectedMonthlyIncomeMinor)) : '');

  // Notification flags
  const [notifs, setNotifs] = useState({
    overbudget: initialPrefs?.notifOverbudget ?? true,
    goals:      initialPrefs?.notifGoals      ?? true,
    bills:      initialPrefs?.notifBills      ?? true,
    insights:   initialPrefs?.notifInsights   ?? false,
    loanDue:    initialPrefs?.notifLoanDue    ?? true,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState('');
  const [deleteAcctConfirm, setDeleteAcctConfirm] = useState(false);
  const [deleteAcctText, setDeleteAcctText] = useState('');



  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';



  async function withSave(
    setter: React.Dispatch<React.SetStateAction<{ saving: boolean; saved: boolean; error: string }>>,
    fn: () => Promise<void>
  ) {
    setter({ saving: true, saved: false, error: '' });
    try {
      await fn();
      setter({ saving: false, saved: true, error: '' });
      setTimeout(() => setter({ saving: false, saved: false, error: '' }), 3000);
    } catch (err: unknown) {
      setter({ saving: false, saved: false, error: getErrorMessage(err) });
    }
  }

  // -- Save handlers --------------------------------------------
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    await withSave(setProfileState, async () => {
      await updateProfile({ name, currency, accountType });
      // Refresh the JWT token so currency/accountType changes propagate immediately
      await updateSession({ currency, accountType, name });
      startT(() => router.refresh());
    });
  }

  async function handleSaveAppearance(e: React.FormEvent) {
    e.preventDefault();
    await withSave(setAppearState, async () => {
      await saveAppearance({ accentColor: accent, compactMode, smoothAnims });
      // Apply accent immediately via CSS variable
      document.documentElement.style.setProperty('--color-brand', accent);
    });
  }

  async function handleSavePrefs(e: React.FormEvent) {
    e.preventDefault();
    await withSave(setPrefsState, async () => {
      await savePreferences({
        dateFormat:  dateFormat  as 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD',
        weekStartDay: weekStart  as 'Monday' | 'Sunday',
        savingRate: Math.min(80, Math.max(1, parseInt(savingRate) || 30)),
        expectedMonthlyIncomeMinor: expectedMonthlyIncome ? toMinor(parseFloat(expectedMonthlyIncome)) : null,
      });
      startT(() => router.refresh());
    });
  }

  async function handleSaveNotifs(e: React.FormEvent) {
    e.preventDefault();
    await withSave(setNotifState, async () => {
      await saveNotifications({
        overbudget: notifs.overbudget,
        goals:      notifs.goals,
        bills:      notifs.bills,
        insights:   notifs.insights,
        loanDue:    notifs.loanDue,
      });
    });
  }

  async function handleExportData() {
    await withSave(setDataState, async () => {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ledger360-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function handleDeleteAll() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    await withSave(setDataState, async () => {
      await deleteAllUserData();
      setDeleteConfirm(false);
      startT(() => router.refresh());
    });
  }

  async function handleDeleteAccount() {
    setDataState({ saving: true, saved: false, error: '' });
    try {
      await deleteUserAccount();
      signOut({ callbackUrl: '/login' });
    } catch (e: unknown) {
      setDataState({ saving: false, saved: false, error: getErrorMessage(e) || 'Failed to delete account.' });
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 h-auto p-1.5 gap-1">
          <TabsTrigger value="profile" className="py-2 data-[state=active]:bg-background/80 shadow-none"><User size={16} className="mr-2"/> Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="py-2 data-[state=active]:bg-background/80 shadow-none"><Globe size={16} className="mr-2"/> Preferences</TabsTrigger>
          <TabsTrigger value="security" className="py-2 data-[state=active]:bg-background/80 shadow-none"><ShieldCheck size={16} className="mr-2"/> Security</TabsTrigger>
          <TabsTrigger value="data" className="py-2 data-[state=active]:bg-background/80 shadow-none"><Database size={16} className="mr-2"/> Data & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3.5 p-3.5 bg-muted/30 rounded-lg mb-5 border border-border">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-heading font-bold text-lg shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground truncate">{name || '—'}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{initialEmail} · {accountType}</div>
                  </div>
                </div>
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                  <Field label="Full Name">
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" autoComplete="name" />
                  </Field>
                  <Field label="Email Address">
                    <Input type="email" value={initialEmail} disabled title="Email cannot be changed" autoComplete="email" className="opacity-70 cursor-not-allowed" />
                  </Field>
                  <Field label="Account Type">
                    <select className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer" value={accountType} onChange={e => setAccountType(e.target.value)}>
                      <option value="individual">Individual</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="small_business">Small Business</option>
                    </select>
                  </Field>
                  <Field label="Currency">
                    <Input type="text" value="KES" disabled title="Base currency is locked to KES for now" className="opacity-70 cursor-not-allowed" />
                  </Field>
                  <div className="pt-4 border-t border-border">
                    <SaveRow {...profileState} />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how Ledger360 looks</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveAppearance} className="flex flex-col gap-2">
                  <Row label="Theme" desc="Toggle between light and dark mode">
                    <ThemeToggle />
                  </Row>
                  <div className="py-3.5 border-b border-border">
                    <div className="text-sm font-semibold text-foreground mb-1">Accent Color</div>
                    <div className="text-xs text-muted-foreground mb-3">Choose your brand accent color</div>
                    <div className="flex gap-2.5 flex-wrap">
                      {ACCENTS.map(a => (
                        <button key={a.value} type="button" onClick={() => setAccent(a.value)} title={a.label}
                          className={`w-7 h-7 rounded-full border-none cursor-pointer outline-[3px] outline-offset-2 transition-all shadow-md ${accent === a.value ? 'outline' : 'outline-transparent'}`}
                          style={{ background: a.value, outlineColor: accent === a.value ? a.value : 'transparent' }} />
                      ))}
                    </div>
                  </div>
                  <Row label="Compact Mode" desc="Display more information in less space">
                    <Switch checked={compactMode} onCheckedChange={() => setCompactMode(v => !v)} />
                  </Row>
                  <Row label="Smooth Animations" desc="Page entry and transition animations">
                    <Switch checked={smoothAnims} onCheckedChange={() => setSmoothAnims(v => !v)} />
                  </Row>
                  <div className="pt-4 border-t border-border">
                    <SaveRow {...appearState} />
                  </div>
                </form>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Regional and display preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePrefs} className="flex flex-col gap-2">
                  <Row label="Date Format" desc="How dates appear throughout the app">
                    <SettingSelect value={dateFormat} onChange={setDateFmt}>
                      <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                    </SettingSelect>
                  </Row>
                  <Row label="Target Saving Rate" desc="Your personal monthly savings goal">
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Input type="number" value={savingRate} min={1} max={80} onChange={e => setSavingRate(e.target.value)} className="text-center font-heading font-bold" />
                      </div>
                      <span className="text-xs text-muted-foreground">% of income</span>
                    </div>
                  </Row>
                  <Row label="Expected Monthly Income" desc="Optional. Overrides actual income for Safe-to-Spend calculations.">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{initialCurrency}</span>
                      <div className="w-32">
                        <Input type="number" value={expectedMonthlyIncome} onChange={e => setExpectedMonthlyIncome(e.target.value)} placeholder="Auto" className="text-right font-heading font-bold" />
                      </div>
                    </div>
                  </Row>
                  <Row label="Week Start Day" desc="First day shown in calendar views">
                    <SettingSelect value={weekStart} onChange={setWeekStart}>
                      <option>Monday</option><option>Sunday</option>
                    </SettingSelect>
                  </Row>
                  <div className="pt-4 border-t border-border">
                    <SaveRow {...prefsState} />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Save-More-Tomorrow</CardTitle>
                <CardDescription>Automate your savings and goals</CardDescription>
              </CardHeader>
              <CardContent>
                <SavingsAutomationSection
                  plan={savingsPlan}
                  accounts={accounts}
                  goals={goals}
                  autoSaves={autoSaves}
                  currency={currency}
                />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Alerts and reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveNotifs} className="flex flex-col gap-2">
                  <Row label="Overbudget Alerts" desc="Notify when spending exceeds its limit">
                    <Switch checked={notifs.overbudget} onCheckedChange={() => setNotifs(n => ({ ...n, overbudget: !n.overbudget }))} />
                  </Row>
                  <Row label="Goal Progress Updates" desc="Weekly updates on savings milestones">
                    <Switch checked={notifs.goals} onCheckedChange={() => setNotifs(n => ({ ...n, goals: !n.goals }))} />
                  </Row>
                  <Row label="Upcoming Loan Payments" desc="3-day reminder before each due date">
                    <Switch checked={notifs.loanDue} onCheckedChange={() => setNotifs(n => ({ ...n, loanDue: !n.loanDue }))} />
                  </Row>
                  <Row label="Upcoming Bills" desc="Remind me when regular bills are due">
                    <Switch checked={notifs.bills} onCheckedChange={() => setNotifs(n => ({ ...n, bills: !n.bills }))} />
                  </Row>
                  <Row label="Monthly Financial Summary" desc="End-of-month report on income and spending">
                    <Switch checked={notifs.insights} onCheckedChange={() => setNotifs(n => ({ ...n, insights: !n.insights }))} />
                  </Row>
                  <div className="pt-4 border-t border-border">
                    <SaveRow {...notifState} />
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Notifications are in-app only. Email and push notifications coming soon.</p>
                  </div>
                </form>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card>
            <CardHeader>
              <CardTitle>Security & Activity</CardTitle>
              <CardDescription>Recent security events and account actions.</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activity logged yet.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
                  {logs.map(log => {
                    const date = new Date(log.createdAt);
                    const rawAction = log.action.split('_')[0].toUpperCase();
                    const actionVerbs: Record<string, string> = { CREATE: 'added', UPDATE: 'updated', DELETE: 'deleted', IMPORT: 'imported' };
                    const verb = actionVerbs[rawAction] || 'modified';
                    const resourceNoun = (log.resource || 'item').toLowerCase();
                    
                    let details = '';
                    if (log.metadata) {
                      try {
                        const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
                        if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
                          const parts = [];
                          if (meta.name) parts.push(`"${meta.name}"`);
                          const minorAmt = meta.amountMinor ?? meta.baseAmountMinor;
                          if (minorAmt !== undefined) parts.push(`for ${fmtAdaptive(toMajor(minorAmt), initialCurrency || 'KES')}`);
                          
                          if (parts.length > 0) details = parts.join(' ');
                          else {
                            const keys = Object.keys(meta).filter(k => !k.includes('Id'));
                            if (keys.length > 0) details = `(Fields: ${keys.join(', ')})`;
                          }
                        }
                      } catch {
                        details = typeof log.metadata === 'string' && !log.metadata.startsWith('{') ? log.metadata : '';
                      }
                    }

                    return (
                      <div key={log.id} className="flex justify-between items-center p-3.5 bg-muted/30 rounded-lg border border-border">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground text-sm">
                              You {verb} a {resourceNoun}
                            </span>
                          </div>
                          {details && (
                            <div className="text-xs text-muted-foreground truncate">
                              {details}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          <div className="text-[11px] mt-0.5">{date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage your data exports and imports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2.5 mb-5">
                  <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-lg gap-3 border border-border">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground">Export All Data</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Download all your financial data as JSON</div>
                    </div>
                    <Button variant="secondary" onClick={handleExportData} disabled={dataState.saving} loading={dataState.saving} iconLeft={!dataState.saving && <Download size={14} />}>
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-lg gap-3 border border-border">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground">Import Bank Statement</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Upload M-Pesa or bank CSV/Excel/PDF</div>
                    </div>
                    <a href="/transactions" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2 text-foreground no-underline">
                      <Database size={14} /> Go
                    </a>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full mt-8 border border-destructive/20 rounded-xl overflow-hidden bg-destructive/5">
                  <AccordionItem value="danger-zone" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4 hover:bg-destructive/10 text-destructive hover:no-underline">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={18} />
                        <span className="font-bold tracking-tight text-base">Danger Zone</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        Deleting your data is permanent and cannot be undone. Please export your data first.
                      </div>
                      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="danger"
                            iconLeft={<Trash2 size={14}/>}
                          >
                            Delete All Data
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This will delete all your financial data, including transactions, budgets, and goals. 
                              This action cannot be undone. Please type "DELETE" to confirm.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col gap-4 py-4">
                            <Input
                              type="text"
                              value={deleteAllText}
                              onChange={(e) => setDeleteAllText(e.target.value)}
                              placeholder="DELETE"
                              className="font-bold uppercase text-sm"
                            />
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="secondary" type="button" onClick={() => setDeleteAllText('')}>Cancel</Button>
                            </DialogClose>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={handleDeleteAll}
                              disabled={dataState.saving || deleteAllText !== 'DELETE'}
                              loading={dataState.saving}
                              iconLeft={!dataState.saving && <Trash2 size={14}/>}
                            >
                              Yes, Delete Everything
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <div className="mt-10 pt-6 border-t border-destructive/20">
                        <div className="text-sm font-bold text-foreground mb-1">Delete Account</div>
                        <div className="text-sm text-muted-foreground mb-5 leading-relaxed">
                          Permanently delete your account and all associated data. This action is irreversible.
                        </div>
                        <Dialog open={deleteAcctConfirm} onOpenChange={setDeleteAcctConfirm}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              iconLeft={<Trash2 size={14}/>}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              Delete Account
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you absolutely sure?</DialogTitle>
                              <DialogDescription>
                                This will permanently delete your account and all associated data. 
                                This action is irreversible. Please type "DELETE" to confirm.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                              <Input
                                type="text"
                                value={deleteAcctText}
                                onChange={(e) => setDeleteAcctText(e.target.value)}
                                placeholder="DELETE"
                                className="font-bold uppercase text-sm"
                              />
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="secondary" type="button" onClick={() => setDeleteAcctText('')}>Cancel</Button>
                              </DialogClose>
                              <Button
                                type="button"
                                variant="danger"
                                onClick={handleDeleteAccount}
                                disabled={dataState.saving || deleteAcctText !== 'DELETE'}
                                loading={dataState.saving}
                                iconLeft={!dataState.saving && <Trash2 size={14}/>}
                              >
                                Yes, Delete My Account
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {dataState.error && (
                        <div className="mt-4 text-sm font-semibold text-destructive">{dataState.error}</div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Help & About</CardTitle>
                <CardDescription>Information and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1.5 mb-5">
                  {[
                    { title:'Privacy Policy', desc:'How we handle your data', href: '/privacy' },
                    { title:'Terms of Service', desc:'Rules and agreements', href: '/tos' },
                    { title:'Contact Support', desc:'Email our support team', href: 'mailto:support@ledger360.com' },
                  ].map(h => (
                    <a href={h.href} key={h.title} className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors no-underline text-foreground border border-transparent hover:border-border gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{h.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{h.desc}</div>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
                <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border">
                  {[
                    { label:'App Version', val:'Ledger360 v1.0.0' },
                    { label:'Stack', val:'Next.js 16 · Prisma 7 · Neon' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center mb-1.5 last:mb-0">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <span className="text-xs font-semibold font-mono text-foreground">{r.val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

