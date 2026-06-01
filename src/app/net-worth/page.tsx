// src/app/net-worth/page.tsx — Live Server Component
import { AppLayout } from '@/components/layout/AppLayout';
import { getNetWorth } from '@/lib/actions/networth';
import { NetWorthClient } from './NetWorthClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function NetWorthPage() {
  const [data, user] = await Promise.all([
    getNetWorth(),
    requireAuth(),
  ]);

  return (
    <AppLayout>
      <NetWorthClient
        assets={data.assets}
        liabilities={data.liabilities}
        totalAssets={data.totalAssets}
        totalLiabilities={data.totalLiabilities}
        netWorth={data.netWorth}
        debtRatio={data.debtRatio}
        currency={user.currency}
      />
    </AppLayout>
  );
}
