// src/app/settings/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getUserProfile } from '@/lib/actions/reports';
import { SettingsClient } from './SettingsClient';

export default async function Settings() {
  const profile = await getUserProfile();
  return (
    <AppLayout>
      <SettingsClient
        initialName={profile?.name    ?? ''}
        initialEmail={profile?.email  ?? ''}
        initialCurrency={profile?.currency    ?? 'KES'}
        initialAccountType={profile?.accountType ?? 'individual'}
      />
    </AppLayout>
  );
}
