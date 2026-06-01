// src/app/settings/page.tsx — Server Component
// Loads both profile and saved preferences from DB before rendering the client.
import { AppLayout } from '@/components/layout/AppLayout';
import { getUserProfile } from '@/lib/actions/reports';
import { getUserPreferences } from '@/lib/actions/settings';
import { SettingsClient } from './SettingsClient';

export const metadata = {
  title: 'Settings — Ledger360',
  description: 'Manage your profile, preferences, notifications and data.',
};

export default async function Settings() {
  const [profile, prefs] = await Promise.all([
    getUserProfile(),
    getUserPreferences(),
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
      />
    </AppLayout>
  );
}
