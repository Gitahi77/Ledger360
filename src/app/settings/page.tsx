// src/app/settings/page.tsx — Server Component
// Loads both profile and saved preferences from DB before rendering the client.
import { AppLayout } from '@/components/layout/AppLayout';
import { getUserProfile } from '@/lib/actions/reports';
import { getUserPreferences } from '@/lib/actions/settings';
import { requireAuth } from '@/lib/actions/_auth';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';
import { getSavingsPlan, getRecentAutoSaves } from '@/lib/actions/savings';
import { getAccounts } from '@/lib/actions/accounts';

export const metadata = {
  title: 'Settings — Ledger360',
  description: 'Manage your profile, preferences, notifications and data.',
};

export default async function Settings() {
  const user = await requireAuth();
  
  const [profile, prefs, logs, savingsPlan, autoSaves, accounts, goals] = await Promise.all([
    getUserProfile(),
    getUserPreferences(),
    prisma.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    getSavingsPlan(),
    getRecentAutoSaves(),
    getAccounts(),
    prisma.goal.findMany({ where: { userId: user.id }, select: { id: true, name: true } }),
  ]);

  return (
    <AppLayout>
      <SettingsClient
        initialName={profile?.name         ?? ''}
        initialEmail={profile?.email        ?? ''}
        initialCurrency={profile?.currency  ?? 'KES'}
        initialAccountType={profile?.accountType ?? 'individual'}
        initialPrefs={prefs ? {
          accentColor:    prefs.accentColor,
          compactMode:    prefs.compactMode,
          smoothAnims:    prefs.smoothAnims,
          dateFormat:     prefs.dateFormat,
          weekStartDay:   prefs.weekStartDay,
          savingRate:     prefs.savingRate,
          notifOverbudget: prefs.notifOverbudget,
          notifGoals:      prefs.notifGoals,
          notifBills:      prefs.notifBills,
          notifInsights:   prefs.notifInsights,
          notifLoanDue:    prefs.notifLoanDue,
          expectedMonthlyIncomeMinor: prefs.expectedMonthlyIncomeMinor,
        } : null}
        logs={logs.map(l => ({
          id: l.id,
          action: l.action,
          resource: l.resource,
          metadata: l.metadata,
          createdAt: l.createdAt.toISOString()
        }))}
        savingsPlan={savingsPlan}
        autoSaves={autoSaves.map(s => ({
          ...s,
          date: s.date.toISOString(),
        }))}
        accounts={accounts.map(a => ({ id: a.id, name: a.name, type: a.type, currency: a.currency }))}
        goals={goals}
      />
    </AppLayout>
  );
}
