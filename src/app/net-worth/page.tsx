// src/app/net-worth/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getNetWorth, getNetWorthHistory } from '@/lib/actions/networth';
import { NetWorthClient } from './NetWorthClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function NetWorthPage() {
  const [data, history, user] = await Promise.all([
    getNetWorth(),
    getNetWorthHistory(365), // Fetch 1 year of history
    requireAuth(),
  ]);

  return (
    <AppLayout>
      <NetWorthClient
        assets={data.assets}
        liabilities={data.liabilities}
        totalAssetsMinor={data.totalAssetsMinor}
        totalLiabilitiesMinor={data.totalLiabilitiesMinor}
        netWorthMinor={data.netWorthMinor}
        debtRatio={data.debtRatio}
        history={history}
        currency={user.currency}
      />
    </AppLayout>
  );
}
