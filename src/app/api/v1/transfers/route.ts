import { apiRoute } from '@/lib/api/respond';
import { createTransfer } from '@/lib/actions/transfers';
import { getTransfers } from '@/lib/queries/transfers';
import { AddTransferSchema } from '@/lib/validation';
import { z } from 'zod';

const GetTransfersQuerySchema = z.object({
  period: z.enum(['this-month', 'last-30-days', 'all-time']).optional(),
});

export const GET = apiRoute(
  null,
  async (req, { userId }) => {
    const url = new URL(req.url);
    const query = GetTransfersQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    
    if (!query.success) {
      const { NextResponse } = await import('next/server');
      return NextResponse.json({ error: 'Invalid query parameters', details: query.error.flatten() }, { status: 400 });
    }
    
    const period = query.data.period;
    
    return getTransfers({ userId, period });
  }
);

export const POST = apiRoute(
  AddTransferSchema,
  async (req, { body }) => {
    await createTransfer({ payload: body });
    return { success: true };
  }
);
