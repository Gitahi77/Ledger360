import { apiRoute } from '@/lib/api/respond';
import { getTransfers, createTransfer } from '@/lib/actions/transfers';
import { AddTransferSchema } from '@/lib/validation';
import { z } from 'zod';

const GetTransfersQuerySchema = z.object({
  period: z.enum(['this-month', 'last-30-days', 'all-time']).optional(),
});

export const GET = apiRoute(
  null,
  async (req) => {
    const url = new URL(req.url);
    const query = GetTransfersQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    
    const period = query.success && query.data.period ? query.data.period : undefined;
    
    return getTransfers(period);
  }
);

export const POST = apiRoute(
  AddTransferSchema,
  async (req, { body }) => {
    await createTransfer(body);
    return { success: true };
  }
);
