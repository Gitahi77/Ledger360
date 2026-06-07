import { apiRoute } from '@/lib/api/respond';
import { getNetWorth } from '@/lib/actions/networth';

export const GET = apiRoute(
  null,
  async () => {
    return getNetWorth();
  }
);
