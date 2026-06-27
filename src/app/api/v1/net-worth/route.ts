import { apiRoute } from '@/lib/api/respond';
import { getNetWorth } from '@/lib/queries/networth';

export const GET = apiRoute(
  null,
  async () => {
    return getNetWorth();
  }
);
