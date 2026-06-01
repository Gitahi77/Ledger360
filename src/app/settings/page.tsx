// src/app/settings/page.tsx — Server Component
// Loads both profile and saved preferences from DB before rendering the client.
import { AppLayout } from '@/components/layout/AppLayout';
import { getUserProfile } from '@/lib/actions/reports';
import { getUserPreferences } from '@/lib/actions/settings';
import { requireAuth } from '@/lib/actions/_auth';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';

export const metadata = {
  title: 'Settings — Ledger360',
  description: 'Manage your profile, preferences, notifications and data.',
};

export default async function Settings() {
  const user = await requireAuth();
  
  const [profile, prefs, logs] = await Promise.all([
    getUserProfile(),
    getUserPreferences(),
    prisma.auditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
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
        } : null}
        logs={logs.map(l => ({
          id: l.id,
          action: l.action,
          resource: l.resource,
          metadata: l.metadata,
          createdAt: l.createdAt.toISOString()
        }))}
      />
    </AppLayout>
  );
}
