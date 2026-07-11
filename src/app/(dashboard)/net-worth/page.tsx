export const dynamic = 'force-dynamic';
// src/app/net-worth/page.tsx — Live Server Component

import { getNetWorth, getNetWorthHistory } from '@/lib/queries/networth';
import { NetWorthClient } from './NetWorthClient';
import { requireAuth } from '@/lib/actions/_auth';

export default async function NetWorthPage() {
  const user = await requireAuth();
  const [data, history] = await Promise.all([
    getNetWorth(),
    getNetWorthHistory(365), // Fetch 1 year of history
  ]);

  return (
    <>
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
    </>
  );
}

